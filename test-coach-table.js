import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cbopynuvhcymbumjnvay.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCoachTable() {
  console.log('Testing Coach Table Structure:\n');
  
  try {
    // First try to get any data from the table
    const { data: coaches, error } = await supabase
      .from('sales_coach_agents')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('Error accessing table:', error.message);
      return;
    }
    
    if (coaches && coaches.length > 0) {
      console.log('Sample coach record:');
      console.log(JSON.stringify(coaches[0], null, 2));
      console.log('\nAvailable columns:', Object.keys(coaches[0]));
    } else {
      console.log('No coaches found in the table');
    }
    
    // Try a simpler query with just known fields
    const { data: simpleQuery, error: simpleError } = await supabase
      .from('sales_coach_agents')
      .select('id, name')
      .limit(5);
    
    if (\!simpleError && simpleQuery) {
      console.log('\nFound', simpleQuery.length, 'coaches:');
      simpleQuery.forEach(coach => {
        console.log(`- ${coach.name} (ID: ${coach.id})`);
      });
    }
    
  } catch (error) {
    console.log('Error:', error.message);
  }
}

testCoachTable();
