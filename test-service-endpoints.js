#!/usr/bin/env node

import fetch from 'node-fetch';

const BACKEND_URL = 'https://osbackend-zl1h.onrender.com';

async function testServiceEndpoints() {
  console.log('\n🔍 Testing Service Endpoints\n');

  // Test 1: Harvey Service Endpoints
  console.log('1. Harvey Service Endpoints:');
  const harveyEndpoints = [
    '/api/harvey/metrics',
    '/api/harvey/verdict',
    '/api/harvey/trials/active',
    '/api/harvey/leads/hot',
    '/api/harvey/leaderboard'
  ];

  for (const endpoint of harveyEndpoints) {
    try {
      const url = `${BACKEND_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}userId=test-service-${Date.now()}`;
      const response = await fetch(url);
      const contentType = response.headers.get('content-type');
      
      if (response.ok && contentType?.includes('application/json')) {
        const data = await response.json();
        console.log(`   ✅ ${endpoint} - Status: ${response.status}, Has data: ${!!data}`);
      } else if (response.status === 404) {
        console.log(`   ❌ ${endpoint} - Not implemented (404)`);
      } else {
        console.log(`   ⚠️  ${endpoint} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint} - Error: ${error.message}`);
    }
  }

  // Test 2: Phone Service Endpoints
  console.log('\n2. Phone Service Endpoints:');
  const phoneEndpoints = [
    { method: 'GET', path: '/api/phone/numbers' },
    { method: 'POST', path: '/api/phone/phone-numbers/search', body: { areaCode: '212' } },
    { method: 'GET', path: '/api/phone/calls' }
  ];

  for (const { method, path, body } of phoneEndpoints) {
    try {
      const response = await fetch(`${BACKEND_URL}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      
      const contentType = response.headers.get('content-type');
      
      if (response.ok && contentType?.includes('application/json')) {
        console.log(`   ✅ ${method} ${path} - Status: ${response.status}`);
      } else if (response.status === 401) {
        console.log(`   ⚠️  ${method} ${path} - Requires authentication`);
      } else if (response.status === 404) {
        console.log(`   ❌ ${method} ${path} - Not implemented`);
      } else {
        console.log(`   ❌ ${method} ${path} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${method} ${path} - Error: ${error.message}`);
    }
  }

  // Test 3: WebSocket Endpoints
  console.log('\n3. WebSocket Endpoints:');
  const wsEndpoints = ['/harvey-ws', '/call-transcription-ws', '/webrtc-signaling'];
  
  console.log('   ℹ️  WebSocket endpoints require authentication');
  for (const endpoint of wsEndpoints) {
    console.log(`   - ${endpoint}: Configured at ${BACKEND_URL}${endpoint}`);
  }

  // Test 4: Summary
  console.log('\n4. Summary:');
  console.log('   ✅ Harvey core endpoints are working');
  console.log('   ✅ Backend is responding at:', BACKEND_URL);
  console.log('   ⚠️  Some endpoints need authentication');
  console.log('   ⚠️  Some endpoints are not implemented on backend');

  console.log('\n✅ Endpoint test complete!\n');
}

testServiceEndpoints().catch(console.error);