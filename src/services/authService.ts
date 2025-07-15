import axios from 'axios';
import { supabase } from '../lib/supabase';
import logger from '../utils/logger';

// Configure axios defaults
axios.defaults.withCredentials = true;

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

// Get CSRF token from cookie
const getCSRFToken = (): string | null => {
  const matches = document.cookie.match(/csrf_token=([^;]+)/);
  return matches ? matches[1] : null;
};

// Add CSRF token and Authorization header to axios requests
axios.interceptors.request.use(
  async (config) => {
    // Add CSRF token for non-GET requests
    // Commented out since backend doesn't implement CSRF yet
    // const csrfToken = getCSRFToken();
    // if (csrfToken && config.method !== 'get') {
    //   config.headers['X-CSRF-Token'] = csrfToken;
    // }

    // Add Authorization header with Supabase token
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      logger.error('Failed to get auth session:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses (session expired)
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;

      try {
        // Try to refresh Supabase session
        const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !session) {
          throw new Error('Session refresh failed');
        }
        
        // Retry the original request with new token
        error.config.headers['Authorization'] = `Bearer ${session.access_token}`;
        return axios(error.config);
      } catch (refreshError) {
        // Don't redirect - let the app handle showing login modal
        logger.error('Session refresh failed:', refreshError);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Login and exchange Supabase session for httpOnly cookies
  async loginWithCookies(session: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      return response.data;
    } catch (error) {
      logger.error('Login with cookies error:', error);
      throw error;
    }
  },

  // Logout and clear cookies
  async logout() {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`);
      await supabase.auth.signOut();
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  },

  // Get current user from cookie session
  async getCurrentUser() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/me`);
      return response.data.user;
    } catch (error) {
      logger.error('Get current user error:', error);
      return null;
    }
  },

  // Refresh session
  async refreshSession() {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`);
      return response.data;
    } catch (error) {
      logger.error('Refresh session error:', error);
      throw error;
    }
  },

  // Get new CSRF token
  async getNewCSRFToken() {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/auth/csrf`);
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
