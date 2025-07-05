import harveyCallMonitor from './src/services/harveyCallMonitor.js';
import express from 'express';
import harveyRoutes from './src/services/harveyRoutes.js';

const app = express();
const PORT = process.env.HARVEY_PORT || 3001;

// Middleware
app.use(express.json());

// Harvey API routes
app.use('/api/harvey', harveyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'operational',
    service: 'Harvey Specter Sales Coach',
    version: '1.0.0',
    personality: 'Maximum Harvey'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🎯 Harvey Coach API running on port ${PORT}`);
  console.log('Harvey says: "I don\'t have dreams, I have goals. Now let\'s make some sales."');
});

// Start monitoring all reps
console.log('🚀 Starting Harvey monitoring system...');
// The monitor will automatically detect and monitor all active reps
