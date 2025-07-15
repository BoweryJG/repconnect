# Supabase Authentication Setup for RepConnect

This document describes the Supabase authentication implementation for accessing agentbackend.

## Overview

RepConnect now uses Supabase authentication to secure access to the agentbackend API. All API calls to agentbackend include JWT tokens from Supabase in the Authorization header.

## Configuration

### 1. Supabase Project
- **Project URL**: `https://fiozmyoedptukpkzuhqm.supabase.co` (bowerycreativeagency project)
- **Environment Variable**: `REACT_APP_SUPABASE_URL`
- **Anon Key**: Must be set in `REACT_APP_SUPABASE_ANON_KEY`

### 2. Updated Services

The following services have been updated to include Supabase authentication:

#### agentBackendAPI.js
- Added `getAuthHeaders()` method to retrieve JWT token from Supabase session
- Updated `fetchAgents()` and `getAgent()` methods to include auth headers
- All requests to agentbackend now include `Authorization: Bearer <token>` header

#### agentChatAPI.js
- Added `getAuthHeaders()` method for JWT token retrieval
- Updated `sendMessage()`, `streamMessage()`, and `getChatHistory()` to include auth headers
- Chat sessions are now authenticated with Supabase tokens

### 3. Authentication Flow

1. **Login**: Users authenticate via Google OAuth through Supabase
2. **Session Management**: AuthContext handles Supabase session and token refresh
3. **API Calls**: All agentbackend API calls automatically include the current JWT token
4. **Token Refresh**: Tokens are automatically refreshed when expired

## Required Environment Variables

```bash
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://fiozmyoedptukpkzuhqm.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here

# Agent Backend URL
REACT_APP_AGENT_BACKEND_URL=https://agentbackend-2932.onrender.com
```

## Google OAuth Setup

The application supports Google OAuth login through Supabase. The login flow is handled in `AuthContext.tsx`:

```javascript
signInWithProvider('google')
```

This redirects users to Google for authentication and then back to `/auth/callback`.

## Security Notes

1. **JWT Tokens**: All API requests to agentbackend include Supabase JWT tokens
2. **Token Refresh**: Tokens are automatically refreshed to maintain session
3. **Protected Routes**: Agentbackend should validate these JWT tokens using the Supabase JWT secret
4. **CORS**: Ensure agentbackend allows requests from your RepConnect domain

## Testing Authentication

1. Set up environment variables
2. Log in with Google OAuth
3. Check browser DevTools Network tab to verify Authorization headers on agentbackend requests
4. Verify that API calls succeed with authentication

## Troubleshooting

- **401 Errors**: Check if Supabase session is active and tokens are being included
- **CORS Issues**: Verify agentbackend CORS configuration allows your domain
- **Token Validation**: Ensure agentbackend is configured with the correct Supabase JWT secret