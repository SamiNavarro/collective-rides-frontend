#!/bin/bash
# Backend Connectivity Test Script
# Tests frontend-backend connection and API accessibility

echo "🔍 Testing Backend Connectivity..."

API_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"
FRONTEND_URL="https://collective-rides-frontend.vercel.app"

# Test 1: Health Check
echo "1. Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health.json "$API_URL/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health Check: PASS"
    cat /tmp/health.json
else
    echo "❌ Health Check: FAIL (Status: $HEALTH_RESPONSE)"
fi

# Test 2: CORS Preflight
echo -e "\n2. Testing CORS Configuration..."
CORS_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/cors.json \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -X OPTIONS \
    "$API_URL/v1/clubs")

if [ "$CORS_RESPONSE" = "200" ]; then
    echo "✅ CORS Preflight: PASS"
else
    echo "❌ CORS Preflight: FAIL (Status: $CORS_RESPONSE)"
fi

# Test 3: Protected Endpoint (should return 401)
echo -e "\n3. Testing Protected Endpoint..."
PROTECTED_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/protected.json "$API_URL/v1/users/current")
if [ "$PROTECTED_RESPONSE" = "401" ]; then
    echo "✅ Protected Endpoint: PASS (Correctly requires auth)"
else
    echo "⚠️ Protected Endpoint: Status $PROTECTED_RESPONSE (Expected 401)"
fi

# Test 4: Strava Webhook
echo -e "\n4. Testing Strava Webhook..."
WEBHOOK_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/webhook.json \
    "$API_URL/integrations/strava/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=wrong")
if [ "$WEBHOOK_RESPONSE" = "403" ]; then
    echo "✅ Strava Webhook: PASS (Correctly rejects wrong token)"
else
    echo "❌ Strava Webhook: FAIL (Status: $WEBHOOK_RESPONSE)"
fi

# Test 5: Test with correct Strava verification token
echo -e "\n5. Testing Strava Webhook with Correct Token..."
WEBHOOK_CORRECT_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/webhook_correct.json \
    "$API_URL/integrations/strava/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=b532706503d7188cb8c00047fb60ae0930d84fc9")
if [ "$WEBHOOK_CORRECT_RESPONSE" = "200" ]; then
    echo "✅ Strava Webhook (Correct Token): PASS"
    echo "Response: $(cat /tmp/webhook_correct.json)"
else
    echo "❌ Strava Webhook (Correct Token): FAIL (Status: $WEBHOOK_CORRECT_RESPONSE)"
fi

# Cleanup
rm -f /tmp/health.json /tmp/cors.json /tmp/protected.json /tmp/webhook.json /tmp/webhook_correct.json

echo -e "\n🏁 Backend connectivity test completed!"
echo -e "\n📋 Summary:"
echo "- API Gateway: $API_URL"
echo "- Frontend URL: $FRONTEND_URL"
echo "- Health Check: $([ "$HEALTH_RESPONSE" = "200" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "- CORS Config: $([ "$CORS_RESPONSE" = "200" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "- Auth Protection: $([ "$PROTECTED_RESPONSE" = "401" ] && echo "✅ PASS" || echo "⚠️ CHECK")"
echo "- Strava Webhook: $([ "$WEBHOOK_RESPONSE" = "403" ] && echo "✅ PASS" || echo "❌ FAIL")"
echo "- Strava Auth: $([ "$WEBHOOK_CORRECT_RESPONSE" = "200" ] && echo "✅ PASS" || echo "❌ FAIL")"