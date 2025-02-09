import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { styled } from '@mui/material/styles';
import { login } from '../../services/auth';

interface LoginFormProps {
  panelId: string;
  onLoginSuccess: (accessToken: string, firebaseToken: string, userId: string) => void;
}

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
  maxWidth: '400px',
  margin: '20px auto',
  borderRadius: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
}));

const LoginForm: React.FC<LoginFormProps> = ({ panelId, onLoginSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use the auth service instead of direct fetch
      const response = await login(phoneNumber);
      
      onLoginSuccess(
        response.accessToken, 
        response.firebaseToken, 
        response.user.id
      );
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StyledPaper elevation={0}>
      <Typography variant="h6" component="h2" gutterBottom>
        Chat Panel {panelId}
      </Typography>
      
      <Box component="form" onSubmit={handleLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth
          label="Phone Number"
          variant="outlined"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number"
          size="small"
          required
          InputProps={{
            sx: {
              borderRadius: '8px',
            }
          }}
        />
        
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isLoading || !phoneNumber}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            py: 1,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: 'none',
              backgroundColor: '#1565c0',
            }
          }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>

        {error && (
          <Alert severity="error" sx={{ borderRadius: '8px' }}>
            {error}
          </Alert>
        )}
      </Box>
    </StyledPaper>
  );
};

export default LoginForm;