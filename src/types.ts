// User types
export interface UserProfile {
  userId: string;
  name: string;
  currentPosition?: string;
}

// Chat metadata types
export interface UserChatMetadata {
  id: string;
  userId: string;
  unreadCount: number;
  lastRead: Date;
}

// Chat related types
export interface ChatMetadata {
  lastRead: Date;
  unreadCount: number;
}

// Message related types
export interface Attachment {
  url: string;
  type: 'image' | 'video' | 'document';
  name: string;
  size: number;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  attachment?: Attachment;
}

// State management types
export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  error?: string;
}

// Error types
export interface FirebaseError {
  code: string;
  message: string;
}
