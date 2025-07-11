# Monitoring and Alerting Configuration

This document describes the monitoring and alerting setup for RepConnect, including Sentry integration, health checks, performance monitoring, and alert rules.

## Overview

The monitoring system consists of several components:

1. **Sentry Integration** - Error tracking and performance monitoring for both frontend and backend
2. **Health Checks** - Multiple endpoints for service health monitoring
3. **Performance Monitoring** - Real-time performance metrics and Web Vitals tracking
4. **Alert Rules** - Configurable alerts for various metrics and thresholds

## Configuration Files

### 1. Sentry Configuration

#### Backend (`/src/config/sentry.js`)
- Initializes Sentry for Node.js with error tracking and performance monitoring
- Includes profiling integration for performance analysis
- Filters out non-critical errors and sensitive data
- Configurable sample rates for production vs development

#### Frontend (`/src/config/sentryFrontend.ts`)
- Browser-specific Sentry setup with Web Vitals tracking
- Session replay for debugging (masked for privacy)
- React error boundary integration
- Automatic route tracking for React Router

### 2. Alert Configuration (`/config/monitoring/alerts.json`)

Defines alert rules in categories:

- **Performance Alerts**
  - Slow API response times (>2s)
  - High error rates (>5%)
  - Slow database queries (>1s)

- **Infrastructure Alerts**
  - High CPU usage (>80%)
  - High memory usage (>85%)
  - Low disk space (<10% free)

- **Application Alerts**
  - Service downtime
  - Database connection failures
  - External API failures (Twilio, Harvey AI)

- **Security Alerts**
  - Suspicious activity patterns
  - Rate limit violations
  - Authentication failures

- **Business Alerts**
  - Low call completion rates (<70%)
  - High call drop rates (>15%)

### 3. Performance Configuration (`/config/monitoring/performance.json`)

Defines performance targets and monitoring rules:

- **API Performance Targets**
  - p50: 200ms, p95: 500ms, p99: 1000ms
  - Error rate: <1% (target: 0.1%)

- **Frontend Performance Targets**
  - FCP: 1.5s, LCP: 2.5s, FID: 100ms, CLS: 0.1
  - Bundle size limits

- **Database Performance**
  - Query time limits by complexity
  - Connection pool configuration

### 4. Health Check Configuration (`/config/monitoring/health-checks.json`)

Defines health check endpoints and rules:

- **Endpoints**
  - `/health` - Basic health check
  - `/api/health` - Detailed health with all service checks
  - `/health/live` - Kubernetes liveness probe
  - `/health/ready` - Kubernetes readiness probe
  - `/health/startup` - Startup probe

- **Service Checks**
  - Database connectivity and pool stats
  - External API availability
  - Memory and CPU usage

## Setup Instructions

### 1. Environment Variables

Copy the example environment file and configure:

```bash
cp config/monitoring/sentry.env.example .env
```

Required variables:
- `SENTRY_DSN` - Backend Sentry DSN
- `REACT_APP_SENTRY_DSN` - Frontend Sentry DSN
- `MONITORING_WEBHOOK_URL` - Webhook for alerts
- `MONITORING_ALERT_EMAIL` - Email for critical alerts

### 2. Initialize Monitoring

Backend initialization is automatic when the server starts:
```javascript
// In server.js
import { initializeSentry } from './src/config/sentry.js';
initializeSentry(app);
```

Frontend initialization in your app entry point:
```typescript
// In src/index.tsx or App.tsx
import { initializeMonitoring } from './utils/monitoringSetup';
initializeMonitoring();
```

### 3. Add Health Status Indicator

Include the health status component in your app:
```typescript
import { HealthStatusIndicator } from './components/monitoring/HealthStatusIndicator';

// In your app header or status bar
<HealthStatusIndicator />
```

## Usage

### Tracking Custom Metrics

Backend:
```javascript
import { captureMetric } from './config/sentry.js';
captureMetric('custom.metric', 123, 'millisecond', { tag: 'value' });
```

Frontend:
```typescript
import { reportMetric } from './utils/monitoringSetup';
reportMetric('user.action.duration', 456);
```

### Manual Alerts

```typescript
import { alertManager } from './services/alertingService';
await alertManager.triggerAlert('customAlert', 'metric.name', value);
```

### Performance Tracking

React components:
```typescript
import { usePerformanceTracking } from './utils/performanceMonitor';

function MyComponent() {
  usePerformanceTracking('MyComponent');
  // Component code
}
```

## Monitoring Dashboards

### Grafana Dashboard

Create a new dashboard with these panels:

1. **System Health Overview**
   - Overall health status
   - Service availability grid
   - Active alerts

2. **Performance Metrics**
   - API response times (p50, p95, p99)
   - Error rates by endpoint
   - Database query performance

3. **Infrastructure Metrics**
   - CPU and memory usage
   - Disk usage
   - Network I/O

4. **Business Metrics**
   - Call success rates
   - Active users
   - Harvey AI usage

### Sentry Dashboard

Configure these views in Sentry:

1. **Error Tracking**
   - Error frequency by type
   - User impact analysis
   - Error trends

2. **Performance Monitoring**
   - Transaction overview
   - Web Vitals scores
   - Slow transactions

3. **Release Health**
   - Crash-free rate
   - Adoption rate
   - Session data

## Alert Channels

### Webhook Integration

Alerts are sent to the configured webhook with this payload:
```json
{
  "alert": {
    "id": "string",
    "name": "string",
    "description": "string",
    "severity": "critical|high|warning|info",
    "timestamp": "ISO 8601"
  },
  "metric": {
    "name": "string",
    "value": "number",
    "threshold": "number",
    "duration": "string"
  },
  "metadata": {},
  "source": "repconnect-monitoring"
}
```

### Email Alerts

Configure email alerts with these templates in the alerts.json file. Supports variable substitution.

### Slack Integration

Enable Slack alerts by setting `SLACK_WEBHOOK_URL` and enabling the Slack channel in alerts.json.

## Best Practices

1. **Set Appropriate Thresholds**
   - Start with conservative thresholds
   - Adjust based on baseline metrics
   - Consider business hours vs off-hours

2. **Avoid Alert Fatigue**
   - Use cooldown periods
   - Group related alerts
   - Set appropriate severity levels

3. **Monitor What Matters**
   - Focus on user-impacting metrics
   - Track business KPIs
   - Balance detail with noise

4. **Regular Review**
   - Review alert effectiveness monthly
   - Update thresholds based on trends
   - Remove obsolete alerts

## Troubleshooting

### Common Issues

1. **Sentry not receiving events**
   - Verify DSN is correct
   - Check network connectivity
   - Ensure Sentry SDK is initialized

2. **Health checks failing**
   - Check service dependencies
   - Verify database connections
   - Review timeout settings

3. **Missing performance data**
   - Ensure Performance Observer is supported
   - Check sampling rates
   - Verify metric names

### Debug Mode

Enable debug logging:
```javascript
// Backend
process.env.DEBUG = 'monitoring:*';

// Frontend
localStorage.setItem('debug', 'monitoring:*');
```

## Maintenance

### Regular Tasks

- **Weekly**: Review alert history and adjust thresholds
- **Monthly**: Analyze performance trends and optimize
- **Quarterly**: Update monitoring configuration based on new features
- **Yearly**: Full monitoring system audit