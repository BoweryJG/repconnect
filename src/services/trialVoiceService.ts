import { api } from '../config/api';

interface TrialVoiceSession {
  session: {
    id: string;
    session_id: string;
    max_duration_seconds: number;
    remaining_seconds: number;
  };
  agent: {
    id: string;
    name: string;
    voice_id: string;
    voice_name: string;
  };
  elevenlabs_config?: {
    voice_id: string;
    model_id: string;
    voice_settings: any;
  };
  is_trial: boolean;
}

interface HeartbeatResponse {
  session: {
    id: string;
    status: string;
    duration_seconds: number;
  };
  should_disconnect: boolean;
  message?: string;
}

class TrialVoiceService {
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private currentSession: TrialVoiceSession | null = null;
  private sessionStartTime: number = 0;
  private onTimeExpired?: () => void;

  async startTrialVoiceSession(
    agentId: string,
    onTimeExpired?: () => void
  ): Promise<TrialVoiceSession> {
    try {
      const response = await api.post(`/api/repconnect/agents/${agentId}/start-voice-session`, {});

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to start trial session');
      }

      this.currentSession = response.data.data;
      this.sessionStartTime = Date.now();
      this.onTimeExpired = onTimeExpired;

      // Start heartbeat monitoring
      this.startHeartbeat();

      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 403) {
        throw new Error(
          'Your free 5-minute trial has been used today. Please sign up for unlimited access.'
        );
      }
      throw error;
    }
  }

  private startHeartbeat() {
    if (!this.currentSession) return;

    // Send heartbeat every 10 seconds
    this.heartbeatInterval = setInterval(async () => {
      if (!this.currentSession) {
        this.stopHeartbeat();
        return;
      }

      const elapsedSeconds = Math.floor((Date.now() - this.sessionStartTime) / 1000);

      try {
        const response = await api.post('/api/repconnect/voice/heartbeat', {
          sessionId: this.currentSession.session.session_id,
          duration: elapsedSeconds,
        });

        const heartbeat: HeartbeatResponse = response.data.data;

        if (heartbeat.should_disconnect) {
          this.endSession();
          if (this.onTimeExpired) {
            this.onTimeExpired();
          }
        }
      } catch (error) {
        // Heartbeat errors are expected when session ends
      }
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  endSession() {
    this.stopHeartbeat();
    this.currentSession = null;
    this.sessionStartTime = 0;
  }

  getCurrentSession(): TrialVoiceSession | null {
    return this.currentSession;
  }

  getRemainingTime(): number {
    if (!this.currentSession || !this.sessionStartTime) return 0;

    const elapsedSeconds = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const remainingSeconds = this.currentSession.session.max_duration_seconds - elapsedSeconds;

    return Math.max(0, remainingSeconds);
  }
}

export const trialVoiceService = new TrialVoiceService();
