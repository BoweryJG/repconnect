import React, { useEffect, useRef } from 'react';

const AuthCallback = () => {
  const attemptCountRef = useRef(0);
  const loggedRef = useRef(false);

  useEffect(() => {
    // Log diagnostic information only once
    if (!loggedRef.current) {
      loggedRef.current = true;

      // Diagnostic information removed after successful auth fix deployment
    }

    // Try multiple redirect methods
    const attemptRedirect = () => {
      attemptCountRef.current++;

      // Method 1: window.location.replace
      try {
        window.location.replace('/');
      } catch (e) {
        // Redirect failed, try next method
      }

      // Method 2: window.location.href
      setTimeout(() => {
        try {
          window.location.href = '/';
        } catch (e) {
          // Redirect failed, try next method
        }
      }, 100);

      // Method 3: document.location
      setTimeout(() => {
        try {
          document.location.href = '/';
        } catch (e) {
          // Redirect failed, try next method
        }
      }, 200);

      // Method 4: window.top.location
      setTimeout(() => {
        try {
          if (window.top) {
            window.top.location.href = '/';
          }
        } catch (e) {
          // Redirect failed, try next method
        }
      }, 300);

      // Method 5: History API
      setTimeout(() => {
        try {
          window.history.pushState(null, '', '/');
          window.location.reload();
        } catch (e) {
          // Redirect failed
        }
      }, 400);
    };

    // Start redirect attempts
    attemptRedirect();

    // Fallback if we're still here after 2 seconds
    const stillHereTimeout = setTimeout(() => {
      // Nuclear option: Clear everything and force reload
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = window.location.origin + '/';
    }, 2000);

    return () => {
      clearTimeout(stillHereTimeout);
    };
  }, []);

  // Also try immediate redirect without useEffect
  if (typeof window !== 'undefined') {
    window.location.replace('/');
  }

  return (
    <div
      style={{
        padding: '20px',
        fontFamily: 'monospace',
        backgroundColor: '#f0f0f0',
        minHeight: '100vh',
      }}
    >
      <h1>Auth Callback Diagnostic</h1>
      <p>If you see this, the redirect has failed.</p>
      <p>Check the browser console for diagnostic information.</p>
      <p>Current URL: {window.location.href}</p>
      <button
        onClick={() => (window.location.href = '/')}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '20px',
        }}
      >
        Manual Redirect to Home
      </button>
    </div>
  );
};

export default AuthCallback;
export { AuthCallback };
