interface UsageData {
  actions: number;
  firstSeen: number;
  lastAction: number;
  features: {
    contactsViewed: number;
    dialerOpened: number;
    callsInitiated: number;
    enrichmentUsed: number;
  };
}

const USAGE_KEY = 'repconnect_demo_usage';
const ACTION_LIMIT = 10; // Free actions before requiring login
const TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

export class UsageTracker {
  private static instance: UsageTracker;

  private constructor() {}

  static getInstance(): UsageTracker {
    if (!UsageTracker.instance) {
      UsageTracker.instance = new UsageTracker();
    }
    return UsageTracker.instance;
  }

  private getUsageData(): UsageData {
    const stored = localStorage.getItem(USAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Reset if outside time window
      if (Date.now() - data.firstSeen > TIME_WINDOW) {
        return this.createNewUsageData();
      }
      return data;
    }
    return this.createNewUsageData();
  }

  private createNewUsageData(): UsageData {
    return {
      actions: 0,
      firstSeen: Date.now(),
      lastAction: Date.now(),
      features: {
        contactsViewed: 0,
        dialerOpened: 0,
        callsInitiated: 0,
        enrichmentUsed: 0,
      },
    };
  }

  private saveUsageData(data: UsageData): void {
    localStorage.setItem(USAGE_KEY, JSON.stringify(data));
  }

  trackAction(action: keyof UsageData['features']): boolean {
    const data = this.getUsageData();
    data.actions++;
    data.lastAction = Date.now();
    data.features[action]++;

    this.saveUsageData(data);

    // Return whether user has exceeded limit
    return data.actions >= ACTION_LIMIT;
  }

  getRemainingActions(): number {
    const data = this.getUsageData();
    return Math.max(0, ACTION_LIMIT - data.actions);
  }

  hasExceededLimit(): boolean {
    const data = this.getUsageData();
    return data.actions >= ACTION_LIMIT;
  }

  getUsageStats(): {
    actions: number;
    remaining: number;
    features: UsageData['features'];
  } {
    const data = this.getUsageData();
    return {
      actions: data.actions,
      remaining: Math.max(0, ACTION_LIMIT - data.actions),
      features: data.features,
    };
  }

  reset(): void {
    localStorage.removeItem(USAGE_KEY);
  }

  // Get anonymous identifier (for analytics)
  getAnonymousId(): string {
    let id = localStorage.getItem('repconnect_anon_id');
    if (!id) {
      id = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('repconnect_anon_id', id);
    }
    return id;
  }
}

export const usageTracker = UsageTracker.getInstance();
