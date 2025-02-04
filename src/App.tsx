import React, { useState } from 'react';
import ChatWindow from './components/ChatWindow';
import { Message, User } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSendMessage = (content: string, sender: User) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: sender.id,
      senderName: sender.displayName || sender.phoneNumber,
      receiver: 'all', // For simplicity, messages go to all
      content,
      timestamp: new Date(),
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div style={{ display: 'flex', gap: '20px', padding: '20px' }}>
      <ChatWindow
        panelId="panel1"
        messages={messages}
        onSendMessage={handleSendMessage}
      />
      <ChatWindow
        panelId="panel2"
        messages={messages}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default App;