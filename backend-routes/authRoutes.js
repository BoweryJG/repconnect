import express from 'express';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import logger from '../utils/logger.js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Login with Supabase token and set httpOnly cookie
router.post('/auth/login', async (req, res) => {
  try {
    const { access_token, refresh_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'Access token is required' });
    }

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(access_token);

    if (error || !user) {
      logger.error('Token verification failed:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Create session data
    const sessionData = {
      userId: user.id,
      email: user.email,
      access_token,
      refresh_token,
      iat: Date.now(),
    };

    // Sign JWT for httpOnly cookie
    const sessionToken = jwt.sign(sessionData, process.env.JWT_SECRET || 'fallback-secret', {
      expiresIn: '30m',
    });

    // Set httpOnly cookie
    res.cookie('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    // Set last activity cookie
    res.cookie('last_activity', Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout and clear cookies
router.post('/auth/logout', (req, res) => {
  try {
    res.clearCookie('session');
    res.clearCookie('last_activity');
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user from session cookie
router.get('/auth/me', async (req, res) => {
  try {
    const sessionToken = req.cookies.session;

    if (!sessionToken) {
      return res.status(401).json({ error: 'No session found' });
    }

    // Verify JWT
    const sessionData = jwt.verify(sessionToken, process.env.JWT_SECRET || 'fallback-secret');

    // Check if session is still valid (30 minutes)
    const sessionAge = Date.now() - sessionData.iat;
    if (sessionAge > 30 * 60 * 1000) {
      res.clearCookie('session');
      res.clearCookie('last_activity');
      return res.status(401).json({ error: 'Session expired' });
    }

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(sessionData.access_token);

    if (error || !user) {
      logger.error('Token verification failed:', error);
      res.clearCookie('session');
      res.clearCookie('last_activity');
      return res.status(401).json({ error: 'Invalid session' });
    }

    // Update last activity
    res.cookie('last_activity', Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.clearCookie('session');
      res.clearCookie('last_activity');
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    logger.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh session
router.post('/auth/refresh', async (req, res) => {
  try {
    const sessionToken = req.cookies.session;

    if (!sessionToken) {
      return res.status(401).json({ error: 'No session found' });
    }

    const sessionData = jwt.verify(sessionToken, process.env.JWT_SECRET || 'fallback-secret');

    // Refresh Supabase token
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: sessionData.refresh_token,
    });

    if (error || !data.session) {
      logger.error('Token refresh failed:', error);
      res.clearCookie('session');
      res.clearCookie('last_activity');
      return res.status(401).json({ error: 'Failed to refresh session' });
    }

    // Create new session data
    const newSessionData = {
      userId: data.user.id,
      email: data.user.email,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      iat: Date.now(),
    };

    // Sign new JWT
    const newSessionToken = jwt.sign(newSessionData, process.env.JWT_SECRET || 'fallback-secret', {
      expiresIn: '30m',
    });

    // Update cookies
    res.cookie('session', newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000,
    });

    res.cookie('last_activity', Date.now().toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000,
    });

    res.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        user_metadata: data.user.user_metadata,
      },
    });
  } catch (error) {
    logger.error('Refresh session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
