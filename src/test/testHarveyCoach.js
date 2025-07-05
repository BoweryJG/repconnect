import harveyCoach from '../services/harveyCoach.js';
import harveyCallMonitor from '../services/harveyCallMonitor.js';
import { HarveyPersonality, getHarveyResponse } from '../services/harveyPersonality.js';

// Test Harvey Coach System
async function testHarveyCoach() {
  console.log('🎯 Testing Harvey Coach System...\n');
  
  // Test 1: Initialize a rep
  console.log('--- Test 1: Initialize Rep ---');
  const testRep = {
    id: 'test-rep-001',
    name: 'John Smith'
  };
  
  const initResult = await harveyCoach.initializeRep(testRep.id, testRep.name);
  console.log('Initialization:', initResult);
  console.log('Harvey says:', initResult.message);
  
  // Test 2: Get Harvey's personality responses
  console.log('\n--- Test 2: Harvey Personality ---');
  const scenarios = [
    { category: 'motivation', subcategory: 'aggressive', performance: { harveyScore: 30 } },
    { category: 'criticism', subcategory: 'harsh', performance: { harveyScore: 20 } },
    { category: 'success', subcategory: 'exceptional', performance: { harveyScore: 90 } }
  ];
  
  scenarios.forEach(scenario => {
    const response = HarveyPersonality.generateResponse(scenario, scenario.performance);
    console.log(`\n${scenario.category} (${scenario.subcategory}):`, response);
  });
  
  // Test 3: Simulate low activity trigger
  console.log('\n--- Test 3: Low Activity Trigger ---');
  const lowActivityCoaching = await harveyCoach.deliverCoaching(testRep.id, {
    mode: harveyCoach.coachingModes.MORNING_MOTIVATOR,
    message: getHarveyResponse(
      { category: 'motivation', subcategory: 'aggressive' },
      { harveyScore: 40 },
      'mondayMorning',
      testRep.name
    ),
    severity: 'high',
    actionRequired: true
  });
  console.log('Coaching delivered:', lowActivityCoaching);
  
  // Test 4: Simulate call analysis
  console.log('\n--- Test 4: Call Analysis ---');
  const mockCallData = {
    repId: testRep.id,
    callId: 'call-001',
    duration: 720, // 12 minutes
    outcome: 'no_decision',
    transcript: 'Um, hi, is this a good time to talk? I was wondering if maybe you might be interested in possibly looking at our products...'
  };
  
  const analysis = await harveyCoach.analyzeTranscript(mockCallData.transcript);
  console.log('Call analysis:', analysis);
  
  const critique = harveyCoach.generateCallCritique(analysis);
  console.log('Harvey\'s critique:', critique);
  
  // Test 5: Daily challenge
  console.log('\n--- Test 5: Daily Challenge ---');
  const challenge = await harveyCoach.createDailyChallenge(testRep.id);
  console.log('Today\'s challenge:', challenge);
  
  // Test 6: Performance stats
  console.log('\n--- Test 6: Performance Stats ---');
  const stats = await harveyCoach.getRepDailyStats(testRep.id);
  console.log('Daily stats:', stats);
  
  // Test 7: Harvey's special scenarios
  console.log('\n--- Test 7: Special Scenarios ---');
  Object.entries(HarveyPersonality.specialScenarios).slice(0, 3).forEach(([scenario, message]) => {
    console.log(`\n${scenario}:`, message);
  });
  
  // Test 8: Demo script
  console.log('\n--- Test 8: Demo Script ---');
  const demoScript = harveyCoach.generateDemoScript();
  console.log('Harvey\'s demo script:');
  Object.entries(demoScript).forEach(([phase, script]) => {
    console.log(`\n${phase.toUpperCase()}:`, script);
  });
  
  console.log('\n✅ Harvey Coach System Test Complete!');
}

// Run the test
testHarveyCoach().catch(console.error);

// Example integration with existing call system
export function integrateHarveyWithCalls() {
  // Start monitoring all active sales reps
  const salesReps = [
    { id: 'rep-001', name: 'John Smith' },
    { id: 'rep-002', name: 'Sarah Johnson' },
    { id: 'rep-003', name: 'Mike Wilson' }
  ];
  
  salesReps.forEach(rep => {
    harveyCallMonitor.startMonitoring(rep.id, rep.name);
  });
  
  console.log('🎯 Harvey is now monitoring all sales reps!');
}

// Example API usage
export const harveyAPI = {
  // Initialize Harvey for a rep
  initialize: (repId, repName) => harveyCoach.initializeRep(repId, repName),
  
  // Get coaching message
  getCoaching: (trigger, performance, situation, repName) => 
    getHarveyResponse(trigger, performance, situation, repName),
  
  // Trigger intervention
  intervene: (repId, reason) => harveyCoach.deliverCoaching(repId, {
    mode: 'post_call_critic',
    message: getHarveyResponse(
      { category: 'criticism', subcategory: 'constructive' },
      { harveyScore: 50 },
      reason,
      'Rep'
    ),
    severity: 'medium',
    actionRequired: true
  }),
  
  // Get leaderboard
  getLeaderboard: () => harveyCoach.updateLeaderboard(),
  
  // Create challenge
  createChallenge: (repId) => harveyCoach.createDailyChallenge(repId)
};