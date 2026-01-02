# Phase 2.3: Ride Management & Event System - Testing Guide

**Version:** 1.0  
**Date:** December 28, 2025  
**Phase:** 2.3 - Ride Management & Event Coordination  
**Status:** Ready for Testing

## Overview

This document provides comprehensive testing procedures for Phase 2.3 Ride Management & Event System, covering ride governance, participation workflows, and authorization controls.

## Testing Prerequisites

### Required Test Data
- **Test Users:** Minimum 5 users with different roles
- **Test Clubs:** 2 clubs with different settings (public/private)
- **Club Memberships:** Users assigned to different club roles
- **Authentication:** Valid JWT tokens for all test users

### Test Environment Setup
```bash
# Deploy Phase 2.3 infrastructure
cd backend
npm run deploy

# Setup test users and clubs (from Phase 2.2)
./scripts/setup-test-users.sh

# Verify Phase 2.2 functionality is intact
npm run test:phase-2.2
```

### Test User Roles
| User ID | Name | Club Role | System Role | Purpose |
|---------|------|-----------|-------------|---------|
| user_001 | Alice Admin | Owner | User | Club owner, full permissions |
| user_002 | Bob Captain | Ride Captain | User | Can create and publish rides |
| user_003 | Carol Leader | Ride Leader | User | Can publish rides, manage participants |
| user_004 | Dave Member | Member | User | Basic member, can create drafts |
| user_005 | Eve External | None | User | Non-member for public ride testing |

## Test Categories

### 1. Infrastructure & Deployment Tests

#### 1.1 CDK Deployment Validation
```bash
# Test CDK synthesis
npm run cdk synth

# Validate stack outputs
aws cloudformation describe-stacks --stack-name SydneyCyclesStack
```

**Expected Results:**
- ✅ Stack deploys without errors
- ✅ All Lambda functions created
- ✅ API Gateway routes configured
- ✅ DynamoDB permissions granted

#### 1.2 API Gateway Route Validation
```bash
# Test all ride endpoints are accessible
curl -X OPTIONS https://api-url/v1/clubs/club_123/rides
curl -X OPTIONS https://api-url/v1/clubs/club_123/rides/ride_123/publish
curl -X OPTIONS https://api-url/v1/users/me/rides
```

**Expected Results:**
- ✅ All endpoints return CORS headers
- ✅ OPTIONS requests succeed
- ✅ Proper HTTP methods allowed

### 2. Ride Creation & Governance Tests

#### 2.1 Draft Ride Creation (Any Member)
```bash
# Test: Member creates draft ride
curl -X POST https://api-url/v1/clubs/club_123/rides \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Saturday Morning Training Ride",
    "description": "Moderate pace training ride through the Royal National Park",
    "rideType": "training",
    "difficulty": "intermediate",
    "startDateTime": "2025-12-28T06:00:00.000Z",
    "estimatedDuration": 180,
    "maxParticipants": 20,
    "meetingPoint": {
      "name": "Cronulla Station",
      "address": "Cronulla NSW 2230",
      "coordinates": {
        "latitude": -34.0569,
        "longitude": 151.1537
      },
      "instructions": "Meet at the main entrance"
    },
    "route": {
      "name": "Royal National Park Loop",
      "type": "basic",
      "distance": 45.5,
      "estimatedTime": 180,
      "difficulty": "intermediate",
      "waypoints": [
        {
          "name": "Cronulla Station",
          "coordinates": { "latitude": -34.0569, "longitude": 151.1537 },
          "type": "start"
        }
      ]
    },
    "requirements": {
      "equipment": ["helmet", "water_bottle", "spare_tube"],
      "experience": "intermediate",
      "fitness": "moderate"
    },
    "isPublic": false,
    "allowWaitlist": true
  }'
```

**Expected Results:**
- ✅ Status: 201 Created
- ✅ Response includes `status: "draft"`
- ✅ Response includes `scope: "club"`
- ✅ Response includes `audience: "invite_only"`
- ✅ Creator becomes captain participant

#### 2.2 Immediate Publish (Leadership Only)
```bash
# Test: Ride Captain creates and publishes immediately
curl -X POST https://api-url/v1/clubs/club_123/rides \
  -H "Authorization: Bearer $CAPTAIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Official Club Training Ride",
    "description": "Official club training session",
    "rideType": "training",
    "difficulty": "intermediate",
    "startDateTime": "2025-12-29T06:00:00.000Z",
    "estimatedDuration": 120,
    "publishImmediately": true,
    "meetingPoint": {
      "name": "Hyde Park",
      "address": "Sydney NSW 2000",
      "coordinates": {
        "latitude": -33.8688,
        "longitude": 151.2093
      }
    }
  }'
```

**Expected Results:**
- ✅ Status: 201 Created
- ✅ Response includes `status: "published"`
- ✅ Response includes `audience: "members_only"`
- ✅ Response includes `publishedBy` and `publishedAt`

#### 2.3 Member Cannot Publish Immediately
```bash
# Test: Regular member tries to publish immediately (should fail)
curl -X POST https://api-url/v1/clubs/club_123/rides \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Unauthorized Publish Attempt",
    "description": "This should fail",
    "rideType": "social",
    "difficulty": "beginner",
    "startDateTime": "2025-12-30T08:00:00.000Z",
    "estimatedDuration": 60,
    "publishImmediately": true,
    "meetingPoint": {
      "name": "Test Location",
      "address": "Test Address",
      "coordinates": { "latitude": -33.8688, "longitude": 151.2093 }
    }
  }'
```

**Expected Results:**
- ✅ Status: 403 Forbidden
- ✅ Error: "Insufficient privileges to publish rides immediately"

### 3. Ride Publishing Workflow Tests

#### 3.1 Publish Draft Ride (Leadership)
```bash
# First create a draft ride as member, then publish as captain
RIDE_ID=$(curl -X POST https://api-url/v1/clubs/club_123/rides \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Draft to Publish","description":"Test","rideType":"social","difficulty":"beginner","startDateTime":"2025-12-31T10:00:00.000Z","estimatedDuration":90,"meetingPoint":{"name":"Test","address":"Test","coordinates":{"latitude":-33.8688,"longitude":151.2093}}}' \
  | jq -r '.data.rideId')

# Publish the draft ride
curl -X POST https://api-url/v1/clubs/club_123/rides/$RIDE_ID/publish \
  -H "Authorization: Bearer $CAPTAIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "audience": "members_only",
    "isPublic": false,
    "publishMessage": "Official club ride - all members welcome!"
  }'
```

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Response includes updated status: "published"
- ✅ Response includes `publishedBy` and `publishedAt`
- ✅ Ride appears in club listings

#### 3.2 Member Cannot Publish Others' Drafts
```bash
# Test: Regular member tries to publish another member's draft
curl -X POST https://api-url/v1/clubs/club_123/rides/$RIDE_ID/publish \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "audience": "members_only"
  }'
```

**Expected Results:**
- ✅ Status: 403 Forbidden
- ✅ Error: "Insufficient privileges to publish rides"

### 4. Ride Visibility & Authorization Tests

#### 4.1 Draft Ride Visibility
```bash
# Test: Creator can see their draft
curl -X GET https://api-url/v1/clubs/club_123/rides?includeDrafts=true \
  -H "Authorization: Bearer $MEMBER_TOKEN"

# Test: Leadership can see all drafts
curl -X GET https://api-url/v1/clubs/club_123/rides?includeDrafts=true \
  -H "Authorization: Bearer $CAPTAIN_TOKEN"

# Test: Regular member cannot see others' drafts
curl -X GET https://api-url/v1/clubs/club_123/rides?includeDrafts=true \
  -H "Authorization: Bearer $OTHER_MEMBER_TOKEN"
```

**Expected Results:**
- ✅ Creator sees their own drafts
- ✅ Leadership sees all drafts
- ✅ Other members don't see drafts they didn't create
- ✅ Without `includeDrafts=true`, no drafts are returned

#### 4.2 Published Ride Visibility
```bash
# Test: All club members can see published rides
curl -X GET https://api-url/v1/clubs/club_123/rides \
  -H "Authorization: Bearer $MEMBER_TOKEN"

# Test: Non-members cannot see club rides
curl -X GET https://api-url/v1/clubs/club_123/rides \
  -H "Authorization: Bearer $NON_MEMBER_TOKEN"
```

**Expected Results:**
- ✅ Club members see published rides
- ✅ Non-members get 403 Forbidden
- ✅ Only published rides returned by default

#### 4.3 Public Ride Visibility
```bash
# Create a public ride
curl -X POST https://api-url/v1/clubs/club_123/rides \
  -H "Authorization: Bearer $CAPTAIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Public Community Ride",
    "description": "Open to everyone",
    "rideType": "social",
    "difficulty": "beginner",
    "startDateTime": "2026-01-01T09:00:00.000Z",
    "estimatedDuration": 120,
    "publishImmediately": true,
    "isPublic": true,
    "meetingPoint": {
      "name": "Sydney Harbour Bridge",
      "address": "Sydney NSW 2000",
      "coordinates": { "latitude": -33.8523, "longitude": 151.2108 }
    }
  }'

# Test: Non-members can see public rides
curl -X GET https://api-url/v1/clubs/club_123/rides \
  -H "Authorization: Bearer $NON_MEMBER_TOKEN"
```

**Expected Results:**
- ✅ Public rides visible to non-members (read-only)
- ✅ Non-members cannot join public rides (club membership required)

### 5. Ride Participation Tests

#### 5.1 Join Published Ride
```bash
# Test: Club member joins published ride
curl -X POST https://api-url/v1/clubs/club_123/rides/$PUBLISHED_RIDE_ID/participants \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Looking forward to this ride!"
  }'
```

**Expected Results:**
- ✅ Status: 201 Created
- ✅ Response includes `status: "confirmed"`
- ✅ Response includes `role: "participant"`
- ✅ Ride participant count incremented

#### 5.2 Cannot Join Draft Ride
```bash
# Test: Member tries to join draft ride (should fail)
curl -X POST https://api-url/v1/clubs/club_123/rides/$DRAFT_RIDE_ID/participants \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Want to join this draft"
  }'
```

**Expected Results:**
- ✅ Status: 400 Bad Request
- ✅ Error: "Can only join published rides"

#### 5.3 Waitlist Functionality
```bash
# Create ride with limited capacity
SMALL_RIDE_ID=$(curl -X POST https://api-url/v1/clubs/club_123/rides \
  -H "Authorization: Bearer $CAPTAIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Small Ride","description":"Limited capacity","rideType":"training","difficulty":"advanced","startDateTime":"2026-01-02T07:00:00.000Z","estimatedDuration":180,"maxParticipants":2,"publishImmediately":true,"allowWaitlist":true,"meetingPoint":{"name":"Test","address":"Test","coordinates":{"latitude":-33.8688,"longitude":151.2093}}}' \
  | jq -r '.data.rideId')

# Fill the ride to capacity (captain + 1 more)
curl -X POST https://api-url/v1/clubs/club_123/rides/$SMALL_RIDE_ID/participants \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Filling capacity"}'

# Next participant should be waitlisted
curl -X POST https://api-url/v1/clubs/club_123/rides/$SMALL_RIDE_ID/participants \
  -H "Authorization: Bearer $OTHER_MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Should be waitlisted"}'
```

**Expected Results:**
- ✅ First participant: `status: "confirmed"`
- ✅ Second participant: `status: "waitlisted"`
- ✅ Waitlist position assigned correctly

#### 5.4 Leave Ride
```bash
# Test: Participant leaves ride
curl -X DELETE https://api-url/v1/clubs/club_123/rides/$RIDE_ID/participants/me \
  -H "Authorization: Bearer $MEMBER_TOKEN"
```

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Participant removed from ride
- ✅ Waitlisted participant promoted if applicable
- ✅ Ride participant count decremented

#### 5.5 Captain Cannot Leave
```bash
# Test: Ride captain tries to leave (should fail)
curl -X DELETE https://api-url/v1/clubs/club_123/rides/$RIDE_ID/participants/me \
  -H "Authorization: Bearer $CAPTAIN_TOKEN"
```

**Expected Results:**
- ✅ Status: 400 Bad Request
- ✅ Error: "Cannot remove ride captain"

### 6. User Ride Discovery Tests

#### 6.1 Get User's Rides
```bash
# Test: Get user's ride participation history
curl -X GET https://api-url/v1/users/me/rides \
  -H "Authorization: Bearer $MEMBER_TOKEN"

# Test: Filter by status
curl -X GET "https://api-url/v1/users/me/rides?status=upcoming&limit=10" \
  -H "Authorization: Bearer $MEMBER_TOKEN"

# Test: Filter by role
curl -X GET "https://api-url/v1/users/me/rides?role=captain" \
  -H "Authorization: Bearer $CAPTAIN_TOKEN"
```

**Expected Results:**
- ✅ Returns user's ride participations
- ✅ Includes ride details and participation info
- ✅ Filtering works correctly
- ✅ Pagination works with cursor

### 7. Data Validation Tests

#### 7.1 Required Field Validation
```bash
# Test: Missing required fields
curl -X POST https://api-url/v1/clubs/club_123/rides \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "",
    "rideType": "training"
  }'
```

**Expected Results:**
- ✅ Status: 400 Bad Request
- ✅ Validation errors for missing fields

#### 7.2 Business Rule Validation
```bash
# Test: Start date in the past
curl -X POST https://api-url/v1/clubs/club_123/rides \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Past Ride",
    "description": "This should fail",
    "rideType": "training",
    "difficulty": "beginner",
    "startDateTime": "2020-01-01T10:00:00.000Z",
    "estimatedDuration": 60,
    "meetingPoint": {
      "name": "Test",
      "address": "Test",
      "coordinates": { "latitude": -33.8688, "longitude": 151.2093 }
    }
  }'
```

**Expected Results:**
- ✅ Status: 400 Bad Request
- ✅ Error: "Start date must be in the future"

### 8. Error Handling Tests

#### 8.1 Not Found Errors
```bash
# Test: Get non-existent ride
curl -X GET https://api-url/v1/clubs/club_123/rides/nonexistent \
  -H "Authorization: Bearer $MEMBER_TOKEN"

# Test: Join non-existent ride
curl -X POST https://api-url/v1/clubs/club_123/rides/nonexistent/participants \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Results:**
- ✅ Status: 404 Not Found
- ✅ Proper error messages

#### 8.2 Authorization Errors
```bash
# Test: Non-member tries to create ride
curl -X POST https://api-url/v1/clubs/club_123/rides \
  -H "Authorization: Bearer $NON_MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Unauthorized Ride",
    "description": "Should fail",
    "rideType": "social",
    "difficulty": "beginner",
    "startDateTime": "2026-01-03T10:00:00.000Z",
    "estimatedDuration": 60,
    "meetingPoint": {
      "name": "Test",
      "address": "Test",
      "coordinates": { "latitude": -33.8688, "longitude": 151.2093 }
    }
  }'
```

**Expected Results:**
- ✅ Status: 403 Forbidden
- ✅ Error: "Insufficient privileges"

### 9. Integration Tests

#### 9.1 End-to-End Ride Workflow
```bash
# Complete workflow: Create draft → Publish → Join → Leave
# 1. Member creates draft
DRAFT_ID=$(curl -X POST https://api-url/v1/clubs/club_123/rides \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"E2E Test Ride","description":"End-to-end test","rideType":"social","difficulty":"beginner","startDateTime":"2026-01-04T11:00:00.000Z","estimatedDuration":90,"meetingPoint":{"name":"Test Location","address":"Test Address","coordinates":{"latitude":-33.8688,"longitude":151.2093}}}' \
  | jq -r '.data.rideId')

# 2. Captain publishes draft
curl -X POST https://api-url/v1/clubs/club_123/rides/$DRAFT_ID/publish \
  -H "Authorization: Bearer $CAPTAIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"audience":"members_only","publishMessage":"Published for testing"}'

# 3. Member joins ride
curl -X POST https://api-url/v1/clubs/club_123/rides/$DRAFT_ID/participants \
  -H "Authorization: Bearer $OTHER_MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Joining for test"}'

# 4. Verify ride details
curl -X GET https://api-url/v1/clubs/club_123/rides/$DRAFT_ID \
  -H "Authorization: Bearer $MEMBER_TOKEN"

# 5. Member leaves ride
curl -X DELETE https://api-url/v1/clubs/club_123/rides/$DRAFT_ID/participants/me \
  -H "Authorization: Bearer $OTHER_MEMBER_TOKEN"
```

**Expected Results:**
- ✅ All steps complete successfully
- ✅ Ride status transitions correctly
- ✅ Participant counts update properly
- ✅ Authorization enforced at each step

### 10. Performance Tests

#### 10.1 Pagination Performance
```bash
# Test large result sets with pagination
curl -X GET "https://api-url/v1/clubs/club_123/rides?limit=100" \
  -H "Authorization: Bearer $MEMBER_TOKEN"

# Test cursor-based pagination
CURSOR=$(curl -X GET "https://api-url/v1/clubs/club_123/rides?limit=5" \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  | jq -r '.pagination.nextCursor')

curl -X GET "https://api-url/v1/clubs/club_123/rides?limit=5&cursor=$CURSOR" \
  -H "Authorization: Bearer $MEMBER_TOKEN"
```

**Expected Results:**
- ✅ Responses under 2 seconds
- ✅ Pagination works correctly
- ✅ No duplicate results

## Test Execution Checklist

### Pre-Deployment Tests
- [ ] CDK synthesis succeeds
- [ ] TypeScript compilation passes
- [ ] Unit tests pass (if implemented)
- [ ] Infrastructure validation complete

### Post-Deployment Tests
- [ ] All API endpoints accessible
- [ ] Authentication working
- [ ] Authorization enforced correctly
- [ ] Ride creation workflows functional
- [ ] Participation workflows functional
- [ ] Data validation working
- [ ] Error handling appropriate
- [ ] Performance acceptable

### Regression Tests
- [ ] Phase 2.2 functionality intact
- [ ] Club membership still working
- [ ] User profile service unaffected
- [ ] Authorization service compatible

## Success Criteria

### Functional Requirements ✅
- [ ] Members can create draft rides
- [ ] Leadership can publish official rides
- [ ] Ride visibility rules enforced
- [ ] Participation workflows complete
- [ ] User ride discovery functional

### Technical Requirements ✅
- [ ] All API endpoints operational
- [ ] Authorization integration seamless
- [ ] Data consistency maintained
- [ ] Performance targets met
- [ ] Error handling comprehensive

### Quality Requirements ✅
- [ ] Security controls effective
- [ ] Audit logging functional
- [ ] Type safety maintained
- [ ] Documentation complete

## Troubleshooting Guide

### Common Issues

#### 1. Authorization Failures
**Symptoms:** 403 Forbidden errors
**Solutions:**
- Verify JWT token validity
- Check club membership status
- Confirm user role assignments
- Validate capability mappings

#### 2. Ride Creation Failures
**Symptoms:** 400 Bad Request on ride creation
**Solutions:**
- Validate required fields
- Check date format (ISO 8601)
- Verify coordinates format
- Confirm club membership

#### 3. Participation Issues
**Symptoms:** Cannot join or leave rides
**Solutions:**
- Verify ride status (must be published to join)
- Check ride capacity and waitlist settings
- Confirm user is not already participating
- Validate captain role restrictions

#### 4. Data Inconsistency
**Symptoms:** Participant counts incorrect
**Solutions:**
- Check DynamoDB transaction logs
- Verify index item synchronization
- Review concurrent operation handling
- Validate atomic update operations

## Next Steps

1. **Execute Test Plan:** Run all test categories systematically
2. **Document Results:** Record test outcomes and any issues
3. **Fix Issues:** Address any failures or performance problems
4. **Regression Testing:** Ensure Phase 2.2 functionality intact
5. **Performance Optimization:** Tune any slow operations
6. **Security Review:** Validate authorization and data protection
7. **Production Readiness:** Confirm system ready for deployment

---

**Testing Status:** Ready for Execution  
**Phase 2.3 Implementation:** Complete  
**Next Phase:** Phase 2.4 - Advanced Route Management