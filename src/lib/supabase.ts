import { createClient } from '@supabase/supabase-js';

// Use Sphere1a Supabase project URL (consolidated database)
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL || 'https://cbopynuvhcymbumjnvay.supabase.co';
const supabaseAnonKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib3B5bnV2aGN5bWJ1bWpudmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTUxNzMsImV4cCI6MjA1OTU3MTE3M30.UZElMkoHugIt984RtYWyfrRuv2rB67opQdCrFVPCfzU';

let supabase: any = null;

console.log('Supabase initialization check:');
console.log('- URL:', supabaseUrl);
console.log('- Anon key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing required environment variables: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY'
  );
  console.warn('Supabase will not be initialized. Chat features may not work properly.');
  // Show alert in development
  if (window.location.hostname === 'localhost') {
    alert('Missing Supabase environment variables!');
  }
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
