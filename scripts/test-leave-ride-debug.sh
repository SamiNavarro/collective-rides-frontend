#!/bin/bash

# Test leave ride endpoint directly
# Usage: ./test-leave-ride-debug.sh

source backend/test-tokens.env

CLUB_ID="attaquercc"
RIDE_ID="ride_mknku9jy_55a749d38e32"  # Replace with actual ride ID

echo "Testing leave ride endpoint..."
echo "Club: $CLUB_ID"
echo "Ride: $RIDE_ID"
echo ""

# Test leave ride
echo "=== Leaving Ride ==="
curl -X DELETE \
  "https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/clubs/${CLUB_ID}/rides/${RIDE_ID}/participants/me" \
  -H "Authorization: Bearer ${CAPTAIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  | jq '.'

echo ""
echo "=== Getting Ride Details (to verify) ==="
curl -X GET \
  "https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/clubs/${CLUB_ID}/rides/${RIDE_ID}" \
  -H "Authorization: Bearer ${CAPTAIN_TOKEN}" \
  -H "Content-Type: application/json" \
  | jq '.data.viewerParticipation'
