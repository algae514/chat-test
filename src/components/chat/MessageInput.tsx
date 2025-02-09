import React, { useState, useEffect } from 'react';
import { ChatService } from '../../services/chatService';
import { Attachment } from '../../types';

interface MessageInputProps {
  currentUserId: string;
  recipientId: string;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ currentUserId, recipientId, disabled }) => {
  const chatService = new ChatService();
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'error'>('idle');
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online');
  const [isUploading, setIsUploading] = useState(false);
const [error, setError] = useState<string | null>(null);

  // Monitor network status
  React.useEffect(() => {
    const handleOnline = () => setNetworkStatus('online');
    const handleOffline = () => setNetworkStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !attachment) || isUploading || disabled || networkStatus === 'offline') return;
    
    setSendStatus('sending');

    try {
      setIsUploading(true);
      await chatService.sendMessage(
        currentUserId,
        recipientId,
        message,
        attachment || undefined
      );
      setMessage('');
      setAttachment(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      setSendStatus('error');
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsUploading(false);
      if (sendStatus !== 'error') {
        setSendStatus('idle');
      }
    }
  };

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      validateFile(file);
      setAttachment(file);
    } catch (error) {
      console.error('File validation failed:', error);
      alert(error instanceof Error ? error.message : 'Invalid file');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '16px', borderTop: '1px solid #e5e5e5', background: 'white' }}>
      {attachment && (
        <div className="mb-2 p-2 bg-gray-100 rounded flex justify-between items-center">
          <span>📎 {attachment.name}</span>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="text-red-500"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="file"
          id="file-input"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || isUploading}
        />
        
        <label
          htmlFor="file-input"
          className="p-2 hover:bg-gray-100 rounded cursor-pointer"
        >
          📎
        </label>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded"
          disabled={disabled || isUploading}
        />

        <button
          type="submit"
          disabled={(!message.trim() && !attachment) || disabled || isUploading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Send
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
