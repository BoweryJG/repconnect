import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, AlertColor, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

interface FeedbackMessage {
  id: string;
  message: string;
  severity: AlertColor;
  duration?: number;
}

// Global feedback queue
let feedbackQueue: FeedbackMessage[] = [];
let feedbackListeners: ((messages: FeedbackMessage[]) => void)[] = [];

const notifyListeners = () => {
  feedbackListeners.forEach((listener) => listener([...feedbackQueue]));
};

// Global function to show feedback
export const showFeedback = (message: string, severity: AlertColor = 'info', duration?: number) => {
  const feedback: FeedbackMessage = {
    id: `${Date.now()}-${Math.random()}`,
    message,
    severity,
    duration,
  };

  feedbackQueue.push(feedback);
  notifyListeners();
};

// Convenience methods
export const showError = (message: string, duration?: number) =>
  showFeedback(message, 'error', duration);

export const showSuccess = (message: string, duration?: number) =>
  showFeedback(message, 'success', duration);

export const showWarning = (message: string, duration?: number) =>
  showFeedback(message, 'warning', duration);

export const showInfo = (message: string, duration?: number) =>
  showFeedback(message, 'info', duration);

// Component to display feedback
export const UserFeedback: React.FC = () => {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [open, setOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<FeedbackMessage | null>(null);

  useEffect(() => {
    const listener = (newMessages: FeedbackMessage[]) => {
      setMessages(newMessages);
    };

    feedbackListeners.push(listener);

    return () => {
      feedbackListeners = feedbackListeners.filter((l) => l !== listener);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0 && !currentMessage) {
      // Show the first message in queue
      const [first, ...rest] = messages;
      setCurrentMessage(first);
      setOpen(true);
      feedbackQueue = rest;
      notifyListeners();
    }
  }, [messages, currentMessage]);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  const handleExited = () => {
    setCurrentMessage(null);
  };

  if (!currentMessage) return null;

  return (
    <Snackbar
      open={open}
      autoHideDuration={currentMessage.duration || 6000}
      onClose={handleClose}
      TransitionProps={{ onExited: handleExited }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={handleClose}
        severity={currentMessage.severity}
        variant="filled"
        sx={{
          width: '100%',
          maxWidth: '600px',
          boxShadow: 3,
        }}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
            <Close fontSize="small" />
          </IconButton>
        }
      >
        {currentMessage.message}
      </Alert>
    </Snackbar>
  );
};

// Hook for programmatic feedback
export const useFeedback = () => {
  return {
    showFeedback,
    showError,
    showSuccess,
    showWarning,
    showInfo,
  };
};
