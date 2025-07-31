# CRM Auth Migration Guide

## Overview

This guide details how to migrate the CRM app from Google OAuth to unified Supabase authentication while keeping Google OAuth for Gmail features only.

## Step 1: Update Auth Imports

Replace the existing auth imports in CRM with the unified auth components:

```typescript
// Old imports in src/auth/AuthContext.tsx
import { supabase, getRedirectUrl } from './supabase';

// New imports
import { UnifiedAuthProvider } from '../../shared/auth/UnifiedAuthContext';
import { supabase, getRedirectUrl } from '../../shared/auth/unifiedSupabase';
```

## Step 2: Update AuthContext Implementation

Replace the CRM's AuthContext with a wrapper around UnifiedAuthProvider:

```typescript
// src/auth/AuthContext.tsx
import React, { useContext } from 'react';
import { UnifiedAuthProvider } from '../../../shared/auth/UnifiedAuthContext';
import { AuthContext as UnifiedAuthContext } from '../../../shared/auth/UnifiedAuthContext';
import type { AuthContextType } from '../../../shared/auth/AuthContextType';

// Re-export the unified auth context
export const AuthContext = UnifiedAuthContext;

// Add CRM-specific extensions if needed
interface CRMAuthContextType extends AuthContextType {
  // Keep these for backward compatibility
  signInWithGoogle: (intendedPath?: string | null) => Promise<void>;
  signInWithFacebook: (intendedPath?: string | null) => Promise<void>;
  // Compatibility methods
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error: Error | null }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error: Error | null }>;
}

// Export the provider with CRM-specific wrapper
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <UnifiedAuthProvider>{children}</UnifiedAuthProvider>;
};

// Hook with CRM-specific extensions
export const useAuth = (): CRMAuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Add CRM-specific methods
  const signInWithGoogle = async (intendedPath?: string | null) => {
    if (intendedPath) {
      sessionStorage.setItem('intendedDestination', intendedPath);
    }
    await context.signInWithProvider('google');
  };

  const signInWithFacebook = async (intendedPath?: string | null) => {
    if (intendedPath) {
      sessionStorage.setItem('intendedDestination', intendedPath);
    }
    await context.signInWithProvider('facebook');
  };

  // Compatibility methods
  const signIn = async (email: string, password: string) => {
    try {
      await context.signInWithEmail(email, password);
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await context.signUpWithEmail(email, password);
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getRedirectUrl('/login'),
      });

      if (error) throw error;

      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error };
    }
  };

  return {
    ...context,
    signInWithGoogle,
    signInWithFacebook,
    signIn,
    signUp,
    resetPassword,
  };
};
```

## Step 3: Keep Google OAuth for Gmail Features

Create a separate service for Gmail OAuth that doesn't interfere with main auth:

```typescript
// src/services/gmail/gmailOAuthService.ts
import { google } from 'googleapis';

export class GmailOAuthService {
  private static SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify',
  ];

  static async authorizeGmail() {
    // This is separate from main auth - only for Gmail API access
    // Store tokens separately with user-specific keys
    const userEmail = localStorage.getItem('crm_user_email');
    if (!userEmail) throw new Error('User must be logged in first');

    // Implement Gmail-specific OAuth flow
    // Store tokens as gmail_tokens_${userEmail}
  }
}
```

## Step 4: Update Package.json

Add the shared auth path to the CRM's package.json:

```json
{
  "dependencies": {
    "@shared/auth": "file:../shared/auth"
  }
}
```

## Step 5: Update Environment Variables

Ensure CRM uses the same Supabase configuration:

- Remove any CRM-specific Supabase URL/keys
- The unified auth will use the shared configuration

## Step 6: Update AuthCallback

Update the AuthCallback page to use the unified auth:

```typescript
// src/pages/AuthCallback.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeCrossDomainSSO } from '../../../shared/auth/unifiedSupabase';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      // Initialize cross-domain SSO
      await initializeCrossDomainSSO();

      // Get intended destination
      const intendedPath = sessionStorage.getItem('authReturnPath') || '/dashboard';
      sessionStorage.removeItem('authReturnPath');

      // Navigate to intended destination
      navigate(intendedPath);
    };

    handleCallback();
  }, [navigate]);

  return <div>Completing sign in...</div>;
};
```

## Step 7: Test Cross-Domain SSO

1. Sign in to Canvas at canvas.repspheres.com
2. Navigate to crm.repspheres.com
3. User should be automatically authenticated
4. Test Gmail features work independently

## Migration Checklist

- [ ] Update auth imports to use shared auth
- [ ] Replace AuthContext with UnifiedAuthProvider wrapper
- [ ] Update useAuth hook with CRM-specific extensions
- [ ] Create separate Gmail OAuth service
- [ ] Update AuthCallback page
- [ ] Update package.json dependencies
- [ ] Test cross-domain SSO
- [ ] Test Gmail features still work
- [ ] Remove old Google OAuth as primary auth
- [ ] Update any auth-dependent components
