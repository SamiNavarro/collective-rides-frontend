#!/bin/bash

# Phase 2.2 End-to-End Testing Setup Script
# Creates test users and provides JWT tokens for API testing

set -e

# Configuration (from CDK deployment outputs)
USER_POOL_ID="us-east-2_t5UUpOmPL"
CLIENT_ID="760idnu1d0mul2o10lut6rt7la"
REGION="us-east-2"
API_BASE_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Phase 2.2 End-to-End Testing Setup${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Function to create a user
create_user() {
    local username=$1
    local email=$2
    local password=$3
    local role=$4
    
    echo -e "${YELLOW}Creating user: ${username} (${email})${NC}"
    
    # Create user
    aws cognito-idp admin-create-user \
        --user-pool-id $USER_POOL_ID \
        --username $username \
        --user-attributes Name=email,Value=$email Name=email_verified,Value=true \
        --temporary-password $password \
        --message-action SUPPRESS \
        --region $REGION > /dev/null 2>&1
    
    # Set permanent password
    aws cognito-idp admin-set-user-password \
        --user-pool-id $USER_POOL_ID \
        --username $username \
        --password $password \
        --permanent \
        --region $REGION > /dev/null 2>&1
    
    echo -e "${GREEN}✅ User created: ${username}${NC}"
}

# Function to get JWT token
get_jwt_token() {
    local username=$1
    local password=$2
    
    local response=$(aws cognito-idp admin-initiate-auth \
        --user-pool-id $USER_POOL_ID \
        --client-id $CLIENT_ID \
        --auth-flow ADMIN_NO_SRP_AUTH \
        --auth-parameters USERNAME=$username,PASSWORD=$password \
        --region $REGION \
        --output json 2>/dev/null)
    
    echo $response | jq -r '.AuthenticationResult.AccessToken'
}

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local token=$3
    local data=$4
    local description=$5
    
    echo -e "${YELLOW}Testing: ${description}${NC}"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
            -X $method \
            -H "Authorization: Bearer $token" \
            "$API_BASE_URL$endpoint")
    else
        response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
            -X $method \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE_URL$endpoint")
    fi
    
    http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [[ $http_status -ge 200 && $http_status -lt 300 ]]; then
        echo -e "${GREEN}✅ $method $endpoint - Status: $http_status${NC}"
        echo "$body" | jq . 2>/dev/null || echo "$body"
    else
        echo -e "${RED}❌ $method $endpoint - Status: $http_status${NC}"
        echo "$body"
    fi
    echo ""
}

echo -e "${BLUE}Step 1: Creating Test Users${NC}"
echo "================================"

# Create test users with different roles
create_user "siteadmin" "siteadmin@test.com" "TestPassword123!" "SiteAdmin"
create_user "clubowner" "clubowner@test.com" "TestPassword123!" "ClubOwner"
create_user "clubadmin" "clubadmin@test.com" "TestPassword123!" "ClubAdmin"
create_user "member1" "member1@test.com" "TestPassword123!" "Member"
create_user "member2" "member2@test.com" "TestPassword123!" "Member"
create_user "newuser" "newuser@test.com" "TestPassword123!" "Member"

echo ""
echo -e "${BLUE}Step 2: Getting JWT Tokens${NC}"
echo "=========================="

# Get JWT tokens for each user
echo -e "${YELLOW}Obtaining JWT tokens...${NC}"

SITEADMIN_TOKEN=$(get_jwt_token "siteadmin" "TestPassword123!")
CLUBOWNER_TOKEN=$(get_jwt_token "clubowner" "TestPassword123!")
CLUBADMIN_TOKEN=$(get_jwt_token "clubadmin" "TestPassword123!")
MEMBER1_TOKEN=$(get_jwt_token "member1" "TestPassword123!")
MEMBER2_TOKEN=$(get_jwt_token "member2" "TestPassword123!")
NEWUSER_TOKEN=$(get_jwt_token "newuser" "TestPassword123!")

echo -e "${GREEN}✅ All JWT tokens obtained${NC}"
echo ""

echo -e "${BLUE}Step 3: Creating Test Data${NC}"
echo "========================="

# Create test clubs
echo -e "${YELLOW}Creating test clubs...${NC}"

# Create public club (using site admin token)
PUBLIC_CLUB_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $SITEADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Sydney Cycling Club",
        "description": "A public cycling club for everyone",
        "location": "Sydney, Australia",
        "membershipType": "public"
    }' \
    "$API_BASE_URL/v1/clubs")

echo -e "${GREEN}✅ Public club created${NC}"
echo "$PUBLIC_CLUB_RESPONSE" | jq .

# Create private club
PRIVATE_CLUB_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $SITEADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Elite Cycling Club",
        "description": "An exclusive cycling club",
        "location": "Sydney, Australia", 
        "membershipType": "private"
    }' \
    "$API_BASE_URL/v1/clubs")

echo -e "${GREEN}✅ Private club created${NC}"
echo "$PRIVATE_CLUB_RESPONSE" | jq .

echo ""
echo -e "${BLUE}Step 4: End-to-End Testing${NC}"
echo "=========================="

# Extract club IDs (assuming they're in the response)
PUBLIC_CLUB_ID=$(echo "$PUBLIC_CLUB_RESPONSE" | jq -r '.data.clubId // "sydney-cycling-club"')
PRIVATE_CLUB_ID=$(echo "$PRIVATE_CLUB_RESPONSE" | jq -r '.data.clubId // "elite-cycling-club"')

echo -e "${YELLOW}Using Club IDs:${NC}"
echo "Public Club: $PUBLIC_CLUB_ID"
echo "Private Club: $PRIVATE_CLUB_ID"
echo ""

# Test 1: User Profile Endpoints
echo -e "${BLUE}Testing User Profile Endpoints${NC}"
test_endpoint "GET" "/v1/users/me" "$MEMBER1_TOKEN" "" "Get current user profile"

# Test 2: Club Listing (Public)
echo -e "${BLUE}Testing Public Club Endpoints${NC}"
test_endpoint "GET" "/v1/clubs" "" "" "List all clubs (public)"
test_endpoint "GET" "/v1/clubs/$PUBLIC_CLUB_ID" "" "" "Get public club details"

# Test 3: Join Public Club
echo -e "${BLUE}Testing Membership Workflows${NC}"
test_endpoint "POST" "/v1/clubs/$PUBLIC_CLUB_ID/members" "$MEMBER1_TOKEN" \
    '{"message": "Excited to join this cycling group!"}' \
    "Member1 joins public club"

# Test 4: List Club Members
test_endpoint "GET" "/v1/clubs/$PUBLIC_CLUB_ID/members" "$MEMBER1_TOKEN" "" \
    "List club members"

# Test 5: Get User Memberships
test_endpoint "GET" "/v1/users/me/memberships" "$MEMBER1_TOKEN" "" \
    "Get user memberships"

# Test 6: Join Private Club (Should be pending)
test_endpoint "POST" "/v1/clubs/$PRIVATE_CLUB_ID/members" "$MEMBER2_TOKEN" \
    '{"message": "Would love to join this exclusive group!"}' \
    "Member2 requests to join private club"

# Test 7: Leave Club
test_endpoint "DELETE" "/v1/clubs/$PUBLIC_CLUB_ID/members/me" "$MEMBER1_TOKEN" "" \
    "Member1 leaves public club"

echo ""
echo -e "${GREEN}🎉 End-to-End Testing Complete!${NC}"
echo ""
echo -e "${BLUE}Test User Credentials:${NC}"
echo "======================"
echo "Site Admin: siteadmin@test.com / TestPassword123!"
echo "Club Owner: clubowner@test.com / TestPassword123!"
echo "Club Admin: clubadmin@test.com / TestPassword123!"
echo "Member 1:   member1@test.com / TestPassword123!"
echo "Member 2:   member2@test.com / TestPassword123!"
echo "New User:   newuser@test.com / TestPassword123!"
echo ""
echo -e "${BLUE}JWT Tokens (valid for 1 hour):${NC}"
echo "=============================="
echo "SITEADMIN_TOKEN=\"$SITEADMIN_TOKEN\""
echo "CLUBOWNER_TOKEN=\"$CLUBOWNER_TOKEN\""
echo "CLUBADMIN_TOKEN=\"$CLUBADMIN_TOKEN\""
echo "MEMBER1_TOKEN=\"$MEMBER1_TOKEN\""
echo "MEMBER2_TOKEN=\"$MEMBER2_TOKEN\""
echo "NEWUSER_TOKEN=\"$NEWUSER_TOKEN\""
echo ""
echo -e "${YELLOW}💡 You can now use these tokens for manual API testing!${NC}"
echo -e "${YELLOW}Example:${NC}"
echo "curl -X GET \\"
echo "  -H \"Authorization: Bearer \$MEMBER1_TOKEN\" \\"
echo "  \"$API_BASE_URL/v1/users/me/memberships\""