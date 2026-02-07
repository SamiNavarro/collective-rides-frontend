#!/bin/bash

# Create one test ride and show full response

set -e

CLUB_ID="attaquercc"
API_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"

# Get Alice's token
echo "Getting Alice's token..."
ALICE_EMAIL="alice.admin@example.com"
ALICE_PASSWORD="TestPassword123!"

USER_POOL_ID="us-east-2_t5UUpOmPL"
CLIENT_ID="760idnu1d0mul2o10lut6rt7la"

AUTH_RESPONSE=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id "$CLIENT_ID" \
  --auth-parameters "USERNAME=$ALICE_EMAIL,PASSWORD=$ALICE_PASSWORD" \
  --region us-east-2 \
  --output json 2>/dev/null)

TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.IdToken')

echo "✅ Got token"
echo ""

# Create ride
TOMORROW=$(date -u -v+2d +"%Y-%m-%dT10:00:00Z")
echo "Creating ride for: $TOMORROW"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/v1/clubs/$CLUB_ID/rides" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Test Ride - $(date +%H:%M:%S)\",
    \"description\": \"Test ride for debugging\",
    \"rideType\": \"group_ride\",
    \"startDateTime\": \"$TOMORROW\",
    \"estimatedDuration\": 180,
    \"distance\": 50,
    \"elevationGain\": 300,
    \"difficulty\": \"moderate\",
    \"maxParticipants\": 20,
    \"meetingPoint\": {
      \"name\": \"Attaquer HQ\",
      \"address\": \"123 Main St, Sydney\"
    }
  }")

echo "Full Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Extract ride ID
RIDE_ID=$(echo "$RESPONSE" | jq -r '.data.rideId // .data.id // empty')

if [ -z "$RIDE_ID" ]; then
  echo "❌ Could not extract ride ID"
  echo "Trying alternate paths..."
  echo "data.data.rideId: $(echo "$RESPONSE" | jq -r '.data.data.rideId // empty')"
  echo "rideId: $(echo "$RESPONSE" | jq -r '.rideId // empty')"
  exit 1
fi

echo "✅ Created ride: $RIDE_ID"
echo ""

# Publish it
echo "Publishing ride..."
PUBLISH_RESPONSE=$(curl -s -X POST "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE_ID/publish" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}")

echo "Publish Response:"
echo "$PUBLISH_RESPONSE" | jq '.'
echo ""
echo "✅ Done!"
