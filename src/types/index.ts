import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string;
  displayName: string;
  phoneNumber: string;
  profilePictureUrl: string | null;
  lastSeen: Timestamp;
  isOnline: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  roles: string[];
}

export interface Attachment {
  url: string;
  name: string;
  size: number;
  type: 'image' | 'video' | 'document';
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp;
  status: 'sent' | 'read';
  attachment?: Attachment;
}

export interface UserChatMetadata {
  id: string; // Chat ID
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: number;
  lastRead: Timestamp;
  participants: string[];
  otherUser: {
    id: string;
    displayName: string;
    profilePictureUrl: string | null;
  };
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  error?: string;
}