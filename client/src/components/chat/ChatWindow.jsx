import { useState } from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button 
} from '@mui/material';
import { 
  Menu as MenuIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon 
} from '@mui/icons-material';
import { useMutation, gql } from '@apollo/client';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const DELETE_CHAT_ROOM = gql`
  mutation DeleteChatRoom($chatRoomId: ID!) {
    deleteChatRoom(chatRoomId: $chatRoomId)
  }
`;

const RENAME_CHAT_ROOM = gql`
  mutation RenameChatRoom($chatRoomId: ID!, $name: String!) {
    renameChatRoom(chatRoomId: $chatRoomId, name: $name) {
      id
      name
    }
  }
`;

const ChatWindow = ({ chatRoom, onMenuClick, onChatDeleted }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const [deleteChatRoom] = useMutation(DELETE_CHAT_ROOM, {
    onCompleted: () => {
      handleClose();
      onChatDeleted();
    }
  });

  const [renameChatRoom] = useMutation(RENAME_CHAT_ROOM);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRenameClick = () => {
    handleClose();
    setNewName(chatRoom.name);
    setIsRenameDialogOpen(true);
  };

  const handleRenameClose = () => {
    setIsRenameDialogOpen(false);
    setNewName('');
  };

  const handleRename = async () => {
    if (newName.trim() && newName.trim() !== chatRoom.name) {
      try {
        await renameChatRoom({
          variables: {
            chatRoomId: chatRoom.id,
            name: newName.trim()
          }
        });
        handleRenameClose();
      } catch (error) {
        console.error('Error renaming chat room:', error);
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this chat room?')) {
      try {
        await deleteChatRoom({
          variables: {
            chatRoomId: chatRoom.id
          }
        });
      } catch (error) {
        console.error('Error deleting chat room:', error);
      }
    }
  };

  if (!chatRoom) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Select a chat to start messaging
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          {onMenuClick && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={onMenuClick}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {chatRoom.name}
          </Typography>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleRenameClick}>
              <EditIcon sx={{ mr: 1 }} fontSize="small" />
              Rename
            </MenuItem>
            <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
              <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
              Delete
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <MessageList chatRoomId={chatRoom.id} />
      <MessageInput chatRoomId={chatRoom.id} />

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onClose={handleRenameClose}>
        <DialogTitle>Rename Chat Room</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Name"
            fullWidth
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRenameClose}>Cancel</Button>
          <Button onClick={handleRename} variant="contained" disabled={!newName.trim()}>
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChatWindow; 