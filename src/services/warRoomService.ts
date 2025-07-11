// War Room Service - Real-time call monitoring and battle mode management
import { io, Socket } from 'socket.io-client';
import { harveyService } from './harveyService';

export interface WarRoomCall {
  id: string;
  repName: string;
  repId: string;
  customerName: string;
  phoneNumber: string;
  startTime: Date;
  duration: number;
  status: 'connecting' | 'active' | 'ending' | 'ended';
  confidence: number;
  sentiment: number;
  voiceMetrics: {
    pace: 'slow' | 'normal' | 'fast';
    tone: 'nervous' | 'confident' | 'aggressive' | 'uncertain';
    volume: number;
    talkRatio: number; // 0-100, percentage of time rep is talking
  };
  spectators: string[];
  harveyAdvice?: string;
  harveyScore?: number; // Harvey's real-time performance score
  callMetrics?: {
    objectionCount: number;
    questionCount: number;
    positiveKeywords: number;
    negativeKeywords: number;
    closingAttempts: number;
  };
}

export interface BattleMode {
  id: string;
  active: boolean;
  rep1: WarRoomCall | null;
  rep2: WarRoomCall | null;
  scores: {
    rep1: number;
    rep2: number;
  };
  spectatorCount: number;
  startTime?: Date;
  winner?: string;
}

export interface TeamStats {
  totalActive: number;
  avgConfidence: number;
  successRate: number;
  hotStreak: number;
  topPerformer?: {
    name: string;
    score: number;
  };
  battleWins: number;
  battleLosses: number;
}

class WarRoomService {
  private socket: Socket | null = null;
  private activeCalls: Map<string, WarRoomCall> = new Map();
  private battleModes: Map<string, BattleMode> = new Map();
  private listeners: {
    onCallUpdate: ((call: WarRoomCall) => void)[];
    onCallStart: ((call: WarRoomCall) => void)[];
    onCallEnd: ((callId: string) => void)[];
    onBattleUpdate: ((battle: BattleMode) => void)[];
    onStatsUpdate: ((stats: TeamStats) => void)[];
  } = {
    onCallUpdate: [],
    onCallStart: [],
    onCallEnd: [],
    onBattleUpdate: [],
    onStatsUpdate: [],
  };
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_BACKEND_URL || 'https://osbackend-zl1h.onrender.com';
  }

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(`${this.baseUrl}/war-room`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        userId: localStorage.getItem('harvey_user_id'),
        token: localStorage.getItem('harvey_token'),
      },
    });

    this.socket.on('connect', () => {
      this.requestActiveCalls();
    });

    this.socket.on('call:started', (data: any) => {
      const call = this.createCallFromData(data);
      this.activeCalls.set(call.id, call);
      this.notifyCallStart(call);
    });

    this.socket.on('call:updated', (data: any) => {
      const existing = this.activeCalls.get(data.id);
      if (existing) {
        const updated = { ...existing, ...data };
        this.activeCalls.set(data.id, updated);
        this.notifyCallUpdate(updated);
      }
    });

    this.socket.on('call:ended', (data: { callId: string; outcome: any }) => {
      this.activeCalls.delete(data.callId);
      this.notifyCallEnd(data.callId);
    });

    this.socket.on('voice:analysis', (data: any) => {
      const call = this.activeCalls.get(data.callId);
      if (call) {
        call.voiceMetrics = data.metrics;
        call.confidence = data.confidence;
        call.sentiment = data.sentiment;
        this.notifyCallUpdate(call);
      }
    });

    this.socket.on('harvey:advice', (data: { callId: string; advice: string; score: number }) => {
      const call = this.activeCalls.get(data.callId);
      if (call) {
        call.harveyAdvice = data.advice;
        call.harveyScore = data.score;
        this.notifyCallUpdate(call);
      }
    });

    this.socket.on('spectator:update', (data: { callId: string; spectators: string[] }) => {
      const call = this.activeCalls.get(data.callId);
      if (call) {
        call.spectators = data.spectators;
        this.notifyCallUpdate(call);
      }
    });

    this.socket.on('battle:started', (battle: BattleMode) => {
      this.battleModes.set(battle.id, battle);
      this.notifyBattleUpdate(battle);
    });

    this.socket.on('battle:updated', (battle: BattleMode) => {
      this.battleModes.set(battle.id, battle);
      this.notifyBattleUpdate(battle);
    });

    this.socket.on('battle:ended', (data: { battleId: string; winner: string }) => {
      const battle = this.battleModes.get(data.battleId);
      if (battle) {
        battle.active = false;
        battle.winner = data.winner;
        this.notifyBattleUpdate(battle);
        setTimeout(() => this.battleModes.delete(data.battleId), 5000);
      }
    });

    this.socket.on('team:stats', (stats: TeamStats) => {
      this.notifyStatsUpdate(stats);
    });

    this.socket.on('disconnect', () => {});
  }

  private createCallFromData(data: any): WarRoomCall {
    return {
      id: data.id,
      repName: data.repName,
      repId: data.repId,
      customerName: data.customerName || 'Unknown',
      phoneNumber: data.phoneNumber,
      startTime: new Date(data.startTime || Date.now()),
      duration: data.duration || 0,
      status: data.status || 'connecting',
      confidence: data.confidence || 50,
      sentiment: data.sentiment || 0,
      voiceMetrics: data.voiceMetrics || {
        pace: 'normal',
        tone: 'uncertain',
        volume: 50,
        talkRatio: 50,
      },
      spectators: data.spectators || [],
      harveyAdvice: data.harveyAdvice,
      harveyScore: data.harveyScore,
      callMetrics: data.callMetrics,
    };
  }

  private requestActiveCalls(): void {
    if (this.socket?.connected) {
      this.socket.emit('request:active-calls');
    }
  }

  async joinAsSpectator(callId: string): Promise<{ success: boolean; streamInfo?: any }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false });
        return;
      }

      this.socket.emit('spectator:join', { callId }, (response: any) => {
        resolve(response);
      });
    });
  }

  async leaveSpectator(callId: string): Promise<void> {
    if (this.socket?.connected) {
      this.socket.emit('spectator:leave', { callId });
    }
  }

  async requestBattle(
    rep1Id: string,
    rep2Id: string
  ): Promise<{ success: boolean; battleId?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false });
        return;
      }

      this.socket.emit('battle:request', { rep1Id, rep2Id }, (response: any) => {
        resolve(response);
      });
    });
  }

  async acceptBattle(battleId: string): Promise<void> {
    if (this.socket?.connected) {
      this.socket.emit('battle:accept', { battleId });
    }
  }

  async declineBattle(battleId: string): Promise<void> {
    if (this.socket?.connected) {
      this.socket.emit('battle:decline', { battleId });
    }
  }

  getActiveCalls(): WarRoomCall[] {
    return Array.from(this.activeCalls.values());
  }

  getCall(callId: string): WarRoomCall | undefined {
    return this.activeCalls.get(callId);
  }

  getActiveBattles(): BattleMode[] {
    return Array.from(this.battleModes.values()).filter((b) => b.active);
  }

  // Event subscription methods
  onCallStart(callback: (call: WarRoomCall) => void): () => void {
    this.listeners.onCallStart.push(callback);
    return () => {
      this.listeners.onCallStart = this.listeners.onCallStart.filter((cb) => cb !== callback);
    };
  }

  onCallUpdate(callback: (call: WarRoomCall) => void): () => void {
    this.listeners.onCallUpdate.push(callback);
    return () => {
      this.listeners.onCallUpdate = this.listeners.onCallUpdate.filter((cb) => cb !== callback);
    };
  }

  onCallEnd(callback: (callId: string) => void): () => void {
    this.listeners.onCallEnd.push(callback);
    return () => {
      this.listeners.onCallEnd = this.listeners.onCallEnd.filter((cb) => cb !== callback);
    };
  }

  onBattleUpdate(callback: (battle: BattleMode) => void): () => void {
    this.listeners.onBattleUpdate.push(callback);
    return () => {
      this.listeners.onBattleUpdate = this.listeners.onBattleUpdate.filter((cb) => cb !== callback);
    };
  }

  onStatsUpdate(callback: (stats: TeamStats) => void): () => void {
    this.listeners.onStatsUpdate.push(callback);
    return () => {
      this.listeners.onStatsUpdate = this.listeners.onStatsUpdate.filter((cb) => cb !== callback);
    };
  }

  // Notification methods
  private notifyCallStart(call: WarRoomCall): void {
    this.listeners.onCallStart.forEach((cb) => cb(call));
  }

  private notifyCallUpdate(call: WarRoomCall): void {
    this.listeners.onCallUpdate.forEach((cb) => cb(call));
  }

  private notifyCallEnd(callId: string): void {
    this.listeners.onCallEnd.forEach((cb) => cb(callId));
  }

  private notifyBattleUpdate(battle: BattleMode): void {
    this.listeners.onBattleUpdate.forEach((cb) => cb(battle));
  }

  private notifyStatsUpdate(stats: TeamStats): void {
    this.listeners.onStatsUpdate.forEach((cb) => cb(stats));
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.activeCalls.clear();
    this.battleModes.clear();
  }
}

export const warRoomService = new WarRoomService();
