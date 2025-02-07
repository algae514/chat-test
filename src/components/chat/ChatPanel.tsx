import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, where } from 'firebase/firestore';
import type { Message, FileAttachment } from '../../types';
import LoginForm from './LoginForm';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

interface ChatPanelProps {
  selectedUserId?: string;
  panelId: string;
  onAuthenticated?: (accessToken: string, firebaseToken: string) => void;
  isAuthenticated?: boolean;
  initialFirebaseToken?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  panelId, 
  selectedUserId, 
  onAuthenticated,
  isAuthenticated: initialIsAuthenticated,
  initialFirebaseToken
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(initialIsAuthenticated || false);
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<FileAttachment | null>(null);

  useEffect(() => {
    if (isAuthenticated && selectedUserId) {
      const q = query(
        collection(db, 'messages'),
        where('participants', '==', [userId, selectedUserId].sort().join('_')),
        orderBy('timestamp', 'asc')
      );
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
  }, [isAuthenticated, selectedUserId, userId]);

  const handleLoginSuccess = (accessToken: string, firebaseToken: string, newUserId: string) => {
    setUserId(newUserId);
    setIsAuthenticated(true);
    onAuthenticated?.(accessToken, firebaseToken);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !pendingAttachment) return;

    try {
      const messageData: any = {
        participants: [userId, selectedUserId].sort().join('_'),
        text: newMessage.trim() || (pendingAttachment ? '📎 Attachment' : ''),
        senderId: userId,
        timestamp: serverTimestamp(),
      };

      if (pendingAttachment) {
        messageData.attachment = pendingAttachment;
        setPendingAttachment(null);
      }

      await addDoc(collection(db, 'messages'), messageData);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-white">
        <h2 className="text-xl font-bold mb-4">Chat Panel {panelId}</h2>
      </div>
      <div className="flex-1 flex flex-col">
        {!isAuthenticated ? (
          <LoginForm 
            panelId={panelId}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : (
          <>
            <MessageList 
              messages={messages}
              currentUserId={userId}
            />
            <MessageInput
              newMessage={newMessage}
              onMessageChange={setNewMessage}
              onSendMessage={handleSendMessage}
              pendingAttachment={pendingAttachment}
              onPendingAttachmentClear={() => setPendingAttachment(null)}
              userId={userId}
              onFileUploadComplete={setPendingAttachment}
              onFileUploadError={setError}
              error={error}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ChatPanel;