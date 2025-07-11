# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Running the Application
```bash
# Start development server (runs on http://localhost:3000)
npm start

# Build for production
npm run build

# Run tests
npm test

# Run a single test file
npm test -- src/components/ComponentName.test.tsx
```

### Harvey AI Service Commands
```bash
# Deploy Harvey service
npm run harvey:deploy

# Initialize Harvey for all representatives
npm run harvey:init

# Start Harvey in production mode
npm run harvey:start

# Monitor Harvey service health
npm run harvey:monitor
```

## Architecture Overview

### Frontend Architecture
This is a React 18 TypeScript application using:
- **Material-UI v5** for the component library
- **Zustand** for global state management (see `src/store/`)
- **React Router v6** for routing
- **Three.js/React Three Fiber** for 3D visualizations
- **Framer Motion** for animations

Key architectural patterns:
- Components are organized by feature in `src/components/`
- Harvey AI components are prefixed with `Harvey*`
- Custom hooks in `src/hooks/` handle complex logic
- Services in `src/services/` manage external integrations

### Backend Services
- **Express.js** server handling API routes in `backend-routes/`
- **Supabase** for database (PostgreSQL) and authentication
- **Twilio** for voice calling and phone number management
- **WebRTC** with Socket.IO for real-time communication
- **Deepgram** for voice transcription
- **OpenAI GPT-4** for AI features

### State Management
The application uses Zustand stores in `src/store/`:
- `useAppStore` - Main application state
- `useCallStore` - Call management state
- `useContactStore` - Contact/lead management
- `useHarveyStore` - Harvey AI feature state

### Database Schema
PostgreSQL database managed by Supabase with migrations in `supabase/migrations/`. Key tables:
- `representatives` - Sales rep profiles
- `contacts` - Customer/lead information
- `calls` - Call history and recordings
- `harvey_sessions` - AI coaching sessions
- `harvey_battles` - Competitive call sessions

### Real-time Features
The app uses WebRTC and Socket.IO for:
- Live voice calls through the browser
- Real-time transcription display
- Multi-rep call monitoring (War Room)
- Harvey AI real-time coaching

## Testing Approach
- Uses Jest with React Testing Library
- Test files are colocated with components (`.test.tsx` files)
- Run specific tests with: `npm test -- --testNamePattern="pattern"`
- Coverage report: `npm test -- --coverage`

## Key Environment Variables
The application requires these environment variables:
- `REACT_APP_SUPABASE_URL` - Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous key
- `REACT_APP_BACKEND_URL` - Backend API URL
- `REACT_APP_HARVEY_API_URL` - Harvey service API URL
- `REACT_APP_HARVEY_WS_URL` - Harvey WebSocket URL
- Twilio credentials for voice features

## Production Deployment
- Frontend deploys to Netlify (see `netlify.toml`)
- Backend API deploys to Render
- Database hosted on Supabase
- Harvey service runs as a separate Node.js process

## Common Development Tasks

### Adding a New Component
1. Create component in appropriate directory under `src/components/`
2. Use Material-UI components and follow existing patterns
3. Add TypeScript types in `src/types/` if needed
4. Update relevant Zustand store if state management needed

### Working with Harvey AI
- Harvey components are in `src/components/Harvey*.tsx`
- Harvey API integration in `src/services/harvey.ts`
- Harvey state managed in `src/store/useHarveyStore.ts`
- Backend routes in `backend-routes/harvey.js`

### Database Changes
1. Create migration in `supabase/migrations/`
2. Update TypeScript types in `src/types/`
3. Update relevant services in `src/services/`

## Security Considerations
- Never commit API keys or secrets
- Environment variables should be in `.env.local` (gitignored)
- Authentication tokens stored in Supabase auth, not localStorage
- All API calls should go through the backend proxy