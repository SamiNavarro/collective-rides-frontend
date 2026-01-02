#!/bin/bash

# Node.js Runtime Update Deployment Script
# Updates all Lambda functions from Node.js 18.x/20.x to Node.js 24.x

set -e  # Exit on any error

echo "🚀 Starting Node.js Runtime Update Deployment"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "cdk.json" ]; then
    echo "❌ Error: Must run from backend/infrastructure directory"
    echo "   Current directory: $(pwd)"
    echo "   Expected: .../backend/infrastructure"
    exit 1
fi

# Check AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ Error: AWS CLI not configured or no valid credentials"
    echo "   Please run 'aws configure' or set AWS credentials"
    exit 1
fi

# Check CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ Error: AWS CDK not installed"
    echo "   Please install with: npm install -g aws-cdk"
    exit 1
fi

echo "✅ Pre-deployment checks passed"
echo ""

# Show current Lambda functions with Node.js 20.x (should be 7 functions)
echo "📋 Checking current Node.js 20.x functions..."
NODEJS_20_FUNCTIONS=$(aws lambda list-functions --query "Functions[?Runtime=='nodejs20.x'].FunctionName" --output text 2>/dev/null || echo "")

if [ -n "$NODEJS_20_FUNCTIONS" ]; then
    echo "   Found Node.js 20.x functions:"
    echo "$NODEJS_20_FUNCTIONS" | tr '\t' '\n' | sed 's/^/   - /'
else
    echo "   No Node.js 20.x functions found"
fi

echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""

# Deploy the changes
echo "🚀 Deploying infrastructure changes..."
echo "   This will update all Lambda functions to Node.js 24.x"
echo ""

# Deploy with progress
npm run deploy

echo ""

# Verify deployment
echo "🔍 Verifying deployment..."

# Check for any remaining Node.js 20.x functions
REMAINING_20X=$(aws lambda list-functions --query "Functions[?Runtime=='nodejs20.x'].FunctionName" --output text 2>/dev/null || echo "")

if [ -n "$REMAINING_20X" ]; then
    echo "⚠️  Warning: Some functions still using Node.js 20.x:"
    echo "$REMAINING_20X" | tr '\t' '\n' | sed 's/^/   - /'
    echo ""
fi

# Show all Node.js functions and their runtimes
echo "📊 Current Node.js Lambda function runtimes:"
aws lambda list-functions --query "Functions[?starts_with(Runtime, 'nodejs')].{Name:FunctionName,Runtime:Runtime}" --output table

echo ""

# Success summary
if [ -z "$REMAINING_20X" ]; then
    echo "✅ SUCCESS: All Lambda functions updated to Node.js 24.x"
    echo ""
    echo "🎉 Node.js runtime update completed successfully!"
    echo "   - All functions now use Node.js 24.x (supported until April 2028)"
    echo "   - No more deprecation warnings for Node.js 20.x"
    echo "   - Improved performance and security"
else
    echo "⚠️  PARTIAL SUCCESS: Some functions still need manual update"
    echo "   Please check the functions listed above"
fi

echo ""
echo "📝 Next steps:"
echo "   1. Test all API endpoints to ensure functionality"
echo "   2. Monitor CloudWatch logs for any runtime issues"
echo "   3. Update documentation with new runtime versions"
echo ""
echo "🔗 Useful commands:"
echo "   - Check function runtimes: aws lambda list-functions --query \"Functions[?starts_with(Runtime, 'nodejs')].{Name:FunctionName,Runtime:Runtime}\" --output table"
echo "   - View deployment logs: Check CloudFormation console for SydneyCyclesStack"
echo ""
echo "Deployment completed at: $(date)"