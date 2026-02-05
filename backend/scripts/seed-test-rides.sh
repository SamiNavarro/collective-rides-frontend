#!/bin/bash

# Seed Test Rides Script
# Creates sample rides for Phase 3.3 testing

set -e

echo "=========================================="
echo "Seeding Test Rides"
echo "=========================================="
echo ""

# Get API URL
API_URL=${API_URL:-$(aws cloudformation describe-stacks --stack-name SydneyCyclesStack --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text 2>/dev/null)}

if [ -z "$API_URL" ]; then
  API_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"
fi

echo "🌐 API URL: $API_URL"
echo ""

# Get admin token
echo "🔑 Getting admin token..."

CLIENT_ID="760idnu1d0mul2o10lut6rt7la"
ADMIN_EMAIL="testuser2@test.com"
ADMIN_PASSWORD="TestPassword123!"

AUTH_RESPONSE=$(aws cognito-idp initiate-auth \
  --client-id "$CLIENT_ID" \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME="$ADMIN_EMAIL",PASSWORD="$ADMIN_PASSWORD" \
  --region us-east-2 \
  --output json 2>&1)

if [ $? -ne 0 ]; then
  echo "❌ Error: Failed to authenticate"
  echo "$AUTH_RESPONSE"
  exit 1
fi

ADMIN_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.IdToken // empty')

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Error: No ID token in response"
  exit 1
fi

echo "✅ Admin token obtained"
echo ""

# Get club ID from user's memberships
echo "🔍 Finding club ID..."
CLUBS_RESPONSE=$(curl -s -X GET \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_URL/v1/users/me/clubs")

CLUB_ID=$(echo "$CLUBS_RESPONSE" | jq -r '.data[0].clubId // empty')

if [ -z "$CLUB_ID" ]; then
  echo "❌ Error: No clubs found for user. Please join a club first."
  exit 1
fi

echo "✅ Using club: $CLUB_ID"
echo ""

# Calculate dates
TODAY=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TOMORROW=$(date -u -v+1d +"%Y-%m-%dT09:00:00Z" 2>/dev/null || date -u -d "+1 day" +"%Y-%m-%dT09:00:00Z")
NEXT_WEEK=$(date -u -v+7d +"%Y-%m-%dT08:00:00Z" 2>/dev/null || date -u -d "+7 days" +"%Y-%m-%dT08:00:00Z")
NEXT_MONTH=$(date -u -v+30d +"%Y-%m-%dT07:00:00Z" 2>/dev/null || date -u -d "+30 days" +"%Y-%m-%dT07:00:00Z")

echo "=========================================="
echo "Creating Test Rides"
echo "=========================================="
echo ""

# Ride 1: Morning Coffee Ride (Tomorrow)
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

echo "   Response: $RIDE1"

RIDE1_ID=$(echo "$RIDE1" | jq -r '.data.rideId // empty')

if [ -n "$RIDE1_ID" ]; then
  echo "   ✅ Created: $RIDE1_ID"
  
  # Publish the ride
  echo "   📢 Publishing ride..."
  curl -s -X PUT \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE1_ID/publish" > /dev/null
  echo "   ✅ Published"
else
  echo "   ❌ Failed to create ride"
fi

echo ""

# Ride 2: Weekend Training Ride (Next Week)
echo "2. Creating 'Weekend Training Ride'..."
RIDE2=$(curl -s -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Weekend Training Ride\",
    \"description\": \"Moderate pace training ride through the Northern Beaches. Bring water and snacks.\",
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
    \"requirements\": {
      \"equipment\": [\"Road bike\", \"Helmet\", \"Water bottles\"],
      \"experience\": \"Comfortable riding 60km+\",
      \"fitness\": \"Moderate fitness required\"
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
  curl -s -X PUT \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE2_ID/publish" > /dev/null
  echo "   ✅ Published"
else
  echo "   ❌ Failed to create ride"
fi

echo ""

# Ride 3: Advanced Hill Climb (Next Month)
echo "3. Creating 'Advanced Hill Climb Challenge'..."
RIDE3=$(curl -s -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Advanced Hill Climb Challenge\",
    \"description\": \"Challenging ride with significant elevation gain. For experienced riders only.\",
    \"rideType\": \"competitive\",
    \"difficulty\": \"advanced\",
    \"startDateTime\": \"$NEXT_MONTH\",
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
    \"requirements\": {
      \"equipment\": [\"Road bike\", \"Helmet\", \"Multiple water bottles\", \"Spare tubes\"],
      \"experience\": \"Experienced with hill climbing\",
      \"fitness\": \"High fitness level required\"
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
  curl -s -X PUT \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE3_ID/publish" > /dev/null
  echo "   ✅ Published"
else
  echo "   ❌ Failed to create ride"
fi

echo ""

# Ride 4: Ride without route stats (to test fallback)
echo "4. Creating 'Casual Sunday Spin' (no route stats)..."
RIDE4=$(curl -s -X POST \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Casual Sunday Spin\",
    \"description\": \"Relaxed ride, route TBD based on group preference.\",
    \"rideType\": \"social\",
    \"difficulty\": \"beginner\",
    \"startDateTime\": \"$NEXT_WEEK\",
    \"estimatedDuration\": 5400,
    \"maxParticipants\": 10,
    \"meetingPoint\": {
      \"name\": \"Centennial Park\",
      \"address\": \"Grand Dr, Centennial Park NSW 2021\",
      \"coordinates\": {
        \"latitude\": -33.8968,
        \"longitude\": 151.2290
      },
      \"instructions\": \"Meet at the main gate\"
    },
    \"isPublic\": false,
    \"allowWaitlist\": false
  }" \
  "$API_URL/v1/clubs/$CLUB_ID/rides")

RIDE4_ID=$(echo "$RIDE4" | jq -r '.data.rideId // empty')

if [ -n "$RIDE4_ID" ]; then
  echo "   ✅ Created: $RIDE4_ID"
  
  # Publish the ride
  echo "   📢 Publishing ride..."
  curl -s -X PUT \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE4_ID/publish" > /dev/null
  echo "   ✅ Published"
else
  echo "   ❌ Failed to create ride"
fi

echo ""
echo "=========================================="
echo "✅ Test Rides Created!"
echo "=========================================="
echo ""
echo "Created rides:"
echo "  1. Morning Coffee Ride (tomorrow, beginner, 25km)"
echo "  2. Weekend Training Ride (next week, intermediate, 65km)"
echo "  3. Advanced Hill Climb Challenge (next month, advanced, 85km)"
echo "  4. Casual Sunday Spin (next week, beginner, no route stats)"
echo ""
echo "Next steps:"
echo "  1. Test frontend: npm run dev"
echo "  2. Navigate to /rides"
echo "  3. Verify rides display correctly"
echo ""
