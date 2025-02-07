import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCJNscGO-DgxAJo97TYzBRZN-A3fMxv5NE",
  authDomain: "tnscchat.firebaseapp.com",
  projectId: "tnscchat",
  storageBucket: "tnscchat.firebasestorage.app",
  messagingSenderId: "1044736197210",
  appId: "1:1044736197210:web:d5e975c8f56a9e9634bd66"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const signInWithFirebaseToken = async (token: string) => {
  try {
    console.log('Attempting to sign in with token:', token.substring(0, 20) + '...');
    const userCredential = await signInWithCustomToken(auth, token);
    console.log('Sign in successful, user:', {
      uid: userCredential.user.uid,
      email: userCredential.user.email,
      phoneNumber: userCredential.user.phoneNumber
    });
    return userCredential.user;
  } catch (error) {
    console.error('Firebase authentication error:', {
      code: error.code,
      message: error.message,
      fullError: error
    });
    throw error;
  }
};