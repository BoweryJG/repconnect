import { supabase } from '../lib/supabase';

/**
 * Safe wrapper for getting Supabase session that respects logout state
 * @returns {Promise<{session: any | null}>}
 */
export async function getSafeSession() {
  // Check if logout is in progress
  const logoutInProgress = localStorage.getItem('repconnect_logout_in_progress');
  if (logoutInProgress === 'true') {
    return { session: null };
  }

  try {
    const { data } = await supabase.auth.getSession();
    return { session: data.session };
  } catch (error) {
    console.error('Error getting session:', error);
    return { session: null };
  }
}

/**
 * Mark logout as in progress
 */
export function markLogoutInProgress() {
  localStorage.setItem('repconnect_logout_in_progress', 'true');
}

/**
 * Clear logout in progress flag
 */
export function clearLogoutFlag() {
  localStorage.removeItem('repconnect_logout_in_progress');
}
