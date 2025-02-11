import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { UserProfile } from '../types';

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.error('User not found:', userId);
      return null;
    }

    const userData = userDoc.data();
    return {
      userId: userDoc.id,
      name: userData.displayName || 'Unknown User',
      phoneNumber: userData.phoneNumber || '',
      profilePictureUrl: userData.profilePictureUrl,
      currentPosition: userData.currentPosition || '',
      isOnline: userData.isOnline || false,
      lastSeen: userData.lastSeen || null
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};
