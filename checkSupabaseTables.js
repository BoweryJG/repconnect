import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = 'https://cbopynuvhcymbumjnvay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib3B5bnV2aGN5bWJ1bWpudmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTUxNzMsImV4cCI6MjA1OTU3MTE3M30.UZElMkoHugIt984RtYWyfrRuv2rB67opQdCrFVPCfzU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking existing tables in Supabase...\n');
  
  try {
    // Query to get all tables in the public schema
    const { data, error } = await supabase
      .rpc('get_tables_list', {});
    
    if (error) {
      // If the function doesn't exist, try a different approach
      console.log('Trying alternative method to list tables...\n');
      
      // Try to query information_schema
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
      
      if (tablesError) {
        console.error('Error fetching tables:', tablesError);
        
        // Let's try to check specific tables we expect
        console.log('\nChecking for specific expected tables:\n');
        
        const expectedTables = [
          'users',
          'user_profiles',
          'sales_activities',
          'call_analysis',
          'harvey_coaching_sessions',
          'rep_performance_metrics',
          'harvey_daily_challenges',
          'harvey_notifications',
          'harvey_leaderboard_snapshots'
        ];
        
        for (const tableName of expectedTables) {
          try {
            const { count, error } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true });
            
            if (!error) {
              console.log(`✅ ${tableName} - EXISTS (${count || 0} rows)`);
            } else {
              console.log(`❌ ${tableName} - ${error.code === '42P01' ? 'DOES NOT EXIST' : error.message}`);
            }
          } catch (e) {
            console.log(`❌ ${tableName} - ERROR: ${e.message}`);
          }
        }
      } else {
        console.log('Tables in public schema:', tables);
      }
    } else {
      console.log('Tables found:', data);
    }
    
    // Check if we can query the users table structure
    console.log('\n📊 Checking users table structure (if exists):\n');
    try {
      const { data: sample, error: sampleError } = await supabase
        .from('users')
        .select('*')
        .limit(0);
      
      if (!sampleError) {
        // Get column info by checking the query structure
        const { data: userColumns, error: columnsError } = await supabase
          .rpc('get_table_columns', { table_name: 'users' });
        
        if (columnsError) {
          console.log('Users table exists but cannot get structure details');
        } else {
          console.log('Users table columns:', userColumns);
        }
      }
    } catch (e) {
      console.log('Users table not accessible');
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkTables();