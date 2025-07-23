import api from '../config/api';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

// Note: CSRF token handling and interceptors are configured in config/api.ts

export const authService = {
  // Login and exchange Supabase session for httpOnly cookies
  async loginWithCookies(session: any) {
    try {
      const response = await api.post('/api/auth/login', {
        // eslint-disable-next-line camelcase
        access_token: session.access_token,
        // eslint-disable-next-line camelcase
        refresh_token: session.refresh_token,
      });

      return response.data;
    } catch (error: any) {
      console.error('[Auth] Login with cookies error:', error.response?.data || error.message);
      logger.error('Login with cookies error:', error);
      throw error;
    }
  },

  // Logout and clear cookies
  async logout() {
    try {
      await api.post('/api/auth/logout');
      await supabase.auth.signOut();
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  },

  // Get current user from cookie session
  async getCurrentUser() {
    try {
      const response = await api.get('/api/auth/me');
      return response.data.user;
    } catch (error: any) {
      logger.error('Get current user error:', error);
      return null;
    }
  },

  // Refresh session
  async refreshSession() {
    try {
      const response = await api.post('/api/auth/refresh');
      return response.data;
    } catch (error) {
      logger.error('Refresh session error:', error);
      throw error;
    }
  },

  // Get new CSRF token
  async getNewCSRFToken() {
    try {
      const response = await api.get('/api/auth/csrf');
      return response.data.csrfToken;
    } catch (error) {
      logger.error('Get CSRF token error:', error);
      throw error;
    }
  },

  // Check if session is active
  isSessionActive(): boolean {
    const lastActivity = document.cookie.match(/last_activity=([^;]+)/);
    if (!lastActivity) return false;

    const timeSinceLastActivity = Date.now() - parseInt(lastActivity[1]);
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    return timeSinceLastActivity < SESSION_TIMEOUT;
  },

  // Setup session timeout warning
  setupSessionTimeoutWarning(onWarning: () => void, onTimeout: () => void) {
    const WARNING_TIME = 5 * 60 * 1000; // 5 minutes before timeout
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    let warningTimer: NodeJS.Timeout;
    let timeoutTimer: NodeJS.Timeout;

    const resetTimers = () => {
      if (warningTimer) clearTimeout(warningTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);

      warningTimer = setTimeout(onWarning, SESSION_TIMEOUT - WARNING_TIME);
      timeoutTimer = setTimeout(onTimeout, SESSION_TIMEOUT);
    };

    // Reset timers on user activity
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach((event) => {
      document.addEventListener(event, resetTimers);
    });

    // Initial setup
    resetTimers();

    // Return cleanup function
    return () => {
      clearTimeout(warningTimer);
      clearTimeout(timeoutTimer);
      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetTimers);
      });
    };
  },
};

// Export a function to refresh session periodically
export const startSessionRefresh = () => {
  const REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes

  const refreshInterval = setInterval(async () => {
    try {
      if (authService.isSessionActive()) {
        await authService.refreshSession();
      }
    } catch (error) {
      logger.error('Auto refresh failed:', error);
    }
  }, REFRESH_INTERVAL);

  return () => clearInterval(refreshInterval);
};
