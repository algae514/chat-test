// User related types
export interface User {
  id: string;
  phoneNumber: string;
  lastSeen: Date;
  isOnline: boolean;
  displayName?: string;
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
