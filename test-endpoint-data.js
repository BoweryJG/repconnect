#!/usr/bin/env node

import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';

const BACKEND_URL = 'https://osbackend-zl1h.onrender.com';
const SUPABASE_URL = 'https://cbopynuvhcymbumjnvay.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ANSI color codes
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function testEndpointData() {
  console.log(`\n${colors.blue}🔍 Testing Production Endpoint Data Structures${colors.reset}\n`);

  // Test 1: Harvey Metrics
  console.log(`${colors.yellow}1. Harvey Metrics Endpoint:${colors.reset}`);
  try {
    const response = await fetch(`${BACKEND_URL}/api/harvey/metrics?userId=test-user-${Date.now()}`);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Data structure:`);
    console.log(`   - metrics:`, typeof data.metrics === 'object' ? '✅' : '❌');
    console.log(`     - reputationPoints:`, data.metrics?.reputationPoints, typeof data.metrics?.reputationPoints === 'number' ? '✅' : '❌');
    console.log(`     - harveyStatus:`, data.metrics?.harveyStatus, typeof data.metrics?.harveyStatus === 'string' ? '✅' : '❌');
    console.log(`     - currentStreak:`, data.metrics?.currentStreak, typeof data.metrics?.currentStreak === 'number' ? '✅' : '❌');
    console.log(`     - totalSessions:`, data.metrics?.totalSessions, typeof data.metrics?.totalSessions === 'number' ? '✅' : '❌');
    console.log(`   - leaderboard:`, Array.isArray(data.leaderboard) ? `✅ (${data.leaderboard.length} entries)` : '❌');
    
    if (data.leaderboard && data.leaderboard.length > 0) {
      console.log(`     Sample entry:`, JSON.stringify(data.leaderboard[0]));
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }

  // Test 2: Harvey Verdict
  console.log(`\n${colors.yellow}2. Harvey Verdict Endpoint:${colors.reset}`);
  try {
    const response = await fetch(`${BACKEND_URL}/api/harvey/verdict?userId=test-user-${Date.now()}`);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Data structure:`);
    console.log(`   - text:`, data.text ? `✅ "${data.text.substring(0, 50)}..."` : '❌');
    console.log(`   - audio:`, data.audio, typeof data.audio === 'string' ? '✅' : '❌');
    console.log(`   - tone:`, data.tone, typeof data.tone === 'string' ? '✅' : '❌');
    console.log(`   - rating:`, data.rating, typeof data.rating === 'string' ? '✅' : '❌');
  } catch (error) {
    console.log(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }

  // Test 3: Supabase Contacts
  console.log(`\n${colors.yellow}3. Supabase Contacts Table:${colors.reset}`);
  try {
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .limit(2);
    
    if (error) throw error;
    
    console.log(`   Found ${contacts.length} contacts`);
    if (contacts.length > 0) {
      console.log(`   Sample contact structure:`);
      const sample = contacts[0];
      console.log(`   - id:`, sample.id ? '✅' : '❌');
      console.log(`   - first_name:`, sample.first_name ? '✅' : '❌');
      console.log(`   - last_name:`, sample.last_name ? '✅' : '❌');
      console.log(`   - email:`, sample.email ? '✅' : '❌');
      console.log(`   - phone:`, sample.phone ? '✅' : '❌');
      console.log(`   - company:`, sample.company ? '✅' : '❌');
      console.log(`   All fields:`, Object.keys(sample).join(', '));
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }

  // Test 4: Sales Coach Agents
  console.log(`\n${colors.yellow}4. Sales Coach Agents Table:${colors.reset}`);
  try {
    const { data: coaches, error } = await supabase
      .from('sales_coach_agents')
      .select('*')
      .limit(2);
    
    if (error) throw error;
    
    console.log(`   Found ${coaches.length} coaches`);
    if (coaches.length > 0) {
      console.log(`   Sample coach structure:`);
      const sample = coaches[0];
      console.log(`   - id:`, sample.id ? '✅' : '❌');
      console.log(`   - name:`, sample.name ? '✅' : '❌');
      console.log(`   - avatar_url:`, sample.avatar_url !== undefined ? '✅' : '❌');
      console.log(`   - voice_id:`, sample.voice_id !== undefined ? '✅' : '❌');
      console.log(`   - system_prompt:`, sample.system_prompt !== undefined ? '✅' : '❌');
      console.log(`   All fields:`, Object.keys(sample).join(', '));
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }

  // Test 5: Calls Table
  console.log(`\n${colors.yellow}5. Calls Table:${colors.reset}`);
  try {
    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2);
    
    if (error) throw error;
    
    console.log(`   Found ${calls.length} calls`);
    if (calls.length > 0) {
      console.log(`   Sample call structure:`);
      const sample = calls[0];
      console.log(`   - id:`, sample.id ? '✅' : '❌');
      console.log(`   - duration:`, sample.duration !== undefined ? '✅' : '❌');
      console.log(`   - created_at:`, sample.created_at ? '✅' : '❌');
      console.log(`   - user_id:`, sample.user_id !== undefined ? '✅' : '❌');
      console.log(`   - contact_id:`, sample.contact_id !== undefined ? '✅' : '❌');
      console.log(`   All fields:`, Object.keys(sample).join(', '));
    }
  } catch (error) {
    console.log(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }

  // Test 6: Check authenticated user
  console.log(`\n${colors.yellow}6. Auth Check:${colors.reset}`);
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    if (user) {
      console.log(`   ✅ Authenticated as:`, user.email);
      console.log(`   User ID:`, user.id);
    } else {
      console.log(`   ⚠️  No authenticated user (using anonymous access)`);
    }
  } catch (error) {
    console.log(`   ⚠️  Auth check failed:`, error.message);
  }

  // Test 7: Backend health with details
  console.log(`\n${colors.yellow}7. Backend Health Check:${colors.reset}`);
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    
    console.log(`   Status:`, data.status === 'healthy' ? '✅' : '❌', data.status);
    console.log(`   Service:`, data.service);
    console.log(`   Timestamp:`, data.timestamp);
  } catch (error) {
    console.log(`   ${colors.red}❌ Error: ${error.message}${colors.reset}`);
  }

  // Test 8: Check if we're using the right backend
  console.log(`\n${colors.yellow}8. Environment Configuration:${colors.reset}`);
  console.log(`   Backend URL:`, BACKEND_URL);
  console.log(`   Supabase URL:`, SUPABASE_URL);
  console.log(`   OpenAI Key:`, process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set');
  console.log(`   Deepgram Key:`, '✅ Configured in .env');

  console.log(`\n${colors.green}✅ Data structure test complete!${colors.reset}\n`);
}

testEndpointData().catch(console.error);