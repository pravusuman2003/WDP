import { useState } from 'react';
import { Box, Drawer, useMediaQuery, useTheme } from '@mui/material';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';

const DRAWER_WIDTH = 300;

const ChatLayout = () => {
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleChatSelect = (chatRoom) => {
    setSelectedChatRoom(chatRoom);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar for larger screens */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          <ChatSidebar onChatSelect={handleChatSelect} selectedChat={selectedChatRoom} />
        </Drawer>
      )}

      {/* Sidebar for mobile screens */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          <ChatSidebar onChatSelect={handleChatSelect} selectedChat={selectedChatRoom} />
        </Drawer>
      )}

      {/* Main chat window */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <ChatWindow
          chatRoom={selectedChatRoom}
          onMenuClick={isMobile ? handleDrawerToggle : undefined}
          onChatDeleted={() => setSelectedChatRoom(null)}
        />
      </Box>
    </Box>
  );
};

export default ChatLayout; 