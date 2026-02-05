#!/bin/bash

# Phase 3.3 Backend Enhancement Deployment Script
# Deploys viewerParticipation field enhancement to ride-service

set -e

echo "=========================================="
echo "Phase 3.3 Backend Enhancement Deployment"
echo "=========================================="
echo ""

# Check if we're in the backend directory
if [ ! -f "cdk.json" ]; then
  echo "❌ Error: Must run from backend directory"
  exit 1
fi

# Check AWS credentials
echo "🔍 Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
  echo "❌ Error: AWS credentials not configured"
  exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account: $ACCOUNT_ID"
echo ""

# Confirm deployment
echo "📦 Changes to deploy:"
echo "  - ride-service: get-ride handler (viewerParticipation field)"
echo ""
read -p "Deploy to production? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Deployment cancelled"
  exit 0
fi

echo ""
echo "🚀 Starting deployment..."
echo ""

# Bootstrap CDK (if needed)
echo "📋 Bootstrapping CDK..."
npx cdk bootstrap

# Synthesize CloudFormation template
echo "🔨 Synthesizing CloudFormation template..."
npx cdk synth

# Deploy
echo "🚀 Deploying to AWS..."
npx cdk deploy --require-approval never

echo ""
echo "=========================================="
echo "✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Run test script: ./scripts/test-phase-3.3-backend.sh"
echo "2. Verify viewerParticipation field in ride detail response"
echo "3. Test with frontend Phase 3.3.1"
echo ""
