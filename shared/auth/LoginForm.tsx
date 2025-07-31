import React, { useState } from 'react';
import { useAuth } from './useAuth';

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { signInWithProvider, loading, error } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    try {
      await signInWithProvider('google');
      onSuccess?.();
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleFacebookLogin = async () => {
    setIsSigningIn(true);
    try {
      await signInWithProvider('facebook');
      onSuccess?.();
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '2rem',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Sign In</h2>

      {error && (
        <div
          style={{
            padding: '1rem',
            marginBottom: '1rem',
            background: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            borderRadius: '8px',
            color: '#ff6b6b',
          }}
        >
          {error.message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button
          onClick={handleGoogleLogin}
          disabled={loading || isSigningIn}
          style={{
            padding: '12px 24px',
            background: '#fff',
            color: '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || isSigningIn ? 'not-allowed' : 'pointer',
            opacity: loading || isSigningIn ? 0.6 : 1,
            fontSize: '16px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!loading && !isSigningIn) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
            />
            <path
              fill="#FF3D00"
              d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
            />
            <path
              fill="#1976D2"
              d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
            />
          </svg>
          {loading || isSigningIn ? 'Signing in...' : 'Continue with Google'}
        </button>

        <button
          onClick={handleFacebookLogin}
          disabled={loading || isSigningIn}
          style={{
            padding: '12px 24px',
            background: '#1877f2',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: loading || isSigningIn ? 'not-allowed' : 'pointer',
            opacity: loading || isSigningIn ? 0.6 : 1,
            fontSize: '16px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!loading && !isSigningIn) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,120,212,0.3)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              fill="#1877f2"
              d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
            />
          </svg>
          {loading || isSigningIn ? 'Signing in...' : 'Continue with Facebook'}
        </button>
      </div>

      <p
        style={{
          textAlign: 'center',
          marginTop: '2rem',
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.6)',
        }}
      >
        By signing in, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
};
