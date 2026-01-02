#!/bin/bash

# Strava Environment Configuration Script
# Configures Strava OAuth credentials for backend deployment
# Version: 1.0
# Last Updated: January 2, 2026

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Strava Configuration Values
STRAVA_CLIENT_ID="193122"
STRAVA_CLIENT_SECRET="c27a5702e86a313def68600b239cfe51b5187fc6"
STRAVA_REDIRECT_URI="https://collective-rides-frontend.vercel.app/auth/strava/callback"
STRAVA_WEBHOOK_VERIFY_TOKEN="b532706503d7188cb8c00047fb60ae0930d84fc9"

print_status "Configuring Strava environment variables for backend deployment..."

# Export environment variables for current session
export STRAVA_CLIENT_ID="$STRAVA_CLIENT_ID"
export STRAVA_CLIENT_SECRET="$STRAVA_CLIENT_SECRET"
export STRAVA_REDIRECT_URI="$STRAVA_REDIRECT_URI"
export STRAVA_WEBHOOK_VERIFY_TOKEN="$STRAVA_WEBHOOK_VERIFY_TOKEN"

print_success "Environment variables exported for current session"

# Display configuration summary
echo
print_status "Strava Configuration Summary:"
echo "  Client ID: $STRAVA_CLIENT_ID"
echo "  Client Secret: ${STRAVA_CLIENT_SECRET:0:8}... (truncated for security)"
echo "  Redirect URI: $STRAVA_REDIRECT_URI"
echo "  Webhook Token: ${STRAVA_WEBHOOK_VERIFY_TOKEN:0:8}... (truncated for security)"
echo

# Check if AWS CLI is available for parameter store
if command -v aws >/dev/null 2>&1; then
    print_status "AWS CLI detected. Would you like to store these in AWS Systems Manager Parameter Store? (y/n)"
    read -r store_in_aws
    
    if [[ $store_in_aws =~ ^[Yy]$ ]]; then
        print_status "Storing Strava credentials in AWS Systems Manager Parameter Store..."
        
        # Store in Parameter Store with encryption
        aws ssm put-parameter \
            --name "/sydney-cycles/development/strava/client-id" \
            --value "$STRAVA_CLIENT_ID" \
            --type "String" \
            --overwrite \
            --description "Strava OAuth Client ID for Collective Rides"
        
        aws ssm put-parameter \
            --name "/sydney-cycles/development/strava/client-secret" \
            --value "$STRAVA_CLIENT_SECRET" \
            --type "SecureString" \
            --overwrite \
            --description "Strava OAuth Client Secret for Collective Rides"
        
        aws ssm put-parameter \
            --name "/sydney-cycles/development/strava/redirect-uri" \
            --value "$STRAVA_REDIRECT_URI" \
            --type "String" \
            --overwrite \
            --description "Strava OAuth Redirect URI for Collective Rides"
        
        aws ssm put-parameter \
            --name "/sydney-cycles/development/strava/webhook-verify-token" \
            --value "$STRAVA_WEBHOOK_VERIFY_TOKEN" \
            --type "SecureString" \
            --overwrite \
            --description "Strava Webhook Verification Token for Collective Rides"
        
        print_success "Strava credentials stored in AWS Systems Manager Parameter Store"
        print_warning "Update your CDK infrastructure to read from Parameter Store for production security"
    fi
else
    print_warning "AWS CLI not found. Credentials are only set for current session."
fi

# Test webhook endpoint with the verification token
print_status "Testing webhook endpoint with verification token..."
WEBHOOK_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/integrations/strava/webhook"
TEST_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/webhook_test.json \
    "$WEBHOOK_URL?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=$STRAVA_WEBHOOK_VERIFY_TOKEN")

if [ "$TEST_RESPONSE" = "200" ]; then
    print_success "Webhook endpoint test successful!"
    echo "Response: $(cat /tmp/webhook_test.json)"
else
    print_warning "Webhook endpoint test returned HTTP $TEST_RESPONSE"
    echo "This is expected if the backend hasn't been redeployed with the new environment variables yet."
fi

# Clean up test file
rm -f /tmp/webhook_test.json

echo
print_status "Next Steps:"
echo "1. Deploy the backend with the new environment variables:"
echo "   cd backend && npx cdk deploy --require-approval never"
echo
echo "2. Add NEXT_PUBLIC_STRAVA_CLIENT_ID to Vercel environment variables:"
echo "   NEXT_PUBLIC_STRAVA_CLIENT_ID=$STRAVA_CLIENT_ID"
echo
echo "3. Configure Strava Developer Application with these settings:"
echo "   - Authorization Callback URL: $STRAVA_REDIRECT_URI"
echo "   - Webhook Endpoint: $WEBHOOK_URL"
echo
echo "4. Test the complete OAuth flow from frontend to backend"

print_success "Strava environment configuration completed!"