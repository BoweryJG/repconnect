# Google OAuth Consolidation for Gmail Features

## Overview

This document outlines the consolidated Google OAuth setup for Gmail features across all RepSpheres applications.

## Google Cloud Console Setup

### OAuth 2.0 Client ID Configuration

1. **Application Type**: Web application
2. **Name**: RepSpheres Gmail Integration

### Authorized Redirect URIs

Add ALL of the following redirect URIs to your Google OAuth Client:

#### Production URIs

- `https://crm.repspheres.com/auth/google/callback`
- `https://marketdata.repspheres.com/auth/google/callback`
- `https://osbackend-zl1h.onrender.com/auth/google/callback`

#### Development URIs

- `http://localhost:3000/auth/google/callback`
- `http://localhost:7003/auth/google/callback`

### Required OAuth Scopes

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/gmail.compose`
- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/userinfo.email`

## Environment Variables

### osbackend (.env)

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Frontend Applications (CRM, Market Data)

Update the following environment variables in Netlify/deployment configs:

```env
# Backend API URL
REACT_APP_BACKEND_URL=https://osbackend-zl1h.onrender.com
```

## Implementation Flow

### 1. User Authentication Flow

1. User logs in with Supabase authentication first
2. In settings, user sees "Connect Gmail" button
3. User clicks button to initiate OAuth flow

### 2. OAuth Flow

1. Frontend calls `GET /api/auth/google/url` (requires auth)
2. Backend generates OAuth URL with appropriate redirect URI based on origin
3. User is redirected to Google OAuth consent screen
4. After authorization, Google redirects to callback URL
5. Backend exchanges code for tokens and stores in `user_gmail_tokens` table
6. User is redirected back to app with success status

### 3. API Endpoints

#### Get OAuth URL

```
GET /api/auth/google/url
Headers:
  - Cookie: session=<supabase-token>
  - Origin: <app-origin>
Response: { authUrl: "https://accounts.google.com/o/oauth2/v2/auth..." }
```

#### OAuth Callback (handled by backend)

```
GET /api/auth/google/callback?code=<auth-code>&state=<state-data>
```

#### Get Connected Gmail Accounts

```
GET /api/auth/google/accounts
Headers:
  - Cookie: session=<supabase-token>
Response: { accounts: [{ email, created_at, expires_at }] }
```

#### Disconnect Gmail Account

```
DELETE /api/auth/google/disconnect
Headers:
  - Cookie: session=<supabase-token>
Body: { email: "user@gmail.com" }
```

#### Refresh Token

```
POST /api/auth/google/refresh
Headers:
  - Cookie: session=<supabase-token>
Body: { email: "user@gmail.com" }
```

## Database Schema

### user_gmail_tokens table

- `id`: UUID (Primary Key)
- `user_id`: UUID (Foreign Key to auth.users)
- `email`: VARCHAR(255)
- `access_token`: TEXT
- `refresh_token`: TEXT
- `token_type`: VARCHAR(50)
- `expires_at`: TIMESTAMP WITH TIME ZONE
- `scope`: TEXT
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE

## Frontend Implementation

### Settings Component Example

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';

function GmailSettings() {
  const { user } = useAuth();
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/google/accounts`, {
        credentials: 'include'
      });
      const data = await response.json();
      setConnectedAccounts(data.accounts || []);
    } catch (error) {
      console.error('Failed to fetch Gmail accounts:', error);
    }
  };

  const connectGmail = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/google/url?returnUrl=${window.location.href}`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to initiate Gmail connection:', error);
      setLoading(false);
    }
  };

  const disconnectGmail = async (email) => {
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/google/disconnect`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      fetchConnectedAccounts();
    } catch (error) {
      console.error('Failed to disconnect Gmail:', error);
    }
  };

  return (
    <div>
      <h3>Gmail Integration</h3>
      {connectedAccounts.length === 0 ? (
        <button onClick={connectGmail} disabled={loading}>
          {loading ? 'Connecting...' : 'Connect Gmail Account'}
        </button>
      ) : (
        <div>
          <h4>Connected Accounts:</h4>
          {connectedAccounts.map(account => (
            <div key={account.email}>
              <span>{account.email}</span>
              <button onClick={() => disconnectGmail(account.email)}>
                Disconnect
              </button>
            </div>
          ))}
          <button onClick={connectGmail}>Connect Another Account</button>
        </div>
      )}
    </div>
  );
}
```

## Security Considerations

1. **Token Storage**: All tokens are stored encrypted in the database
2. **RLS Policies**: Users can only access their own Gmail tokens
3. **Token Refresh**: Implement automatic token refresh before expiration
4. **Scope Limitation**: Only request necessary Gmail scopes
5. **HTTPS Only**: All OAuth flows must use HTTPS in production

## Migration Steps

1. Run the SQL migration to create `user_gmail_tokens` table
2. Update osbackend with Google OAuth credentials
3. Deploy updated osbackend with new routes
4. Update frontend applications to show Gmail connection UI
5. Test OAuth flow end-to-end
6. Monitor for any authentication issues

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**: Ensure ALL redirect URIs are added to Google Console
2. **Cookie Issues**: Check that cookies are set with proper domain/sameSite settings
3. **Token Expiration**: Implement automatic refresh logic
4. **CORS Issues**: Ensure proper CORS headers for cross-origin requests

### Debug Endpoints

- Check auth status: `GET /api/auth/me`
- Get CSRF token: `GET /api/auth/csrf`
- View connected accounts: `GET /api/auth/google/accounts`
