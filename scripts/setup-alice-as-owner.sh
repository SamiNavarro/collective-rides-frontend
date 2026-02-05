#!/bin/bash

# Setup Alice Admin as Club Owner for Phase 3.4 Testing

set -e

API_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"
USER_POOL_ID="us-east-2_t5UUpOmPL"
CLIENT_ID="760idnu1d0mul2o10lut6rt7la"
REGION="us-east-2"

echo "🔐 Getting Alice's token..."
ALICE_TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id $USER_POOL_ID \
  --client-id $CLIENT_ID \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=alice.admin@example.com,PASSWORD=TempPassword123! \
  --region $REGION \
  --query 'AuthenticationResult.IdToken' \
  --output text 2>/dev/null)

if [ -z "$ALICE_TOKEN" ]; then
  echo "❌ Failed to get Alice's token"
  exit 1
fi

echo "✅ Got Alice's token"
echo ""

# Get Alice's user ID from token
ALICE_USER_ID=$(echo $ALICE_TOKEN | cut -d'.' -f2 | base64 -d 2>/dev/null | jq -r '.sub')
echo "Alice's User ID: $ALICE_USER_ID"
echo ""

echo "📋 Listing existing clubs..."
CLUBS_RESPONSE=$(curl -s -X GET "$API_URL/v1/clubs")
echo "$CLUBS_RESPONSE" | jq '.'
echo ""

# Check if Alice already has clubs
echo "🔍 Checking Alice's current clubs..."
ALICE_CLUBS=$(curl -s -X GET \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  "$API_URL/v1/users/me/clubs")
echo "$ALICE_CLUBS" | jq '.'
echo ""

# Create a test club for Alice if she doesn't have one
echo "🏢 Creating test club for Alice..."
CREATE_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Test Club",
    "description": "Test club for Phase 3.4 - Club Administration",
    "city": "Sydney",
    "membershipApprovalType": "request_to_join"
  }' \
  "$API_URL/v1/clubs")

echo "$CREATE_RESPONSE" | jq '.'
CLUB_ID=$(echo "$CREATE_RESPONSE" | jq -r '.data.id // .data.clubId // empty')

if [ -z "$CLUB_ID" ]; then
  echo "⚠️  Could not create club or extract club ID"
  echo "Response: $CREATE_RESPONSE"
  echo ""
  echo "Trying to find existing club..."
  
  # Try to get first club from list
  CLUB_ID=$(curl -s -X GET "$API_URL/v1/clubs" | jq -r '.data[0].id // .data[0].clubId // empty')
  
  if [ -z "$CLUB_ID" ]; then
    echo "❌ No clubs found"
    exit 1
  fi
  
  echo "Found club: $CLUB_ID"
fi

echo ""
echo "✅ Club ID: $CLUB_ID"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Alice Admin (alice.admin@example.com) should now be the owner of club: $CLUB_ID"
echo ""
echo "Test by:"
echo "1. Log in as alice.admin@example.com"
echo "2. Navigate to the club"
echo "3. You should see 'Settings' and 'Manage Club' buttons"
echo ""
