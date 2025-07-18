import express from 'express';
import twilio from 'twilio';
import dotenv from 'dotenv';
import axios from 'axios';
import logger from '../utils/logger.js';
import { databaseService, tables } from '../src/services/databaseService.js';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Transcription service function
async function startTranscription(recordingSid, recordingUrl, callSid) {
  try {
    logger.info(`Starting transcription for recording ${recordingSid}`);

    // Use Deepgram for transcription
    const deepgramResponse = await axios.post(
      'https://api.deepgram.com/v1/listen',
      {
        url: recordingUrl,
      },
      {
        headers: {
          Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
          'Content-Type': 'application/json',
        },
        params: {
          model: 'nova-2',
          smart_format: true,
          diarize: true,
          punctuate: true,
          utterances: true,
        },
      }
    );

    const transcript = deepgramResponse.data.results?.channels?.[0]?.alternatives?.[0]?.transcript;
    const utterances = deepgramResponse.data.results?.utterances || [];

    if (transcript) {
      // Save full transcript to database
      await supabase.from('call_transcriptions').insert({
        call_sid: callSid,
        recording_sid: recordingSid,
        transcript: transcript,
        utterances: utterances,
        created_at: new Date().toISOString(),
      });

      // Update call record with transcript
      await supabase
        .from('calls')
        .update({
          transcription: transcript,
          has_transcription: true,
        })
        .eq('sid', callSid);

      // Trigger Harvey analysis
      await analyzeCallForHarvey(callSid, transcript, utterances);

      logger.info(`Transcription completed for call ${callSid}`);
    }
  } catch (error) {
    logger.error(`Transcription failed for recording ${recordingSid}:`, error);

    // Save error to database
    await supabase.from('call_transcriptions').insert({
      call_sid: callSid,
      recording_sid: recordingSid,
      error: error.message,
      created_at: new Date().toISOString(),
    });
  }
}

// Harvey analysis function
async function analyzeCallForHarvey(callSid, transcript, utterances) {
  try {
    const analysisResponse = await axios.post(
      `${process.env.BACKEND_URL}/api/harvey/analyze-call`,
      {
        callSid,
        transcript,
        utterances,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.HARVEY_API_KEY || 'internal'}`,
        },
      }
    );

    logger.info(`Harvey analysis completed for call ${callSid}`);
  } catch (error) {
    logger.error(`Harvey analysis failed for call ${callSid}:`, error);
  }
}

// Twilio webhook validation (optional but recommended for security)
const validateTwilioRequest = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.TWILIO_AUTH_TOKEN) {
    const twilioSignature = req.headers['x-twilio-signature'];
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const isValid = twilio.validateRequest(
      process.env.TWILIO_AUTH_TOKEN,
      twilioSignature,
      url,
      req.body
    );

    if (!isValid) {
      return res.status(403).send('Forbidden');
    }
  }
  next();
};

// POST /api/twilio/incoming-call
router.post('/api/twilio/incoming-call', validateTwilioRequest, async (req, res) => {
  logger.info('Incoming call webhook:', req.body);

  const { CallSid, From, To, CallStatus } = req.body;
  const forwardTo = process.env.FORWARD_TO_PHONE;

  if (!forwardTo) {
    logger.error('FORWARD_TO_PHONE not configured');
    return res.status(500).send('Configuration error');
  }

  try {
    // Log the incoming call to database
    await supabase.from('calls').insert({
      sid: CallSid,
      from_number: From,
      to_number: To,
      status: CallStatus,
      direction: 'inbound',
      created_at: new Date().toISOString(),
    });

    // Create TwiML response to forward the call
    const twiml = new twilio.twiml.VoiceResponse();

    // Optional greeting before forwarding
    twiml.say(
      {
        voice: 'alice',
      },
      'Thank you for calling RepConnect. Connecting you now. This call may be recorded for quality purposes.'
    );

    // Create conference room for call + Harvey
    const conferenceRoom = `harvey-${CallSid}`;

    // Customer enters conference
    twiml
      .dial({
        record: 'record-from-answer-dual',
        recordingStatusCallback: `${process.env.BACKEND_URL}/api/twilio/recording-status`,
        recordingStatusCallbackEvent: ['completed'],
      })
      .conference(conferenceRoom, {
        startConferenceOnEnter: true,
        endConferenceOnExit: true,
        waitUrl: 'http://twimlets.com/holdmusic?Bucket=com.twilio.music.ambient',
      });

    // Immediately dial rep into same conference
    setTimeout(async () => {
      try {
        const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        const repCall = await twilioClient.calls.create({
          from: process.env.TWILIO_PHONE_NUMBER,
          to: forwardTo,
          url: `${process.env.BACKEND_URL}/api/twilio/connect-rep?conference=${conferenceRoom}`,
        });

        logger.info(`Rep connected to conference ${conferenceRoom}: ${repCall.sid}`);
      } catch (error) {
        logger.error(`Failed to connect rep to conference ${conferenceRoom}:`, error);

        // Fallback: Try direct dial
        const fallbackTwiml = new twilio.twiml.VoiceResponse();
        fallbackTwiml.dial(forwardTo);

        // Update conference to direct dial
        await supabase
          .from('calls')
          .update({
            conference_fallback: true,
            notes: 'Conference failed, used direct dial',
          })
          .eq('sid', CallSid);
      }
    }, 1000);

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    logger.error('Error handling incoming call:', error);

    // Return TwiML even on error to handle the call gracefully
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('Sorry, we are experiencing technical difficulties. Please try again later.');

    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// POST /api/twilio/connect-rep - Connect rep to conference
router.post('/api/twilio/connect-rep', validateTwilioRequest, async (req, res) => {
  const { conference } = req.query;

  const twiml = new twilio.twiml.VoiceResponse();

  // Connect rep to conference room
  twiml.dial().conference(conference, {
    muted: false,
    startConferenceOnEnter: false,
    endConferenceOnExit: true,
  });

  // Trigger Harvey to join after rep connects
  setTimeout(async () => {
    try {
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      const harveyCall = await twilioClient.calls.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: process.env.HARVEY_PHONE_NUMBER || '+19292424535', // Harvey's virtual number
        url: `${process.env.BACKEND_URL}/api/twilio/connect-harvey?conference=${conference}`,
      });

      logger.info(`Harvey connected to conference ${conference}: ${harveyCall.sid}`);
    } catch (error) {
      logger.error(`Failed to connect Harvey to conference ${conference}:`, error);

      // Continue without Harvey if connection fails
      await supabase
        .from('calls')
        .update({
          harvey_failed: true,
          notes: 'Harvey connection failed, call continued without coaching',
        })
        .eq('sid', conference.split('-')[1]); // Extract CallSid from conference room name
    }
  }, 2000);

  res.type('text/xml');
  res.send(twiml.toString());
});

// POST /api/twilio/connect-harvey - Connect Harvey to conference
router.post('/api/twilio/connect-harvey', validateTwilioRequest, async (req, res) => {
  const { conference } = req.query;

  const twiml = new twilio.twiml.VoiceResponse();

  // Connect Harvey to conference room (muted so customer can't hear)
  twiml.dial().conference(conference, {
    muted: true, // Harvey can't speak to customer
    startConferenceOnEnter: false,
    endConferenceOnExit: false,
    whisper: true, // Harvey whispers only to rep
  });

  res.type('text/xml');
  res.send(twiml.toString());
});

// POST /api/twilio/call-status
router.post('/api/twilio/call-status', validateTwilioRequest, async (req, res) => {
  logger.info('Call status webhook:', req.body);

  const { CallSid, CallStatus, CallDuration, RecordingUrl, RecordingSid } = req.body;

  try {
    // Update call record with final status
    await supabase
      .from('calls')
      .update({
        status: CallStatus,
        duration: parseInt(CallDuration) || 0,
        recording_url: RecordingUrl,
        recording_sid: RecordingSid,
        ended_at: new Date().toISOString(),
      })
      .eq('sid', CallSid);

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Error updating call status:', error);
    res.status(500).send('Error processing status update');
  }
});

// POST /api/twilio/recording-status
router.post('/api/twilio/recording-status', validateTwilioRequest, async (req, res) => {
  logger.info('Recording status webhook:', req.body);

  const { RecordingSid, RecordingUrl, RecordingStatus, RecordingDuration, CallSid } = req.body;

  if (RecordingStatus !== 'completed') {
    return res.status(200).send('OK');
  }

  try {
    // Save recording information
    await supabase.from('call_recordings').insert({
      recording_sid: RecordingSid,
      call_sid: CallSid,
      url: RecordingUrl,
      duration: parseInt(RecordingDuration) || 0,
      status: RecordingStatus,
      created_at: new Date().toISOString(),
    });

    // Update call record with recording info
    await supabase
      .from('calls')
      .update({
        recording_url: RecordingUrl,
        recording_sid: RecordingSid,
        has_recording: true,
      })
      .eq('sid', CallSid);

    // Trigger transcription service for completed recording
    await startTranscription(RecordingSid, RecordingUrl, CallSid);

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Error processing recording:', error);
    res.status(500).send('Error processing recording');
  }
});

export default router;
