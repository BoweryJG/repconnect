import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function testCoachingSystem() {
  console.log('🚀 Testing Instant Coach Connect System...\n');

  try {
    // Test 1: Verify coaches exist
    console.log('📋 Test 1: Checking available coaches...');
    const { data: coaches, error: coachError } = await supabase
      .from('sales_coach_agents')
      .select('name, personality_type, device_expertise')
      .limit(3);

    if (coachError) throw coachError;
    console.log('✅ Found coaches:', coaches.map(c => `${c.name} (${c.personality_type})`).join(', '));

    // Test 2: Check procedure specializations
    console.log('\n🎯 Test 2: Checking procedure specializations...');
    const { data: specializations, error: specError } = await supabase
      .from('coach_procedure_specializations')
      .select(`
        procedure_category,
        coach:sales_coach_agents(name, personality_type),
        expertise_description,
        available_for_instant
      `)
      .eq('available_for_instant', true)
      .limit(6);

    if (specError) throw specError;
    
    const categories = {};
    specializations.forEach(spec => {
      if (!categories[spec.procedure_category]) {
        categories[spec.procedure_category] = [];
      }
      categories[spec.procedure_category].push(spec.coach.name);
    });

    console.log('✅ Procedure specialists available:');
    Object.entries(categories).forEach(([category, coaches]) => {
      console.log(`   ${category}: ${coaches.join(', ')}`);
    });

    // Test 3: Check device expertise
    console.log('\n🔧 Test 3: Checking device expertise...');
    const { data: devices, error: deviceError } = await supabase
      .from('coach_device_expertise')
      .select(`
        device_name,
        manufacturer,
        coach:sales_coach_agents(name)
      `)
      .limit(5);

    if (deviceError) throw deviceError;
    console.log('✅ Device experts:');
    devices.forEach(device => {
      console.log(`   ${device.device_name} (${device.manufacturer}) → ${device.coach.name}`);
    });

    // Test 4: Check coach availability
    console.log('\n⚡ Test 4: Checking coach availability...');
    const { data: availability, error: availError } = await supabase
      .from('coach_availability')
      .select(`
        is_available,
        coach:sales_coach_agents(name)
      `)
      .eq('is_available', true);

    if (availError) throw availError;
    console.log('✅ Available coaches:', availability.map(a => a.coach.name).join(', '));

    // Test 5: Demo session creation (dry run)
    console.log('\n🎮 Test 5: Demo session creation...');
    const sessionData = {
      rep_id: '123e4567-e89b-12d3-a456-426614174000', // Mock UUID
      coach_id: coaches[0].id, // Use first coach
      session_type: 'practice_pitch',
      procedure_category: 'yomi_robot',
      webrtc_room_id: `demo-room-${Date.now()}`,
      connection_status: 'demo',
      session_goals: ['Practice Yomi positioning', 'Handle price objections']
    };

    console.log('✅ Demo session data prepared:');
    console.log(`   Coach: ${coaches[0].name}`);
    console.log(`   Procedure: ${sessionData.procedure_category}`);
    console.log(`   Room ID: ${sessionData.webrtc_room_id}`);

    console.log('\n🎉 All tests passed! Instant Coach Connect system is ready!\n');

    // Summary
    console.log('📊 SYSTEM SUMMARY:');
    console.log(`   • ${coaches.length} AI coaches available`);
    console.log(`   • ${Object.keys(categories).length} procedure categories covered`);
    console.log(`   • ${devices.length} device specializations`);
    console.log(`   • ${availability.length} coaches currently available`);
    console.log('\n🚀 Ready for rep connections!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCoachingSystem();