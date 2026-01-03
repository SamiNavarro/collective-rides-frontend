#!/bin/bash
echo "🧹 Cleaning all caches and rebuilding..."

# Remove build artifacts
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install

# Restart development server
echo "✅ Cleanup complete. Run 'npm run dev' to start fresh."
