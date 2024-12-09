import { useState } from 'react';
import { useQuery, gql, useMutation } from '@apollo/client';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  IconButton,
  Divider,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import UserAvatar from '../shared/UserAvatar';
import UserMenu from '../shared/UserMenu';

const GET_CHAT_ROOMS = gql`
  query GetChatRooms {
    getChatRooms {
      id
      name
      participants {
        id
        username
      }
      lastMessage {
        content
        sentAt
      }
    }
  }
`;

const CREATE_CHAT_ROOM = gql`
  mutation CreateChatRoom($name: String!, $participantIds: [ID!]!) {
    createChatRoom(name: $name, participantIds: $participantIds) {
      id
      name
      participants {
        id
        username
      }
    }
  }
`;

const SEARCH_USERS = gql`
  query SearchUsers($searchTerm: String!) {
    searchUsers(searchTerm: $searchTerm) {
      id
      username
      email
    }
  }
`;

const ChatSidebar = ({ onChatSelect, selectedChat }) => {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { loading, error: queryError, data } = useQuery(GET_CHAT_ROOMS);
  const { data: searchData } = useQuery(SEARCH_USERS, {
    variables: { searchTerm },
    skip: !searchTerm || searchTerm.length < 2
  });

  const [createChatRoom] = useMutation(CREATE_CHAT_ROOM, {
    onCompleted: (data) => {
      setIsNewChatOpen(false);
      setNewChatName('');
      setSelectedUsers([]);
      setSearchTerm('');
      setError('');
      onChatSelect(data.createChatRoom);
    },
    onError: (error) => {
      setError(error.message);
    },
    refetchQueries: [{ query: GET_CHAT_ROOMS }]
  });

  const handleNewChat = () => {
    setIsNewChatOpen(true);
    setError('');
    setNewChatName('');
    setSelectedUsers([]);
    setSearchTerm('');
  };

  const handleCloseNewChat = () => {
    setIsNewChatOpen(false);
    setError('');
    setNewChatName('');
    setSelectedUsers([]);
    setSearchTerm('');
  };

  const handleCreateChat = () => {
    if (!newChatName.trim()) {
      setError('Chat room name is required');
      return;
    }

    if (selectedUsers.length === 0) {
      setError('Please select at least one participant');
      return;
    }

    createChatRoom({
      variables: {
        name: newChatName.trim(),
        participantIds: selectedUsers.map(user => user.id)
      }
    });
  };

  const handleUserSelect = (selectedUser) => {
    if (!selectedUsers.find(user => user.id === selectedUser.id)) {
      setSelectedUsers([...selectedUsers, selectedUser]);
    }
    setSearchTerm('');
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userId));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%">
        <CircularProgress />
      </Box>
    );
  }

  if (queryError) {
    return (
      <Box p={2}>
        <Typography color="error">Error loading chats: {queryError.message}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Chats
          </Typography>
          <UserMenu />
          <IconButton onClick={handleNewChat}>
            <AddIcon />
          </IconButton>
        </Box>
        <TextField
          fullWidth
          size="small"
          placeholder="Search chats..."
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
      </Box>

      {/* Chat list */}
      <List sx={{ flexGrow: 1, overflow: 'auto' }}>
        {data?.getChatRooms.map((chat) => (
          <ListItem
            key={chat.id}
            button
            selected={selectedChat?.id === chat.id}
            onClick={() => onChatSelect(chat)}
          >
            <ListItemAvatar>
              <UserAvatar username={chat.name} />
            </ListItemAvatar>
            <ListItemText
              primary={chat.name}
              secondary={chat.lastMessage?.content || 'No messages yet'}
              secondaryTypographyProps={{
                noWrap: true,
                style: { maxWidth: '200px' }
              }}
            />
          </ListItem>
        ))}
      </List>

      {/* Updated New chat dialog */}
      <Dialog open={isNewChatOpen} onClose={handleCloseNewChat} maxWidth="sm" fullWidth>
        <DialogTitle>New Chat</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Chat Name"
            fullWidth
            variant="outlined"
            value={newChatName}
            onChange={(e) => setNewChatName(e.target.value)}
            error={!!error}
            sx={{ mb: 2 }}
          />

          {/* Selected users chips */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {selectedUsers.map((selectedUser) => (
              <Chip
                key={selectedUser.id}
                label={selectedUser.username}
                onDelete={() => handleRemoveUser(selectedUser.id)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>

          {/* User search */}
          <TextField
            fullWidth
            label="Search Users"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Search results */}
          {searchTerm && searchData?.searchUsers && (
            <List sx={{ mt: 1 }}>
              {searchData.searchUsers
                .filter(searchUser => 
                  searchUser.id !== user.id && // Exclude current user
                  !selectedUsers.find(selected => selected.id === searchUser.id) // Exclude already selected
                )
                .map((searchUser) => (
                  <ListItem
                    key={searchUser.id}
                    button
                    onClick={() => handleUserSelect(searchUser)}
                  >
                    <ListItemAvatar>
                      <UserAvatar username={searchUser.username} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={searchUser.username}
                      secondary={searchUser.email}
                    />
                  </ListItem>
                ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseNewChat}>Cancel</Button>
          <Button 
            onClick={handleCreateChat} 
            variant="contained"
            disabled={!newChatName.trim() || selectedUsers.length === 0}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatSidebar; 