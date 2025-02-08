import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  IconButton, 
  Alert,
  styled,
} from '@mui/material';
import { 
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Close as CloseIcon 
} from '@mui/icons-material';
import type { FileAttachment } from '../../types';

interface MessageInputProps {
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  pendingAttachment: FileAttachment | null;
  onPendingAttachmentClear: () => void;
  userId: string;
  onFileUploadComplete: (attachment: FileAttachment) => void;
  onFileUploadError: (error: string) => void;
  error: string;
}

const StyledInputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  padding: theme.spacing(2),
  backgroundColor: '#fff',
  borderTop: '1px solid',
  borderColor: theme.palette.divider,
  alignItems: 'center',
}));

const StyledInput = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '20px',
    backgroundColor: '#f5f5f5',
    '& fieldset': {
      border: 'none',
    },
    '&:hover fieldset': {
      border: 'none',
    },
    '&.Mui-focused fieldset': {
      border: 'none',
    },
  },
});

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  onMessageChange,
  onSendMessage,
  pendingAttachment,
  onPendingAttachmentClear,
  userId,
  onFileUploadComplete,
  onFileUploadError,
  error,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Handle file upload logic here
      const attachment: FileAttachment = {
        name: file.name,
        type: file.type,
        url: 'mock-url', // Replace with actual upload logic
        size: file.size,
      };
      onFileUploadComplete(attachment);
    } catch (err) {
      onFileUploadError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Box sx={{ mt: 'auto' }}>
      {error && (
        <Alert 
          severity="error" 
          sx={{ m: 1 }}
          action={
            <IconButton
              size="small"
              onClick={() => onFileUploadError('')}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {error}
        </Alert>
      )}
      
      {pendingAttachment && (
        <Box sx={{ 
          p: 1, 
          m: 1, 
          bgcolor: 'grey.100', 
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>📎 {pendingAttachment.name}</span>
          <IconButton size="small" onClick={onPendingAttachmentClear}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <StyledInputContainer>
        <input
          type="file"
          id={`file-input-${userId}`}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <IconButton
          component="label"
          htmlFor={`file-input-${userId}`}
          disabled={isUploading}
          color="primary"
          sx={{ 
            '&:hover': { 
              backgroundColor: 'rgba(25, 118, 210, 0.04)' 
            }
          }}
        >
          <AttachFileIcon />
        </IconButton>

        <StyledInput
          fullWidth
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          size="small"
          multiline
          maxRows={4}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSendMessage(e);
            }
          }}
        />

        <IconButton
          onClick={onSendMessage}
          disabled={!newMessage.trim() && !pendingAttachment}
          color="primary"
          sx={{
            backgroundColor: '#1976d2',
            color: 'white',
            '&:hover': {
              backgroundColor: '#1565c0',
            },
            '&.Mui-disabled': {
              backgroundColor: '#e0e0e0',
              color: '#9e9e9e',
            },
          }}
        >
          <SendIcon />
        </IconButton>
      </StyledInputContainer>
    </Box>
  );
};

export default MessageInput;