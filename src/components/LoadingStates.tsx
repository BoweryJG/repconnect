import React from 'react';
import { CircularProgress, Skeleton, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  size?: number;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 40, message }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '24px',
    }}
  >
    <CircularProgress size={size} />
    {message && (
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    )}
  </div>
);

interface ChatLoadingProps {
  count?: number;
}

export const ChatMessageSkeleton: React.FC<ChatLoadingProps> = ({ count = 3 }) => (
  <div style={{ padding: '16px' }}>
    {Array.from({ length: count }).map((_, index) => (
      <div
        key={index}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          marginBottom: '16px',
          flexDirection: index % 2 === 0 ? 'row' : 'row-reverse',
        }}
      >
        <Skeleton variant="circular" width={40} height={40} sx={{ mx: 1 }} />
        <div style={{ flex: 1, maxWidth: '70%' }}>
          <Skeleton variant="rounded" height={60} sx={{ mb: 0.5 }} />
          <Skeleton variant="text" width={80} />
        </div>
      </div>
    ))}
  </div>
);

export const AgentCardSkeleton: React.FC = () => (
  <div style={{ padding: '16px' }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
      <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="text" width="40%" height={20} />
      </div>
    </div>
    <Skeleton variant="rounded" height={80} sx={{ mb: 2 }} />
    <div style={{ display: 'flex', gap: '8px' }}>
      <Skeleton variant="rounded" width={80} height={36} />
      <Skeleton variant="rounded" width={80} height={36} />
    </div>
  </div>
);

interface FullPageLoadingProps {
  message?: string;
}

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({ message = 'Loading...' }) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      zIndex: 9999,
    }}
  >
    <LoadingSpinner size={60} message={message} />
  </div>
);
