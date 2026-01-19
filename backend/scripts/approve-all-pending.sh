#!/bin/bash

# Approve All Pending Memberships for a User
# This approves all pending memberships for testuser2

set -e

# Configuration
TABLE_NAME="sydney-cycles-main-development"
REGION="us-east-2"
USER_ID="512be5a0-f031-701c-787e-15a05bbb0ad1"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Approve All Pending Memberships${NC}"
echo "===================================="
echo ""
echo "User ID: $USER_ID"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

# List of clubs to check
CLUBS=("pastriescc" "attaquercc" "cpcc" "functioncc" "pelocc" "ratpackcc")

APPROVED_COUNT=0

for CLUB_ID in "${CLUBS[@]}"; do
    echo -e "${YELLOW}📋 Checking $CLUB_ID...${NC}"
    
    PK="CLUB#${CLUB_ID}"
    SK="MEMBER#${USER_ID}"
    
    # Check if membership exists
    ITEM=$(aws dynamodb get-item \
        --table-name "$TABLE_NAME" \
        --region "$REGION" \
        --key "{\"PK\": {\"S\": \"$PK\"}, \"SK\": {\"S\": \"$SK\"}}" \
        --output json 2>/dev/null || echo "{}")
    
    if [ "$ITEM" == "{}" ] || [ -z "$(echo $ITEM | jq -r '.Item')" ]; then
        echo "  ⏭️  No membership found, skipping"
        echo ""
        continue
    fi
    
    CURRENT_STATUS=$(echo $ITEM | jq -r '.Item.status.S')
    
    if [ "$CURRENT_STATUS" == "active" ]; then
        echo "  ✅ Already active, skipping"
        echo ""
        continue
    fi
    
    if [ "$CURRENT_STATUS" == "pending" ]; then
        echo "  🔄 Approving..."
        
        aws dynamodb update-item \
            --table-name "$TABLE_NAME" \
            --region "$REGION" \
            --key "{\"PK\": {\"S\": \"$PK\"}, \"SK\": {\"S\": \"$SK\"}}" \
            --update-expression "SET #status = :active, updatedAt = :now" \
            --expression-attribute-names '{"#status": "status"}' \
            --expression-attribute-values "{\":active\": {\"S\": \"active\"}, \":now\": {\"S\": \"$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")\"}}" \
            --return-values ALL_NEW \
            --output json > /dev/null
        
        echo -e "  ${GREEN}✅ Approved!${NC}"
        APPROVED_COUNT=$((APPROVED_COUNT + 1))
        echo ""
    fi
done

echo ""
echo -e "${GREEN}🎉 Approved $APPROVED_COUNT membership(s)${NC}"
echo ""
echo "Next steps:"
echo "  1. Refresh http://localhost:3000/my-clubs"
echo "  2. Clubs should now show as 'active'"
echo "  3. Test the 'Leave Club' functionality"
echo ""
