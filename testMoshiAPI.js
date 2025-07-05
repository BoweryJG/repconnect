import WebSocket from 'ws';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Try different Moshi endpoints
const MOSHI_API_URL = process.env.MOSHI_API_URL || process.env.REACT_APP_MOSHI_API_URL || 'wss://moshi.kyutai.org/api/v1/stream';
const MOSHI_API_KEY = process.env.MOSHI_API_KEY || process.env.REACT_APP_MOSHI_API_KEY;

// Test which URL to use
const USE_KYUTAI_URL = process.argv.includes('--kyutai');

console.log('Testing Moshi API Connection...');
console.log('API URL:', MOSHI_API_URL);
console.log('API Key:', MOSHI_API_KEY ? '***' + MOSHI_API_KEY.slice(-4) : 'NOT SET');

if (!MOSHI_API_URL || !MOSHI_API_KEY) {
  console.error('ERROR: Missing MOSHI_API_URL or MOSHI_API_KEY in environment variables');
  process.exit(1);
}

let ws;
let testTimeout;

function connectToMoshi() {
  console.log('\nConnecting to Moshi...');
  
  ws = new WebSocket(MOSHI_API_URL, {
    headers: {
      'Authorization': `Bearer ${MOSHI_API_KEY}`,
      'X-Session-ID': `test-session-${Date.now()}`,
      'X-Sample-Rate': '16000',
      'X-Language': 'en-US'
    }
  });

  ws.on('open', () => {
    console.log('✅ Connected to Moshi successfully!');
    console.log('\nSending configuration...');
    
    // Send initial configuration
    const config = {
      type: 'config',
      config: {
        sampleRate: 16000,
        channels: 1,
        encoding: 'pcm16',
        language: 'en-US',
        mode: 'conversation',
        features: {
          transcription: true,
          synthesis: true,
          emotion: true,
          interruption: true
        }
      }
    };
    
    ws.send(JSON.stringify(config));
    console.log('Configuration sent:', JSON.stringify(config, null, 2));
    
    // Send a test text message
    setTimeout(() => {
      console.log('\nSending test text message...');
      ws.send(JSON.stringify({
        type: 'text',
        text: 'Hello, this is a test message for Harvey AI integration.',
        generateSpeech: true
      }));
    }, 1000);

    // Set timeout to close connection
    testTimeout = setTimeout(() => {
      console.log('\nTest completed. Closing connection...');
      ws.close();
    }, 10000);
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('\n📨 Received message:', {
        type: message.type,
        ...message
      });

      switch (message.type) {
        case 'ready':
          console.log('✅ Moshi is ready to receive audio/text');
          break;
        case 'transcript':
          console.log('📝 Transcript:', message.text);
          break;
        case 'synthesis':
          console.log('🔊 Speech synthesis received (audio data present)');
          break;
        case 'emotion':
          console.log('😊 Emotion detected:', message.emotion, 'Confidence:', message.confidence);
          break;
        case 'error':
          console.error('❌ Error from Moshi:', message.error);
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
      console.log('Raw message:', data.toString());
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('Authentication failed. Check your API key.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('Cannot resolve API URL. Check the URL is correct.');
    }
  });

  ws.on('close', (code, reason) => {
    console.log('\nConnection closed');
    console.log('Code:', code);
    console.log('Reason:', reason.toString());
    
    if (testTimeout) {
      clearTimeout(testTimeout);
    }
    
    // Exit with appropriate code
    if (code === 1000) {
      console.log('\n✅ Test completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Test failed with error');
      process.exit(1);
    }
  });
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, closing connection...');
  if (ws) {
    ws.close();
  }
  process.exit(0);
});

// Start the test
connectToMoshi();