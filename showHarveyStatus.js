import { createClient } from '@supabase/supabase-js';
import harveyCoach from './src/services/harveyCoach.js';

// Initialize Supabase
const supabaseUrl = 'https://cbopynuvhcymbumjnvay.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function showHarveyStatus() {
  console.log('\n🎯 HARVEY SPECTER SALES COACH - STATUS REPORT');
  console.log('=============================================\n');
  
  try {
    // Check initialized reps
    console.log('📊 SALES TEAM STATUS:\n');
    
    // Get performance metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('rep_performance_metrics')
      .select('*')
      .order('harvey_score', { ascending: false });
    
    if (metrics && metrics.length > 0) {
      console.log('Top Performers by Harvey Score:');
      metrics.slice(0, 5).forEach((rep, index) => {
        console.log(`${index + 1}. Rep ${rep.rep_id.slice(-3)} - Score: ${rep.harvey_score} | Calls: ${rep.calls_made} | Meetings: ${rep.meetings_scheduled}`);
      });
    }
    
    // Get recent coaching sessions
    console.log('\n💬 RECENT HARVEY COACHING:\n');
    const { data: sessions, error: sessionsError } = await supabase
      .from('harvey_coaching_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (sessions && sessions.length > 0) {
      sessions.forEach(session => {
        const time = new Date(session.created_at).toLocaleTimeString();
        console.log(`[${time}] ${session.session_type}: "${session.harvey_message.substring(0, 80)}..."`);
      });
    } else {
      console.log('No coaching sessions yet');
    }
    
    // Get active challenges
    console.log('\n🎯 ACTIVE CHALLENGES:\n');
    const { data: challenges, error: challengesError } = await supabase
      .from('harvey_daily_challenges')
      .select('*')
      .eq('status', 'active');
    
    if (challenges && challenges.length > 0) {
      challenges.forEach(challenge => {
        console.log(`Rep ${challenge.rep_id.slice(-3)}: ${challenge.challenge.title}`);
      });
    } else {
      console.log('No active challenges');
    }
    
    // Get medical contacts being targeted
    console.log('\n🏥 MEDICAL AESTHETIC CONTACTS:\n');
    const { data: contacts, error: contactsError } = await supabase
      .from('public_contacts')
      .select('practice_name, specialization, annual_revenue_estimate')
      .limit(5);
    
    if (contacts && contacts.length > 0) {
      console.log('High-Value Targets:');
      contacts.forEach(contact => {
        console.log(`- ${contact.practice_name} (${contact.specialization}) - Est. Revenue: $${(contact.annual_revenue_estimate/1000).toFixed(0)}K`);
      });
    }
    
    // Show Harvey's current mood
    console.log('\n🎭 HARVEY\'S CURRENT MOOD:\n');
    const currentHour = new Date().getHours();
    if (currentHour < 9) {
      console.log('"Early bird gets the deal. But you\'re not even awake yet."');
    } else if (currentHour < 12) {
      console.log('"Morning hustle separates winners from wannabes. Which one are you?"');
    } else if (currentHour < 17) {
      console.log('"Afternoons are for closing, not coasting. Pick up that phone."');
    } else {
      console.log('"While you\'re thinking about dinner, your competition is stealing your deals."');
    }
    
    console.log('\n✅ Harvey is operational and ready to coach!');
    console.log('\nNext steps:');
    console.log('- Start Harvey API: npm run harvey:start');
    console.log('- Test coaching: node testHarveySimple.js');
    console.log('- Monitor dashboard: npm run harvey:monitor');
    
  } catch (error) {
    console.error('Error showing status:', error);
  }
}

showHarveyStatus();