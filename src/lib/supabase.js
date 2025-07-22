import { createClient } from '@supabase/supabase-js';

// Use Sphere1a Supabase project (consolidated database)
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || 'https://cbopynuvhcymbumjnvay.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Prevent automatic auth calls on page load
  },
});
