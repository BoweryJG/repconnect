import harveyCoach from './src/services/harveyCoach.js';

async function initializeHarveySimple() {
  console.log('🚀 Initializing Harvey with demo reps...\n');
  
  // Demo sales reps - no database required
  const demoReps = [
    { id: 'rep-001', name: 'Mike Ross' },
    { id: 'rep-002', name: 'Rachel Zane' },
    { id: 'rep-003', name: 'Louis Litt' },
    { id: 'rep-004', name: 'Donna Paulsen' },
    { id: 'rep-005', name: 'Katrina Bennett' }
  ];
  
  console.log(`Initializing Harvey for ${demoReps.length} demo reps...\n`);
  
  // Initialize Harvey for each rep
  for (const rep of demoReps) {
    console.log(`Initializing Harvey for ${rep.name}...`);
    
    try {
      const result = await harveyCoach.initializeRep(rep.id, rep.name);
      console.log(`✓ ${rep.name}: ${result.message}\n`);
      
      // Create initial performance metrics
      await harveyCoach.trackActivity(rep.id, 'initialization', {
        repName: rep.name,
        harveyActivated: true,
        initialScore: 50
      });
      
    } catch (error) {
      console.error(`❌ Failed to initialize ${rep.name}:`, error.message);
    }
  }
  
  console.log('✅ Harvey initialization complete!');
  console.log('\n🎯 Harvey is now ready to coach your sales team!');
  console.log('\nNext steps:');
  console.log('1. Start Harvey: npm run harvey:start');
  console.log('2. Monitor performance: npm run harvey:monitor');
  console.log('3. Test coaching: node testHarveySimple.js');
  
  // Show a sample Harvey quote
  console.log('\n💬 Harvey says: "Success isn\'t just about winning, it\'s about winning with style. Now let\'s close some deals!"');
}

initializeHarveySimple().catch(console.error);