exports.handler = async (event, context) => {
  // Only accept POST requests from Twilio
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  // Parse the call status data
  const params = new URLSearchParams(event.body);
  const callStatus = {
    CallSid: params.get('CallSid'),
    From: params.get('From'),
    To: params.get('To'),
    CallStatus: params.get('CallStatus'),
    Duration: params.get('Duration'),
    CallDuration: params.get('CallDuration'),
    Direction: params.get('Direction'),
    Timestamp: new Date().toISOString()
  };

  console.log('Call Status Update:', callStatus);

  // In production, you might want to:
  // - Store this in a database
  // - Send notifications
  // - Update call logs in your app

  // Return empty response to Twilio
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
    body: '<Response></Response>'
  };
};