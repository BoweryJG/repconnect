# 🎯 HARVEY SPECTER SALES COACH - PRODUCTION DEPLOYMENT GUIDE

## Quick Start

Harvey is NOW production-ready. Follow these steps to deploy:

### 1. Deploy Database Schema (5 minutes)
```bash
# Go to Supabase Dashboard: https://app.supabase.com
# Select your project: cbopynuvhcymbumjnvay
# Navigate to SQL Editor
# Copy and run the migration from: /home/jgolden/crm/supabase/migrations/20250106_harvey_coaching_schema.sql
```

### 2. Deploy Harvey (2 minutes)
```bash
npm run harvey:deploy
```

### 3. Initialize All Sales Reps (1 minute)
```bash
npm run harvey:init
```

### 4. Start Harvey in Production
```bash
npm run harvey:start
```

### 5. Monitor Harvey Performance
```bash
# In a separate terminal:
npm run harvey:monitor
```

## Production Commands

| Command | Description |
|---------|-------------|
| `npm run harvey:deploy` | Run deployment script |
| `npm run harvey:init` | Initialize Harvey for all reps |
| `npm run harvey:start` | Start Harvey in production |
| `npm run harvey:monitor` | Real-time monitoring dashboard |
| `npm run harvey:test` | Test Harvey functionality |

## API Endpoints

Harvey is available at: `http://localhost:3001/api/harvey/`

- `POST /api/harvey/coach/:repId` - Trigger coaching
- `GET /api/harvey/stats/:repId` - Get rep stats
- `GET /api/harvey/leaderboard` - Get leaderboard
- `POST /api/harvey/challenge/:repId` - Create challenge
- `GET /health` - Health check

## Environment Variables

Already configured in `.env`:
- ✅ MOSHI_API_KEY
- ✅ MOSHI_API_URL  
- ✅ SUPABASE_URL
- ✅ SUPABASE_SERVICE_KEY

## What Harvey Does

1. **Monitors All Sales Reps** - Real-time activity tracking
2. **Voice Coaching** - Calls reps using Moshi AI
3. **Performance Analysis** - Analyzes calls and provides feedback
4. **Daily Challenges** - Motivational targets
5. **Leaderboard** - Gamified competition

## Harvey's Coaching Modes

- **Morning Motivator** - Low activity warnings
- **Post-Call Critic** - Call performance feedback
- **Live Demo Master** - Real-time call assistance
- **Performance Reviewer** - Daily/weekly reviews
- **Closer** - Deal closing assistance

## Monitoring & Logs

Check Harvey's status:
```bash
# View coaching sessions
npm run harvey:monitor

# Check system logs (if using systemd)
sudo journalctl -u harvey-coach -f

# View application logs
tail -f harvey.log
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Harvey not responding | Check MOSHI_API_KEY in .env |
| No reps found | Verify user table has sales_rep role |
| Database errors | Check Supabase migration was run |
| Port conflict | Change HARVEY_PORT in .env |

## Harvey Says

"I don't have dreams, I have goals. Now let's close some deals!"

---

**PRODUCTION STATUS: ✅ READY TO DEPLOY**