import { AuthenticationError, UserInputError } from 'apollo-server-express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
import { validateRegistration, validateLogin } from '../utils/validators.js';

const MESSAGE_ADDED = 'MESSAGE_ADDED';
const TYPING_STATUS = 'TYPING_STATUS';

const resolvers = {
  Query: {
    me: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await User.findById(user.id);
    },

    getChatRooms: async (_, __, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return await ChatRoom.find({
        participants: user.id
      })
      .populate('participants')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });
    },

    getChatRoom: async (_, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      const chatRoom = await ChatRoom.findById(id)
        .populate('participants')
        .populate({
          path: 'messages',
          populate: { path: 'sender' }
        });
      
      if (!chatRoom) throw new UserInputError('Chat room not found');
      return chatRoom;
    },

    getMessages: async (_, { chatRoomId, limit = 20, offset = 0 }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      // Verify user is a participant in the chat room
      const chatRoom = await ChatRoom.findOne({
        _id: chatRoomId,
        participants: user.id
      });
      
      if (!chatRoom) {
        throw new UserInputError('Chat room not found or access denied');
      }

      const messages = await Message.find({ chatRoom: chatRoomId })
        .sort({ sentAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('sender')
        .populate('readBy');

      return messages;
    },

    searchUsers: async (_, { searchTerm }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      return await User.find({
        $or: [
          { username: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      });
    }
  },

  Mutation: {
    register: async (_, args) => {
      // Validate input
      const { valid, errors } = validateRegistration(args);
      if (!valid) throw new UserInputError('Invalid input', { errors });

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email: args.email }, { username: args.username }]
      });
      if (existingUser) {
        throw new UserInputError('Username or email already taken');
      }

      // Hash password and create user
      const hashedPassword = await bcrypt.hash(args.password, 12);
      const user = new User({
        ...args,
        password: hashedPassword
      });
      const result = await user.save();

      // Generate token
      const token = jwt.sign(
        { id: result.id, email: result.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return {
        token,
        user: result
      };
    },

    login: async (_, { email, password }) => {
      const { valid, errors } = validateLogin({ email, password });
      if (!valid) throw new UserInputError('Invalid input', { errors });

      const user = await User.findOne({ email });
      if (!user) {
        throw new UserInputError('User not found');
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new UserInputError('Wrong credentials');
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      return {
        token,
        user
      };
    },

    sendMessage: async (_, { chatRoomId, content }, { user, pubsub }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      const chatRoom = await ChatRoom.findOne({
        _id: chatRoomId,
        participants: user.id
      });

      if (!chatRoom) {
        throw new UserInputError('Chat room not found or access denied');
      }

      const message = new Message({
        content,
        sender: user.id,
        chatRoom: chatRoomId,
        readBy: [user.id],
        sentAt: new Date()
      });

      const savedMessage = await message.save();

      // Update chat room with new message
      await ChatRoom.findByIdAndUpdate(chatRoomId, {
        $push: { messages: savedMessage._id },
        lastMessage: savedMessage._id,
        updatedAt: new Date()
      });

      const populatedMessage = await Message.findById(savedMessage._id)
        .populate('sender')
        .populate('readBy');

      pubsub.publish(MESSAGE_ADDED, {
        messageAdded: populatedMessage,
        chatRoomId
      });

      return populatedMessage;
    },

    createChatRoom: async (_, { name, participantIds }, { user }) => {
      try {
        if (!user) {
          throw new AuthenticationError('Not authenticated');
        }

        // Validate input
        if (!name || name.trim() === '') {
          throw new UserInputError('Chat room name must not be empty');
        }

        if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
          throw new UserInputError('Must select at least one participant');
        }

        // Verify all participants exist
        const participants = await User.find({ _id: { $in: participantIds } });
        if (participants.length !== participantIds.length) {
          throw new UserInputError('One or more selected users do not exist');
        }

        // Create chat room
        const chatRoom = new ChatRoom({
          name,
          participants: [...participantIds, user.id],
          createdAt: new Date().toISOString()
        });

        const savedChatRoom = await chatRoom.save();
        return await ChatRoom.findById(savedChatRoom.id)
          .populate('participants');
      } catch (error) {
        console.error('Create chat room error:', error);
        throw error;
      }
    },

    deleteChatRoom: async (_, { chatRoomId }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      const chatRoom = await ChatRoom.findOne({
        _id: chatRoomId,
        participants: user.id
      });

      if (!chatRoom) {
        throw new UserInputError('Chat room not found or access denied');
      }

      // Delete all messages in the chat room
      await Message.deleteMany({ chatRoom: chatRoomId });
      
      // Delete the chat room
      await ChatRoom.findByIdAndDelete(chatRoomId);

      return true;
    },

    renameChatRoom: async (_, { chatRoomId, name }, { user }) => {
      if (!user) throw new AuthenticationError('Not authenticated');

      if (!name || name.trim() === '') {
        throw new UserInputError('Chat room name must not be empty');
      }

      const chatRoom = await ChatRoom.findOne({
        _id: chatRoomId,
        participants: user.id
      });

      if (!chatRoom) {
        throw new UserInputError('Chat room not found or access denied');
      }

      const updatedChatRoom = await ChatRoom.findByIdAndUpdate(
        chatRoomId,
        { name: name.trim() },
        { new: true }
      ).populate('participants');

      return updatedChatRoom;
    }
  },

  Subscription: {
    messageAdded: {
      subscribe: (_, { chatRoomId }, { pubsub }) => 
        pubsub.asyncIterator([MESSAGE_ADDED])
    },
    
    typingStatus: {
      subscribe: (_, { chatRoomId }, { pubsub }) =>
        pubsub.asyncIterator([TYPING_STATUS])
    }
  }
};

export default resolvers; 