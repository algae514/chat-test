import axios from 'axios';
import { signInWithFirebaseToken } from './firebase';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  firebaseToken: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    phoneNumber: string;
    role: string;
    roles: string[];
    profilePictureUrl?: string;
  };
}

const API_URL = 'http://localhost:9091/aluminiapp/v2';

export const login = async (phoneNumber: string) => {
  try {
    const response = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
      phoneNumber
    });

    const { firebaseToken } = response.data;
    
    await signInWithFirebaseToken(firebaseToken);
    
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};