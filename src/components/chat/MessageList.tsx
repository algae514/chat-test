import React, { useRef, useCallback, useState } from 'react';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  onLoadMore: () => Promise<void>;
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  onLoadMore,
  isLoading
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver>();
  const [loadingMore, setLoadingMore] = useState(false);

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

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
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
            <p>{message.text}</p>
            {message.attachment && (
              <div className="mt-2">
                <span>📎 Attachment: {message.attachment.name}</span>
              </div>
            )}
            <div className="text-xs opacity-70 mt-1">
              {new Date(message.timestamp).toLocaleTimeString()}
              {message.senderId === currentUserId && (
                <span className="ml-2">{message.status}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;
