# Harvey AI Integration - Complete Deployment Guide

## 🚀 Overview

Harvey AI is now fully integrated into RepConnect. This guide covers the final deployment steps to get Harvey working in production.

## ✅ What Has Been Completed

### Frontend Integration (RepConnect)
1. **Harvey Core Connection** - WebRTC connection to backend (MOCK_MODE disabled)
2. **Call Integration** - Harvey connects before calls, provides coaching during calls
3. **UI Components** - All Harvey screens implemented:
   - Harvey Syndicate Dashboard (`/harvey`)
   - Call Queue Interface (`/harvey/queue`)
   - Battle Mode (`/harvey/battle`)
   - Performance Metrics (`/harvey/metrics`)
   - War Room (`/harvey/warroom`)
4. **Real-time Features** - WebSocket connections, voice analysis, coaching overlay
5. **Production Security** - All credentials moved to env vars, demo mode disabled

### Backend Support (osbackend on Render)
- Harvey routes at `/api/harvey/*`
- Harvey WebSocket service at `/harvey-ws`
- Voice analysis and coaching endpoints
- Real-time battle mode support
- Metrics and leaderboard tracking

## 🔧 Required Environment Variables

### Frontend (.env.local for local development, Netlify environment variables for production)

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Configuration (Already deployed on Render)
REACT_APP_BACKEND_URL=https://osbackend-zl1h.onrender.com
REACT_APP_HARVEY_API_URL=https://osbackend-zl1h.onrender.com
REACT_APP_HARVEY_WS_URL=wss://osbackend-zl1h.onrender.com/harvey-ws

# Twilio Configuration
REACT_APP_TWILIO_ACCOUNT_SID=your_twilio_account_sid
REACT_APP_TWILIO_AUTH_TOKEN=your_twilio_auth_token
REACT_APP_TWILIO_PHONE_NUMBER=+1234567890
```

### Backend (Already configured on Render - verify these are set)

The backend service `osbackend` on Render should have these environment variables:

```env
# OpenAI/OpenRouter for Harvey's AI
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=openai/gpt-4  # or your preferred model

# Twilio for call integration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Supabase for data storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_service_key

# CORS Configuration
FRONTEND_URL=https://repconnect.netlify.app
```

## 📋 Deployment Steps

### 1. Verify Backend Configuration on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Navigate to the `osbackend` service
3. Go to "Environment" tab
4. Verify all required environment variables are set
5. If missing, add them and save (service will auto-redeploy)

### 2. Deploy Frontend to Netlify

1. **Build the production version:**
   ```bash
   cd /home/jgolden/repconnect
   npm run build
   ```

2. **Deploy to Netlify:**
   
   Option A - Via Netlify CLI:
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=build
   ```
   
   Option B - Via Git:
   ```bash
   git add .
   git commit -m "Complete Harvey AI integration - production ready"
   git push origin main
   ```
   (Netlify will auto-deploy from GitHub)

3. **Configure Environment Variables on Netlify:**
   - Go to Netlify Dashboard
   - Select your site
   - Go to "Site configuration" → "Environment variables"
   - Add all the `REACT_APP_*` variables listed above
   - Deploy → Clear cache and deploy site

### 3. Test Harvey Integration

1. **Test WebSocket Connection:**
   - Open browser console
   - Navigate to `/harvey`
   - Should see: "Harvey WebSocket connection established"
   - No "MOCK_MODE" messages should appear

2. **Test Call Integration:**
   - Make a test call
   - Harvey should connect before the call
   - Coaching overlay should appear during the call
   - Voice metrics should update in real-time

3. **Test War Room:**
   - Navigate to `/harvey/warroom`
   - Active calls should appear in 3D visualization
   - Real-time metrics should update

4. **Test Battle Mode:**
   - Navigate to `/harvey/battle`
   - Challenge another user
   - Real-time scoring should work

## 🐛 Troubleshooting

### Harvey Not Connecting
1. Check browser console for WebSocket errors
2. Verify `REACT_APP_HARVEY_WS_URL` is correct
3. Check backend logs on Render for connection attempts
4. Ensure CORS is configured for your domain

### No Voice During Calls
1. Check microphone permissions
2. Verify Twilio credentials are correct
3. Check browser console for WebRTC errors

### War Room Shows No Calls
1. Verify WebSocket connection to `/war-room` namespace
2. Check that calls are being tracked in the backend
3. Ensure proper event emission from call services

### Performance Issues
1. Check browser performance tab
2. Reduce particle effects in settings
3. Ensure backend has sufficient resources on Render

## 🎯 Production Checklist

- [ ] All environment variables configured on Netlify
- [ ] Backend environment variables verified on Render
- [ ] MOCK_MODE is FALSE in harveyWebRTC.ts
- [ ] Demo mode is FALSE in App.tsx
- [ ] No console.log statements in production code
- [ ] All test files removed
- [ ] CORS configured for production domain
- [ ] SSL certificates active (handled by Netlify/Render)
- [ ] WebSocket connections using WSS (secure)
- [ ] Error boundaries implemented
- [ ] Rate limiting configured
- [ ] Input validation active

## 🚀 Going Live

Once all checks are complete:

1. **Announce to Team:**
   - Harvey AI coaching is live
   - All features are functional
   - Report any issues immediately

2. **Monitor:**
   - Check Render logs for errors
   - Monitor Netlify analytics
   - Watch for WebSocket disconnections
   - Track Harvey usage metrics

3. **Support:**
   - For Harvey issues: Check `/api/harvey/metrics`
   - For call issues: Check Twilio logs
   - For WebSocket issues: Check browser console and backend logs

## 📞 Harvey Features Now Available

1. **Pre-Call Whisper** - Harvey prepares you before each call
2. **Real-Time Coaching** - Live advice during calls
3. **Voice Analysis** - Confidence, pace, tone tracking
4. **Performance Metrics** - Comprehensive dashboard
5. **Battle Mode** - Competitive calling arena
6. **War Room** - Live team monitoring
7. **AI Verdicts** - Daily performance reviews
8. **Call Queue** - Smart lead prioritization

## 🎉 Success Indicators

When properly deployed, you should see:
- Green connection status in Harvey Syndicate
- Real-time voice waveforms during calls
- Live coaching messages appearing
- Metrics updating after each call
- War Room showing active calls
- Battle mode allowing challenges

Harvey is now your team's AI-powered sales coach, ready to transform performance!

---

*"Success isn't just about closing deals. It's about closing them like you own the room."* - Harvey AI