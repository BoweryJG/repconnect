import axios from 'axios';
import { supabase } from '../lib/supabase';

// API base URL
export const API_BASE_URL =
  process.env.REACT_APP_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Always send cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add CSRF token and Authorization header
api.interceptors.request.use(
  async (config) => {
    // Add CSRF token for non-GET requests
    // Commented out since backend doesn't implement CSRF yet
    // if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
    //   const csrfToken = getCSRFToken();
    //   if (csrfToken) {
    //     config.headers['X-CSRF-Token'] = csrfToken;
    //   }
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
      console.error('Failed to get auth session:', error);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 (Unauthorized) - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // First check if we have a session to refresh
        const {
          data: { session: currentSession },
        } = await supabase.auth.getSession();

        if (!currentSession) {
          // No session to refresh, reject with original error
          return Promise.reject(error);
        }

        // Try to refresh Supabase session
        const {
          data: { session },
          error: refreshError,
        } = await supabase.auth.refreshSession();

        if (refreshError || !session) {
          // Session refresh failed, user needs to log in again
          return Promise.reject(error);
        }

        // Retry the original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${session.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Don't log refresh errors for unauthenticated users
        if (error.response?.data?.error?.code !== 'NOT_AUTHENTICATED') {
          console.error('Session refresh error:', refreshError);
        }
        return Promise.reject(error);
      }
    }

    // Handle 403 (Forbidden) - CSRF token issue
    // Commented out since backend doesn't implement CSRF yet
    // if (error.response?.status === 403 && error.response?.data?.error?.includes('CSRF')) {
    //   try {
    //     // Get new CSRF token
    //     await api.get('/auth/csrf');
    //     // Retry original request
    //     return api(originalRequest);
    //   } catch (csrfError) {
    //     return Promise.reject(csrfError);
    //   }
    // }

    return Promise.reject(error);
  }
);

// Export configured instance
export default api;
