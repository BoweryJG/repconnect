import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
  supabase,
  initializeCrossDomainSSO,
  clearCrossDomainAuth,
  getRedirectUrl,
} from './unifiedSupabase';
import type {
  User,
  AuthSession,
  AuthState,
  AuthError,
  AuthProvider as AuthProviderType,
  SignInOptions,
} from './types';
import type { Session } from '@supabase/supabase-js';
import type { AuthContextType } from './AuthContextType';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const UnifiedAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  console.log('[UnifiedAuthProvider] Initializing unified auth');
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  // Convert Supabase session to our AuthSession type
  const mapSession = (session: Session | null): AuthSession | null => {
    if (!session) return null;

    // Ensure avatar_url is set from picture if needed
    const user = session.user as User;
    if (user.user_metadata?.picture && !user.user_metadata?.avatar_url) {
      user.user_metadata.avatar_url = user.user_metadata.picture;
    }

    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in || 3600,
      expires_at: session.expires_at,
      token_type: session.token_type,
      user: user,
    };
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('UnifiedAuthContext - Initializing auth...');

        // Check for OAuth tokens in URL first
        if (window.location.hash && window.location.hash.includes('access_token')) {
          console.log('UnifiedAuthContext - OAuth tokens detected in URL, processing...');
          // Give Supabase time to process the tokens
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Add timeout to prevent hanging
        const authTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Auth initialization timeout')), 1500);
        });

        const result = await Promise.race([supabase.auth.getSession(), authTimeout]).catch(
          (timeoutError) => ({
            data: { session: null },
            error: timeoutError,
          })
        );

        const {
          data: { session },
          error,
        } = result as { data: { session: Session | null }; error: AuthError | null };

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
          const mappedSession = mapSession(session);
          const user = mappedSession?.user || null;

          // Initialize cross-domain SSO if authenticated
          if (session) {
            await initializeCrossDomainSSO();
          }

          setState({
            user: user,
            session: mappedSession,
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
        console.log('[UnifiedAuthContext] Forcing loading to false after timeout');
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
        const mappedSession = mapSession(session);
        const user = mappedSession?.user || null;

        // Update cross-domain SSO state
        if (session) {
          await initializeCrossDomainSSO();
        } else {
          clearCrossDomainAuth();
        }

        setState((prev) => ({
          ...prev,
          user: user,
          session: mappedSession,
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

  const signInWithProvider = useCallback(
    async (provider: AuthProviderType, options?: SignInOptions) => {
      console.log(`UnifiedAuthContext - signInWithProvider called with provider: ${provider}`);
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const redirectUrl = getRedirectUrl(options?.redirectTo);
        console.log(`UnifiedAuthContext - using redirect URL: ${redirectUrl}`);

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: provider as 'google' | 'github' | 'facebook',
          options: {
            redirectTo: redirectUrl,
            scopes: options?.scopes,
            queryParams: options?.queryParams,
          },
        });

        console.log('UnifiedAuthContext - OAuth response:', { data, error });

        if (error) {
          console.error('UnifiedAuthContext - OAuth error:', error);
          throw error;
        }

        // OAuth should redirect browser to provider
        console.log('UnifiedAuthContext - OAuth initiated, browser should redirect');
      } catch (error) {
        console.error('UnifiedAuthContext - signInWithProvider error:', error);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: { message: error instanceof Error ? error.message : 'Unknown error' } as AuthError,
        }));
        throw error;
      }
    },
    []
  );

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Initialize cross-domain SSO
      await initializeCrossDomainSSO();

      setState((prev) => ({
        ...prev,
        user: data.user as User,
        session: mapSession(data.session),
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' } as AuthError,
      }));
      throw error;
    }
  }, []);

  const signUpWithEmail = useCallback(
    async (email: string, password: string, metadata?: Record<string, unknown>) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
          },
        });

        if (error) throw error;

        // Initialize cross-domain SSO
        if (data.session) {
          await initializeCrossDomainSSO();
        }

        setState((prev) => ({
          ...prev,
          user: data.user as User,
          session: mapSession(data.session),
          loading: false,
          error: null,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: { message: error instanceof Error ? error.message : 'Unknown error' } as AuthError,
        }));
        throw error;
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Clear cross-domain auth first
      clearCrossDomainAuth();

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: { message: error instanceof Error ? error.message : 'Unknown error' } as AuthError,
      }));
      throw error;
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;

      // Update cross-domain SSO
      if (data.session) {
        await initializeCrossDomainSSO();
      }

      setState((prev) => ({
        ...prev,
        session: mapSession(data.session),
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: { message: error instanceof Error ? error.message : 'Unknown error' } as AuthError,
      }));
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    ...state,
    signInWithProvider,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    refreshSession,
    subscription: state.user?.subscription,
    isAdmin: state.user?.app_metadata?.roles?.includes('admin') || false,
  };

  console.log('[UnifiedAuthProvider] Rendering with state:', {
    loading: state.loading,
    user: state.user?.email,
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
