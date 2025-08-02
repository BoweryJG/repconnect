import api from '../config/api';
import { logger } from '../utils/prodLogger';

interface VoiceSession {
  sessionId: string;
  agentId: string;
  userId: string;
  status: 'active' | 'completed' | 'error';
  startTime: string;
  transcriptAvailable: boolean;
}

interface VoiceTestResult {
  deepgram: {
    connected: boolean;
    transcript?: string;
    confidence?: number;
  };
  elevenLabs: {
    connected: boolean;
    audioGenerated: boolean;
  };
  webrtc: {
    stunServers: string[];
    turnServers: string[];
  };
}

interface VoiceAgents {
  agents: Array<{
    id: string;
    name: string;
    role: string;
    agent_voice_profiles?: {
      elevenlabs_voice_id: string;
      voice_name: string;
      voice_settings: any;
    };
  }>;
  total: number;
}

class VoiceService {
  /**
   * Test audio setup and connectivity
   */
  async testAudioSetup(audioData?: string): Promise<VoiceTestResult> {
    try {
      const response = await api.post('/api/voice/test-audio', {
        audioData: audioData || 'dGVzdCBhdWRpbyBkYXRh' // base64 test data
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Audio test failed');
      }

      return response.data.data;
    } catch (error) {
      logger.error('Voice audio test failed', error, 'VoiceService');
      throw error;
    }
  }

  /**
   * Get all voice-enabled agents
   */
  async getVoiceEnabledAgents(): Promise<VoiceAgents> {
    try {
      const response = await api.get('/api/voice/agents/voice-enabled');

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to fetch voice agents');
      }

      return response.data.data;
    } catch (error) {
      logger.error('Failed to fetch voice agents', error, 'VoiceService');
      throw error;
    }
  }

  /**
   * Get voice session status
   */
  async getSessionStatus(sessionId: string): Promise<VoiceSession> {
    try {
      const response = await api.get(`/api/voice/sessions/${sessionId}/status`);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get session status');
      }

      return response.data.data;
    } catch (error) {
      logger.error('Failed to get session status', error, 'VoiceService');
      throw error;
    }
  }

  /**
   * Get session transcript
   */
  async getSessionTranscript(sessionId: string): Promise<any> {
    try {
      const response = await api.get(`/api/voice/sessions/${sessionId}/transcript`);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get transcript');
      }

      return response.data.data;
    } catch (error) {
      logger.error('Failed to get transcript', error, 'VoiceService');
      throw error;
    }
  }

  /**
   * Start a coaching session with whisper mode
   */
  async startCoachingSession(repPhone: string, clientPhone: string): Promise<any> {
    try {
      const response = await api.post('/api/voice/coaching/start', {
        repPhone,
        clientPhone
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to start coaching session');
      }

      return response.data.data;
    } catch (error) {
      logger.error('Failed to start coaching session', error, 'VoiceService');
      throw error;
    }
  }
}

const voiceService = new VoiceService();
export default voiceService;