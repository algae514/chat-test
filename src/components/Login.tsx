import React, { useState } from 'react';

interface LoginProps {
  onLogin: (phoneNumber: string) => void;
  panelId: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, panelId }) => {
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:9091/aluminiapp/v2/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await response.json();
      onLogin(data.user.phoneNumber);
      localStorage.setItem(`${panelId}_token`, data.accessToken);
      localStorage.setItem(`${panelId}_user`, JSON.stringify(data.user));
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div className="login-form">
      <input
        type="text"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="Enter phone number"
      />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
};

export default Login;