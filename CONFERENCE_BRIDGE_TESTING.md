# Conference Bridge Testing Checklist

## Pre-Production Testing Requirements

### 1. Environment Setup

- [ ] `HARVEY_PHONE_NUMBER=+19292424535` set in environment
- [ ] Supabase schema migrations applied (`CONFERENCE_BRIDGE_SCHEMA.sql`)
- [ ] All environment variables configured:
  - `TWILIO_ACCOUNT_SID`
  - `TWILIO_AUTH_TOKEN`
  - `TWILIO_PHONE_NUMBER`
  - `DEEPGRAM_API_KEY`
  - `HARVEY_PHONE_NUMBER`
  - `BACKEND_URL`
  - `FORWARD_TO_PHONE`

### 2. Basic Conference Flow Testing

- [ ] **Test 1: Customer calls main number**
  - Customer calls `+18454090692`
  - Hears greeting and hold music
  - Rep phone rings and connects to conference
  - Customer and rep can talk normally
- [ ] **Test 2: Harvey joins conference**
  - Harvey number (`+19292424535`) gets called
  - Harvey connects to same conference room
  - Harvey can whisper to rep (muted to customer)
  - Customer cannot hear Harvey

- [ ] **Test 3: Audio quality**
  - Rep can hear customer clearly
  - Rep can hear Harvey whispers at lower volume
  - Customer only hears rep (Harvey is muted)
  - No echo or feedback issues

### 3. Recording and Transcription Testing

- [ ] **Test 4: Call recording**
  - Conference call gets recorded (dual channel)
  - Recording saved to Supabase `call_recordings` table
  - Recording URL accessible and playable
- [ ] **Test 5: Transcription processing**
  - Recording automatically sent to Deepgram
  - Transcript saved to `call_transcriptions` table
  - Call record updated with transcription
  - No transcription errors in logs

- [ ] **Test 6: Harvey analysis**
  - Transcript sent to Harvey analysis endpoint
  - Harvey coaching data saved to database
  - Analysis completes without errors

### 4. Error Handling Testing

- [ ] **Test 7: Rep phone unreachable**
  - Customer calls when rep phone is off
  - System handles gracefully
  - Customer gets appropriate message
  - Call logged with error status

- [ ] **Test 8: Harvey connection fails**
  - Harvey number unreachable
  - Conference continues without Harvey
  - Error logged in database
  - Rep still gets customer call

- [ ] **Test 9: Conference room failures**
  - Network issues during conference
  - Fallback to direct dial works
  - Database updated with fallback status
  - No customer disruption

### 5. Database Integrity Testing

- [ ] **Test 10: Call logging**
  - Every call creates record in `calls` table
  - Conference room names properly stored
  - All SIDs and timestamps accurate
  - Status updates work correctly

- [ ] **Test 11: Transcription storage**
  - Transcripts saved with proper encoding
  - Utterances JSON data valid
  - Error handling for transcription failures
  - Database constraints respected

### 6. Production Load Testing

- [ ] **Test 12: Multiple concurrent calls**
  - 2-3 simultaneous customer calls
  - Each gets unique conference room
  - No audio cross-talk between calls
  - All recordings and transcripts separate

- [ ] **Test 13: Extended call duration**
  - Long calls (30+ minutes) handled properly
  - Harvey stays connected throughout
  - Recording and transcription work for long calls
  - No memory leaks or timeouts

### 7. Security Testing

- [ ] **Test 14: Webhook security**
  - Twilio webhook validation working
  - Unauthorized requests rejected
  - Proper authentication for Harvey API
  - No sensitive data in logs

### 8. Monitoring and Alerting

- [ ] **Test 15: Error logging**
  - All errors properly logged
  - Log levels appropriate
  - No sensitive data in logs
  - Monitoring dashboards updated

- [ ] **Test 16: Performance metrics**
  - Call connection times measured
  - Transcription processing times tracked
  - Database query performance acceptable
  - No bottlenecks identified

## Production Deployment Checklist

### Pre-Deployment

- [ ] All tests above passed
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Backup plan documented
- [ ] Rollback procedure tested

### Deployment

- [ ] Deploy backend changes
- [ ] Verify webhook endpoints responding
- [ ] Test single end-to-end call
- [ ] Monitor logs for errors
- [ ] Verify Harvey connection working

### Post-Deployment

- [ ] Monitor first 10 production calls
- [ ] Verify recordings and transcripts
- [ ] Check database performance
- [ ] Confirm Harvey analysis working
- [ ] Document any issues found

## Emergency Procedures

### If Conference Bridge Fails

1. **Immediate Action**: Revert to direct dial
2. **Change webhook**: Use simple `twiml.dial(forwardTo)`
3. **Monitor**: Customer calls still work normally
4. **Fix**: Debug conference issues offline
5. **Redeploy**: When fixes tested and verified

### If Harvey Fails

1. **Calls continue**: Without Harvey coaching
2. **Check logs**: Identify Harvey connection issues
3. **Verify number**: `+19292424535` is reachable
4. **Restart**: Harvey service if needed
5. **Monitor**: Until Harvey fully operational

### If Transcription Fails

1. **Calls work**: Recording still happens
2. **Check API**: Deepgram service status
3. **Verify keys**: Environment variables correct
4. **Retry**: Failed transcriptions manually
5. **Backlog**: Process when service restored

## Success Criteria

✅ **Ready for Production When:**

- All 16 tests pass consistently
- No errors in logs during test runs
- Harvey whispers audible to rep only
- Transcription accuracy > 90%
- Call connection time < 10 seconds
- Database performance acceptable
- Error handling graceful
- Monitoring and alerting working

## Contact Information

**Technical Support:**

- Primary: Development Team
- Secondary: Twilio Support
- Emergency: System Administrator

**Service Dependencies:**

- Twilio Voice: Primary calling service
- Deepgram: Transcription service
- Supabase: Database and storage
- Harvey AI: Coaching service
