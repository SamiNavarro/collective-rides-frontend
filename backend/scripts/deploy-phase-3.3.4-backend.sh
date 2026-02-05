#!/bin/bash

# Phase 3.3.4 Backend Deployment Script
# Deploys update-ride and cancel-ride endpoints

set -e

echo "========================================="
echo "Phase 3.3.4 Backend Deployment"
echo "Update & Cancel Ride Endpoints"
echo "========================================="
echo ""

# Check we're in the backend directory
if [ ! -f "cdk.json" ]; then
  echo "Error: Must run from backend directory"
  exit 1
fi

# Check AWS credentials
echo "Checking AWS credentials..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
  echo "Error: AWS credentials not configured"
  exit 1
fi

echo "✓ AWS credentials configured"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
  echo ""
fi

# Build TypeScript
echo "Building TypeScript..."
npm run build
echo ""

# Synthesize CDK
echo "Synthesizing CDK stack..."
npx cdk synth
echo ""

# Deploy
echo "Deploying to AWS..."
echo "This will create/update:"
echo "  - Lambda: sydney-cycles-update-ride-dev"
echo "  - Lambda: sydney-cycles-cancel-ride-dev"
echo "  - API Route: PUT /v1/clubs/{clubId}/rides/{rideId}"
echo "  - API Route: DELETE /v1/clubs/{clubId}/rides/{rideId}"
echo ""

npx cdk deploy --require-approval never

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "New endpoints available:"
echo "  PUT    /v1/clubs/{clubId}/rides/{rideId}  - Update ride"
echo "  DELETE /v1/clubs/{clubId}/rides/{rideId}  - Cancel ride"
echo ""
echo "Next steps:"
echo "1. Test update endpoint with curl or Postman"
echo "2. Test cancel endpoint with curl or Postman"
echo "3. Test frontend edit functionality"
echo "4. Test frontend cancel functionality"
echo ""
echo "See docs/phase-3.3.4-backend-missing-endpoints.md for testing guide"
echo ""
