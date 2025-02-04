import React, { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import Login from './components/Login';
import { Message, User } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const handleLoginSuccess = (userData: any) => {
    const { user: userInfo, accessToken } = userData;
    setUser({
      id: userInfo.id,
      displayName: userInfo.displayName,
      phoneNumber: userInfo.phoneNumber,
      accessToken
    });
  };

  const handleSendMessage = (content: string, sender: User) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: sender.id,
      senderName: sender.displayName || sender.phoneNumber,
      receiver: 'all',
      content,
      timestamp: new Date(),
    };
    setMessages([...messages, newMessage]);
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      <ChatWindow
        panelId="panel1"
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUser={user}
      />
      <ChatWindow
        panelId="panel2"
        messages={messages}
        onSendMessage={handleSendMessage}
        currentUser={user}
      />
    </div>
  );
};

export default App;