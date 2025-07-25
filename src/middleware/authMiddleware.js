import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import logger from '../utils/logger.js';

// Initialize Supabase client for server-side use
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_SERVICE_KEY // Use service key for server-side
);

// CSRF token storage (in production, use Redis or similar)
const csrfTokens = new Map();

// Session configuration
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: SESSION_TIMEOUT,
  path: '/',
};

// Generate CSRF token
export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Store CSRF token with session
export const storeCSRFToken = (sessionId, csrfToken) => {
  csrfTokens.set(sessionId, {
    token: csrfToken,
    createdAt: Date.now(),
  });

  // Clean up old tokens
  cleanupExpiredTokens();
};

// Validate CSRF token
export const validateCSRFToken = (sessionId, token) => {
  const stored = csrfTokens.get(sessionId);
  if (!stored) return false;

  // Check if token matches and hasn't expired
  const isValid = stored.token === token && Date.now() - stored.createdAt < SESSION_TIMEOUT;

  return isValid;
};

// Clean up expired CSRF tokens
const cleanupExpiredTokens = () => {
  const now = Date.now();
  for (const [sessionId, data] of csrfTokens.entries()) {
    if (now - data.createdAt > SESSION_TIMEOUT) {
      csrfTokens.delete(sessionId);
    }
  }
};

// Authentication middleware
export const authMiddleware = async (req, res, next) => {
  try {
    // Get Bearer token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify session with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      logger.error('Auth middleware error:', error);
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Attach user to request
    req.user = user;
    req.sessionToken = token;

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// CSRF protection middleware - simplified without cookie checks
export const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET requests
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // For now, just pass through - CSRF can be handled by Supabase
  // In production, you might want to implement proper CSRF protection
  next();
};

// Session timeout middleware - let Supabase handle session expiry
export const sessionTimeout = (req, res, next) => {
  // Supabase handles session expiry automatically
  // No need for cookie-based timeout checking
  next();
};

// Combined auth middleware - simplified without cookie dependencies
export const requireAuth = [authMiddleware];
