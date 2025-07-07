#!/usr/bin/env node

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const BACKEND_URL = 'https://osbackend-zl1h.onrender.com';
const SUPABASE_URL = 'https://cbopynuvhcymbumjnvay.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function validateData() {
  console.log('\n🔍 Validating Production Data\n');

  // Test 1: Harvey Metrics Structure
  console.log('1. Harvey Metrics - Expected Structure:');
  try {
    const response = await fetch(`${BACKEND_URL}/api/harvey/metrics?userId=prod-test-${Date.now()}`);
    const data = await response.json();
    
    const expectedFields = {
      'metrics.reputationPoints': 'number',
      'metrics.harveyStatus': 'string',
      'metrics.currentStreak': 'number',
      'metrics.totalSessions': 'number',
      'metrics.closingRate': 'number',
      'leaderboard': 'array'
    };
    
    console.log('   Response:', JSON.stringify(data, null, 2));
    console.log('\n   Validation:');
    
    for (const [field, expectedType] of Object.entries(expectedFields)) {
      const value = field.includes('.') 
        ? field.split('.').reduce((obj, key) => obj?.[key], data)
        : data[field];
      
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      const isValid = actualType === expectedType;
      
      console.log(`   - ${field}: ${isValid ? '✅' : '❌'} (expected: ${expectedType}, got: ${actualType})`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 2: Check Supabase Tables
  console.log('\n2. Supabase Tables - Checking Structure:');
  
  // Check contacts table
  console.log('\n   a) Contacts Table:');
  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    if (contacts && contacts.length > 0) {
      console.log('   Sample:', JSON.stringify(contacts[0], null, 2));
      console.log('   Required fields:', Object.keys(contacts[0]).filter(key => 
        ['id', 'first_name', 'last_name', 'email', 'phone'].includes(key)
      ).length === 5 ? '✅ All present' : '❌ Missing fields');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Check calls table
  console.log('\n   b) Calls Table:');
  try {
    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .limit(1);
    
    if (error) throw error;
    
    if (calls && calls.length > 0) {
      console.log('   Sample:', JSON.stringify(calls[0], null, 2));
      console.log('   Has duration field:', calls[0].duration !== undefined ? '✅' : '❌');
      console.log('   Has created_at field:', calls[0].created_at !== undefined ? '✅' : '❌');
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 3: Check API Integration
  console.log('\n3. API Integration Check:');
  
  // Test if Harvey API returns consistent data
  console.log('\n   a) Harvey API Consistency:');
  const userId = `consistency-test-${Date.now()}`;
  
  try {
    const response1 = await fetch(`${BACKEND_URL}/api/harvey/metrics?userId=${userId}`);
    const data1 = await response1.json();
    
    const response2 = await fetch(`${BACKEND_URL}/api/harvey/metrics?userId=${userId}`);
    const data2 = await response2.json();
    
    console.log('   Same userId returns same data:', 
      JSON.stringify(data1.metrics) === JSON.stringify(data2.metrics) ? '✅' : '❌'
    );
    
    // Test different user
    const response3 = await fetch(`${BACKEND_URL}/api/harvey/metrics?userId=different-user`);
    const data3 = await response3.json();
    
    console.log('   Different userId returns different data:', 
      data1.metrics.reputationPoints !== data3.metrics.reputationPoints ? '✅' : '❌'
    );
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 4: Check Environment Variables in Use
  console.log('\n4. Environment Configuration:');
  console.log('   REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL || 'Not set');
  console.log('   Expected:', BACKEND_URL);
  console.log('   Match:', process.env.REACT_APP_BACKEND_URL === BACKEND_URL ? '✅' : '❌');

  console.log('\n✅ Validation complete!\n');
}

validateData().catch(console.error);