import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { supabase } from '../auth/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle auth callback
    const handleAuthCallback = async () => {
      try {
        console.log('AuthCallback - Processing OAuth callback...');
        console.log('URL:', window.location.href);

        // Get the auth code from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);

        // Check for error in URL
        const errorDesc =
          searchParams.get('error_description') || hashParams.get('error_description');
        if (errorDesc) {
          setError(decodeURIComponent(errorDesc));
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Check if we have access_token in hash (Supabase OAuth response)
        const accessToken = hashParams.get('access_token');
        if (accessToken) {
          console.log('AuthCallback - Found access token in URL hash');
          // Supabase should automatically handle this, but let's make sure
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Give Supabase time to process
        }

        // Let Supabase handle the OAuth callback
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          setTimeout(() => navigate('/login'), 3000);
        } else if (data.session) {
          // Successfully authenticated
          console.log('Auth successful, user:', data.session.user.email);
          navigate('/');
        } else {
          console.log('No session found, checking again...');
          // No session after callback, wait a bit and check again
          setTimeout(async () => {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session) {
              console.log('Session found on retry, user:', session.user.email);
              navigate('/');
            } else {
              console.log('Still no session, redirecting to login');
              navigate('/login');
            }
          }, 2000);
        }
      } catch (err) {
        console.error('Auth callback exception:', err);
        setError('An unexpected error occurred');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        gap: 3,
      }}
    >
      {error ? (
        <>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#ff6b6b' }}>
            Authentication Error
          </Typography>
          <Typography sx={{ opacity: 0.9, textAlign: 'center', maxWidth: 400, color: '#ff6b6b' }}>
            {error}
          </Typography>
          <Typography sx={{ opacity: 0.7, textAlign: 'center', fontSize: '14px' }}>
            Redirecting to login...
          </Typography>
        </>
      ) : (
        <>
          <CircularProgress
            size={60}
            sx={{
              color: '#00ffc6',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Completing sign in...
          </Typography>
          <Typography sx={{ opacity: 0.7, textAlign: 'center', maxWidth: 400 }}>
            Please wait while we securely sign you in to Canvas
          </Typography>
        </>
      )}
    </Box>
  );
};

export default AuthCallback;
