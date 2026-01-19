#!/bin/bash

# Check Membership Status in DynamoDB

set -e

TABLE_NAME="sydney-cycles-main-development"
REGION="us-east-2"
USER_ID="512be5a0-f031-701c-787e-15a05bbb0ad1"

echo "🔍 Checking Membership Status"
echo "=============================="
echo ""

CLUBS=("pastriescc" "attaquercc" "cpcc" "functioncc" "pelocc" "ratpackcc")

for CLUB_ID in "${CLUBS[@]}"; do
    PK="CLUB#${CLUB_ID}"
    SK="MEMBER#${USER_ID}"
    
    ITEM=$(aws dynamodb get-item \
        --table-name "$TABLE_NAME" \
        --region "$REGION" \
        --key "{\"PK\": {\"S\": \"$PK\"}, \"SK\": {\"S\": \"$SK\"}}" \
        --output json 2>/dev/null || echo "{}")
    
    if [ "$ITEM" != "{}" ] && [ -n "$(echo $ITEM | jq -r '.Item')" ]; then
        STATUS=$(echo $ITEM | jq -r '.Item.status.S')
        ROLE=$(echo $ITEM | jq -r '.Item.role.S')
        echo "$CLUB_ID: $STATUS ($ROLE)"
    else
        echo "$CLUB_ID: No membership"
    fi
done

echo ""
