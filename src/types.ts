export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
}

export interface User {
  uid: string;
  phoneNumber: string;
}

export interface FirebaseError {
  code: string;
  message: string;
}