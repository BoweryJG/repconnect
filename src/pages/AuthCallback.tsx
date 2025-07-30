import React, { useEffect, useRef } from 'react';

const AuthCallback = () => {
  const attemptCountRef = useRef(0);
  const loggedRef = useRef(false);

  useEffect(() => {
    // Log diagnostic information only once
    if (!loggedRef.current) {
      loggedRef.current = true;

      console.log('🔍 AUTH CALLBACK DIAGNOSTIC');
      console.log('==========================');
      console.log('1. Current URL:', window.location.href);
      console.log('2. URL hash:', window.location.hash);
      console.log('3. URL search:', window.location.search);
      console.log('4. Document ready state:', document.readyState);
      console.log('5. React Router loaded:', !!(window as any).__REACT_ROUTER__);
      console.log('6. Service Worker:', 'serviceWorker' in navigator);
      console.log(
        '7. Local Storage auth token:',
        localStorage.getItem('sb-cbopynuvhcymbumjnvay-auth-token')
      );
      console.log('8. Session Storage keys:', Object.keys(sessionStorage));
      console.log('9. Document referrer:', document.referrer);
      console.log('10. History length:', window.history.length);
      console.log('==========================');
    }

    // Try multiple redirect methods with logging
    const attemptRedirect = () => {
      attemptCountRef.current++;
      console.log(`🚀 Redirect attempt #${attemptCountRef.current}`);

      // Method 1: window.location.replace
      try {
        console.log('Trying window.location.replace("/")...');
        window.location.replace('/');
        console.log('✅ window.location.replace executed (may not have taken effect yet)');
      } catch (e) {
        console.error('❌ window.location.replace failed:', e);
      }

      // Method 2: window.location.href
      setTimeout(() => {
        try {
          console.log('Trying window.location.href = "/"...');
          window.location.href = '/';
          console.log('✅ window.location.href executed (may not have taken effect yet)');
        } catch (e) {
          console.error('❌ window.location.href failed:', e);
        }
      }, 100);

      // Method 3: document.location
      setTimeout(() => {
        try {
          console.log('Trying document.location.href = "/"...');
          document.location.href = '/';
          console.log('✅ document.location.href executed (may not have taken effect yet)');
        } catch (e) {
          console.error('❌ document.location.href failed:', e);
        }
      }, 200);

      // Method 4: window.top.location
      setTimeout(() => {
        try {
          console.log('Trying window.top.location.href = "/"...');
          if (window.top) {
            window.top.location.href = '/';
            console.log('✅ window.top.location.href executed (may not have taken effect yet)');
          }
        } catch (e) {
          console.error('❌ window.top.location.href failed:', e);
        }
      }, 300);

      // Method 5: History API
      setTimeout(() => {
        try {
          console.log('Trying history.pushState + location.reload...');
          window.history.pushState(null, '', '/');
          window.location.reload();
          console.log('✅ history.pushState + reload executed');
        } catch (e) {
          console.error('❌ history.pushState + reload failed:', e);
        }
      }, 400);
    };

    // Start redirect attempts
    attemptRedirect();

    // Log if we're still here after 2 seconds
    const stillHereTimeout = setTimeout(() => {
      console.error('❌ STILL ON CALLBACK PAGE AFTER 2 SECONDS!');
      console.log('Current URL:', window.location.href);
      console.log('Attempting nuclear option...');

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
    console.log('🔄 Attempting immediate redirect (outside useEffect)');
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
