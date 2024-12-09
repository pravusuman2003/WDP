import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import { Box, TextField, IconButton } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

const SEND_MESSAGE = gql`
  mutation SendMessage($chatRoomId: ID!, $content: String!) {
    sendMessage(chatRoomId: $chatRoomId, content: $content) {
      id
      content
      sentAt
      sender {
        id
        username
      }
    }
  }
`;

const MessageInput = ({ chatRoomId }) => {
  const [message, setMessage] = useState('');
  const [sendMessage] = useMutation(SEND_MESSAGE);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await sendMessage({
        variables: {
          chatRoomId,
          content: message.trim(),
        },
      });
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        sx={{ mr: 1 }}
      />
      <IconButton type="submit" color="primary" disabled={!message.trim()}>
        <SendIcon />
      </IconButton>
    </Box>
  );
};

export default MessageInput; 