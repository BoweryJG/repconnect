import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUsers() {
  // Creating test sales reps for Harvey...
  
  // Test sales reps
  const testReps = [
    { 
      id: 'e1a2b3c4-d5e6-7f8a-9b0c-1d2e3f4a5b6c',
      name: 'Mike Ross',
      email: 'mike.ross@repconnect.com',
      role: 'sales_rep',
      active: true
    },
    { 
      id: 'f2b3c4d5-e6f7-8a9b-0c1d-2e3f4a5b6c7d',
      name: 'Rachel Zane',
      email: 'rachel.zane@repconnect.com',
      role: 'sales_rep',
      active: true
    },
    { 
      id: 'a3c4d5e6-f7a8-9b0c-1d2e-3f4a5b6c7d8e',
      name: 'Louis Litt',
      email: 'louis.litt@repconnect.com',
      role: 'sales_rep',
      active: true
    },
    { 
      id: 'b4d5e6f7-a8b9-0c1d-2e3f-4a5b6c7d8e9f',
      name: 'Jessica Pearson',
      email: 'jessica.pearson@repconnect.com',
      role: 'manager',
      active: true
    }
  ];
  
  try {
    // First check if users table has the expected columns
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    // Checking users table structure...
    
    // Insert test users
    for (const rep of testReps) {
      // Creating user: ${rep.name}
      
      const { data, error } = await supabase
        .from('users')
        .upsert({
          id: rep.id,
          name: rep.name,
          email: rep.email,
          role: rep.role,
          active: rep.active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select();
      
      if (error) {
        throw new Error(`Error creating ${rep.name}: ${error.message}`);
        
        // Try alternative approach - check if table expects different columns
        if (error.code === '42703') { // column does not exist
          // Trying alternative schema...
          
          // Try with different column names
          const { data: altData, error: altError } = await supabase
            .from('users')
            .upsert({
              id: rep.id,
              email: rep.email,
              created_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            })
            .select();
          
          if (!altError) {
            // Created user (basic): ${rep.email}
            
            // Try to create user_profile
            const { error: profileError } = await supabase
              .from('user_profiles')
              .upsert({
                id: rep.id,
                first_name: rep.name.split(' ')[0],
                last_name: rep.name.split(' ')[1],
                role: rep.role,
                active: rep.active
              }, {
                onConflict: 'id'
              });
            
            if (!profileError) {
              // Created user profile: ${rep.name}
            } else {
              throw new Error(`Error creating profile: ${profileError.message}`);
            }
          } else {
            throw new Error(`Alternative approach failed: ${altError.message}`);
          }
        }
      } else {
        // Successfully created: ${rep.name}
      }
    }
    
    // Verify users were created
    // Verifying created users...
    
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('*');
    
    if (!fetchError) {
      // Total users in database: ${allUsers.length}
      
      // Also check user_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*');
      
      if (!profilesError) {
        // Total user profiles: ${profiles.length}
        
        if (profiles.length > 0) {
          // User profiles found:
          profiles.forEach(profile => {
            // - ${profile.first_name} ${profile.last_name} (${profile.role})
          });
        }
      }
    }
    
    // Test users setup complete!
    // You can now run: npm run harvey:init
    
  } catch (error) {
    throw new Error(`Error creating test users: ${error.message || error}`);
  }
}

createTestUsers();