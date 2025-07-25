import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Typography } from '@mui/material';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase handles the OAuth callback automatically
    // Just redirect to home and let AuthContext handle the session
    setTimeout(() => {
      navigate('/');
    }, 100);
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
      <CircularProgress size={60} sx={{ color: '#4B96DC', mb: 3 }} />
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
        Completing authentication...
      </Typography>
    </div>
  );
};
