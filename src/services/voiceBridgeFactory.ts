// Factory to determine which voice bridge to use based on configuration
import deepgramBridge from './deepgramBridge';

class VoiceBridgeFactory {
  constructor() {
    console.log('Voice Bridge: Using Deepgram for voice processing');
  }

  getBridge() {
    // Always use Deepgram since Moshi/PiAPI isn't working
    return deepgramBridge;
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