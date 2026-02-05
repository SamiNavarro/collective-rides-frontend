#!/bin/bash

# Quick script to join Attaquer club for testing

echo "=========================================="
echo "Join Attaquer Club"
echo "=========================================="
echo ""

# Get tokens
echo "🔑 Getting tokens..."
cd backend
bash scripts/get-test-tokens.sh --save-file > /dev/null 2>&1
source test-tokens.env
cd ..

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get token"
  exit 1
fi
echo "✅ Token obtained"
echo ""

CLUB_ID="attaquercc"
API_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"

echo "📝 Joining club: $CLUB_ID"
echo ""

# Join club
RESPONSE=$(curl -s -X POST \
  "$API_URL/clubs/$CLUB_ID/members" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test user joining for ride testing"}')

echo "Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Check if successful
SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ Successfully joined club!"
  echo ""
  echo "Now you can view rides at:"
  echo "  http://localhost:3000/rides"
  echo "  http://localhost:3000/clubs/$CLUB_ID/rides/ride_mkp37ewt_dd61a9f1337d"
else
  ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
  if [[ "$ERROR" == *"already"* ]]; then
    echo "ℹ️  Already a member of this club"
    echo ""
    echo "You can view rides at:"
    echo "  http://localhost:3000/rides"
    echo "  http://localhost:3000/clubs/$CLUB_ID/rides/ride_mkp37ewt_dd61a9f1337d"
  else
    echo "❌ Failed to join club: $ERROR"
  fi
fi
