# Firebase Project Setup Guide for Chat Application

This guide will walk you through setting up a Firebase project to use with the chat application. Follow these steps in order to properly configure all required services.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" (or "Create project")
3. Enter a project name
4. Choose whether to enable Google Analytics (recommended)
5. Accept the terms and click "Create Project"

## 2. Configure Authentication

1. In Firebase Console, click "Authentication" in the left sidebar
2. Click "Get Started"
3. In the "Sign-in method" tab, enable the following providers:
   - Phone Number (required for phone authentication)
   - Custom Authentication (required for backend token generation)

### Phone Authentication Setup
1. Add a phone number for testing
2. Add SHA-1 fingerprint for your Android app (if applicable)
3. Enable "Automatic verification" if desired

## 3. Set Up Firestore Database

1. Click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose either production mode or test mode (you can modify rules later)
4. Select a location closest to your users
5. Click "Enable"

### Configure Firestore Rules
1. Go to the "Rules" tab in Firestore
2. Replace the existing rules with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
3. Click "Publish"

## 4. Set Up Firebase Storage

1. Click "Storage" in the left sidebar
2. Click "Get Started"
3. Choose a location for your storage bucket
4. Click "Next" and "Done"

### Configure Storage Rules
1. Go to the "Rules" tab in Storage
2. Replace the existing rules with:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
3. Click "Publish"

### Configure CORS
1. Install Google Cloud SDK following the [official documentation](https://cloud.google.com/sdk/docs/install)
2. Create a file named `cors.json` with the following content:
```json
[
  {
    "origin": ["http://localhost:5173", "YOUR_PRODUCTION_DOMAIN"],
    "method": ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "User-Agent",
      "x-goog-resumable",
      "x-goog-*",
      "x-firebase-*",
      "Accept",
      "Accept-Encoding",
      "Accept-Language",
      "Access-Control-Allow-Origin",
      "Access-Control-Allow-Methods",
      "Access-Control-Allow-Headers",
      "Access-Control-Max-Age",
      "Access-Control-Allow-Credentials"
    ]
  }
]
```
3. Open terminal and run:
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gsutil cors set cors.json gs://YOUR_STORAGE_BUCKET
```
Replace `YOUR_PROJECT_ID` with your Firebase project ID and `YOUR_STORAGE_BUCKET` with your storage bucket name (found in Storage settings).

## 5. Get Firebase Configuration

1. Click the gear icon next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps"
4. Click the web icon (</>)
5. Register your app with a nickname
6. Copy the provided firebaseConfig object:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## 6. Update Application Code

1. Create a file named `firebase.ts` in your project's `src/services` directory
2. Replace the existing Firebase configuration with your new configuration:
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Paste your Firebase configuration here
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const signInWithFirebaseToken = async (token: string) => {
  try {
    const userCredential = await signInWithCustomToken(auth, token);
    return userCredential.user;
  } catch (error) {
    console.error('Firebase authentication error:', error);
    throw error;
  }
};
```

## 7. Environment Setup (Optional but Recommended)

1. Create a `.env` file in your project root
2. Add your Firebase configuration as environment variables:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

3. Update `firebase.ts` to use environment variables:
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

## 8. Testing the Setup

1. Start your development server
2. Try logging in with a phone number
3. Send a text message
4. Upload a file
5. Verify that messages and files appear in both chat panels

## Common Issues and Troubleshooting

1. CORS Errors
   - Verify the storage bucket name in Firebase config matches the actual bucket
   - Ensure CORS configuration includes your domain
   - Check that all required headers are included in CORS config

2. Authentication Errors
   - Verify phone authentication is enabled
   - Check if custom authentication is enabled
   - Ensure the Firebase token is being generated correctly by your backend

3. Storage Upload Issues
   - Verify Storage Rules allow authenticated uploads
   - Check if the file size is within limits (default 5MB)
   - Ensure the correct storage bucket is being used

4. Firestore Access Issues
   - Verify Firestore Rules allow authenticated access
   - Check if the database is initialized
   - Ensure the user is properly authenticated

## Security Considerations

1. Always keep your Firebase configuration secure
2. Never commit `.env` files to version control
3. Regularly review and update Security Rules
4. Monitor Firebase Console for any unusual activity
5. Implement proper rate limiting in your backend

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Cloud Storage for Firebase](https://firebase.google.com/docs/storage)
- [Cloud Firestore](https://firebase.google.com/docs/firestore)
