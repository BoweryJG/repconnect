import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import logger from '../utils/logger';

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
  signInWithProvider: (_provider: AuthProviderType) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
      // Clear state
      setUser(null);
      setSession(null);
      setProfile(null);

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // Force reload
      window.location.href = '/';
    } catch (error) {
      logger.error('Sign out error:', error);
      // Force cleanup anyway
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AuthContext] Initializing auth...');
      try {
        // Only check Supabase session - no cookie checks
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        console.log('[AuthContext] Session check:', {
          hasSession: !!currentSession,
          user: currentSession?.user?.email,
        });

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);

          const userProfile = await createOrUpdateProfile(currentSession.user);
          if (userProfile) {
            setProfile(userProfile);
          }
          console.log('[AuthContext] Auth initialized with user:', currentSession.user.email);
        } else {
          console.log('[AuthContext] No session found');
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        logger.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (event === 'SIGNED_OUT') {
        // Handle sign out
        setUser(null);
        setSession(null);
        setProfile(null);
      } else if (session?.user) {
        // Simply use Supabase session like Canvas does
        setSession(session);
        setUser(session.user);

        const userProfile = await createOrUpdateProfile(session.user);
        if (userProfile) {
          setProfile(userProfile);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [createOrUpdateProfile, fetchProfile]);

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

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signInWithProvider,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
