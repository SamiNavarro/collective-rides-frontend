#!/bin/bash

# Seed Attaquer Rides
# Creates fresh test rides for Attaquer.cc

set -e

echo "=========================================="
echo "Seeding Attaquer Rides"
echo "=========================================="
echo ""

API_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"
CLIENT_ID="760idnu1d0mul2o10lut6rt7la"

# testuser2 is captain of Attaquer
ADMIN_EMAIL="testuser2@test.com"
ADMIN_PASSWORD="TestPassword123!"

echo "🔑 Getting admin token..."
AUTH_RESPONSE=$(aws cognito-idp initiate-auth \
  --client-id "$CLIENT_ID" \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME="$ADMIN_EMAIL",PASSWORD="$ADMIN_PASSWORD" \
  --region us-east-2 \
  --output json 2>&1)

ADMIN_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.IdToken // empty')

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Error: Failed to get token"
  exit 1
fi

echo "✅ Token obtained"
echo ""

# Attaquer club ID
CLUB_ID="attaquercc"

# Calculate future dates
TOMORROW=$(date -u -v+1d +"%Y-%m-%dT09:00:00Z" 2>/dev/null || date -u -d "+1 day" +"%Y-%m-%dT09:00:00Z")
NEXT_WEEK=$(date -u -v+7d +"%Y-%m-%dT08:00:00Z" 2>/dev/null || date -u -d "+7 days" +"%Y-%m-%dT08:00:00Z")
TWO_WEEKS=$(date -u -v+14d +"%Y-%m-%dT07:00:00Z" 2>/dev/null || date -u -d "+14 days" +"%Y-%m-%dT07:00:00Z")

echo "=========================================="
echo "Creating Attaquer Rides"
echo "=========================================="
echo ""

# Ride 1: Morning Coffee Ride
echo "1. Creating 'Morning Coffee Ride'..."
RIDE1=$(curl -s -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Morning Coffee Ride\",
    \"description\": \"Easy social ride to our favorite cafe. Perfect for beginners!\",
    \"rideType\": \"social\",
    \"difficulty\": \"beginner\",
    \"startDateTime\": \"$TOMORROW\",
    \"estimatedDuration\": 7200,
    \"maxParticipants\": 15,
    \"meetingPoint\": {
      \"name\": \"Sydney Opera House\",
      \"address\": \"Bennelong Point, Sydney NSW 2000\",
      \"coordinates\": {
        \"latitude\": -33.8568,
        \"longitude\": 151.2153
      },
      \"instructions\": \"Meet at the main entrance\"
    },
    \"route\": {
      \"name\": \"Harbour Bridge Loop\",
      \"type\": \"basic\",
      \"distance\": 25000,
      \"difficulty\": \"beginner\"
    },
    \"isPublic\": false,
    \"allowWaitlist\": true
  }" \
  "$API_URL/v1/clubs/$CLUB_ID/rides")

RIDE1_ID=$(echo "$RIDE1" | jq -r '.data.rideId // empty')

if [ -n "$RIDE1_ID" ]; then
  echo "   ✅ Created: $RIDE1_ID"
  curl -s -X PUT -H "Authorization: Bearer $ADMIN_TOKEN" "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE1_ID/publish" > /dev/null
  echo "   ✅ Published"
else
  echo "   ❌ Failed: $RIDE1"
fi

echo ""

# Ride 2: Weekend Training Ride
echo "2. Creating 'Weekend Training Ride'..."
RIDE2=$(curl -s -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Weekend Training Ride\",
    \"description\": \"Moderate pace training ride through the Northern Beaches.\",
    \"rideType\": \"training\",
    \"difficulty\": \"intermediate\",
    \"startDateTime\": \"$NEXT_WEEK\",
    \"estimatedDuration\": 10800,
    \"maxParticipants\": 20,
    \"meetingPoint\": {
      \"name\": \"Manly Wharf\",
      \"address\": \"Manly NSW 2095\",
      \"coordinates\": {
        \"latitude\": -33.7969,
        \"longitude\": 151.2840
      },
      \"instructions\": \"Meet at the ferry terminal\"
    },
    \"route\": {
      \"name\": \"Northern Beaches Loop\",
      \"type\": \"basic\",
      \"distance\": 65000,
      \"difficulty\": \"intermediate\"
    },
    \"isPublic\": false,
    \"allowWaitlist\": true
  }" \
  "$API_URL/v1/clubs/$CLUB_ID/rides")

RIDE2_ID=$(echo "$RIDE2" | jq -r '.data.rideId // empty')

if [ -n "$RIDE2_ID" ]; then
  echo "   ✅ Created: $RIDE2_ID"
  curl -s -X PUT -H "Authorization: Bearer $ADMIN_TOKEN" "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE2_ID/publish" > /dev/null
  echo "   ✅ Published"
else
  echo "   ❌ Failed: $RIDE2"
fi

echo ""

# Ride 3: Advanced Hill Climb
echo "3. Creating 'Advanced Hill Climb'..."
RIDE3=$(curl -s -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Advanced Hill Climb Challenge\",
    \"description\": \"Challenging ride with significant elevation. For experienced riders only.\",
    \"rideType\": \"competitive\",
    \"difficulty\": \"advanced\",
    \"startDateTime\": \"$TWO_WEEKS\",
    \"estimatedDuration\": 14400,
    \"maxParticipants\": 12,
    \"meetingPoint\": {
      \"name\": \"Bobbin Head\",
      \"address\": \"Ku-ring-gai Chase Rd, Bobbin Head NSW 2084\",
      \"coordinates\": {
        \"latitude\": -33.6500,
        \"longitude\": 151.1500
      },
      \"instructions\": \"Meet at the car park\"
    },
    \"route\": {
      \"name\": \"Bobbin Head to West Head\",
      \"type\": \"basic\",
      \"distance\": 85000,
      \"difficulty\": \"advanced\"
    },
    \"isPublic\": false,
    \"allowWaitlist\": true
  }" \
  "$API_URL/v1/clubs/$CLUB_ID/rides")

RIDE3_ID=$(echo "$RIDE3" | jq -r '.data.rideId // empty')

if [ -n "$RIDE3_ID" ]; then
  echo "   ✅ Created: $RIDE3_ID"
  curl -s -X PUT -H "Authorization: Bearer $ADMIN_TOKEN" "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE3_ID/publish" > /dev/null
  echo "   ✅ Published"
else
  echo "   ❌ Failed: $RIDE3"
fi

echo ""
echo "=========================================="
echo "✅ Attaquer Rides Created!"
echo "=========================================="
echo ""
echo "Refresh /rides page to see them!"
echo ""
