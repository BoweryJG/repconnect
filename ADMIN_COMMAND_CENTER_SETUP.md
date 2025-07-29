# Agent Command Center - Admin Interface Setup

## Overview

The Agent Command Center is a comprehensive admin interface for managing AI agents in RepConnect. It provides full authentication through Supabase and allows authorized administrators to create, edit, manage, and monitor agents that interact with the agentbackend API.

## Key Features

1. **Supabase Authentication**
   - Secure login with email/password
   - JWT token management for API calls
   - Session persistence
   - Auto-refresh tokens

2. **Admin Access Control**
   - Only authorized admin emails can access the interface
   - Current admin users:
     - jasonwilliamgolden@gmail.com
     - jgolden@bowerycreativeagency.com

3. **Agent Management**
   - Create new agents with full configuration
   - Edit existing agents
   - Toggle agent active/inactive status
   - Delete agents
   - Search and filter agents by category

4. **Real-time Synchronization**
   - All changes sync with agentbackend API
   - JWT tokens included in all API requests
   - Cache management for optimal performance

## Implementation Details

### Directory Structure

```
src/
├── components/
│   └── admin/
│       ├── AdminLogin.tsx       # Login interface
│       ├── AdminDashboard.tsx   # Main dashboard
│       ├── AgentEditor.tsx      # Create/Edit agents
│       └── AdminRoute.tsx       # Route guard component
├── contexts/
│   └── AdminAuthContext.tsx     # Authentication context
└── services/
    └── agentBackendAPI.js       # Updated with auth headers
```

### Routes Added

- `/admin` - Redirects to dashboard
- `/admin/login` - Admin login page
- `/admin/dashboard` - Main admin dashboard (protected)
- `/admin/agents/new` - Create new agent (protected)
- `/admin/agents/:id/edit` - Edit existing agent (protected)

### Supabase Configuration

Updated `src/lib/supabase.js` to use:

- URL: `https://cbopynuvhcymbumjnvay.supabase.co`
- Includes auto-refresh and session persistence

### API Integration

The `agentBackendAPI.js` service has been updated to:

- Include Supabase JWT tokens in all requests
- Add `X-Supabase-Auth` header for backend verification
- Maintain session authentication across API calls

## Usage

### Accessing the Admin Interface

1. Navigate to `/admin` in your browser
2. Log in with an authorized admin email
3. Access the dashboard to manage agents

### Creating an Agent

1. Click "New Agent" button
2. Fill in all required fields:
   - Name, Role, Tagline
   - Avatar emoji and colors
   - Personality traits and specialties
   - Voice configuration
   - Capabilities
3. Click "Create Agent"

### Editing an Agent

1. Click "Edit" on any agent card
2. Modify desired fields
3. Click "Update Agent"

### Managing Agent Status

- Click the eye icon to toggle active/inactive status
- Active agents are available for use
- Inactive agents are hidden from users

## Security Features

1. **Authentication Required**
   - All admin routes require authentication
   - Automatic redirect to login if not authenticated

2. **Admin-Only Access**
   - Email whitelist for admin users
   - Server-side verification through JWT

3. **Secure API Communication**
   - All requests include JWT bearer tokens
   - HTTPS communication with agentbackend

## Environment Variables

Ensure these are set in your `.env` file:

```env
REACT_APP_SUPABASE_URL=https://cbopynuvhcymbumjnvay.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
REACT_APP_AGENT_BACKEND_URL=https://agentbackend-2932.onrender.com
```

## Troubleshooting

### Login Issues

- Verify your email is in the admin whitelist
- Check Supabase credentials in environment variables
- Ensure cookies are enabled for session persistence

### API Connection Issues

- Verify agentbackend URL is correct
- Check browser console for CORS errors
- Ensure JWT token is being included in requests

### Agent Management Issues

- Refresh the page to clear cache
- Check network tab for API errors
- Verify agent data format matches backend schema

## Future Enhancements

1. **Analytics Dashboard**
   - Agent usage statistics
   - Performance metrics
   - User interaction logs

2. **Bulk Operations**
   - Import/export agents
   - Batch status updates
   - Template management

3. **Advanced Features**
   - A/B testing configurations
   - Version control for agents
   - Webhook integrations

## Support

For issues or questions:

- Check browser console for errors
- Verify all environment variables
- Contact admin team for access issues
