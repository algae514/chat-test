# Chat Test App - Minimal Guide 🎮

## What This App Does
This is a test app that lets you have two chat panels side by side in one window. Think of it like having two phones next to each other, where each "phone" can log in and chat with the other one.

## Main Parts of the App

### 1. Login Flow 📱
```javascript
// When someone enters their phone number:
1. User types phone number
2. App sends it to: http://localhost:9091/aluminiapp/v2/auth/login
3. Backend gives us two important keys:
   - accessToken (like a hall pass)
   - firebaseToken (like a special key for Firebase)
```

### 2. Chat Setup 💬
```javascript
// After login, here's what happens:
1. App uses firebaseToken to connect to Firebase
2. Each chat panel gets its own connection
3. Messages are stored in Firebase's Firestore database
```

### 3. How to Send Messages 📨
```javascript
// To send a message:
1. Type message in the panel
2. App saves it to Firestore like this:
{
  text: "Hello!",
  senderId: "your_user_id",
  timestamp: now(),
  participants: [senderId, receiverId]
}
```

### 4. How to Receive Messages 📩
```javascript
// To get messages:
1. App listens to Firestore changes
2. When new message arrives, it shows up automatically
3. No need to refresh!
```

## Cool Features to Try

### 1. File Sharing 📎
```javascript
// To share a file:
1. Click attachment button
2. Pick a file (max 5MB)
3. App uploads to Firebase Storage
4. Sends message with file link
```

### 2. User Search 🔍
```javascript
// To find someone to chat with:
1. Type in search box
2. App searches backend API
3. Click on a user to start chat
```

## API Endpoints You'll Use

1. **Login API**
```javascript
POST http://localhost:9091/aluminiapp/v2/auth/login
Body: { phoneNumber: "+1234567890" }
// Gives you tokens for authentication
```

2. **User Search API**
```javascript
GET http://localhost:9091/aluminiapp/v2/profile/search
Headers: { Authorization: "Bearer your_access_token" }
Params: { displayName: "search term" }
// Finds users to chat with
```

## Firebase Magic ✨

1. **Messages Collection**
```javascript
// Your messages in Firestore look like:
{
  senderId: "user123",
  text: "Hello!",
  timestamp: serverTimestamp(),
  participants: ["user123", "user456"]
}
```

2. **Listening for Messages**
```javascript
// This code shows new messages instantly:
const q = query(
  collection(db, 'messages'),
  where('participants', '==', [userId1, userId2].sort()),
  orderBy('timestamp', 'asc')
);

onSnapshot(q, (snapshot) => {
  // Messages appear magically! 🎩
  const messages = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
});
```

## Tips & Tricks 🌟

1. **Always Remember**
   - Keep access tokens safe
   - Handle errors nicely
   - Check file sizes before upload

2. **Testing Made Easy**
   - Use both panels to test chat
   - Try sending different message types
   - Test what happens when connection is lost

3. **Common Gotchas**
   - Don't forget to sort participant IDs
   - Always validate file types
   - Handle phone number format correctly

Need to try it out? Just:
1. Start the backend server
2. Run `npm start`
3. Open `localhost:3000`
4. Log in with two different numbers
5. Start chatting! 

Now you're ready to play with the chat app! Remember, the left and right panels are completely separate - like two different phones. Have fun testing! 🎉

Want to see the error outputs while you're testing? Keep your browser's console open (F12) to see what's happening behind the scenes! 

Need more help? The code has lots of comments! 😊