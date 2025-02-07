import React, { useState } from 'react';
import axios from 'axios';
import { signInWithFirebaseToken } from '../../services/firebase';

interface LoginFormProps {
  panelId: string;
  onLoginSuccess: (accessToken: string, firebaseToken: string, userId: string) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ panelId, onLoginSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState(panelId === '1' ? '9346657275' : '');
  const [error, setError] = useState('');

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:9091/aluminiapp/v2/auth/login', { 
        username: phoneNumber
      });
      
      const { accessToken, firebaseToken } = response.data;
      const user = await signInWithFirebaseToken(firebaseToken);
      onLoginSuccess(accessToken, firebaseToken, user.uid);
      setError('');
    } catch (err) {
      let errorMessage = 'Authentication failed. Please try again.';
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 404) {
          errorMessage = 'Backend service not reachable. Please check if the service is running.';
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err instanceof Error) {
        errorMessage = `Firebase error: ${err.message}`;
      }
      setError(errorMessage);
      console.error('Full error:', err);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handlePhoneLogin} className="space-y-4">
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number"
          className="w-full p-2 border rounded"
          required
        />
        <button 
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Login
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
};

export default LoginForm;