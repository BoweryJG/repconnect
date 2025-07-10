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
import { responseTimeMiddleware, requestIdMiddleware, enhancedResponseTimeMiddleware } from './src/middleware/responseTime.js';
import { monitoringService } from './src/config/monitoring.js';
import healthRoutes from './src/routes/healthRoutes.js';

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
    origin: ["http://localhost:3000", "http://localhost:5173", "https://osbackend-zl1h.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, configure properly for production
}));

// Request tracking middleware
app.use(requestIdMiddleware);
app.use(responseTimeMiddleware);
app.use(enhancedResponseTimeMiddleware);

// Rate limiting
app.use(defaultRateLimiter);

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "https://osbackend-zl1h.onrender.com"],
  credentials: true
}));
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
    quote: "I don't have dreams, I have goals. Now let's make some sales."
  });
});

// Socket.io for WebRTC signaling
io.on('connection', (socket) => {
  logger.info('Client connected:', socket.id);

  // Join coaching room
  socket.on('join-coaching-room', (data) => {
    const { roomId, sessionId, repId, coachId, userType } = data;
    socket.join(roomId);
    logger.info(`${userType} ${repId} joined coaching room ${roomId} for session ${sessionId}`);
    
    // Notify other participants
    socket.to(roomId).emit('participant-joined', {
      userId: repId,
      userType,
      sessionId
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
    data: { status: 'connected', message: 'Harvey is watching.' }
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
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  
  // Send error details
  const statusCode = err.status || 500;
  const message = err.message || 'Something went wrong';
  
  res.status(statusCode).json({ 
    error: statusCode >= 500 ? 'Internal server error' : 'Error',
    message: process.env.NODE_ENV === 'development' ? message : 'Something went wrong',
    requestId: req.id
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: 'The requested endpoint does not exist',
    requestId: req.id
  });
});

// Start server
server.listen(PORT, () => {
  logger.success(`🚀 RepConnect Backend running on port ${PORT}`);
  logger.info(`📡 WebSocket server ready for coaching sessions`);
  logger.info(`🎯 Coaching API available at http://localhost:${PORT}/api/coaching`);
  logger.info(`💚 Health check: http://localhost:${PORT}/health`);
  logger.info(`📊 Detailed health: http://localhost:${PORT}/api/health`);
  logger.info(`📈 Metrics endpoint: http://localhost:${PORT}/health/metrics`);
  
  // Start monitoring service
  monitoringService.start();
  logger.info(`🔍 Monitoring service started`);
  
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`🔧 Development mode - CORS enabled for localhost:3000`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.warn('\n🔥 Shutting down server...');
  
  // Stop monitoring service
  monitoringService.stop();
  
  server.close(() => {
    logger.info('✅ Server closed. Goodbye!');
    process.exit(0);
  });
});

export default app;
export { io };