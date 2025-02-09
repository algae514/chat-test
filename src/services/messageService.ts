import { db, storage } from './firebase';
import { 
  doc, 
  writeBatch, 
  serverTimestamp, 
  increment,
  collection,

  query,
  where,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Attachment } from '../types';

// Helper function to validate file size and type
const validateFile = (file: File) => {
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 5MB limit');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('File type not supported');
  }
};

// Generate a unique chat ID for two users
const getChatId = (userId1: string, userId2: string) => {
  return [userId1, userId2].sort().join('_');
};

// Upload attachment to Firebase Storage
export const uploadAttachment = async (
  chatId: string,
  messageId: string,
  file: File
): Promise<Attachment> => {
  // Validate file before upload
  validateFile(file);

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
};

// Send a message
export const sendMessage = async (
  userId: string,
  otherUserId: string,
  text: string,
  attachment?: File
): Promise<string> => {
  const chatId = getChatId(userId, otherUserId);
  const messageId = doc(collection(db, 'messages')).id;
  const timestamp = serverTimestamp();

  const messageData: any = {
    id: messageId,
    text,
    senderId: userId,
    timestamp,
    status: 'sent'
  };

  // Handle attachment if present
  if (attachment) {
    const attachmentData = await uploadAttachment(chatId, messageId, attachment);
    messageData.attachment = attachmentData;
  }

  const batch = writeBatch(db);

  // Add message to shared chat collection
  batch.set(
    doc(db, 'chats', chatId, 'messages', messageId),
    messageData
  );

  // Update unread count for recipient
  batch.set(
    doc(db, 'user_chat_metadata', otherUserId, 'chats', chatId),
    {
      unreadCount: increment(1),
    },
    { merge: true }
  );

  // Get the latest message from other user and mark it as read
  const latestMessageQuery = query(
    collection(db, 'chats', chatId, 'messages'),
    where('senderId', '==', otherUserId),
    where('status', '==', 'sent'),
    orderBy('timestamp', 'desc'),
    limit(1)
  );

  const latestMessageSnapshot = await getDocs(latestMessageQuery);
  if (!latestMessageSnapshot.empty) {
    const latestMessage = latestMessageSnapshot.docs[0];
    batch.update(
      doc(db, 'chats', chatId, 'messages', latestMessage.id),
      { status: 'read' }
    );
  }

  await batch.commit();
  return messageId;
};

// Mark messages as read
export const markMessagesAsRead = async (
  userId: string,
  otherUserId: string
) => {
  const chatId = getChatId(userId, otherUserId);
  const batch = writeBatch(db);

  // Reset unread count
  batch.set(
    doc(db, 'user_chat_metadata', userId, 'chats', chatId),
    { 
      lastRead: serverTimestamp(),
      unreadCount: 0
    },
    { merge: true }
  );

  await batch.commit();
};

// Update user's online status

