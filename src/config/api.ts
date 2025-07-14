import axios from 'axios';

// API base URL
export const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Always send cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Get CSRF token from cookie
const getCSRFToken = (): string | null => {
  const matches = document.cookie.match(/csrf_token=([^;]+)/);
  return matches ? matches[1] : null;
};

// Request interceptor to add CSRF token
api.interceptors.request.use(
  (config) => {
    // Add CSRF token for non-GET requests
    if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
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
        await api.post('/api/auth/refresh');
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 (Forbidden) - CSRF token issue
    if (error.response?.status === 403 && error.response?.data?.error?.includes('CSRF')) {
      try {
        // Get new CSRF token
        await api.get('/api/auth/csrf');
        // Retry original request
        return api(originalRequest);
      } catch (csrfError) {
        return Promise.reject(csrfError);
      }
    }

    return Promise.reject(error);
  }
);

// Export configured instance
export default api;
