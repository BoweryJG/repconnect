import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import logger from '../../utils/logger.js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.REACT_APP_SUPABASE_SERVICE_KEY
);

/**
 * Socket.IO authentication middleware
 * Validates JWT tokens from either handshake auth or query parameters
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    // Try to get token from different sources
    const token =
      socket.handshake.auth.token ||
      socket.handshake.auth.access_token ||
      socket.handshake.query.token ||
      socket.handshake.query.access_token ||
      socket.handshake.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      logger.warn('Socket authentication failed: No token provided', {
        socketId: socket.id,
        handshakeAuth: socket.handshake.auth,
        handshakeQuery: socket.handshake.query,
      });
      return next(new Error('Authentication required'));
    }

    let user = null;

    // Authenticate with token
    if (token) {
      try {
        const {
          data: { user: supabaseUser },
          error,
        } = await supabase.auth.getUser(token);

        if (error || !supabaseUser) {
          logger.warn('Socket authentication failed: Invalid access token', {
            socketId: socket.id,
            error: error?.message,
          });
          return next(new Error('Invalid token'));
        }

        user = supabaseUser;
        logger.info('Socket authenticated via access token', {
          socketId: socket.id,
          userId: user.id,
          email: user.email,
        });
      } catch (error) {
        logger.error('Socket token validation error', {
          socketId: socket.id,
          error: error.message,
        });
        return next(new Error('Token validation failed'));
      }
    }

    if (!user) {
      logger.warn('Socket authentication failed: No valid authentication method', {
        socketId: socket.id,
      });
      return next(new Error('Authentication failed'));
    }

    // Attach user info to socket
    socket.user = user;

    // Add user to socket handshake for easy access
    socket.handshake.user = user;

    logger.info('Socket authenticated successfully', {
      socketId: socket.id,
      userId: user.id,
      email: user.email,
    });

    next();
  } catch (error) {
    logger.error('Socket authentication middleware error', {
      socketId: socket.id,
      error: error.message,
      stack: error.stack,
    });
    next(new Error('Authentication error'));
  }
};

/**
 * Get user ID from socket (helper function)
 */
export const getSocketUserId = (socket) => {
  return socket.user?.id || socket.handshake.auth.userId || socket.handshake.query.userId;
};

/**
 * Get user email from socket (helper function)
 */
export const getSocketUserEmail = (socket) => {
  return socket.user?.email || socket.handshake.auth.email || socket.handshake.query.email;
};

/**
 * Check if socket is authenticated (helper function)
 */
export const isSocketAuthenticated = (socket) => {
  return !!(socket.user && socket.user.id);
};

/**
 * Middleware to require authentication for specific socket events
 */
export const requireSocketAuth = (eventHandler) => {
  return (socket, ...args) => {
    if (!isSocketAuthenticated(socket)) {
      logger.warn('Unauthorized socket event attempt', {
        socketId: socket.id,
        event: eventHandler.name,
      });
      socket.emit('error', {
        message: 'Authentication required for this action',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    return eventHandler(socket, ...args);
  };
};
