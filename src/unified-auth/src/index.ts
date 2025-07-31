// Types
export * from './types';

// Constants
export * from './constants';

// Context
export { UnifiedAuthProvider, useAuth, AuthContext } from './UnifiedAuthContext';
export type { AuthContextType } from './UnifiedAuthContext';

// Supabase
export { initializeSupabase, getSupabase, getSupabaseClient } from './unifiedSupabase';
export type { SupabaseConfig } from './unifiedSupabase';

// Hooks
export { useRepXTier } from './hooks/useRepXTier';
export { useFeatureAccess } from './hooks/useFeatureAccess';
export { useAgentTimeLimit } from './hooks/useAgentTimeLimit';

// Components
export { FeatureGate } from './components/FeatureGate';
export { TierBadge } from './components/TierBadge';
export { UpgradePrompt } from './components/UpgradePrompt';

// Utility functions
export { checkFeatureAccess } from './utils/checkFeatureAccess';
export { getTierFromStripePrice } from './utils/getTierFromStripePrice';
