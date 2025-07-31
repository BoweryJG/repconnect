import React from 'react';
import { Box, CircularProgress, Skeleton, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 40, message }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      p: 3,
    }}
  >
    <CircularProgress size={size} />
    {message && (
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    )}
  </Box>
);

interface ChatLoadingProps {
  count?: number;
}

export const ChatMessageSkeleton: React.FC<ChatLoadingProps> = ({ count = 3 }) => (
  <Box sx={{ p: 2 }}>
    {Array.from({ length: count }).map((_, index) => (
      <Box
        key={index}
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          mb: 2,
          flexDirection: index % 2 === 0 ? 'row' : 'row-reverse',
        }}
      >
        <Skeleton variant="circular" width={40} height={40} sx={{ mx: 1 }} />
        <Box sx={{ flex: 1, maxWidth: '70%' }}>
          <Skeleton variant="rounded" height={60} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={80} />
        </Box>
      </Box>
    ))}
  </Box>
);

export const AgentCardSkeleton: React.FC = () => (
  <Box sx={{ p: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" width="40%" height={20} />
      </Box>
    </Box>
    <Skeleton variant="rounded" height={80} sx={{ mb: 2 }} />
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Skeleton variant="rounded" width={80} height={36} />
      <Skeleton variant="rounded" width={80} height={36} />
    </Box>
  </Box>
);

interface FullPageLoadingProps {
  message?: string;
}

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({ message = 'Loading...' }) => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
      zIndex: 9999,
    }}
  >
    <LoadingSpinner size={60} message={message} />
  </Box>
);
