export interface Message {
  id: string;
  sender: string;
  senderName: string;
  receiver: string;
  content: string;
  timestamp: Date;
}

export interface User {
  id: string;
  phoneNumber: string;
  displayName: string;
  accessToken?: string;
}