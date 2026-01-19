#!/bin/bash

# Seed Clubs Script - Direct DynamoDB Insert
# Bypasses API authorization by writing directly to DynamoDB

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🌱 Seeding Clubs Database (Direct DynamoDB)${NC}"
echo ""

# Configuration
TABLE_NAME="sydney-cycles-main-development"
AWS_REGION="us-east-2"

# Get current timestamp
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# Function to generate UUID (simple version)
generate_uuid() {
  cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen 2>/dev/null || echo "$(date +%s)-$(( RANDOM % 10000 ))"
}

# Function to create a club directly in DynamoDB
create_club_direct() {
  local name=$1
  local description=$2
  local city=$3
  local club_id=$(echo "$name" | tr '[:upper:]' '[:lower:]' | tr -d '.' | tr ' ' '-')
  local name_lower=$(echo "$name" | tr '[:upper:]' '[:lower:]')
  
  echo "Creating club: $name (ID: $club_id)..."
  
  # Create main club item
  aws dynamodb put-item \
    --table-name "$TABLE_NAME" \
    --region "$AWS_REGION" \
    --item "{
      \"PK\": {\"S\": \"CLUB#$club_id\"},
      \"SK\": {\"S\": \"METADATA\"},
      \"entityType\": {\"S\": \"CLUB\"},
      \"id\": {\"S\": \"$club_id\"},
      \"name\": {\"S\": \"$name\"},
      \"nameLower\": {\"S\": \"$name_lower\"},
      \"description\": {\"S\": \"$description\"},
      \"city\": {\"S\": \"$city\"},
      \"status\": {\"S\": \"active\"},
      \"createdAt\": {\"S\": \"$TIMESTAMP\"},
      \"updatedAt\": {\"S\": \"$TIMESTAMP\"}
    }" \
    --return-consumed-capacity NONE \
    > /dev/null 2>&1
  
  # Create index item for listing
  aws dynamodb put-item \
    --table-name "$TABLE_NAME" \
    --region "$AWS_REGION" \
    --item "{
      \"PK\": {\"S\": \"INDEX#CLUB\"},
      \"SK\": {\"S\": \"NAME#$name_lower#ID#$club_id\"},
      \"GSI1PK\": {\"S\": \"INDEX#CLUB\"},
      \"GSI1SK\": {\"S\": \"NAME#$name_lower#ID#$club_id\"},
      \"entityType\": {\"S\": \"CLUB_INDEX\"},
      \"clubId\": {\"S\": \"$club_id\"},
      \"name\": {\"S\": \"$name\"},
      \"nameLower\": {\"S\": \"$name_lower\"},
      \"status\": {\"S\": \"active\"},
      \"city\": {\"S\": \"$city\"},
      \"createdAt\": {\"S\": \"$TIMESTAMP\"},
      \"updatedAt\": {\"S\": \"$TIMESTAMP\"}
    }" \
    --return-consumed-capacity NONE \
    > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Created: $name${NC}"
  else
    echo -e "${YELLOW}✗ Failed to create $name${NC}"
  fi
}

# Check if table exists
echo "Checking DynamoDB table..."
if ! aws dynamodb describe-table --table-name "$TABLE_NAME" --region "$AWS_REGION" > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  Table $TABLE_NAME not found in region $AWS_REGION${NC}"
  echo "Please check your table name and region."
  exit 1
fi

echo -e "${GREEN}✓ Table found${NC}"
echo ""

# Create clubs
echo "Creating clubs..."
echo ""

create_club_direct "Pastries.cc" \
  "Sydney's premier coffee and cycling club. Fast rides followed by even faster espresso." \
  "Sydney"

create_club_direct "Ratpack.cc" \
  "Urban cycling collective focused on city rides and street culture." \
  "Sydney"

create_club_direct "CP.cc" \
  "Competitive racing club for serious cyclists. Training rides and race preparation." \
  "Sydney"

create_club_direct "Function.cc" \
  "Functional fitness meets cycling. Cross-training and endurance focused." \
  "Sydney"

create_club_direct "Attaquer.cc" \
  "Attack-minded riders pushing the pace. High-intensity group rides." \
  "Sydney"

create_club_direct "Pelo.cc" \
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
echo "Refresh http://localhost:3000/clubs/directory to see them!"
