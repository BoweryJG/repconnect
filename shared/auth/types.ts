export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    picture?: string;
    company?: string;
  };
  app_metadata?: {
    provider?: string;
    providers?: string[];
    roles?: string[];
  };
  created_at?: string;
  subscription?: {
    tier: 'explorer' | 'closer' | 'dominator' | 'enterprise';
    status: 'active' | 'inactive' | 'trial' | 'expired';
    credits: number;
    creditsUsed: number;
    magicLinksUsed: number;
    magicLinksLimit: number;
    billingCycle: 'monthly' | 'annual';
    startDate: string;
    endDate: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  };
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: User;
}

export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  error: AuthError | null;
}

export type AuthProvider = 'google' | 'azure' | 'github' | 'facebook';

export interface SignInOptions {
  redirectTo?: string;
  scopes?: string;
  queryParams?: Record<string, string>;
}
