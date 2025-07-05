import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = 'https://cbopynuvhcymbumjnvay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib3B5bnV2aGN5bWJ1bWpudmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTUxNzMsImV4cCI6MjA1OTU3MTE3M30.UZElMkoHugIt984RtYWyfrRuv2rB67opQdCrFVPCfzU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUsers() {
  console.log('👥 Creating test sales reps for Harvey...\n');
  
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
    
    console.log('Checking users table structure...');
    
    // Insert test users
    for (const rep of testReps) {
      console.log(`\nCreating user: ${rep.name}`);
      
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
        console.error(`❌ Error creating ${rep.name}:`, error.message);
        
        // Try alternative approach - check if table expects different columns
        if (error.code === '42703') { // column does not exist
          console.log('Trying alternative schema...');
          
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
            console.log(`✅ Created user (basic): ${rep.email}`);
            
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
              console.log(`✅ Created user profile: ${rep.name}`);
            } else {
              console.error(`❌ Error creating profile:`, profileError.message);
            }
          } else {
            console.error(`❌ Alternative approach failed:`, altError.message);
          }
        }
      } else {
        console.log(`✅ Successfully created: ${rep.name}`);
      }
    }
    
    // Verify users were created
    console.log('\n📊 Verifying created users:\n');
    
    const { data: allUsers, error: fetchError } = await supabase
      .from('users')
      .select('*');
    
    if (!fetchError) {
      console.log(`Total users in database: ${allUsers.length}`);
      
      // Also check user_profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*');
      
      if (!profilesError) {
        console.log(`Total user profiles: ${profiles.length}`);
        
        if (profiles.length > 0) {
          console.log('\nUser profiles found:');
          profiles.forEach(profile => {
            console.log(`- ${profile.first_name} ${profile.last_name} (${profile.role})`);
          });
        }
      }
    }
    
    console.log('\n✅ Test users setup complete!');
    console.log('You can now run: npm run harvey:init');
    
  } catch (error) {
    console.error('Error creating test users:', error);
  }
}

createTestUsers();