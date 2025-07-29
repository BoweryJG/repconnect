import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircularProgress, Typography } from '@mui/material';
import { supabase } from '../lib/supabase';

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
          setTimeout(() => navigate('/'), 3000);
          return;
        }

        // Check if we have access_token in hash (Supabase OAuth response)
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('AuthCallback - Found tokens, setting session manually');

          // Force Supabase to set the session from the tokens
          console.log('AuthCallback - Calling setSession with tokens');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          console.log('AuthCallback - setSession result:', {
            success: !error,
            error: error?.message,
            hasSession: !!data?.session,
            userEmail: data?.session?.user?.email,
          });

          if (error) {
            console.error('Error setting session:', error);
            setError(error.message);
            setTimeout(() => navigate('/'), 3000);
            return;
          }

          if (data.session) {
            console.log('Session set successfully:', data.session.user.email);
            // Immediate redirect - no delays
            window.location.href = window.location.origin;
            return;
          }
        }

        // Fallback to checking existing session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth callback error:', error);
          setError(error.message);
          setTimeout(() => navigate('/'), 3000);
        } else if (data.session) {
          // Successfully authenticated
          console.log('Auth successful, user:', data.session.user.email);
          window.location.href = window.location.origin;
          return;
        } else {
          console.log('No session found, checking again...');
          // No session after callback, wait a bit and check again
          setTimeout(async () => {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            if (session) {
              console.log('Session found on retry, user:', session.user.email);
              window.location.href = window.location.origin;
            } else {
              console.log('Still no session, redirecting to home');
              window.location.href = window.location.origin;
            }
          }, 2000);
        }
      } catch (err) {
        console.error('Auth callback exception:', err);
        setError('An unexpected error occurred');
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
            Redirecting to home...
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

export default AuthCallback;
export { AuthCallback };
