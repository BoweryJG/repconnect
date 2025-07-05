# Deepgram Voice Agent API Setup

## Quick Start

1. **Sign up for Deepgram**
   - Go to https://console.deepgram.com/signup
   - You get $200 free credits

2. **Get your API key**
   - Dashboard → API Keys → Create New Key

3. **Add to .env**
   ```bash
   REACT_APP_DEEPGRAM_API_KEY=your-api-key-here
   REACT_APP_DEEPGRAM_PROJECT_ID=your-project-id
   ```

4. **Install SDK**
   ```bash
   npm install @deepgram/sdk
   ```

## Voice Agent API Example

```javascript
import { createClient } from "@deepgram/sdk";

const deepgram = createClient(process.env.REACT_APP_DEEPGRAM_API_KEY);

// Create voice agent connection
const connection = deepgram.agent({
  model: "aura-asteria-en",
  audio: {
    input: { encoding: "linear16", sample_rate: 16000 },
    output: { encoding: "linear16", sample_rate: 16000 }
  }
});

// Handle WebRTC audio
connection.on("open", () => {
  console.log("Connected to Deepgram Voice Agent");
});

connection.on("message", (message) => {
  // Handle transcripts, audio, etc.
});
```

## Pricing
- Voice Agent: $4.50/hour
- STT only: $0.0043/minute (Nova-2)
- TTS only: $0.015/1k characters (Aura)

## Why Deepgram over Moshi?
1. **Production ready** - No mystery API keys
2. **Free credits** - $200 to start
3. **Better docs** - Clear API documentation
4. **Lower latency** - Optimized infrastructure
5. **Voice Agent API** - Single unified API, no stitching needed