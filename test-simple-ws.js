const { io } = require('socket.io-client');

console.log('Testing simple WebSocket connection...');

// Try without auth first
const socket = io('http://localhost:3001/call-transcription-ws', {
  path: '/agents-ws',
  transports: ['websocket'],
  reconnection: false
});

socket.on('connect', () => {
  console.log('✅ Connected!');
  console.log('Socket ID:', socket.id);
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  
  // Try with auth
  console.log('\nTrying with auth token...');
  const authSocket = io('http://localhost:3001/call-transcription-ws', {
    path: '/agents-ws',
    auth: { token: process.env.TEST_AUTH_TOKEN || 'test-token-replace-with-env-var' },
    transports: ['websocket'],
    reconnection: false
  });
  
  authSocket.on('connect', () => {
    console.log('✅ Connected with auth!');
    console.log('Socket ID:', authSocket.id);
    process.exit(0);
  });
  
  authSocket.on('connect_error', (authError) => {
    console.error('❌ Auth connection error:', authError.message);
    process.exit(1);
  });
});

setTimeout(() => {
  console.log('Timeout reached');
  process.exit(1);
}, 5000);