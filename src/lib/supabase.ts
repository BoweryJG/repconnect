import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT: RepConnect uses the "Sphere1a" Supabase project
// Project ID: cbopynuvhcymbumjnvay
// DO NOT use "Bowery Creative" project (fiozmyoedptukpkzuhqm)

// Get environment variables with fallbacks for development
let supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
let supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate we're not using the wrong project
if (supabaseUrl && supabaseUrl.includes('fiozmyoedptukpkzuhqm')) {
  console.error(
    'WRONG SUPABASE PROJECT! Detected Bowery Creative project. Using correct Sphere1a project instead.'
  );
  supabaseUrl = 'https://cbopynuvhcymbumjnvay.supabase.co';
}

// Check if the URL is masked/invalid (contains asterisks or is not a valid URL)
if (!supabaseUrl || supabaseUrl.includes('*') || !supabaseUrl.match(/^https?:\/\//)) {
  console.warn('Invalid Supabase URL detected, using hardcoded URL');
  supabaseUrl = 'https://cbopynuvhcymbumjnvay.supabase.co';
}

if (!supabaseAnonKey || supabaseAnonKey.includes('*')) {
  console.warn('Invalid Supabase key detected, using hardcoded key');
  supabaseAnonKey =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib3B5bnV2aGN5bWJ1bWpudmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTUxNzMsImV4cCI6MjA1OTU3MTE3M30.UZElMkoHugIt984RtYWyfrRuv2rB67opQdCrFVPCfzU';
}

// Log warning instead of throwing error
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables - using defaults');
}

// Create a single supabase client with unified auth configuration
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'repspheres-auth', // Unified key
    flowType: 'pkce' as const, // Most secure flow
  },
});

// Helper to get the current app URL for redirects
export const getAppUrl = () => {
  if (typeof window === 'undefined') return '';

  // Always use the current window origin to get the correct port
  return window.location.origin;
};

// Get redirect URL for OAuth
export const getRedirectUrl = (returnPath?: string) => {
  const baseUrl = getAppUrl();
  return returnPath ? `${baseUrl}${returnPath}` : baseUrl;
};
