# Chat Application Implementation Guide

## 1. Database Schema (Firestore)

### Efficient Single-Collection Structure
```typescript
// Users Collection
users/
  {userId}/                  // User's document ID
    profile: {
      phoneNumber: string,
      lastSeen: timestamp,
      isOnline: boolean,
      displayName?: string
    }

// Chats Collection (Shared between users)
chats/
  {chatId}/                  // Combined userIds (e.g., 'user1_user2')
    metadata: {
      participants: string[],
      lastMessage: string,
      lastMessageTime: timestamp,
      lastMessageId: string
    }
    messages/                // Messages subcollection
      {messageId}: {         // Individual message
        id: string,
        text: string,
        senderId: string,
        timestamp: timestamp,
        status: 'sent' | 'read',
        attachment?: {       // Optional attachment
          url: string,
          type: string,     // 'image' | 'video' | 'document'
          name: string,
          size: number
        }
      }

// User Chat Metadata (for unread counts and quick access)
users/
  {userId}/
    chatMeta/
      {chatId}: {
        unreadCount: number,
        lastRead: timestamp
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
  participants: string[];
  lastMessage: string;
  lastMessageTime: Date;
  lastMessageId: string;
}

interface UserChatMetadata {
  unreadCount: number;
  lastRead: Date;
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
  status: 'sent' | 'read';
  attachment?: Attachment;
}

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  hasMore: boolean;
  error?: string;
}
```

## 3. Message Operations

### Sending Messages
```typescript
const sendMessage = async (
  userId: string,
  otherUserId: string,
  text: string,
  attachment?: File
): Promise<string> => {
  const chatId = getChatId(userId, otherUserId);
  const messageId = doc(collection(db, 'messages')).id;
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
    const attachmentData = await uploadAttachment(chatId, messageId, attachment);
    messageData.attachment = attachmentData;
  }

  const batch = writeBatch(db);

  // Add message to shared chat collection
  batch.set(
    doc(db, 'chats', chatId, 'messages', messageId),
    messageData
  );

  // Update unread count for recipient
  batch.set(
    doc(db, 'users', otherUserId, 'chatMeta', chatId),
    {
      unreadCount: increment(1),
    },
    { merge: true }
  );

  await batch.commit();
  return messageId;
};
```

### Reading Messages
```typescript
const subscribeToMessages = (
  chatId: string,
  callback: (messages: Message[]) => void,
  limit: number = 25
) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages');
  const q = query(
    messagesRef,
    orderBy('timestamp', 'desc'),
    limit(limit)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      timestamp: doc.data().timestamp?.toDate()
    }));
    callback(messages);
  });
};
```

### Marking Messages as Read
```typescript
const markMessagesAsRead = async (
  userId: string,
  chatId: string
) => {
  const batch = writeBatch(db);

  // Reset unread count
  batch.set(
    doc(db, 'users', userId, 'chatMeta', chatId),
    { 
      lastRead: serverTimestamp(),
      unreadCount: 0
    },
    { merge: true }
  );

  await batch.commit();
};
```

## 4. File Handling

### Attachment Validation
```typescript
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
```

### Attachment Upload
```typescript
const uploadAttachment = async (
  chatId: string,
  messageId: string,
  file: File
): Promise<Attachment> => {
  validateFile(file);

  const path = `attachments/${chatId}/${messageId}/${file.name}`;
  const storageRef = ref(storage, path);
  
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return {
    url,
    name: file.name,
    size: file.size,
    type: file.type.startsWith('image/') 
      ? 'image' 
      : file.type.startsWith('video/') 
        ? 'video' 
        : 'document'
  };
};
```

## 5. User Status Management

```typescript
const updateOnlineStatus = async (
  userId: string,
  isOnline: boolean
) => {
  await setDoc(
    doc(db, 'users', userId),
    {
      isOnline,
      lastSeen: serverTimestamp()
    },
    { merge: true }
  );
};
```

## 6. Performance Considerations

1. Single Collection Benefits:
   - Reduced data duplication
   - Simplified synchronization
   - Lower storage costs
   - Better consistency

2. Batch Operations:
   - Use writeBatch for related operations
   - Ensure atomic updates
   - Handle failures gracefully

3. Efficient Queries:
   - Use compound indexes where needed
   - Implement pagination
   - Optimize listener attachments

4. Caching Strategy:
   - Cache messages locally
   - Implement offline support
   - Handle reconnection gracefully

## 7. Security Rules

```typescript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Chat messages
    match /chats/{chatId} {
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/chats/$(chatId)/metadata/participants/$(request.auth.uid));
      
      allow write: if request.auth != null && 
        exists(/databases/$(database)/documents/chats/$(chatId)/metadata/participants/$(request.auth.uid));

      match /messages/{messageId} {
        allow read: if request.auth != null && 
          exists(/databases/$(database)/documents/chats/$(chatId)/metadata/participants/$(request.auth.uid));
        
        allow create: if request.auth != null && 
          exists(/databases/$(database)/documents/chats/$(chatId)/metadata/participants/$(request.auth.uid)) &&
          request.resource.data.senderId == request.auth.uid;
      }
    }
  }
}
```

## 8. Error Handling

Implement proper error handling for:
1. Network disconnections
2. Message send failures
3. File upload errors
4. Authentication errors
5. Permission denied errors

## 9. Testing Requirements

Test cases should cover:
1. Message operations (send, receive, read status)
2. File uploads and downloads
3. Real-time updates and synchronization
4. Error scenarios and recovery
5. Security rules validation
6. Performance under load
