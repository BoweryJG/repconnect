import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import logger from './utils/logger.js';

// Import monitoring and security
import { initializeSentry, sentryErrorHandler } from './src/config/sentry.js';
import { defaultRateLimiter, apiRateLimiter } from './src/middleware/rateLimiter.js';
import {
  responseTimeMiddleware,
  requestIdMiddleware,
  enhancedResponseTimeMiddleware,
} from './src/middleware/responseTime.js';
import { monitoringService } from './src/config/monitoring.js';
import healthRoutes from './src/routes/healthRoutes.js';

// Import database connection pool
import { databaseService } from './src/services/databaseService.js';
import { closeConnectionPool } from './src/config/database.js';

// Import route handlers
import authRoutes from './backend-routes/authRoutes.js';
import coachingSessionRoutes from './backend-routes/coachingSessionRoutes.js';
import callSummaryRoutes from './backend-routes/callSummaryRoutes.js';
import twilioWebhookRoutes from './backend-routes/twilioWebhookRoutes.js';
import harveyRoutes from './src/api/harveyRoutes.js';
import harveyMultiAgentRoutes from './src/api/harveyMultiAgentRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Sentry before other middleware
initializeSentry(app);

// Create HTTP server and Socket.io
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://osbackend-zl1h.onrender.com',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Security middleware
// Content Security Policy (CSP) Configuration
// This policy restricts which resources can be loaded to prevent XSS and data injection attacks
// Production vs Development: Development allows localhost connections and unsafe-eval for React DevTools
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Required for React's inline scripts
          process.env.NODE_ENV !== 'production' ? "'unsafe-eval'" : null, // Only in development
          'https://cdn.jsdelivr.net',
          'https://unpkg.com',
          'https://browser.sentry-cdn.com', // Sentry CDN
          'https://*.sentry.io', // Sentry scripts
        ].filter(Boolean),
        styleSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Material-UI and inline styles
          'https://fonts.googleapis.com',
        ],
        fontSrc: [
          "'self'",
          'https://fonts.gstatic.com',
          'data:', // For base64 encoded fonts
        ],
        imgSrc: [
          "'self'",
          'data:', // For base64 images
          'blob:', // For blob URLs
          'https:', // Allow images from any HTTPS source
          process.env.NODE_ENV !== 'production' ? 'http://localhost:*' : null, // Development only
        ].filter(Boolean),
        connectSrc: [
          "'self'",
          'https://cbopynuvhcymbumjnvay.supabase.co', // Supabase
          'wss://cbopynuvhcymbumjnvay.supabase.co', // Supabase WebSocket
          'https://api.deepgram.com',
          'wss://api.deepgram.com', // Deepgram WebSocket
          'https://api.elevenlabs.io',
          'wss://api.elevenlabs.io', // ElevenLabs WebSocket
          'https://api.piapi.ai',
          'wss://api.piapi.ai', // Moshi WebSocket
          'https://api.openai.com', // OpenAI
          'https://osbackend-zl1h.onrender.com', // Backend API
          'wss://osbackend-zl1h.onrender.com', // Backend WebSocket
          // Sentry error tracking
          'https://*.sentry.io',
          'https://*.ingest.sentry.io',
          process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : null,
          process.env.NODE_ENV !== 'production' ? 'http://localhost:3001' : null,
          process.env.NODE_ENV !== 'production' ? 'ws://localhost:3000' : null,
          process.env.NODE_ENV !== 'production' ? 'ws://localhost:3001' : null,
          // TURN servers for WebRTC
          'turn:*.metered.live:*',
          'turn:global.turn.twilio.com:*',
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
        ].filter(Boolean),
        mediaSrc: [
          "'self'",
          'blob:', // For audio/video blobs
          'data:', // For data URLs
          'https://api.elevenlabs.io', // ElevenLabs audio
          'mediastream:', // For WebRTC media streams
        ],
        childSrc: [
          "'self'",
          'blob:', // For web workers
        ],
        workerSrc: [
          "'self'",
          'blob:', // For web workers
        ],
        objectSrc: ["'none'"], // Disallow plugins
        frameAncestors: ["'none'"], // Prevent clickjacking
        formAction: ["'self'"], // Form submissions only to same origin
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null, // Upgrade HTTP to HTTPS in production
        blockAllMixedContent: process.env.NODE_ENV === 'production' ? [] : null, // Block mixed content in production
      },
    },
    crossOriginEmbedderPolicy: false, // Allow embedding from allowed origins
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny', // X-Frame-Options: DENY - Prevents clickjacking
    },
    noSniff: true, // X-Content-Type-Options: nosniff - Prevents MIME type sniffing
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin', // Referrer-Policy header
    },
    permittedCrossDomainPolicies: false, // X-Permitted-Cross-Domain-Policies: none
    originAgentCluster: true, // Origin-Agent-Cluster: ?1
    dnsPrefetchControl: {
      allow: false, // X-DNS-Prefetch-Control: off
    },
    ieNoOpen: true, // X-Download-Options: noopen (IE8+)
    xssFilter: true, // X-XSS-Protection: 1; mode=block (legacy browsers)
  })
);

// Additional Permissions-Policy header
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(self), payment=(), usb=(), interest-cohort=()'
  );
  next();
});

// Request tracking middleware
app.use(requestIdMiddleware);
app.use(responseTimeMiddleware);
app.use(enhancedResponseTimeMiddleware);

// Rate limiting
app.use(defaultRateLimiter);

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://osbackend-zl1h.onrender.com',
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check routes (includes /health and /api/health)
app.use('/', healthRoutes);

// API Routes with rate limiting
app.use('/api', apiRateLimiter, authRoutes);
app.use('/api/coaching', apiRateLimiter, coachingSessionRoutes);
app.use('/api', apiRateLimiter, callSummaryRoutes);
app.use('/twilio', twilioWebhookRoutes); // No rate limiting for webhooks
app.use('/api', apiRateLimiter, harveyRoutes);
app.use('/api', apiRateLimiter, harveyMultiAgentRoutes);

// Legacy Harvey endpoints (for compatibility)
app.get('/api/harvey/status', (req, res) => {
  res.json({
    status: 'operational',
    service: 'Harvey Specter Sales Coach',
    version: '1.0.0',
    personality: 'Maximum Harvey',
    quote: "I don't have dreams, I have goals. Now let's make some sales.",
  });
});

// Socket.io for WebRTC signaling
io.on('connection', (socket) => {
  logger.info('Client connected:', socket.id);

  // Join coaching room
  socket.on('join-coaching-room', (data) => {
    const { roomId, sessionId, repId, userType } = data;
    socket.join(roomId);
    logger.info(`${userType} ${repId} joined coaching room ${roomId} for session ${sessionId}`);

    // Notify other participants
    socket.to(roomId).emit('participant-joined', {
      userId: repId,
      userType,
      sessionId,
    });
  });

  // Leave coaching room
  socket.on('leave-coaching-room', (data) => {
    const { roomId, sessionId } = data;
    socket.leave(roomId);
    logger.info(`User left coaching room ${roomId}`);

    // Notify other participants
    socket.to(roomId).emit('participant-left', { sessionId });
  });

  // WebRTC signaling
  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', data);
  });

  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', data);
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', data);
  });

  // Coaching-specific events
  socket.on('coaching-feedback', (data) => {
    socket.to(data.roomId).emit('coaching-feedback', data);
  });

  socket.on('scenario-update', (data) => {
    socket.to(data.roomId).emit('scenario-update', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info('Client disconnected:', socket.id);
  });
});

// Harvey WebSocket namespace
const harveyNamespace = io.of('/harvey-ws');

harveyNamespace.on('connection', (socket) => {
  logger.info('Harvey client connected:', socket.id);

  // Get userId from auth
  const userId = socket.handshake.auth.userId || socket.handshake.query.userId;

  if (userId) {
    // Join user-specific room for targeted updates
    socket.join(`harvey-${userId}`);
    logger.info(`User ${userId} joined Harvey room`);
  }

  // Send initial connection success
  socket.emit('harvey-update', {
    type: 'connection',
    data: { status: 'connected', message: 'Harvey is watching.' },
  });

  // Handle user messages for AI chat
  socket.on('user-message', async (data) => {
    try {
      const { text, sessionId, agentId } = data;
      logger.info('User message:', { agentId, sessionId, text });

      // Import agent loader, Harvey personality and OpenAI
      const { loadAgentConfig, getCachedAgent } = await import('./src/services/serverAgentLoader.js');
      const { default: harveyPersonality } = await import('./src/services/harveyPersonality.js');
      const OpenAI = (await import('openai')).default;

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Try to get agent from backend first
      let agentConfig = getCachedAgent(agentId) || await loadAgentConfig(agentId);
      
      // Fallback to local Harvey personality if not found
      if (!agentConfig) {
        agentConfig = harveyPersonality.personalities?.[agentId];
      }
      
      if (!agentConfig) {
        socket.emit('error', { message: 'Invalid agent ID' });
        return;
      }

      // Build system prompt
      const systemPrompt = `You are ${agentConfig.name}, ${agentConfig.description}. 
      Your communication style: ${agentConfig.style}
      Your expertise: ${agentConfig.expertise.join(', ')}
      Your catchphrases: ${agentConfig.catchphrases.join(', ')}
      
      Stay in character and provide helpful, concise responses focused on your area of expertise.`;

      // Get AI response
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.8,
        max_tokens: 300,
      });

      const response = completion.choices[0].message.content;

      // Send response back to client
      socket.emit('agent-response', {
        text: response,
        agentId,
        sessionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error handling user message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  socket.on('disconnect', () => {
    logger.info('Harvey client disconnected:', socket.id);
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Sentry error handler - must be before other error handlers
app.use(sentryErrorHandler);

// Error handling middleware
app.use((err, req, res, _next) => {
  logger.error('Error:', err);

  // Send error details
  const statusCode = err.status || 500;
  const message = err.message || 'Something went wrong';

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'Internal server error' : 'Error',
    message: process.env.NODE_ENV === 'development' ? message : 'Something went wrong',
    requestId: req.id,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    requestId: req.id,
  });
});

// Start server
server.listen(PORT, async () => {
  logger.success(`🚀 RepConnect Backend running on port ${PORT}`);
  logger.info(`📡 WebSocket server ready for coaching sessions`);
  logger.info(`🎯 Coaching API available at http://localhost:${PORT}/api/coaching`);
  logger.info(`💚 Health check: http://localhost:${PORT}/health`);
  logger.info(`📊 Detailed health: http://localhost:${PORT}/api/health`);
  logger.info(`📈 Metrics endpoint: http://localhost:${PORT}/health/metrics`);

  // Initialize database connection pool
  try {
    await databaseService.initialize();
    const stats = databaseService.getStats();
    logger.info(`🔗 Database connection pool initialized (pool size: ${stats.config.db.poolSize})`);
  } catch (error) {
    logger.error('Failed to initialize database connection pool:', error);
    // Continue running - routes will initialize pool on demand
  }

  // Start monitoring service
  monitoringService.start();
  logger.info(`🔍 Monitoring service started`);

  if (process.env.NODE_ENV === 'development') {
    logger.debug(`🔧 Development mode - CORS enabled for localhost:3000`);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.warn('\n🔥 Shutting down server...');

  // Stop monitoring service
  monitoringService.stop();

  // Close database connection pool
  try {
    await closeConnectionPool();
    logger.info('✅ Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }

  server.close(() => {
    logger.info('✅ Server closed. Goodbye!');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('SIGTERM', async () => {
  logger.warn('SIGTERM received, shutting down gracefully...');

  // Stop monitoring service
  monitoringService.stop();

  // Close database connection pool
  try {
    await closeConnectionPool();
    logger.info('✅ Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }

  server.close(() => {
    logger.info('✅ Server closed via SIGTERM');
    process.exit(0);
  });
});

export default app;
export { io };
