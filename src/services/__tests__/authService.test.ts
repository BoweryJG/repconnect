// @ts-nocheck
import axios from 'axios';
import { authService } from '../authService';
import { supabase } from '../../lib/supabase';
import { mockSupabaseClient, mockSession, mockUser } from '../../test-utils/testUtils';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock supabase
jest.mock('../../lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: 'csrf_token=test-csrf-token',
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset axios interceptors
    mockedAxios.interceptors.request.use = jest.fn();
    mockedAxios.interceptors.response.use = jest.fn();
  });

  describe('Authentication Methods', () => {
    it('should sign in user successfully', async () => {
      mockSupabaseClient.auth.signIn.mockResolvedValueOnce({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, user: mockUser },
      });

      const result = await authService.signIn('test@example.com', 'password123');

      expect(result.user).toEqual(mockUser);
      expect(mockSupabaseClient.auth.signIn).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/session'),
        { session: mockSession },
        { withCredentials: true }
      );
    });

    it('should handle sign in error', async () => {
      const error = new Error('Invalid credentials');
      mockSupabaseClient.auth.signIn.mockResolvedValueOnce({
        data: { session: null, user: null },
        error,
      });

      await expect(authService.signIn('test@example.com', 'wrong-password')).rejects.toThrow(
        'Invalid credentials'
      );
    });

    it('should sign up user successfully', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { session: mockSession, user: mockUser },
        error: null,
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, user: mockUser },
      });

      const result = await authService.signUp({
        email: 'new@example.com',
        password: 'password123',
        fullName: 'New User',
      });

      expect(result.user).toEqual(mockUser);
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: { full_name: 'New User' },
        },
      });
    });

    it('should sign out user successfully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({
        error: null,
      });

      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true },
      });

      await authService.signOut();

      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        {},
        { withCredentials: true }
      );
    });
  });

  describe('Session Management', () => {
    it('should get current session', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const session = await authService.getSession();
      expect(session).toEqual(mockSession);
    });

    it('should refresh session successfully', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true, session: mockSession },
      });

      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const result = await authService.refreshSession();
      expect(result).toEqual(mockSession);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        {},
        { withCredentials: true }
      );
    });

    it('should handle session refresh failure', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Refresh failed'));

      await expect(authService.refreshSession()).rejects.toThrow('Refresh failed');
    });

    it('should check if user is authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(true);
    });

    it('should return false when no session exists', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('CSRF Protection', () => {
    it('should add CSRF token to non-GET requests', async () => {
      const mockConfig = {
        method: 'post',
        headers: {},
      };

      // Get the request interceptor
      const requestInterceptor = mockedAxios.interceptors.request.use.mock.calls[0][0];
      const result = await requestInterceptor(mockConfig);

      expect(result.headers['X-CSRF-Token']).toBe('test-csrf-token');
    });

    it('should not add CSRF token to GET requests', async () => {
      const mockConfig = {
        method: 'get',
        headers: {},
      };

      const requestInterceptor = mockedAxios.interceptors.request.use.mock.calls[0][0];
      const result = await requestInterceptor(mockConfig);

      expect(result.headers['X-CSRF-Token']).toBeUndefined();
    });

    it('should handle missing CSRF token', async () => {
      document.cookie = '';

      const mockConfig = {
        method: 'post',
        headers: {},
      };

      const requestInterceptor = mockedAxios.interceptors.request.use.mock.calls[0][0];
      const result = await requestInterceptor(mockConfig);

      expect(result.headers['X-CSRF-Token']).toBeUndefined();
    });
  });

  describe('401 Response Handling', () => {
    it('should refresh token on 401 response', async () => {
      const mockError = {
        response: { status: 401 },
        config: { _retry: false },
      };

      mockedAxios.post.mockResolvedValueOnce({
        data: { success: true },
      });

      mockedAxios.mockResolvedValueOnce({
        data: { success: true },
      });

      const responseInterceptor = mockedAxios.interceptors.response.use.mock.calls[0][1];
      const result = await responseInterceptor(mockError);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/refresh'),
        {},
        { withCredentials: true }
      );
      expect(mockedAxios).toHaveBeenCalledWith(mockError.config);
    });

    it('should redirect to login on refresh failure', async () => {
      const mockError = {
        response: { status: 401 },
        config: { _retry: false },
      };

      mockedAxios.post.mockRejectedValueOnce(new Error('Refresh failed'));

      // Mock window.location
      delete window.location;
      window.location = { href: '' } as Location;

      const responseInterceptor = mockedAxios.interceptors.response.use.mock.calls[0][1];

      await expect(responseInterceptor(mockError)).rejects.toThrow();
      expect(window.location.href).toBe('/login');
    });

    it('should not retry if already retried', async () => {
      const mockError = {
        response: { status: 401 },
        config: { _retry: true },
      };

      const responseInterceptor = mockedAxios.interceptors.response.use.mock.calls[0][1];

      await expect(responseInterceptor(mockError)).rejects.toEqual(mockError);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('User Profile Management', () => {
    it('should get user profile', async () => {
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-1', email: 'test@example.com', full_name: 'Test User' },
          error: null,
        }),
      });

      const profile = await authService.getUserProfile('user-1');
      expect(profile).toEqual({
        id: 'user-1',
        email: 'test@example.com',
        full_name: 'Test User',
      });
    });

    it('should update user profile', async () => {
      const updates = { full_name: 'Updated Name' };

      mockSupabaseClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-1', ...updates },
          error: null,
        }),
      });

      const result = await authService.updateUserProfile('user-1', updates);
      expect(result.full_name).toBe('Updated Name');
    });
  });

  describe('Password Management', () => {
    it('should reset password successfully', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      await authService.resetPassword('test@example.com');

      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: expect.stringContaining('/reset-password'),
        }
      );
    });

    it('should update password successfully', async () => {
      mockSupabaseClient.auth.updateUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      await authService.updatePassword('newPassword123');

      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123',
      });
    });
  });

  describe('OAuth Integration', () => {
    it('should sign in with OAuth provider', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValueOnce({
        data: { url: 'https://provider.com/auth', provider: 'google' },
        error: null,
      });

      const result = await authService.signInWithOAuth('google');

      expect(result.url).toBe('https://provider.com/auth');
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
        },
      });
    });
  });

  describe('Session Timeout Handling', () => {
    jest.useFakeTimers();

    it('should auto-refresh session before expiry', async () => {
      const refreshSpy = jest.spyOn(authService, 'refreshSession');
      refreshSpy.mockResolvedValue(mockSession);

      authService.startSessionRefreshTimer(mockSession);

      // Fast-forward 15 minutes (refresh interval)
      jest.advanceTimersByTime(15 * 60 * 1000);

      expect(refreshSpy).toHaveBeenCalled();
    });

    it('should show session timeout warning', async () => {
      const warningSpy = jest.fn();
      authService.onSessionWarning(warningSpy);

      authService.startSessionTimeoutWarning(mockSession);

      // Fast-forward 25 minutes (5 minutes before timeout)
      jest.advanceTimersByTime(25 * 60 * 1000);

      expect(warningSpy).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });
});
