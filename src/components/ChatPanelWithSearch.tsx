import React, { useState } from 'react';
import Button from '@mui/material/Button';

import ChatPanel from './chat/ChatPanel';
import UserSearch from './UserSearch';
import type { UserProfile } from '../types';

interface ChatPanelWithSearchProps {
  panelId: string;
}

const ChatPanelWithSearch: React.FC<ChatPanelWithSearchProps> = ({ panelId }) => {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [authState, setAuthState] = useState({
    accessToken: '',
    firebaseToken: ''
  });

  const handleLogin = async (accessToken: string, firebaseToken: string, newUserId: string) => {
    console.log('Login successful:', { accessToken, firebaseToken, newUserId });
    setAuthState({
      accessToken,
      firebaseToken
    });
    setUserId(newUserId);
    setIsAuthenticated(true);
  };

  const handleUserSelect = (user: UserProfile) => {
    console.log('User selected:', user);
    setSelectedUser(user);
  };

  return (
    <div className="chat-panel">
      {!isAuthenticated ? (
        <div className="panel-content">
          <ChatPanel 
            panelId={panelId}
            isAuthenticated={false}
            onAuthenticated={handleLogin}
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
              onClick={() => setSelectedUser(null)}
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
              authState={authState}
              userId={userId}
            />
          </div>
        </>
      ) : (
        <div className="search-wrapper">
          <UserSearch 
            onUserSelect={handleUserSelect} 
            authToken={authState} 
          />
        </div>
      )}
    </div>
  );
};

export default ChatPanelWithSearch;