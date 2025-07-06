# Backend Migration TODO

## Current Netlify Functions to Migrate

### 1. **call-summary.js**
- **Current**: `/.netlify/functions/call-summary`
- **New Backend Route**: `/api/calls/:callSid/summary`
- **Methods**: GET, POST, PUT
- **Sub-routes**: `/regenerate`
- **Updates Made**: 
  - ✅ Changed from OpenRouter to OpenAI API
  - ✅ Updated model to gpt-4-turbo-preview
  - ✅ Updated CallSummaryView.tsx to use backend URL

### 2. **incoming-call.js**
- **Current**: `/.netlify/functions/incoming-call`
- **New Backend Route**: `/api/twilio/incoming-call`
- **Twilio Webhook**: Update in Twilio console to point to backend

### 3. **recording-status.js**
- **Current**: `/.netlify/functions/recording-status`
- **New Backend Route**: `/api/twilio/recording-status`
- **Twilio Webhook**: Update in Twilio console

### 4. **call-status.js**
- **Current**: `/.netlify/functions/call-status`
- **New Backend Route**: `/api/twilio/call-status`
- **Twilio Webhook**: Update in Twilio console

### 5. **twilio-proxy.ts**
- **Status**: Currently unused (USE_PROXY = false in twilioService.ts)
- **Can be deleted**

## Frontend Changes Completed
- ✅ CallSummaryView.tsx - Updated to use BACKEND_URL

## Backend Repository Updates Needed
1. Copy these functions to your backend repo
2. Convert from Netlify function format to Express routes
3. Add the OpenAI API key to backend environment variables
4. Deploy backend changes to Render

## Twilio Console Updates
After backend deployment, update webhooks:
1. Phone Number → Voice → Webhook: `https://osbackend-zl1h.onrender.com/api/twilio/incoming-call`
2. Recording Status Callback: `https://osbackend-zl1h.onrender.com/api/twilio/recording-status`
3. Call Status Callback: `https://osbackend-zl1h.onrender.com/api/twilio/call-status`

## Environment Variables for Backend
- `OPENAI_API_KEY` - Your OpenAI API key
- `SUPABASE_URL` - Already set
- `SUPABASE_SERVICE_KEY` - Already set
- `FORWARD_TO_PHONE` - Phone number to forward calls to