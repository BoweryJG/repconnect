import React from 'react';
import { UnifiedAuthProvider } from '../unified-auth/src/UnifiedAuthContext';

interface UnifiedAuthWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that provides unified auth context
 */
export const UnifiedAuthWrapper: React.FC<UnifiedAuthWrapperProps> = ({ children }) => {
  const hasSupabaseConfig = !!(
    process.env.REACT_APP_SUPABASE_URL && process.env.REACT_APP_SUPABASE_ANON_KEY
  );

  if (!hasSupabaseConfig) {
    console.warn('UnifiedAuthWrapper: Supabase not configured, rendering without auth');
    return <>{children}</>;
  }

  return <UnifiedAuthProvider>{children}</UnifiedAuthProvider>;
};
