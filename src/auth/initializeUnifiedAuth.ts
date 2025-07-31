import { initializeSupabase } from '../unified-auth/src/unifiedSupabase';

/**
 * Initialize unified auth with RepConnect environment variables
 */
export const initializeUnifiedAuth = () => {
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing required environment variables for unified auth:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    });
    return;
  }

  try {
    initializeSupabase({
      supabaseUrl,
      supabaseAnonKey,
    });
  } catch (error) {
    console.error('Failed to initialize unified auth:', error);
  }
};
