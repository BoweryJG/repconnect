interface VoiceTimeData {
  totalSeconds: number;
  sessions: Array<{
    startTime: number;
    endTime?: number;
    agentId: string;
  }>;
  firstUsed: number;
  lastUsed: number;
}

const VOICE_TIME_KEY = 'repconnect_voice_time';
const MAX_SECONDS = 600; // 10 minutes
const TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

export class VoiceTimeTracker {
  private static instance: VoiceTimeTracker;
  private activeSession: { startTime: number; agentId: string } | null = null;
  private updateInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): VoiceTimeTracker {
    if (!VoiceTimeTracker.instance) {
      VoiceTimeTracker.instance = new VoiceTimeTracker();
    }
    return VoiceTimeTracker.instance;
  }

  private getVoiceTimeData(): VoiceTimeData {
    const stored = localStorage.getItem(VOICE_TIME_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      // Reset if outside time window
      if (Date.now() - data.firstUsed > TIME_WINDOW) {
        return this.createNewVoiceTimeData();
      }
      return data;
    }
    return this.createNewVoiceTimeData();
  }

  private createNewVoiceTimeData(): VoiceTimeData {
    return {
      totalSeconds: 0,
      sessions: [],
      firstUsed: Date.now(),
      lastUsed: Date.now(),
    };
  }

  private saveVoiceTimeData(data: VoiceTimeData): void {
    localStorage.setItem(VOICE_TIME_KEY, JSON.stringify(data));
  }

  startSession(agentId: string): void {
    if (this.activeSession) {
      // End previous session if exists
      this.endSession();
    }

    this.activeSession = {
      startTime: Date.now(),
      agentId,
    };

    // Update time every second during active session
    this.updateInterval = setInterval(() => {
      const data = this.getVoiceTimeData();
      const currentSessionTime = Math.floor((Date.now() - this.activeSession!.startTime) / 1000);

      // Check if we've exceeded the limit
      if (data.totalSeconds + currentSessionTime >= MAX_SECONDS) {
        // Force end the session
        window.dispatchEvent(new CustomEvent('voice-time-exceeded'));
        this.endSession();
      }
    }, 1000);
  }

  endSession(): number {
    if (!this.activeSession) {
      return 0;
    }

    // Clear update interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    const endTime = Date.now();
    const sessionDuration = Math.floor((endTime - this.activeSession.startTime) / 1000);

    const data = this.getVoiceTimeData();
    data.sessions.push({
      startTime: this.activeSession.startTime,
      endTime,
      agentId: this.activeSession.agentId,
    });
    data.totalSeconds += sessionDuration;
    data.lastUsed = endTime;

    this.saveVoiceTimeData(data);
    this.activeSession = null;

    return sessionDuration;
  }

  getRemainingSeconds(): number {
    const data = this.getVoiceTimeData();
    let totalUsed = data.totalSeconds;

    // Add current session time if active
    if (this.activeSession) {
      totalUsed += Math.floor((Date.now() - this.activeSession.startTime) / 1000);
    }

    return Math.max(0, MAX_SECONDS - totalUsed);
  }

  hasTimeRemaining(): boolean {
    return this.getRemainingSeconds() > 0;
  }

  getFormattedTimeRemaining(): string {
    const seconds = this.getRemainingSeconds();
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  isSessionActive(): boolean {
    return this.activeSession !== null;
  }

  reset(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.activeSession = null;
    localStorage.removeItem(VOICE_TIME_KEY);
  }

  getStats(): {
    totalSeconds: number;
    remainingSeconds: number;
    formattedRemaining: string;
    sessionsCount: number;
    isActive: boolean;
  } {
    const data = this.getVoiceTimeData();
    const remaining = this.getRemainingSeconds();

    return {
      totalSeconds: data.totalSeconds,
      remainingSeconds: remaining,
      formattedRemaining: this.getFormattedTimeRemaining(),
      sessionsCount: data.sessions.length,
      isActive: this.isSessionActive(),
    };
  }
}

export const voiceTimeTracker = VoiceTimeTracker.getInstance();
