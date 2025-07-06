# RepConnect1 - Ultimate Sales CRM with Harvey AI Syndicate

<div align="center">
  <img src="public/logo192.png" alt="RepConnect Logo" width="120" />
  
  [![Deployed on Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7?style=flat-square&logo=netlify)](https://repconnect1.netlify.app)
  [![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
  [![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Harvey AI](https://img.shields.io/badge/Harvey%20AI-Powered-FFD700?style=flat-square&logo=openai)](https://repconnect1.netlify.app/harvey)
</div>

## 🚀 Live Demo

**🌐 [https://repconnect1.netlify.app](https://repconnect1.netlify.app)**

**🎭 [Harvey Syndicate](https://repconnect1.netlify.app/harvey) - AI Sales Performance Theater**

**⚔️ [Harvey War Room](https://repconnect1.netlify.app/harvey/warroom) - Live Call Monitoring**

**🔬 [Lead Enrichment](https://repconnect1.netlify.app/enrich) - AI-Powered Lead Intelligence**

---

## 🎯 Overview

RepConnect1 is the ultimate AI-powered sales CRM that revolutionizes how sales professionals manage contacts, make calls, and close deals. Featuring the groundbreaking **Harvey Syndicate** - an AI performance coach inspired by Harvey Specter that transforms sales teams into elite closers.

### 🌟 Core Applications

| Application | Purpose | URL |
|-------------|---------|-----|
| **Main CRM** | Contact management & pipeline | `/` |
| **Harvey Syndicate** | AI performance coaching & metrics | `/harvey` |
| **Harvey War Room** | Live call monitoring & battle mode | `/harvey/warroom` |
| **Lead Enrichment** | AI-powered lead intelligence | `/enrich` |

---

## ✨ Revolutionary Features

### 🎭 Harvey Syndicate - AI Performance Theater
> *"I don't have dreams. I have goals."* - Harvey Specter

- **🏆 Performance Metrics** - Real-time reputation points, closing rates, and status tracking
- **📊 Elite Leaderboard** - Compete with top performers in your organization
- **⭐ Daily Verdicts** - Personal performance reviews from Harvey himself
- **🔥 Hot Streak Tracking** - Monitor your consecutive wins and momentum
- **🌙 After Dark Mode** - Enhanced features for late-night closers
- **🎮 Gamification** - Rookie → Closer → Partner → Legend progression
- **📞 Harvey Pre-Call Whisper** - Personal pep talks before every call (only you hear them)

### ⚔️ Harvey War Room - Live Performance Monitoring
- **🎯 Real-Time Call Visualization** - 3D sphere representation of active calls
- **📈 Live Performance Metrics** - Team stats, confidence levels, sentiment analysis
- **🥊 Battle Mode** - Head-to-head call competitions between reps
- **🎤 Live Audio Monitoring** - Listen to calls with Harvey's real-time coaching
- **📊 Voice Analytics** - Pace, tone, volume, and confidence scoring
- **🔴 Live Spectating** - Team members can watch and learn from top performers

### 🧠 AI-Powered Intelligence
- **🤖 Harvey AI Coach** - Personalized coaching based on your performance
- **📞 Smart Call Sync** - Natural language call queue creation
- **🎙️ Voice Commands** - Control the app with voice-activated commands
- **🔍 Lead Enrichment** - AI-powered contact intelligence and scoring
- **📊 Predictive Analytics** - AI-driven insights for better conversion rates

### 📞 Advanced Communication
- **☎️ Twilio Integration** - Direct calling with auto-dial and retry logic
- **🎧 WebRTC Voice** - Real-time audio streaming and analysis
- **📱 Quantum Dialer** - Futuristic dialing interface with advanced features
- **📝 Live Transcription** - Real-time call transcription and sentiment analysis
- **🔄 Auto-Retry Logic** - Intelligent call retry with exponential backoff

### 💎 Premium User Experience
- **🌟 Glassmorphic Design** - Cutting-edge UI with depth and transparency
- **⚡ Performance Optimized** - Adaptive rendering based on device capabilities
- **📱 Fully Responsive** - Seamless experience across all devices
- **🎨 Custom Animations** - Framer Motion powered interactions
- **🔧 Precision Hardware** - Cartier-level precision screws and bezels

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Material-UI v5** - Modern component library
- **Framer Motion** - Advanced animations
- **Three.js / React Three Fiber** - 3D visualizations
- **Zustand** - Lightweight state management
- **React Router v6** - Client-side routing

### Backend & Services
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Twilio Voice API** - Voice calling infrastructure with Harvey whisper
- **WebRTC** - Real-time communication
- **Socket.IO** - Real-time bidirectional communication
- **Deepgram** - Voice AI and transcription
- **OpenAI GPT-4** - Call summaries and AI analysis
- **Render** - Backend hosting at `https://osbackend-zl1h.onrender.com`

### AI & ML
- **Natural Language Processing** - Query parsing and intent recognition
- **Voice Analysis** - Real-time speech pattern analysis
- **Sentiment Analysis** - Emotional intelligence in conversations
- **Predictive Scoring** - Lead quality assessment

### Deployment & Infrastructure
- **Netlify** - Frontend hosting with edge functions
- **Render** - Backend API hosting
- **GitHub Actions** - CI/CD pipeline
- **CORS** - Cross-origin resource sharing configuration

---

## 📋 Prerequisites

- **Node.js 18+** and npm/yarn
- **Supabase Account** - Database and authentication
- **Twilio Account** - Voice calling capabilities
- **Render Account** - Backend API hosting
- **Netlify Account** - Frontend deployment

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/BoweryJG/repconnect1.git
cd repconnect1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend Configuration
REACT_APP_BACKEND_URL=https://osbackend-zl1h.onrender.com
REACT_APP_HARVEY_API_URL=https://osbackend-zl1h.onrender.com
REACT_APP_HARVEY_WS_URL=wss://osbackend-zl1h.onrender.com/harvey-ws

# Twilio Configuration (Optional for local dev)
REACT_APP_TWILIO_ACCOUNT_SID=your_twilio_account_sid
REACT_APP_TWILIO_AUTH_TOKEN=your_twilio_auth_token
REACT_APP_TWILIO_PHONE_NUMBER=+1234567890

# Development
PORT=3000
```

### 4. Database Setup

1. **Create Supabase Project**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Create a new project
   - Navigate to SQL Editor

2. **Run Database Migrations**
   ```sql
   -- Basic contacts table
   CREATE TABLE contacts (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     first_name TEXT,
     last_name TEXT,
     phone_number TEXT,
     email TEXT,
     notes TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable RLS
   ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
   
   -- Basic policy for authenticated users
   CREATE POLICY "Users can manage their own contacts" ON contacts
     FOR ALL USING (auth.uid() IS NOT NULL);
   ```

### 5. Start Development Server

```bash
npm start
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🎯 Application Guide

### 🏠 Main CRM Dashboard (`/`)
- **Contact Management** - Add, edit, and organize your contacts
- **Digital Rolodex** - Premium contact browsing experience
- **Quick Actions** - Fast contact creation and lead enrichment
- **Performance Optimized** - Adaptive rendering for smooth performance

### 🎭 Harvey Syndicate (`/harvey`)
- **Performance Dashboard** - Your reputation points, streak, and status
- **Daily Verdict** - Harvey's assessment of your performance
- **Leaderboard** - See how you rank against other closers
- **Challenge Harvey** - Enter the War Room for live competitions

### ⚔️ Harvey War Room (`/harvey/warroom`)
- **Live Call Monitoring** - Real-time visualization of active calls
- **Team Performance** - Aggregate stats and metrics
- **Battle Mode** - Head-to-head call competitions
- **Spectator Mode** - Watch and learn from top performers

### 🔬 Lead Enrichment (`/enrich`)
- **AI-Powered Intelligence** - Enhance contact data with AI
- **Contact Scoring** - Quality assessment and prioritization
- **Batch Processing** - Enrich multiple contacts simultaneously
- **Export Results** - Download enriched contact data

---

## 🎮 Harvey Syndicate Features

### 🏆 Status Progression
| Status | Requirements | Benefits |
|--------|-------------|----------|
| **Rookie** | Starting level | Basic features, training wheels |
| **Closer** | 50+ calls, 60% close rate | Standard Harvey features |
| **Partner** | 200+ calls, 75% close rate | Elite features, battle mode |
| **Legend** | 500+ calls, 85% close rate | All features, mentor privileges |

### 📊 Metrics Tracking
- **Reputation Points** - Earn points for successful calls and achievements
- **Current Streak** - Track consecutive successful outcomes
- **Closing Rate** - Percentage of successful call outcomes
- **Daily Verdicts** - Performance reviews with actionable feedback

### 🎯 Battle Mode Features
- **Real-Time Competitions** - Live head-to-head call battles
- **Confidence Scoring** - AI-powered confidence level analysis
- **Voice Metrics** - Pace, tone, volume, and sentiment tracking
- **Spectator System** - Team learning and knowledge sharing

---

## 🏗️ Project Architecture

```
repconnect1/
├── public/                     # Static assets and _redirects
├── src/
│   ├── components/            # React components
│   │   ├── HarveySyndicate.tsx       # Main Harvey dashboard
│   │   ├── HarveyWarRoom.tsx         # Live call monitoring
│   │   ├── HarveyControlPanel.tsx    # Harvey configuration
│   │   ├── QuantumDialer.tsx         # Advanced dialer interface
│   │   ├── CallInterface.tsx         # In-call experience
│   │   ├── LeadEnrichmentLanding.tsx # Lead enrichment
│   │   └── PremiumNavbar.tsx         # Navigation system
│   ├── services/             # External integrations
│   │   ├── harveyService.ts          # Harvey AI backend
│   │   ├── harveyWebRTC.ts           # Real-time communication
│   │   ├── twilioService.ts          # Voice calling
│   │   ├── transcriptionService.ts   # Real-time transcription
│   │   └── moshiWebRTCBridge.ts     # Voice AI integration
│   ├── lib/
│   │   ├── supabase.ts              # Database client
│   │   └── performance/             # Optimization utilities
│   ├── store/                # State management
│   │   └── useStore.ts              # Zustand store
│   ├── theme/                # UI theming
│   │   └── premiumTheme.ts          # Material-UI theme
│   └── AppRouter.tsx         # Routing configuration
├── netlify/
│   └── functions/            # Serverless functions
└── package.json              # Dependencies and scripts
```

---

## 🚀 Deployment

### Netlify Deployment

1. **Connect Repository**
   - Link your GitHub repository to Netlify
   - Set build command: `CI=false GENERATE_SOURCEMAP=false npm run build`
   - Set publish directory: `build`

2. **Environment Variables**
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_key
   REACT_APP_BACKEND_URL=https://osbackend-zl1h.onrender.com
   ```

3. **Deploy**
   - Push to main branch for automatic deployment
   - Or use: `netlify deploy --prod`

### Backend Deployment (Render)

The backend is already deployed at `https://osbackend-zl1h.onrender.com` with:
- ✅ CORS configured for `https://repconnect1.netlify.app`
- ✅ Harvey AI endpoints
- ✅ WebRTC signaling server
- ✅ Real-time transcription service

---

## 🔧 Configuration

### Harvey AI Settings
Configure Harvey's behavior in the Harvey Control Panel:
- **Coaching Intensity** - Off, Gentle, Normal, Aggressive, Brutal
- **Daily Verdicts** - Enable/disable performance reviews
- **Real-Time Coaching** - In-call whisper coaching
- **Battle Mode** - Competitive calling features
- **Public Shaming** - Public failure announcements (use cautiously!)

### Performance Optimization
Adjust performance settings for different devices:
- **Quality Presets** - Auto, High, Medium, Low
- **Particle Effects** - Adaptive based on device capabilities
- **Frame Rate Targets** - 60fps for desktop, 30fps for mobile
- **Thermal Management** - Automatic quality reduction on mobile

### Voice & Communication
- **Microphone Access** - Required for voice commands and call monitoring
- **Speaker Output** - For Harvey's voice responses
- **WebRTC Configuration** - Real-time audio streaming
- **Transcription** - Live call transcription and analysis

---

## 🎯 API Reference

### Harvey Service API

```typescript
// Get user metrics
const metrics = await harveyService.getMetrics();

// Get daily verdict
const verdict = await harveyService.getDailyVerdict();

// Submit voice command
const response = await harveyService.submitVoiceCommand("Start battle mode");

// Update coaching mode
await harveyService.updateCoachingMode('aggressive');
```

### Call Queue Service

```typescript
// Create a call queue
const queue = await callQueueService.createQueue(contacts);

// Make a call
const call = await callQueueService.makeCall(contact);

// Record call outcome
await callQueueService.recordOutcome(callId, 'success');
```

### WebRTC Voice Service

```typescript
// Connect to Harvey WebRTC
await harveyWebRTC.connect({
  userId: 'user123',
  onConnectionChange: (connected) => console.log('Connected:', connected),
  onAudioReceived: (audio) => playAudio(audio)
});

// Start listening
await harveyWebRTC.startListening();

// Send text to Harvey
await harveyWebRTC.sendText('How am I performing today?');
```

---

## 🎨 UI Components

### Custom Components
- **QuantumDialer** - Futuristic dialing interface with glass morphism
- **CallInterface** - In-call experience with real-time metrics
- **HarveyControlPanel** - Harvey configuration and interaction
- **VirtualizedContactGrid** - High-performance contact display
- **SubtlePipelineBackground** - Animated background effects

### Design System
- **Colors** - Purple/pink gradient palette with gold accents
- **Typography** - Orbitron for headers, system fonts for body
- **Spacing** - 8px base unit with golden ratio scaling
- **Animation** - Framer Motion with custom easing curves
- **Glassmorphism** - Backdrop blur with subtle transparency

---

## 🐛 Troubleshooting

### Common Issues

**1. Harvey Services Not Connecting**
```
Error: Failed to connect to Harvey
```
- Check if backend is running at `https://osbackend-zl1h.onrender.com`
- Verify CORS is configured for your domain
- Check browser console for detailed error messages

**2. Voice Features Not Working**
```
Error: Microphone access denied
```
- Grant microphone permissions in browser
- Check if HTTPS is enabled (required for WebRTC)
- Verify WebSocket connection to backend

**3. Calls Not Connecting**
```
Error: Twilio call failed
```
- Verify Twilio credentials in backend
- Check phone number format (+1XXXXXXXXXX)
- Ensure Twilio account has sufficient funds

**4. Performance Issues**
- Enable performance optimization in settings
- Reduce particle effects for slower devices
- Clear browser cache and reload

### Debug Mode

Enable debug mode by adding to localStorage:
```javascript
localStorage.setItem('debug', 'true');
```

Or add to URL:
```
https://repconnect1.netlify.app?debug=true
```

---

## 🚀 Recent Updates

### Harvey Pre-Call Whisper (NEW!)
- **Personal Motivation** - Harvey gives you a quick pep talk before each call
- **Customer Privacy** - Only you hear Harvey, customers hear professional greeting
- **Customizable Messages** - Different styles: aggressive, motivational, quick
- **Time-Based** - Different messages for morning, afternoon, evening
- **2-3 Second Delay** - Quick messages like "Jason. Sales mode on. Let's go!"

### Backend Migration
- **Moved to Render** - All API endpoints now on `osbackend-zl1h.onrender.com`
- **OpenAI GPT-4** - Enhanced call summaries with highest quality AI
- **Improved Performance** - Direct backend calls, no serverless cold starts

## 🔒 Security

### Data Protection
- **Supabase RLS** - Row-level security for data isolation
- **HTTPS Only** - All communications encrypted
- **CORS Configured** - Restricted origin access
- **No Credentials Stored** - Client-side tokens only

### Privacy
- **Minimal Data Collection** - Only essential contact information
- **Call Recording Consent** - Clear notification before recording
- **User Consent** - Microphone access requires explicit permission
- **Harvey Whisper** - Pre-call messages only audible to sales rep

---

## 🤝 Contributing

### Development Workflow

1. **Fork the Repository**
   ```bash
   git fork https://github.com/BoweryJG/repconnect1.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/harvey-enhancement
   ```

3. **Development Standards**
   - TypeScript for all new code
   - ESLint configuration with CI=false for builds
   - Responsive design mobile-first
   - Accessibility compliance (WCAG 2.1)

4. **Commit Guidelines**
   ```bash
   git commit -m "Add Harvey battle mode voice commands

   - Implement voice-activated battle mode entry
   - Add confidence level voice feedback
   - Update Harvey responses for competition

   🤖 Generated with [Claude Code](https://claude.ai/code)

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

5. **Pull Request**
   - Include demo screenshots/videos
   - Test on multiple devices
   - Update documentation if needed

### Code Standards
- **React Hooks** - Functional components preferred
- **TypeScript** - Strict mode enabled
- **Performance** - Optimize for 60fps animations
- **Accessibility** - ARIA labels and keyboard navigation

---

## 📊 Analytics & Monitoring

### Performance Metrics
- **Core Web Vitals** - LCP, FID, CLS tracking
- **Call Success Rate** - Twilio integration metrics
- **User Engagement** - Harvey feature adoption
- **Error Monitoring** - Real-time error tracking

### Harvey Analytics
- **Performance Trends** - Historical metrics tracking
- **Feature Usage** - Battle mode engagement
- **Voice Command Success** - Recognition accuracy
- **Coaching Effectiveness** - Improvement correlation

---

## 🌟 Roadmap

### Phase 1: Core Enhancements ✅
- [x] Harvey Syndicate implementation
- [x] Real-time War Room monitoring  
- [x] Voice command integration
- [x] Lead enrichment system

### Phase 2: Advanced AI (Q2 2025)
- [ ] Machine learning call outcome prediction
- [ ] Advanced sentiment analysis
- [ ] Automated coaching recommendations
- [ ] Competitive intelligence features

### Phase 3: Enterprise Features (Q3 2025)
- [ ] Multi-tenant organization support
- [ ] Advanced reporting dashboard
- [ ] Integration marketplace
- [ ] White-label customization

### Phase 4: Mobile App (Q4 2025)
- [ ] React Native mobile application
- [ ] Offline capability
- [ ] Push notifications
- [ ] Mobile-optimized Harvey features

---

## 📞 Support & Contact

### Technical Support
- **GitHub Issues** - [Report bugs and feature requests](https://github.com/BoweryJG/repconnect1/issues)
- **Documentation** - This README and inline code comments
- **Email Support** - support@repconnect.ai

### Community
- **Discord** - Join our community server
- **LinkedIn** - Follow for updates and tips
- **YouTube** - Video tutorials and demos

### Professional Services
- **Custom Implementation** - Tailored deployment for enterprises
- **Training & Onboarding** - Team training programs
- **Integration Development** - Custom integrations and features

---

## 📜 License

This project is proprietary software. All rights reserved.

### Usage Rights
- ✅ Internal business use
- ✅ Development and testing
- ❌ Redistribution or resale
- ❌ Reverse engineering

---

## 🙏 Acknowledgments

### Technology Partners
- **[Supabase](https://supabase.com)** - Database and authentication
- **[Twilio](https://www.twilio.com)** - Voice communications
- **[Netlify](https://www.netlify.com)** - Frontend hosting
- **[Render](https://render.com)** - Backend hosting
- **[Material-UI](https://mui.com)** - Component library

### Inspiration
- **Harvey Specter** - The legendary closer from Suits
- **Modern Sales Teams** - Feedback from real sales professionals
- **AI Innovation** - Cutting-edge voice and language technologies

### Development Tools
- **[React](https://reactjs.org)** - UI framework
- **[TypeScript](https://www.typescriptlang.org)** - Type safety
- **[Framer Motion](https://www.framer.com/motion)** - Animations
- **[Three.js](https://threejs.org)** - 3D graphics
- **[Claude Code](https://claude.ai/code)** - AI-powered development assistance

---

<div align="center">

### 🎯 Ready to Close Like Harvey?

**[Start Your Journey](https://repconnect1.netlify.app) | [Enter the Syndicate](https://repconnect1.netlify.app/harvey) | [Join the War Room](https://repconnect1.netlify.app/harvey/warroom)**

*"Success is not just about what you accomplish in your life, it's about what you inspire others to do."*

**Made with ❤️ for sales professionals who demand excellence**

[![Deployed on Netlify](https://img.shields.io/badge/Live%20Demo-repconnect1.netlify.app-00C7B7?style=for-the-badge&logo=netlify)](https://repconnect1.netlify.app)

</div>