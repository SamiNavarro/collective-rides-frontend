#!/bin/bash

# Phase 2.5 Deployment Script
# Deploys ride completion and Strava integration functionality

set -e

echo "🚀 Starting Phase 2.5 deployment..."

# Check if we're in the backend directory
if [ ! -f "cdk.json" ]; then
    echo "❌ Error: Must run from backend directory"
    exit 1
fi

# Check for required environment variables
if [ -z "$STRAVA_CLIENT_ID" ] || [ -z "$STRAVA_CLIENT_SECRET" ]; then
    echo "⚠️  Warning: Strava environment variables not set"
    echo "   Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET for full functionality"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Deploy infrastructure
echo "🏗️  Deploying infrastructure..."
npm run deploy

# Check deployment status
echo "✅ Phase 2.5 deployment completed!"
echo ""
echo "📋 Deployment Summary:"
echo "   ✅ Ride completion handlers deployed"
echo "   ✅ Attendance tracking handlers deployed"
echo "   ✅ Strava OAuth integration deployed"
echo "   ✅ Strava webhook handler deployed"
echo "   ✅ Manual evidence linking deployed"
echo ""

if [ -n "$STRAVA_CLIENT_ID" ]; then
    echo "🔗 Strava Integration:"
    echo "   ✅ OAuth configured"
    echo "   📝 Remember to configure webhook subscription in Strava"
else
    echo "⚠️  Strava Integration:"
    echo "   ❌ OAuth not configured (missing environment variables)"
    echo "   📝 Set STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET then redeploy"
fi

echo ""
echo "🎯 Next Steps:"
echo "   1. Test ride completion workflow"
echo "   2. Test attendance tracking"
echo "   3. Configure Strava webhook subscription"
echo "   4. Test Strava OAuth flow"
echo "   5. Run Phase 2.5 test suite"
echo ""
echo "📚 Documentation: .kiro/specs/phase-2.5.ride-completion-evidence.v1.md"