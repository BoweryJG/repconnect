# WebSocket Authentication Implementation

## Overview

This document describes the WebSocket authentication implementation for the RepConnect backend server. The authentication system ensures that only authenticated users can connect to WebSocket endpoints and participate in real-time features.

## Authentication Flow

### 1. Token Sources

The WebSocket authentication middleware (`socketAuthMiddleware`) accepts tokens from multiple sources:

- **Session Cookie**: `session` cookie containing JWT token (preferred method)
- **Handshake Auth**: `socket.handshake.auth.token` or `socket.handshake.auth.access_token`
- **Query Parameters**: `socket.handshake.query.token` or `socket.handshake.query.access_token`
- **Authorization Header**: `Bearer` token in `socket.handshake.headers.authorization`

### 2. Authentication Process

1. **Token Extraction**: Extract token from available sources
2. **Session Validation**: If session cookie exists, verify JWT and check expiration
3. **Supabase Verification**: Validate token with Supabase Auth
4. **User Attachment**: Attach user information to socket instance
5. **Success/Failure**: Allow connection or reject with error

## Implementation Details

### Socket Authentication Middleware

Location: `/src/middleware/socketAuthMiddleware.js`

Key functions:

- `socketAuthMiddleware`: Main authentication middleware
- `getSocketUserId`: Extract user ID from authenticated socket
- `getSocketUserEmail`: Extract user email from authenticated socket
- `isSocketAuthenticated`: Check if socket is authenticated
- `requireSocketAuth`: Wrapper for event handlers requiring authentication

### Server Integration

Location: `/server.js`

Both main Socket.IO namespace and Harvey namespace (`/harvey-ws`) are protected:

- Authentication middleware applied to both namespaces
- All event handlers wrapped with `requireSocketAuth`
- Connection errors logged for debugging

## Usage Examples

### Client-Side Connection

#### Using Session Cookie (Recommended)

```javascript
// Session cookie is automatically sent
const socket = io('http://localhost:3001');
```

#### Using Token in Auth

```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token-here',
  },
});
```

#### Using Query Parameter

```javascript
const socket = io('http://localhost:3001', {
  query: {
    token: 'your-jwt-token-here',
  },
});
```

### Server-Side Event Handling

```javascript
// Protected event handler
socket.on(
  'join-coaching-room',
  requireSocketAuth((socket, data) => {
    const userId = getSocketUserId(socket);
    // Handle authenticated user's room join
  })
);
```

## Security Features

### 1. Token Validation

- JWT tokens verified against secret
- Session expiration checked (30 minutes)
- Supabase token validation for user existence

### 2. Authorization

- Room access controlled by user ID validation
- Users can only join their own coaching sessions
- Event handlers protected with authentication wrapper

### 3. Error Handling

- Authentication failures logged with context
- Descriptive error messages sent to client
- Connection errors tracked for monitoring

### 4. User Context

- User information attached to socket instance
- Consistent user ID and email access across handlers
- Session data available for additional validation

## Error Codes

| Code                       | Description                            |
| -------------------------- | -------------------------------------- |
| `UNAUTHORIZED`             | No valid authentication token provided |
| `INVALID_TOKEN`            | Token validation failed                |
| `SESSION_EXPIRED`          | Session cookie expired                 |
| `UNAUTHORIZED_ROOM_ACCESS` | User not authorized for requested room |
| `INVALID_AGENT_ID`         | Invalid Harvey agent ID                |
| `MESSAGE_PROCESSING_ERROR` | Error processing user message          |

## Monitoring and Logging

### Authentication Events

- Successful connections logged with user info
- Failed authentication attempts logged with reasons
- Connection errors tracked for debugging

### Log Examples

```javascript
// Success
logger.info('Socket authenticated successfully', {
  socketId: socket.id,
  userId: user.id,
  email: user.email,
});

// Failure
logger.warn('Socket authentication failed: No token provided', {
  socketId: socket.id,
  handshakeAuth: socket.handshake.auth,
});
```

## Migration Notes

### Breaking Changes

- All WebSocket connections now require authentication
- Event handlers validate user authorization
- Legacy userId extraction from handshake deprecated

### Backward Compatibility

- Multiple token sources supported for gradual migration
- Existing session cookie authentication maintained
- Error messages help identify authentication issues

## Testing

### Authentication Testing

1. Connect with valid session cookie
2. Connect with valid access token
3. Connect without authentication (should fail)
4. Test session expiration handling
5. Test unauthorized room access

### Event Testing

1. Test protected event handlers
2. Verify user context availability
3. Test error handling for invalid requests
4. Verify logging output

## Troubleshooting

### Common Issues

1. **Connection Rejected**: Check token validity and expiration
2. **Event Errors**: Ensure proper authentication before events
3. **Room Access Denied**: Verify user ID matches room authorization
4. **Session Expiration**: Implement token refresh on client side

### Debug Steps

1. Check server logs for authentication errors
2. Verify token format and content
3. Test with different token sources
4. Monitor network requests for token transmission
