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
  signInWithProvider: (_provider: 'google' | 'facebook') => Promise<void>;
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
        // Check if we have OAuth tokens in the URL hash (from auth callback redirect)
        if (window.location.hash && window.location.hash.includes('access_token')) {
          // Give Supabase time to process the OAuth tokens
          await new Promise((resolve) => setTimeout(resolve, 1000));
          // Clean up the URL after Supabase processes the tokens
          window.history.replaceState(null, '', window.location.pathname);
        }

        // Check if we just came from auth callback (stored by static HTML)
        const authDataKey = 'sb-cbopynuvhcymbumjnvay-auth-token';
        const storedAuth = localStorage.getItem(authDataKey);

        if (storedAuth) {
          try {
            // Parse to validate the stored auth data
            JSON.parse(storedAuth);
            // Give Supabase a moment to recognize the stored auth
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (e) {
            // Failed to parse stored auth
          }
        }

        // Just get the session directly without timeout
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        // If we get a refresh token error, clear auth and continue as guest
        if (error && error.message?.includes('Refresh Token')) {
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
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Don't update state if we're in the middle of signing out
      if (isSigningOutRef.current) {
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
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Use local domain for OAuth redirect
      const redirectUrl = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        throw error;
      }

      // OAuth should redirect browser to provider
    } catch (error) {
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
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          // Continue anyway - we already cleared local storage
        }
      } catch (err) {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
