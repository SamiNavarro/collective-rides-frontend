# Phase 1.2 User Profile Service - Testing Guide

This document provides comprehensive testing procedures for the User Profile Service endpoints, including authentication setup, test scenarios, and expected responses.

## Prerequisites

- AWS CLI configured with appropriate permissions
- Backend infrastructure deployed (`npm run deploy`)
- Test user created in Cognito User Pool

## Test User Setup

### Create Test User
```bash
# Get User Pool ID
aws cloudformation describe-stacks --stack-name SydneyCyclesStack --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue' --output text

# Get Client ID
aws cloudformation describe-stacks --stack-name SydneyCyclesStack --query 'Stacks[0].Outputs[?OutputKey==`UserPoolClientId`].OutputValue' --output text

# Create test user (replace USER_POOL_ID)
aws cognito-idp admin-create-user \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username testuser+1@example.com \
  --user-attributes Name=email,Value=testuser+1@example.com Name=email_verified,Value=true \
  --temporary-password TempPass123! \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-2_t5UUpOmPL \
  --username testuser+1@example.com \
  --password 'TestPassw0rd!123' \
  --permanent
```

### Get Authentication Token
```bash
# Get fresh ID token (required for API calls)
export ID_TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 4htavql3n7nue9tqb5dd5vcrft \
  --auth-parameters USERNAME=testuser+1@example.com,PASSWORD='TestPassw0rd!123' \
  --query 'AuthenticationResult.IdToken' \
  --output text)

echo "ID Token: $ID_TOKEN"
```

## API Endpoints Testing

### Base URL
```
https://uh3ps0rtnd.execute-api.us-east-2.amazonaws.com/development
```

## Test Scenarios

### 1. GET /users/me - Current User Profile

#### Test 1.1: First Access (Lazy Creation)
```bash
curl -H "Authorization: Bearer $ID_TOKEN" \
  "https://uh3ps0rtnd.execute-api.us-east-2.amazonaws.com/development/v1/users/me"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "613bc510-4031-70db-bea0-8d27dc7e7454",
    "email": "testuser+1@example.com",
    "displayName": "Testuser+1",
    "systemRole": "User",
    "createdAt": "2025-12-18T20:28:47.199Z",
    "updatedAt": "2025-12-18T20:28:47.199Z"
  },
  "timestamp": "2025-12-18T20:28:47.257Z"
}
```

#### Test 1.2: Subsequent Access (Existing User)
```bash
curl -H "Authorization: Bearer $ID_TOKEN" \
  "https://uh3ps0rtnd.execute-api.us-east-2.amazonaws.com/development/v1/users/me"
```

**Expected Response:**
- Same user data with identical `createdAt` timestamp
- Different `timestamp` field (request timestamp)

#### Test 1.3: Unauthorized Access
```bash
curl "https://uh3ps0rtnd.execute-api.us-east-2.amazonaws.com/development/v1/users/me"
```

**Expected Response:**
```json
{
  "message": "Unauthorized"
}
```

### 2. GET /users/{id} - User Profile by ID (SiteAdmin Only)

#### Test 2.1: Regular User Access (Should Fail)
```bash
curl -H "Authorization: Bearer $ID_TOKEN" \
  "https://uh3ps0rtnd.execute-api.us-east-2.amazonaws.com/development/v1/users/613bc510-4031-70db-bea0-8d27dc7e7454"
```

**Expected Response:**
```json
{
  "error": "FORBIDDEN",
  "message": "Site administrator privileges required",
  "timestamp": "2025-12-18T20:40:14.186Z",
  "requestId": "6f94e207-fbaa-4866-95d2-2ac659d91d23"
}
```

#### Test 2.2: Promote User to SiteAdmin
```bash
# Direct DynamoDB update for testing (bootstrap first admin)
aws dynamodb update-item \
  --table-name sydney-cycles-main-development \
  --key '{"PK":{"S":"USER#613bc510-4031-70db-bea0-8d27dc7e7454"},"SK":{"S":"PROFILE"}}' \
  --update-expression "SET systemRole = :role, updatedAt = :timestamp" \
  --expression-attribute-values '{":role":{"S":"SiteAdmin"},":timestamp":{"S":"2025-12-18T20:44:00.000Z"}}'
```

#### Test 2.3: SiteAdmin Access (Should Succeed)
```bash
# Get fresh token after role change
export ID_TOKEN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id 4htavql3n7nue9tqb5dd5vcrft \
  --auth-parameters USERNAME=testuser+1@example.com,PASSWORD='TestPassw0rd!123' \
  --query 'AuthenticationResult.IdToken' \
  --output text)

curl -H "Authorization: Bearer $ID_TOKEN" \
  "https://uh3ps0rtnd.execute-api.us-east-2.amazonaws.com/development/v1/users/613bc510-4031-70db-bea0-8d27dc7e7454"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "613bc510-4031-70db-bea0-8d27dc7e7454",
    "email": "testuser+1@example.com",
    "displayName": "Testuser+1",
    "systemRole": "SiteAdmin",
    "createdAt": "2025-12-18T20:28:47.199Z",
    "updatedAt": "2025-12-18T20:44:00.000Z"
  },
  "timestamp": "2025-12-18T20:44:17.236Z"
}
```

### 3. PUT /users/{id} - Update User Profile

#### Test 3.1: Update Display Name
```bash
curl -X PUT \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Updated Name"}' \
  "https://uh3ps0rtnd.execute-api.us-east-2.amazonaws.com/development/v1/users/613bc510-4031-70db-bea0-8d27dc7e7454"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "613bc510-4031-70db-bea0-8d27dc7e7454",
    "email": "testuser+1@example.com",
    "displayName": "Updated Name",
    "systemRole": "SiteAdmin",
    "createdAt": "2025-12-18T20:28:47.199Z",
    "updatedAt": "2025-12-18T20:45:00.000Z"
  },
  "timestamp": "2025-12-18T20:45:00.123Z"
}
```

#### Test 3.2: System Role Change (SiteAdmin Only)
```bash
# Demote to regular user
curl -X PUT \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"systemRole":"User"}' \
  "https://uh3ps0rtnd.execute-api.us-east-2.amazonaws.com/development/v1/users/613bc510-4031-70db-bea0-8d27dc7e7454"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "613bc510-4031-70db-bea0-8d27dc7e7454",
    "email": "testuser+1@example.com",
    "displayName": "Updated Name",
    "systemRole": "User",
    "createdAt": "2025-12-18T20:28:47.199Z",
    "updatedAt": "2025-12-18T20:45:30.000Z"
  },
  "timestamp": "2025-12-18T20:45:30.123Z"
}
```

#### Test 3.3: Verify Role Change Takes Effect
```bash
# Should now fail since user is no longer SiteAdmin
curl -H "Authorization: Bearer $ID_TOKEN" \
  "https://uh3ps0rtnd.execute-api.us-east-2.amazonaws.com/development/v1/users/613bc510-4031-70db-bea0-8d27dc7e7454"
```

**Expected Response:**
```json
{
  "error": "FORBIDDEN",
  "message": "Site administrator privileges required",
  "timestamp": "2025-12-18T20:45:45.000Z",
  "requestId": "527bc98e-b42f-42d1-b80d-9b704c9b1a87"
}
```

#### Test 3.4: Regular User Attempting System Role Change (Should Fail)
```bash
# Regular user trying to promote themselves
curl -X PUT \
  -H "Authorization: Bearer $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"systemRole":"SiteAdmin"}' \
  "https://uh3ps0rtnd.execute-api.us-east-2.amazonaws.com/development/v1/users/613bc510-4031-70db-bea0-8d27dc7e7454"
```

**Expected Response:**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "System role changes are not allowed",
  "timestamp": "2025-12-18T20:46:00.000Z",
  "requestId": "ae0cfcc1-1e03-41ba-b951-051ceac302c9"
}
```

## Error Scenarios

### Invalid Token
```bash
curl -H "Authorization: Bearer invalid_token" \
  "https://uh3ps0rtnd.execute-api.us-east-2.amazonaws.com/development/v1/users/me"
```

**Expected Response:**
```json
{
  "message": "Unauthorized"
}
```

### Expired Token
```bash
# Use an expired token
curl -H "Authorization: Bearer expired_token_here" \
  "https://uh3ps0rtnd.execute-api.us-east-2.amazonaws.com/development/v1/users/me"
```

**Expected Response:**
```json
{
  "message": "Unauthorized"
}
```

### Invalid User ID
```bash
curl -H "Authorization: Bearer $ID_TOKEN" \
  "https://uh3ps0rtnd.execute-api.us-east-2.amazonaws.com/development/v1/users/nonexistent-user-id"
```

**Expected Response:**
```json
{
  "error": "NOT_FOUND",
  "message": "User not found",
  "timestamp": "2025-12-18T20:46:30.000Z",
  "requestId": "request-id-here"
}
```

## Key Features Verified

### ✅ Authentication & Authorization
- JWT ID token validation (not access tokens)
- Real-time role checking from database
- Proper HTTP status codes (401, 403, 404, etc.)

### ✅ User Profile Management
- Lazy user creation on first access
- Profile updates with validation
- System role management (SiteAdmin only)

### ✅ Data Consistency
- Timestamps properly managed
- Role changes take effect immediately
- Database state accurately reflected in API responses

### ✅ Security Controls
- Regular users cannot access admin endpoints
- System role changes restricted to SiteAdmins
- Proper error messages without information leakage

## Troubleshooting

### Common Issues

1. **"Unauthorized" responses**
   - Ensure using ID token, not access token
   - Check token expiration (tokens expire after 1 hour)
   - Verify Cognito User Pool configuration

2. **"Site administrator privileges required"**
   - User needs SiteAdmin role in database
   - Get fresh token after role changes
   - Verify enhanced auth context is working

3. **"Invalid timestamp claims"**
   - API Gateway formats timestamps as date strings
   - JWT utilities handle both Unix timestamps and formatted dates
   - Check CloudWatch logs for detailed error information

### Debugging Commands

```bash
# Check CloudWatch logs
aws logs tail /aws/lambda/sydney-cycles-get-current-user-development --since 5m
aws logs tail /aws/lambda/sydney-cycles-get-user-by-id-development --since 5m
aws logs tail /aws/lambda/sydney-cycles-update-user-development --since 5m

# Check DynamoDB data
aws dynamodb get-item \
  --table-name sydney-cycles-main-development \
  --key '{"PK":{"S":"USER#613bc510-4031-70db-bea0-8d27dc7e7454"},"SK":{"S":"PROFILE"}}'

# Decode JWT token (paste token at jwt.io)
echo $ID_TOKEN
```

## Test Automation

For automated testing, consider creating a test script that:

1. Creates fresh test users
2. Runs all test scenarios
3. Validates responses
4. Cleans up test data

This manual testing guide serves as the foundation for building comprehensive automated test suites.