#!/bin/bash

echo "Checking for potential hardcoded secrets in the codebase..."
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check for patterns
check_pattern() {
    local pattern=$1
    local description=$2
    echo -e "\n${YELLOW}Checking for ${description}...${NC}"
    
    # Exclude node_modules, .git, build directories and this script
    result=$(grep -r -i -E "$pattern" . \
        --exclude-dir=node_modules \
        --exclude-dir=.git \
        --exclude-dir=build \
        --exclude-dir=dist \
        --exclude="check-for-secrets.sh" \
        --exclude="*.log" \
        --exclude="package-lock.json" \
        --include="*.js" \
        --include="*.ts" \
        --include="*.tsx" \
        --include="*.json" \
        --include="*.env*" \
        --include="*.yml" \
        --include="*.yaml" \
        2>/dev/null)
    
    if [ -n "$result" ]; then
        echo -e "${RED}Found potential secrets:${NC}"
        echo "$result" | head -20
        if [ $(echo "$result" | wc -l) -gt 20 ]; then
            echo "... and more"
        fi
    else
        echo -e "${GREEN}✓ No matches found${NC}"
    fi
}

# Check for various patterns
check_pattern "sk-[a-zA-Z0-9]{48}" "OpenAI API keys"
check_pattern "AC[a-z0-9]{32}" "Twilio Account SIDs"
check_pattern "SK[a-z0-9]{32}" "Twilio Auth Tokens"
check_pattern "(api[_-]?key|apikey|api_secret|access[_-]?token|auth[_-]?token).*[:=].*['\"][a-zA-Z0-9\-_]{20,}['\"]" "Generic API keys"
check_pattern "service_role.*['\"][a-zA-Z0-9\-_\.]{100,}['\"]" "Supabase service keys"
check_pattern "anon.*['\"][a-zA-Z0-9\-_\.]{100,}['\"]" "Supabase anon keys"
check_pattern "(password|passwd|pwd).*[:=].*['\"][^'\"]{8,}['\"]" "Hardcoded passwords"
check_pattern "turn:.*@[a-zA-Z0-9\.\-]+:[0-9]+" "TURN server URLs with credentials"
check_pattern "(secret|private[_-]?key).*[:=].*['\"][a-zA-Z0-9\-_]{20,}['\"]" "Secret keys"

echo -e "\n${YELLOW}Checking for test tokens that should use environment variables...${NC}"
grep -r "demo-token\|test-token" . \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude-dir=build \
    --exclude="check-for-secrets.sh" \
    --include="*.js" \
    --include="*.ts" \
    --include="*.tsx" \
    2>/dev/null | grep -v "process.env" | head -10

echo -e "\n${YELLOW}Checking for hardcoded URLs that should be environment variables...${NC}"
grep -r "https\?://[a-zA-Z0-9\.\-]+\.(com|io|net|org|ai|co)" . \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    --exclude-dir=build \
    --exclude="check-for-secrets.sh" \
    --exclude="*.md" \
    --include="*.js" \
    --include="*.ts" \
    --include="*.tsx" \
    2>/dev/null | grep -v "process.env" | grep -v "example.com" | grep -v "localhost" | head -20

echo -e "\n${GREEN}Scan complete!${NC}"
echo "============================================"
echo "Note: Some results may be false positives. Review each finding carefully."
echo "Consider using tools like 'git-secrets' or 'truffleHog' for more comprehensive scanning."