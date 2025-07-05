import harveyCoach from './src/services/harveyCoach.js';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'https://cbopynuvhcymbumjnvay.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib3B5bnV2aGN5bWJ1bWpudmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTUxNzMsImV4cCI6MjA1OTU3MTE3M30.UZElMkoHugIt984RtYWyfrRuv2rB67opQdCrFVPCfzU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function initializeAllReps() {
  console.log('🚀 Initializing Harvey for all sales reps...\n');
  
  try {
    // Get all active sales reps from your database
    // Adjust this query based on your actual user/rep table structure
    const { data: reps, error } = await supabase
      .from('users')  // or 'sales_reps' - adjust to your table name
      .select('id, name')
      .eq('role', 'sales_rep')
      .eq('active', true);
    
    if (error) {
      console.error('Failed to fetch reps:', error);
      return;
    }
    
    console.log(`Found ${reps.length} active sales reps\n`);
    
    // Initialize Harvey for each rep
    for (const rep of reps) {
      console.log(`Initializing Harvey for ${rep.name}...`);
      const result = await harveyCoach.initializeRep(rep.id, rep.name);
      console.log(`✓ ${rep.name}: ${result.message}\n`);
    }
    
    console.log('✅ Harvey initialization complete!');
    console.log('Harvey is now monitoring all sales reps.');
    
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

initializeAllReps();
