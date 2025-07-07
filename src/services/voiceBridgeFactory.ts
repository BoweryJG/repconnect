// Factory to determine which voice bridge to use based on configuration
import deepgramWebRTCBridge from './deepgramWebRTCBridge';

class VoiceBridgeFactory {
  constructor() {
      }

  getBridge() {
    // Use Deepgram WebRTC Bridge for real-time voice processing
    return deepgramWebRTCBridge;
  }

  isUsingDeepgram(): boolean {
    return true;
  }

  getServiceName(): string {
    return 'Deepgram';
  }
}

export const voiceBridgeFactory = new VoiceBridgeFactory();
export default voiceBridgeFactory;