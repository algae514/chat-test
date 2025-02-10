import { Timestamp } from 'firebase/firestore';

export interface Attachment {
  url: string;
  name: string;
  size: number;
  type: 'image' | 'video' | 'document';
}

export interface ChatPreview {
  chatId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto?: string;
  unreadCount: number;
  lastRead?: Timestamp;
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
    senderId: string;
    attachment?: Attachment;
  };
}

export interface UserChatMetadata {
  unreadCount: number;
  lastRead?: Timestamp;
}