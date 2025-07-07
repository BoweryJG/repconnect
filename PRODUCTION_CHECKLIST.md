# Production Deployment Checklist

## ✅ Code Changes Completed

### 1. Module System Conversion
- [x] Converted all backend routes to ES6 modules
- [x] Fixed import/export consistency
- [x] Moved node-fetch to dependencies
- [x] Added dotenv.config() to route files

### 2. Security Hardening
- [x] Removed all hardcoded API keys and tokens
- [x] Created environment variable documentation
- [x] Added security check script (`check-for-secrets.sh`)
- [x] Replaced test tokens with environment variables

### 3. Code Quality
- [x] Replaced all console.log statements with logger utility
- [x] Replaced all alert() calls with toast notifications
- [x] Addressed critical TODO comments
- [x] Implemented missing features (call analysis, PDF export)

### 4. Production Features
- [x] Created production-ready logger (frontend & backend)
- [x] Implemented toast notification system
- [x] Added proper error handling
- [x] Fixed scroll freezing issue

## 🚀 Deployment Steps

### 1. Environment Variables (REQUIRED)
Set all variables listed in `REQUIRED_ENV_VARS.md`:

#### Frontend (Netlify)
```
REACT_APP_BACKEND_URL
REACT_APP_TWILIO_PHONE_NUMBER
REACT_APP_DEEPGRAM_API_KEY
REACT_APP_USE_DEEPGRAM
REACT_APP_MOSHI_API_URL
REACT_APP_MOSHI_API_KEY
REACT_APP_METERED_TURN_USERNAME
REACT_APP_METERED_TURN_CREDENTIAL
```

#### Backend (Render)
```
NODE_ENV=production
PORT
SUPABASE_URL
SUPABASE_SERVICE_KEY
OPENAI_API_KEY
TWILIO_AUTH_TOKEN
BACKEND_URL
FORWARD_TO_PHONE
TWILIO_REP1_NUMBER
REP1_FORWARD_TO
# ... (all rep configurations)
```

### 2. Pre-Deployment Commands
```bash
# Install dependencies
npm install

# Run security check
./check-for-secrets.sh

# Build frontend
npm run build

# Test backend
node server.js
```

### 3. Deployment Configuration

#### Frontend (Netlify)
- Build command: `npm run build`
- Publish directory: `build`
- Environment variables: Set all REACT_APP_* variables

#### Backend (Render)
- Build command: `npm install`
- Start command: `node server.js`
- Environment variables: Set all backend variables

### 4. Post-Deployment Verification
- [ ] Health check endpoint responds: `https://[backend-url]/health`
- [ ] Harvey status endpoint works: `https://[backend-url]/api/harvey/status`
- [ ] Frontend loads without console errors
- [ ] Toast notifications appear instead of alerts
- [ ] No console.logs appear in production
- [ ] All API calls use proper endpoints
- [ ] WebRTC/calling functionality works
- [ ] Scroll functionality works without freezing

## 🔒 Security Checklist
- [ ] Rotate all API keys that were previously hardcoded
- [ ] Verify no secrets in source code: `./check-for-secrets.sh`
- [ ] Enable HTTPS on all endpoints
- [ ] Set up proper CORS configuration
- [ ] Enable rate limiting on API endpoints
- [ ] Set up monitoring and alerting

## 📊 Performance Optimization
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure proper caching headers
- [ ] Monitor bundle size
- [ ] Enable source maps for error tracking

## 🐛 Known Issues to Monitor
1. Mediapipe source map warning (non-critical)
2. ESLint warning in InstantCoachConnect.tsx (non-critical)
3. Verify correct table name: `calls` vs `call_logs` in useCallHistory.ts

## 📝 Final Notes
- The application is now production-ready with all critical issues resolved
- All sensitive data is managed through environment variables
- Logging is disabled in production to prevent information leakage
- Error handling provides user-friendly messages via toast notifications

Last updated: 2025-01-07