import harveyCallMonitor from './src/services/harveyCallMonitor.js';
import harveyAPI from './src/services/harveyAPI.js';
import http from 'http';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const PORT = process.env.HARVEY_PORT || 3001;

// Helper function to parse JSON from request body
function parseRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
}

// Create a simple HTTP server for Harvey + Coaching
const server = http.createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Existing Harvey endpoints
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
  }
  
  // NEW COACHING ENDPOINTS
  else if (req.url === '/api/coaching/start-session' && req.method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const { repId, coachId, procedureCategory, sessionType = 'practice_pitch' } = body;

      if (!repId || !coachId || !procedureCategory) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Missing required fields: repId, coachId, procedureCategory' }));
        return;
      }

      // Check coach availability
      const { data: availability } = await supabase
        .from('coach_availability')
        .select('is_available')
        .eq('coach_id', coachId)
        .single();

      if (!availability?.is_available) {
        res.writeHead(409);
        res.end(JSON.stringify({ error: 'Coach is not available for instant sessions' }));
        return;
      }

      // Create unique room ID
      const roomId = `coach-${coachId}-rep-${repId}-${Date.now()}`;

      // Create session record
      const { data: session, error } = await supabase
        .from('instant_coaching_sessions')
        .insert({
          rep_id: repId,
          coach_id: coachId,
          session_type: sessionType,
          procedure_category: procedureCategory,
          webrtc_room_id: roomId,
          connection_status: 'pending',
          session_goals: ['Practice product knowledge', 'Handle objections', 'Build confidence']
        })
        .select()
        .single();

      if (error) throw error;

      // Mark coach as busy
      await supabase
        .from('coach_availability')
        .update({
          is_available: false,
          current_session_id: session.id,
          updated_at: new Date().toISOString()
        })
        .eq('coach_id', coachId);

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        session: { ...session, roomId }
      }));

    } catch (error) {
      console.error('Error starting coaching session:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
  
  else if (req.url.match(/^\/api\/coaching\/available-coaches\/(.+)$/) && req.method === 'GET') {
    try {
      const procedureCategory = req.url.match(/^\/api\/coaching\/available-coaches\/(.+)$/)[1];

      // Get specializations for the procedure category
      const { data: specializations, error: specError } = await supabase
        .from('coach_procedure_specializations')
        .select('*')
        .eq('procedure_category', procedureCategory)
        .eq('available_for_instant', true);

      if (specError) throw specError;

      if (!specializations || specializations.length === 0) {
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          coaches: []
        }));
        return;
      }

      // Get coach details and availability for these specializations
      const coachIds = specializations.map(s => s.coach_id);
      
      const { data: coaches, error: coachError } = await supabase
        .from('sales_coach_agents')
        .select('*')
        .in('id', coachIds);

      if (coachError) throw coachError;

      const { data: availability, error: availError } = await supabase
        .from('coach_availability')
        .select('*')
        .in('coach_id', coachIds)
        .eq('is_available', true);

      if (availError) throw availError;

      // Combine the data
      const data = specializations
        .filter(spec => availability.some(avail => avail.coach_id === spec.coach_id))
        .map(spec => ({
          ...spec,
          coach: coaches.find(coach => coach.id === spec.coach_id),
          availability: availability.find(avail => avail.coach_id === spec.coach_id)
        }));

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        coaches: data || []
      }));

    } catch (error) {
      console.error('Error fetching coaches:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: 'Failed to fetch available coaches' }));
    }
  }
  
  else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found', message: 'Harvey doesn\'t have time for invalid endpoints.' }));
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`🎯 Harvey Coach API running on port ${PORT}`);
  console.log('Harvey says: "I don\'t have dreams, I have goals. Now let\'s make some sales."');
  console.log('\n📡 Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/api/harvey/status`);
  console.log(`  GET  http://localhost:${PORT}/api/harvey/leaderboard`);
  console.log(`  GET  http://localhost:${PORT}/api/harvey/stats/:repId`);
  console.log('\n🤖 NEW: Instant Coaching endpoints:');
  console.log(`  POST http://localhost:${PORT}/api/coaching/start-session`);
  console.log(`  GET  http://localhost:${PORT}/api/coaching/available-coaches/:category`);
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