const twilio = require('twilio');

exports.handler = async (event, context) => {
  // Only accept POST requests from Twilio
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  // Get your phone number from environment variable
  const YOUR_PHONE_NUMBER = process.env.FORWARD_TO_PHONE;
  
  if (!YOUR_PHONE_NUMBER) {
    console.error('FORWARD_TO_PHONE environment variable not set');
    return {
      statusCode: 500,
      body: 'Configuration error'
    };
  }

  // Parse the incoming call data
  const { From, To, CallSid, CallerName } = event.body ? 
    new URLSearchParams(event.body) : {};

  console.log(`Incoming call from ${From} to ${To}`);

  // Create TwiML response to forward the call
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Optional: Add a message before forwarding
  twiml.say({
    voice: 'alice'
  }, 'Thank you for calling RepConnect. Connecting you now.');
  
  // Forward the call to your phone
  const dial = twiml.dial({
    callerId: To, // Use the Twilio number as caller ID
    timeout: 30,
    action: '/.netlify/functions/call-status', // Optional: track call status
  });
  
  dial.number(YOUR_PHONE_NUMBER);

  // Return TwiML response
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
    body: twiml.toString()
  };
};