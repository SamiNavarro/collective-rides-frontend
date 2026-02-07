#!/bin/bash

# Create future published rides for Attaquer CC for testing

set -e

CLUB_ID="attaquercc"
API_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"

# Get Alice's token (she's an owner of Attaquer CC)
echo "Getting Alice's token..."
ALICE_EMAIL="alice.admin@example.com"
ALICE_PASSWORD="TestPassword123!"

# Authenticate with Cognito
USER_POOL_ID="us-east-2_t5UUpOmPL"
CLIENT_ID="760idnu1d0mul2o10lut6rt7la"

AUTH_RESPONSE=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id "$CLIENT_ID" \
  --auth-parameters "USERNAME=$ALICE_EMAIL,PASSWORD=$ALICE_PASSWORD" \
  --region us-east-2 \
  --output json 2>/dev/null)

if [ $? -ne 0 ]; then
  echo "❌ Failed to authenticate Alice"
  exit 1
fi

TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.IdToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Failed to get token"
  exit 1
fi

echo "✅ Got Alice's token"

# Create 3 future rides
echo ""
echo "Creating future rides..."

# Ride 1: Tomorrow morning
TOMORROW=$(date -u -v+1d +"%Y-%m-%dT09:00:00Z")
echo ""
echo "1. Creating ride for tomorrow..."
RIDE1=$(curl -s -X POST "$API_URL/v1/clubs/$CLUB_ID/rides" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Morning Coffee Ride\",
    \"description\": \"Easy-paced ride to our favorite cafe\",
    \"startDateTime\": \"$TOMORROW\",
    \"distance\": 45,
    \"elevationGain\": 200,
    \"difficulty\": \"easy\",
    \"maxParticipants\": 20,
    \"meetingPoint\": \"Attaquer HQ\",
    \"route\": {
      \"name\": \"Coffee Loop\",
      \"description\": \"Scenic route through the city\"
    }
  }")

RIDE1_ID=$(echo "$RIDE1" | jq -r '.data.rideId')
echo "Created ride: $RIDE1_ID"

# Publish it
echo "Publishing ride..."
curl -s -X POST "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE1_ID/publish" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}" > /dev/null
echo "✅ Published"

# Ride 2: This weekend
WEEKEND=$(date -u -v+sat +"%Y-%m-%dT08:00:00Z")
echo ""
echo "2. Creating ride for this weekend..."
RIDE2=$(curl -s -X POST "$API_URL/v1/clubs/$CLUB_ID/rides" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Weekend Warriors Ride\",
    \"description\": \"Challenging ride for experienced cyclists\",
    \"startDateTime\": \"$WEEKEND\",
    \"distance\": 80,
    \"elevationGain\": 800,
    \"difficulty\": \"hard\",
    \"maxParticipants\": 15,
    \"meetingPoint\": \"Attaquer HQ\",
    \"route\": {
      \"name\": \"Hill Climb Challenge\",
      \"description\": \"Tough climbs with rewarding views\"
    }
  }")

RIDE2_ID=$(echo "$RIDE2" | jq -r '.data.rideId')
echo "Created ride: $RIDE2_ID"

# Publish it
echo "Publishing ride..."
curl -s -X POST "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE2_ID/publish" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}" > /dev/null
echo "✅ Published"

# Ride 3: Next week
NEXT_WEEK=$(date -u -v+7d +"%Y-%m-%dT18:00:00Z")
echo ""
echo "3. Creating ride for next week..."
RIDE3=$(curl -s -X POST "$API_URL/v1/clubs/$CLUB_ID/rides" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Evening Social Ride\",
    \"description\": \"Relaxed evening ride followed by dinner\",
    \"startDateTime\": \"$NEXT_WEEK\",
    \"distance\": 35,
    \"elevationGain\": 150,
    \"difficulty\": \"easy\",
    \"maxParticipants\": 25,
    \"meetingPoint\": \"Attaquer HQ\",
    \"route\": {
      \"name\": \"Sunset Loop\",
      \"description\": \"Beautiful evening ride along the coast\"
    }
  }")

RIDE3_ID=$(echo "$RIDE3" | jq -r '.data.rideId')
echo "Created ride: $RIDE3_ID"

# Publish it
echo "Publishing ride..."
curl -s -X POST "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE3_ID/publish" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{}" > /dev/null
echo "✅ Published"

echo ""
echo "=========================================="
echo "✅ Created 3 future published rides!"
echo "=========================================="
echo ""
echo "Rides:"
echo "1. Morning Coffee Ride - $TOMORROW"
echo "2. Weekend Warriors Ride - $WEEKEND"
echo "3. Evening Social Ride - $NEXT_WEEK"
echo ""
echo "You can now test these on:"
echo "https://collective-rides-frontend.vercel.app/clubs/attaquercc"
