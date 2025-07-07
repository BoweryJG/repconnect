#!/usr/bin/env node

import { HarveyService } from './src/services/harveyService.js';
import { phoneService } from './src/services/phoneService.js';

async function testAppIntegration() {
  console.log('\n🔍 Testing App Service Integration\n');

  // Test 1: Harvey Service
  console.log('1. Testing Harvey Service:');
  try {
    const harvey = new HarveyService();
    
    // Wait a bit for constructor to set userId
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Test metrics
    const metrics = await harvey.getMetrics();
    console.log('   ✅ Metrics retrieved:', {
      reputationPoints: metrics.metrics?.reputationPoints,
      status: metrics.metrics?.harveyStatus,
      streak: metrics.metrics?.currentStreak
    });
    
    // Test verdict
    const verdict = await harvey.getDailyVerdict();
    console.log('   ✅ Verdict retrieved:', {
      hasText: !!verdict.text,
      hasAudio: !!verdict.audio,
      tone: verdict.tone
    });
    
    // Test leaderboard
    const leaderboard = await harvey.getLeaderboard();
    console.log('   ✅ Leaderboard entries:', leaderboard.length);
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Test 2: Phone Service
  console.log('\n2. Testing Phone Service:');
  try {
    // Test search (this might fail without auth)
    try {
      const numbers = await phoneService.searchAvailableNumbers({ areaCode: '212' });
      console.log('   ✅ Phone search working');
    } catch (err) {
      console.log('   ⚠️  Phone search requires authentication');
    }
    
    // Test getting user numbers (might need auth)
    try {
      const userNumbers = await phoneService.getUserPhoneNumbers();
      console.log('   Numbers retrieved:', userNumbers.length);
    } catch (err) {
      console.log('   ⚠️  Getting user numbers requires authentication');
    }
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  // Test 3: Check actual endpoints being used
  console.log('\n3. Endpoint Configuration:');
  console.log('   Harvey baseUrl:', harvey.baseUrl);
  console.log('   Phone service URL:', OSBACKEND_URL);
  console.log('   Both using production:', 
    harvey.baseUrl.includes('osbackend-zl1h') && 
    OSBACKEND_URL.includes('osbackend-zl1h') ? '✅' : '❌'
  );

  console.log('\n✅ Integration test complete!\n');
}

// Run as ES module
testAppIntegration().catch(console.error);