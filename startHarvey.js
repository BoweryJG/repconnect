import harveyCallMonitor from './src/services/harveyCallMonitor.js';
import harveyAPI from './src/services/harveyAPI.js';
import http from 'http';

const PORT = process.env.HARVEY_PORT || 3001;

// Create a simple HTTP server for Harvey
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/health' && req.method === 'GET') {
    const health = await harveyAPI.healthCheck();
    res.writeHead(200);
    res.end(JSON.stringify(health));
  } else if (req.url === '/api/harvey/status' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'operational',
      service: 'Harvey Specter Sales Coach',
      version: '1.0.0',
      personality: 'Maximum Harvey',
      quote: "I don't have dreams, I have goals. Now let's make some sales."
    }));
  } else if (req.url.startsWith('/api/harvey/leaderboard') && req.method === 'GET') {
    try {
      const leaderboard = await harveyAPI.getLeaderboard();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: leaderboard }));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  } else if (req.url.match(/^\/api\/harvey\/stats\/(.+)$/) && req.method === 'GET') {
    const repId = req.url.match(/^\/api\/harvey\/stats\/(.+)$/)[1];
    try {
      const stats = await harveyAPI.getRepStats(repId);
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, data: stats }));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found', message: 'Harvey doesn\'t have time for invalid endpoints.' }));
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`🎯 Harvey Coach API running on port ${PORT}`);
  console.log('Harvey says: "I don\'t have dreams, I have goals. Now let\'s make some sales."');
  console.log('\n📡 Available endpoints:');
  console.log(`  GET http://localhost:${PORT}/health`);
  console.log(`  GET http://localhost:${PORT}/api/harvey/status`);
  console.log(`  GET http://localhost:${PORT}/api/harvey/leaderboard`);
  console.log(`  GET http://localhost:${PORT}/api/harvey/stats/:repId`);
});

// Start monitoring all reps
console.log('\n🚀 Starting Harvey monitoring system...');
console.log('Harvey is now watching all sales reps and ready to intervene!');

// Auto-initialize Harvey with existing reps
import('./src/services/harveyAPI.js').then(module => {
  module.autoInitialize().then(() => {
    console.log('\n✅ Harvey auto-initialization complete');
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👔 Harvey is leaving the building...');
  server.close(() => {
    console.log('Harvey says: "I\'ll be back. Winners don\'t quit."');
    process.exit(0);
  });
});