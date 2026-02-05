#!/bin/bash

# Test Attaquer Rides API
# Verifies rides are returned by the API

set -e

echo "=========================================="
echo "Testing Attaquer Rides API"
echo "=========================================="
echo ""

API_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"
CLIENT_ID="760idnu1d0mul2o10lut6rt7la"
ADMIN_EMAIL="testuser2@test.com"
ADMIN_PASSWORD="TestPassword123!"

echo "🔑 Getting token..."
AUTH_RESPONSE=$(aws cognito-idp initiate-auth \
  --client-id "$CLIENT_ID" \
  --auth-flow USER_PASSWORD_AUTH \
  --auth-parameters USERNAME="$ADMIN_EMAIL",PASSWORD="$ADMIN_PASSWORD" \
  --region us-east-2 \
  --output json 2>&1)

ADMIN_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.IdToken // empty')

echo "✅ Token obtained"
echo ""

CLUB_ID="attaquercc"

# Calculate date range (7 days ago to 30 days from now)
START_DATE=$(date -u -v-7d +"%Y-%m-%dT00:00:00Z" 2>/dev/null || date -u -d "-7 days" +"%Y-%m-%dT00:00:00Z")
END_DATE=$(date -u -v+30d +"%Y-%m-%dT23:59:59Z" 2>/dev/null || date -u -d "+30 days" +"%Y-%m-%dT23:59:59Z")

echo "📅 Date range:"
echo "   Start: $START_DATE"
echo "   End: $END_DATE"
echo ""

echo "🔍 Test 1: Fetching rides WITH date filter..."
RIDES_RESPONSE=$(curl -s -X GET \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_URL/v1/clubs/$CLUB_ID/rides?status=published&startDate=$START_DATE&endDate=$END_DATE&limit=20")

echo "📋 API Response (with filter):"
echo "$RIDES_RESPONSE" | jq '.'
echo ""

RIDE_COUNT=$(echo "$RIDES_RESPONSE" | jq '.data | length // 0')

echo "🔍 Test 2: Fetching rides WITHOUT date filter..."
RIDES_NO_FILTER=$(curl -s -X GET \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_URL/v1/clubs/$CLUB_ID/rides?status=published&limit=50")

echo "📋 API Response (no date filter):"
echo "$RIDES_NO_FILTER" | jq '.'
echo ""

RIDE_COUNT_NO_FILTER=$(echo "$RIDES_NO_FILTER" | jq '.data | length // 0')

echo "🔍 Test 3: Fetching ALL rides (no status filter)..."
RIDES_ALL=$(curl -s -X GET \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_URL/v1/clubs/$CLUB_ID/rides?limit=50")

echo "📋 API Response (all rides):"
echo "$RIDES_ALL" | jq '.'
echo ""

RIDE_COUNT_ALL=$(echo "$RIDES_ALL" | jq '.data | length // 0')

echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Rides with date filter: $RIDE_COUNT"
echo "Rides without date filter: $RIDE_COUNT_NO_FILTER"
echo "All rides (no status filter): $RIDE_COUNT_ALL"
echo ""

if [ "$RIDE_COUNT_ALL" -gt 0 ]; then
  echo "✅ Rides exist in database!"
  echo ""
  echo "All rides:"
  echo "$RIDES_ALL" | jq -r '.data[]? | "  - \(.title) (\(.startDateTime)) [status: \(.status)]"'
  echo ""
  
  if [ "$RIDE_COUNT" -eq 0 ]; then
    echo "⚠️  But rides are NOT returned with date filter"
    echo "   This suggests a date range mismatch"
  fi
else
  echo "❌ No rides found in database"
  echo ""
  echo "Run: bash scripts/seed-attaquer-rides.sh"
fi

echo ""
