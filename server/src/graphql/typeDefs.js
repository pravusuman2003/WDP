import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    profilePicture: String
    createdAt: String!
  }

  type Message {
    id: ID!
    content: String!
    sender: User!
    chatRoom: ChatRoom!
    sentAt: String!
    readBy: [User!]
  }

  type ChatRoom {
    id: ID!
    name: String!
    participants: [User!]!
    lastMessage: Message
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    me: User
    getChatRooms: [ChatRoom!]!
    getChatRoom(id: ID!): ChatRoom
    getMessages(chatRoomId: ID!, limit: Int, offset: Int): [Message!]!
    searchUsers(searchTerm: String!): [User!]!
  }

  type Mutation {
    register(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    sendMessage(chatRoomId: ID!, content: String!): Message!
    createChatRoom(name: String!, participantIds: [ID!]!): ChatRoom!
    markMessageAsRead(messageId: ID!): Message!
    updateProfile(profilePicture: String): User!
    deleteChatRoom(chatRoomId: ID!): Boolean!
    renameChatRoom(chatRoomId: ID!, name: String!): ChatRoom!
  }

  type Subscription {
    messageAdded(chatRoomId: ID!): Message!
    typingStatus(chatRoomId: ID!): TypingStatus!
  }

  type TypingStatus {
    chatRoomId: ID!
    user: User!
    isTyping: Boolean!
  }
`;

export default typeDefs; 