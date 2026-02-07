#!/bin/bash

# Seed future published rides for Attaquer CC

set -e

CLUB_ID="attaquercc"
API_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"

# Get Alice's token
echo "Getting Alice's token..."
ALICE_EMAIL="alice.admin@example.com"
ALICE_PASSWORD="TestPassword123!"

AUTH_RESPONSE=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id "760idnu1d0mul2o10lut6rt7la" \
  --auth-parameters "USERNAME=$ALICE_EMAIL,PASSWORD=$ALICE_PASSWORD" \
  --region us-east-2 \
  --output json 2>/dev/null)

TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.IdToken')
echo "✅ Got token"
echo ""

# Function to create and publish a ride
create_ride() {
  local title="$1"
  local description="$2"
  local date="$3"
  local duration="$4"
  local distance="$5"
  local elevation="$6"
  local difficulty="$7"
  local max_participants="$8"
  
  echo "Creating: $title"
  
  RESPONSE=$(curl -s -X POST "$API_URL/v1/clubs/$CLUB_ID/rides" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"title\": \"$title\",
      \"description\": \"$description\",
      \"rideType\": \"group_ride\",
      \"startDateTime\": \"$date\",
      \"estimatedDuration\": $duration,
      \"distance\": $distance,
      \"elevationGain\": $elevation,
      \"difficulty\": \"$difficulty\",
      \"maxParticipants\": $max_participants,
      \"meetingPoint\": {
        \"name\": \"Attaquer HQ\",
        \"address\": \"123 Main St, Sydney\"
      }
    }")
  
  RIDE_ID=$(echo "$RESPONSE" | jq -r '.data.rideId')
  
  if [ -z "$RIDE_ID" ] || [ "$RIDE_ID" = "null" ]; then
    echo "❌ Failed to create ride"
    echo "$RESPONSE" | jq '.'
    return 1
  fi
  
  # Publish it
  curl -s -X POST "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE_ID/publish" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{}" > /dev/null
  
  echo "✅ Created and published: $RIDE_ID"
  echo ""
}

# Create rides for different days
echo "Creating future rides..."
echo ""

# Tomorrow morning
TOMORROW=$(date -u -v+1d +"%Y-%m-%dT09:00:00Z")
create_ride \
  "Morning Coffee Ride" \
  "Easy-paced ride to our favorite cafe. Perfect for all levels!" \
  "$TOMORROW" \
  120 \
  45 \
  200 \
  "easy" \
  20

# This weekend (Saturday) - 2 days from now
SATURDAY=$(date -u -v+2d +"%Y-%m-%dT08:00:00Z")
create_ride \
  "Weekend Warriors" \
  "Challenging ride for experienced cyclists. Bring your A-game!" \
  "$SATURDAY" \
  240 \
  80 \
  800 \
  "hard" \
  15

# Next week (Wednesday evening) - 5 days from now
NEXT_WED=$(date -u -v+5d +"%Y-%m-%dT18:00:00Z")
create_ride \
  "Evening Social Ride" \
  "Relaxed evening ride followed by dinner at a local restaurant" \
  "$NEXT_WED" \
  150 \
  35 \
  150 \
  "easy" \
  25

# Next weekend (Sunday) - 7 days from now
NEXT_SUN=$(date -u -v+7d +"%Y-%m-%dT07:00:00Z")
create_ride \
  "Sunday Long Ride" \
  "Epic adventure ride exploring new routes. Pack snacks!" \
  "$NEXT_SUN" \
  300 \
  100 \
  1000 \
  "hard" \
  12

# Two weeks out (Saturday) - 14 days from now
TWO_WEEKS=$(date -u -v+14d +"%Y-%m-%dT09:00:00Z")
create_ride \
  "Beginner Friendly Ride" \
  "Perfect for new riders! We'll take it slow and have fun" \
  "$TWO_WEEKS" \
  90 \
  30 \
  100 \
  "easy" \
  30

echo "=========================================="
echo "✅ Created 5 future published rides!"
echo "=========================================="
echo ""
echo "Test them at:"
echo "https://collective-rides-frontend.vercel.app/clubs/attaquercc"
