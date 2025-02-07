import React from 'react';
import FileUpload from '../FileUpload';
import type { FileAttachment } from '../../types';

interface MessageInputProps {
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  pendingAttachment: FileAttachment | null;
  onPendingAttachmentClear: () => void;
  userId: string;
  onFileUploadComplete: (attachment: FileAttachment) => void;
  onFileUploadError: (error: string) => void;
  error?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  onMessageChange,
  onSendMessage,
  pendingAttachment,
  onPendingAttachmentClear,
  userId,
  onFileUploadComplete,
  onFileUploadError,
  error
}) => {
  return (
    <div className="p-4 border-t bg-gray-50">
      <form onSubmit={onSendMessage} className="flex items-center gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="Type a message..."
            className="w-full p-2 border rounded"
          />
          {pendingAttachment && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
              📎 {pendingAttachment.fileName}
              <button
                type="button"
                onClick={onPendingAttachmentClear}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}
        </div>
        <FileUpload
          userId={userId}
          onUploadComplete={onFileUploadComplete}
          onUploadError={onFileUploadError}
        />
        <button 
          type="submit"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          disabled={!newMessage.trim() && !pendingAttachment}
        >
          Send
        </button>
      </form>
      {error && <p className="text-red-500 mt-2">{error}</p>}
    </div>
  );
};

export default MessageInput;