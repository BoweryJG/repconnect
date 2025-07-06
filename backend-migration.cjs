#!/usr/bin/env node

/**
 * Backend Migration Script
 * Copies route files to your backend repository
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_REPO_PATH = process.env.BACKEND_REPO_PATH || '../osbackend';
const ROUTES_DIR = 'backend-routes';

console.log('🚀 Backend Migration Script');
console.log('===========================\n');

// Check if backend repo exists
if (!fs.existsSync(BACKEND_REPO_PATH)) {
  console.error(`❌ Backend repository not found at: ${BACKEND_REPO_PATH}`);
  console.log('\nPlease set BACKEND_REPO_PATH environment variable or clone your backend repo to ../osbackend');
  process.exit(1);
}

// Files to copy
const files = [
  {
    source: 'backend-routes/callSummaryRoutes.js',
    destination: 'routes/callSummaryRoutes.js'
  },
  {
    source: 'backend-routes/twilioWebhookRoutes.js',
    destination: 'routes/twilioWebhookRoutes.js'
  }
];

// Copy files
files.forEach(file => {
  const sourcePath = path.join(__dirname, file.source);
  const destPath = path.join(BACKEND_REPO_PATH, file.destination);
  const destDir = path.dirname(destPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Copy file
  fs.copyFileSync(sourcePath, destPath);
  console.log(`✅ Copied ${file.source} to ${file.destination}`);
});

// Create main server update file
const serverUpdatePath = path.join(BACKEND_REPO_PATH, 'server-update.js');
const serverUpdate = `
// Add these lines to your main server.js or app.js file

// Import new routes
const callSummaryRoutes = require('./routes/callSummaryRoutes');
const twilioWebhookRoutes = require('./routes/twilioWebhookRoutes');

// Use routes (add these after other middleware)
app.use(callSummaryRoutes);
app.use(twilioWebhookRoutes);

// Required packages to install:
// npm install twilio node-fetch
`;

fs.writeFileSync(serverUpdatePath, serverUpdate);
console.log(`\n✅ Created server-update.js with integration instructions`);

// Create environment variables template
const envTemplate = `
# Add these to your backend .env file

# OpenAI Configuration
OPENAI_API_KEY=your_openai_key_here

# Twilio Configuration
TWILIO_AUTH_TOKEN=your_twilio_auth_token
FORWARD_TO_PHONE=+1234567890

# Backend URL (for callbacks)
BACKEND_URL=https://osbackend-zl1h.onrender.com

# Existing variables you should already have:
# SUPABASE_URL=
# SUPABASE_SERVICE_KEY=
`;

fs.writeFileSync(path.join(BACKEND_REPO_PATH, '.env.template'), envTemplate);
console.log(`✅ Created .env.template with required environment variables`);

// Create deployment checklist
const checklist = `
# Backend Deployment Checklist

## 1. Install Dependencies
\`\`\`bash
cd ${BACKEND_REPO_PATH}
npm install twilio node-fetch
\`\`\`

## 2. Update Your Main Server File
- Open server-update.js and follow the instructions
- Add the route imports and app.use() statements

## 3. Update Environment Variables on Render
Add these variables:
- OPENAI_API_KEY
- TWILIO_AUTH_TOKEN (from Twilio console)
- FORWARD_TO_PHONE (your phone number to forward calls to)
- BACKEND_URL (should be https://osbackend-zl1h.onrender.com)

## 4. Deploy to Render
\`\`\`bash
git add .
git commit -m "Add call summary and Twilio webhook routes"
git push origin main
\`\`\`

## 5. Update Twilio Webhooks
Go to Twilio Console > Phone Numbers > Your Number

Set these webhooks:
- Voice & Fax > A call comes in: 
  Webhook: https://osbackend-zl1h.onrender.com/api/twilio/incoming-call
  Method: HTTP POST

- Call Status Changes:
  Status Callback URL: https://osbackend-zl1h.onrender.com/api/twilio/call-status
  
## 6. Test the Integration
- Make a test call to your Twilio number
- Check backend logs on Render
- Verify call summary generation works

## 7. Update Frontend
The frontend is already updated to use backend URLs.
Just ensure REACT_APP_BACKEND_URL is set correctly.
`;

fs.writeFileSync(path.join(BACKEND_REPO_PATH, 'DEPLOYMENT_CHECKLIST.md'), checklist);
console.log(`✅ Created DEPLOYMENT_CHECKLIST.md`);

console.log(`\n✨ Migration files created successfully!`);
console.log(`\nNext steps:`);
console.log(`1. cd ${BACKEND_REPO_PATH}`);
console.log(`2. Review the files and DEPLOYMENT_CHECKLIST.md`);
console.log(`3. Follow the deployment checklist`);