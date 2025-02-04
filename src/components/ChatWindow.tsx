import React, { useState } from 'react';
import { Message, User } from '../types';
import Login from './Login';

interface ChatWindowProps {
  panelId: string;
  messages: Message[];
  onSendMessage: (content: string, user: User) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  panelId,
  messages,
  onSendMessage,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (phoneNumber: string) => {
    const userData = localStorage.getItem(`${panelId}_user`);
    if (userData) {
      setCurrentUser(JSON.parse(userData));
      setIsLoggedIn(true);
    }
  };

  const handleSend = () => {
    if (newMessage.trim() && currentUser) {
      onSendMessage(newMessage, currentUser);
      setNewMessage('');
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} panelId={panelId} />;
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h2>{currentUser?.displayName || currentUser?.phoneNumber}</h2>
      </div>
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === currentUser?.id ? 'sent' : 'received'}`}
          >
            <div className="message-sender">{message.senderName}</div>
            <p>{message.content}</p>
            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatWindow;