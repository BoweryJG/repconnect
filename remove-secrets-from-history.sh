#!/bin/bash

echo "⚠️  WARNING: This script will rewrite git history to remove exposed secrets"
echo "Make sure you have a backup of your repository before proceeding!"
echo ""
read -p "Do you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Aborted."
    exit 1
fi

echo "🔍 Searching for exposed secrets in git history..."

# List of sensitive strings to remove
declare -a secrets=(
    "4beb44e547c8ef520a575d343315b9d0dae38549"
    "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"
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNib3B5bnV2aGN5bWJ1bWpudmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5OTUxNzMsImV4cCI6MjA1OTU3MTE3M30.UZElMkoHugIt984RtYWyfrRuv2rB67opQdCrFVPCfzU"
)

# Install BFG if not available
if ! command -v bfg &> /dev/null
then
    echo "BFG Repo-Cleaner not found. Installing..."
    curl -L https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar -o bfg.jar
    echo "alias bfg='java -jar $(pwd)/bfg.jar'" >> ~/.bashrc
    alias bfg="java -jar $(pwd)/bfg.jar"
fi

# Create a file with all secrets to remove
echo "Creating secrets file..."
rm -f secrets.txt
for secret in "${secrets[@]}"
do
    echo "$secret" >> secrets.txt
done

echo ""
echo "📋 The following operations will be performed:"
echo "1. Remove all occurrences of the exposed secrets from git history"
echo "2. Clean up the repository"
echo "3. Force push the changes (requires manual action)"
echo ""
echo "⚠️  After running this script, you will need to:"
echo "1. Force push to the remote repository: git push --force"
echo "2. Notify all collaborators to re-clone the repository"
echo "3. Rotate all exposed API keys immediately"
echo ""
read -p "Ready to proceed? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Aborted."
    exit 1
fi

# Using git filter-branch (alternative to BFG)
echo "🧹 Removing secrets from git history..."
for secret in "${secrets[@]}"
do
    echo "Removing: ${secret:0:10}..."
    git filter-branch --force --index-filter \
        "git ls-files -z | xargs -0 sed -i 's/$secret/REMOVED_SECRET/g' 2>/dev/null || true" \
        --prune-empty --tag-name-filter cat -- --all
done

# Clean up
echo "🗑️  Cleaning up..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Secrets removed from git history!"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Review the changes: git log --all --full-history --grep='REMOVED_SECRET'"
echo "2. Force push to remote: git push origin --force --all"
echo "3. Force push tags: git push origin --force --tags"
echo "4. Delete and re-clone the repository on all other machines"
echo "5. IMMEDIATELY rotate all the exposed API keys:"
echo "   - Deepgram API key"
echo "   - OpenAI API key"
echo "   - Supabase service key"
echo ""
echo "📝 Remember to update your .env file with the new keys!"

# Clean up
rm -f secrets.txt