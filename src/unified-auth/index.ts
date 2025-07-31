// Unified auth exports
export * from './src/types';
export * from './src/constants';

// Context and Auth
export { UnifiedAuthProvider, useAuth, AuthContext } from './src/UnifiedAuthContext';
export type { AuthContextType } from './src/UnifiedAuthContext';

// Supabase
export { initializeSupabase, getSupabase, getSupabaseClient } from './src/unifiedSupabase';
export type { SupabaseConfig } from './src/unifiedSupabase';

// Hooks
export { useRepXTier } from './src/hooks/useRepXTier';
export { useFeatureAccess } from './src/hooks/useFeatureAccess';
export { useAgentTimeLimit } from './src/hooks/useAgentTimeLimit';

// Components
export { FeatureGate } from './src/components/FeatureGate';
export { TierBadge } from './src/components/TierBadge';
export { UpgradePrompt } from './src/components/UpgradePrompt';

// Utility functions
export { checkFeatureAccess } from './src/utils/checkFeatureAccess';
export { getTierFromStripePrice } from './src/utils/getTierFromStripePrice';
