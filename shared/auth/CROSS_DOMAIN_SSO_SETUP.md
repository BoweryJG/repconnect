# Cross-Domain SSO Setup Instructions

## Prerequisites

- All apps deployed to their respective subdomains:
  - canvas.repspheres.com
  - crm.repspheres.com
  - market-data.repspheres.com
- SSL certificates configured for all domains
- Supabase project configured with proper redirect URLs

## Step 1: Update Supabase Redirect URLs

Add these URLs to your Supabase project's allowed redirect URLs:

```
https://canvas.repspheres.com/auth/callback
https://crm.repspheres.com/auth/callback
https://market-data.repspheres.com/auth/callback
http://localhost:7001/auth/callback
http://localhost:7002/auth/callback
http://localhost:7003/auth/callback
```

## Step 2: Deploy sync.html to All Apps

Each app needs the sync.html file in their public/auth directory:

```bash
# Canvas
cp shared/auth/sync.html canvas/public/auth/sync.html

# CRM
cp shared/auth/sync.html crm/public/auth/sync.html

# Market Data
cp shared/auth/sync.html market-data-jg/public/auth/sync.html
```

## Step 3: Update App Routes

Ensure each app has the auth callback route configured:

### Canvas (App.tsx)

```typescript
import UnifiedAuthCallback from './pages/AuthCallback';

// In routes
<Route path="/auth/callback" element={<UnifiedAuthCallback />} />
```

### CRM (App.tsx)

```typescript
import UnifiedAuthCallback from './pages/UnifiedAuthCallback';

// In routes
<Route path="/auth/callback" element={<UnifiedAuthCallback />} />
```

### Market Data (App.tsx)

```typescript
import AuthCallback from './pages/AuthCallback';

// In routes
<Route path="/auth/callback" element={<AuthCallback />} />
```

## Step 4: Update App Initialization

Each app should initialize cross-domain SSO on startup:

```typescript
// In main App component or index file
import { initializeCrossDomainSSO } from './auth/unifiedSupabase';

// In useEffect on mount
useEffect(() => {
  initializeCrossDomainSSO();
}, []);
```

## Step 5: Configure CORS for Development

For local development, ensure your dev server allows cross-origin requests:

### Vite Config (vite.config.ts)

```typescript
export default defineConfig({
  server: {
    cors: {
      origin: ['http://localhost:7001', 'http://localhost:7002', 'http://localhost:7003'],
      credentials: true,
    },
  },
});
```

## Step 6: Test Cross-Domain SSO

### Production Testing

1. Clear all cookies and local storage
2. Sign in to canvas.repspheres.com
3. Navigate to crm.repspheres.com - should be authenticated
4. Navigate to market-data.repspheres.com - should be authenticated
5. Sign out from any app - should sign out from all

### Local Development Testing

1. Start all apps on their respective ports
2. Sign in to localhost:7001 (Canvas)
3. Navigate to localhost:7003 (CRM) - should be authenticated
4. Navigate to localhost:7002 (Market Data) - should be authenticated

## Step 7: Monitor and Debug

### Check Auth State

```javascript
// In browser console
localStorage.getItem('sb-cbopynuvhcymbumjnvay-auth-token');
document.cookie.match(/repspheres_auth=true/);
```

### Debug Cross-Domain Issues

1. Check browser console for CORS errors
2. Verify sync.html is accessible at each domain
3. Check that cookies have correct domain (.repspheres.com)
4. Ensure all redirect URLs are whitelisted in Supabase

## Security Considerations

1. **HTTPS Required**: Cross-domain cookies require secure context
2. **SameSite Policy**: Cookies use `SameSite=Lax` for security
3. **Domain Validation**: sync.html validates message origins
4. **Token Isolation**: Gmail tokens stored separately per user

## Troubleshooting

### User not authenticated across domains

- Check cookie domain is set to `.repspheres.com`
- Verify HTTPS is enabled on all domains
- Check browser doesn't block third-party cookies

### OAuth redirect fails

- Verify redirect URL is whitelisted in Supabase
- Check app is using the unified auth components
- Ensure AuthCallback properly initializes SSO

### Local development issues

- Use consistent ports (7001, 7002, 7003)
- Check CORS configuration in dev server
- Verify all apps use the same Supabase instance
