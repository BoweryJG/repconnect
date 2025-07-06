# Multi-Rep Harvey Setup Guide

## Step 1: Buy Twilio Numbers

1. Go to [Twilio Console](https://console.twilio.com)
2. Phone Numbers → Buy a Number
3. Buy one number per rep ($1/month each)
4. Choose local area codes for better answer rates

## Step 2: Configure Each Number

For EACH Twilio number:
1. Go to Phone Numbers → Manage → Active Numbers
2. Click on the number
3. Set Voice webhook: `https://osbackend-zl1h.onrender.com/api/twilio/incoming-call`
4. Method: HTTP POST
5. Save

## Step 3: Add Reps to Backend

Edit `/routes/twilioWebhookRoutes.js`:

```javascript
const repConfig = {
  '+18454090692': {
    name: 'Jason',
    forwardTo: '+12015231306',
    harveyStyle: 'quick'
  },
  '+18454090693': {
    name: 'Sarah',
    forwardTo: '+19175551234',
    harveyStyle: 'motivational'
  },
  '+18454090694': {
    name: 'Mike',
    forwardTo: '+13475551234',
    harveyStyle: 'aggressive'
  }
};
```

## Step 4: Harvey Styles per Rep

- `quick`: "Sarah. Sales mode on. Let's go!"
- `motivational`: "You've got this! Time to shine!"
- `aggressive`: "Destroy this call! Close hard!"
- `confidence`: "You're the expert. Show them why!"
- `default`: Full Harvey speeches

## Step 5: Deploy

```bash
git add .
git commit -m "Add multi-rep configuration"
git push
```

## Cost Breakdown

| Item | Cost |
|------|------|
| Phone number | $1/month per rep |
| Incoming call | $0.0085/minute |
| Outbound leg | $0.013/minute |
| Recording | $0.0025/minute |
| **Total per minute** | ~$0.024 |

**Example**: 10 reps, 50 calls/day, 5 min average
- Numbers: $10/month
- Calls: ~$180/month
- **Total: ~$190/month**

## Testing

1. Call each rep's Twilio number
2. Verify correct forwarding
3. Confirm personalized Harvey message
4. Check call recordings

## Advanced Features (Future)

- Dynamic rep assignment based on availability
- Customer-rep matching based on CRM data
- Skill-based routing (technical vs. sales)
- Time-based routing (business hours per rep)