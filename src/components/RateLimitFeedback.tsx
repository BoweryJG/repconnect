import React, { useState, useEffect } from 'react';
import { Alert, LinearProgress, Typography } from '@mui/material';
import { rateLimiter } from '../utils/rateLimiter';

interface RateLimitFeedbackProps {
  isAI?: boolean;
  onReset?: () => void;
}

export const RateLimitFeedback: React.FC<RateLimitFeedbackProps> = ({ isAI = false, onReset }) => {
  const [status, setStatus] = useState(rateLimiter.getStatus(isAI));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const newStatus = rateLimiter.getStatus(isAI);
      setStatus(newStatus);

      // Calculate progress (0-100)
      if (newStatus.resetIn > 0) {
        const windowMs = isAI ? 15 * 60 * 1000 : 15 * 60 * 1000; // 15 minutes
        const elapsed = windowMs - newStatus.resetIn;
        setProgress((elapsed / windowMs) * 100);
      } else {
        setProgress(0);
        if (onReset) onReset();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAI, onReset]);

  if (status.remaining > 0) {
    return null;
  }

  const resetTime = rateLimiter.formatResetTime(status.resetIn);

  return (
    <div style={{ width: '100%', marginTop: '16px' }}>
      <Alert severity="warning" sx={{ mb: 1 }}>
        <Typography variant="body2" gutterBottom>
          Rate limit reached ({status.limit} requests per 15 minutes)
        </Typography>
        <Typography variant="caption">Resets in {resetTime}</Typography>
      </Alert>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 6,
          borderRadius: 3,
          backgroundColor: 'rgba(255, 167, 38, 0.2)',
          '& .MuiLinearProgress-bar': {
            backgroundColor: '#ff9800',
          },
        }}
      />
    </div>
  );
};

// Hook for rate limit status
export const useRateLimitStatus = (isAI: boolean = false) => {
  const [status, setStatus] = useState(rateLimiter.getStatus(isAI));

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(rateLimiter.getStatus(isAI));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [isAI]);

  return status;
};
