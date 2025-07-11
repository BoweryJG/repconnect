# Production Deployment Checklist

## Pre-Deployment Checks

### 1. Code Quality & Testing
- [ ] All tests passing: `npm test`
- [ ] Test coverage report reviewed: `npm test -- --coverage`
- [ ] No TypeScript errors: `npm run build` completes without errors
- [ ] ESLint warnings reviewed (non-critical warnings are acceptable)
- [ ] Security audit passed: `./check-for-secrets.sh` shows no hardcoded secrets
- [ ] Production readiness check: `./check-production.sh` passes

### 2. Environment Variables Verification
#### Frontend (.env.production)
- [ ] `REACT_APP_SUPABASE_URL` - Verified correct production URL
- [ ] `REACT_APP_SUPABASE_ANON_KEY` - Production anon key (not service key)
- [ ] `REACT_APP_BACKEND_URL` - Points to production backend
- [ ] `REACT_APP_HARVEY_API_URL` - Production Harvey API endpoint
- [ ] `REACT_APP_HARVEY_WS_URL` - Production WebSocket URL
- [ ] `REACT_APP_TWILIO_PHONE_NUMBER` - Main production number
- [ ] `REACT_APP_DEEPGRAM_API_KEY` - Production API key
- [ ] `REACT_APP_MOSHI_API_URL` - Production Moshi endpoint
- [ ] `REACT_APP_METERED_TURN_USERNAME` - TURN server credentials
- [ ] `REACT_APP_METERED_TURN_CREDENTIAL` - TURN server credentials

#### Backend (Render Environment)
- [ ] `NODE_ENV=production` - Explicitly set
- [ ] `PORT` - Correct port configured
- [ ] `SUPABASE_URL` - Production database URL
- [ ] `SUPABASE_SERVICE_KEY` - Service role key (secure storage)
- [ ] `OPENAI_API_KEY` - Valid API key with sufficient credits
- [ ] `TWILIO_ACCOUNT_SID` - Production account
- [ ] `TWILIO_AUTH_TOKEN` - Production auth token
- [ ] `DEEPGRAM_API_KEY` - Production key
- [ ] `SENTRY_DSN` - Production Sentry project
- [ ] `BACKEND_URL` - Self-referential URL correct
- [ ] `FORWARD_TO_PHONE` - Default forwarding number
- [ ] Rep-specific variables (`TWILIO_REP{N}_NUMBER`, `REP{N}_FORWARD_TO`) - All configured

### 3. Database Preparation
- [ ] Database backup created: `pg_dump` or Supabase dashboard
- [ ] RLS policies reviewed for all tables
- [ ] Database migrations applied and verified
- [ ] Test data removed from production tables
- [ ] Indexes optimized for production queries

### 4. External Service Configuration
- [ ] Twilio webhook URLs updated to production backend
- [ ] Twilio phone numbers verified and active
- [ ] OpenAI API rate limits checked
- [ ] Deepgram API quota sufficient
- [ ] ElevenLabs voice credits available
- [ ] Sentry project configured for production alerts

### 5. Infrastructure Readiness
- [ ] Netlify build settings verified
- [ ] Render service configuration reviewed
- [ ] DNS records properly configured
- [ ] SSL certificates valid and not expiring soon
- [ ] CDN cache rules configured

## Deployment Steps

### Phase 1: Backend Deployment (Render)

1. **Prepare Backend**
   - [ ] Commit all changes: `git add . && git commit -m "Prepare for production deployment"`
   - [ ] Push to main branch: `git push origin main`
   - [ ] Tag release: `git tag -a v1.x.x -m "Release version 1.x.x"`

2. **Deploy to Render**
   - [ ] Trigger manual deploy in Render dashboard
   - [ ] Monitor build logs for errors
   - [ ] Wait for "Deploy live" status
   - [ ] Check health endpoint: `curl https://your-backend.onrender.com/health`

3. **Verify Backend Services**
   - [ ] Test `/api/health` returns 200
   - [ ] Check `/health/metrics` for system status
   - [ ] Verify Sentry is receiving events
   - [ ] Test rate limiting is active

### Phase 2: Harvey AI Service Deployment

1. **Deploy Harvey Service**
   ```bash
   npm run harvey:deploy
   ```
   - [ ] Deployment script completes without errors
   - [ ] Service logs show successful startup

2. **Initialize Harvey Instances**
   ```bash
   npm run harvey:init
   ```
   - [ ] All representative instances initialized
   - [ ] Voice configurations loaded
   - [ ] WebSocket connections established

3. **Start Harvey Service**
   ```bash
   npm run harvey:start
   ```
   - [ ] Service running without errors
   - [ ] Monitor initial performance: `npm run harvey:monitor`

### Phase 3: Frontend Deployment (Netlify)

1. **Build Frontend**
   ```bash
   CI=false GENERATE_SOURCEMAP=false npm run build
   ```
   - [ ] Build completes successfully
   - [ ] Bundle size under 1MB gzipped (current: ~613KB)
   - [ ] No critical warnings

2. **Deploy to Netlify**
   - [ ] Push to main branch triggers auto-deploy
   - [ ] Monitor Netlify deploy logs
   - [ ] Wait for "Published" status
   - [ ] Preview deploy before promoting to production

3. **Clear CDN Cache**
   - [ ] Purge Netlify cache
   - [ ] Clear any CloudFlare cache if applicable
   - [ ] Force refresh browser cache

## Post-Deployment Verification

### 1. Core Functionality Tests
- [ ] Login flow works (test with multiple accounts)
- [ ] Session refresh occurs at 15-minute intervals
- [ ] CSRF protection active on state-changing requests
- [ ] Cookie-based auth working (check httpOnly cookies)

### 2. Application Features
- [ ] Main CRM (`/`) - Contact grid loads, filtering works
- [ ] Harvey Syndicate (`/harvey`) - AI coach interface responsive
- [ ] War Room (`/harvey/warroom`) - 3D visualization renders
- [ ] Lead Enrichment (`/enrich`) - AI enrichment functional

### 3. Real-time Features
- [ ] WebSocket connections establish
- [ ] Live transcription working (test call)
- [ ] Voice metrics updating in real-time
- [ ] Harvey battles synchronize between users

### 4. External Integrations
- [ ] Make test call to each rep's Twilio number
- [ ] Verify call forwards correctly
- [ ] Check Deepgram transcription accuracy
- [ ] Test Harvey's voice responses
- [ ] Verify OpenAI responses are contextual

### 5. Performance Checks
- [ ] Page load time < 3 seconds
- [ ] Time to Interactive < 5 seconds
- [ ] No memory leaks in War Room 3D view
- [ ] API response times < 500ms
- [ ] WebRTC connection stable

### 6. Monitoring Setup
- [ ] Sentry receiving frontend errors
- [ ] Sentry performance monitoring active
- [ ] Backend health checks passing
- [ ] Harvey service metrics collecting
- [ ] Database query performance acceptable

## Rollback Procedures

### Immediate Rollback (< 5 minutes)
1. **Frontend Rollback**
   - [ ] In Netlify: Deploy → Select previous deploy → Publish deploy
   - [ ] Verify rollback with version check

2. **Backend Rollback**
   - [ ] In Render: Manual deploy → Select previous commit
   - [ ] Monitor rollback completion
   - [ ] Verify API version endpoint

### Database Rollback
1. **Minor Issues**
   - [ ] Restore from automatic Supabase backup
   - [ ] Apply reverse migrations if available

2. **Critical Issues**
   - [ ] Stop all services
   - [ ] Restore from manual backup created pre-deployment
   - [ ] Verify data integrity
   - [ ] Restart services

### Harvey Service Rollback
```bash
# Stop current service
npm run harvey:stop

# Checkout previous version
git checkout tags/v-previous

# Redeploy
npm run harvey:deploy
npm run harvey:init
npm run harvey:start
```

## Emergency Contacts

### Primary Contacts
- **DevOps Lead**: [Name] - [Phone] - [Email]
- **Backend Engineer**: [Name] - [Phone] - [Email]
- **Frontend Engineer**: [Name] - [Phone] - [Email]
- **Database Admin**: [Name] - [Phone] - [Email]

### Service Providers
- **Netlify Support**: support@netlify.com
- **Render Support**: https://render.com/support
- **Supabase Support**: support@supabase.io
- **Twilio Support**: +1-415-390-2337
- **Sentry Status**: https://status.sentry.io

### Escalation Path
1. Engineering on-call
2. Team lead
3. CTO/VP Engineering
4. External service support

## Common Issues & Solutions

### Frontend Issues
- **Blank page**: Check browser console, verify env vars, clear cache
- **API connection failed**: Verify BACKEND_URL, check CORS settings
- **WebSocket errors**: Check HARVEY_WS_URL, verify SSL certificates

### Backend Issues
- **Health check failing**: Check logs, verify database connection
- **Rate limit errors**: Adjust limits or add IP to whitelist
- **Memory issues**: Scale Render instance, optimize queries

### Harvey/AI Issues
- **No voice response**: Check OpenAI/ElevenLabs credits
- **Transcription failing**: Verify Deepgram API key and quota
- **WebRTC connection issues**: Check TURN server credentials

### Database Issues
- **Connection pool exhausted**: Scale database, optimize connections
- **RLS policy errors**: Review and update policies
- **Slow queries**: Check indexes, analyze query plans

## Final Checklist

### Before Going Live
- [ ] All pre-deployment checks completed
- [ ] Deployment steps executed successfully
- [ ] Post-deployment verification passed
- [ ] Team notified of deployment status
- [ ] Monitoring dashboards open
- [ ] Emergency contacts available

### After Going Live
- [ ] Monitor for first 30 minutes
- [ ] Check error rates in Sentry
- [ ] Review user feedback channels
- [ ] Document any issues encountered
- [ ] Update runbook with learnings
- [ ] Schedule post-mortem if needed

## Sign-off

- [ ] **Engineering Lead**: _________________ Date: _______
- [ ] **QA Lead**: _________________ Date: _______
- [ ] **Product Owner**: _________________ Date: _______
- [ ] **Operations**: _________________ Date: _______

---

**Last Updated**: [Current Date]
**Version**: 1.0
**Next Review**: [Date + 3 months]