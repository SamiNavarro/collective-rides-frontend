#!/bin/bash

# Phase 3.3 Backend Enhancement Test Script
# Tests viewerParticipation field in ride detail response

set -e

echo "=========================================="
echo "Phase 3.3 Backend Enhancement Tests"
echo "=========================================="
echo ""

# Get API URL
API_URL=${API_URL:-$(aws cloudformation describe-stacks --stack-name SydneyCyclesStack --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' --output text 2>/dev/null)}

if [ -z "$API_URL" ]; then
  echo "❌ Error: API_URL not found"
  echo "Set manually: export API_URL=https://your-api-url"
  exit 1
fi

echo "🌐 API URL: $API_URL"
echo ""

# Get test tokens
echo "🔑 Getting test tokens..."
source ./scripts/get-test-tokens.sh

if [ -z "$MEMBER_TOKEN" ]; then
  echo "❌ Error: Failed to get test tokens"
  exit 1
fi

echo "✅ Test tokens obtained"
echo ""

# Test club and ride IDs (update these with real IDs from your system)
CLUB_ID="sydney-cycling-club"
RIDE_ID=""

echo "=========================================="
echo "Test 1: List Rides for Club"
echo "=========================================="
echo ""

echo "📋 Listing rides for club: $CLUB_ID"
RIDES_RESPONSE=$(curl -s -X GET \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  "$API_URL/v1/clubs/$CLUB_ID/rides?status=published&limit=5")

echo "$RIDES_RESPONSE" | jq '.'

# Extract first ride ID
RIDE_ID=$(echo "$RIDES_RESPONSE" | jq -r '.data[0].rideId // empty')

if [ -z "$RIDE_ID" ]; then
  echo ""
  echo "⚠️  No rides found for club $CLUB_ID"
  echo "   Create a test ride first or update CLUB_ID in script"
  echo ""
  echo "=========================================="
  echo "Test Results: SKIPPED (no rides)"
  echo "=========================================="
  exit 0
fi

echo ""
echo "✅ Found ride: $RIDE_ID"
echo ""

echo "=========================================="
echo "Test 2: Get Ride Detail (Not Joined)"
echo "=========================================="
echo ""

echo "📋 Getting ride detail as non-participant..."
RIDE_DETAIL=$(curl -s -X GET \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE_ID")

echo "$RIDE_DETAIL" | jq '.'

# Check for viewerParticipation field
VIEWER_PARTICIPATION=$(echo "$RIDE_DETAIL" | jq '.data.viewerParticipation')

echo ""
if [ "$VIEWER_PARTICIPATION" == "null" ]; then
  echo "✅ viewerParticipation is null (user not joined) - CORRECT"
else
  echo "⚠️  viewerParticipation exists when user not joined"
  echo "   Value: $VIEWER_PARTICIPATION"
fi

echo ""
echo "=========================================="
echo "Test 3: Join Ride"
echo "=========================================="
echo ""

echo "🚴 Joining ride..."
JOIN_RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' \
  "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE_ID/participants")

echo "$JOIN_RESPONSE" | jq '.'

PARTICIPATION_ID=$(echo "$JOIN_RESPONSE" | jq -r '.data.participationId // empty')

if [ -z "$PARTICIPATION_ID" ]; then
  echo ""
  echo "⚠️  Failed to join ride or already joined"
  PARTICIPATION_ID="existing"
fi

echo ""
echo "✅ Join response received"
echo ""

echo "=========================================="
echo "Test 4: Get Ride Detail (Joined)"
echo "=========================================="
echo ""

echo "📋 Getting ride detail as participant..."
RIDE_DETAIL_JOINED=$(curl -s -X GET \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  "$API_URL/v1/clubs/$CLUB_ID/rides/$RIDE_ID")

echo "$RIDE_DETAIL_JOINED" | jq '.'

# Check for viewerParticipation field
VIEWER_PARTICIPATION_JOINED=$(echo "$RIDE_DETAIL_JOINED" | jq '.data.viewerParticipation')

echo ""
echo "=========================================="
echo "Test 4 Results: viewerParticipation Field"
echo "=========================================="
echo ""

if [ "$VIEWER_PARTICIPATION_JOINED" == "null" ]; then
  echo "❌ FAILED: viewerParticipation is null (should exist)"
  echo ""
  echo "Expected structure:"
  echo "{"
  echo "  \"participationId\": \"part_...\","
  echo "  \"role\": \"participant\","
  echo "  \"status\": \"confirmed\","
  echo "  \"joinedAt\": \"2026-01-20T...\""
  echo "}"
  TEST_PASSED=false
else
  echo "✅ PASSED: viewerParticipation exists"
  echo ""
  echo "Field structure:"
  echo "$VIEWER_PARTICIPATION_JOINED" | jq '.'
  
  # Validate required fields
  PARTICIPATION_ID_FIELD=$(echo "$VIEWER_PARTICIPATION_JOINED" | jq -r '.participationId // empty')
  ROLE_FIELD=$(echo "$VIEWER_PARTICIPATION_JOINED" | jq -r '.role // empty')
  STATUS_FIELD=$(echo "$VIEWER_PARTICIPATION_JOINED" | jq -r '.status // empty')
  JOINED_AT_FIELD=$(echo "$VIEWER_PARTICIPATION_JOINED" | jq -r '.joinedAt // empty')
  
  echo ""
  echo "Field validation:"
  
  if [ -n "$PARTICIPATION_ID_FIELD" ]; then
    echo "  ✅ participationId: $PARTICIPATION_ID_FIELD"
  else
    echo "  ❌ participationId: missing"
  fi
  
  if [ -n "$ROLE_FIELD" ]; then
    echo "  ✅ role: $ROLE_FIELD"
  else
    echo "  ❌ role: missing"
  fi
  
  if [ -n "$STATUS_FIELD" ]; then
    echo "  ✅ status: $STATUS_FIELD"
  else
    echo "  ❌ status: missing"
  fi
  
  if [ -n "$JOINED_AT_FIELD" ]; then
    echo "  ✅ joinedAt: $JOINED_AT_FIELD"
  else
    echo "  ❌ joinedAt: missing"
  fi
  
  if [ -n "$PARTICIPATION_ID_FIELD" ] && [ -n "$ROLE_FIELD" ] && [ -n "$STATUS_FIELD" ] && [ -n "$JOINED_AT_FIELD" ]; then
    TEST_PASSED=true
  else
    TEST_PASSED=false
  fi
fi

echo ""
echo "=========================================="
echo "Test 5: Leave Ride (Cleanup)"
echo "=========================================="
echo ""

if [ "$PARTICIPATION_ID" != "existing" ] && [ -n "$PARTICIPATION_ID_FIELD" ]; then
  echo "🚪 Leaving ride (cleanup)..."
  LEAVE_RESPONSE=$(curl -s -X DELETE \
    -H "Authorization: Bearer $MEMBER_TOKEN" \
    "$API_URL/v1/participations/$PARTICIPATION_ID_FIELD")
  
  echo "$LEAVE_RESPONSE" | jq '.'
  echo ""
  echo "✅ Cleanup complete"
else
  echo "⏭️  Skipping cleanup (using existing participation)"
fi

echo ""
echo "=========================================="
echo "Final Test Results"
echo "=========================================="
echo ""

if [ "$TEST_PASSED" = true ]; then
  echo "✅ ALL TESTS PASSED"
  echo ""
  echo "Backend enhancement verified:"
  echo "  ✅ viewerParticipation field exists"
  echo "  ✅ participationId field present"
  echo "  ✅ role field present"
  echo "  ✅ status field present"
  echo "  ✅ joinedAt field present"
  echo ""
  echo "Ready for Phase 3.3.2 frontend implementation!"
else
  echo "❌ TESTS FAILED"
  echo ""
  echo "Issues found:"
  echo "  - viewerParticipation field missing or incomplete"
  echo ""
  echo "Check backend deployment and handler implementation"
fi

echo ""
