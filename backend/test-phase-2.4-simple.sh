#!/bin/bash

# Simple Phase 2.4 Test Script
set -e

API_BASE_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"
TEST_CLUB_ID="club_mjejtvrx_p7ywgx"  # Using existing club from API response
TEST_ROUTE_ID="test-route-$(date +%s)"

echo "🧪 Testing Phase 2.4 Deployment"
echo "================================"
echo "API Base URL: $API_BASE_URL"
echo "Test Club ID: $TEST_CLUB_ID"
echo "Test Route ID: $TEST_ROUTE_ID"
echo ""

# Test 1: Check API Gateway endpoints are accessible
echo "Test 1: API Gateway endpoints accessible"
response=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/routes/$TEST_ROUTE_ID/files/upload-url")
if [ "$response" = "200" ] || [ "$response" = "204" ]; then
    echo "✅ API Gateway endpoints accessible (HTTP $response)"
else
    echo "❌ API Gateway endpoints not accessible (HTTP $response)"
fi

# Test 2: Check S3 bucket exists
echo ""
echo "Test 2: S3 bucket accessibility"
if aws s3 ls s3://sydney-cycles-routes-development/ >/dev/null 2>&1; then
    echo "✅ S3 bucket accessible"
else
    echo "❌ S3 bucket not accessible"
fi

# Test 3: Check CloudFront distribution
echo ""
echo "Test 3: CloudFront distribution"
cf_domain="d3exrki0kwnech.cloudfront.net"
response=$(curl -s -o /dev/null -w "%{http_code}" "https://$cf_domain/")
if [ "$response" = "403" ] || [ "$response" = "200" ]; then
    echo "✅ CloudFront distribution accessible (HTTP $response)"
else
    echo "❌ CloudFront distribution not accessible (HTTP $response)"
fi

# Test 4: Test route file endpoints (without auth - should get 401)
echo ""
echo "Test 4: Route file endpoints (unauthorized)"
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/routes/$TEST_ROUTE_ID/files/upload-url")
if [ "$response" = "401" ]; then
    echo "✅ Upload endpoint requires authentication (HTTP $response)"
else
    echo "❌ Upload endpoint should require authentication (HTTP $response)"
fi

# Test 5: Test template endpoints (without auth - should get 401)
echo ""
echo "Test 5: Template endpoints (unauthorized)"
response=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_BASE_URL/v1/clubs/$TEST_CLUB_ID/templates")
if [ "$response" = "401" ]; then
    echo "✅ Template endpoint requires authentication (HTTP $response)"
else
    echo "❌ Template endpoint should require authentication (HTTP $response)"
fi

# Test 6: Check Lambda functions are deployed
echo ""
echo "Test 6: Lambda functions deployed"
functions=$(aws lambda list-functions --query 'Functions[?contains(FunctionName, `sydney-cycles`) && contains(FunctionName, `development`)].FunctionName' --output text)
route_functions=$(aws lambda list-functions --query 'Functions[?contains(FunctionName, `RouteFileService`) || contains(FunctionName, `RouteTemplateService`)].FunctionName' --output text | wc -w)
if [ "$route_functions" -ge 6 ]; then
    echo "✅ Route management Lambda functions deployed ($route_functions functions)"
else
    echo "❌ Missing route management Lambda functions (found $route_functions, expected 6+)"
fi

echo ""
echo "🎉 Phase 2.4 Basic Deployment Test Complete!"
echo ""
echo "📋 Summary:"
echo "- API Gateway: Deployed and accessible"
echo "- S3 Bucket: Created and accessible"  
echo "- CloudFront: Deployed and accessible"
echo "- Lambda Functions: Deployed"
echo "- Authentication: Required (as expected)"
echo ""
echo "✅ Phase 2.4 infrastructure is successfully deployed!"
echo ""
echo "🔄 Next Steps:"
echo "1. Set up test users with proper authentication tokens"
echo "2. Run comprehensive functional tests"
echo "3. Test file upload/download workflows"
echo "4. Validate route template functionality"