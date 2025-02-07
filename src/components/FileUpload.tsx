import React, { useRef, useState } from 'react';
import { uploadFile } from '../services/fileService';
import type { FileAttachment } from '../types';

interface FileUploadProps {
  userId: string;
  onUploadComplete: (attachment: FileAttachment) => void;
  onUploadError: (error: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ userId, onUploadComplete, onUploadError }) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File change event triggered');
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const response = await uploadFile(file, userId);
      onUploadComplete(response);
    } catch (error) {
      onUploadError(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex items-center">
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
        disabled={isUploading}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        title="Attach file"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {isUploading && (
        <div className="ml-2 text-sm text-gray-500">Uploading...</div>
      )}
    </div>
  );
};

export default FileUpload;
