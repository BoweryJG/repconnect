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
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('AuthCallback - Found tokens in URL hash, setting session manually');

          // Manually set the session with the tokens from the URL
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (setSessionError) {
            console.error('Error setting session:', setSessionError);
            setError(setSessionError.message);
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          if (data.session) {
            console.log('Session set successfully, user:', data.session.user.email);
            // Give AuthContext time to process the new session
            setTimeout(() => {
              console.log('Navigating to home page...');
              navigate('/');
            }, 500);
            return;
          } else {
            // Even if no session returned, we have tokens so force redirect
            console.log('No session returned but have tokens, forcing redirect...');
            setTimeout(() => {
              navigate('/');
            }, 500);
            return;
          }
        }

        // Check if session exists
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
