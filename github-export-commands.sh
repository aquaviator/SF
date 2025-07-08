#!/bin/bash
# GitHub Export Commands for ShiftFlo
# Run these commands in your Replit shell

echo "🔧 Starting GitHub export process..."

# Step 1: Clear any git locks
rm -f .git/index.lock

# Step 2: Check current git status
echo "📋 Checking git status..."
git status

# Step 3: Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "🔄 Initializing git repository..."
    git init
fi

# Step 4: Add all files to staging
echo "📦 Adding all files to staging..."
git add .

# Step 5: Commit any unstaged changes
echo "💾 Committing changes..."
git commit -m "Complete ShiftFlo workforce management system - ready for deployment"

# Step 6: Connect to GitHub remote
echo "🔗 Connecting to GitHub remote..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/aquaviator/SF.git

# Step 7: Fetch from remote
echo "📡 Fetching from remote..."
git fetch origin

# Step 8: Create or switch to test branch
echo "🌿 Creating/switching to test branch..."
git checkout -B test

# Step 9: Push to test branch
echo "🚀 Pushing to test branch..."
git push origin test --force

echo "✅ Export complete! Your ShiftFlo app is now on GitHub test branch."