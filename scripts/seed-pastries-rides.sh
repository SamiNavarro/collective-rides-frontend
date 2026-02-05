#!/bin/bash

# Seed Pastries.cc Rides Script
# Creates test rides for Pastries.cc club (cpcc)

set -e

echo "=========================================="
echo "Seeding Pastries.cc Rides"
echo "=========================================="
echo ""

API_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"
CLUB_ID="cpcc"

echo "🌐 API URL: $API_URL"
echo "🏢 Club ID: $CLUB_ID"
echo ""

# Get captain token (you need to be logged in as a captain of cpcc)
echo "🔑 Getting authentication token..."

CLIENT_ID="760idnu1d0mul2o10lut6rt7la"

# Try to get token from environment or use test user
if [ -z "$CAPTAIN_EMAIL" ]; then
  echo "Please provide CAPTAIN_EMAIL and CAPTAIN_PASSWORD as environment variables"
  echo "Example: CAPTAIN_EMAIL=your@email.com CAPTAIN_PASSWORD=yourpass ./scripts/seed-pastries-rides.sh"
  exit 1
fi

AUTH_RESPONSE=$(aws cognito-idp initiate-auth \
  --client-id "$CLIENT_ID" \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME="$CAPTAIN_EMAIL",PASSWORD="$CAPTAIN_PASSWORD" \
  --region us-east-2 \
  --output json 2>&1)

if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to authenticate"
  echo "$AUTH_RESPONSE"
  exit 1
fi

TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.IdToken // empty')

if [ -z "$TOKEN" ]; then
  echo "❌ Error: No ID token in response"
  exit 1
fi

echo "✅ Token obtained"
echo ""

# Calculate dates
TOMORROW=$(date -u -v+1d +"%Y-%m-%dT06:00:00Z" 2>/dev/null || date -u -d "+1 day" +"%Y-%m-%dT06:00:00Z")
THURSDAY=$(date -u -v+thu +"%Y-%m-%dT06:00:00Z" 2>/dev/null || date -u -d "next thursday" +"%Y-%m-%dT06:00:00Z")
SATURDAY=$(date -u -v+sat +"%Y-%m-%dT07:00:00Z" 2>/dev/null || date -u -d "next saturday" +"%Y-%m-%dT07:00:00Z")

echo "=========================================="
echo "Creating Pastries.cc Rides"
echo "=========================================="
echo ""

# Ride 1: CP Thursday
echo "1. Creating 'CP Thursday'..."
RIDE1=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"CP Thursday\",
    \"description\": \"Classic Thursday morning ride through Centennial Park. Fast-paced social ride with coffee stop at the end. All levels welcome but expect a brisk pace!\",
    \"rideType\": \"social\",
    \"difficulty\": \"intermediate\",
    \"startDateTime\": \"$THURSDAY\",
    \"estimatedDuration\": 5400,
    \"maxParticipants\": 25,
    \"meetingPoint\": {
      \"name\": \"Centennial Park - Grand Drive Gate\",
      \"address\": \"Grand Dr, Centennial Park NSW 2021\",
      \"coordinates\": {
        \"latitude\": -33.8968,
        \"longitude\": 151.2290
      },
      \"instructions\": \"Meet at the main Grand Drive entrance. We roll out promptly at 6am!\"
    },
    \"route\": {
      \"name\": \"Centennial Park Loops\",
      \"type\": \"basic\",
      \"distance\": 30000,
      \"difficulty\": \"intermediate\"
    },
    \"requirements\": {
      \"equipment\": [\"Road bike\", \"Helmet\", \"Front and rear lights\"],
      \"experience\": \"Comfortable riding in a group\",
      \"fitness\": \"Moderate fitness - we maintain 28-32km/h average\"
    },
    \"isPublic\": false,
    \"allowWaitlist\": true
  }" \
  "$API_URL/v1/clubs/$CLUB_ID/rides")

echo "   Response: $RIDE1"

RIDE1_ID=$(echo "$RIDE1" | jq -r '.data.rideId // empty')

if [ -n "$RIDE1_ID" ]; then
  echo "   ✅ Created: $RIDE1_ID"
  
  # Publish the ride
  echo "   📢 Publishing ride..."
  PUBLISH1=$(curl -s -X PUT \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE1_ID/publish")
  echo "   Response: $PUBLISH1"
  echo "   ✅ Published"
else
  echo "   ❌ Failed to create ride"
fi

echo ""

# Ride 2: Royal National Park
echo "2. Creating 'Royal National Park'..."
RIDE2=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Royal National Park\",
    \"description\": \"Epic ride through the stunning Royal National Park. Challenging climbs with breathtaking coastal views. This is a proper workout - bring plenty of water and nutrition!\",
    \"rideType\": \"training\",
    \"difficulty\": \"advanced\",
    \"startDateTime\": \"$SATURDAY\",
    \"estimatedDuration\": 12600,
    \"maxParticipants\": 20,
    \"meetingPoint\": {
      \"name\": \"Loftus Oval\",
      \"address\": \"Loftus Ave, Loftus NSW 2232\",
      \"coordinates\": {
        \"latitude\": -34.0450,
        \"longitude\": 151.0500
      },
      \"instructions\": \"Meet at the car park. We'll do a quick bike check before rolling out.\"
    },
    \"route\": {
      \"name\": \"Royal National Park Loop\",
      \"type\": \"basic\",
      \"distance\": 75000,
      \"difficulty\": \"advanced\"
    },
    \"requirements\": {
      \"equipment\": [\"Road bike\", \"Helmet\", \"2+ water bottles\", \"Spare tubes\", \"Pump\", \"Nutrition\"],
      \"experience\": \"Experienced with long rides and climbing\",
      \"fitness\": \"High fitness level - 75km with significant elevation\"
    },
    \"isPublic\": false,
    \"allowWaitlist\": true
  }" \
  "$API_URL/v1/clubs/$CLUB_ID/rides")

RIDE2_ID=$(echo "$RIDE2" | jq -r '.data.rideId // empty')

if [ -n "$RIDE2_ID" ]; then
  echo "   ✅ Created: $RIDE2_ID"
  
  # Publish the ride
  echo "   📢 Publishing ride..."
  PUBLISH2=$(curl -s -X PUT \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE2_ID/publish")
  echo "   Response: $PUBLISH2"
  echo "   ✅ Published"
else
  echo "   ❌ Failed to create ride"
fi

echo ""

# Ride 3: Easy Sunday Roll
echo "3. Creating 'Easy Sunday Roll'..."
RIDE3=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Easy Sunday Roll\",
    \"description\": \"Relaxed Sunday morning ride along the bay. Perfect for recovery or beginners. Coffee and pastries at the end (obviously!).\",
    \"rideType\": \"social\",
    \"difficulty\": \"beginner\",
    \"startDateTime\": \"$SATURDAY\",
    \"estimatedDuration\": 7200,
    \"maxParticipants\": 30,
    \"meetingPoint\": {
      \"name\": \"Rose Bay\",
      \"address\": \"New South Head Rd, Rose Bay NSW 2029\",
      \"coordinates\": {
        \"latitude\": -33.8700,
        \"longitude\": 151.2700
      },
      \"instructions\": \"Meet at the Rose Bay ferry wharf. Easy pace, no one left behind!\"
    },
    \"route\": {
      \"name\": \"Bay Run\",
      \"type\": \"basic\",
      \"distance\": 35000,
      \"difficulty\": \"beginner\"
    },
    \"requirements\": {
      \"equipment\": [\"Any bike\", \"Helmet\"],
      \"experience\": \"All levels welcome\",
      \"fitness\": \"Casual pace - perfect for beginners\"
    },
    \"isPublic\": false,
    \"allowWaitlist\": true
  }" \
  "$API_URL/v1/clubs/$CLUB_ID/rides")

RIDE3_ID=$(echo "$RIDE3" | jq -r '.data.rideId // empty')

if [ -n "$RIDE3_ID" ]; then
  echo "   ✅ Created: $RIDE3_ID"
  
  # Publish the ride
  echo "   📢 Publishing ride..."
  PUBLISH3=$(curl -s -X PUT \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE3_ID/publish")
  echo "   Response: $PUBLISH3"
  echo "   ✅ Published"
else
  echo "   ❌ Failed to create ride"
fi

echo ""
echo "=========================================="
echo "✅ Pastries.cc Rides Created!"
echo "=========================================="
echo ""
echo "Created rides:"
echo "  1. CP Thursday (Thursday 6am, intermediate, 30km)"
echo "  2. Royal National Park (Saturday 7am, advanced, 75km)"
echo "  3. Easy Sunday Roll (Saturday 7am, beginner, 35km)"
echo ""
echo "Next steps:"
echo "  1. Navigate to http://localhost:3000/rides"
echo "  2. Click on a ride to test join/leave functionality"
echo "  3. Verify the leave ride fix is working"
echo ""
