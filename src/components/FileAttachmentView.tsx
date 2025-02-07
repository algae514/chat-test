import React from 'react';
import type { FileAttachment } from '../types';

interface FileAttachmentViewProps {
  attachment: FileAttachment;
}

const FileAttachmentView: React.FC<FileAttachmentViewProps> = ({ attachment }) => {
  const isImage = attachment.fileType.startsWith('image/');
  const fileSize = attachment.size < 1024 * 1024
    ? `${Math.round(attachment.size / 1024)} KB`
    : `${(attachment.size / (1024 * 1024)).toFixed(1)} MB`;

  if (isImage) {
    return (
      <div className="mt-2 max-w-sm">
        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
          <img
            src={attachment.url}
            alt={attachment.fileName}
            className="rounded-lg max-h-48 object-contain"
          />
        </a>
        <div className="text-xs text-gray-500 mt-1">
          {attachment.fileName} ({fileSize})
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 p-3 bg-gray-100 rounded-lg max-w-sm">
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-500 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <div className="text-sm text-blue-600 hover:underline">
            {attachment.fileName}
          </div>
          <div className="text-xs text-gray-500">
            {fileSize}
          </div>
        </div>
      </a>
    </div>
  );
};

export default FileAttachmentView;
