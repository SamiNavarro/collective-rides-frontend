#!/bin/bash

# Deploy CORS Fix for Vercel
# This script deploys the backend with updated CORS headers to fix Vercel access

set -e

echo "🚀 Deploying Backend CORS Fix"
echo "=============================="
echo ""

# Check if we're in the backend directory
if [ ! -f "cdk.json" ]; then
    echo "❌ Error: Must run from backend directory"
    echo "   Run: cd backend && ./scripts/deploy-cors-fix.sh"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ Error: AWS credentials not configured"
    echo "   Run: aws configure"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Building TypeScript..."
npm run build

echo ""
echo "☁️  Deploying to AWS..."
echo "   This will take 5-10 minutes..."
echo ""

# Deploy the stack
npx cdk deploy --require-approval never

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "🧪 Testing CORS..."
echo "   Try accessing My Clubs on Vercel now"
echo "   URL: https://collective-rides-frontend.vercel.app/my-clubs"
echo ""
echo "📝 What was fixed:"
echo "   - Lambda functions now return proper CORS headers"
echo "   - Vercel origin is explicitly allowed"
echo "   - Access-Control-Allow-Credentials: true added"
echo ""
echo "🎉 Done!"
