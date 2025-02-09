import React, { useState } from 'react';
import { Attachment } from '../../types';

interface MessageInputProps {
  onSendMessage: (text: string, attachment?: File) => Promise<void>;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !attachment) || isUploading || disabled) return;

    try {
      setIsUploading(true);
      await onSendMessage(message, attachment || undefined);
      setMessage('');
      setAttachment(null);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsUploading(false);
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
    <form onSubmit={handleSubmit} className="p-4 border-t">
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
