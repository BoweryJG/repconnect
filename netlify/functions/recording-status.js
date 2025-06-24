const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Only accept POST requests from Twilio
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  // Parse the recording data from Twilio
  const params = new URLSearchParams(event.body);
  const recordingData = {
    recordingSid: params.get('RecordingSid'),
    recordingUrl: params.get('RecordingUrl'),
    recordingStatus: params.get('RecordingStatus'),
    recordingDuration: params.get('RecordingDuration'),
    callSid: params.get('CallSid'),
    from: params.get('From'),
    to: params.get('To'),
    recordingStartTime: params.get('RecordingStartTime'),
  };

  console.log('Recording completed:', recordingData);

  // Save to Supabase if configured
  if (process.env.REACT_APP_SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
      const supabase = createClient(
        process.env.REACT_APP_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      // Save recording data to call_recordings table
      const { error } = await supabase
        .from('call_recordings')
        .insert({
          call_sid: recordingData.callSid,
          recording_sid: recordingData.recordingSid,
          recording_url: recordingData.recordingUrl,
          duration_seconds: parseInt(recordingData.recordingDuration) || 0,
          from_number: recordingData.from,
          to_number: recordingData.to,
          recording_date: recordingData.recordingStartTime,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving recording:', error);
      } else {
        console.log('Recording saved to database');
      }
    } catch (error) {
      console.error('Database error:', error);
    }
  }

  // Optional: Send notification about new recording
  // You could send an email, SMS, or push notification here

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/xml',
    },
    body: '<Response></Response>'
  };
};