#!/bin/bash

# Test ride detail page - Phase 3.3.2
# Tests that ride detail page loads correctly with clubId in URL

echo "=========================================="
echo "Testing Ride Detail Page"
echo "=========================================="
echo ""

# Get token
echo "🔑 Getting token..."
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

# Test ride ID (from the API test above)
CLUB_ID="attaquercc"
RIDE_ID="ride_mkp37ewt_dd61a9f1337d"

echo "🔍 Testing ride detail endpoint..."
echo "   Club ID: $CLUB_ID"
echo "   Ride ID: $RIDE_ID"
echo ""

# Call the API
RESPONSE=$(curl -s -X GET \
  "https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/clubs/$CLUB_ID/rides/$RIDE_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

echo "📋 API Response:"
echo "$RESPONSE" | jq '.'
echo ""

# Check if successful
SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [ "$SUCCESS" = "true" ]; then
  echo "✅ API call successful!"
  echo ""
  echo "📍 Test the page in browser:"
  echo "   http://localhost:3000/clubs/$CLUB_ID/rides/$RIDE_ID"
  echo ""
else
  echo "❌ API call failed"
  ERROR=$(echo "$RESPONSE" | jq -r '.error')
  echo "   Error: $ERROR"
fi
