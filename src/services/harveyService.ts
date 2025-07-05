// Harvey Frontend Service - API integration for Harvey Syndicate
// This service handles all communication with the Harvey backend

import { io, Socket } from 'socket.io-client';

interface DailyVerdict {
  rating: number;
  message: string;
  timestamp: Date;
  text?: string;
  audio?: string;
  tone?: string;
  advice?: string;
}

interface HarveyMetrics {
  reputationPoints: number;
  currentStreak: number;
  totalCalls: number;
  closingRate: number;
  harveyStatus: 'rookie' | 'closer' | 'partner' | 'legend';
  dailyVerdict: DailyVerdict | null;
  activeTrials: Trial[];
}

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  status: string;
  rank: number;
}

interface HotLead {
  id: string;
  company: string;
  industry: string;
  size: string;
  readyScore: number;
  multiplier: number;
  expiresAt: Date;
  claimedBy?: string;
}

interface Trial {
  id: string;
  name: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';
  participants: number;
  startTime: Date;
  endTime: Date;
  rewards: {
    reputation: number;
    unlock?: string;
  };
}

interface HarveyUpdate {
  type: 'metrics' | 'leaderboard' | 'hotLead' | 'verdict' | 'trial' | 'intervention';
  data: any;
}

class HarveyService {
  private socket: Socket | null = null;
  private baseUrl: string;
  private userId: string;
  private updateCallbacks: ((update: HarveyUpdate) => void)[] = [];
  private metricsCache: HarveyMetrics | null = null;

  constructor() {
    this.baseUrl = process.env.REACT_APP_HARVEY_API_URL || 'https://osbackend-zl1h.onrender.com';
    this.userId = localStorage.getItem('harvey_user_id') || 'demo-user';
  }

  // Initialize socket connection for real-time updates
  private initializeSocket(): void {
    if (this.socket) return;

    this.socket = io(this.baseUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to Harvey real-time updates');
    });

    this.socket.on('harvey-update', (update: HarveyUpdate) => {
      this.handleUpdate(update);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Harvey');
    });
  }

  private handleUpdate(update: HarveyUpdate): void {
    // Update cache if metrics
    if (update.type === 'metrics') {
      this.metricsCache = update.data;
    }

    // Notify all subscribers
    this.updateCallbacks.forEach(callback => callback(update));
  }

  // Subscribe to real-time updates
  subscribeToUpdates(callback: (update: HarveyUpdate) => void): () => void {
    this.updateCallbacks.push(callback);
    this.initializeSocket();

    // Return unsubscribe function
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  // Get current metrics and leaderboard
  async getMetrics(): Promise<{ metrics: HarveyMetrics; leaderboard: LeaderboardEntry[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/harvey/metrics?userId=${this.userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('harvey_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch Harvey metrics');
      }

      const data = await response.json();
      this.metricsCache = data.metrics;
      return data;
    } catch (error) {
      console.error('Error fetching Harvey metrics:', error);
      // Return cached data if available
      return {
        metrics: this.metricsCache || this.getDefaultMetrics(),
        leaderboard: [],
      };
    }
  }

  // Get daily verdict from Harvey
  async getDailyVerdict(): Promise<DailyVerdict> {
    try {
      const response = await fetch(`${this.baseUrl}/api/harvey/verdict?userId=${this.userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('harvey_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get Harvey verdict');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting Harvey verdict:', error);
      return {
        rating: 5,
        message: "You're avoiding me. That tells me everything I need to know.",
        timestamp: new Date(),
      };
    }
  }

  // Claim a hot lead
  async claimHotLead(leadId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/harvey/leads/${leadId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('harvey_token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to claim lead');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error claiming lead:', error);
      return {
        success: false,
        message: error.message || 'Failed to claim lead',
      };
    }
  }

  // Join a trial
  async joinTrial(trialId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/harvey/trials/${trialId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('harvey_token')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to join trial');
      }

      return await response.json();
    } catch (error: any) {
      console.error('Error joining trial:', error);
      return {
        success: false,
        message: error.message || 'Failed to join trial',
      };
    }
  }

  // Submit voice command
  async submitVoiceCommand(command: string): Promise<{ 
    response: string; 
    audio?: string; 
    action?: string; 
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/harvey/voice-command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('harvey_token')}`,
        },
        body: JSON.stringify({ 
          command, 
          userId: this.userId 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process voice command');
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing voice command:', error);
      return {
        response: "I can't process that right now. Check your connection.",
      };
    }
  }

  // Get active trials
  async getActiveTrials(): Promise<Trial[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/harvey/trials/active`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('harvey_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trials');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching trials:', error);
      return [];
    }
  }

  // Submit call performance for Harvey's analysis
  async submitCallPerformance(callData: {
    callId: string;
    duration: number;
    outcome: 'success' | 'failed' | 'follow-up';
    voiceMetrics?: any;
  }): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/harvey/calls/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('harvey_token')}`,
        },
        body: JSON.stringify(callData),
      });
    } catch (error) {
      console.error('Error submitting call performance:', error);
    }
  }

  // Request Harvey intervention
  async requestIntervention(reason: string): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/harvey/intervention`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('harvey_token')}`,
        },
        body: JSON.stringify({ reason }),
      });
    } catch (error) {
      console.error('Error requesting Harvey intervention:', error);
    }
  }

  // Get hot leads
  async getHotLeads(): Promise<HotLead[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/harvey/leads/hot`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('harvey_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hot leads');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching hot leads:', error);
      return [];
    }
  }

  // Challenge Harvey (for special competitions)
  async challengeHarvey(challengeType: string): Promise<{ accepted: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/api/harvey/challenge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('harvey_token')}`,
        },
        body: JSON.stringify({ type: challengeType }),
      });

      if (!response.ok) {
        throw new Error('Failed to challenge Harvey');
      }

      return await response.json();
    } catch (error) {
      console.error('Error challenging Harvey:', error);
      return {
        accepted: false,
        message: "You're not ready to challenge me yet. Close more deals.",
      };
    }
  }

  // Get Harvey's coaching history
  async getCoachingHistory(limit = 10): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/harvey/coaching/history?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('harvey_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch coaching history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching coaching history:', error);
      return [];
    }
  }


  private getDefaultMetrics(): HarveyMetrics {
    return {
      reputationPoints: 0,
      currentStreak: 0,
      totalCalls: 0,
      closingRate: 0,
      harveyStatus: 'rookie',
      dailyVerdict: null,
      activeTrials: [],
    };
  }

  // Update coaching mode
  async updateCoachingMode(mode: 'off' | 'gentle' | 'normal' | 'aggressive' | 'brutal'): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/harvey/coaching/mode`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('harvey_token')}`,
        },
        body: JSON.stringify({ mode }),
      });
    } catch (error) {
      console.error('Error updating coaching mode:', error);
    }
  }

  // Update Harvey modes
  async updateModes(modes: Partial<any>): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/harvey/modes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('harvey_token')}`,
        },
        body: JSON.stringify(modes),
      });
    } catch (error) {
      console.error('Error updating Harvey modes:', error);
    }
  }

  // Clean up resources
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const harveyService = new HarveyService();