// Main auth exports - this is what other apps will import
export { AuthProvider } from './AuthContext';
export { useAuth } from './useAuth';
export { supabase, getAppUrl, getRedirectUrl } from './supabase';
export * from './hooks';
export * from './guards';
export * from './types';
