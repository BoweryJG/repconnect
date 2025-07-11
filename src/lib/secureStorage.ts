// Secure storage utility for sensitive data
// In production, sensitive tokens should be stored in httpOnly cookies set by the backend

class SecureStorage {
  // Use sessionStorage for temporary sensitive data (cleared when tab closes)
  // For production, implement httpOnly cookie-based authentication

  private isProduction = process.env.NODE_ENV === 'production';

  // Authentication tokens should be stored in memory or sessionStorage
  private memoryStorage: Map<string, any> = new Map();

  setAuthToken(token: string): void {
    if (this.isProduction) {
      // In production, this should be handled by httpOnly cookies from the backend
      // For now, use sessionStorage as it's cleared when the browser closes
      sessionStorage.setItem('auth_token', token);
    } else {
      // Development mode - use sessionStorage
      sessionStorage.setItem('auth_token', token);
    }

    // Also keep in memory for immediate access
    this.memoryStorage.set('auth_token', token);
  }

  getAuthToken(): string | null {
    // First check memory
    const memoryToken = this.memoryStorage.get('auth_token');
    if (memoryToken) return memoryToken;

    // Then check sessionStorage
    const sessionToken = sessionStorage.getItem('auth_token');
    if (sessionToken) {
      this.memoryStorage.set('auth_token', sessionToken);
      return sessionToken;
    }

    return null;
  }

  clearAuthToken(): void {
    this.memoryStorage.delete('auth_token');
    sessionStorage.removeItem('auth_token');
  }

  // For non-sensitive user preferences, localStorage is acceptable
  setUserPreference(key: string, value: any): void {
    try {
      localStorage.setItem(`pref_${key}`, JSON.stringify(value));
    } catch (e) {
      // Handle storage errors gracefully
    }
  }

  getUserPreference(key: string, defaultValue?: any): any {
    try {
      const item = localStorage.getItem(`pref_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  // Session data that should be cleared on browser close
  setSessionData(key: string, value: any): void {
    try {
      sessionStorage.setItem(`session_${key}`, JSON.stringify(value));
    } catch (e) {
      // Handle storage errors gracefully
    }
  }

  getSessionData(key: string, defaultValue?: any): any {
    try {
      const item = sessionStorage.getItem(`session_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  clearSession(): void {
    // Clear all session data
    sessionStorage.clear();
    this.memoryStorage.clear();
  }

  // Check if storage is available
  isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
}

export const secureStorage = new SecureStorage();
