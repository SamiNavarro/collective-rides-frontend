# Phase 2.5 Testing Guide

**Phase:** 2.5 - Ride Completion & Strava Integration  
**Last Updated:** December 31, 2024  
**Environment:** Development  

## Overview

This guide provides comprehensive testing procedures for Phase 2.5 functionality, including ride completion workflows and Strava integration features. Follow these procedures to validate the implementation before production deployment.

## Prerequisites

### Test Environment Setup
- [ ] Phase 2.5 deployed to development environment
- [ ] Test users created with appropriate roles
- [ ] Test clubs and rides available
- [ ] Strava developer application configured (for integration tests)
- [ ] Test tokens available for API calls

### Required Tools
- API testing tool (Postman, curl, or similar)
- Browser for OAuth flow testing
- Strava account for integration testing
- AWS CLI access for debugging
- CloudWatch access for monitoring

### Test Data Requirements
```bash
# Get test tokens
./scripts/get-test-tokens.sh

# Test users needed:
- Club admin user (can manage rides)
- Ride leader user (can complete rides)  
- Regular member user (can participate)
- Non-member user (for authorization testing)
```

## Test Categories

## 1. Ride Completion Testing

### 1.1 Complete Ride - Happy Path

**Objective:** Verify ride leaders can successfully complete rides

**Prerequisites:**
- Active ride with participants
- User has ride leader permissions
- Ride is in "published" status

**Test Steps:**
```bash
# 1. Complete a ride
curl -X POST "${API_URL}/v1/clubs/${CLUB_ID}/rides/${RIDE_ID}/complete" \
  -H "Authorization: Bearer ${RIDE_LEADER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "completionNotes": "Great ride, everyone did well!",
    "actualDistance": 25.5,
    "actualDuration": 5400,
    "weatherConditions": "sunny"
  }'

# Expected Response: 200 OK
{
  "success": true,
  "data": {
    "rideId": "ride_123",
    "completedAt": "2024-12-31T14:30:00Z",
    "completedBy": "user_456",
    "completionSummary": {
      "participantCount": 8,
      "attendanceCount": 7,
      "evidenceCount": 5,
      "completionRate": 87.5
    }
  }
}
```

**Validation:**
- [ ] Response status is 200
- [ ] Ride marked as completed in database
- [ ] Completion timestamp recorded
- [ ] Completion summary generated
- [ ] Attendance processing initiated

### 1.2 Complete Ride - Authorization Tests

**Test Cases:**
```bash
# Test 1: Non-member attempts to complete ride
curl -X POST "${API_URL}/v1/clubs/${CLUB_ID}/rides/${RIDE_ID}/complete" \
  -H "Authorization: Bearer ${NON_MEMBER_TOKEN}"
# Expected: 403 Forbidden

# Test 2: Regular member (non-leader) attempts completion
curl -X POST "${API_URL}/v1/clubs/${CLUB_ID}/rides/${RIDE_ID}/complete" \
  -H "Authorization: Bearer ${MEMBER_TOKEN}"
# Expected: 403 Forbidden

# Test 3: Unauthenticated request
curl -X POST "${API_URL}/v1/clubs/${CLUB_ID}/rides/${RIDE_ID}/complete"
# Expected: 401 Unauthorized
```

### 1.3 Complete Ride - Error Scenarios

**Test Cases:**
```bash
# Test 1: Complete already completed ride
curl -X POST "${API_URL}/v1/clubs/${CLUB_ID}/rides/${COMPLETED_RIDE_ID}/complete" \
  -H "Authorization: Bearer ${RIDE_LEADER_TOKEN}"
# Expected: 409 Conflict

# Test 2: Complete non-existent ride
curl -X POST "${API_URL}/v1/clubs/${CLUB_ID}/rides/invalid_ride/complete" \
  -H "Authorization: Bearer ${RIDE_LEADER_TOKEN}"
# Expected: 404 Not Found

# Test 3: Complete ride with invalid data
curl -X POST "${API_URL}/v1/clubs/${CLUB_ID}/rides/${RIDE_ID}/complete" \
  -H "Authorization: Bearer ${RIDE_LEADER_TOKEN}" \
  -d '{"actualDistance": "invalid"}'
# Expected: 400 Bad Request
```

## 2. Ride Summary Testing

### 2.1 Get Ride Summary - Happy Path

**Test Steps:**
```bash
# Get ride summary for completed ride
curl -X GET "${API_URL}/v1/clubs/${CLUB_ID}/rides/${COMPLETED_RIDE_ID}/summary" \
  -H "Authorization: Bearer ${MEMBER_TOKEN}"

# Expected Response: 200 OK
{
  "success": true,
  "data": {
    "ride": {
      "rideId": "ride_123",
      "name": "Morning Training Ride",
      "status": "completed",
      "completedAt": "2024-12-31T14:30:00Z"
    },
    "participants": [
      {
        "userId": "user_456",
        "name": "John Doe",
        "attendanceStatus": "attended",
        "evidenceCount": 2
      }
    ],
    "summary": {
      "totalParticipants": 8,
      "attendedCount": 7,
      "evidenceCount": 12,
      "completionRate": 87.5
    },
    "evidence": [
      {
        "type": "strava_activity",
        "count": 10
      },
      {
        "type": "manual",
        "count": 2
      }
    ]
  }
}
```

**Validation:**
- [ ] Complete ride information returned
- [ ] Participant list with attendance status
- [ ] Evidence summary included
- [ ] Statistics calculated correctly

### 2.2 Get Ride Summary - Authorization Tests

**Test Cases:**
```bash
# Test 1: Non-member access
curl -X GET "${API_URL}/v1/clubs/${CLUB_ID}/rides/${RIDE_ID}/summary" \
  -H "Authorization: Bearer ${NON_MEMBER_TOKEN}"
# Expected: 403 Forbidden

# Test 2: Access incomplete ride summary
curl -X GET "${API_URL}/v1/clubs/${CLUB_ID}/rides/${INCOMPLETE_RIDE_ID}/summary" \
  -H "Authorization: Bearer ${MEMBER_TOKEN}"
# Expected: 400 Bad Request (ride not completed)
```

## 3. Attendance Tracking Testing

### 3.1 Update Attendance - Happy Path

**Test Steps:**
```bash
# Update participant attendance
curl -X PUT "${API_URL}/v1/clubs/${CLUB_ID}/rides/${RIDE_ID}/participants/${USER_ID}/attendance" \
  -H "Authorization: Bearer ${RIDE_LEADER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "attendanceStatus": "attended",
    "notes": "Completed full ride distance"
  }'

# Expected Response: 200 OK
{
  "success": true,
  "data": {
    "userId": "user_789",
    "attendanceStatus": "attended",
    "updatedAt": "2024-12-31T15:00:00Z",
    "updatedBy": "user_456"
  }
}
```

**Validation:**
- [ ] Attendance status updated correctly
- [ ] Timestamp and updater recorded
- [ ] Ride summary statistics updated

### 3.2 Update Attendance - Status Variations

**Test Cases:**
```bash
# Test different attendance statuses
for status in "attended" "absent" "pending"; do
  curl -X PUT "${API_URL}/v1/clubs/${CLUB_ID}/rides/${RIDE_ID}/participants/${USER_ID}/attendance" \
    -H "Authorization: Bearer ${RIDE_LEADER_TOKEN}" \
    -d "{\"attendanceStatus\": \"${status}\"}"
done
```

## 4. Manual Evidence Linking Testing

### 4.1 Link Manual Evidence - Happy Path

**Test Steps:**
```bash
# Link manual evidence for participant
curl -X POST "${API_URL}/v1/clubs/${CLUB_ID}/rides/${RIDE_ID}/participants/${USER_ID}/evidence/manual" \
  -H "Authorization: Bearer ${RIDE_LEADER_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "evidenceType": "photo",
    "description": "Photo at finish line",
    "url": "https://example.com/photo.jpg",
    "metadata": {
      "timestamp": "2024-12-31T14:25:00Z",
      "location": "Sydney Harbour Bridge"
    }
  }'

# Expected Response: 201 Created
{
  "success": true,
  "data": {
    "evidenceId": "evidence_123",
    "type": "photo",
    "linkedAt": "2024-12-31T15:30:00Z",
    "linkedBy": "user_456"
  }
}
```

**Validation:**
- [ ] Evidence record created
- [ ] Participant evidence count updated
- [ ] Ride summary reflects new evidence

## 5. Strava Integration Testing

### 5.1 OAuth Flow Testing

**Manual Test Steps:**

1. **Initiate OAuth Connection**
```bash
# Get OAuth connection URL
curl -X GET "${API_URL}/integrations/strava/connect" \
  -H "Authorization: Bearer ${USER_TOKEN}"

# Expected Response: 200 OK
{
  "success": true,
  "data": {
    "authorizationUrl": "https://www.strava.com/oauth/authorize?client_id=...",
    "state": "secure_random_state"
  }
}
```

2. **Manual Browser Testing**
- [ ] Open authorization URL in browser
- [ ] Strava login page displays correctly
- [ ] Authorization scope displayed properly
- [ ] User can approve/deny access

3. **OAuth Callback Processing**
```bash
# Simulate callback (normally done by browser redirect)
curl -X GET "${API_URL}/integrations/strava/callback?code=AUTH_CODE&state=STATE" \
  -H "Authorization: Bearer ${USER_TOKEN}"

# Expected Response: 200 OK
{
  "success": true,
  "data": {
    "integrationId": "integration_123",
    "stravaUserId": "12345",
    "connectedAt": "2024-12-31T16:00:00Z"
  }
}
```

**Validation:**
- [ ] OAuth tokens stored securely (encrypted)
- [ ] Integration record created
- [ ] User can access Strava-connected features

### 5.2 Webhook Processing Testing

**Test Steps:**

1. **Webhook Verification (GET)**
```bash
# Strava webhook verification
curl -X GET "${API_URL}/integrations/strava/webhook?hub.mode=subscribe&hub.challenge=test_challenge&hub.verify_token=${WEBHOOK_TOKEN}"

# Expected Response: 200 OK with challenge echoed
```

2. **Activity Event Processing (POST)**
```bash
# Simulate Strava activity webhook
curl -X POST "${API_URL}/integrations/strava/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "object_type": "activity",
    "object_id": 12345,
    "aspect_type": "create",
    "owner_id": 67890,
    "subscription_id": 1,
    "event_time": 1640995200
  }'

# Expected Response: 200 OK
```

**Validation:**
- [ ] Webhook signature verified
- [ ] Activity events processed correctly
- [ ] Automatic ride matching attempted
- [ ] Evidence records created when matched

### 5.3 Activity Matching Testing

**Test Scenarios:**

1. **Tag-Based Matching**
```bash
# Create activity with ride ID in name
# Activity name: "Morning ride #ride_123"
# Expected: Automatic match to ride_123
```

2. **Time-Window Matching**
```bash
# Create activity during ride timeframe
# Activity time: overlaps with ride duration
# Expected: Potential match identified
```

3. **No Match Scenarios**
```bash
# Test activities that shouldn't match:
- Activity outside ride timeframe
- Non-cycling activity types
- User not registered for ride
```

## 6. Integration Testing

### 6.1 End-to-End Ride Completion Flow

**Complete Workflow Test:**

1. **Setup Phase**
```bash
# Create test ride with participants
# Ensure some participants have Strava connected
```

2. **Execution Phase**
```bash
# 1. Complete the ride
# 2. Update attendance for participants
# 3. Link manual evidence
# 4. Verify Strava activities matched automatically
# 5. Generate ride summary
```

3. **Validation Phase**
```bash
# Verify complete workflow:
- Ride marked as completed
- All attendance statuses updated
- Evidence properly linked
- Summary statistics correct
- Strava activities matched
```

### 6.2 Cross-Service Integration

**Test Scenarios:**
- [ ] Ride completion triggers Strava matching
- [ ] Evidence updates reflect in summaries
- [ ] Attendance changes update statistics
- [ ] Authorization works across all endpoints

## 7. Performance Testing

### 7.1 Response Time Testing

**Benchmarks:**
```bash
# Test response times for key operations
time curl -X POST "${API_URL}/v1/clubs/${CLUB_ID}/rides/${RIDE_ID}/complete" \
  -H "Authorization: Bearer ${TOKEN}"
# Target: < 3 seconds

time curl -X GET "${API_URL}/v1/clubs/${CLUB_ID}/rides/${RIDE_ID}/summary" \
  -H "Authorization: Bearer ${TOKEN}"
# Target: < 2 seconds
```

### 7.2 Load Testing

**Test Scenarios:**
- [ ] Multiple concurrent ride completions
- [ ] High-volume webhook processing
- [ ] Bulk attendance updates
- [ ] Large ride summary generation

## 8. Error Handling Testing

### 8.1 Network Failure Scenarios

**Test Cases:**
- [ ] Strava API unavailable during OAuth
- [ ] Webhook delivery failures
- [ ] DynamoDB connection issues
- [ ] KMS encryption service failures

### 8.2 Data Validation Testing

**Test Cases:**
- [ ] Invalid ride completion data
- [ ] Malformed webhook payloads
- [ ] Invalid attendance status values
- [ ] Missing required fields

## 9. Security Testing

### 9.1 Authentication Testing

**Test Cases:**
- [ ] Expired tokens rejected
- [ ] Invalid tokens rejected
- [ ] Missing authentication headers
- [ ] Token tampering detection

### 9.2 Authorization Testing

**Test Cases:**
- [ ] Cross-club access prevention
- [ ] Role-based access enforcement
- [ ] Resource ownership validation
- [ ] Privilege escalation prevention

### 9.3 Data Security Testing

**Test Cases:**
- [ ] OAuth tokens encrypted at rest
- [ ] Webhook signature verification
- [ ] Input sanitization
- [ ] SQL injection prevention

## Test Execution Checklist

### Pre-Test Setup
- [ ] Test environment verified
- [ ] Test data prepared
- [ ] Monitoring enabled
- [ ] Backup procedures ready

### Test Execution
- [ ] Unit tests passing
- [ ] Integration tests completed
- [ ] Performance benchmarks met
- [ ] Security tests passed
- [ ] Error scenarios validated

### Post-Test Validation
- [ ] No data corruption detected
- [ ] System performance stable
- [ ] Error logs reviewed
- [ ] Cleanup procedures executed

## Troubleshooting Guide

### Common Issues

**Issue:** Ride completion fails with 500 error
**Solution:** Check CloudWatch logs for Lambda function errors

**Issue:** Strava OAuth redirect fails
**Solution:** Verify callback URL configuration in Strava app

**Issue:** Webhook events not processing
**Solution:** Check webhook signature verification and token configuration

**Issue:** Activity matching not working
**Solution:** Verify user has Strava integration and activity meets matching criteria

### Debug Commands

```bash
# Check Lambda function logs
aws logs tail /aws/lambda/sydney-cycles-complete-ride-development --follow

# Verify DynamoDB records
aws dynamodb get-item --table-name sydney-cycles-main-development \
  --key '{"PK":{"S":"RIDE#ride_123"},"SK":{"S":"METADATA"}}'

# Check KMS key permissions
aws kms describe-key --key-id alias/strava-token-encryption-development
```

## Test Results Template

### Test Summary
- **Total Tests:** ___
- **Passed:** ___
- **Failed:** ___
- **Skipped:** ___

### Critical Issues
- [ ] No critical issues found
- [ ] Issues documented and tracked

### Performance Results
- **Ride Completion:** ___ ms (target: < 3000ms)
- **Ride Summary:** ___ ms (target: < 2000ms)
- **OAuth Flow:** ___ ms (target: < 5000ms)

### Sign-off
- [ ] **QA Lead:** Testing completed and approved
- [ ] **Technical Lead:** Implementation validated
- [ ] **Product Owner:** Functionality approved

---

**Testing Guide Version:** 1.0  
**Last Updated:** December 31, 2024  
**Next Review:** January 7, 2025