# Call Forwarding Setup Guide 📞

This guide will help you set up call forwarding so that calls to your Twilio number ring on your personal phone.

## Prerequisites
- Twilio account with phone number
- Your Twilio credentials already configured

## Step 1: Add Your Phone Number to Netlify

1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your `repconnect` site
3. Go to **Site configuration** → **Environment variables**
4. Add a new variable:
   - **Key**: `FORWARD_TO_PHONE`
   - **Value**: `+1XXXXXXXXXX` (your phone number with country code)
   - Example: `+14155551234`

## Step 2: Configure Twilio Phone Number

1. Log into your Twilio Console: https://console.twilio.com
2. Go to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on your phone number
4. In the **Voice Configuration** section:
   - **Configure with**: Webhooks, TwiML Bins, Functions, Studio, or Proxy
   - **A call comes in**: Webhook
   - **URL**: `https://repconnect.netlify.app/.netlify/functions/incoming-call`
   - **HTTP Method**: POST
5. Click **Save Configuration**

## Step 3: Test Your Setup

1. Call your Twilio phone number from any phone
2. You should hear: "Thank you for calling RepConnect. Connecting you now."
3. Your personal phone should ring with the Twilio number as the caller ID
4. Answer the call to complete the connection

## How It Works

When someone calls your Twilio number:
1. Twilio sends a webhook to your Netlify function
2. The function returns TwiML instructions to forward the call
3. **The call is automatically recorded** (both sides)
4. Twilio forwards the call to your personal phone
5. You see the Twilio number as caller ID (so you know it's a business call)
6. After the call, the recording URL is saved to your database

## Optional Features

### Custom Greeting
Edit the greeting message in `/netlify/functions/incoming-call.js`:
```javascript
twiml.say({
  voice: 'alice'
}, 'Your custom greeting here.');
```

### Call Screening
You can add call screening by modifying the dial options:
```javascript
const dial = twiml.dial({
  callerId: To,
  timeout: 30,
  screenCall: true, // Enables call screening
});
```

### Multiple Phone Numbers
To ring multiple phones simultaneously:
```javascript
dial.number('+14155551234');
dial.number('+14155555678');
```

## Troubleshooting

1. **No incoming calls**: Check that your Twilio webhook URL is correct
2. **Call fails immediately**: Verify FORWARD_TO_PHONE is set in Netlify
3. **Wrong caller ID**: The caller will see your Twilio number, not the original caller

## Call Recording Features

### Automatic Recording
- All forwarded calls are automatically recorded
- Both sides of the conversation are captured
- Recordings are stored securely by Twilio
- Recording URLs are saved to your database

### Accessing Recordings
1. **In Twilio Console**: 
   - Go to Monitor → Logs → Recordings
   - Download MP3 or WAV files
   
2. **In Your Database** (if Supabase is configured):
   - Recording URLs are saved in `call_recordings` table
   - Linked to call records with duration, caller info, etc.

3. **Via API**: 
   - Use recording URLs from database
   - Twilio keeps recordings for 90 days by default

### Privacy & Compliance
- **Important**: Check local laws about call recording
- Some states/countries require consent from all parties
- Consider adding to greeting: "This call may be recorded for quality purposes"

### To Disable Recording
If you don't want recordings, remove this line from `incoming-call.js`:
```javascript
record: 'record-from-answer-dual',
```

## Costs

- Incoming calls to Twilio number: ~$0.0085/minute
- Outbound call to your phone: ~$0.013/minute
- Call recording: ~$0.0025/minute
- Total: ~$0.024/minute for forwarded & recorded calls

## Need Help?

Check the function logs in Netlify:
1. Go to **Functions** tab in Netlify
2. Click on `incoming-call` function
3. View real-time logs for debugging