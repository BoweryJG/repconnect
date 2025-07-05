import harveyCoach from './src/services/harveyCoach.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://cbopynuvhcymbumjnvay.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib3B5bnV2aGN5bWJ1bWpudmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTUxNzMsImV4cCI6MjA1OTU3MTE3M30.UZElMkoHugIt984RtYWyfrRuv2rB67opQdCrFVPCfzU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function initializeAllReps() {
  console.log('🚀 Initializing Harvey for all sales reps...\n');
  
  try {
    // Get all active sales reps from user_profiles table
    const { data: reps, error } = await supabase
      .from('user_profiles')
      .select('id, first_name, last_name, role')
      .in('role', ['sales_rep', 'manager']);
    
    if (error) {
      console.error('Failed to fetch reps:', error);
      return;
    }
    
    if (!reps || reps.length === 0) {
      console.log('No sales reps found. Creating demo reps...');
      
      // Create demo reps if none exist
      const demoReps = [
        { id: 'demo-rep-001', first_name: 'Mike', last_name: 'Ross', role: 'sales_rep' },
        { id: 'demo-rep-002', first_name: 'Rachel', last_name: 'Zane', role: 'sales_rep' },
        { id: 'demo-rep-003', first_name: 'Louis', last_name: 'Litt', role: 'sales_rep' }
      ];
      
      for (const demoRep of demoReps) {
        const { error: insertError } = await supabase
          .from('user_profiles')
          .upsert(demoRep, { onConflict: 'id' });
        
        if (insertError) {
          console.error(`Failed to create demo rep ${demoRep.first_name}:`, insertError);
        }
      }
      
      // Re-fetch reps
      const { data: newReps } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name, role')
        .in('role', ['sales_rep', 'manager']);
      
      reps = newReps || [];
    }
    
    console.log(`Found ${reps.length} sales reps\n`);
    
    // Initialize Harvey for each rep
    for (const rep of reps) {
      const fullName = `${rep.first_name} ${rep.last_name}`;
      console.log(`Initializing Harvey for ${fullName}...`);
      const result = await harveyCoach.initializeRep(rep.id, fullName);
      console.log(`✓ ${fullName}: ${result.message}\n`);
    }
    
    console.log('✅ Harvey initialization complete!');
    console.log('Harvey is now monitoring all sales reps.');
    
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

initializeAllReps();
