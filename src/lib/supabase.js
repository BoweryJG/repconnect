import { createClient } from '@supabase/supabase-js';

// Use bowerycreativeagency Supabase project
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || 'https://fiozmyoedptukpkzuhqm.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
