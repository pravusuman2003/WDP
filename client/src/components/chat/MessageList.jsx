import { useEffect, useRef } from 'react';
import { useQuery, useSubscription, gql, useApolloClient } from '@apollo/client';
import { Box, Typography, CircularProgress } from '@mui/material';
import { format, isValid, parseISO } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../shared/UserAvatar';

const GET_MESSAGES = gql`
  query GetMessages($chatRoomId: ID!, $limit: Int, $offset: Int) {
    getMessages(chatRoomId: $chatRoomId, limit: $limit, offset: $offset) {
      id
      content
      sentAt
      sender {
        id
        username
      }
      readBy {
        id
      }
    }
  }
`;

const MESSAGE_SUBSCRIPTION = gql`
  subscription OnMessageAdded($chatRoomId: ID!) {
    messageAdded(chatRoomId: $chatRoomId) {
      id
      content
      sentAt
      sender {
        id
        username
      }
      readBy {
        id
      }
    }
  }
`;

const formatMessageTime = (dateString) => {
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    return isValid(date) ? format(date, 'HH:mm') : '';
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

const MessageList = ({ chatRoomId }) => {
  const { user } = useAuth();
  const client = useApolloClient();
  const messagesEndRef = useRef(null);
  const { loading, error, data, subscribeToMore } = useQuery(GET_MESSAGES, {
    variables: { chatRoomId, limit: 50 },
    skip: !chatRoomId,
  });

  useEffect(() => {
    if (!chatRoomId) return;

    const unsubscribe = subscribeToMore({
      document: MESSAGE_SUBSCRIPTION,
      variables: { chatRoomId },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) return prev;
        const newMessage = subscriptionData.data.messageAdded;

        const messageExists = prev.getMessages.some(msg => msg.id === newMessage.id);
        if (messageExists) return prev;

        return {
          getMessages: [newMessage, ...prev.getMessages]
        };
      },
    });

    return () => unsubscribe();
  }, [chatRoomId, subscribeToMore]);

  useEffect(() => {
    if (data?.getMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data?.getMessages]);

  useEffect(() => {
    return () => {
      if (chatRoomId) {
        client.cache.evict({ fieldName: 'getMessages' });
        client.cache.gc();
      }
    };
  }, [chatRoomId, client]);

  if (!chatRoomId) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100%"
      >
        <Typography color="text.secondary">
          Select a chat to start messaging
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Typography color="error">Error loading messages: {error.message}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflow: 'auto',
        p: 2,
        display: 'flex',
        flexDirection: 'column-reverse',
      }}
    >
      <div ref={messagesEndRef} />
      {data?.getMessages.map((message) => (
        <Box
          key={message.id}
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            mb: 2,
            flexDirection: message.sender.id === user.id ? 'row-reverse' : 'row',
          }}
        >
          <UserAvatar username={message.sender.username} />
          <Box
            sx={{
              mx: 1,
              p: 1,
              bgcolor: message.sender.id === user.id ? 'primary.main' : 'background.paper',
              borderRadius: 1,
              maxWidth: '70%',
            }}
          >
            <Typography variant="body1">{message.content}</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatMessageTime(message.sentAt)}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default MessageList; 