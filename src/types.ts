export interface FileAttachment {
  url: string;
  fileName?: string;
  name?: string;
  fileType?: string;
  type?: string;
  size: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
  attachment?: FileAttachment;
}

export interface User {
  uid: string;
  phoneNumber: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  name: string;
  profilePictureUrl: string | null;
  schools: string[];
  currentPosition: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FirebaseError {
  code: string;
  message: string;
}