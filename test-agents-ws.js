const { io } = require('socket.io-client');

console.log('Testing direct connection to agents-ws...');

const backendUrl = 'http://localhost:3001';

// Connect to the base agents-ws path
const socket = io(backendUrl, {
  path: '/agents-ws',
  auth: {
    token: 'demo-token'
  },
  transports: ['websocket'],
  reconnection: false
});

socket.on('connect', () => {
  console.log('✅ Connected to agents WebSocket');
  console.log('Socket ID:', socket.id);
  
  // List available namespaces by trying different ones
  socket.disconnect();
  
  // Now try connecting to the call transcription namespace
  console.log('\nTrying call-transcription namespace...');
  const transcriptionSocket = io(`${backendUrl}/call-transcription-ws`, {
    path: '/agents-ws',
    auth: {
      token: 'demo-token'
    },
    transports: ['websocket'],
    reconnection: false
  });
  
  transcriptionSocket.on('connect', () => {
    console.log('✅ Connected to call-transcription namespace');
    console.log('Socket ID:', transcriptionSocket.id);
    
    // Test the subscribe event
    const testCallSid = 'test-call-123';
    console.log('\nSubscribing to call:', testCallSid);
    transcriptionSocket.emit('subscribe:call', testCallSid);
    
    setTimeout(() => {
      transcriptionSocket.disconnect();
      process.exit(0);
    }, 2000);
  });
  
  transcriptionSocket.on('connect_error', (error) => {
    console.error('❌ Namespace connection error:', error.message);
    process.exit(1);
  });
});

socket.on('connect_error', (error) => {
  console.error('❌ Base connection error:', error.message);
  process.exit(1);
});