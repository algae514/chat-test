import React, { useRef, useCallback, useState, useEffect } from 'react';
import { ChatService } from '../../services/chatService';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  chatId: string;
  currentUserId: string;
  onLoadMore: () => Promise<void>;
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  chatId,
  messages,
  currentUserId,
  onLoadMore,
  isLoading
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver>();
  const [loadingMore, setLoadingMore] = useState(false);
  const chatService = new ChatService();

  // Mark messages as read when they become visible
  useEffect(() => {
    if (messages.length > 0) {
      chatService.markAsRead(currentUserId, chatId);
    }
  }, [messages, currentUserId, chatId]);

  // Intersection Observer for infinite scroll
  const topElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && !loadingMore) {
            setLoadingMore(true);
            onLoadMore().finally(() => setLoadingMore(false));
          }
        },
        { threshold: 0.5 }
      );

      if (node) observer.current.observe(node);
    },
    [isLoading, onLoadMore]
  );

  const shouldShowDate = (message: Message, prevMessage?: Message) => {
    if (!prevMessage) return true;

    const messageDate = new Date(message.timestamp);
    const prevMessageDate = new Date(prevMessage.timestamp);

    return messageDate.toDateString() !== prevMessageDate.toDateString();
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f5f5f5' }}>
      {loadingMore && (
        <div className="text-center py-2">Loading more messages...</div>
      )}

      <div ref={topElementRef} />

      {messages.map((message, index) => (
        <div key={message.id}>
          {shouldShowDate(message, messages[index - 1]) && (
            <div className="text-center text-gray-500 text-sm my-4">
              {new Date(message.timestamp).toLocaleDateString()}
            </div>
          )}
          <div
            className={`message max-w-[80%] mb-2 ${
              message.senderId === currentUserId
                ? 'ml-auto bg-blue-500 text-white'
                : 'bg-gray-200'
            } rounded-lg p-3`}
          >
            <p className="break-words">{message.text}</p>
            
            {message.attachment && (
              <div className="mt-2 attachment-preview">
                {message.attachment.type === 'image' ? (
                  <img 
                    src={message.attachment.url} 
                    alt={message.attachment.name}
                    className="max-w-full rounded"
                  />
                ) : message.attachment.type === 'video' ? (
                  <video 
                    src={message.attachment.url} 
                    controls 
                    className="max-w-full rounded"
                  />
                ) : (
                  <div className="flex items-center gap-2 bg-gray-100 p-2 rounded">
                    <span>📎</span>
                    <a 
                      href={message.attachment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {message.attachment.name}
                      <span className="text-gray-500 text-xs ml-2">
                        ({Math.round(message.attachment.size / 1024)}KB)
                      </span>
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs opacity-70 mt-1">
              {new Date(message.timestamp).toLocaleTimeString()}
              {message.senderId === currentUserId && (
                <span className={`ml-2 ${message.status === 'read' ? 'text-blue-400' : 'text-gray-400'}`}>
                  {message.status === 'read' ? '✓✓' : '✓'}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;