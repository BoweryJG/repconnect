import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Typography } from '@mui/material';
import { supabase } from '../lib/supabase';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle auth callback
    const handleAuthCallback = async () => {
      try {
        // Processing OAuth callback

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
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Found tokens in URL hash, setting session manually

          // Manually set the session with the tokens from the URL
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            // Error setting session
            setError(setSessionError.message);
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          if (data.session) {
            // Session set successfully
            // Give AuthContext time to process the new session
            setTimeout(() => {
              // Navigating to home page
              navigate('/');
            }, 500);
            return;
          }
        }

        // Check if session exists
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          // Auth callback error
          setError(error.message);
          setTimeout(() => navigate('/login'), 3000);
        } else if (data.session) {
          // Successfully authenticated
          // Auth successful
          navigate('/');
        } else {
          // No session found, checking again
          // No session after callback, wait a bit and check again
          setTimeout(async () => {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session) {
              // Session found on retry
              navigate('/');
            } else {
              // Still no session, redirecting to login
              navigate('/login');
            }
          }, 2000);
        }
      } catch (err) {
        // Auth callback exception
        setError('An unexpected error occurred');
        setTimeout(() => navigate('/login'), 3000);
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
