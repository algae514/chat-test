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
  status: 'sent' | 'read';
  attachment?: Attachment;
}

export interface ChatMetadata {
  participants: string[];
  lastMessage: string;
  lastMessageTime: Date;
  lastMessageId: string;
}

// For quick access to a user's chats without loading messages
export interface UserChatMetadata {
  unreadCount: number;
  lastRead: Date;
}

export interface User {
  id: string;
  phoneNumber: string;
  displayName: string;
  accessToken?: string;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  error?: string;
}

export interface ChatPreview {
  chatId: string;
  otherUserId: string;
  unreadCount: number;
  lastRead: Date;
  otherUserName?: string;
}