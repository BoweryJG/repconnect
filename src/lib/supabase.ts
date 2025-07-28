import { createClient } from '@supabase/supabase-js';

// Use Sphere1a Supabase project URL (consolidated database)
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || 'https://cbopynuvhcymbumjnvay.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

let supabase: any = null;

console.log('Supabase initialization check:');
console.log('- URL present:', !!supabaseUrl);
console.log('- Anon key present:', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing required environment variables: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY'
  );
  console.warn('Supabase will not be initialized. Chat features may not work properly.');
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'sb-cbopynuvhcymbumjnvay-auth-token',
      flowType: 'implicit', // Canvas uses this and it works
    },
  });
}

export { supabase };
