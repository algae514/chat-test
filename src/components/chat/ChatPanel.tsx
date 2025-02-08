import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
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

  authState?: {
    accessToken: string;
    firebaseToken: string;
  };
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  panelId, 
  selectedUserId, 
  onAuthenticated,
  isAuthenticated: initialIsAuthenticated
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(initialIsAuthenticated || false);
  const [userId, setUserId] = useState('');
  const [chatReady, setChatReady] = useState(false);

  // Effect to handle initialization
  useEffect(() => {
    const initializeUser = () => {
      if (auth.currentUser && !userId) {
        console.log(`[Panel ${panelId}] Setting userId from auth:`, auth.currentUser.uid);
        setUserId(auth.currentUser.uid);
      }
    };

    // Check immediately
    initializeUser();

    // Also set up a listener for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log(`[Panel ${panelId}] Auth state changed:`, user?.uid);
      if (user && !userId) {
        setUserId(user.uid);
      }
    });

    return () => unsubscribe();
  }, [panelId, userId]);
  const [error, setError] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<FileAttachment | null>(null);

  useEffect(() => {
    console.log(`[Panel ${panelId}] Effect triggered:`, {
      isAuthenticated,
      selectedUserId,
      userId
    });

    // Only proceed if we have both IDs, authentication, and chat is ready
    if (!isAuthenticated || !selectedUserId || !userId) {
      console.log(`[Panel ${panelId}] Skipping query - missing required data`, {
        isAuthenticated,
        selectedUserId,
        userId
      });
      return;
    }

    // Set chat as ready when all conditions are met
    if (!chatReady) {
      console.log(`[Panel ${panelId}] Chat is now ready`);
      setChatReady(true);
    }
    if (isAuthenticated && selectedUserId) {
      const q = query(
        collection(db, 'messages'),
        where('participants', '==', [userId, selectedUserId].sort()),
        orderBy('timestamp', 'asc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log(`[Panel ${panelId}] Received Firestore update`);
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(),
        })) as Message[];
        console.log(`[Panel ${panelId}] Setting messages:`, newMessages);
        setMessages(newMessages);
      });

      return () => unsubscribe();
    }
  }, [isAuthenticated, selectedUserId, userId]);

  const handleLoginSuccess = (accessToken: string, firebaseToken: string, newUserId: string) => {
    console.log(`[Panel ${panelId}] Login Success - Setting userId:`, newUserId);
    setUserId(newUserId);
    setIsAuthenticated(true);
    onAuthenticated?.(accessToken, firebaseToken);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !pendingAttachment) return;

    try {
      const messageData: any = {
        participantId: [userId, selectedUserId].sort().join('_'),
        participants: [userId, selectedUserId].sort(),
        text: newMessage.trim() || (pendingAttachment ? '📎 Attachment' : ''),
        senderId: userId,
        timestamp: serverTimestamp(),
      };

      if (pendingAttachment) {
        messageData.attachment = {
          url: pendingAttachment.url,
          fileName: pendingAttachment.fileName,
          fileType: pendingAttachment.fileType,
          size: pendingAttachment.size
        };
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