import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = 'https://cbopynuvhcymbumjnvay.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('🔍 Checking table structures...\n');
  
  try {
    // Try to query user_profiles with all columns
    console.log('1. Checking user_profiles table:');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.error('Error querying user_profiles:', profileError);
    } else {
      console.log('user_profiles sample:', profiles);
      if (profiles && profiles.length > 0) {
        console.log('Columns found:', Object.keys(profiles[0]));
      }
    }
    
    // Try to query users table
    console.log('\n2. Checking users table:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('Error querying users:', usersError);
    } else {
      console.log('users sample:', users);
      if (users && users.length > 0) {
        console.log('Columns found:', Object.keys(users[0]));
      }
    }
    
    // Check if there's any data
    console.log('\n3. Checking row counts:');
    
    const { count: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    const { count: profileCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });
    
    console.log(`users table: ${userCount || 0} rows`);
    console.log(`user_profiles table: ${profileCount || 0} rows`);
    
    // Try different column combinations
    console.log('\n4. Testing different column queries:');
    
    const queries = [
      { table: 'user_profiles', columns: 'id' },
      { table: 'user_profiles', columns: 'id, name' },
      { table: 'user_profiles', columns: 'id, email' },
      { table: 'user_profiles', columns: 'id, role' },
      { table: 'users', columns: 'id' },
      { table: 'users', columns: 'id, email' },
      { table: 'users', columns: 'id, created_at' }
    ];
    
    for (const query of queries) {
      const { error } = await supabase
        .from(query.table)
        .select(query.columns)
        .limit(1);
      
      if (!error) {
        console.log(`✅ ${query.table}.${query.columns} - WORKS`);
      } else {
        console.log(`❌ ${query.table}.${query.columns} - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error checking structure:', error);
  }
}

checkTableStructure();