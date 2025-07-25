import { createClient } from '@supabase/supabase-js';

// Use Sphere1a Supabase project URL (consolidated database)
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || 'https://cbopynuvhcymbumjnvay.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required environment variables: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'sb-cbopynuvhcymbumjnvay-auth-token',
    flowType: 'implicit',
  },
});
