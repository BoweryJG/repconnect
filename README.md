# RepConnect Ultra - AI-Powered Sales CRM with Smart Call Management

<div align="center">
  <img src="public/logo192.png" alt="RepConnect Logo" width="120" />
  
  [![Deployed on Netlify](https://img.shields.io/badge/Deployed%20on-Netlify-00C7B7?style=flat-square&logo=netlify)](https://repconnect.netlify.app)
  [![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
  [![Powered by Supabase](https://img.shields.io/badge/Powered%20by-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
</div>

## 🚀 Overview

RepConnect Ultra is a cutting-edge CRM designed for medical aesthetic sales professionals. It combines AI-powered contact management with intelligent call queuing, natural language processing, and automated dialing to maximize sales efficiency.

### ✨ Key Features

- **🤖 AI Call Sync** - Create smart call queues using natural language commands
- **📞 Twilio Integration** - Direct calling with auto-dial and retry logic
- **🎯 Smart Contact Scoring** - AI ranks contacts by location, service interest, and value
- **🎙️ Voice Commands** - Control the app with voice-activated commands
- **📊 Performance Tracking** - Real-time call analytics and outcome tracking
- **🌟 Premium UI** - Glassmorphic design with adaptive performance optimization
- **📱 Responsive** - Works seamlessly on desktop and mobile devices

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Material-UI
- **Backend**: Supabase (PostgreSQL), Netlify Functions
- **AI/ML**: Natural Language Processing, TensorFlow.js (planned)
- **Communications**: Twilio Voice API
- **Animation**: Framer Motion, Custom WebGL Effects
- **State Management**: Zustand
- **Deployment**: Netlify

## 📋 Prerequisites

- Node.js 16+ and npm/yarn
- Supabase account
- Twilio account
- Netlify account (for deployment)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/repconnect1.git
cd repconnect1
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key

# Backend URL
REACT_APP_BACKEND_URL=your_backend_url

# Twilio Configuration
REACT_APP_TWILIO_ACCOUNT_SID=your_twilio_account_sid
REACT_APP_TWILIO_AUTH_TOKEN=your_twilio_auth_token
REACT_APP_TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Development
PORT=3000
```

### 4. Database Setup

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Navigate to SQL Editor
3. Run the migrations in order:
   - First: `supabase_schema.sql`
   - Then: `check_and_setup_ai_sync.sql`

### 5. Start Development Server

```bash
npm start
```

Visit [http://localhost:3000](http://localhost:3000)

## 🎯 AI Call Sync Usage

### Natural Language Commands

Create intelligent call queues with commands like:

- `"sync top 25 high-value accounts contacted recently"`
- `"sync premium clients within 25 miles interested in botox"`
- `"filter accounts with less than 3 calls"`
- `"sync contacts from this month tagged follow-up"`

### How It Works

1. **Parse** - NLP extracts intent, location, services, and criteria
2. **Score** - Contacts ranked by:
   - Location match (30%)
   - Service interest (40%)
   - Value/criteria (30%)
3. **Queue** - Top contacts form a prioritized call list
4. **Call** - Auto-dial through the queue with outcome tracking

### Quick Start Guide

1. Navigate to **AI Assistant** → **Sync Dashboard**
2. Use voice command or type a query
3. Click sync to process the queue
4. Click "Start Calling" when ready
5. Enable auto-dial for hands-free operation

## 📱 Features in Detail

### Contact Management
- Import/export contacts
- Smart tagging and categorization
- Location-based filtering
- Service interest tracking

### Call Features
- One-click dialing via Twilio
- Call outcome recording
- Scheduled callbacks
- Call history with recordings
- Auto-retry on failures (3 attempts)

### AI Capabilities
- Natural language queue creation
- Voice command interface
- Smart contact scoring
- Predictive analytics (coming soon)

### Performance
- Adaptive rendering based on device capabilities
- Thermal management for mobile devices
- Progressive particle effects
- Optimized for 60fps animations

## 🏗️ Project Structure

```
repconnect1/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── QuantumDialer.tsx
│   │   ├── SyncDashboard.tsx
│   │   └── QueueCallInterface.tsx
│   ├── lib/
│   │   ├── ai/         # AI/NLP services
│   │   ├── performance/ # Performance optimization
│   │   └── supabase.ts
│   ├── services/       # External service integrations
│   │   ├── twilioService.ts
│   │   └── callQueueService.ts
│   └── store/          # State management
├── netlify/
│   └── functions/      # Serverless functions
├── supabase/
│   └── migrations/     # Database migrations
└── build/              # Production build
```

## 🚀 Deployment

### Netlify Deployment

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy settings:
   - Build command: `npm run build`
   - Publish directory: `build`
   - Functions directory: `netlify/functions`

### Manual Deployment

```bash
npm run build
netlify deploy --prod
```

## 🔧 Configuration

### Performance Settings

Adjust in `src/lib/performance/AdaptiveRenderer.ts`:
- Particle count limits
- Frame rate targets
- Quality presets

### AI Settings

Configure in `src/lib/ai/NaturalLanguageProcessor.ts`:
- Service keywords
- Location parsing rules
- Scoring weights

## 🐛 Troubleshooting

### Common Issues

1. **Calls not connecting**
   - Verify Twilio credentials
   - Check phone number format (+1XXXXXXXXXX)

2. **Database errors**
   - Ensure all migrations are run
   - Check Supabase RLS policies

3. **Performance issues**
   - Reduce particle effects in settings
   - Enable thermal management

### Debug Mode

Add to `.env`:
```env
REACT_APP_DEBUG=true
```

## 📊 API Reference

### Call Queue Service

```typescript
// Create a call queue
CallQueueService.createCallsFromQueue(queueId, contacts)

// Make a call
CallQueueService.makeCall(queuedCall)

// Record outcome
CallQueueService.completeCall(callId, outcome)
```

### Natural Language Processor

```typescript
// Parse a query
NaturalLanguageProcessor.parse("sync top 25 high-value clients")

// Returns:
{
  intent: 'sync',
  count: 25,
  criteria: { value: 'high-value' }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 License

This project is proprietary software. All rights reserved.

## 🙏 Acknowledgments

- Built with [Create React App](https://create-react-app.dev/)
- UI components from [Material-UI](https://mui.com/)
- Database by [Supabase](https://supabase.com/)
- Voice calls by [Twilio](https://www.twilio.com/)
- Deployed on [Netlify](https://www.netlify.com/)

## 📞 Support

For support, email support@repconnect.ai or open an issue on GitHub.

---

<div align="center">
  Made with ❤️ for sales professionals who demand excellence
</div>