import React, { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

interface AuthContextType extends AuthState {
  signInWithProvider: (provider: 'google' | 'facebook') => Promise<void>;
  signOut: () => Promise<void>;
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
  });

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('AuthContext - Initializing auth...');

        // Check for OAuth tokens in URL first
        if (window.location.hash && window.location.hash.includes('access_token')) {
          console.log('AuthContext - OAuth tokens detected in URL, processing...');
          // Give Supabase time to process the tokens
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Just get the session directly without timeout
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        // If we get a refresh token error, clear auth and continue as public
        if (error && error.message?.includes('Refresh Token')) {
          console.log('Invalid refresh token, clearing auth data');
          await supabase.auth.signOut();

          if (mounted) {
            setState({
              user: null,
              session: null,
              loading: false,
              error: null,
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
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          // Don't treat auth errors as fatal - allow public access
          setState({
            user: null,
            session: null,
            loading: false,
            error: null, // Set to null to allow public access
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
        }));
      }
    }, 1000);

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (mounted) {
        const user = session?.user || null;

        setState((prev) => ({
          ...prev,
          user: user,
          session: session,
          loading: false,
          error: null,
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

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      console.log('AuthContext - OAuth response:', { data, error });

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
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Clear all auth-related storage FIRST
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Set state to signed out
      setState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });

      // Force reload to clear any remaining state
      window.location.href = '/';
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
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
    user: state.user?.email,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
