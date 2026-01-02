# Phase 2.2 Testing Guide: Club Membership & Roles

**Version:** 1.0  
**Date:** December 19, 2025  
**Phase:** 2.2 - Club Membership Management & Role-Based Access Control

## Overview

This guide provides comprehensive testing procedures for Phase 2.2 Club Membership & Roles functionality. Follow these tests after deployment to ensure all features work correctly.

## Prerequisites

### Required Test Data

Before starting tests, ensure you have:

1. **Test Users** (create via Cognito or registration)
   - `admin@test.com` - Site Administrator
   - `owner@test.com` - Club Owner
   - `admin1@test.com` - Club Admin
   - `member1@test.com` - Club Member
   - `member2@test.com` - Club Member
   - `newuser@test.com` - For invitation testing

2. **Test Clubs** (create via Phase 2.1 endpoints)
   - `test-public-club` - Public club for immediate joins
   - `test-private-club` - Private club requiring approval
   - `test-large-club` - Club with multiple members

3. **API Base URL**
   - Development: `https://your-api-id.execute-api.region.amazonaws.com/dev`
   - Production: `https://your-api-id.execute-api.region.amazonaws.com/prod`

### Authentication Setup

All API calls require Cognito JWT tokens. Obtain tokens for each test user:

```bash
# Example: Get JWT token for a user
aws cognito-idp admin-initiate-auth \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-id YOUR_CLIENT_ID \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=owner@test.com,PASSWORD=TestPassword123!
```

## Test Suite 1: Membership Management

### Test 1.1: Join Public Club

**Objective:** Verify users can join public clubs immediately

**Steps:**
1. **Join Club Request**
   ```bash
   curl -X POST "${API_BASE_URL}/v1/clubs/test-public-club/members" \
     -H "Authorization: Bearer ${MEMBER1_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"message": "Excited to join this cycling group!"}'
   ```

2. **Expected Response:** `201 Created`
   ```json
   {
     "success": true,
     "data": {
       "membershipId": "mem_...",
       "clubId": "test-public-club",
       "userId": "user_...",
       "role": "member",
       "status": "active",
       "joinedAt": "2025-12-19T...",
       "message": "Excited to join this cycling group!"
     }
   }
   ```

3. **Verification:** Check membership appears in club member list

**Pass Criteria:** ✅ Status 201, membership created with "active" status

### Test 1.2: Join Private Club (Pending Request)

**Objective:** Verify join requests for private clubs create pending memberships

**Steps:**
1. **Join Private Club**
   ```bash
   curl -X POST "${API_BASE_URL}/v1/clubs/test-private-club/members" \
     -H "Authorization: Bearer ${MEMBER2_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"message": "Would love to be part of this exclusive group!"}'
   ```

2. **Expected Response:** `202 Accepted`
   ```json
   {
     "success": true,
     "data": {
       "membershipId": "mem_...",
       "status": "pending",
       "requestedAt": "2025-12-19T..."
     }
   }
   ```

**Pass Criteria:** ✅ Status 202, membership created with "pending" status

### Test 1.3: Duplicate Join Prevention

**Objective:** Verify users cannot join clubs they're already members of

**Steps:**
1. **Attempt Duplicate Join**
   ```bash
   curl -X POST "${API_BASE_URL}/v1/clubs/test-public-club/members" \
     -H "Authorization: Bearer ${MEMBER1_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"message": "Trying to join again"}'
   ```

2. **Expected Response:** `409 Conflict`
   ```json
   {
     "success": false,
     "error": "ALREADY_MEMBER",
     "message": "User is already a member of this club"
   }
   ```

**Pass Criteria:** ✅ Status 409, clear error message

### Test 1.4: Leave Club

**Objective:** Verify members can leave clubs voluntarily

**Steps:**
1. **Leave Club Request**
   ```bash
   curl -X DELETE "${API_BASE_URL}/v1/clubs/test-public-club/members/me" \
     -H "Authorization: Bearer ${MEMBER1_TOKEN}"
   ```

2. **Expected Response:** `200 OK`
   ```json
   {
     "success": true,
     "message": "Successfully left the club"
   }
   ```

3. **Verification:** Confirm user no longer appears in member list

**Pass Criteria:** ✅ Status 200, membership removed

### Test 1.5: List Club Members

**Objective:** Verify member listing with filtering and pagination

**Steps:**
1. **List All Members**
   ```bash
   curl -X GET "${API_BASE_URL}/v1/clubs/test-large-club/members" \
     -H "Authorization: Bearer ${ADMIN1_TOKEN}"
   ```

2. **List Members by Role**
   ```bash
   curl -X GET "${API_BASE_URL}/v1/clubs/test-large-club/members?role=admin" \
     -H "Authorization: Bearer ${ADMIN1_TOKEN}"
   ```

3. **List with Pagination**
   ```bash
   curl -X GET "${API_BASE_URL}/v1/clubs/test-large-club/members?limit=5" \
     -H "Authorization: Bearer ${ADMIN1_TOKEN}"
   ```

**Pass Criteria:** ✅ Status 200, correct filtering, pagination works

## Test Suite 2: Role Management

### Test 2.1: Update Member Role (Promote to Admin)

**Objective:** Verify owners can promote members to admin

**Steps:**
1. **Promote Member to Admin**
   ```bash
   curl -X PUT "${API_BASE_URL}/v1/clubs/test-public-club/members/user_member1" \
     -H "Authorization: Bearer ${OWNER_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"role": "admin", "reason": "Promoting for excellent contributions"}'
   ```

2. **Expected Response:** `200 OK`
   ```json
   {
     "success": true,
     "data": {
       "membershipId": "mem_...",
       "userId": "user_member1",
       "role": "admin",
       "status": "active",
       "updatedAt": "2025-12-19T...",
       "reason": "Promoting for excellent contributions"
     }
   }
   ```

**Pass Criteria:** ✅ Status 200, role updated to "admin"

### Test 2.2: Unauthorized Role Update

**Objective:** Verify members cannot update roles

**Steps:**
1. **Member Attempts Role Update**
   ```bash
   curl -X PUT "${API_BASE_URL}/v1/clubs/test-public-club/members/user_member2" \
     -H "Authorization: Bearer ${MEMBER1_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"role": "admin"}'
   ```

2. **Expected Response:** `403 Forbidden`
   ```json
   {
     "success": false,
     "error": "INSUFFICIENT_PRIVILEGES",
     "message": "Insufficient privileges: remove_members required"
   }
   ```

**Pass Criteria:** ✅ Status 403, authorization properly enforced

### Test 2.3: Remove Member

**Objective:** Verify admins can remove members

**Steps:**
1. **Remove Member**
   ```bash
   curl -X DELETE "${API_BASE_URL}/v1/clubs/test-public-club/members/user_member2" \
     -H "Authorization: Bearer ${ADMIN1_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"reason": "Violation of club guidelines"}'
   ```

2. **Expected Response:** `200 OK`
   ```json
   {
     "success": true,
     "message": "Member removed from club"
   }
   ```

**Pass Criteria:** ✅ Status 200, member removed

### Test 2.4: Cannot Remove Owner

**Objective:** Verify owners cannot be removed

**Steps:**
1. **Attempt to Remove Owner**
   ```bash
   curl -X DELETE "${API_BASE_URL}/v1/clubs/test-public-club/members/user_owner" \
     -H "Authorization: Bearer ${ADMIN1_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"reason": "Testing owner protection"}'
   ```

2. **Expected Response:** `400 Bad Request`
   ```json
   {
     "success": false,
     "error": "CANNOT_REMOVE_OWNER",
     "message": "Cannot remove owner - ownership transfer required"
   }
   ```

**Pass Criteria:** ✅ Status 400, owner protection enforced

## Test Suite 3: Invitation System

### Test 3.1: Email Invitation (New User)

**Objective:** Verify email invitations for new users

**Steps:**
1. **Send Email Invitation**
   ```bash
   curl -X POST "${API_BASE_URL}/v1/clubs/test-public-club/invitations" \
     -H "Authorization: Bearer ${ADMIN1_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "email",
       "email": "newuser@test.com",
       "role": "member",
       "message": "Join our amazing cycling club!"
     }'
   ```

2. **Expected Response:** `201 Created`
   ```json
   {
     "success": true,
     "data": {
       "invitationId": "inv_...",
       "type": "email",
       "email": "newuser@test.com",
       "role": "member",
       "status": "pending",
       "deliveryMethod": "email",
       "expiresAt": "2025-12-26T..."
     }
   }
   ```

**Pass Criteria:** ✅ Status 201, invitation created with token

### Test 3.2: In-App Invitation (Existing User)

**Objective:** Verify in-app invitations for existing users

**Steps:**
1. **Send In-App Invitation**
   ```bash
   curl -X POST "${API_BASE_URL}/v1/clubs/test-private-club/invitations" \
     -H "Authorization: Bearer ${OWNER_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{
       "type": "user",
       "userId": "user_member1",
       "role": "member",
       "message": "We would love to have you in our exclusive club!"
     }'
   ```

2. **Expected Response:** `201 Created`
   ```json
   {
     "success": true,
     "data": {
       "invitationId": "inv_...",
       "type": "user",
       "userId": "user_member1",
       "role": "member",
       "status": "pending",
       "deliveryMethod": "in_app"
     }
   }
   ```

**Pass Criteria:** ✅ Status 201, in-app invitation created

### Test 3.3: Accept Invitation

**Objective:** Verify invitation acceptance creates membership

**Steps:**
1. **Accept Invitation**
   ```bash
   curl -X PUT "${API_BASE_URL}/v1/invitations/inv_..." \
     -H "Authorization: Bearer ${MEMBER1_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"action": "accept"}'
   ```

2. **Expected Response:** `200 OK`
   ```json
   {
     "success": true,
     "data": {
       "invitation": {
         "invitationId": "inv_...",
         "status": "accepted",
         "processedAt": "2025-12-19T..."
       },
       "membership": {
         "membershipId": "mem_...",
         "clubId": "test-private-club",
         "role": "member",
         "status": "active"
       }
     }
   }
   ```

**Pass Criteria:** ✅ Status 200, membership created

### Test 3.4: Decline Invitation

**Objective:** Verify invitation decline workflow

**Steps:**
1. **Decline Invitation**
   ```bash
   curl -X PUT "${API_BASE_URL}/v1/invitations/inv_..." \
     -H "Authorization: Bearer ${MEMBER2_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{"action": "decline"}'
   ```

2. **Expected Response:** `200 OK`
   ```json
   {
     "success": true,
     "data": {
       "invitationId": "inv_...",
       "status": "declined",
       "processedAt": "2025-12-19T..."
     },
     "message": "Invitation declined"
   }
   ```

**Pass Criteria:** ✅ Status 200, invitation declined

### Test 3.5: List User Invitations

**Objective:** Verify users can see their pending invitations

**Steps:**
1. **Get User Invitations**
   ```bash
   curl -X GET "${API_BASE_URL}/v1/users/me/invitations" \
     -H "Authorization: Bearer ${MEMBER1_TOKEN}"
   ```

2. **Expected Response:** `200 OK`
   ```json
   {
     "success": true,
     "data": [
       {
         "invitationId": "inv_...",
         "clubId": "test-club",
         "clubName": "Test Club",
         "role": "member",
         "status": "pending",
         "invitedByName": "Club Admin",
         "expiresAt": "2025-12-26T..."
       }
     ]
   }
   ```

**Pass Criteria:** ✅ Status 200, invitations listed

## Test Suite 4: User Dashboard

### Test 4.1: Get User Memberships

**Objective:** Verify users can see their club memberships

**Steps:**
1. **Get User Memberships**
   ```bash
   curl -X GET "${API_BASE_URL}/v1/users/me/memberships" \
     -H "Authorization: Bearer ${MEMBER1_TOKEN}"
   ```

2. **Expected Response:** `200 OK`
   ```json
   {
     "success": true,
     "data": [
       {
         "membershipId": "mem_...",
         "clubId": "test-public-club",
         "clubName": "Test Public Club",
         "role": "member",
         "status": "active",
         "joinedAt": "2025-12-19T..."
       }
     ]
   }
   ```

**Pass Criteria:** ✅ Status 200, memberships listed

### Test 4.2: Filter Memberships by Status

**Objective:** Verify membership filtering works

**Steps:**
1. **Get Active Memberships Only**
   ```bash
   curl -X GET "${API_BASE_URL}/v1/users/me/memberships?status=active" \
     -H "Authorization: Bearer ${MEMBER1_TOKEN}"
   ```

**Pass Criteria:** ✅ Status 200, only active memberships returned

## Test Suite 5: Join Request Management

### Test 5.1: Process Join Request (Approve)

**Objective:** Verify admins can approve join requests

**Steps:**
1. **Approve Join Request**
   ```bash
   curl -X PUT "${API_BASE_URL}/v1/clubs/test-private-club/requests/mem_..." \
     -H "Authorization: Bearer ${ADMIN1_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "approve",
       "message": "Welcome to the club!"
     }'
   ```

2. **Expected Response:** `200 OK`
   ```json
   {
     "success": true,
     "data": {
       "membershipId": "mem_...",
       "status": "active",
       "processedAt": "2025-12-19T...",
       "message": "Welcome to the club!"
     }
   }
   ```

**Pass Criteria:** ✅ Status 200, membership activated

### Test 5.2: Process Join Request (Reject)

**Objective:** Verify admins can reject join requests

**Steps:**
1. **Reject Join Request**
   ```bash
   curl -X PUT "${API_BASE_URL}/v1/clubs/test-private-club/requests/mem_..." \
     -H "Authorization: Bearer ${ADMIN1_TOKEN}" \
     -H "Content-Type: application/json" \
     -d '{
       "action": "reject",
       "message": "Application does not meet our criteria"
     }'
   ```

2. **Expected Response:** `200 OK`
   ```json
   {
     "success": true,
     "data": {
       "membershipId": "mem_...",
       "status": "removed",
       "processedAt": "2025-12-19T..."
     },
     "message": "Join request rejected"
   }
   ```

**Pass Criteria:** ✅ Status 200, membership rejected

## Test Suite 6: Authorization & Security

### Test 6.1: Unauthenticated Access

**Objective:** Verify all endpoints require authentication

**Steps:**
1. **Access Without Token**
   ```bash
   curl -X GET "${API_BASE_URL}/v1/clubs/test-public-club/members"
   ```

2. **Expected Response:** `401 Unauthorized`

**Pass Criteria:** ✅ Status 401 for all protected endpoints

### Test 6.2: Cross-Club Authorization

**Objective:** Verify users cannot manage other clubs

**Steps:**
1. **Attempt Cross-Club Management**
   ```bash
   curl -X DELETE "${API_BASE_URL}/v1/clubs/other-club/members/user_someone" \
     -H "Authorization: Bearer ${ADMIN1_TOKEN}"
   ```

2. **Expected Response:** `403 Forbidden`

**Pass Criteria:** ✅ Status 403, cross-club access denied

### Test 6.3: System Admin Override

**Objective:** Verify system admins can manage any club

**Steps:**
1. **System Admin Club Management**
   ```bash
   curl -X GET "${API_BASE_URL}/v1/clubs/any-club/members" \
     -H "Authorization: Bearer ${SITE_ADMIN_TOKEN}"
   ```

2. **Expected Response:** `200 OK`

**Pass Criteria:** ✅ Status 200, system admin access granted

## Performance Testing

### Test P.1: Response Time Validation

**Objective:** Verify API response times meet requirements

**Steps:**
1. **Measure Response Times**
   ```bash
   # Use curl with timing
   curl -w "@curl-format.txt" -X GET "${API_BASE_URL}/v1/clubs/test-large-club/members" \
     -H "Authorization: Bearer ${ADMIN1_TOKEN}"
   ```

2. **Create curl-format.txt:**
   ```
   time_namelookup:  %{time_namelookup}\n
   time_connect:     %{time_connect}\n
   time_appconnect:  %{time_appconnect}\n
   time_pretransfer: %{time_pretransfer}\n
   time_redirect:    %{time_redirect}\n
   time_starttransfer: %{time_starttransfer}\n
   time_total:       %{time_total}\n
   ```

**Pass Criteria:** ✅ Total time < 1 second for 95% of requests

### Test P.2: Concurrent User Testing

**Objective:** Verify system handles multiple simultaneous users

**Steps:**
1. **Use Artillery for Load Testing**
   ```yaml
   # artillery-config.yml
   config:
     target: '${API_BASE_URL}'
     phases:
       - duration: 60
         arrivalRate: 10
   scenarios:
     - name: "Club membership operations"
       requests:
         - get:
             url: "/v1/clubs/test-large-club/members"
             headers:
               Authorization: "Bearer ${TOKEN}"
   ```

2. **Run Load Test**
   ```bash
   artillery run artillery-config.yml
   ```

**Pass Criteria:** ✅ < 5% error rate, response times stable

## Monitoring & Observability

### CloudWatch Metrics to Monitor

1. **API Gateway Metrics**
   - Request count
   - Error rate (4xx, 5xx)
   - Response time (latency)

2. **Lambda Metrics**
   - Invocation count
   - Error count
   - Duration
   - Memory utilization

3. **DynamoDB Metrics**
   - Read/write capacity utilization
   - Throttled requests
   - Query/scan operations

### Log Analysis

1. **Check Lambda Logs**
   ```bash
   aws logs filter-log-events \
     --log-group-name /aws/lambda/sydney-cycles-join-club-dev \
     --start-time $(date -d '1 hour ago' +%s)000
   ```

2. **Monitor Error Patterns**
   - Authentication failures
   - Authorization denials
   - Validation errors
   - Database connection issues

## Test Completion Checklist

### Functional Testing ✅
- [ ] All membership operations work correctly
- [ ] Role management enforces proper hierarchy
- [ ] Invitation system handles both email and in-app
- [ ] Authorization properly restricts access
- [ ] Data consistency maintained

### Performance Testing ✅
- [ ] Response times meet requirements
- [ ] System handles concurrent users
- [ ] Database queries optimized
- [ ] No memory leaks detected

### Security Testing ✅
- [ ] Authentication required for all operations
- [ ] Authorization enforces role restrictions
- [ ] Cross-club access properly blocked
- [ ] Input validation prevents attacks

### Integration Testing ✅
- [ ] Phase 1.3 authorization integration works
- [ ] User profile service integration works
- [ ] DynamoDB operations are atomic
- [ ] Error handling provides clear messages

## Troubleshooting Common Issues

### Issue: 401 Unauthorized
**Cause:** Invalid or expired JWT token  
**Solution:** Refresh token or re-authenticate user

### Issue: 403 Forbidden
**Cause:** Insufficient privileges for operation  
**Solution:** Verify user role and club membership

### Issue: 409 Conflict
**Cause:** Duplicate membership or invitation  
**Solution:** Check existing memberships/invitations

### Issue: 500 Internal Server Error
**Cause:** Database connection or Lambda error  
**Solution:** Check CloudWatch logs for details

---

**Testing Complete: Phase 2.2 Club Membership & Roles**  
**Ready for Production Use** 🚀