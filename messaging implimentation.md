# Chat Application Implementation Guide

## 1. Database Schema (Firestore)

### User Data Structure
```typescript
users/
  {userId}/                  // User's document ID
    profile: {
      phoneNumber: string,
      lastSeen: timestamp,
      isOnline: boolean,
      displayName?: string
    }
    chats/                   // User's chats collection
      {otherUserId}/         // Other user's ID
        lastMessage: string,
        lastMessageTime: timestamp,
        lastMessageId: string,
        unreadCount: number,
        messages/            // Messages subcollection
          {messageId}: {     // Individual message
            id: string,
            text: string,
            senderId: string,
            timestamp: timestamp,
            status: 'sent' | 'delivered' | 'read',
            attachment?: {    // Optional attachment
              url: string,
              type: string,  // 'image' | 'video' | 'document'
              name: string,
              size: number
            }
          }
```

## 2. Type Definitions

```typescript
// src/types/chat.ts

interface User {
  id: string;
  phoneNumber: string;
  lastSeen: Date;
  isOnline: boolean;
  displayName?: string;
}

interface ChatMetadata {
  lastMessage: string;
  lastMessageTime: Date;
  lastMessageId: string;
  unreadCount: number;
}

interface Attachment {
  url: string;
  type: 'image' | 'video' | 'document';
  name: string;
  size: number;
}

interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  attachment?: Attachment;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  error?: string;
}
```

## 3. Component Structure

### Required Components

1. `ChatContainer`: Main wrapper component
2. `ChatList`: Shows list of chats
3. `ChatPanel`: Individual chat window
4. `MessageList`: Messages display area
5. `MessageInput`: Message input with attachment handling
6. `MessageItem`: Individual message display

## 4. Component Implementation Details

### ChatPanel Component

```typescript
interface ChatPanelProps {
  userId: string;
  otherUserId: string;
  onClose?: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ userId, otherUserId, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 25;

  useEffect(() => {
    const messagesRef = collection(
      db, 
      'users', 
      userId, 
      'chats', 
      otherUserId, 
      'messages'
    );
    
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(pageSize)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));

      setMessages(newMessages);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);
    });

    return () => unsubscribe();
  }, [userId, otherUserId]);

  const loadMoreMessages = async () => {
    if (!lastDoc || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const messagesRef = collection(
        db, 
        'users', 
        userId, 
        'chats', 
        otherUserId, 
        'messages'
      );
      
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const olderMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));

      setMessages(prev => [...prev, ...olderMessages]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === pageSize);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader 
        otherUserId={otherUserId} 
        onClose={onClose}
      />
      <MessageList 
        messages={messages}
        currentUserId={userId}
        onLoadMore={loadMoreMessages}
        isLoading={isLoading}
      />
      <MessageInput 
        onSend={handleSendMessage} 
      />
    </div>
  );
};
```

### MessageList Component

```typescript
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

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4"
    >
      {/* Loading indicator */}
      {loadingMore && (
        <div className="text-center py-2">Loading...</div>
      )}

      {/* Intersection observer target */}
      <div ref={topElementRef} />

      {/* Messages */}
      {messages.map((message, index) => (
        <MessageItem
          key={message.id}
          message={message}
          isOwn={message.senderId === currentUserId}
          showDate={shouldShowDate(message, messages[index - 1])}
        />
      ))}
    </div>
  );
};
```

## 5. Sending Messages

```typescript
const sendMessage = async (
  userId: string, 
  otherUserId: string, 
  text: string, 
  attachment?: File
) => {
  const messageId = doc(collection(db, 'users')).id;
  const timestamp = serverTimestamp();
  
  const messageData: any = {
    id: messageId,
    text,
    senderId: userId,
    timestamp,
    status: 'sent'
  };

  // Handle attachment if present
  if (attachment) {
    const attachmentData = await uploadAttachment(userId, messageId, attachment);
    messageData.attachment = attachmentData;
  }

  const batch = writeBatch(db);
  
  // Add message to sender's shard
  batch.set(
    doc(db, 'users', userId, 'chats', otherUserId, 'messages', messageId),
    messageData
  );
  
  // Add message to recipient's shard
  batch.set(
    doc(db, 'users', otherUserId, 'chats', userId, 'messages', messageId),
    messageData
  );
  
  // Update chat metadata for both users
  const chatData = {
    lastMessage: text,
    lastMessageTime: timestamp,
    lastMessageId: messageId
  };
  
  batch.set(
    doc(db, 'users', userId, 'chats', otherUserId),
    chatData,
    { merge: true }
  );
  
  batch.set(
    doc(db, 'users', otherUserId, 'chats', userId),
    { ...chatData, unreadCount: increment(1) },
    { merge: true }
  );

  await batch.commit();
  return messageId;
};
```

## 6. CSS Requirements

The UI should implement these key styles:

1. Message bubbles with different colors for sent/received
2. Smooth scrolling behavior
3. Loading indicators
4. Proper spacing between message groups
5. File attachment previews
6. Timestamps and read receipts

Example message bubble styles:
```css
.message-bubble {
  @apply rounded-lg p-3 max-w-[70%] break-words;
}

.message-own {
  @apply bg-blue-500 text-white ml-auto;
}

.message-other {
  @apply bg-gray-200 text-gray-800;
}

.message-status {
  @apply text-xs text-gray-500 mt-1;
}
```

## 7. Required APIs

1. Message Operations:
   - Send message
   - Load messages (paginated)
   - Mark messages as read
   - Delete message (optional)

2. Chat Operations:
   - Get chat list
   - Start new chat
   - Archive chat (optional)

3. User Operations:
   - Get user profile
   - Update online status
   - Update last seen

## 8. Performance Considerations

1. Message Pagination:
   - Load 25 messages initially
   - Implement infinite scroll
   - Cache loaded messages

2. Real-time Updates:
   - Use Firestore listeners efficiently
   - Handle offline support

3. Attachment Handling:
   - Compress images before upload
   - Show preview while uploading
   - Cache downloaded files

## 9. Error Handling

Implement proper error handling for:
1. Network issues
2. Message send failures
3. File upload errors
4. Loading errors

## 10. Testing Requirements

Test cases should cover:
1. Message sending/receiving
2. Pagination
3. Real-time updates
4. Attachment handling
5. Error scenarios