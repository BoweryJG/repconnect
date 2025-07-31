// RepX Subscription Tiers
export const RepXTier = {
  Rep0: 'rep0', // Free tier
  Rep1: 'rep1', // $97/month
  Rep2: 'rep2', // $197/month
  Rep3: 'rep3', // $297/month
  Rep4: 'rep4', // $497/month
  Rep5: 'rep5', // $997/month
} as const;

export type RepXTier = (typeof RepXTier)[keyof typeof RepXTier];

// Feature access levels
export interface FeatureAccess {
  // Basic features (all tiers)
  login: boolean;
  dashboard: boolean;

  // Email features (Rep1+)
  emailAccess: boolean;
  emailSendLimit: number | null; // null = unlimited

  // Phone features (Rep2+)
  phoneAccess: boolean;
  phoneNumberLimit: number;
  smsEnabled: boolean;

  // Advanced phone features (Rep3+)
  twilioProvisioning: boolean;
  autoAssignedNumber: boolean;
  callRecording: boolean;
  voicemail: boolean;

  // Gmail integration (Rep4+)
  gmailIntegration: boolean;
  gmailSyncEnabled: boolean;
  gmailSendFromCRM: boolean;

  // White label features (Rep5)
  whiteLabel: boolean;
  customDomain: boolean;
  customBranding: boolean;
  unlimitedEverything: boolean;

  // Agent conversation limits
  agentTimeLimit: number; // in seconds
}

// User subscription info
export interface UserSubscription {
  userId: string;
  email: string;
  tier: RepXTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  currentPeriodEnd?: Date;
  twilioPhoneNumber?: string;
  twilioAccountSid?: string;
  features: FeatureAccess;
}

// Auth state
export interface AuthState {
  user: any; // Supabase user
  subscription: UserSubscription | null;
  loading: boolean;
  error: Error | null;
}

// Feature check result
export interface FeatureCheckResult {
  allowed: boolean;
  reason?: string;
  requiredTier?: RepXTier;
  upgradeUrl?: string;
}
