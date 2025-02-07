import React, { useRef, useEffect } from 'react';
import FileAttachmentView from '../FileAttachmentView';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`message max-w-[80%] ${
            message.senderId === currentUserId 
              ? 'ml-auto bg-blue-100 rounded-l-lg rounded-tr-lg' 
              : 'bg-gray-100 rounded-r-lg rounded-tl-lg'
          } p-3`}
        >
          <p className="text-sm">{message.text}</p>
          {message.attachment && (
            <FileAttachmentView attachment={message.attachment} />
          )}
          <small className="text-xs text-gray-500">
            {message.timestamp?.toLocaleTimeString()}
          </small>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;