import React, { useState, useEffect } from 'react';
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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

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
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!isAuthenticated ? (
        <div className="p-2">
          <ChatPanel 
            panelId={panelId} 
            onAuthenticated={(token) => handleLogin(token)}
          />
        </div>
      ) : selectedUser ? (
        <div className="flex items-center justify-between bg-gray-50 p-2 border-b">
          <div>
            <div className="font-medium">{selectedUser.name}</div>
            {selectedUser.currentPosition && (
              <div className="text-sm text-gray-500">{selectedUser.currentPosition}</div>
            )}
          </div>
          <button
            onClick={() => {
              setSelectedUser(null);
              setShowSearch(true);
            }}
            className="text-blue-500 hover:text-blue-700"
          >
            Change User
          </button>
        </div>
      ) : (
        <div className="p-4">
          <UserSearch onUserSelect={handleUserSelect} authToken={authState} />
        </div>
      )}
      {selectedUser && (
        <div className="flex-1">
          <ChatPanel 
            panelId={panelId} 
            selectedUserId={selectedUser.userId} 
            isAuthenticated={isAuthenticated}
            initialFirebaseToken={authState.firebaseToken}
          />
        </div>
      )}
    </div>
  );
};

export default ChatPanelWithSearch;