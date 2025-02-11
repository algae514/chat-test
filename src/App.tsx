import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import ChatPanelWithSearch from './components/ChatPanelWithSearch';
import ChatHistoryPanel from './components/chat/ChatHistoryPanel';
import './styles.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    background: {
      default: '#f5f7fb',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
  },
});

const App: React.FC = () => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const handleAuthenticated = (_accessToken: string, _firebaseToken: string, userId: string) => {
    setCurrentUserId(userId);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="app-container">
        <h1 className="app-title">Chat Test App</h1>
        <div className="flex h-[calc(100vh-100px)]">
          {currentUserId && (
            <div className="w-80 border-r border-gray-200">
              <ChatHistoryPanel 
                userId={currentUserId} 
                onChatSelect={setSelectedUserId}
              />
            </div>
          )}
          <div className="flex-1">
            <ChatPanelWithSearch 
              panelId="1"
              selectedUserId={selectedUserId || undefined}
              onAuthenticated={handleAuthenticated}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default App;