// Factory to determine which voice bridge to use based on configuration
import deepgramBridge from './deepgramBridge';
import moshiWebRTCBridge from './moshiWebRTCBridge';

class VoiceBridgeFactory {
  private useDeepgram: boolean;

  constructor() {
    // Check environment variable to determine which service to use
    this.useDeepgram = process.env.REACT_APP_USE_DEEPGRAM === 'true';
    
    console.log(`Voice Bridge: Using ${this.useDeepgram ? 'Deepgram' : 'Moshi'} for voice processing`);
  }

  getBridge() {
    return this.useDeepgram ? deepgramBridge : moshiWebRTCBridge;
  }

  isUsingDeepgram(): boolean {
    return this.useDeepgram;
  }

  getServiceName(): string {
    return this.useDeepgram ? 'Deepgram' : 'Moshi';
  }
}

export const voiceBridgeFactory = new VoiceBridgeFactory();
export default voiceBridgeFactory;