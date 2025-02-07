import React, { useState, useEffect } from 'react';
import { db, signInWithFirebaseToken } from '../services/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

interface ChatPanelProps {
  panelId: string;
}

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ panelId }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
        })) as Message[];
        setMessages(newMessages);
      });

      return () => unsubscribe();
    }
  }, [isAuthenticated]);

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Backend login request
      console.log('Making login request with phone number:', phoneNumber);
      const response = await axios.post('http://localhost:9091/aluminiapp/v2/auth/login', { 
        username: phoneNumber
      });
      
      console.log('Backend response:', response.data);
      const firebaseToken = response.data.firebaseToken;
      console.log('Firebase Token:', {
        token: firebaseToken?.substring(0, 50) + '...',
        length: firebaseToken?.length
      });
      
      const user = await signInWithFirebaseToken(firebaseToken);
      setUserId(user.uid);
      setIsAuthenticated(true);
      setError('');
    } catch (err) {
      let errorMessage = 'Authentication failed. Please try again.';
      if (axios.isAxiosError(err)) {
        console.error('Backend API error:', {
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers
        });
        if (err.response?.status === 404) {
          errorMessage = 'Backend service not reachable. Please check if the service is running.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err instanceof Error) {
        console.error('Firebase error:', err.message);
        errorMessage = `Firebase error: ${err.message}`;
      }
      setError(errorMessage);
      console.error('Full error:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        senderId: userId,
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="panel">
      <h2>Chat Panel {panelId}</h2>
      
      {!isAuthenticated ? (
        <form onSubmit={handlePhoneLogin}>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Enter phone number"
            required
          />
          <button type="submit">Login</button>
          {error && <p className="error">{error}</p>}
        </form>
      ) : (
        <div className="chat-container">
          <div className="messages">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.senderId === userId ? 'sent' : 'received'}`}
              >
                <p>{message.text}</p>
                <small>
                  {message.timestamp?.toLocaleTimeString()}
                </small>
              </div>
            ))}
          </div>
          
          <form onSubmit={handleSendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit">Send</button>
          </form>
          
          {error && <p className="error">{error}</p>}
        </div>
      )}
    </div>
  );
};

export default ChatPanel;