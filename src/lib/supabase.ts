import { createClient } from '@supabase/supabase-js';

// Use bowerycreativeagency Supabase project URL
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || 'https://fiozmyoedptukpkzuhqm.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing required environment variables: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
