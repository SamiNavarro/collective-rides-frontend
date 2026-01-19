#!/bin/bash

# Seed Clubs Script
# Creates sample cycling clubs in the database

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🌱 Seeding Clubs Database${NC}"
echo ""

# Get API URL and region from environment or use defaults
API_URL="${API_URL:-https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development}"
AWS_REGION="${AWS_REGION:-us-east-2}"

# Get admin token (using testuser2 for now)
echo "Getting authentication token..."
TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-2_t5UUpOmPL \
  --client-id 760idnu1d0mul2o10lut6rt7la \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=testuser2@test.com,PASSWORD=TestPassword123! \
  --region us-east-2 \
  --query 'AuthenticationResult.IdToken' \
  --output text)

if [ -z "$TOKEN" ]; then
  echo "Failed to get authentication token"
  exit 1
fi

echo -e "${GREEN}✓ Got authentication token${NC}"
echo ""

# Function to create a club
create_club() {
  local name=$1
  local description=$2
  local city=$3
  
  echo "Creating club: $name..."
  
  RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$name\",
      \"description\": \"$description\",
      \"city\": \"$city\"
    }" \
    "$API_URL/v1/clubs")
  
  if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Created: $name${NC}"
  else
    echo "✗ Failed to create $name"
    echo "Response: $RESPONSE"
  fi
}

# Create clubs
echo "Creating clubs..."
echo ""

create_club "Pastries.cc" \
  "Sydney's premier coffee and cycling club. Fast rides followed by even faster espresso." \
  "Sydney"

create_club "Ratpack.cc" \
  "Urban cycling collective focused on city rides and street culture." \
  "Sydney"

create_club "CP.cc" \
  "Competitive racing club for serious cyclists. Training rides and race preparation." \
  "Sydney"

create_club "Function.cc" \
  "Functional fitness meets cycling. Cross-training and endurance focused." \
  "Sydney"

create_club "Attaquer.cc" \
  "Attack-minded riders pushing the pace. High-intensity group rides." \
  "Sydney"

create_club "Pelo.cc" \
  "Peloton-style group rides with a social focus. All levels welcome." \
  "Sydney"

echo ""
echo -e "${GREEN}🎉 Database seeding complete!${NC}"
echo ""
echo "Created 6 clubs:"
echo "  • Pastries.cc"
echo "  • Ratpack.cc"
echo "  • CP.cc"
echo "  • Function.cc"
echo "  • Attaquer.cc"
echo "  • Pelo.cc"
echo ""
echo "Visit http://localhost:3000/clubs/directory to see them!"
