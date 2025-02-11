import React, { useRef, useCallback, useState, useEffect } from 'react';
import { ChatService } from '../../services/chatService';
import type { Message } from '../../types';
import { 
  formatMessageDate, 
  formatMessageTime, 
  groupMessagesByDate,
  validateMessage 
} from '../../utils/chatUtils';

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
  const [error, setError] = useState<string | null>(null);
  const chatService = new ChatService();
  const [prevMessageCount, setPrevMessageCount] = useState(messages.length);

  // Validate messages and group them by date
  // Deduplicate messages based on ID before grouping
  const uniqueMessages = React.useMemo(() => {
    const messageMap = new Map();
    messages.forEach(msg => messageMap.set(msg.id, msg));
    return Array.from(messageMap.values());
  }, [messages]);

  const groupedMessages = React.useMemo(() => {
    try {
      // Filter out invalid messages
      const validMessages = uniqueMessages.filter(msg => {
        const isValid = validateMessage(msg);
        if (!isValid) {
          console.error('Invalid message found:', msg);
        }
        return isValid;
      });
      
      return groupMessagesByDate(validMessages);
    } catch (error) {
      console.error('Error processing messages:', error);
      setError('Error processing messages');
      return {};
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > prevMessageCount && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    setPrevMessageCount(messages.length);
  }, [messages.length, prevMessageCount]);

  useEffect(() => {
    if (messages.length > 0) {
      chatService.markAsRead(currentUserId, chatId).catch(error => {
        console.error('Error marking messages as read:', error);
        setError('Failed to mark messages as read');
      });
    }
  }, [messages, currentUserId, chatId]);

  const handleLoadMore = async () => {
    if (loadingMore || isLoading) return;
    
    const scrollElement = scrollRef.current;
    const oldScrollHeight = scrollElement?.scrollHeight || 0;
    const oldScrollTop = scrollElement?.scrollTop || 0;
    
    setLoadingMore(true);
    try {
      await onLoadMore();
    } catch (error) {
      console.error('Error loading more messages:', error);
      setError('Failed to load more messages');
    } finally {
      setLoadingMore(false);
    }

    // Restore scroll position
    if (scrollElement) {
      const newScrollHeight = scrollElement.scrollHeight;
      scrollElement.scrollTop = oldScrollTop + (newScrollHeight - oldScrollHeight);
    }
  };

  const topElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) {
            handleLoadMore();
          }
        },
        { threshold: 0.5 }
      );

      if (node) observer.current.observe(node);
    },
    [isLoading, handleLoadMore]
  );

  return (
    <div 
      ref={scrollRef} 
      className="flex-1 overflow-y-auto p-4 bg-gray-50"
    >
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
          <span 
            className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
            onClick={() => setError(null)}
          >
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <title>Close</title>
              <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
            </svg>
          </span>
        </div>
      )}

      {loadingMore && (
        <div className="text-center py-2 text-gray-600">
          Loading more messages...
        </div>
      )}

      <div ref={topElementRef} />

      {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
        <div key={dateKey} className="mb-6">
          <div className="text-center mb-4">
            <span className="bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm">
              {formatMessageDate(new Date(dateKey))}
            </span>
          </div>

          {dateMessages.map((message) => (
            <div
              key={`message-wrapper-${message.id}`}
              className={`flex flex-col mb-4 ${
                message.senderId === currentUserId ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.senderId === currentUserId
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <p className="break-words">{message.text}</p>
                
                {message.attachment && (
                <div className="mt-2" key={`attachment-${message.id}`}>
                    {message.attachment.type === 'image' ? (
                      <img 
                        src={message.attachment.url} 
                        alt={message.attachment.name}
                        className="max-w-full rounded"
                        onError={(e) => {
                          console.error('Error loading image:', e);
                          e.currentTarget.src = 'placeholder-image-url';
                        }}
                      />
                    ) : message.attachment.type === 'video' ? (
                      <video 
                        src={message.attachment.url} 
                        controls 
                        className="max-w-full rounded"
                        onError={(e) => {
                          console.error('Error loading video:', e);
                          e.currentTarget.src = 'placeholder-video-url';
                        }}
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

                <div className={`text-xs mt-1 ${
                  message.senderId === currentUserId 
                    ? 'text-blue-100' 
                    : 'text-gray-500'
                }`}>
                  {formatMessageTime(message.timestamp)}
                  {message.senderId === currentUserId && (
                    <span className={`ml-2 ${
                      message.status === 'read' 
                        ? 'text-blue-200' 
                        : 'text-gray-400'
                    }`}>
                      {message.status === 'read' ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default MessageList;