import type { User, AuthState, AuthProvider as AuthProviderType, SignInOptions } from './types';

export interface AuthContextType extends AuthState {
  signInWithProvider: (provider: AuthProviderType, options?: SignInOptions) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    metadata?: Record<string, unknown>
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  subscription?: User['subscription'];
  isAdmin: boolean;
}
