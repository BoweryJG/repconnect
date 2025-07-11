# Luxury Chatbot Launcher

A category-defining, luxury chatbot launcher with specialized medical aesthetic and dental procedure agents, featuring Cartier-inspired design elements and dual communication modes.

## Features

- 🎨 **Luxury Design**: Glassmorphic UI with Cartier-style micro screws
- 🤖 **9 Specialized Agents**: 5 aesthetic + 3 dental + Harvey AI
- 💬 **Dual Communication**: Text chat (GPT-4) and voice calls (ElevenLabs)
- 📱 **Mobile Optimized**: Touch-friendly carousel with smooth animations
- ✨ **Unique Personalities**: Each agent has distinct visual and voice characteristics

## Quick Start

```tsx
import ChatbotIntegration from '@/components/ChatbotLauncher/ChatbotIntegration';

function App() {
  return (
    <div>
      {/* Your app content */}
      
      {/* Add the chatbot launcher */}
      <ChatbotIntegration 
        position="bottom-right"
        glowColor="#3B82F6"
      />
    </div>
  );
}
```

## Agents

### Aesthetic Specialists
1. **Dr. Bella** - Injectable Virtuoso (Botox/Dysport)
2. **Dr. Sophia** - The Sculptor (Dermal Fillers)
3. **Dr. Luna** - The Skin Alchemist (Chemical Peels)
4. **Dr. Ray** - The Laser Architect (Laser Treatments)
5. **Dr. Sculpt** - The Body Artist (Body Contouring)

### Dental Specialists
6. **Dr. Anchor** - The Robotic Surgeon (Yomi/Implants)
7. **Dr. Align** - The Alignment Expert (Invisalign)
8. **Dr. Bright** - The Smile Designer (Cosmetic Dentistry)

### AI Assistant
9. **Harvey AI** - Master Sales Coach & Medical Assistant

## Components

### ChatbotIntegration
The main integration component that manages all modals and state.

```tsx
<ChatbotIntegration 
  position="bottom-right" // or "bottom-left"
  primaryColor="#6366F1"
  glowColor="#3B82F6"
/>
```

### Individual Components

If you need more control, you can use components individually:

```tsx
import ChatbotLauncher from '@/components/ChatbotLauncher/ChatbotLauncher';
import { ChatModal } from '@/components/ChatbotLauncher/ChatModal';
import VoiceModal from '@/components/ChatbotLauncher/VoiceModal';
```

## Configuration

### Environment Variables

Add to your `.env.local`:

```bash
# ElevenLabs Configuration
REACT_APP_ELEVENLABS_API_KEY=your_api_key_here

# OpenRouter Configuration (for GPT-4 chat)
REACT_APP_OPENROUTER_API_KEY=your_api_key_here
```

### Custom Agents

To add or modify agents, edit `src/components/ChatbotLauncher/agents/agentConfigs.ts`:

```typescript
export const customAgent: Agent = {
  id: 'custom',
  name: 'Dr. Custom',
  category: 'aesthetic',
  tagline: 'Your Specialist',
  // ... other properties
};
```

## Styling

The component uses:
- Material-UI for base components
- CSS Modules for luxury effects
- Framer Motion for animations
- Embla Carousel for swipe functionality

### Custom Styling

Import luxury utilities:

```tsx
import styles from '@/components/ChatbotLauncher/styles/luxury.module.css';

<div className={styles.glassmorphism}>
  Luxury content
</div>
```

## Voice Integration

Voice calls use:
- WebRTC for real-time communication
- ElevenLabs for text-to-speech
- Each agent has a unique voice configuration

## Chat Integration

Text chat requires OpenRouter API key for GPT-4 access. Update the `sendMessage` function in `ChatModal.tsx` with your API endpoint.

## Performance

- Lazy loads agent avatars
- GPU-accelerated animations
- Optimized for mobile devices
- Reduced motion support

## Browser Support

- Chrome/Edge: Full support
- Safari: Full support (iOS 15+)
- Firefox: Full support
- Mobile: Optimized for touch

## Troubleshooting

### Chatbot not appearing
- Check console for errors
- Ensure all dependencies are installed
- Verify environment variables are set

### Voice not working
- Check microphone permissions
- Ensure ElevenLabs API key is valid
- Verify WebRTC is supported in browser

### Performance issues
- Reduce animation complexity on older devices
- Check for console warnings
- Ensure GPU acceleration is enabled