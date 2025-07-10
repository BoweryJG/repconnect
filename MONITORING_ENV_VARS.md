# Monitoring and Error Tracking Environment Variables

Add the following environment variables to your `.env` file:

## Sentry Configuration
```bash
# Sentry DSN for error tracking (get from https://sentry.io)
SENTRY_DSN=your_sentry_dsn_here

# Optional: Sentry release tracking
SENTRY_RELEASE=repconnect@1.0.0

# Optional: Environment name for Sentry
SENTRY_ENVIRONMENT=development
```

## Monitoring Configuration
```bash
# Optional: Webhook URL for monitoring alerts
MONITORING_WEBHOOK_URL=https://your-webhook-url.com/alerts

# Optional: Email for monitoring alerts
MONITORING_ALERT_EMAIL=alerts@example.com
```

## Rate Limiting Configuration
```bash
# Optional: Override default rate limits
RATE_LIMIT_WINDOW_MS=60000  # 1 minute in milliseconds
RATE_LIMIT_MAX_REQUESTS=100  # Max requests per window
```

## Example .env additions:
```bash
# Error Tracking
SENTRY_DSN=https://your-key@sentry.io/your-project-id
SENTRY_ENVIRONMENT=production

# Monitoring
MONITORING_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

## Getting Started

1. Sign up for a free Sentry account at https://sentry.io
2. Create a new project for Node.js
3. Copy the DSN from your project settings
4. Add the DSN to your .env file
5. Restart your server

## Testing

You can test the setup by:

1. Checking health endpoints:
   - Basic: `http://localhost:3001/health`
   - Detailed: `http://localhost:3001/api/health`
   - Metrics: `http://localhost:3001/health/metrics`
   - Database: `http://localhost:3001/health/database`

2. Testing rate limiting:
   - Make more than 100 requests in a minute to see rate limiting in action

3. Checking error tracking:
   - Errors will automatically be sent to Sentry
   - View them in your Sentry dashboard

## Monitoring Features

- **Error Tracking**: Automatic error capture and reporting via Sentry
- **Performance Monitoring**: Response time tracking for all API endpoints
- **Health Checks**: System, database, memory, and CPU health monitoring
- **Rate Limiting**: Configurable per-IP rate limiting (default: 100 req/min)
- **Metrics Collection**: System metrics collected every 5 minutes
- **Alert System**: Configurable alerts for high CPU, memory, or error rates

## Dashboard URLs

Once configured, you can access:
- Sentry Dashboard: https://sentry.io (login required)
- Health Status: http://localhost:3001/api/health
- Metrics: http://localhost:3001/health/metrics