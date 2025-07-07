const { io } = require('socket.io-client');

console.log('Testing transcription WebSocket connection...');

const backendUrl = 'http://localhost:3001';

// First, let's test connecting to the base agents-ws path
console.log('Attempting to connect to:', `${backendUrl}/call-transcription-ws`);
console.log('Using path:', '/agents-ws');

const socket = io(`${backendUrl}/call-transcription-ws`, {
  path: '/agents-ws',
  auth: {
    token: process.env.TEST_AUTH_TOKEN || 'test-token-replace-with-env-var'
  },
  transports: ['websocket'],
  reconnection: false
});

socket.on('connect', () => {
  console.log('✅ Connected to transcription service');
  console.log('Socket ID:', socket.id);
  
  // Test subscribing to a call
  const testCallSid = 'test-call-123';
  console.log('Subscribing to call:', testCallSid);
  socket.emit('subscribe:call', testCallSid);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.error('Error type:', error.type);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('transcription:started', (data) => {
  console.log('📝 Transcription started:', data);
});

socket.on('transcription:update', (data) => {
  console.log('📝 Transcription update:', data);
});

socket.on('transcription:error', (data) => {
  console.error('❌ Transcription error:', data);
});

// Keep the script running
setTimeout(() => {
  console.log('Test complete, disconnecting...');
  socket.disconnect();
  process.exit(0);
}, 10000);