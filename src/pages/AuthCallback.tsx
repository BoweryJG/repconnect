import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Typography } from '@mui/material';
import { supabase } from '../lib/supabase';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simple auth callback - let Supabase handle everything
    const handleAuthCallback = async () => {
      try {
        // Just wait a bit for Supabase to process the URL
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Force redirect to home - the auth context will handle the rest
        window.location.href = '/';
      } catch (err) {
        setError('Authentication failed');
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0A0B',
      }}
    >
      {error ? (
        <>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#ff6b6b', mb: 2 }}>
            Authentication Error
          </Typography>
          <Typography
            sx={{ opacity: 0.9, textAlign: 'center', maxWidth: 400, color: '#ff6b6b', mb: 1 }}
          >
            {error}
          </Typography>
          <Typography sx={{ opacity: 0.7, textAlign: 'center', fontSize: '14px' }}>
            Redirecting to login...
          </Typography>
        </>
      ) : (
        <>
          <CircularProgress size={60} sx={{ color: '#4B96DC', mb: 3 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
            Completing authentication...
          </Typography>
          <Typography sx={{ opacity: 0.7, textAlign: 'center', maxWidth: 400 }}>
            Please wait while we securely sign you in
          </Typography>
        </>
      )}
    </div>
  );
};
