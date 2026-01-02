# Frontend-Backend Connection Testing Guide

## Overview

This guide provides comprehensive testing methods to verify that your frontend and backend are properly connected and communicating correctly.

**Last Updated**: January 2, 2026  
**Version**: 1.0  
**Status**: Ready for Testing

## Testing Levels

### 1. **Basic Connectivity Tests** (No Authentication Required)
### 2. **API Integration Tests** (With CORS Validation)
### 3. **Authentication Flow Tests** (Cognito Integration)
### 4. **End-to-End User Flow Tests** (Complete Integration)

---

## Level 1: Basic Connectivity Tests

### Test 1.1: Health Check Endpoint
**Purpose**: Verify basic API connectivity and CORS configuration

#### Manual Test:
```bash
# Test from command line
curl -H "Origin: https://collective-rides-frontend.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/health

# Expected: CORS headers in response
```

#### Frontend Test:
```javascript
// Add this to your frontend console or a test page
fetch('https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Backend Health Check:', data);
    // Expected: { status: "healthy", timestamp: "...", version: "1.0.0" }
  })
  .catch(error => {
    console.error('❌ Backend Connection Failed:', error);
  });
```

### Test 1.2: CORS Preflight Validation
**Purpose**: Ensure CORS is properly configured for your frontend domain

#### Browser Console Test:
```javascript
// Test CORS preflight request
fetch('https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/health', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
.then(response => {
  console.log('✅ CORS Test Passed:', response.status);
  return response.json();
})
.then(data => console.log('Response:', data))
.catch(error => console.error('❌ CORS Test Failed:', error));
```

---

## Level 2: API Integration Tests

### Test 2.1: Public Endpoints (No Auth Required)
**Purpose**: Test API endpoints that don't require authentication

#### Test List Clubs Endpoint:
```javascript
// Test public club listing
fetch('https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/clubs')
  .then(response => {
    console.log('Status:', response.status);
    if (response.status === 401) {
      console.log('✅ Expected: Authentication required for clubs endpoint');
    } else if (response.status === 200) {
      return response.json();
    } else {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  })
  .then(data => {
    if (data) console.log('✅ Clubs data:', data);
  })
  .catch(error => console.error('❌ Clubs API Test Failed:', error));
```

### Test 2.2: Environment Variables Loading
**Purpose**: Verify frontend environment variables are loaded correctly

#### Frontend Environment Test:
```javascript
// Add this to your frontend application
console.log('🔧 Environment Variables Check:');
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('AWS Region:', process.env.NEXT_PUBLIC_AWS_REGION);
console.log('Cognito User Pool ID:', process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID);
console.log('Cognito Client ID:', process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID);
console.log('Strava Client ID:', process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID);

// Verify all required variables are present
const requiredVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_AWS_REGION',
  'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
  'NEXT_PUBLIC_COGNITO_CLIENT_ID'
];

const missing = requiredVars.filter(varName => !process.env[varName]);
if (missing.length === 0) {
  console.log('✅ All environment variables loaded correctly');
} else {
  console.error('❌ Missing environment variables:', missing);
}
```

---

## Level 3: Authentication Flow Tests

### Test 3.1: Cognito Configuration Test
**Purpose**: Verify Cognito User Pool configuration

#### Manual Cognito Test:
```bash
# Test Cognito User Pool accessibility
aws cognito-idp describe-user-pool --user-pool-id us-east-2_t5UUpOmPL --region us-east-2

# Expected: User pool details returned
```

### Test 3.2: JWT Token Validation
**Purpose**: Test authentication token handling

#### Frontend Auth Test:
```javascript
// Test authentication flow (add to your auth context or test page)
const testAuthFlow = async () => {
  try {
    // This would be your actual auth implementation
    console.log('🔐 Testing Authentication Flow...');
    
    // Test 1: Check if Cognito client is configured
    const cognitoConfig = {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      region: process.env.NEXT_PUBLIC_AWS_REGION
    };
    
    console.log('Cognito Config:', cognitoConfig);
    
    // Test 2: Attempt to call protected endpoint without auth
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/users/current`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.status === 401) {
      console.log('✅ Protected endpoint correctly requires authentication');
    } else {
      console.warn('⚠️ Protected endpoint returned:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Auth Flow Test Failed:', error);
  }
};

testAuthFlow();
```

---

## Level 4: End-to-End Integration Tests

### Test 4.1: Complete User Journey Test
**Purpose**: Test the complete user experience from frontend to backend

#### Create Test Component:
```typescript
// Create this as a test page: pages/test-integration.tsx
import { useState, useEffect } from 'react';

export default function IntegrationTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  
  const runTests = async () => {
    const results = [];
    
    // Test 1: Health Check
    try {
      const healthResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
      const healthData = await healthResponse.json();
      results.push({
        test: 'Health Check',
        status: healthResponse.ok ? '✅ PASS' : '❌ FAIL',
        data: healthData
      });
    } catch (error) {
      results.push({
        test: 'Health Check',
        status: '❌ FAIL',
        error: error.message
      });
    }
    
    // Test 2: CORS Check
    try {
      const corsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/clubs`);
      results.push({
        test: 'CORS Configuration',
        status: corsResponse.status !== 0 ? '✅ PASS' : '❌ FAIL',
        statusCode: corsResponse.status
      });
    } catch (error) {
      results.push({
        test: 'CORS Configuration',
        status: error.message.includes('CORS') ? '❌ FAIL' : '⚠️ OTHER',
        error: error.message
      });
    }
    
    // Test 3: Environment Variables
    const envVars = {
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    };
    
    const missingVars = Object.entries(envVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    results.push({
      test: 'Environment Variables',
      status: missingVars.length === 0 ? '✅ PASS' : '❌ FAIL',
      missing: missingVars,
      loaded: envVars
    });
    
    // Test 4: Strava Integration Endpoints
    try {
      const stravaResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/strava/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=wrong`
      );
      results.push({
        test: 'Strava Webhook Endpoint',
        status: stravaResponse.status === 403 ? '✅ PASS' : '❌ FAIL',
        statusCode: stravaResponse.status,
        note: 'Expected 403 with wrong token'
      });
    } catch (error) {
      results.push({
        test: 'Strava Webhook Endpoint',
        status: '❌ FAIL',
        error: error.message
      });
    }
    
    setTestResults(results);
  };
  
  useEffect(() => {
    runTests();
  }, []);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Frontend-Backend Integration Test</h1>
      <button onClick={runTests} style={{ marginBottom: '20px', padding: '10px' }}>
        Run Tests Again
      </button>
      
      {testResults.map((result, index) => (
        <div key={index} style={{ 
          marginBottom: '15px', 
          padding: '10px', 
          border: '1px solid #ccc',
          backgroundColor: result.status.includes('✅') ? '#e8f5e8' : 
                          result.status.includes('❌') ? '#ffe8e8' : '#fff8e1'
        }}>
          <h3>{result.test}: {result.status}</h3>
          {result.data && <pre>{JSON.stringify(result.data, null, 2)}</pre>}
          {result.error && <p style={{ color: 'red' }}>Error: {result.error}</p>}
          {result.statusCode && <p>Status Code: {result.statusCode}</p>}
          {result.missing && result.missing.length > 0 && (
            <p style={{ color: 'red' }}>Missing: {result.missing.join(', ')}</p>
          )}
          {result.loaded && (
            <details>
              <summary>Environment Variables</summary>
              <pre>{JSON.stringify(result.loaded, null, 2)}</pre>
            </details>
          )}
          {result.note && <p style={{ fontStyle: 'italic' }}>{result.note}</p>}
        </div>
      ))}
    </div>
  );
}
```

### Test 4.2: Network Tab Validation
**Purpose**: Use browser developer tools to inspect requests

#### Steps:
1. **Open Browser Developer Tools** (F12)
2. **Go to Network Tab**
3. **Navigate to your frontend application**
4. **Look for API requests** to your backend
5. **Check for**:
   - ✅ Requests reaching backend URLs
   - ✅ Proper CORS headers in responses
   - ✅ No CORS errors in console
   - ✅ Appropriate status codes (200, 401, etc.)

---

## Automated Testing Scripts

### Script 1: Backend Connectivity Test
```bash
#!/bin/bash
# Save as: scripts/test-backend-connection.sh

echo "🔍 Testing Backend Connectivity..."

API_URL="https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development"
FRONTEND_URL="https://collective-rides-frontend.vercel.app"

# Test 1: Health Check
echo "1. Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health.json "$API_URL/health")
if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "✅ Health Check: PASS"
    cat /tmp/health.json
else
    echo "❌ Health Check: FAIL (Status: $HEALTH_RESPONSE)"
fi

# Test 2: CORS Preflight
echo -e "\n2. Testing CORS Configuration..."
CORS_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/cors.json \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: GET" \
    -H "Access-Control-Request-Headers: Content-Type,Authorization" \
    -X OPTIONS \
    "$API_URL/v1/clubs")

if [ "$CORS_RESPONSE" = "200" ]; then
    echo "✅ CORS Preflight: PASS"
else
    echo "❌ CORS Preflight: FAIL (Status: $CORS_RESPONSE)"
fi

# Test 3: Protected Endpoint (should return 401)
echo -e "\n3. Testing Protected Endpoint..."
PROTECTED_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/protected.json "$API_URL/v1/users/current")
if [ "$PROTECTED_RESPONSE" = "401" ]; then
    echo "✅ Protected Endpoint: PASS (Correctly requires auth)"
else
    echo "⚠️ Protected Endpoint: Status $PROTECTED_RESPONSE (Expected 401)"
fi

# Test 4: Strava Webhook
echo -e "\n4. Testing Strava Webhook..."
WEBHOOK_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/webhook.json \
    "$API_URL/integrations/strava/webhook?hub.mode=subscribe&hub.challenge=test&hub.verify_token=wrong")
if [ "$WEBHOOK_RESPONSE" = "403" ]; then
    echo "✅ Strava Webhook: PASS (Correctly rejects wrong token)"
else
    echo "❌ Strava Webhook: FAIL (Status: $WEBHOOK_RESPONSE)"
fi

# Cleanup
rm -f /tmp/health.json /tmp/cors.json /tmp/protected.json /tmp/webhook.json

echo -e "\n🏁 Backend connectivity test completed!"
```

### Script 2: Frontend Environment Test
```javascript
// Save as: scripts/test-frontend-env.js
// Run with: node scripts/test-frontend-env.js

const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_AWS_REGION',
  'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
  'NEXT_PUBLIC_COGNITO_CLIENT_ID',
  'NEXT_PUBLIC_STRAVA_CLIENT_ID'
];

console.log('🔍 Testing Frontend Environment Variables...\n');

let allPresent = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allPresent = false;
  }
});

console.log('\n' + (allPresent ? '✅ All environment variables present!' : '❌ Some environment variables missing!'));

// Test API connectivity
if (process.env.NEXT_PUBLIC_API_URL) {
  console.log('\n🔍 Testing API connectivity...');
  
  fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`)
    .then(response => response.json())
    .then(data => {
      console.log('✅ API Health Check:', data);
    })
    .catch(error => {
      console.error('❌ API Health Check Failed:', error.message);
    });
}
```

---

## Quick Testing Checklist

### ✅ **Pre-Deployment Tests** (Local)
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Environment variables loaded in development
- [ ] Backend health endpoint accessible
- [ ] No CORS errors in browser console

### ✅ **Post-Deployment Tests** (Production)
- [ ] Frontend deployed and accessible
- [ ] Backend API calls work from frontend
- [ ] CORS headers present in responses
- [ ] Authentication endpoints return 401 when expected
- [ ] Strava webhook endpoint responds correctly

### ✅ **Integration Tests**
- [ ] Frontend can call backend APIs
- [ ] Environment variables loaded in production
- [ ] No network errors in browser console
- [ ] User flows work end-to-end

---

## Troubleshooting Common Issues

### Issue 1: CORS Errors
**Symptoms**: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solutions**:
```bash
# Check backend CORS configuration
curl -H "Origin: https://your-frontend-domain.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://your-api-url.com/endpoint

# Verify frontend domain is in backend CORS origins
# Update backend CORS configuration if needed
```

### Issue 2: Environment Variables Not Loading
**Symptoms**: `undefined` values for `process.env.NEXT_PUBLIC_*`

**Solutions**:
1. Check Vercel environment variables configuration
2. Ensure variables have `NEXT_PUBLIC_` prefix
3. Redeploy after adding new variables
4. Check `.env.local` for local development

### Issue 3: 404 Errors on API Calls
**Symptoms**: API endpoints return 404 Not Found

**Solutions**:
```bash
# Verify API Gateway deployment
aws apigateway get-rest-apis --region us-east-2

# Check endpoint URLs
curl -I https://your-api-url.com/health

# Verify API Gateway stage deployment
```

### Issue 4: Authentication Failures
**Symptoms**: All API calls return 401 Unauthorized

**Solutions**:
1. Check Cognito User Pool configuration
2. Verify JWT token format and expiration
3. Test authentication flow step by step
4. Check Cognito Client ID and User Pool ID

---

## Success Criteria

### ✅ **Basic Connection**
- Health endpoint returns 200 OK
- CORS headers present in responses
- No CORS errors in browser console

### ✅ **API Integration**
- Frontend can make API calls to backend
- Environment variables loaded correctly
- Protected endpoints return 401 when expected

### ✅ **Authentication Ready**
- Cognito configuration accessible
- JWT token handling prepared
- Auth endpoints respond correctly

### ✅ **Strava Integration Ready**
- Webhook endpoint accessible
- OAuth endpoints configured
- Environment variables set

---

**Document Version**: 1.0  
**Last Updated**: January 2, 2026  
**Next Review**: February 2, 2026  
**Maintained By**: Development Team