import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  LinearProgress,
  Box,
} from '@mui/material';
import { Warning } from '@mui/icons-material';

interface SessionWarningProps {
  open: boolean;
  timeLeft: number;
  onExtend: () => void;
  onLogout: () => void;
}

const SessionWarning: React.FC<SessionWarningProps> = ({ open, timeLeft, onExtend, onLogout }) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = (timeLeft / 300) * 100; // 5 minutes = 300 seconds

  return (
    <Dialog
      open={open}
      onClose={() => {}} // Prevent closing by clicking outside
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Warning style={{ color: '#ff9800' }} />
          <Typography variant="h6">Session Expiring Soon</Typography>
        </div>
      </DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          Your session will expire in {formatTime(timeLeft)} due to inactivity. Would you like to
          continue working?
        </Typography>
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 2, mb: 1 }} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onLogout} color="secondary">
          Log Out
        </Button>
        <Button onClick={onExtend} variant="contained" color="primary" autoFocus>
          Continue Session
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SessionWarning;
