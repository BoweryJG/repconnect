import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Import route handlers
import coachingSessionRoutes from './backend-routes/coachingSessionRoutes.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server and Socket.io
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'RepConnect Backend'
  });
});

// API Routes
app.use('/api/coaching', coachingSessionRoutes);

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
  console.log('Client connected:', socket.id);

  // Join coaching room
  socket.on('join-coaching-room', (data) => {
    const { roomId, sessionId, repId, coachId, userType } = data;
    socket.join(roomId);
    console.log(`${userType} ${repId} joined coaching room ${roomId} for session ${sessionId}`);
    
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
    console.log(`User left coaching room ${roomId}`);
    
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
    console.log('Client disconnected:', socket.id);
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 RepConnect Backend running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for coaching sessions`);
  console.log(`🎯 Coaching API available at http://localhost:${PORT}/api/coaching`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔧 Development mode - CORS enabled for localhost:3000`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔥 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed. Goodbye!');
    process.exit(0);
  });
});

export default app;