# Phase 2.5 Strava Integration Guide

**Last Updated:** December 31, 2024  
**Version:** 1.0  

## Overview

This guide provides comprehensive instructions for configuring and using the Strava integration feature introduced in Phase 2.5. The integration enables automatic linking of Strava activities as evidence for ride participation.

## Table of Contents

1. [Strava Developer Setup](#strava-developer-setup)
2. [Environment Configuration](#environment-configuration)
3. [OAuth Flow](#oauth-flow)
4. [Activity Matching](#activity-matching)
5. [Webhook Configuration](#webhook-configuration)
6. [Security Considerations](#security-considerations)
7. [Troubleshooting](#troubleshooting)

## Strava Developer Setup

### 1. Create Strava Application

1. **Visit Strava Developers Portal**
   - Go to https://developers.strava.com
   - Sign in with your Strava account

2. **Create New Application**
   - Click "Create & Manage Your App"
   - Fill in application details:
     - **Application Name:** Sydney Cycles
     - **Category:** Training
     - **Club:** (optional)
     - **Website:** Your application website
     - **Application Description:** Cycling club management platform

3. **Configure Application Settings**
   ```
   Authorization Callback Domain: your-api-domain.com
   ```

4. **Note Application Credentials**
   ```
   Client ID: 12345 (example)
   Client Secret: abcdef123456 (example)
   ```

### 2. Configure Callback URL

The callback URL must match your deployed API endpoint:

**Development Environment:**
```
https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/integrations/strava/callback
```

**Production Environment:**
```
https://api.sydneycycles.com/integrations/strava/callback
```

## Environment Configuration

### 1. Set Environment Variables

Add the following environment variables to your deployment:

```bash
# Required for OAuth flow
export STRAVA_CLIENT_ID="your_client_id"
export STRAVA_CLIENT_SECRET="your_client_secret"
export STRAVA_REDIRECT_URI="https://your-api.com/integrations/strava/callback"

# Required for webhook verification
export STRAVA_WEBHOOK_VERIFY_TOKEN="your_secure_random_token"
```

### 2. Update CDK Deployment

Add environment variables to your CDK stack:

```typescript
// In strava-integration-service.ts
const commonEnvironment = {
  MAIN_TABLE_NAME: props.mainTable.tableName,
  KMS_KEY_ID: this.tokenEncryptionKey.keyId,
  STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID || '',
  STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET || '',
  STRAVA_REDIRECT_URI: process.env.STRAVA_REDIRECT_URI || '',
  STRAVA_WEBHOOK_VERIFY_TOKEN: process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || '',
};
```

### 3. Deploy Updated Configuration

```bash
# Set environment variables
export STRAVA_CLIENT_ID="your_client_id"
export STRAVA_CLIENT_SECRET="your_client_secret"
export STRAVA_REDIRECT_URI="https://your-api.com/integrations/strava/callback"
export STRAVA_WEBHOOK_VERIFY_TOKEN="your_secure_token"

# Deploy with new configuration
npm run deploy
```

## OAuth Flow

### 1. User Initiates Connection

**Frontend Implementation:**
```javascript
// Get Strava authorization URL
const response = await fetch('/integrations/strava/connect', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const { authorizationUrl } = await response.json();

// Redirect user to Strava
window.location.href = authorizationUrl;
```

**API Response:**
```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://www.strava.com/oauth/authorize?client_id=12345&response_type=code&redirect_uri=...",
    "state": "secure_random_state_token"
  }
}
```

### 2. User Authorizes on Strava

The user will be redirected to Strava where they can:
- Review requested permissions
- Approve or deny access
- Be redirected back to your application

### 3. Handle OAuth Callback

The callback is handled automatically by the system:

```typescript
// Automatic processing:
1. Verify state parameter
2. Exchange authorization code for tokens
3. Encrypt and store tokens securely
4. Create integration record
5. Redirect user back to application
```

### 4. Verify Integration Status

**Check Integration Status:**
```javascript
const response = await fetch('/users/me/integrations/strava', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const integration = await response.json();
// Returns integration details or null if not connected
```

## Activity Matching

### 1. Matching Strategies

The system uses multiple strategies to match Strava activities to rides:

#### Tag-Based Matching (Primary)
```
Activity Name: "Morning training ride #ride_abc123"
Activity Description: "Great ride with Sydney Cycles #ride_abc123"

Match Criteria:
- Activity contains ride ID in name or description
- Format: #ride_{rideId} or #{rideId}
- Case insensitive matching
```

#### Time-Window Matching (Secondary)
```
Ride Time: 2024-12-31 08:00 - 10:00 UTC
Activity Time: 2024-12-31 08:15 - 09:45 UTC

Match Criteria:
- Activity overlaps with ride timeframe
- User is registered for the ride
- Activity type is cycling-related
- Minimum 50% time overlap required
```

### 2. Activity Requirements

For an activity to be eligible for matching:

```typescript
interface MatchingCriteria {
  activityType: 'Ride' | 'VirtualRide' | 'EBikeRide';
  startTime: Date; // Must overlap with ride time
  userId: string; // Must be registered participant
  distance: number; // Must be > 0
  movingTime: number; // Must be > 0
}
```

### 3. Manual Matching Override

Ride leaders can manually link activities:

```bash
# Manual activity linking
curl -X POST "/v1/clubs/{clubId}/rides/{rideId}/participants/{userId}/evidence/strava" \
  -H "Authorization: Bearer ${rideLeaderToken}" \
  -d '{
    "stravaActivityId": "12345678",
    "overrideAutoMatch": true
  }'
```

## Webhook Configuration

### 1. Create Webhook Subscription

Use the Strava API to create a webhook subscription:

```bash
curl -X POST "https://www.strava.com/api/v3/push_subscriptions" \
  -F client_id=${STRAVA_CLIENT_ID} \
  -F client_secret=${STRAVA_CLIENT_SECRET} \
  -F callback_url="https://your-api.com/integrations/strava/webhook" \
  -F verify_token=${STRAVA_WEBHOOK_VERIFY_TOKEN}
```

**Expected Response:**
```json
{
  "id": 1,
  "callback_url": "https://your-api.com/integrations/strava/webhook",
  "created_at": "2024-12-31T16:00:00Z",
  "updated_at": "2024-12-31T16:00:00Z"
}
```

### 2. Webhook Event Processing

The system automatically processes these webhook events:

#### Activity Created
```json
{
  "object_type": "activity",
  "object_id": 12345,
  "aspect_type": "create",
  "owner_id": 67890,
  "subscription_id": 1,
  "event_time": 1640995200
}
```

**Processing Flow:**
1. Verify webhook signature
2. Fetch activity details from Strava API
3. Attempt automatic matching to rides
4. Create evidence records for matches
5. Update participation records

#### Activity Updated
```json
{
  "object_type": "activity",
  "aspect_type": "update",
  "updates": {
    "title": "New activity title",
    "type": "Ride"
  }
}
```

**Processing Flow:**
1. Update stored activity data
2. Re-evaluate matching criteria
3. Update evidence records if needed

#### Activity Deleted
```json
{
  "object_type": "activity",
  "aspect_type": "delete"
}
```

**Processing Flow:**
1. Remove activity from storage
2. Remove associated evidence records
3. Update participation statistics

### 3. Webhook Verification

The webhook endpoint automatically handles Strava's verification:

```bash
# Strava verification request
GET /integrations/strava/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=your_token

# System response
HTTP 200 OK
Content: test
```

## Security Considerations

### 1. Token Security

**Encryption at Rest:**
- OAuth tokens encrypted using AWS KMS
- Separate encryption key per environment
- Automatic key rotation enabled

**Token Storage:**
```typescript
interface TokenStorage {
  accessTokenRef: string; // KMS encrypted reference
  refreshTokenRef: string; // KMS encrypted reference
  expiresAt: string; // Token expiration time
  scope: string[]; // Granted permissions
}
```

**Token Refresh:**
```typescript
// Automatic token refresh before expiration
if (token.expiresAt < Date.now() + 300000) { // 5 minutes before expiry
  await refreshStravaToken(integration);
}
```

### 2. Webhook Security

**Signature Verification:**
```typescript
// Verify webhook signature
const signature = request.headers['x-hub-signature'];
const payload = request.body;
const expectedSignature = crypto
  .createHmac('sha1', webhookSecret)
  .update(payload)
  .digest('hex');

if (signature !== `sha1=${expectedSignature}`) {
  throw new Error('Invalid webhook signature');
}
```

### 3. Data Privacy

**User Consent:**
- Explicit consent required for Strava connection
- Clear explanation of data usage
- Easy disconnection process

**Data Minimization:**
- Only store necessary activity data
- Automatic cleanup of old activities
- Respect user privacy settings

## API Reference

### Connect to Strava
```
GET /integrations/strava/connect
Authorization: Bearer {userToken}

Response:
{
  "success": true,
  "data": {
    "authorizationUrl": "https://www.strava.com/oauth/authorize?...",
    "state": "secure_state_token"
  }
}
```

### OAuth Callback
```
GET /integrations/strava/callback?code={authCode}&state={state}
Authorization: Bearer {userToken}

Response:
{
  "success": true,
  "data": {
    "integrationId": "integration_123",
    "stravaUserId": "12345",
    "connectedAt": "2024-12-31T16:00:00Z"
  }
}
```

### Disconnect Integration
```
DELETE /integrations/strava
Authorization: Bearer {userToken}

Response:
{
  "success": true,
  "message": "Strava integration disconnected"
}
```

### Get Integration Status
```
GET /users/me/integrations/strava
Authorization: Bearer {userToken}

Response:
{
  "success": true,
  "data": {
    "integrationId": "integration_123",
    "stravaUserId": "12345",
    "connectedAt": "2024-12-31T16:00:00Z",
    "lastSyncAt": "2024-12-31T18:00:00Z",
    "isActive": true
  }
}
```

## Troubleshooting

### Common Issues

#### 1. OAuth Flow Fails

**Symptoms:**
- User redirected to error page
- "Invalid client" error from Strava

**Solutions:**
```bash
# Check client credentials
echo $STRAVA_CLIENT_ID
echo $STRAVA_CLIENT_SECRET

# Verify callback URL matches Strava app configuration
# Check CloudWatch logs for detailed error messages
aws logs tail /aws/lambda/sydney-cycles-strava-oauth-callback-development
```

#### 2. Activities Not Matching

**Symptoms:**
- Strava activities not appearing as evidence
- Manual matching required frequently

**Debugging:**
```bash
# Check activity matching logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/sydney-cycles-strava-webhook-development \
  --filter-pattern "activity matching"

# Verify user has Strava integration
curl -X GET "/users/{userId}/integrations/strava" \
  -H "Authorization: Bearer ${adminToken}"

# Check ride timing and participant registration
curl -X GET "/v1/clubs/{clubId}/rides/{rideId}" \
  -H "Authorization: Bearer ${token}"
```

#### 3. Webhook Events Not Processing

**Symptoms:**
- New activities not automatically linked
- Webhook verification failing

**Solutions:**
```bash
# Verify webhook subscription
curl -X GET "https://www.strava.com/api/v3/push_subscriptions" \
  -H "Authorization: Bearer ${stravaToken}"

# Check webhook signature verification
# Ensure STRAVA_WEBHOOK_VERIFY_TOKEN matches subscription

# Test webhook endpoint manually
curl -X POST "/integrations/strava/webhook" \
  -H "Content-Type: application/json" \
  -d '{"object_type":"activity","aspect_type":"create",...}'
```

#### 4. Token Refresh Issues

**Symptoms:**
- "Token expired" errors
- Activities stop syncing

**Solutions:**
```bash
# Check token expiration
aws dynamodb get-item \
  --table-name sydney-cycles-main-development \
  --key '{"PK":{"S":"STRAVA_INTEGRATION#integration_123"}}'

# Force token refresh
curl -X POST "/integrations/strava/refresh" \
  -H "Authorization: Bearer ${userToken}"
```

### Debug Commands

```bash
# View Strava integration logs
aws logs tail /aws/lambda/sydney-cycles-strava-* --follow

# Check KMS key permissions
aws kms describe-key --key-id alias/strava-token-encryption-development

# Verify DynamoDB integration records
aws dynamodb scan \
  --table-name sydney-cycles-main-development \
  --filter-expression "begins_with(PK, :pk)" \
  --expression-attribute-values '{":pk":{"S":"STRAVA_INTEGRATION#"}}'

# Test webhook endpoint
curl -X GET "/integrations/strava/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=${WEBHOOK_TOKEN}"
```

### Performance Monitoring

```bash
# Monitor Lambda performance
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=sydney-cycles-strava-webhook-development \
  --start-time 2024-12-31T00:00:00Z \
  --end-time 2024-12-31T23:59:59Z \
  --period 3600 \
  --statistics Average,Maximum

# Monitor API Gateway errors
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name 4XXError \
  --dimensions Name=ApiName,Value=SydneyCyclesRestApi \
  --start-time 2024-12-31T00:00:00Z \
  --end-time 2024-12-31T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

## Best Practices

### 1. User Experience

- **Clear Instructions:** Provide clear guidance on connecting Strava
- **Status Indicators:** Show connection status in user interface
- **Error Handling:** Graceful handling of connection failures
- **Privacy Notice:** Clear explanation of data usage

### 2. Performance

- **Batch Processing:** Process webhook events in batches when possible
- **Caching:** Cache frequently accessed activity data
- **Rate Limiting:** Respect Strava API rate limits
- **Async Processing:** Use async processing for non-critical operations

### 3. Reliability

- **Retry Logic:** Implement retry for transient failures
- **Dead Letter Queues:** Handle failed webhook events
- **Monitoring:** Comprehensive monitoring and alerting
- **Graceful Degradation:** System works without Strava integration

### 4. Security

- **Token Rotation:** Regular token refresh and rotation
- **Audit Logging:** Log all integration activities
- **Access Control:** Proper authorization for integration endpoints
- **Data Encryption:** Encrypt sensitive data at rest and in transit

---

**Guide Version:** 1.0  
**Last Updated:** December 31, 2024  
**Next Review:** January 15, 2025