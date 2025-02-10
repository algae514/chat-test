import React, { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import { ChatService } from '../../services/chatService';
import { collection, query, orderBy, limit, onSnapshot, DocumentSnapshot, getDocs, startAfter } from 'firebase/firestore';
import type { Message, ChatState } from '../../types';
import LoginForm from './LoginForm';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { sortMessagesByDate } from '../../utils/chatUtils';

interface ChatPanelProps {
  panelId: string;
  selectedUserId?: string;
  isAuthenticated?: boolean;
  onAuthenticated?: (accessToken: string, firebaseToken: string, userId: string) => void;
  authState?: {
    accessToken: string;
    firebaseToken: string;
  };
  userId?: string;
}

const MESSAGES_PER_PAGE = 25;

const getChatId = (userId1: string, userId2: string) => {
  return [userId1, userId2].sort().join('_');
};

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  panelId, 
  selectedUserId, 
  isAuthenticated = false,
  onAuthenticated,
  userId: propUserId 
}) => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: true,
    hasMore: true
  });
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [localUserId, setLocalUserId] = useState<string>('');
  const currentUserId = propUserId || localUserId;
  const [error, setError] = useState<string | null>(null);

  const chatService = new ChatService();

  useEffect(() => {
    if (isAuthenticated && currentUserId && selectedUserId) {
      const chatId = getChatId(currentUserId, selectedUserId);
      chatService.markAsRead(currentUserId, chatId).catch(error => {
        console.error('Failed to mark messages as read:', error);
        setError('Failed to mark messages as read');
      });
    }
  }, [isAuthenticated, currentUserId, selectedUserId]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId || !selectedUserId) {
      return;
    }

    const chatId = getChatId(currentUserId, selectedUserId);
    console.log('Setting up messages subscription:', { chatId });

    const messagesRef = collection(db, 'chats', chatId, 'messages');

    // Query latest messages first for better initial load
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),  // Changed to desc for latest first
      limit(MESSAGES_PER_PAGE)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const fetchedMessages = snapshot.docs.map(doc => {
            const data = doc.data();
            // Ensure timestamp is properly converted to Date
            const timestamp = data.timestamp?.toDate() || new Date();
            
            return {
              id: doc.id,
              ...data,
              timestamp
            };
          });

          // Validate timestamps and filter out invalid messages
          const validMessages = fetchedMessages.filter(msg => {
            const isValidDate = msg.timestamp instanceof Date && !isNaN(msg.timestamp.getTime());
            if (!isValidDate) {
              console.error('Invalid timestamp for message:', msg);
            }
            return isValidDate;
          });

          // Sort messages by timestamp (oldest first for display)
          const sortedMessages = sortMessagesByDate(validMessages);

          setChatState(prev => ({
            ...prev,
            messages: sortedMessages,
            isLoading: false,
            hasMore: snapshot.docs.length === MESSAGES_PER_PAGE,
            error: undefined
          }));

          setLastDoc(snapshot.docs[0] || null);  // Store first doc as last doc for pagination
        } catch (error) {
          console.error('Error processing messages:', error);
          setChatState(prev => ({
            ...prev,
            isLoading: false,
            error: 'Failed to load messages'
          }));
        }
      },
      (error) => {
        console.error('Error in messages subscription:', error);
        setChatState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to subscribe to messages'
        }));
      }
    );

    return () => unsubscribe();
  }, [isAuthenticated, currentUserId, selectedUserId]);

  const loadMoreMessages = async () => {
    if (!lastDoc || chatState.isLoading || !chatState.hasMore) return;

    setChatState(prev => ({ ...prev, isLoading: true }));

    try {
      const chatId = getChatId(currentUserId, selectedUserId!);
      const messagesRef = collection(db, 'chats', chatId, 'messages');

      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),  // Keep consistent with initial query
        startAfter(lastDoc),
        limit(MESSAGES_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      
      const olderMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        };
      }) as Message[];

      // Filter and sort the messages
      const validOlderMessages = olderMessages.filter(msg => 
        msg.timestamp instanceof Date && !isNaN(msg.timestamp.getTime())
      );

      // Combine with existing messages and sort
      const allMessages = sortMessagesByDate([...chatState.messages, ...validOlderMessages]);

      setChatState(prev => ({
        ...prev,
        messages: allMessages,
        isLoading: false,
        hasMore: snapshot.docs.length === MESSAGES_PER_PAGE
      }));

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    } catch (error) {
      console.error('Error loading more messages:', error);
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load more messages'
      }));
    }
  };

  useEffect(() => {
    console.log('ChatPanel state:', { isAuthenticated, currentUserId, propUserId, selectedUserId });
  }, [isAuthenticated, currentUserId, propUserId, selectedUserId]);

  const handleLoginSuccess = async (accessToken: string, firebaseToken: string, newUserId: string) => {
    setLocalUserId(newUserId);
    if (onAuthenticated) {
      onAuthenticated(accessToken, firebaseToken, newUserId);
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginForm 
        panelId={panelId} 
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="h-[calc(100%-80px)] overflow-hidden flex flex-col">
        {error && (
          <div className="p-2 mb-2 bg-red-100 text-red-700 rounded flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-2 text-sm text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}
        <MessageList 
          messages={chatState.messages}
          currentUserId={currentUserId}
          chatId={getChatId(currentUserId, selectedUserId!)}
          onLoadMore={loadMoreMessages}
          isLoading={chatState.isLoading}
        />
      </div>
      <MessageInput 
        currentUserId={currentUserId}
        recipientId={selectedUserId!}
        disabled={chatState.isLoading}
      />
    </div>
  );
};

export default ChatPanel;