import { createClient } from '@supabase/supabase-js';
import harveyCoach from './src/services/harveyCoach.js';

// Initialize Supabase
const supabaseUrl = 'https://cbopynuvhcymbumjnvay.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function populateWithMedicalAestheticData() {
  console.log('🏥 Populating Harvey with Medical Aesthetic Sales Data...\n');
  
  try {
    // First, check what's in public_contacts
    console.log('📋 Fetching medical aesthetic contacts from public_contacts table...');
    const { data: contacts, error: contactsError } = await supabase
      .from('public_contacts')
      .select('*')
      .limit(50); // Get a sample
    
    if (contactsError) {
      console.error('Error fetching contacts:', contactsError);
      return;
    }
    
    console.log(`Found ${contacts?.length || 0} contacts in public_contacts table`);
    
    if (contacts && contacts.length > 0) {
      console.log('\nSample contact structure:', Object.keys(contacts[0]));
      console.log('First contact:', contacts[0]);
    }
    
    // Create medical aesthetic sales reps
    const medicalReps = [
      { 
        id: 'med-rep-001', 
        name: 'Sarah Mitchell',
        first_name: 'Sarah',
        last_name: 'Mitchell',
        role: 'sales_rep',
        territory: 'Northeast',
        speciality: 'Dermatology & Med Spas'
      },
      { 
        id: 'med-rep-002', 
        name: 'David Chen',
        first_name: 'David',
        last_name: 'Chen',
        role: 'sales_rep',
        territory: 'West Coast',
        speciality: 'Plastic Surgery Centers'
      },
      { 
        id: 'med-rep-003', 
        name: 'Jennifer Williams',
        first_name: 'Jennifer',
        last_name: 'Williams',
        role: 'sales_rep',
        territory: 'Southeast',
        speciality: 'Medical Spas & Wellness'
      },
      { 
        id: 'med-rep-004', 
        name: 'Michael Rodriguez',
        first_name: 'Michael',
        last_name: 'Rodriguez',
        role: 'sales_rep',
        territory: 'Midwest',
        speciality: 'Aesthetic Dermatology'
      },
      { 
        id: 'med-rep-005', 
        name: 'Jessica Thompson',
        first_name: 'Jessica',
        last_name: 'Thompson',
        role: 'manager',
        territory: 'National',
        speciality: 'All Aesthetics'
      }
    ];
    
    // Initialize Harvey for each rep
    console.log('\n🎯 Initializing Harvey for medical aesthetic sales team...\n');
    
    for (const rep of medicalReps) {
      console.log(`Setting up ${rep.name} (${rep.speciality})...`);
      
      // Initialize in Harvey
      await harveyCoach.initializeRep(rep.id, rep.name);
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: rep.id,
          ...rep
        }, { onConflict: 'id' });
      
      if (profileError) {
        console.error(`Error creating profile for ${rep.name}:`, profileError.message);
      }
    }
    
    // Create mock sales activities using real contacts
    console.log('\n📞 Creating mock sales activities with medical aesthetic contacts...\n');
    
    const activityTypes = ['cold_call', 'follow_up', 'demo_scheduled', 'proposal_sent', 'meeting'];
    const outcomes = ['connected', 'voicemail', 'no_answer', 'meeting_scheduled', 'interested', 'not_interested'];
    
    // Generate activities for each rep
    for (const rep of medicalReps.filter(r => r.role === 'sales_rep')) {
      const repContacts = contacts?.slice(
        medicalReps.indexOf(rep) * 10, 
        (medicalReps.indexOf(rep) + 1) * 10
      ) || [];
      
      console.log(`\nCreating activities for ${rep.name}:`);
      
      for (let i = 0; i < 5; i++) {
        const contact = repContacts[i % repContacts.length];
        if (!contact) continue;
        
        const activity = {
          id: `activity-${rep.id}-${i}`,
          rep_id: rep.id,
          contact_id: contact.id,
          contact_name: contact.name || contact.company || 'Unknown Contact',
          activity_type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
          outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
          duration_minutes: Math.floor(Math.random() * 30) + 5,
          notes: `Discussed aesthetic equipment options with ${contact.company || 'practice'}`,
          created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          harvey_monitored: true,
          call_technique_score: (Math.random() * 2 + 3).toFixed(2), // 3.00 - 5.00
          pre_call_research_score: (Math.random() * 2 + 3).toFixed(2)
        };
        
        const { error: activityError } = await supabase
          .from('sales_activities')
          .insert(activity);
        
        if (!activityError) {
          console.log(`  ✓ Activity with ${activity.contact_name} (${activity.activity_type})`);
        }
      }
    }
    
    // Create performance metrics
    console.log('\n📊 Setting up performance metrics...\n');
    
    const today = new Date().toISOString().split('T')[0];
    
    for (const rep of medicalReps.filter(r => r.role === 'sales_rep')) {
      const metrics = {
        rep_id: rep.id,
        metric_date: today,
        calls_made: Math.floor(Math.random() * 20) + 10,
        calls_connected: Math.floor(Math.random() * 10) + 5,
        meetings_scheduled: Math.floor(Math.random() * 3) + 1,
        deals_closed: Math.floor(Math.random() * 2),
        opportunities_identified: Math.floor(Math.random() * 5) + 2,
        harvey_score: Math.floor(Math.random() * 40) + 50, // 50-90
        call_quality_avg: (Math.random() * 2 + 3).toFixed(2),
        research_quality_avg: (Math.random() * 2 + 3).toFixed(2),
        objection_handling_score: (Math.random() * 2 + 3).toFixed(2)
      };
      
      metrics.close_rate = (metrics.deals_closed / metrics.calls_connected).toFixed(4);
      
      const { error: metricsError } = await supabase
        .from('rep_performance_metrics')
        .upsert(metrics, { onConflict: 'rep_id,metric_date' });
      
      if (!metricsError) {
        console.log(`✓ ${rep.name}: Harvey Score ${metrics.harvey_score}, ${metrics.calls_made} calls, ${metrics.meetings_scheduled} meetings`);
      }
    }
    
    // Create Harvey coaching sessions based on performance
    console.log('\n💬 Creating Harvey coaching history...\n');
    
    const coachingScenarios = [
      { 
        trigger: 'low_morning_activity',
        message: "It's 10 AM and you've only made 3 calls. Top performers have already booked 2 demos by now. Pick up the pace.",
        type: 'morning_motivator'
      },
      {
        trigger: 'missed_opportunity',
        message: "You just let a hot lead from a premier med spa slip away. When they say 'we're happy with our current supplier,' that's when you dig deeper, not give up.",
        type: 'post_call_critic'
      },
      {
        trigger: 'great_close',
        message: "Now THAT'S how you close a deal. $50K laser package to Newport Beach Aesthetics. Keep that momentum going.",
        type: 'performance_reviewer'
      }
    ];
    
    for (const rep of medicalReps.filter(r => r.role === 'sales_rep')) {
      const scenario = coachingScenarios[Math.floor(Math.random() * coachingScenarios.length)];
      
      const { error: coachingError } = await supabase
        .from('harvey_coaching_sessions')
        .insert({
          rep_id: rep.id,
          session_type: scenario.type,
          trigger_reason: scenario.trigger,
          harvey_message: scenario.message,
          outcome: 'delivered',
          severity: 'medium',
          created_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
        });
      
      if (!coachingError) {
        console.log(`✓ Coached ${rep.name}: "${scenario.message.substring(0, 60)}..."`);
      }
    }
    
    // Create daily challenges
    console.log('\n🎯 Setting up Harvey daily challenges...\n');
    
    const challenges = [
      { title: "Close 2 Botox Training Packages", goal: 2, reward: "Harvey Score +10" },
      { title: "Book 5 Virtual Demos", goal: 5, reward: "Featured on Leaderboard" },
      { title: "Identify 3 New Med Spa Opportunities", goal: 3, reward: "Premium Lead Access" }
    ];
    
    for (const rep of medicalReps.filter(r => r.role === 'sales_rep')) {
      const challenge = challenges[Math.floor(Math.random() * challenges.length)];
      
      const { error: challengeError } = await supabase
        .from('harvey_daily_challenges')
        .insert({
          rep_id: rep.id,
          challenge_date: today,
          challenge: {
            ...challenge,
            penalty: "Harvey will personally review all your calls"
          },
          status: 'active',
          progress: { current: 0, target: challenge.goal }
        });
      
      if (!challengeError) {
        console.log(`✓ ${rep.name}'s challenge: ${challenge.title}`);
      }
    }
    
    console.log('\n✅ Medical aesthetic sales data populated successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${medicalReps.length} sales reps initialized`);
    console.log(`- ${contacts?.length || 0} medical aesthetic contacts available`);
    console.log('- Sales activities, metrics, and coaching sessions created');
    console.log('\n🎯 Harvey is ready to coach your medical aesthetic sales team!');
    console.log('\nRun "npm run harvey:monitor" to see the dashboard');
    
  } catch (error) {
    console.error('Error populating data:', error);
  }
}

populateWithMedicalAestheticData();