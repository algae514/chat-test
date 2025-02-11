import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { ChatService } from '../../services/chatService';
import { UserChatMetadata } from '../../types';

interface ChatHistoryPanelProps {
  userId: string;
  onChatSelect: (otherUserId: string) => void;
}

const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({ userId, onChatSelect }) => {
  const [chats, setChats] = useState<UserChatMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const chatService = new ChatService();

  const getOtherUserIdFromChatId = (chatId: string, currentUserId: string): string => {
    const userIds = chatId.split('_');
    return userIds[0] === currentUserId ? userIds[1] : userIds[0];
  };

  useEffect(() => {
    if (!userId) {
      setError('No user ID provided');
      setLoading(false);
      return;
    }

    console.log('Fetching chat history for userId:', userId);

    const chatsRef = collection(db, 'user_chat_metadata', userId, 'chats');
    const q = query(chatsRef, orderBy('lastMessageTime', 'desc'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        console.log('Raw snapshot data:', snapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        })));

        const chatData = await Promise.all(
          snapshot.docs.map(async (docSnapshot) => {
            try {
              const data = docSnapshot.data();
              console.log('Processing chat document:', docSnapshot.id, data);

              // Get other user ID either from participants or chat ID
              let otherUserId: string;
              
              if (data && Array.isArray(data.participants)) {
                otherUserId = data.participants.find(id => id !== userId) || '';
              } else {
                // Extract other user ID from chat ID
                otherUserId = getOtherUserIdFromChatId(docSnapshot.id, userId);
              }

              console.log('Found other user ID:', otherUserId);

              if (!otherUserId) {
                console.warn('Could not determine other user ID for chat:', docSnapshot.id);
                return {
                  id: docSnapshot.id,
                  lastMessage: data?.lastMessage || 'No messages',
                  lastMessageTime: data?.lastMessageTime || null,
                  unreadCount: data?.unreadCount || 0,
                  participants: [],
                  otherUser: {
                    id: 'unknown',
                    name: 'Unknown User',
                    photoURL: null
                  }
                };
              }

              // Fetch other user's data
              const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
              console.log('Other user document exists:', otherUserDoc.exists());
              
              if (!otherUserDoc.exists()) {
                console.warn('User document does not exist for ID:', otherUserId);
                return {
                  id: docSnapshot.id,
                  ...data,
                  lastMessage: data?.lastMessage || 'No messages',
                  lastMessageTime: data?.lastMessageTime || null,
                  unreadCount: data?.unreadCount || 0,
                  otherUser: {
                    id: otherUserId,
                    name: 'Unknown User',
                    photoURL: null
                  }
                };
              }

              const otherUserData = otherUserDoc.data();
              console.log('Fetched other user data:', otherUserData);

              return {
                ...data,
                id: docSnapshot.id,
                lastMessage: data?.lastMessage || 'No messages',
                lastMessageTime: data?.lastMessageTime || null,
                unreadCount: data?.unreadCount || 0,
                otherUser: {
                  id: otherUserId,
                  name: otherUserData?.displayName || 'Unknown User',
                  photoURL: otherUserData?.profilePictureUrl || null
                }
              };
            } catch (err) {
              console.error('Error processing chat document:', err);
              return null;
            }
          })
        );

        // Filter out any null values from errors and set the chats
        const validChatData = chatData.filter(chat => chat !== null) as UserChatMetadata[];
        console.log('Final processed chat data:', validChatData);
        setChats(validChatData);
        setError(null);
      } catch (err) {
        console.error('Error processing chat history:', err);
        setError('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error('Error in chat history subscription:', err);
      setError('Failed to subscribe to chat history');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return <div className="flex justify-center p-4">Loading chats...</div>;
  }

  if (error) {
    return (
      <div className="flex justify-center p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-2 p-4">
      {chats.map((chat) => (
        <div
          key={chat.id}
          onClick={() => chat.otherUser?.id && onChatSelect(chat.otherUser.id)}
          className="flex items-center p-3 hover:bg-gray-100 rounded-lg cursor-pointer"
        >
          {chat.otherUser?.photoURL && (
            <div className="w-12 h-12 rounded-full mr-3 flex-shrink-0 overflow-hidden">
              <img 
                src={chat.otherUser.photoURL} 
                alt={chat.otherUser.name}
                className="w-full h-full object-cover"
                style={{ maxWidth: '48px', maxHeight: '48px' }}
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center">
              <h3 className="font-medium truncate">
                {chat.otherUser?.name || 'Unknown User'}
              </h3>
              {chat.unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                  {chat.unreadCount}
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm truncate">
              {chat.lastMessage || 'No messages yet'}
            </p>
          </div>
        </div>
      ))}
      {chats.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          No chat history yet
        </div>
      )}
    </div>
  );
};

export default ChatHistoryPanel;