#!/bin/bash
# Harvey Specter Sales Coach - Production Deployment Script

echo "🎯 HARVEY SPECTER SALES COACH - PRODUCTION DEPLOYMENT"
echo "===================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as appropriate user
echo "🔍 Checking deployment prerequisites..."

# 1. Check environment variables
echo -e "\n${YELLOW}Step 1: Verifying environment configuration${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}❌ ERROR: .env file not found!${NC}"
    exit 1
fi

# Check required env vars
REQUIRED_VARS=(
    "MOSHI_API_KEY"
    "MOSHI_API_URL"
    "SUPABASE_URL"
    "SUPABASE_SERVICE_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" .env; then
        echo -e "${GREEN}✓ ${var} configured${NC}"
    else
        echo -e "${RED}❌ ${var} missing in .env!${NC}"
        exit 1
    fi
done

# 2. Install dependencies
echo -e "\n${YELLOW}Step 2: Installing production dependencies${NC}"
npm install --production

# 3. Build the application
echo -e "\n${YELLOW}Step 3: Building production bundle${NC}"
npm run build

# 4. Deploy database schema
echo -e "\n${YELLOW}Step 4: Deploying Harvey database schema${NC}"
echo "Please run the following migration in your Supabase dashboard:"
echo "Path: /home/jgolden/crm/supabase/migrations/20250106_harvey_coaching_schema.sql"
echo ""
read -p "Press Enter after running the migration..."

# 5. Initialize Harvey for all reps
echo -e "\n${YELLOW}Step 5: Creating Harvey initialization script${NC}"
cat > initializeHarveyForAllReps.js << 'EOF'
import harveyCoach from './src/services/harveyCoach.js';
import { supabase } from './src/lib/supabase.ts';

async function initializeAllReps() {
  console.log('🚀 Initializing Harvey for all sales reps...\n');
  
  try {
    // Get all active sales reps from your database
    // Adjust this query based on your actual user/rep table structure
    const { data: reps, error } = await supabase
      .from('users')  // or 'sales_reps' - adjust to your table name
      .select('id, name')
      .eq('role', 'sales_rep')
      .eq('active', true);
    
    if (error) {
      console.error('Failed to fetch reps:', error);
      return;
    }
    
    console.log(`Found ${reps.length} active sales reps\n`);
    
    // Initialize Harvey for each rep
    for (const rep of reps) {
      console.log(`Initializing Harvey for ${rep.name}...`);
      const result = await harveyCoach.initializeRep(rep.id, rep.name);
      console.log(`✓ ${rep.name}: ${result.message}\n`);
    }
    
    console.log('✅ Harvey initialization complete!');
    console.log('Harvey is now monitoring all sales reps.');
    
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

initializeAllReps();
EOF

# 6. Create production start script
echo -e "\n${YELLOW}Step 6: Creating production start script${NC}"
cat > startHarvey.js << 'EOF'
import harveyCallMonitor from './src/services/harveyCallMonitor.js';
import express from 'express';
import harveyRoutes from './src/services/harveyRoutes.js';

const app = express();
const PORT = process.env.HARVEY_PORT || 3001;

// Middleware
app.use(express.json());

// Harvey API routes
app.use('/api/harvey', harveyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'operational',
    service: 'Harvey Specter Sales Coach',
    version: '1.0.0',
    personality: 'Maximum Harvey'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🎯 Harvey Coach API running on port ${PORT}`);
  console.log('Harvey says: "I don\'t have dreams, I have goals. Now let\'s make some sales."');
});

// Start monitoring all reps
console.log('🚀 Starting Harvey monitoring system...');
// The monitor will automatically detect and monitor all active reps
EOF

# 7. Create systemd service file
echo -e "\n${YELLOW}Step 7: Creating systemd service (optional)${NC}"
cat > harvey-coach.service << EOF
[Unit]
Description=Harvey Specter Sales Coach
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node startHarvey.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=harvey-coach
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}Service file created: harvey-coach.service${NC}"
echo "To install as a system service, run:"
echo "  sudo cp harvey-coach.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable harvey-coach"
echo "  sudo systemctl start harvey-coach"

# 8. Create monitoring dashboard
echo -e "\n${YELLOW}Step 8: Setting up Harvey monitoring dashboard${NC}"
cat > monitorHarvey.js << 'EOF'
import { supabase } from './src/lib/supabase.ts';
import harveyCoach from './src/services/harveyCoach.js';

async function monitorHarvey() {
  console.log('📊 HARVEY COACH MONITORING DASHBOARD');
  console.log('=====================================\n');
  
  // Get today's stats
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch coaching sessions
  const { data: sessions } = await supabase
    .from('harvey_coaching_sessions')
    .select('*')
    .gte('created_at', today)
    .order('created_at', { ascending: false });
  
  console.log(`📞 Today's Coaching Sessions: ${sessions?.length || 0}`);
  
  // Fetch performance metrics
  const { data: metrics } = await supabase
    .from('rep_performance_metrics')
    .select('*')
    .eq('date', today);
  
  console.log(`📈 Reps Monitored: ${metrics?.length || 0}`);
  
  // Get leaderboard
  const leaderboard = await harveyCoach.updateLeaderboard();
  console.log('\n🏆 TODAY\'S LEADERBOARD:');
  console.log('====================');
  leaderboard.slice(0, 10).forEach((rep, index) => {
    console.log(`${index + 1}. ${rep.name} - Harvey Score: ${rep.harveyScore}`);
  });
  
  // Show recent coaching
  if (sessions && sessions.length > 0) {
    console.log('\n💬 RECENT COACHING:');
    console.log('==================');
    sessions.slice(0, 5).forEach(session => {
      console.log(`[${new Date(session.created_at).toLocaleTimeString()}] ${session.rep_name}: ${session.message.substring(0, 80)}...`);
    });
  }
  
  console.log('\n✅ Harvey is operational and crushing it!');
}

// Run monitoring
monitorHarvey().catch(console.error);

// Auto-refresh every 30 seconds
setInterval(() => {
  console.clear();
  monitorHarvey().catch(console.error);
}, 30000);
EOF

# 9. Final setup instructions
echo -e "\n${GREEN}✅ HARVEY DEPLOYMENT PREPARATION COMPLETE!${NC}"
echo ""
echo "📋 FINAL DEPLOYMENT STEPS:"
echo "=========================="
echo ""
echo "1. Deploy database schema to Supabase:"
echo "   - Go to your Supabase dashboard"
echo "   - Run the migration from: /home/jgolden/crm/supabase/migrations/20250106_harvey_coaching_schema.sql"
echo ""
echo "2. Initialize Harvey for all reps:"
echo "   node initializeHarveyForAllReps.js"
echo ""
echo "3. Start Harvey in production:"
echo "   NODE_ENV=production node startHarvey.js"
echo ""
echo "4. Monitor Harvey performance:"
echo "   node monitorHarvey.js"
echo ""
echo "5. (Optional) Install as system service:"
echo "   sudo cp harvey-coach.service /etc/systemd/system/"
echo "   sudo systemctl enable harvey-coach"
echo "   sudo systemctl start harvey-coach"
echo ""
echo -e "${YELLOW}🎯 Harvey says: \"Success is a result of preparation, hard work, and learning from failure. Now let's close some deals!\"${NC}"