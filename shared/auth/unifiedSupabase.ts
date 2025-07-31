import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Unified Supabase configuration for all RepSpheres apps
const supabaseUrl = 'https://cbopynuvhcymbumjnvay.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib3B5bnV2aGN5bWJ1bWpudmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTUxNzMsImV4cCI6MjA1OTU3MTE3M30.UZElMkoHugIt984RtYWyfrRuv2rB67opQdCrFVPCfzU';

// Determine if we're in production based on hostname
const isProduction = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith('.repspheres.com');
};

// Get the base domain for cookie sharing
const getCookieDomain = () => {
  if (!isProduction()) return undefined; // Let cookies work on localhost
  return '.repspheres.com'; // Share cookies across all subdomains
};

// Create a single supabase client with cross-domain SSO configuration
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'sb-cbopynuvhcymbumjnvay-auth-token',
    flowType: 'implicit' as const,
    // Enable cross-domain cookie sharing in production
    ...(isProduction() && {
      cookieOptions: {
        domain: getCookieDomain(),
        sameSite: 'lax',
        secure: true,
      },
    }),
  },
});

// Helper to get the current app URL for redirects
export const getAppUrl = () => {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
};

// Get redirect URL for OAuth based on current app
export const getRedirectUrl = (returnPath?: string) => {
  const baseUrl = getAppUrl();
  return returnPath ? `${baseUrl}${returnPath}` : `${baseUrl}/auth/callback`;
};

// Helper to determine which app we're in
export const getCurrentApp = (): 'canvas' | 'crm' | 'market-data' | 'unknown' => {
  if (typeof window === 'undefined') return 'unknown';

  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  // Production domains
  if (hostname === 'canvas.repspheres.com') return 'canvas';
  if (hostname === 'crm.repspheres.com') return 'crm';
  if (hostname === 'market-data.repspheres.com') return 'market-data';

  // Local development (based on port)
  const port = window.location.port;
  if (port === '7001') return 'canvas';
  if (port === '7003') return 'crm';
  if (port === '7002') return 'market-data';

  // Fallback: check pathname
  if (pathname.includes('canvas')) return 'canvas';
  if (pathname.includes('crm')) return 'crm';
  if (pathname.includes('market')) return 'market-data';

  return 'unknown';
};

// Cross-domain SSO helper
export const initializeCrossDomainSSO = async () => {
  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session && isProduction()) {
    // Set a cross-domain cookie to share auth state
    document.cookie = `repspheres_auth=true; domain=${getCookieDomain()}; path=/; secure; samesite=lax`;

    // Store the current app in session storage for navigation tracking
    const currentApp = getCurrentApp();
    if (currentApp !== 'unknown') {
      sessionStorage.setItem('repspheres_current_app', currentApp);
    }
  }
};

// Helper to check if user is authenticated across domains
export const checkCrossDomainAuth = async (): Promise<boolean> => {
  // First check local session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return true;

  // In production, check for cross-domain auth cookie
  if (isProduction()) {
    const hasAuthCookie = document.cookie.includes('repspheres_auth=true');
    if (hasAuthCookie) {
      // Try to refresh the session
      const {
        data: { session: refreshedSession },
      } = await supabase.auth.refreshSession();
      return !!refreshedSession;
    }
  }

  return false;
};

// Clear cross-domain auth on sign out
export const clearCrossDomainAuth = () => {
  if (isProduction()) {
    // Clear the cross-domain cookie
    document.cookie = `repspheres_auth=; domain=${getCookieDomain()}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }

  // Clear app tracking
  sessionStorage.removeItem('repspheres_current_app');
};
