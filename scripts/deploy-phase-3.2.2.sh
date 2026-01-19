#!/bin/bash

# Phase 3.2.2 Deployment Script
# Quick deployment to Vercel for club directory integration

set -e

echo "🚀 Phase 3.2.2 Deployment"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Run tests first
echo -e "${BLUE}Running tests...${NC}"
node scripts/test-phase-3.2.2-directory.js

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Tests failed. Fix errors before deploying.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All tests passed${NC}"
echo ""

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${BLUE}Committing changes...${NC}"
    git add .
    git commit -m "feat: Phase 3.2.2 - Real club directory integration

- Added discovery method to API client
- Created useClubsDiscovery React Query hook
- Integrated real backend data in directory page
- Added loading, error, and empty states
- Implemented client-side filtering
- All tests passing (12/12)
"
    echo -e "${GREEN}✅ Changes committed${NC}"
else
    echo -e "${BLUE}No uncommitted changes${NC}"
fi

echo ""
echo -e "${BLUE}Pushing to GitHub...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Pushed to GitHub${NC}"
    echo ""
    echo "🎉 Deployment initiated!"
    echo ""
    echo "Vercel will automatically deploy your changes."
    echo ""
    echo "📊 Check deployment status:"
    echo "   https://vercel.com/dashboard"
    echo ""
    echo "🧪 After deployment, test:"
    echo "   1. Navigate to /clubs/directory"
    echo "   2. Verify clubs load from backend"
    echo "   3. Test all filters"
    echo "   4. Check mobile responsiveness"
    echo ""
    echo "📖 Full deployment guide:"
    echo "   docs/phase-3.2.2-deployment-guide.md"
else
    echo -e "${YELLOW}Failed to push to GitHub${NC}"
    echo "Please check your Git configuration and try again."
    exit 1
fi
