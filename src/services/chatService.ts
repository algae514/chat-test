import { db, storage } from './firebase';
import { 
  collection, 
  doc, 
  writeBatch,
  getDoc,
  serverTimestamp, 
  increment,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Attachment, Message, UserChatMetadata } from '../types';

export class ChatService {
  private async uploadAttachment(
    chatId: string, 
    messageId: string, 
    file: File
  ): Promise<Attachment> {
    const path = `attachments/${chatId}/${messageId}/${file.name}`;
    const storageRef = ref(storage, path);
    
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    return {
      url,
      name: file.name,
      size: file.size,
      type: file.type.startsWith('image/') 
        ? 'image' 
        : file.type.startsWith('video/') 
          ? 'video' 
          : 'document'
    };
  }

  private async getOrCreateChatMetadata(
    // Added logging for debugging user metadata

    userId: string,
    otherUserId: string,
    chatId: string
  ): Promise<void> {
    const userMetadataRef = doc(db, 'user_chat_metadata', userId, 'chats', chatId);
    const userMetadataDoc = await getDoc(userMetadataRef);

    console.log('Checking chat metadata for users:', { userId, otherUserId, chatId });
    console.log('Current metadata doc:', userMetadataDoc.data());

    if (!userMetadataDoc.exists()) {
      console.log('Creating new chat metadata...');
      const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
      const otherUserData = otherUserDoc.data();
      console.log('Other user data from users collection:', otherUserData);

      const metadata: Partial<UserChatMetadata> = {
        unreadCount: 0,
        lastRead: serverTimestamp(),
        participants: [userId, otherUserId],
        otherUser: {
          id: otherUserId,
          name: otherUserData?.displayName || 'Unknown',
          photoURL: otherUserData?.profilePictureUrl
        }
      };

      await userMetadataRef.set(metadata, { merge: true });
    }
  }

  async sendMessage(
    userId: string,
    otherUserId: string,
    text: string,
    attachment?: File
  ): Promise<string> {
    try {
      const chatId = [userId, otherUserId].sort().join('_');
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const messageId = doc(messagesRef).id;
      
      const messageData: Message = {
        id: messageId,
        text,
        senderId: userId,
        timestamp: serverTimestamp(),
        status: 'sent'
      };

      if (attachment) {
        messageData.attachment = await this.uploadAttachment(chatId, messageId, attachment);
      }

      const batch = writeBatch(db);

      // Ensure chat metadata exists for both users
      await Promise.all([
        this.getOrCreateChatMetadata(userId, otherUserId, chatId),
        this.getOrCreateChatMetadata(otherUserId, userId, chatId)
      ]);

      // Store message
      batch.set(
        doc(db, 'chats', chatId, 'messages', messageId),
        messageData
      );

      // Update sender's metadata
      batch.set(
        doc(db, 'user_chat_metadata', userId, 'chats', chatId),
        {
          lastMessage: text,
          lastMessageTime: serverTimestamp(),
          lastRead: serverTimestamp()
        },
        { merge: true }
      );

      // Update recipient's metadata
      batch.set(
        doc(db, 'user_chat_metadata', otherUserId, 'chats', chatId),
        {
          lastMessage: text,
          lastMessageTime: serverTimestamp(),
          unreadCount: increment(1)
        },
        { merge: true }
      );

      await batch.commit();
      return messageId;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async markAsRead(userId: string, chatId: string): Promise<void> {
    if (!userId || !chatId) return;

    try {
      const batch = writeBatch(db);

      // Reset unread count and update last read
      batch.set(
        doc(db, 'user_chat_metadata', userId, 'chats', chatId),
        {
          unreadCount: 0,
          lastRead: serverTimestamp()
        },
        { merge: true }
      );

      // Mark messages as read
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(
        messagesRef,
        where('status', '==', 'sent'),
        where('senderId', '!=', userId)
      );

      const unreadMessages = await getDocs(q);
      unreadMessages.docs.forEach(doc => {
        batch.update(doc.ref, { status: 'read' });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  async getUserChatMetadata(userId: string): Promise<UserChatMetadata[]> {
    try {
      const userChatsRef = collection(db, 'user_chat_metadata', userId, 'chats');
      const snapshot = await getDocs(userChatsRef);
      return snapshot.docs.map(doc => ({ 
        ...doc.data() as UserChatMetadata, 
        id: doc.id 
      }));
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }
}