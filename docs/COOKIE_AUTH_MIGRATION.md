# Cookie-Based Authentication Migration Guide

## Overview
This guide provides step-by-step instructions for migrating from localStorage JWT storage to httpOnly cookie-based authentication with CSRF protection.

## What's Changed

### Before (localStorage)
- JWT stored in localStorage
- Token sent in Authorization header
- No CSRF protection
- Manual token management

### After (httpOnly cookies)
- JWT stored in httpOnly cookie
- Token automatically sent with requests
- CSRF protection enabled
- Automatic session management

## Migration Steps

### 1. Update API Calls

#### Before:
```javascript
// Old way - manual token handling
const token = localStorage.getItem('authToken');
const response = await fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### After:
```javascript
// New way - use the configured api instance
import api from '../config/api';

const response = await api.get('/api/data');
// Cookies and CSRF are handled automatically
```

### 2. Update Service Files

#### Example: Updating harveyService.ts

Before:
```typescript
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

const fetchData = async () => {
  const response = await fetch(`${API_URL}/data`, {
    headers: getAuthHeaders()
  });
  return response.json();
};
```

After:
```typescript
import api from '../config/api';

const fetchData = async () => {
  const response = await api.get('/data');
  return response.data;
};
```

### 3. Update Authentication Flow

#### Login Process

Before:
```javascript
// Store token in localStorage
const login = async (credentials) => {
  const response = await fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  const { token } = await response.json();
  localStorage.setItem('authToken', token);
};
```

After:
```javascript
// Token is stored in httpOnly cookie by the server
const login = async (credentials) => {
  const response = await api.post('/api/auth/login', credentials);
  // No need to handle token storage
  return response.data;
};
```

#### Logout Process

Before:
```javascript
const logout = () => {
  localStorage.removeItem('authToken');
  window.location.href = '/login';
};
```

After:
```javascript
import { authService } from '../services/authService';

const logout = async () => {
  await authService.logout();
  // Cookies are cleared by the server
};
```

### 4. Handle Session Management

The new system includes automatic session management:

```javascript
// In your main App component
import { SessionWarning } from './components/SessionWarning';

// Session warning is shown automatically 5 minutes before timeout
// Users can extend their session or log out
```

### 5. Update Protected Routes

Backend routes now use middleware:

```javascript
// Before
router.post('/api/data', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  // Manual token validation
});

// After
import { requireAuth } from '../middleware/authMiddleware';

router.post('/api/data', requireAuth, async (req, res) => {
  // req.user is automatically available
  const userId = req.user.id;
});
```

## Testing Checklist

- [ ] Test login flow
- [ ] Test logout flow
- [ ] Test session timeout (wait 30 minutes)
- [ ] Test session warning (appears at 25 minutes)
- [ ] Test session extension
- [ ] Test CSRF protection (modify requests)
- [ ] Test API error handling (401/403 responses)
- [ ] Test cross-origin requests

## Security Benefits

1. **XSS Protection**: Tokens in httpOnly cookies cannot be accessed by JavaScript
2. **CSRF Protection**: All state-changing requests require valid CSRF token
3. **Session Management**: Automatic timeout and refresh handling
4. **Secure Transport**: Cookies marked secure in production (HTTPS only)

## Common Issues and Solutions

### Issue: CSRF Token Missing
**Solution**: Ensure you're using the configured api instance or manually add the token:
```javascript
const csrfToken = document.cookie.match(/csrf_token=([^;]+)/)?.[1];
headers['X-CSRF-Token'] = csrfToken;
```

### Issue: Session Expired During Long Operation
**Solution**: Extend session before starting:
```javascript
await authService.refreshSession();
// Perform long operation
```

### Issue: Cookies Not Sent Cross-Origin
**Solution**: Ensure CORS is properly configured:
```javascript
// Server
app.use(cors({
  origin: 'https://your-frontend.com',
  credentials: true
}));

// Client
axios.defaults.withCredentials = true;
```

## Environment Variables

Add to your `.env`:
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SUPABASE_SERVICE_KEY=your-service-key
```

## Deployment Considerations

1. **Update CORS origins** in production
2. **Enable secure cookies** (automatic in production)
3. **Configure sameSite** based on your architecture
4. **Set up Redis** for CSRF token storage (currently using in-memory)

## Rollback Plan

If you need to rollback:
1. Revert AuthContext.tsx to original
2. Remove cookie-parser from server
3. Remove auth routes and middleware
4. Restore localStorage token handling in services

## Support

For questions or issues:
1. Check browser DevTools Network tab for cookie headers
2. Verify CSRF token in request headers
3. Check server logs for auth middleware errors
4. Test with curl to isolate client/server issues