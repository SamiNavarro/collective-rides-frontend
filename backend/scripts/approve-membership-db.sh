#!/bin/bash

# Approve Membership Directly in DynamoDB
# This bypasses the API and directly updates the membership status

set -e

# Configuration
TABLE_NAME="sydney-cycles-main-development"
REGION="us-east-2"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Approve Membership in DynamoDB${NC}"
echo "===================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    echo "Please install it first: https://aws.amazon.com/cli/"
    exit 1
fi

# Get parameters
CLUB_ID=$1
USER_ID=$2

if [ -z "$CLUB_ID" ] || [ -z "$USER_ID" ]; then
    echo -e "${RED}❌ Missing required parameters${NC}"
    echo ""
    echo "Usage: ./backend/scripts/approve-membership-db.sh CLUB_ID USER_ID"
    echo ""
    echo "Example:"
    echo "  ./backend/scripts/approve-membership-db.sh pastriescc 512be5a0-f031-701c-787e-15a05bbb0ad1"
    echo ""
    exit 1
fi

echo -e "${YELLOW}📋 Parameters:${NC}"
echo "  Table: $TABLE_NAME"
echo "  Region: $REGION"
echo "  Club ID: $CLUB_ID"
echo "  User ID: $USER_ID"
echo ""

# Find the membership
echo -e "${YELLOW}🔍 Finding membership...${NC}"

MEMBERSHIP_ID="${CLUB_ID}#${USER_ID}"
PK="CLUB#${CLUB_ID}"
SK="MEMBER#${USER_ID}"

echo "  PK: $PK"
echo "  SK: $SK"
echo ""

# Check if membership exists
echo -e "${YELLOW}📦 Checking if membership exists...${NC}"
ITEM=$(aws dynamodb get-item \
    --table-name "$TABLE_NAME" \
    --region "$REGION" \
    --key "{\"PK\": {\"S\": \"$PK\"}, \"SK\": {\"S\": \"$SK\"}}" \
    --output json 2>/dev/null || echo "{}")

if [ "$ITEM" == "{}" ] || [ -z "$(echo $ITEM | jq -r '.Item')" ]; then
    echo -e "${RED}❌ Membership not found${NC}"
    echo ""
    echo "Make sure:"
    echo "  1. The user has joined the club"
    echo "  2. The club ID and user ID are correct"
    echo ""
    exit 1
fi

CURRENT_STATUS=$(echo $ITEM | jq -r '.Item.status.S')
echo -e "${GREEN}✅ Membership found${NC}"
echo "  Current status: $CURRENT_STATUS"
echo ""

if [ "$CURRENT_STATUS" == "active" ]; then
    echo -e "${YELLOW}⚠️  Membership is already active${NC}"
    exit 0
fi

# Update membership status to active
echo -e "${YELLOW}🔄 Updating membership status to 'active'...${NC}"

aws dynamodb update-item \
    --table-name "$TABLE_NAME" \
    --region "$REGION" \
    --key "{\"PK\": {\"S\": \"$PK\"}, \"SK\": {\"S\": \"$SK\"}}" \
    --update-expression "SET #status = :active, updatedAt = :now" \
    --expression-attribute-names '{"#status": "status"}' \
    --expression-attribute-values "{\":active\": {\"S\": \"active\"}, \":now\": {\"S\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\"}}" \
    --return-values ALL_NEW \
    --output json > /dev/null

echo -e "${GREEN}✅ Membership approved successfully!${NC}"
echo ""
echo -e "${GREEN}🎉 User $USER_ID is now an active member of $CLUB_ID${NC}"
echo ""
echo "Next steps:"
echo "  1. Refresh the My Clubs page"
echo "  2. The club should now show as 'active' instead of 'pending'"
echo "  3. Test the 'Leave Club' functionality"
echo ""
