import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const PIAPI_URL = 'wss://api.piapi.ai/moshi/v1/stream';
const KYUTAI_URL = 'wss://moshi.kyutai.org/api/v1/stream';
const API_KEY = process.env.MOSHI_API_KEY || process.env.REACT_APP_MOSHI_API_KEY;

console.log('Testing Moshi API endpoints...\n');

async function testEndpoint(url, apiKey) {
  return new Promise((resolve) => {
    console.log(`Testing ${url}...`);
    
    let ws;
    const timeout = setTimeout(() => {
      console.log('❌ Timeout - no response\n');
      if (ws) ws.close();
      resolve(false);
    }, 5000);

    try {
      ws = new WebSocket(url, {
        headers: apiKey ? {
          'Authorization': `Bearer ${apiKey}`,
          'X-Session-ID': `test-${Date.now()}`
        } : {}
      });

      ws.on('open', () => {
        console.log('✅ Connected successfully!');
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      });

      ws.on('error', (error) => {
        console.log(`❌ Error: ${error.message}`);
        clearTimeout(timeout);
        resolve(false);
      });

      ws.on('close', () => {
        console.log('Connection closed\n');
      });
    } catch (error) {
      console.log(`❌ Exception: ${error.message}\n`);
      clearTimeout(timeout);
      resolve(false);
    }
  });
}

async function runTests() {
  // Test piapi.ai endpoint with API key
  console.log('1. Testing piapi.ai with API key:');
  await testEndpoint(PIAPI_URL, API_KEY);

  // Test kyutai.org endpoint with API key
  console.log('2. Testing kyutai.org with API key:');
  await testEndpoint(KYUTAI_URL, API_KEY);

  // Test kyutai.org endpoint without API key
  console.log('3. Testing kyutai.org without API key:');
  await testEndpoint(KYUTAI_URL, null);

  console.log('\nTest complete!');
  process.exit(0);
}

runTests();