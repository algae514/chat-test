import React, { useState } from 'react';
import { Button, TextField, IconButton } from '@mui/material';
import { Send as SendIcon, AttachFile as AttachFileIcon } from '@mui/icons-material';
import ChatPanel from './chat/ChatPanel';
import UserSearch from './UserSearch';
import type { UserProfile } from '../types';

interface ChatPanelWithSearchProps {
  panelId: string;
}

const ChatPanelWithSearch: React.FC<ChatPanelWithSearchProps> = ({ panelId }) => {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showSearch, setShowSearch] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authState, setAuthState] = useState({
    accessToken: '',
    firebaseToken: ''
  });

  const handleLogin = async (accessToken: string, firebaseToken: string) => {
    setAuthState({
      accessToken,
      firebaseToken
    });
    setIsAuthenticated(true);
  };

  const handleUserSelect = (user: UserProfile) => {
    setSelectedUser(user);
    setShowSearch(false);
  };

  return (
    <div className="chat-panel">
      {!isAuthenticated ? (
        <div className="panel-content">
          <ChatPanel 
            panelId={panelId} 
            onAuthenticated={(token) => handleLogin(token)}
          />
        </div>
      ) : selectedUser ? (
        <>
          <div className="panel-header">
            <div className="user-info">
              <div className="name">{selectedUser.name}</div>
              {selectedUser.currentPosition && (
                <div className="position">{selectedUser.currentPosition}</div>
              )}
            </div>
            <Button
              variant="contained"
              color="inherit"
              size="small"
              onClick={() => {
                setSelectedUser(null);
                setShowSearch(true);
              }}
              sx={{
                textTransform: 'none',
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                }
              }}
            >
              Change User
            </Button>
          </div>
          <div className="messages-container">
            <ChatPanel 
              panelId={panelId} 
              selectedUserId={selectedUser.userId} 
              isAuthenticated={isAuthenticated}
              initialFirebaseToken={authState.firebaseToken}
              authState={authState}
            />
          </div>
          <div className="input-area">
            <TextField
              placeholder="Type a message..."
              variant="standard"
              fullWidth
              InputProps={{
                disableUnderline: true,
                className: 'message-input'
              }}
            />
            <div className="file-upload-container">
              <input
                type="file"
                id={`file-upload-${panelId}`}
                style={{ display: 'none' }}
              />
              <IconButton
                color="primary"
                component="label"
                htmlFor={`file-upload-${panelId}`}
                size="medium"
              >
                <AttachFileIcon />
              </IconButton>
            </div>
            <IconButton
              color="primary"
              size="medium"
              sx={{
                backgroundColor: '#1976d2',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
                width: '40px',
                height: '40px'
              }}
            >
              <SendIcon />
            </IconButton>
          </div>
        </>
      ) : (
        <div className="search-wrapper">
          <UserSearch onUserSelect={handleUserSelect} authToken={authState} />
        </div>
      )}
    </div>
  );
};

export default ChatPanelWithSearch;