import React from 'react';
import { CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface LoadingFallbackProps {
  message?: string;
  compact?: boolean;
}

export const LoadingFallback: React.FC<LoadingFallbackProps> = ({
  message = 'Loading...',
  compact = false,
}) => {
  if (compact) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100px',
          padding: '16px 0',
        }}
      >
        <CircularProgress size={24} style={{ color: '#6366F1' }} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        padding: '24px',
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress
          size={48}
          thickness={4}
          style={{
            color: '#6366F1',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366F1 0%, #EC4899 100%)',
            opacity: 0.2,
          }}
        />
      </div>
      <Typography
        variant="body2"
        style={{
          marginTop: '16px',
          color: '#6B7280',
          fontWeight: 500,
        }}
      >
        {message}
      </Typography>
    </motion.div>
  );
};
