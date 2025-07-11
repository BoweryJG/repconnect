import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { authService, startSessionRefresh } from '../services/authService';
import logger from '../utils/logger';
import SessionWarning from '../components/SessionWarning';

type AuthProviderType = 'google' | 'facebook';

interface UserProfile {
  id: string;
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  subscription?: {
    tier: string;
    status: string;
    expires_at?: string;
  };
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithProvider: (provider: AuthProviderType) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  showSessionWarning: boolean;
  extendSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionTimeLeft, setSessionTimeLeft] = useState(300); // 5 minutes in seconds

  // Fetch user profile from database
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        logger.error('Error fetching profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      logger.error('Error in fetchProfile:', error);
      return null;
    }
  }, []);

  // Create or update user profile
  const createOrUpdateProfile = useCallback(
    async (user: User) => {
      try {
        const existingProfile = await fetchProfile(user.id);

        if (!existingProfile) {
          // Create new profile
          const { data, error } = await supabase
            .from('user_profiles')
            .insert({
              user_id: user.id,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url,
              subscription: {
                tier: 'free',
                status: 'active',
              },
            })
            .select()
            .single();

          if (error) {
            logger.error('Error creating profile:', error);
            return null;
          }

          return data as UserProfile;
        } else {
          // Update existing profile
          const { data, error } = await supabase
            .from('user_profiles')
            .update({
              full_name: user.user_metadata?.full_name || existingProfile.full_name,
              avatar_url: user.user_metadata?.avatar_url || existingProfile.avatar_url,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) {
            logger.error('Error updating profile:', error);
            return existingProfile;
          }

          return data as UserProfile;
        }
      } catch (error) {
        logger.error('Error in createOrUpdateProfile:', error);
        return null;
      }
    },
    [fetchProfile]
  );

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
      setSession(null);
      setProfile(null);
      setShowSessionWarning(false);
    } catch (error) {
      logger.error('Sign out error:', error);
      throw error;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First, check if we have a cookie session
        const cookieUser = await authService.getCurrentUser();

        if (cookieUser) {
          setUser(cookieUser);
          const userProfile = await fetchProfile(cookieUser.id);
          if (userProfile) {
            setProfile(userProfile);
          }
        } else {
          // Fallback to Supabase session
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();

          if (currentSession?.user) {
            // Exchange Supabase session for cookie session
            await authService.loginWithCookies(currentSession);
            setSession(currentSession);
            setUser(currentSession.user);

            const userProfile = await createOrUpdateProfile(currentSession.user);
            if (userProfile) {
              setProfile(userProfile);
            }
          }
        }
      } catch (error) {
        logger.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Exchange new session for cookies
        await authService.loginWithCookies(session);
        setSession(session);
        setUser(session.user);

        const userProfile = await createOrUpdateProfile(session.user);
        if (userProfile) {
          setProfile(userProfile);
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    });

    // Setup session timeout warning
    const cleanupSessionWarning = authService.setupSessionTimeoutWarning(
      () => {
        setShowSessionWarning(true);
        setSessionTimeLeft(300); // Reset to 5 minutes
      },
      async () => {
        setShowSessionWarning(false);
        await signOut();
      }
    );

    // Start session refresh
    const cleanupSessionRefresh = startSessionRefresh();

    return () => {
      subscription.unsubscribe();
      cleanupSessionWarning();
      cleanupSessionRefresh();
    };
  }, [createOrUpdateProfile, fetchProfile, signOut]);

  // Timer for session warning countdown
  useEffect(() => {
    if (!showSessionWarning) return;

    const timer = setInterval(() => {
      setSessionTimeLeft((prev) => {
        if (prev <= 1) {
          signOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showSessionWarning, signOut]);

  // Sign in with OAuth provider
  const signInWithProvider = useCallback(async (provider: AuthProviderType) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      logger.error('Sign in error:', error);
      throw error;
    }
  }, []);

  // Refresh profile data
  const refreshProfile = useCallback(async () => {
    if (!user) return;

    const userProfile = await fetchProfile(user.id);
    if (userProfile) {
      setProfile(userProfile);
    }
  }, [user, fetchProfile]);

  // Extend session
  const extendSession = useCallback(async () => {
    try {
      await authService.refreshSession();
      setShowSessionWarning(false);
    } catch (error) {
      logger.error('Extend session error:', error);
      throw error;
    }
  }, []);

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signInWithProvider,
    signOut,
    refreshProfile,
    showSessionWarning,
    extendSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <SessionWarning
        open={showSessionWarning}
        timeLeft={sessionTimeLeft}
        onExtend={extendSession}
        onLogout={signOut}
      />
    </AuthContext.Provider>
  );
};
