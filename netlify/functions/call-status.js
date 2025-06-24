const { createClient } = require('@supabase/supabase-js');

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
    RecordingUrl: params.get('RecordingUrl'),
    RecordingSid: params.get('RecordingSid'),
    Timestamp: new Date().toISOString()
  };

  console.log('Call Status Update:', callStatus);

  // Save to Supabase if configured and call completed
  if (process.env.REACT_APP_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY && 
      callStatus.CallStatus === 'completed') {
    try {
      const supabase = createClient(
        process.env.REACT_APP_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      // Update or insert call record
      const { error } = await supabase
        .from('calls')
        .upsert({
          call_sid: callStatus.CallSid,
          from_number: callStatus.From,
          to_number: callStatus.To,
          duration_seconds: parseInt(callStatus.Duration) || 0,
          call_status: callStatus.CallStatus,
          direction: 'inbound',
          recording_url: callStatus.RecordingUrl,
          recording_sid: callStatus.RecordingSid,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'call_sid'
        });

      if (error) {
        console.error('Error saving call:', error);
      } else {
        console.log('Call record saved');
      }
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  // Return empty response to Twilio
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
    body: '<Response></Response>'
  };
};