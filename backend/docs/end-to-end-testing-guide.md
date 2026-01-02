# End-to-End Testing Guide: Phase 2.2

**Purpose:** Complete workflow testing with real users and JWT tokens  
**Prerequisites:** Phase 2.2 deployed and infrastructure testing passed

## Quick Start

### Option 1: Automated Setup (Recommended)
```bash
cd backend
chmod +x scripts/setup-test-users.sh
./scripts/setup-test-users.sh
```

### Option 2: Manual Setup (Step-by-Step)
Follow the manual steps below if you prefer to understand each step.

---

## Manual Setup Guide

### Step 1: Create Test Users in Cognito

**Configuration:**
- User Pool ID: `us-east-2_t5UUpOmPL`
- Client ID: `760idnu1d0mul2o10lut6rt7la`
- Region: `us-east-2`

**Create Site Admin User:**
```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username siteadmin \
  --user-attributes Name=email,Value=siteadmin@test.com Name=email_verified,Value=true \
  --temporary-password TestPassword123! \
  --message-action SUPPRESS \
  --region us-east-2

aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username siteadmin \
  --password TestPassword123! \
  --permanent \
  --region us-east-2
```

**Create Club Owner User:**
```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username clubowner \
  --user-attributes Name=email,Value=clubowner@test.com Name=email_verified,Value=true \
  --temporary-password TestPassword123! \
  --message-action SUPPRESS \
  --region us-east-2

aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username clubowner \
  --password TestPassword123! \
  --permanent \
  --region us-east-2
```

**Create Regular Members:**
```bash
# Member 1
aws cognito-idp admin-create-user \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username member1 \
  --user-attributes Name=email,Value=member1@test.com Name=email_verified,Value=true \
  --temporary-password TestPassword123! \
  --message-action SUPPRESS \
  --region us-east-2

aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username member1 \
  --password TestPassword123! \
  --permanent \
  --region us-east-2

# Member 2
aws cognito-idp admin-create-user \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username member2 \
  --user-attributes Name=email,Value=member2@test.com Name=email_verified,Value=true \
  --temporary-password TestPassword123! \
  --message-action SUPPRESS \
  --region us-east-2

aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username member2 \
  --password TestPassword123! \
  --permanent \
  --region us-east-2
```

### Step 2: Get JWT Tokens

**Get Site Admin Token:**
```bash
SITEADMIN_TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-2_t5UUpOmPL \
  --client-id 760idnu1d0mul2o10lut6rt7la \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=siteadmin,PASSWORD=TestPassword123! \
  --region us-east-2 \
  --query 'AuthenticationResult.AccessToken' \
  --output text)

echo "Site Admin Token: $SITEADMIN_TOKEN"
```

**Get Member Tokens:**
```bash
MEMBER1_TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-2_t5UUpOmPL \
  --client-id 760idnu1d0mul2o10lut6rt7la \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=member1,PASSWORD=TestPassword123! \
  --region us-east-2 \
  --query 'AuthenticationResult.AccessToken' \
  --output text)

MEMBER2_TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-2_t5UUpOmPL \
  --client-id 760idnu1d0mul2o10lut6rt7la \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=member2,PASSWORD=TestPassword123! \
  --region us-east-2 \
  --query 'AuthenticationResult.AccessToken' \
  --output text)

echo "Member1 Token: $MEMBER1_TOKEN"
echo "Member2 Token: $MEMBER2_TOKEN"
```

### Step 3: Create Test Clubs

**API Base URL:**
```bash
API_BASE_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"
```

**Create Public Club:**
```bash
curl -X POST "$API_BASE_URL/v1/clubs" \
  -H "Authorization: Bearer $SITEADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sydney Cycling Club",
    "description": "A public cycling club for everyone",
    "location": "Sydney, Australia",
    "membershipType": "public"
  }' | jq .
```

**Create Private Club:**
```bash
curl -X POST "$API_BASE_URL/v1/clubs" \
  -H "Authorization: Bearer $SITEADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Elite Cycling Club", 
    "description": "An exclusive cycling club",
    "location": "Sydney, Australia",
    "membershipType": "private"
  }' | jq .
```

---

## End-to-End Test Scenarios

### Test 1: User Profile Management

**Get Current User:**
```bash
curl -X GET "$API_BASE_URL/v1/users/me" \
  -H "Authorization: Bearer $MEMBER1_TOKEN" | jq .
```

**Expected Result:** ✅ 200 OK with user profile data

### Test 2: Club Discovery

**List All Clubs (Public):**
```bash
curl -X GET "$API_BASE_URL/v1/clubs" | jq .
```

**Get Specific Club:**
```bash
# Replace {clubId} with actual club ID from previous response
curl -X GET "$API_BASE_URL/v1/clubs/{clubId}" | jq .
```

**Expected Result:** ✅ 200 OK with club list and details

### Test 3: Join Public Club

**Member Joins Club:**
```bash
curl -X POST "$API_BASE_URL/v1/clubs/{publicClubId}/members" \
  -H "Authorization: Bearer $MEMBER1_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Excited to join this cycling group!"}' | jq .
```

**Expected Result:** ✅ 201 Created with active membership

### Test 4: Membership Management

**List Club Members:**
```bash
curl -X GET "$API_BASE_URL/v1/clubs/{clubId}/members" \
  -H "Authorization: Bearer $MEMBER1_TOKEN" | jq .
```

**Get User Memberships:**
```bash
curl -X GET "$API_BASE_URL/v1/users/me/memberships" \
  -H "Authorization: Bearer $MEMBER1_TOKEN" | jq .
```

**Expected Result:** ✅ 200 OK with member lists and user memberships

### Test 5: Join Private Club (Pending)

**Request to Join Private Club:**
```bash
curl -X POST "$API_BASE_URL/v1/clubs/{privateClubId}/members" \
  -H "Authorization: Bearer $MEMBER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Would love to join this exclusive group!"}' | jq .
```

**Expected Result:** ✅ 202 Accepted with pending status

### Test 6: Leave Club

**Member Leaves Club:**
```bash
curl -X DELETE "$API_BASE_URL/v1/clubs/{clubId}/members/me" \
  -H "Authorization: Bearer $MEMBER1_TOKEN" | jq .
```

**Expected Result:** ✅ 200 OK with success message

### Test 7: Authorization Testing

**Unauthorized Access (No Token):**
```bash
curl -X GET "$API_BASE_URL/v1/users/me/memberships" | jq .
```

**Expected Result:** ✅ 401 Unauthorized

**Cross-User Access (Wrong Token):**
```bash
curl -X DELETE "$API_BASE_URL/v1/clubs/{clubId}/members/me" \
  -H "Authorization: Bearer $MEMBER2_TOKEN" | jq .
```

**Expected Result:** ✅ 403 Forbidden or 404 Not Found (if not a member)

---

## Advanced Testing Scenarios

### Test 8: Invitation Workflows

**Send In-App Invitation:**
```bash
curl -X POST "$API_BASE_URL/v1/clubs/{clubId}/invitations" \
  -H "Authorization: Bearer $SITEADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "user",
    "userId": "member2-user-id",
    "role": "member",
    "message": "Join our cycling club!"
  }' | jq .
```

**List User Invitations:**
```bash
curl -X GET "$API_BASE_URL/v1/users/me/invitations" \
  -H "Authorization: Bearer $MEMBER2_TOKEN" | jq .
```

**Accept Invitation:**
```bash
curl -X PUT "$API_BASE_URL/v1/invitations/{invitationId}" \
  -H "Authorization: Bearer $MEMBER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "accept"}' | jq .
```

### Test 9: Role Management

**Update Member Role (Admin Operation):**
```bash
curl -X PUT "$API_BASE_URL/v1/clubs/{clubId}/member/{userId}" \
  -H "Authorization: Bearer $SITEADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role": "admin",
    "reason": "Promoting for excellent contributions"
  }' | jq .
```

**Remove Member (Admin Operation):**
```bash
curl -X DELETE "$API_BASE_URL/v1/clubs/{clubId}/member/{userId}" \
  -H "Authorization: Bearer $SITEADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Violation of club rules"}' | jq .
```

---

## Performance Testing

### Load Testing with Multiple Requests

**Test Response Times:**
```bash
for i in {1..10}; do
  echo "Request $i:"
  time curl -s -X GET "$API_BASE_URL/v1/clubs" > /dev/null
done
```

**Concurrent User Simulation:**
```bash
# Run multiple requests in parallel
for i in {1..5}; do
  curl -X GET "$API_BASE_URL/v1/users/me/memberships" \
    -H "Authorization: Bearer $MEMBER1_TOKEN" &
done
wait
```

---

## Troubleshooting

### Common Issues

**Issue: 401 Unauthorized**
- **Cause:** JWT token expired or invalid
- **Solution:** Generate new token using the auth command

**Issue: 403 Forbidden**  
- **Cause:** User lacks required permissions
- **Solution:** Check user role and club membership

**Issue: 404 Not Found**
- **Cause:** Club ID or resource doesn't exist
- **Solution:** Verify club ID from list clubs response

**Issue: 409 Conflict**
- **Cause:** User already member or duplicate operation
- **Solution:** Check current membership status

### Token Refresh

**Regenerate Expired Token:**
```bash
NEW_TOKEN=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-2_t5UUpOmPL \
  --client-id 760idnu1d0mul2o10lut6rt7la \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=member1,PASSWORD=TestPassword123! \
  --region us-east-2 \
  --query 'AuthenticationResult.AccessToken' \
  --output text)
```

---

## Success Criteria

### ✅ All Tests Should Pass
- **User Authentication:** JWT tokens work correctly
- **Club Management:** Create, read, update operations
- **Membership Workflows:** Join, leave, list members
- **Authorization:** Proper access control enforcement
- **Invitation System:** Send, accept, decline invitations
- **Role Management:** Promote, demote, remove members
- **Performance:** Response times < 2 seconds
- **Error Handling:** Proper HTTP status codes and messages

### 📊 Expected Performance
- **Response Times:** < 1 second for most operations
- **Concurrent Users:** Handle 10+ simultaneous requests
- **Error Rate:** < 1% for valid requests
- **Availability:** 99.9% uptime

---

**Testing Complete: Ready for Production! 🚀**