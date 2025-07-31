import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration interface for Supabase
export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

// Store the client instance
let supabaseClient: SupabaseClient | null = null;

// Initialize Supabase with configuration
export const initializeSupabase = (config: SupabaseConfig): SupabaseClient => {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.warn('Supabase configuration incomplete');
  }

  supabaseClient = createClient(config.supabaseUrl || '', config.supabaseAnonKey || '');

  return supabaseClient;
};

// Get the Supabase client (must be initialized first)
export const getSupabase = (): SupabaseClient => {
  if (!supabaseClient) {
    throw new Error('Supabase not initialized. Call initializeSupabase first.');
  }
  return supabaseClient;
};

// Alias for compatibility
export const getSupabaseClient = getSupabase;

// For backward compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  },
});

export const getRedirectUrl = (path: string) => {
  const baseUrl = window.location.origin;
  return `${baseUrl}${path}`;
};
