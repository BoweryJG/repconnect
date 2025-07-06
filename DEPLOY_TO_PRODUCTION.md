# 🚀 Deploy to Production - Step by Step

## Prerequisites
- [ ] Access to your backend repository
- [ ] Render account
- [ ] Twilio account
- [ ] OpenAI API key

## Step 1: Run Migration Script

```bash
# If your backend repo is in a different location, set the path:
export BACKEND_REPO_PATH=/path/to/your/backend

# Run the migration
node backend-migration.js
```

This creates:
- Route files in your backend
- Integration instructions
- Environment variable templates

## Step 2: Update Your Backend

```bash
cd ../osbackend  # or your backend path

# Install new dependencies
npm install twilio node-fetch

# Check the generated files
cat server-update.js  # Integration instructions
cat DEPLOYMENT_CHECKLIST.md  # Full checklist
```

Add routes to your main server file:
```javascript
// Import new routes
const callSummaryRoutes = require('./routes/callSummaryRoutes');
const twilioWebhookRoutes = require('./routes/twilioWebhookRoutes');

// Use routes
app.use(callSummaryRoutes);
app.use(twilioWebhookRoutes);
```

## Step 3: Update Render Environment Variables

Go to [Render Dashboard](https://dashboard.render.com) → Your Service → Environment

Add these variables:
```
OPENAI_API_KEY=sk-...your-key...
TWILIO_AUTH_TOKEN=your-auth-token
FORWARD_TO_PHONE=+1234567890
BACKEND_URL=https://osbackend-zl1h.onrender.com
```

## Step 4: Deploy Backend

```bash
git add .
git commit -m "Add call summary and Twilio webhook routes"
git push origin main
```

Wait for Render to deploy (usually 2-3 minutes).

## Step 5: Update Twilio Webhooks

1. Go to [Twilio Console](https://console.twilio.com)
2. Phone Numbers → Manage → Your Number
3. Voice & Fax section:
   - "A call comes in" Webhook: `https://osbackend-zl1h.onrender.com/api/twilio/incoming-call`
   - Method: HTTP POST
4. Save

## Step 6: Deploy Harvey (Optional)

If deploying Harvey separately:

1. Create new Background Worker on Render
2. Connect same GitHub repo
3. Start Command: `node startHarvey.js`
4. Add Harvey environment variables (see PRODUCTION_ENV_VARS.md)

## Step 7: Test Everything

1. **Test Call Flow**:
   ```bash
   # Call your Twilio number
   # Should forward to FORWARD_TO_PHONE
   # Check Render logs for webhook activity
   ```

2. **Test Call Summary**:
   ```bash
   # In browser console on your app:
   fetch('https://osbackend-zl1h.onrender.com/api/calls/test/summary')
   ```

3. **Check Harvey** (if deployed):
   ```bash
   curl https://harvey-coach.onrender.com/health
   ```

## Step 8: Monitor

- Render Logs: Check for any errors
- Twilio Console: Monitor call logs
- Supabase: Verify data is being saved

## Troubleshooting

**Calls not forwarding?**
- Check FORWARD_TO_PHONE is set correctly
- Verify Twilio webhook URL is correct
- Check Render logs for errors

**Call summaries failing?**
- Verify OPENAI_API_KEY is set
- Check OpenAI API quota/billing
- Look for errors in Render logs

**Harvey not responding?**
- Check Harvey service is running
- Verify all Harvey env vars are set
- Check Supabase connection

## 🎉 Success Checklist

- [ ] Backend deployed with new routes
- [ ] Environment variables configured
- [ ] Twilio webhooks updated
- [ ] Test call completed successfully
- [ ] Call summary generation working
- [ ] Harvey deployed (optional)

---

**Need help?** Check the logs in Render dashboard or Twilio console for detailed error messages.