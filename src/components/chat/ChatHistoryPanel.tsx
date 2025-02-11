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
  const chatService = new ChatService();

  useEffect(() => {
    console.log('Fetching chat history for userId:', userId);

    // First, let's log the user's own data
    const userDocRef = doc(db, 'users', userId);
    getDoc(userDocRef).then(userDoc => {
      console.log('Current user data:', { id: userDoc.id, ...userDoc.data() });
    });

    const chatsRef = collection(db, 'user_chat_metadata', userId, 'chats');
    const q = query(chatsRef, orderBy('lastMessageTime', 'desc'));

    console.log('Fetching chat history for userId:', userId);
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('Raw chat history snapshot:', snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const chatData = await Promise.all(snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        // Find the other user ID from participants by filtering out current user
        const otherUserId = data.participants.find(id => id !== userId);
        
        try {
          if (otherUserId) {
            // Fetch other user's data
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            console.log('Other user document exists:', otherUserDoc.exists());
            
            if (!otherUserDoc.exists()) {
              console.error('User document does not exist for ID:', otherUserId);
              return {
                ...data,
                id: docSnapshot.id,
                otherUser: {
                  id: otherUserId,
                  name: 'Unknown User',
                  photoURL: undefined
                }
              };
            }
            
            const otherUserData = otherUserDoc.data();
            console.log('Raw other user data:', otherUserData);

            return {
              ...data,
              id: docSnapshot.id,
              otherUser: {
                id: otherUserId,
                name: otherUserData?.displayName || 'Unknown User',
                photoURL: otherUserData?.profilePictureUrl
              }
            };
          }
        } catch (error) {
          console.error('Error fetching other user data:', error);
        }

        return { ...data, id: docSnapshot.id };
      }));

      console.log('Processed chat data:', chatData);
      console.log('Processed chat data:', chatData);
      setChats(chatData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return <div className="flex justify-center p-4">Loading chats...</div>;
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