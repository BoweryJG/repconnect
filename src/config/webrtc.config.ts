// WebRTC Configuration
// STUN servers help with NAT traversal for peer discovery
// TURN servers relay traffic when direct connection fails

export const webRTCConfig = {
  // Public STUN servers
  iceServers: [
    // Google's public STUN servers
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // Other public STUN servers for redundancy
    { urls: 'stun:stun.stunprotocol.org:3478' },
    { urls: 'stun:stun.voip.eutelia.it:3478' },
    { urls: 'stun:stun.voipbuster.com:3478' },
    
    // TURN servers (require credentials)
    // Free TURN server from Metered (limited usage)
    {
      urls: 'turn:a.relay.metered.ca:80',
      username: 'e8dd65c92aa8b4e9e9d68887',
      credential: 'uWdWNmkhvyqTEuQu'
    },
    {
      urls: 'turn:a.relay.metered.ca:80?transport=tcp',
      username: 'e8dd65c92aa8b4e9e9d68887',
      credential: 'uWdWNmkhvyqTEuQu'
    },
    {
      urls: 'turn:a.relay.metered.ca:443',
      username: 'e8dd65c92aa8b4e9e9d68887',
      credential: 'uWdWNmkhvyqTEuQu'
    },
    {
      urls: 'turn:a.relay.metered.ca:443?transport=tcp',
      username: 'e8dd65c92aa8b4e9e9d68887',
      credential: 'uWdWNmkhvyqTEuQu'
    }
  ],

  // ICE gathering configuration
  iceTransportPolicy: 'all' as RTCIceTransportPolicy, // 'all' or 'relay'
  bundlePolicy: 'balanced' as RTCBundlePolicy, // 'balanced', 'max-compat', or 'max-bundle'
  rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy, // 'require' or 'negotiate'

  // Audio constraints optimized for voice
  audioConstraints: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      sampleSize: 16,
      channelCount: 1,
      // Advanced constraints
      googEchoCancellation: true,
      googAutoGainControl: true,
      googNoiseSuppression: true,
      googHighpassFilter: true,
      googTypingNoiseDetection: true
    },
    video: false
  },

  // Connection timeouts
  connectionTimeout: 30000, // 30 seconds
  iceGatheringTimeout: 5000, // 5 seconds

  // Reconnection settings
  enableReconnection: true,
  maxReconnectAttempts: 5,
  reconnectDelay: 1000, // Start with 1 second
  reconnectBackoffMultiplier: 2, // Double delay each attempt

  // Data channel configuration
  dataChannelConfig: {
    ordered: true,
    maxRetransmits: 3,
    maxPacketLifeTime: 3000 // 3 seconds
  }
};

// Production TURN server configuration
// These should be loaded from environment variables in production
export const productionTurnServers = {
  // Twilio TURN servers (requires Twilio account)
  twilio: process.env.REACT_APP_TWILIO_TURN_ENABLED === 'true' ? [
    {
      urls: process.env.REACT_APP_TWILIO_TURN_URL || '',
      username: process.env.REACT_APP_TWILIO_TURN_USERNAME || '',
      credential: process.env.REACT_APP_TWILIO_TURN_CREDENTIAL || ''
    }
  ] : [],

  // Xirsys TURN servers (requires Xirsys account)
  xirsys: process.env.REACT_APP_XIRSYS_ENABLED === 'true' ? [
    {
      urls: process.env.REACT_APP_XIRSYS_TURN_URL || '',
      username: process.env.REACT_APP_XIRSYS_USERNAME || '',
      credential: process.env.REACT_APP_XIRSYS_CREDENTIAL || ''
    }
  ] : [],

  // CoTURN servers (self-hosted)
  coturn: process.env.REACT_APP_COTURN_ENABLED === 'true' ? [
    {
      urls: process.env.REACT_APP_COTURN_URL || '',
      username: process.env.REACT_APP_COTURN_USERNAME || '',
      credential: process.env.REACT_APP_COTURN_CREDENTIAL || ''
    }
  ] : []
};

// Get the appropriate ICE servers based on environment
export function getIceServers(): RTCIceServer[] {
  const servers = [...webRTCConfig.iceServers];

  // Add production TURN servers if available
  if (process.env.NODE_ENV === 'production') {
    servers.push(
      ...productionTurnServers.twilio,
      ...productionTurnServers.xirsys,
      ...productionTurnServers.coturn
    );
  }

  // Filter out any servers with empty URLs
  return servers.filter(server => 
    server.urls && (
      typeof server.urls === 'string' ? server.urls.length > 0 : server.urls.length > 0
    )
  );
}

// Utility to test TURN server connectivity
export async function testTurnServer(turnServer: RTCIceServer): Promise<boolean> {
  try {
    const pc = new RTCPeerConnection({ iceServers: [turnServer] });
    const dc = pc.createDataChannel('test');
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    return new Promise((resolve) => {
      let hasRelay = false;
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          // Check if we got a relay candidate (TURN)
          if (event.candidate.candidate.includes('relay')) {
            hasRelay = true;
          }
        } else {
          // ICE gathering complete
          pc.close();
          resolve(hasRelay);
        }
      };
      
      // Timeout after 10 seconds
      setTimeout(() => {
        pc.close();
        resolve(hasRelay);
      }, 10000);
    });
  } catch (error) {
    console.error('Error testing TURN server:', error);
    return false;
  }
}

// Export default configuration
export default webRTCConfig;