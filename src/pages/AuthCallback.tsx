import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Box, Typography } from '@mui/material';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase will handle the auth callback automatically
    // We just need to redirect back to the main app
    setTimeout(() => {
      navigate('/');
    }, 1000);
  }, [navigate]);

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0A0B',
      }}
    >
      <CircularProgress size={60} sx={{ color: '#4B96DC', mb: 3 }} />
      <Typography variant="h6" sx={{ color: 'text.secondary' }}>
        Completing authentication...
      </Typography>
    </Box>
  );
};