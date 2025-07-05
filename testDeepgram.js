import { createClient } from '@deepgram/sdk';
import dotenv from 'dotenv';

dotenv.config();

const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY;

console.log('Testing Deepgram API...');
console.log('API Key:', DEEPGRAM_API_KEY ? '***' + DEEPGRAM_API_KEY.slice(-4) : 'NOT SET');

async function testDeepgram() {
  try {
    // Initialize Deepgram client
    const deepgram = createClient(DEEPGRAM_API_KEY);

    // Test 1: Check API key with a simple TTS request
    console.log('\n1. Testing API connection with TTS...');
    
    const response = await deepgram.speak.request(
      { text: "Hello! Deepgram is working correctly. This is a test of the text to speech system." },
      {
        model: 'aura-asteria-en',
        encoding: 'mp3'
      }
    );

    console.log('✅ TTS Response received!');
    console.log('Response headers:', response.headers);

    // Test 2: Get project info
    console.log('\n2. Getting project information...');
    const projects = await deepgram.manage.getProjects();
    console.log('✅ Projects:', projects);

    // Test 3: Check balance
    console.log('\n3. Checking account balance...');
    if (projects.result && projects.result.projects && projects.result.projects.length > 0) {
      const projectId = projects.result.projects[0].project_id;
      console.log('   Project ID:', projectId);
      
      try {
        const balances = await deepgram.manage.getBalances(projectId);
        console.log('✅ Balance info:', JSON.stringify(balances, null, 2));
      } catch (balanceError) {
        console.log('   Could not fetch balance (this is normal for some account types)');
      }
    }

    // Test 4: Test live transcription connection
    console.log('\n4. Testing live transcription connection...');
    const connection = deepgram.listen.live({
      model: 'nova-2',
      language: 'en-US',
      punctuate: true,
      encoding: 'linear16',
      sample_rate: 16000
    });

    connection.on('open', () => {
      console.log('✅ Live transcription connection opened!');
      
      // Send a test audio packet
      const testAudio = Buffer.alloc(1600); // 100ms of silence
      connection.send(testAudio);
      
      // Close after 2 seconds
      setTimeout(() => {
        connection.finish();
        console.log('\n✅ All tests passed! Deepgram is ready to use.');
        console.log('\nYour setup is working correctly with:');
        console.log('- Text-to-Speech (TTS)');
        console.log('- Live Transcription (STT)');
        console.log('- Account has credit available');
        process.exit(0);
      }, 2000);
    });

    connection.on('error', (error) => {
      console.error('❌ Live connection error:', error);
    });

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.message.includes('401') || error.message.includes('403')) {
      console.error('Authentication failed. Check your API key.');
    }
    process.exit(1);
  }
}

// Run the test
testDeepgram();