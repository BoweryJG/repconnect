# WebSocket Authentication Implementation

## Overview

This implementation adds comprehensive authentication to all WebSocket connections in the RepConnect backend server. Both the main Socket.IO namespace and the Harvey namespace (`/harvey-ws`) now require proper authentication before allowing connections.

## Key Features

### 1. Authentication Middleware

- **File**: `/src/middleware/socketAuthMiddleware.js`
- **Purpose**: Validates JWT tokens and Supabase sessions for WebSocket connections
- **Token Sources**: Session cookies, handshake auth, query parameters, authorization headers

### 2. Protected Namespaces

- **Main namespace**: All WebRTC signaling and coaching events
- **Harvey namespace**: AI chat and agent interactions

### 3. Event Protection

- All socket event handlers are wrapped with authentication checks
- User authorization validation for room access
- Comprehensive error handling and logging

## Files Modified

### 1. `/server.js`

- Added authentication middleware to both namespaces
- Wrapped all event handlers with `requireSocketAuth`
- Enhanced user context and logging
- Added connection error handling

### 2. `/src/middleware/socketAuthMiddleware.js` (New)

- Main authentication middleware
- Helper functions for user data extraction
- Authentication wrapper for event handlers
- Comprehensive error handling

### 3. `/docs/websocket-authentication.md` (New)

- Complete documentation of the authentication system
- Usage examples and troubleshooting guide

## Authentication Flow

1. **Token Extraction**: Multiple sources supported for flexibility
2. **Session Validation**: JWT verification and expiration checking
3. **Supabase Verification**: Token validation against Supabase Auth
4. **User Context**: Attach user information to socket instance
5. **Authorization**: Event-level access control

## Usage Examples

### Client Connection

```javascript
// Using session cookie (recommended)
const socket = io('http://localhost:3001');

// Using auth token
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' },
});
```

### Server Event Handling

```javascript
socket.on(
  'join-coaching-room',
  requireSocketAuth((socket, data) => {
    const userId = getSocketUserId(socket);
    // Handle authenticated user's request
  })
);
```

## Security Improvements

1. **Token Validation**: Multiple layers of token verification
2. **Session Management**: Proper session timeout handling
3. **Authorization**: Room-level access control
4. **Error Handling**: Comprehensive error tracking and logging
5. **User Context**: Consistent user identification across events

## Error Codes

| Code                       | Description                            |
| -------------------------- | -------------------------------------- |
| `UNAUTHORIZED`             | No valid token provided                |
| `INVALID_TOKEN`            | Token validation failed                |
| `SESSION_EXPIRED`          | Session cookie expired                 |
| `UNAUTHORIZED_ROOM_ACCESS` | User not authorized for requested room |

## Testing

A test file has been created at `/test/websocket-auth-test.js` with examples of:

- Valid and invalid token scenarios
- Client connection code examples
- Protected event testing

## Backward Compatibility

The implementation maintains backward compatibility by:

- Supporting multiple token sources
- Maintaining existing session cookie authentication
- Providing clear error messages for migration

## Monitoring and Logging

All authentication events are logged with:

- Socket IDs and user information
- Authentication success/failure reasons
- Connection errors and security events
- User activity tracking

## Benefits

1. **Security**: All WebSocket connections are now authenticated
2. **Authorization**: Users can only access their own resources
3. **Auditability**: Comprehensive logging for security monitoring
4. **Flexibility**: Multiple authentication methods supported
5. **Maintainability**: Clean separation of concerns with middleware

## Next Steps

1. Test the implementation with your existing frontend
2. Update client-side code to handle authentication errors
3. Implement token refresh on the client side
4. Add rate limiting for authenticated connections
5. Consider implementing role-based access control

## Troubleshooting

If you encounter issues:

1. Check server logs for authentication errors
2. Verify token format and expiration
3. Ensure environment variables are set correctly
4. Test with different token sources
5. Review the documentation in `/docs/websocket-authentication.md`

The WebSocket authentication system is now ready to secure your real-time communications!
