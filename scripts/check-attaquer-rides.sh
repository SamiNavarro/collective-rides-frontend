#!/bin/bash

# Check Attaquer Rides
# Verifies rides are available for Attaquer club

set -e

echo "=========================================="
echo "Checking Attaquer Rides"
echo "=========================================="
echo ""

API_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"

# Attaquer club ID (from previous tests)
ATTAQUER_ID="CLUB#attaquer-cycling-club"

echo "🔍 Fetching rides for Attaquer..."
echo "   Club ID: $ATTAQUER_ID"
echo ""

# Get rides (no auth needed for published rides)
RIDES_RESPONSE=$(curl -s -X GET \
  "$API_URL/v1/clubs/$ATTAQUER_ID/rides?status=published&limit=20")

echo "📋 Response:"
echo "$RIDES_RESPONSE" | jq '.'
echo ""

# Count rides
RIDE_COUNT=$(echo "$RIDES_RESPONSE" | jq '.data | length')

echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Total published rides: $RIDE_COUNT"
echo ""

if [ "$RIDE_COUNT" -gt 0 ]; then
  echo "✅ Rides found!"
  echo ""
  echo "Ride details:"
  echo "$RIDES_RESPONSE" | jq -r '.data[] | "  - \(.title) (\(.startDateTime))"'
else
  echo "⚠️  No rides found for Attaquer"
  echo ""
  echo "To create rides:"
  echo "  1. Login as testuser2@test.com (Attaquer captain)"
  echo "  2. Run: cd backend && ./scripts/seed-test-rides.sh"
fi

echo ""
