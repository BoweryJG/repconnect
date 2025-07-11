import * as Sentry from '@sentry/node';
import logger from '../../utils/logger.js';
import alertConfig from '../../config/monitoring/alerts.json';

interface Alert {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'warning' | 'info';
  timestamp: Date;
  metric: string;
  value: number;
  threshold: number;
  duration: string;
  metadata?: Record<string, any>;
}

interface AlertChannel {
  send(alert: Alert): Promise<void>;
}

/**
 * Sentry Alert Channel
 */
class SentryAlertChannel implements AlertChannel {
  async send(alert: Alert): Promise<void> {
    try {
      Sentry.captureMessage(alert.description, alert.severity as Sentry.SeverityLevel);

      // Add breadcrumb for tracking
      Sentry.addBreadcrumb({
        category: 'alert',
        message: alert.name,
        level: alert.severity as Sentry.SeverityLevel,
        data: {
          metric: alert.metric,
          value: alert.value,
          threshold: alert.threshold,
        },
      });

      // Set context
      Sentry.setContext('alert', {
        id: alert.id,
        name: alert.name,
        metric: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        duration: alert.duration,
      });
    } catch (error) {
      logger.error('Failed to send Sentry alert:', error);
    }
  }
}

/**
 * Webhook Alert Channel
 */
class WebhookAlertChannel implements AlertChannel {
  private webhookUrl: string;
  private headers: Record<string, string>;
  private retries: number;
  private timeout: number;

  constructor(config: any) {
    this.webhookUrl = config.url;
    this.headers = config.headers || {};
    this.retries = config.retries || 3;
    this.timeout = config.timeout || 5000;
  }

  async send(alert: Alert): Promise<void> {
    const payload = {
      alert: {
        id: alert.id,
        name: alert.name,
        description: alert.description,
        severity: alert.severity,
        timestamp: alert.timestamp.toISOString(),
      },
      metric: {
        name: alert.metric,
        value: alert.value,
        threshold: alert.threshold,
        duration: alert.duration,
      },
      metadata: alert.metadata || {},
      source: 'repconnect-monitoring',
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.headers,
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Webhook failed with status: ${response.status}`);
        }

        logger.info(`Alert sent to webhook: ${alert.name}`);
        return;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Webhook alert attempt ${attempt + 1} failed:`, error);

        if (attempt < this.retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    logger.error('Failed to send webhook alert after all retries:', lastError);
  }
}

/**
 * Email Alert Channel
 */
class EmailAlertChannel implements AlertChannel {
  private recipients: string[];
  private from: string;
  private templates: any;

  constructor(config: any) {
    this.recipients = config.recipients || [];
    this.from = config.from;
    this.templates = config.templates;
  }

  async send(alert: Alert): Promise<void> {
    try {
      // In a real implementation, this would use an email service
      // For now, we'll log the email that would be sent
      const subject = this.templates.subject
        .replace('{{severity}}', alert.severity.toUpperCase())
        .replace('{{alert.name}}', alert.name);

      const body = this.templates.body
        .replace('{{alert.description}}', alert.description)
        .replace('{{metric}}', alert.metric)
        .replace('{{value}}', alert.value.toString())
        .replace('{{threshold}}', alert.threshold.toString())
        .replace('{{duration}}', alert.duration)
        .replace('{{timestamp}}', alert.timestamp.toISOString())
        .replace(
          '{{dashboard_url}}',
          process.env.DASHBOARD_URL || 'https://app.repconnect.com/dashboard'
        );

      logger.info('Email alert would be sent:', {
        to: this.recipients,
        from: this.from,
        subject,
        preview: body.substring(0, 100) + '...',
      });

      // TODO: Implement actual email sending using SendGrid, AWS SES, etc.
    } catch (error) {
      logger.error('Failed to send email alert:', error);
    }
  }
}

/**
 * Alert Manager Service
 */
export class AlertManager {
  private channels: Map<string, AlertChannel> = new Map();
  private alertHistory: Map<string, Alert[]> = new Map();
  private cooldowns: Map<string, Date> = new Map();
  private config: typeof alertConfig;

  constructor() {
    this.config = alertConfig;
    this.initializeChannels();
  }

  /**
   * Initialize alert channels
   */
  private initializeChannels(): void {
    const channelConfigs = this.config.channels;

    if (channelConfigs.sentry.enabled) {
      this.channels.set('sentry', new SentryAlertChannel());
    }

    if (channelConfigs.webhook.enabled && process.env.MONITORING_WEBHOOK_URL) {
      this.channels.set(
        'webhook',
        new WebhookAlertChannel({
          ...channelConfigs.webhook.config,
          url: process.env.MONITORING_WEBHOOK_URL,
        })
      );
    }

    if (channelConfigs.email.enabled && process.env.MONITORING_ALERT_EMAIL) {
      this.channels.set(
        'email',
        new EmailAlertChannel({
          ...channelConfigs.email.config,
          recipients: [process.env.MONITORING_ALERT_EMAIL],
        })
      );
    }
  }

  /**
   * Trigger an alert
   */
  async triggerAlert(
    alertKey: string,
    metric: string,
    value: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Find alert configuration
    let alertConfig: any = null;
    let category: string = '';

    for (const [cat, alerts] of Object.entries(this.config.alerts)) {
      if (alerts[alertKey]) {
        alertConfig = alerts[alertKey];
        category = cat;
        break;
      }
    }

    if (!alertConfig || !alertConfig.enabled) {
      return;
    }

    // Check cooldown
    const cooldownKey = `${category}.${alertKey}`;
    const lastAlert = this.cooldowns.get(cooldownKey);
    if (lastAlert) {
      const cooldownMs = this.parseDuration(alertConfig.cooldown);
      if (Date.now() - lastAlert.getTime() < cooldownMs) {
        logger.debug(`Alert ${alertKey} is in cooldown period`);
        return;
      }
    }

    // Create alert object
    const alert: Alert = {
      id: `${cooldownKey}-${Date.now()}`,
      name: alertConfig.name,
      description: alertConfig.description,
      severity: alertConfig.severity,
      timestamp: new Date(),
      metric,
      value,
      threshold: alertConfig.conditions.threshold || 0,
      duration: alertConfig.conditions.duration,
      metadata,
    };

    // Store in history
    if (!this.alertHistory.has(cooldownKey)) {
      this.alertHistory.set(cooldownKey, []);
    }
    this.alertHistory.get(cooldownKey)!.push(alert);

    // Send to configured channels
    const channelPromises = alertConfig.channels.map((channelName: string) => {
      const channel = this.channels.get(channelName);
      if (channel) {
        return channel.send(alert);
      }
      return Promise.resolve();
    });

    await Promise.allSettled(channelPromises);

    // Update cooldown
    this.cooldowns.set(cooldownKey, new Date());

    logger.warn(`Alert triggered: ${alert.name} (${alert.severity})`, {
      metric,
      value,
      threshold: alert.threshold,
    });
  }

  /**
   * Check metric against alert conditions
   */
  async checkMetric(metric: string, value: number, tags?: Record<string, string>): Promise<void> {
    // Find all alerts that monitor this metric
    for (const [category, alerts] of Object.entries(this.config.alerts)) {
      for (const [alertKey, alertConfig] of Object.entries(alerts)) {
        if (alertConfig.conditions.metric === metric && alertConfig.enabled) {
          const shouldTrigger = this.evaluateCondition(
            value,
            alertConfig.conditions.operator,
            alertConfig.conditions.threshold || alertConfig.conditions.value
          );

          if (shouldTrigger) {
            await this.triggerAlert(alertKey, metric, value, tags);
          }
        }
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(
    value: number | string,
    operator: string,
    threshold: number | string
  ): boolean {
    switch (operator) {
      case 'greater_than':
        return Number(value) > Number(threshold);
      case 'less_than':
        return Number(value) < Number(threshold);
      case 'equals':
        return value === threshold;
      case 'not_equals':
        return value !== threshold;
      case 'greater_than_or_equal':
        return Number(value) >= Number(threshold);
      case 'less_than_or_equal':
        return Number(value) <= Number(threshold);
      default:
        return false;
    }
  }

  /**
   * Parse duration string to milliseconds
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smh])$/);
    if (!match) return 60000; // Default 1 minute

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      default:
        return 60000;
    }
  }

  /**
   * Get alert history
   */
  getAlertHistory(alertKey?: string, limit: number = 100): Alert[] {
    if (alertKey) {
      return this.alertHistory.get(alertKey)?.slice(-limit) || [];
    }

    // Return all alerts sorted by timestamp
    const allAlerts: Alert[] = [];
    for (const alerts of this.alertHistory.values()) {
      allAlerts.push(...alerts);
    }

    return allAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }

  /**
   * Clear alert history
   */
  clearHistory(olderThan?: Date): void {
    if (olderThan) {
      for (const [key, alerts] of this.alertHistory.entries()) {
        const filtered = alerts.filter((alert) => alert.timestamp > olderThan);
        if (filtered.length > 0) {
          this.alertHistory.set(key, filtered);
        } else {
          this.alertHistory.delete(key);
        }
      }
    } else {
      this.alertHistory.clear();
    }
  }
}

// Export singleton instance
export const alertManager = new AlertManager();

export default {
  AlertManager,
  alertManager,
};
