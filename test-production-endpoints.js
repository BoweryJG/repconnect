#!/usr/bin/env node

// Test script to verify production endpoints are working correctly
import fetch from 'node-fetch';
import { io } from 'socket.io-client';

const BACKEND_URL = 'https://osbackend-zl1h.onrender.com';
const DEEPGRAM_URL = 'wss://api.deepgram.com/v1/listen';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.yellow}ℹ${colors.reset} ${msg}`)
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

async function testEndpoint(name, url, options = {}) {
  try {
    log.info(`Testing ${name}...`);
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log.success(`${name}: ${response.status} OK`);
      console.log(`  Response: ${JSON.stringify(data).substring(0, 100)}...`);
      results.passed++;
      results.tests.push({ name, status: 'passed', data });
      return data;
    } else {
      log.error(`${name}: ${response.status} ${response.statusText}`);
      console.log(`  Error: ${JSON.stringify(data)}`);
      results.failed++;
      results.tests.push({ name, status: 'failed', error: data });
      return null;
    }
  } catch (error) {
    log.error(`${name}: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'failed', error: error.message });
    return null;
  }
}

async function testWebSocket(name, url, namespace = '') {
  return new Promise((resolve) => {
    log.info(`Testing WebSocket ${name}...`);
    
    const socket = io(`${url}${namespace}`, {
      path: '/agents-ws',
      transports: ['websocket'],
      reconnection: false,
      timeout: 5000
    });
    
    const timeout = setTimeout(() => {
      log.error(`${name}: Connection timeout`);
      results.failed++;
      results.tests.push({ name, status: 'failed', error: 'Connection timeout' });
      socket.disconnect();
      resolve(false);
    }, 5000);
    
    socket.on('connect', () => {
      clearTimeout(timeout);
      log.success(`${name}: Connected successfully`);
      results.passed++;
      results.tests.push({ name, status: 'passed' });
      socket.disconnect();
      resolve(true);
    });
    
    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      log.error(`${name}: ${error.message}`);
      results.failed++;
      results.tests.push({ name, status: 'failed', error: error.message });
      socket.disconnect();
      resolve(false);
    });
  });
}

async function runTests() {
  console.log('\n🧪 Testing Production Endpoints\n');
  console.log(`Backend URL: ${BACKEND_URL}\n`);
  
  // Test basic health endpoint
  await testEndpoint('Health Check', `${BACKEND_URL}/health`);
  
  // Test Harvey endpoints
  await testEndpoint('Harvey Metrics', `${BACKEND_URL}/api/harvey/metrics?userId=test-user`);
  await testEndpoint('Harvey Verdict', `${BACKEND_URL}/api/harvey/verdict?userId=test-user`);
  await testEndpoint('Harvey Active Trials', `${BACKEND_URL}/api/harvey/trials/active`);
  await testEndpoint('Harvey Hot Leads', `${BACKEND_URL}/api/harvey/leads/hot`);
  
  // Test coaching endpoints
  await testEndpoint('Available Coaches', `${BACKEND_URL}/api/coaching/available-coaches/medical_aesthetics`);
  
  // Test phone service endpoints (these might require auth)
  await testEndpoint('Phone Numbers Search', `${BACKEND_URL}/api/phone/phone-numbers/search`, {
    method: 'POST',
    body: JSON.stringify({ areaCode: '212' })
  });
  
  // Test WebSocket connections
  await testWebSocket('Harvey WebSocket', BACKEND_URL, '/harvey-ws');
  await testWebSocket('Transcription WebSocket', BACKEND_URL, '/call-transcription-ws');
  await testWebSocket('WebRTC Signaling', BACKEND_URL, '/webrtc-signaling');
  
  // Test Deepgram connection (just check if we can connect)
  log.info('Testing Deepgram WebSocket...');
  try {
    const ws = new WebSocket(`${DEEPGRAM_URL}?encoding=linear16&sample_rate=48000&channels=1&token=4beb44e547c8ef520a575d343315b9d0dae38549`);
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, 5000);
      
      ws.on('open', () => {
        clearTimeout(timeout);
        log.success('Deepgram WebSocket: Connected successfully');
        results.passed++;
        results.tests.push({ name: 'Deepgram WebSocket', status: 'passed' });
        ws.close();
        resolve();
      });
      
      ws.on('error', (error) => {
        clearTimeout(timeout);
        log.error(`Deepgram WebSocket: ${error.message}`);
        results.failed++;
        results.tests.push({ name: 'Deepgram WebSocket', status: 'failed', error: error.message });
        reject(error);
      });
    });
  } catch (error) {
    // Error already logged
  }
  
  // Summary
  console.log('\n📊 Test Summary\n');
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed}${colors.reset}`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => t.status === 'failed')
      .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
  }
  
  console.log('\n✅ Production Endpoint Test Complete\n');
}

// Run the tests
runTests().catch(console.error);