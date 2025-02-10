import { Message } from '../types';

export const formatMessageDate = (date: Date): string => {
  try {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else if (now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const formatMessageTime = (date: Date): string => {
  try {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
};

export const sortMessagesByDate = (messages: Message[]): Message[] => {
  try {
    return [...messages].sort((a, b) => {
      const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
      const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
      return dateA.getTime() - dateB.getTime();
    });
  } catch (error) {
    console.error('Error sorting messages:', error);
    return messages; // Return original array if sorting fails
  }
};

export const groupMessagesByDate = (messages: Message[]): { [key: string]: Message[] } => {
  try {
    const grouped: { [key: string]: Message[] } = {};
    
    messages.forEach(message => {
      const date = message.timestamp instanceof Date ? 
        message.timestamp : 
        new Date(message.timestamp);
      
      const dateKey = date.toDateString();
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      
      grouped[dateKey].push(message);
    });
    
    return grouped;
  } catch (error) {
    console.error('Error grouping messages:', error);
    return { 'Error': messages }; // Return all messages under error key if grouping fails
  }
};

export const validateMessage = (message: Message): boolean => {
  try {
    return (
      typeof message.id === 'string' &&
      typeof message.text === 'string' &&
      typeof message.senderId === 'string' &&
      (message.timestamp instanceof Date || !isNaN(new Date(message.timestamp).getTime())) &&
      ['sent', 'read'].includes(message.status)
    );
  } catch (error) {
    console.error('Error validating message:', error);
    return false;
  }
};