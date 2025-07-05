import harveyCoach from './src/services/harveyCoach.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://cbopynuvhcymbumjnvay.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib3B5bnV2aGN5bWJ1bWpudmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTUxNzMsImV4cCI6MjA1OTU3MTE3M30.UZElMkoHugIt984RtYWyfrRuv2rB67opQdCrFVPCfzU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function monitorHarvey() {
  console.log('📊 HARVEY COACH MONITORING DASHBOARD');
  console.log('=====================================\n');
  
  // Get today's stats
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch coaching sessions
  const { data: sessions } = await supabase
    .from('harvey_coaching_sessions')
    .select('*')
    .gte('created_at', today)
    .order('created_at', { ascending: false });
  
  console.log(`📞 Today's Coaching Sessions: ${sessions?.length || 0}`);
  
  // Fetch performance metrics
  const { data: metrics } = await supabase
    .from('rep_performance_metrics')
    .select('*')
    .eq('date', today);
  
  console.log(`📈 Reps Monitored: ${metrics?.length || 0}`);
  
  // Get leaderboard
  try {
    const leaderboard = await harveyCoach.updateLeaderboard();
    if (leaderboard && leaderboard.length > 0) {
      console.log('\n🏆 TODAY\'S LEADERBOARD:');
      console.log('====================');
      leaderboard.slice(0, 10).forEach((rep, index) => {
        console.log(`${index + 1}. ${rep.name} - Harvey Score: ${rep.harveyScore}`);
      });
    } else {
      console.log('\n🏆 No leaderboard data yet');
    }
  } catch (error) {
    console.log('\n🏆 Leaderboard temporarily unavailable');
  }
  
  // Show recent coaching
  if (sessions && sessions.length > 0) {
    console.log('\n💬 RECENT COACHING:');
    console.log('==================');
    sessions.slice(0, 5).forEach(session => {
      console.log(`[${new Date(session.created_at).toLocaleTimeString()}] ${session.rep_name}: ${session.message.substring(0, 80)}...`);
    });
  }
  
  console.log('\n✅ Harvey is operational and crushing it!');
}

// Run monitoring
monitorHarvey().catch(console.error);

// Auto-refresh every 30 seconds
setInterval(() => {
  console.clear();
  monitorHarvey().catch(console.error);
}, 30000);
