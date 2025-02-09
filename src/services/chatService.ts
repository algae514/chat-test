import { db, storage } from './firebase';
import { 
  collection, 
  doc, 
  writeBatch, 
  serverTimestamp, 
  increment,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Attachment, ChatPreview, UserChatMetadata } from '../types';

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

  async sendMessage(
    userId: string,
    otherUserId: string,
    text: string,
    attachment?: File
  ): Promise<string> {
    try {
      // Create chat ID by combining user IDs
      const chatId = [userId, otherUserId].sort().join('_');
      
      // Create references
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const messageId = doc(messagesRef).id;
      
      // Prepare base message data
      const messageData: {
        id: string;
        text: string;
        senderId: string;
        timestamp: any;
        status: 'sent' | 'read';
        attachment?: Attachment;
      } = {
        id: messageId,
        text,
        senderId: userId,
        timestamp: serverTimestamp(),
        status: 'sent'
      };

      // Handle attachment if present
      if (attachment) {
        messageData.attachment = await this.uploadAttachment(chatId, messageId, attachment);
      }

      const batch = writeBatch(db);

      // Store full message in chats collection
      batch.set(
        doc(db, 'chats', chatId, 'messages', messageId),
        messageData
      );

      // Update chat metadata (unread count) for recipient
      batch.set(
        doc(db, 'user_chat_metadata', otherUserId, 'chats', chatId),
        {
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
    if (!userId || !chatId) {
      console.warn('markAsRead called with invalid parameters:', { userId, chatId });
      return;
    }
    try {
      const batch = writeBatch(db);

      // Reset unread count and mark messages as read
      batch.set(
        doc(db, 'user_chat_metadata', userId, 'chats', chatId),
        {
          unreadCount: 0,
          lastRead: serverTimestamp()
        },
        { merge: true }
      );

      // Get messages from the last 24 hours that aren't read
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(
        messagesRef,
        where('status', '==', 'sent'),
        where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
      );

      const unreadMessages = await getDocs(q);
      
      // Mark each unread message as read
      unreadMessages.docs.forEach(doc => {
        const messageData = doc.data();
        if (messageData.senderId !== userId) {
          batch.update(doc.ref, { status: 'read' });
        }
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  async getUserChatPreviews(userId: string): Promise<ChatPreview[]> {
    try {
      // Get all chat metadata for this user
      const userChatsRef = collection(db, 'user_chat_metadata', userId, 'chats');
      const userChatsSnapshot = await getDocs(userChatsRef);

      const chatPreviews: ChatPreview[] = [];

      for (const doc of userChatsSnapshot.docs) {
        const chatId = doc.id;
        const data = doc.data() as UserChatMetadata;
        
        // Extract other user's ID from chatId
        const [user1, user2] = chatId.split('_');
        const otherUserId = user1 === userId ? user2 : user1;

        chatPreviews.push({
          chatId,
          otherUserId,
          unreadCount: data.unreadCount,
          lastRead: data.lastRead
        });
      }

      return chatPreviews;
    } catch (error) {
      console.error('Error getting user chat previews:', error);
      throw error;
    }
  }
}