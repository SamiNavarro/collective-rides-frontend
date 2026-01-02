# Phase 2.4: Advanced Route Management (MVP) - Testing Guide

**Version:** 1.0  
**Date:** December 30, 2025  
**Phase:** 2.4 - Advanced Route Management (MVP)  
**Status:** Ready for Testing

## Overview

This document provides comprehensive testing procedures for Phase 2.4 Advanced Route Management MVP, covering GPX file storage, core analytics, and club-scoped route templates. The testing focuses on the MVP scope while ensuring proper foundations for future enhancements.

## Testing Prerequisites

### Required Test Data
- **Test Users:** Minimum 6 users with different roles
- **Test Clubs:** 2 clubs with different settings
- **Club Memberships:** Users assigned to different club roles
- **Authentication:** Valid JWT tokens for all test users
- **Test GPX Files:** Various GPX files for upload testing

### Test Environment Setup
```bash
# Deploy Phase 2.4 infrastructure
cd backend
npm run deploy

# Setup test users and clubs (from Phase 2.3)
./scripts/setup-test-users.sh

# Verify Phase 2.3 functionality is intact
npm run test:phase-2.3

# Setup S3 bucket and CloudFront distribution
aws s3 ls s3://sydney-cycles-routes-dev/
aws cloudfront list-distributions
```

### Test User Roles
| User ID | Name | Club Role | System Role | Purpose |
|---------|------|-----------|-------------|---------|
| user_001 | Alice Admin | Owner | User | Club owner, full route permissions |
| user_002 | Bob Captain | Ride Captain | User | Can upload files, create templates |
| user_003 | Carol Leader | Ride Leader | User | Can upload files, create templates |
| user_004 | Dave Member | Member | User | Can download files, view analytics |
| user_005 | Eve External | None | User | Non-member for access control testing |
| user_006 | Frank Member | Member | User | Additional member for testing |

### Test GPX Files
Create test GPX files in `backend/test-data/gpx/`:
- `small-route.gpx` (< 1MB, ~100 trackpoints)
- `medium-route.gpx` (2-3MB, ~500 trackpoints)
- `large-route.gpx` (8-9MB, ~2000 trackpoints)
- `invalid-file.txt` (non-GPX file for validation testing)
- `malformed.gpx` (invalid GPX structure)

## Test Categories

### 1. Infrastructure & Deployment Tests

#### 1.1 CDK Deployment Validation
```bash
# Test CDK synthesis
npm run cdk synth

# Validate stack outputs
aws cloudformation describe-stacks --stack-name SydneyCyclesStack

# Verify S3 bucket creation
aws s3 ls s3://sydney-cycles-routes-dev/

# Verify CloudFront distribution
aws cloudfront list-distributions --query 'DistributionList.Items[?Comment==`Sydney Cycles Routes CDN`]'
```

**Expected Results:**
- ✅ Stack deploys without errors
- ✅ S3 bucket created with proper permissions
- ✅ CloudFront distribution configured
- ✅ Lambda functions for file processing created
- ✅ ElastiCache cluster for template caching created

#### 1.2 API Gateway Route Validation
```bash
# Test all route file endpoints are accessible
curl -X OPTIONS https://api-url/v1/clubs/club_123/routes/route_123/files/upload-url
curl -X OPTIONS https://api-url/v1/clubs/club_123/routes/route_123/files/1/download
curl -X OPTIONS https://api-url/v1/clubs/club_123/routes/route_123/analytics
curl -X OPTIONS https://api-url/v1/clubs/club_123/templates
```

**Expected Results:**
- ✅ All endpoints return CORS headers
- ✅ OPTIONS requests succeed
- ✅ Proper HTTP methods allowed

### 2. File Storage & Upload Tests

#### 2.1 Presigned Upload URL Generation
```bash
# Test: Ride leader requests upload URL
curl -X POST https://api-url/v1/clubs/club_123/routes/route_123/files/upload-url \
  -H "Authorization: Bearer $LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "morning-hills-route.gpx",
    "fileSize": 245760,
    "contentType": "application/gpx+xml",
    "description": "Updated route with better waypoints"
  }'
```

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Response includes `uploadUrl` and `uploadFields`
- ✅ Response includes `fileId` and `version`
- ✅ Upload URL expires in 15 minutes
- ✅ S3 presigned URL is valid

#### 2.2 Member Cannot Upload Files
```bash
# Test: Regular member tries to get upload URL (should fail)
curl -X POST https://api-url/v1/clubs/club_123/routes/route_123/files/upload-url \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "unauthorized-upload.gpx",
    "fileSize": 100000,
    "contentType": "application/gpx+xml"
  }'
```

**Expected Results:**
- ✅ Status: 403 Forbidden
- ✅ Error: "Insufficient privileges to upload route files"

#### 2.3 File Upload to S3
```bash
# Get upload URL first
UPLOAD_RESPONSE=$(curl -X POST https://api-url/v1/clubs/club_123/routes/route_123/files/upload-url \
  -H "Authorization: Bearer $LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test-route.gpx","fileSize":50000,"contentType":"application/gpx+xml"}')

UPLOAD_URL=$(echo $UPLOAD_RESPONSE | jq -r '.data.uploadUrl')
FILE_ID=$(echo $UPLOAD_RESPONSE | jq -r '.data.fileId')

# Upload file to S3 using presigned URL
curl -X POST "$UPLOAD_URL" \
  -F "key=gpx-files/club_123/route_123/v1.gpx" \
  -F "policy=$(echo $UPLOAD_RESPONSE | jq -r '.data.uploadFields.policy')" \
  -F "x-amz-algorithm=$(echo $UPLOAD_RESPONSE | jq -r '.data.uploadFields["x-amz-algorithm"]')" \
  -F "x-amz-credential=$(echo $UPLOAD_RESPONSE | jq -r '.data.uploadFields["x-amz-credential"]')" \
  -F "x-amz-date=$(echo $UPLOAD_RESPONSE | jq -r '.data.uploadFields["x-amz-date"]')" \
  -F "x-amz-signature=$(echo $UPLOAD_RESPONSE | jq -r '.data.uploadFields["x-amz-signature"]')" \
  -F "file=@backend/test-data/gpx/small-route.gpx"
```

**Expected Results:**
- ✅ Status: 204 No Content (S3 success)
- ✅ File uploaded to correct S3 path
- ✅ File accessible via S3 API

#### 2.4 Upload Confirmation & Processing
```bash
# Confirm upload completion
curl -X POST https://api-url/v1/clubs/club_123/routes/route_123/files/1/confirm \
  -H "Authorization: Bearer $LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "'$FILE_ID'",
    "uploadCompleted": true
  }'
```

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Response includes `processingStatus: "pending"`
- ✅ Background processing initiated
- ✅ DynamoDB record created

#### 2.5 File Processing Status
```bash
# Check processing status
curl -X GET https://api-url/v1/clubs/club_123/routes/route_123/files/1/status \
  -H "Authorization: Bearer $LEADER_TOKEN"

# Wait for processing to complete (may take 1-2 minutes)
sleep 120

# Check status again
curl -X GET https://api-url/v1/clubs/club_123/routes/route_123/files/1/status \
  -H "Authorization: Bearer $LEADER_TOKEN"
```

**Expected Results:**
- ✅ Initial status: `"pending"` or `"processing"`
- ✅ Final status: `"completed"`
- ✅ Analytics processing completed
- ✅ No processing errors

#### 2.6 File Download
```bash
# Test: Club member downloads file
curl -X GET https://api-url/v1/clubs/club_123/routes/route_123/files/1/download \
  -H "Authorization: Bearer $MEMBER_TOKEN"
```

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Response includes signed download URL
- ✅ Download URL expires in 15 minutes
- ✅ File downloadable via returned URL

#### 2.7 Non-Member Cannot Download
```bash
# Test: Non-member tries to download file
curl -X GET https://api-url/v1/clubs/club_123/routes/route_123/files/1/download \
  -H "Authorization: Bearer $NON_MEMBER_TOKEN"
```

**Expected Results:**
- ✅ Status: 403 Forbidden
- ✅ Error: "Insufficient privileges to download route files"

### 3. File Validation Tests

#### 3.1 Invalid File Type Rejection
```bash
# Test: Upload non-GPX file
curl -X POST https://api-url/v1/clubs/club_123/routes/route_123/files/upload-url \
  -H "Authorization: Bearer $LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "invalid-file.txt",
    "fileSize": 1000,
    "contentType": "text/plain"
  }'
```

**Expected Results:**
- ✅ Status: 400 Bad Request
- ✅ Error: "Only GPX files are supported"

#### 3.2 File Size Limit Validation
```bash
# Test: Upload file exceeding 10MB limit
curl -X POST https://api-url/v1/clubs/club_123/routes/route_123/files/upload-url \
  -H "Authorization: Bearer $LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "huge-file.gpx",
    "fileSize": 15000000,
    "contentType": "application/gpx+xml"
  }'
```

**Expected Results:**
- ✅ Status: 400 Bad Request
- ✅ Error: "File size exceeds 10MB limit"

#### 3.3 Malformed GPX Handling
```bash
# Upload malformed GPX file (after getting upload URL)
# This should be caught during processing phase
curl -X POST https://api-url/v1/clubs/club_123/routes/route_123/files/2/confirm \
  -H "Authorization: Bearer $LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileId": "file_malformed",
    "uploadCompleted": true
  }'

# Check processing status after upload
sleep 60
curl -X GET https://api-url/v1/clubs/club_123/routes/route_123/files/2/status \
  -H "Authorization: Bearer $LEADER_TOKEN"
```

**Expected Results:**
- ✅ Processing status: `"failed"`
- ✅ Processing error message provided
- ✅ No analytics generated

### 4. Route Analytics Tests

#### 4.1 Basic Analytics Generation
```bash
# Test: Get route analytics after successful processing
curl -X GET https://api-url/v1/clubs/club_123/routes/route_123/analytics \
  -H "Authorization: Bearer $MEMBER_TOKEN"
```

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Response includes `elevationSummary`
- ✅ Response includes `elevationProfileUrl` (S3 link)
- ✅ Response includes `difficultyScore`
- ✅ Response includes `performanceMetrics`
- ✅ Elevation profile limited to 200 points max

#### 4.2 Analytics Data Validation
```bash
# Verify analytics data structure
ANALYTICS=$(curl -X GET https://api-url/v1/clubs/club_123/routes/route_123/analytics \
  -H "Authorization: Bearer $MEMBER_TOKEN")

# Check elevation summary
echo $ANALYTICS | jq '.data.elevationSummary'

# Download and verify elevation profile from S3
PROFILE_URL=$(echo $ANALYTICS | jq -r '.data.elevationProfileUrl')
curl -X GET "$PROFILE_URL" | jq '.'
```

**Expected Results:**
- ✅ Elevation summary contains totalGain, totalLoss, maxElevation, minElevation
- ✅ Point count ≤ 200
- ✅ Difficulty scores between 1-10
- ✅ Performance metrics include recreational and moderate times
- ✅ S3 profile data is valid JSON

#### 4.3 Non-Member Cannot View Analytics
```bash
# Test: Non-member tries to view analytics
curl -X GET https://api-url/v1/clubs/club_123/routes/route_123/analytics \
  -H "Authorization: Bearer $NON_MEMBER_TOKEN"
```

**Expected Results:**
- ✅ Status: 403 Forbidden
- ✅ Error: "Insufficient privileges to view route analytics"

### 5. Route Template Tests

#### 5.1 Template Creation by Leader
```bash
# Test: Ride leader creates route template
curl -X POST https://api-url/v1/clubs/club_123/templates \
  -H "Authorization: Bearer $LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceRouteId": "route_123",
    "templateName": "Morning Hills Classic",
    "description": "Popular morning training route through the hills",
    "tags": ["training", "hills", "morning", "intermediate"],
    "category": "training",
    "difficulty": "intermediate",
    "terrain": "road",
    "visibility": "club",
    "allowDownload": true
  }'
```

**Expected Results:**
- ✅ Status: 201 Created
- ✅ Response includes `templateId`
- ✅ Response includes `visibility: "club"`
- ✅ Response includes `usageCount: 0`
- ✅ Template stored in DynamoDB

#### 5.2 Member Cannot Create Templates
```bash
# Test: Regular member tries to create template
curl -X POST https://api-url/v1/clubs/club_123/templates \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceRouteId": "route_123",
    "templateName": "Unauthorized Template",
    "description": "This should fail",
    "category": "training",
    "difficulty": "beginner",
    "terrain": "road"
  }'
```

**Expected Results:**
- ✅ Status: 403 Forbidden
- ✅ Error: "Insufficient privileges to create route templates"

#### 5.3 Club Template Search
```bash
# Test: Search club templates with various filters
curl -X GET "https://api-url/v1/clubs/club_123/templates?query=hills&difficulty=intermediate&limit=10" \
  -H "Authorization: Bearer $MEMBER_TOKEN"

# Test: Pagination with cursor
FIRST_PAGE=$(curl -X GET "https://api-url/v1/clubs/club_123/templates?limit=5" \
  -H "Authorization: Bearer $MEMBER_TOKEN")

CURSOR=$(echo $FIRST_PAGE | jq -r '.pagination.nextCursor')

curl -X GET "https://api-url/v1/clubs/club_123/templates?limit=5&cursor=$CURSOR" \
  -H "Authorization: Bearer $MEMBER_TOKEN"
```

**Expected Results:**
- ✅ Status: 200 OK
- ✅ Templates filtered correctly
- ✅ Cursor-based pagination works
- ✅ No duplicate results across pages
- ✅ Response includes template metadata

#### 5.4 Template Visibility Enforcement
```bash
# Test: Non-member cannot see club templates
curl -X GET https://api-url/v1/clubs/club_123/templates \
  -H "Authorization: Bearer $NON_MEMBER_TOKEN"

# Test: Member from different club cannot see templates
curl -X GET https://api-url/v1/clubs/club_123/templates \
  -H "Authorization: Bearer $OTHER_CLUB_MEMBER_TOKEN"
```

**Expected Results:**
- ✅ Non-members: 403 Forbidden
- ✅ Other club members: 403 Forbidden
- ✅ Only club members can see club templates

### 6. File Versioning Tests

#### 6.1 Upload New Version
```bash
# Upload second version of the same route
curl -X POST https://api-url/v1/clubs/club_123/routes/route_123/files/upload-url \
  -H "Authorization: Bearer $LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "morning-hills-route-v2.gpx",
    "fileSize": 300000,
    "contentType": "application/gpx+xml",
    "description": "Updated route with additional waypoints"
  }'

# Complete upload process for version 2
# ... (similar to previous upload steps)
```

**Expected Results:**
- ✅ New version number assigned (v2)
- ✅ Previous version remains accessible
- ✅ Version history maintained
- ✅ Analytics generated for new version

#### 6.2 Version-Specific Downloads
```bash
# Test: Download specific version
curl -X GET https://api-url/v1/clubs/club_123/routes/route_123/files/1/download \
  -H "Authorization: Bearer $MEMBER_TOKEN"

curl -X GET https://api-url/v1/clubs/club_123/routes/route_123/files/2/download \
  -H "Authorization: Bearer $MEMBER_TOKEN"
```

**Expected Results:**
- ✅ Each version downloadable separately
- ✅ Correct file returned for each version
- ✅ Version metadata accurate

### 7. Performance Tests

#### 7.1 File Upload Performance
```bash
# Test upload performance for different file sizes
time curl -X POST https://api-url/v1/clubs/club_123/routes/route_123/files/upload-url \
  -H "Authorization: Bearer $LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"large-route.gpx","fileSize":8000000,"contentType":"application/gpx+xml"}'

# Measure S3 upload time
time curl -X POST "$UPLOAD_URL" -F "file=@backend/test-data/gpx/large-route.gpx" [other fields...]
```

**Expected Results:**
- ✅ Upload URL generation: <500ms
- ✅ S3 upload (8MB file): <30 seconds
- ✅ No timeouts or errors

#### 7.2 Analytics Processing Performance
```bash
# Measure processing time for different file sizes
start_time=$(date +%s)

# Trigger processing
curl -X POST https://api-url/v1/clubs/club_123/routes/route_123/files/3/confirm \
  -H "Authorization: Bearer $LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileId":"file_large","uploadCompleted":true}'

# Poll until complete
while true; do
  STATUS=$(curl -s -X GET https://api-url/v1/clubs/club_123/routes/route_123/files/3/status \
    -H "Authorization: Bearer $LEADER_TOKEN" | jq -r '.data.status')
  
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
  
  sleep 10
done

end_time=$(date +%s)
processing_time=$((end_time - start_time))
echo "Processing time: ${processing_time} seconds"
```

**Expected Results:**
- ✅ Small files (<1MB): <30 seconds
- ✅ Medium files (2-3MB): <60 seconds
- ✅ Large files (8-9MB): <120 seconds
- ✅ No processing failures

#### 7.3 Template Search Performance
```bash
# Test search performance with various query patterns
time curl -X GET "https://api-url/v1/clubs/club_123/templates?query=training&limit=50" \
  -H "Authorization: Bearer $MEMBER_TOKEN"

time curl -X GET "https://api-url/v1/clubs/club_123/templates?difficulty=intermediate&terrain=road&limit=20" \
  -H "Authorization: Bearer $MEMBER_TOKEN"
```

**Expected Results:**
- ✅ Search responses: <500ms
- ✅ Complex filters: <1 second
- ✅ Large result sets handled efficiently

### 8. Error Handling Tests

#### 8.1 S3 Upload Failures
```bash
# Test expired upload URL
sleep 900  # Wait 15 minutes for URL to expire
curl -X POST "$EXPIRED_UPLOAD_URL" -F "file=@backend/test-data/gpx/small-route.gpx"
```

**Expected Results:**
- ✅ S3 returns 403 Forbidden for expired URL
- ✅ Proper error handling in application

#### 8.2 Processing Failures
```bash
# Test processing with corrupted file
# (Upload corrupted GPX file and confirm)
curl -X GET https://api-url/v1/clubs/club_123/routes/route_123/files/4/status \
  -H "Authorization: Bearer $LEADER_TOKEN"
```

**Expected Results:**
- ✅ Processing status: "failed"
- ✅ Descriptive error message
- ✅ No partial analytics data

#### 8.3 Rate Limiting
```bash
# Test upload rate limiting (attempt multiple rapid uploads)
for i in {1..10}; do
  curl -X POST https://api-url/v1/clubs/club_123/routes/route_$i/files/upload-url \
    -H "Authorization: Bearer $LEADER_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"fileName":"test-'$i'.gpx","fileSize":50000,"contentType":"application/gpx+xml"}' &
done
wait
```

**Expected Results:**
- ✅ Rate limiting enforced after threshold
- ✅ 429 Too Many Requests returned
- ✅ Retry-After header provided

### 9. Security Tests

#### 9.1 File Access Control
```bash
# Test direct S3 access (should fail without signed URL)
curl -X GET https://sydney-cycles-routes-dev.s3.amazonaws.com/gpx-files/club_123/route_123/v1.gpx
```

**Expected Results:**
- ✅ Direct access denied (403 Forbidden)
- ✅ Files only accessible via signed URLs

#### 9.2 Cross-Club Access Prevention
```bash
# Test: Member of club A tries to access club B's files
curl -X GET https://api-url/v1/clubs/club_456/routes/route_789/files/1/download \
  -H "Authorization: Bearer $CLUB_A_MEMBER_TOKEN"
```

**Expected Results:**
- ✅ Status: 403 Forbidden
- ✅ Cross-club access prevented

#### 9.3 Template Access Control
```bash
# Test: Cross-club template access
curl -X GET https://api-url/v1/clubs/club_456/templates \
  -H "Authorization: Bearer $CLUB_A_MEMBER_TOKEN"
```

**Expected Results:**
- ✅ Status: 403 Forbidden
- ✅ Club boundaries enforced

### 10. Integration Tests

#### 10.1 End-to-End Route File Workflow
```bash
# Complete workflow: Upload → Process → Analyze → Template → Download
echo "=== Phase 2.4 E2E Test ==="

# 1. Create a ride (from Phase 2.3)
RIDE_ID=$(curl -X POST https://api-url/v1/clubs/club_123/rides \
  -H "Authorization: Bearer $CAPTAIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"E2E Route Test","description":"Testing route files","rideType":"training","difficulty":"intermediate","startDateTime":"2026-01-05T08:00:00.000Z","estimatedDuration":120,"publishImmediately":true,"meetingPoint":{"name":"Test Start","address":"Test Address","coordinates":{"latitude":-33.8688,"longitude":151.2093}}}' \
  | jq -r '.data.rideId')

echo "Created ride: $RIDE_ID"

# 2. Upload GPX file
UPLOAD_RESPONSE=$(curl -X POST https://api-url/v1/clubs/club_123/routes/$RIDE_ID/files/upload-url \
  -H "Authorization: Bearer $LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileName":"e2e-test-route.gpx","fileSize":100000,"contentType":"application/gpx+xml","description":"E2E test file"}')

echo "Upload URL generated"

# 3. Upload to S3 (simplified for test)
FILE_ID=$(echo $UPLOAD_RESPONSE | jq -r '.data.fileId')

# 4. Confirm upload
curl -X POST https://api-url/v1/clubs/club_123/routes/$RIDE_ID/files/1/confirm \
  -H "Authorization: Bearer $LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"fileId":"'$FILE_ID'","uploadCompleted":true}'

echo "Upload confirmed, processing started"

# 5. Wait for processing
sleep 60

# 6. Check analytics
curl -X GET https://api-url/v1/clubs/club_123/routes/$RIDE_ID/analytics \
  -H "Authorization: Bearer $MEMBER_TOKEN"

echo "Analytics retrieved"

# 7. Create template
TEMPLATE_ID=$(curl -X POST https://api-url/v1/clubs/club_123/templates \
  -H "Authorization: Bearer $LEADER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sourceRouteId":"'$RIDE_ID'","templateName":"E2E Test Template","description":"Created during E2E test","category":"training","difficulty":"intermediate","terrain":"road","visibility":"club","allowDownload":true}' \
  | jq -r '.data.templateId')

echo "Template created: $TEMPLATE_ID"

# 8. Search templates
curl -X GET "https://api-url/v1/clubs/club_123/templates?query=E2E" \
  -H "Authorization: Bearer $MEMBER_TOKEN"

echo "Template search completed"

# 9. Download file
curl -X GET https://api-url/v1/clubs/club_123/routes/$RIDE_ID/files/1/download \
  -H "Authorization: Bearer $MEMBER_TOKEN"

echo "File download URL generated"

echo "=== E2E Test Complete ==="
```

**Expected Results:**
- ✅ All steps complete successfully
- ✅ File uploaded and processed
- ✅ Analytics generated correctly
- ✅ Template created and searchable
- ✅ File downloadable by club members

#### 10.2 Phase 2.3 Integration Verification
```bash
# Verify Phase 2.3 functionality still works
echo "=== Phase 2.3 Integration Test ==="

# Create ride with route reference
curl -X POST https://api-url/v1/clubs/club_123/rides \
  -H "Authorization: Bearer $CAPTAIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Integration Test Ride",
    "description": "Testing Phase 2.3 + 2.4 integration",
    "rideType": "training",
    "difficulty": "intermediate",
    "startDateTime": "2026-01-06T09:00:00.000Z",
    "estimatedDuration": 150,
    "publishImmediately": true,
    "meetingPoint": {
      "name": "Integration Test Point",
      "address": "Test Address",
      "coordinates": { "latitude": -33.8688, "longitude": 151.2093 }
    },
    "route": {
      "name": "Integration Test Route",
      "type": "s3_gpx",
      "routeKey": "gpx-files/club_123/route_123/v1.gpx",
      "distance": 32.5,
      "estimatedTime": 150,
      "difficulty": "intermediate"
    }
  }'

echo "Ride with GPX route created successfully"
```

**Expected Results:**
- ✅ Ride creation with GPX route succeeds
- ✅ Route metadata properly stored
- ✅ Phase 2.3 functionality unaffected

## Test Execution Checklist

### Pre-Deployment Tests
- [ ] CDK synthesis succeeds
- [ ] TypeScript compilation passes
- [ ] Unit tests pass
- [ ] S3 bucket configuration validated
- [ ] CloudFront distribution configured
- [ ] Lambda function permissions verified

### Post-Deployment Tests
- [ ] All API endpoints accessible
- [ ] S3 bucket accessible with proper permissions
- [ ] CloudFront distribution serving content
- [ ] File upload workflow functional
- [ ] Analytics processing working
- [ ] Template system operational
- [ ] Authorization enforced correctly
- [ ] Performance targets met

### Regression Tests
- [ ] Phase 2.3 functionality intact
- [ ] Ride creation still working
- [ ] Club membership unaffected
- [ ] User profile service operational
- [ ] Authorization service compatible

## Success Criteria

### Functional Requirements ✅
- [ ] GPX file upload and storage working
- [ ] File processing and analytics generation functional
- [ ] Route template creation and search operational
- [ ] Club-scoped access control enforced
- [ ] File versioning working correctly

### Technical Requirements ✅
- [ ] File upload success rate >99%
- [ ] Processing time <2 minutes for typical files
- [ ] Analytics accuracy >90% for basic metrics
- [ ] Search performance <500ms
- [ ] Download URL generation <3 seconds

### Security Requirements ✅
- [ ] File access properly controlled
- [ ] Club boundaries enforced
- [ ] Presigned URLs secure and time-limited
- [ ] Cross-club access prevented
- [ ] Rate limiting functional

## Troubleshooting Guide

### Common Issues

#### 1. File Upload Failures
**Symptoms:** Upload URL generation fails or S3 upload errors
**Solutions:**
- Verify S3 bucket permissions
- Check IAM roles for Lambda functions
- Validate presigned URL generation
- Confirm file size and type limits

#### 2. Processing Failures
**Symptoms:** Files stuck in "processing" status
**Solutions:**
- Check Lambda function logs
- Verify GPX file format
- Monitor Lambda timeout settings
- Check DynamoDB write permissions

#### 3. Analytics Issues
**Symptoms:** Missing or incorrect analytics data
**Solutions:**
- Verify S3 storage for large payloads
- Check elevation profile generation
- Validate difficulty scoring algorithm
- Monitor analytics Lambda performance

#### 4. Template Search Problems
**Symptoms:** Search returns no results or errors
**Solutions:**
- Verify ElastiCache connectivity
- Check DynamoDB GSI configuration
- Validate cursor-based pagination
- Monitor cache hit rates

#### 5. Authorization Failures
**Symptoms:** Unexpected 403 errors
**Solutions:**
- Verify club membership status
- Check role-based capabilities
- Validate JWT token claims
- Confirm club scoping in data model

## Performance Monitoring

### Key Metrics to Monitor
- **File Upload Success Rate**: Target >99%
- **Processing Time**: Target <2 minutes for typical files
- **Analytics Generation**: Target <30 seconds for basic metrics
- **Template Search**: Target <500ms response time
- **Download URL Generation**: Target <3 seconds

### Alerting Thresholds
- **High Upload Failure Rate**: >5% failures in 5 minutes
- **Slow Processing**: >5 minutes average processing time
- **Search Performance**: >2 seconds average response time
- **Storage Growth**: >80% of allocated S3 storage
- **Lambda Errors**: >10 errors in 5 minutes

## Next Steps

1. **Execute Test Plan:** Run all test categories systematically
2. **Document Results:** Record test outcomes and performance metrics
3. **Fix Issues:** Address any failures or performance problems
4. **Security Review:** Validate file security and access controls
5. **Performance Optimization:** Tune slow operations
6. **Load Testing:** Test system under expected production load
7. **Production Readiness:** Confirm system ready for deployment

---

**Testing Status:** Ready for Execution  
**Phase 2.4 Implementation:** MVP Scope  
**Next Phase:** Phase 2.5 - Ride Completion & Evidence  
**Dependencies:** Phase 2.3 Ride Management (Complete)