# Market Data Auth Migration Guide

## Overview

This guide details how to migrate the Market Data app to use unified Supabase authentication for cross-domain SSO.

## Step 1: Update Auth Imports

Replace the existing auth imports in Market Data with the unified auth components:

```typescript
// Old imports in src/auth/AuthContext.tsx
import { supabase } from './supabase';

// New imports
import { UnifiedAuthProvider } from '../../shared/auth/UnifiedAuthContext';
import { supabase } from '../../shared/auth/unifiedSupabase';
```

## Step 2: Update AuthContext Implementation

Replace the Market Data's AuthContext with the unified version:

```typescript
// src/auth/AuthContext.tsx
import React from 'react';
export {
  UnifiedAuthProvider as AuthProvider,
  AuthContext,
  useAuth,
} from '../../../shared/auth/UnifiedAuthContext';
export type { AuthContextType } from '../../../shared/auth/AuthContextType';
```

## Step 3: Update supabase.ts

Replace the local supabase client with the unified one:

```typescript
// src/auth/supabase.ts
export * from '../../../shared/auth/unifiedSupabase';
```

## Step 4: Update AuthCallback

Update the AuthCallback page:

```typescript
// src/pages/AuthCallback.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { initializeCrossDomainSSO } from '../../../shared/auth/unifiedSupabase';
import { useAuth } from '../auth/AuthContext';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { loading } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      if (!loading) {
        // Initialize cross-domain SSO
        await initializeCrossDomainSSO();

        // Navigate to dashboard
        navigate('/');
      }
    };

    handleCallback();
  }, [loading, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-2">Completing sign in...</h2>
        <p className="text-gray-600">Please wait while we redirect you.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
```

## Step 5: Update Package.json

Add the shared auth path:

```json
{
  "dependencies": {
    "@shared/auth": "file:../shared/auth"
  }
}
```

## Step 6: Update Cross-Domain Auth Utilities

Update the existing crossDomainAuth.ts to use the unified helpers:

```typescript
// src/utils/crossDomainAuth.ts
export {
  checkCrossDomainAuth,
  initializeCrossDomainSSO,
  clearCrossDomainAuth,
  getCurrentApp,
} from '../../../shared/auth/unifiedSupabase';
```

## Step 7: Update Auth Components

Update any auth-related components to use the unified auth:

```typescript
// src/components/Auth/LoginModal.tsx
import React from 'react';
import { useAuth } from '../../auth/AuthContext';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { signInWithProvider, signInWithEmail, loading, error } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      await signInWithProvider('google');
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  // Rest of component...
};
```

## Step 8: Test Cross-Domain SSO

1. Clear all auth data and cookies
2. Sign in to Market Data at market-data.repspheres.com
3. Navigate to canvas.repspheres.com or crm.repspheres.com
4. User should be automatically authenticated
5. Test that all auth flows work correctly

## Migration Checklist

- [ ] Update auth imports to use shared auth
- [ ] Replace AuthContext with unified version
- [ ] Update supabase.ts to export from shared
- [ ] Update AuthCallback page
- [ ] Update package.json dependencies
- [ ] Update crossDomainAuth utilities
- [ ] Update all auth-dependent components
- [ ] Test cross-domain SSO in all directions
- [ ] Verify subscription checks work correctly
- [ ] Remove any duplicate auth code
