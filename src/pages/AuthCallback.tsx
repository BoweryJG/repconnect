import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Typography } from '@mui/material';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the hash from the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (!accessToken || !refreshToken) {
          logger.error('No tokens found in callback URL');
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Wait for Supabase to process the tokens
        const { data, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          logger.error('Error getting session:', sessionError);
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        if (data.session) {
          logger.info('Authentication successful, redirecting...');
          // Give the AuthContext time to process the new session
          setTimeout(() => {
            navigate('/');
          }, 500);
        } else {
          // If no session yet, wait a bit more for Supabase to process
          logger.info('Waiting for session to be established...');
          setTimeout(async () => {
            const { data: retryData } = await supabase.auth.getSession();
            if (retryData.session) {
              navigate('/');
            } else {
              setError('Session could not be established. Please try again.');
              setTimeout(() => navigate('/'), 3000);
            }
          }, 2000);
        }
      } catch (error) {
        logger.error('Auth callback error:', error);
        setError('An unexpected error occurred. Please try again.');
        setTimeout(() => navigate('/'), 3000);
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
      <CircularProgress size={60} sx={{ color: '#4B96DC', mb: 3 }} />
      <Typography variant="h6" sx={{ color: 'text.secondary', mb: 2 }}>
        {error || 'Completing authentication...'}
      </Typography>
      {error && (
        <Typography variant="body2" sx={{ color: 'error.main' }}>
          Redirecting to home page...
        </Typography>
      )}
    </div>
  );
};
