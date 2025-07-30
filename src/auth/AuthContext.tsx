import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  isGuest: boolean;
}

interface AuthContextType extends AuthState {
  signInWithProvider: (provider: 'google' | 'facebook') => Promise<void>;
  signOut: () => Promise<void>;
  isGuest: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isGuest: true, // Start as guest until auth is confirmed
  });

  // Track if we're in the middle of signing out to prevent race conditions
  const isSigningOutRef = useRef(false);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('AuthContext - Initializing auth...');

        // Check if we just came from auth callback (stored by static HTML)
        const authDataKey = 'sb-cbopynuvhcymbumjnvay-auth-token';
        const storedAuth = localStorage.getItem(authDataKey);

        if (storedAuth) {
          console.log('AuthContext - Found stored auth data from callback');
          try {
            const authData = JSON.parse(storedAuth);
            // Give Supabase a moment to recognize the stored auth
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (e) {
            console.error('Failed to parse stored auth:', e);
          }
        }

        // Just get the session directly without timeout
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        console.log('AuthContext - getSession result:', {
          hasSession: !!session,
          sessionUser: session?.user?.email,
          error: error?.message,
          fullSession: session,
        });

        // If we get a refresh token error, clear auth and continue as guest
        if (error && error.message?.includes('Refresh Token')) {
          console.log('Invalid refresh token, clearing auth data');
          await supabase.auth.signOut();

          if (mounted) {
            setState({
              user: null,
              session: null,
              loading: false,
              error: null,
              isGuest: true,
            });
          }
          return;
        }

        if (error) throw error;

        if (mounted) {
          const user = session?.user || null;

          setState({
            user: user,
            session: session,
            loading: false,
            error: null,
            isGuest: !session, // Guest if no session
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          // Don't treat auth errors as fatal - allow guest access
          setState({
            user: null,
            session: null,
            loading: false,
            error: null, // Set to null to allow guest access
            isGuest: true,
          });
        }
      }
    };

    initializeAuth();

    // Force loading to false after 1 second to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.log('[AuthContext] Forcing loading to false after timeout');
        setState((prev) => ({
          ...prev,
          loading: false,
          error: null,
          isGuest: !prev.session, // Maintain guest status based on session
        }));
      }
    }, 1000);

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext - onAuthStateChange fired:', {
        event,
        hasSession: !!session,
        sessionUser: session?.user?.email,
        isSigningOut: isSigningOutRef.current,
      });

      // Don't update state if we're in the middle of signing out
      if (isSigningOutRef.current) {
        console.log('Ignoring auth state change during sign out');
        return;
      }

      if (mounted) {
        const user = session?.user || null;

        setState((prev) => ({
          ...prev,
          user: user,
          session: session,
          loading: false,
          error: null,
          isGuest: !session,
        }));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const signInWithProvider = useCallback(async (provider: 'google' | 'facebook') => {
    console.log(`AuthContext - signInWithProvider called with provider: ${provider}`);
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Use local domain for OAuth redirect
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log(`AuthContext - using redirect URL: ${redirectUrl}`);
      console.log('Current origin:', window.location.origin);
      console.log('Current storage key:', 'sb-cbopynuvhcymbumjnvay-auth-token');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      console.log('AuthContext - OAuth response:', { data, error });
      console.log('OAuth URL:', data?.url);

      if (error) {
        console.error('AuthContext - OAuth error:', error);
        throw error;
      }

      // OAuth should redirect browser to provider
      console.log('AuthContext - OAuth initiated, browser should redirect');
    } catch (error) {
      console.error('AuthContext - signInWithProvider error:', error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    // Set flag to prevent auth state listener from interfering
    isSigningOutRef.current = true;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      console.log('AuthContext - Starting sign out process...');

      // Clear all auth-related storage FIRST
      console.log('Clearing localStorage keys...');
      localStorage.removeItem('sb-cbopynuvhcymbumjnvay-auth-token');
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('repspheres-auth');
      sessionStorage.clear();

      // Clear all cookies
      document.cookie.split(';').forEach(function (c) {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });

      // Then sign out from Supabase
      console.log('Calling supabase.auth.signOut()...');

      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('Supabase signOut error:', error);
          // Continue anyway - we already cleared local storage
        } else {
          console.log('Supabase signOut successful');
        }
      } catch (err) {
        console.error('SignOut exception:', err);
        // Continue anyway - we already cleared local storage
      }

      // Set state to signed out guest
      setState({
        user: null,
        session: null,
        loading: false,
        error: null,
        isGuest: true,
      });

      // Reset the signing out flag so future auth changes work
      isSigningOutRef.current = false;

      // Check what's still in localStorage
      console.log('After signOut - localStorage keys:', Object.keys(localStorage));
      console.log(
        'After signOut - checking for auth token:',
        localStorage.getItem('sb-cbopynuvhcymbumjnvay-auth-token')
      );

      // Force reload to clear any remaining state
      window.location.href = '/';
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
      // Reset the signing out flag even on error
      isSigningOutRef.current = false;
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    ...state,
    signInWithProvider,
    signOut,
  };

  console.log('[AuthProvider] Rendering with state:', {
    loading: state.loading,
    user: state.user?.email || null,
    isGuest: state.isGuest,
    hasSession: !!state.session,
    userId: state.user?.id,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
