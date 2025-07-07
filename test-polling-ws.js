const { io } = require('socket.io-client');

console.log('Testing with polling transport...');

const socket = io('http://localhost:3001/call-transcription-ws', {
  path: '/agents-ws',
  auth: { token: process.env.TEST_AUTH_TOKEN || 'test-token-replace-with-env-var' },
  transports: ['polling', 'websocket']  // Try polling first
});

socket.on('connect', () => {
  console.log('✅ Connected to namespace!');
  console.log('Socket ID:', socket.id);
  console.log('Transport:', socket.io.engine.transport.name);
  
  // Test subscribing to a call
  const testCallSid = 'test-call-123';
  console.log('\nEmitting subscribe:call for:', testCallSid);
  socket.emit('subscribe:call', testCallSid);
  
  // Listen for events
  socket.on('transcription:current', (data) => {
    console.log('📝 Current transcription:', data);
  });
  
  socket.on('transcription:started', (data) => {
    console.log('📝 Transcription started:', data);
  });
  
  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });
  
  setTimeout(() => {
    console.log('\nDisconnecting...');
    socket.disconnect();
    process.exit(0);
  }, 3000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.error('Error type:', error.type);
  process.exit(1);
});

setTimeout(() => {
  console.log('Timeout reached');
  process.exit(1);
}, 10000);