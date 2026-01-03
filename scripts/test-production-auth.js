#!/usr/bin/env node

/**
 * Test Production Authentication
 * 
 * This script tests the authentication flow in production to diagnose
 * why the hub page shows "Please sign in" even when authenticated.
 */

const https = require('https');

// Configuration
const CONFIG = {
  apiUrl: 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development',
  cognitoUrl: 'https://cognito-idp.us-east-2.amazonaws.com',
  userPoolId: 'us-east-2_t5UUpOmPL',
  clientId: '760idnu1d0mul2o10lut6rt7la',
  region: 'us-east-2',
  testUser: {
    email: 'admin@test.com',
    password: 'TestPassword123!'
  }
};

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed, headers: res.headers });
        } catch (error) {
          resolve({ statusCode: res.statusCode, data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * Step 1: Authenticate with Cognito
 */
async function authenticateWithCognito() {
  console.log('🔐 Step 1: Authenticating with Cognito...');
  
  const body = JSON.stringify({
    ClientId: CONFIG.clientId,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: CONFIG.testUser.email,
      PASSWORD: CONFIG.testUser.password,
    },
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
    },
    body,
  };

  try {
    const response = await makeRequest(CONFIG.cognitoUrl, options);
    
    if (response.statusCode === 200 && response.data.AuthenticationResult) {
      console.log('✅ Cognito authentication successful');
      console.log(`   Access Token Length: ${response.data.AuthenticationResult.AccessToken.length}`);
      console.log(`   ID Token Length: ${response.data.AuthenticationResult.IdToken.length}`);
      
      // Decode ID token to see user info
      const idToken = response.data.AuthenticationResult.IdToken;
      const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
      console.log('   User Info:', {
        sub: payload.sub,
        email: payload.email,
        name: payload.name || payload.given_name,
        systemRole: payload['custom:system_role'],
      });
      
      return response.data.AuthenticationResult;
    } else {
      console.log('❌ Cognito authentication failed');
      console.log('   Status:', response.statusCode);
      console.log('   Response:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Cognito authentication error:', error.message);
    return null;
  }
}

/**
 * Step 2: Test API Health Check
 */
async function testApiHealth() {
  console.log('\n🏥 Step 2: Testing API Health...');
  
  try {
    const response = await makeRequest(`${CONFIG.apiUrl}/health`);
    
    if (response.statusCode === 200) {
      console.log('✅ API health check successful');
      console.log('   Response:', response.data);
      return true;
    } else {
      console.log('❌ API health check failed');
      console.log('   Status:', response.statusCode);
      console.log('   Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ API health check error:', error.message);
    return false;
  }
}

/**
 * Step 3: Test User Profile API
 */
async function testUserProfileApi(tokens) {
  console.log('\n👤 Step 3: Testing User Profile API...');
  
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokens.IdToken}`, // Use ID Token for Cognito User Pool Authorizer
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await makeRequest(`${CONFIG.apiUrl}/v1/users/me`, options);
    
    if (response.statusCode === 200) {
      console.log('✅ User profile API successful');
      console.log('   User Data:', response.data);
      return response.data;
    } else {
      console.log('❌ User profile API failed');
      console.log('   Status:', response.statusCode);
      console.log('   Response:', response.data);
      
      // Check for specific error types
      if (response.statusCode === 404) {
        console.log('   🔍 This suggests the user exists in Cognito but not in the backend database');
      } else if (response.statusCode === 401) {
        console.log('   🔍 This suggests an authentication/authorization issue');
      } else if (response.statusCode === 403) {
        console.log('   🔍 This suggests a permissions issue');
      }
      
      return null;
    }
  } catch (error) {
    console.log('❌ User profile API error:', error.message);
    return null;
  }
}

/**
 * Step 4: Test Memberships API
 */
async function testMembershipsApi(tokens) {
  console.log('\n🏛️ Step 4: Testing Memberships API...');
  
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokens.IdToken}`, // Use ID Token for Cognito User Pool Authorizer
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await makeRequest(`${CONFIG.apiUrl}/v1/users/me/memberships`, options);
    
    if (response.statusCode === 200) {
      console.log('✅ Memberships API successful');
      console.log('   Memberships:', response.data);
      return response.data;
    } else {
      console.log('❌ Memberships API failed');
      console.log('   Status:', response.statusCode);
      console.log('   Response:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Memberships API error:', error.message);
    return null;
  }
}

/**
 * Step 5: Analyze Results
 */
function analyzeResults(cognitoAuth, apiHealth, userProfile, memberships) {
  console.log('\n📊 Analysis & Recommendations:');
  console.log('=====================================');
  
  if (!cognitoAuth) {
    console.log('❌ CRITICAL: Cognito authentication failed');
    console.log('   → Check user credentials and Cognito configuration');
    return;
  }
  
  if (!apiHealth) {
    console.log('❌ CRITICAL: Backend API is not accessible');
    console.log('   → Check API Gateway URL and CORS configuration');
    console.log('   → Verify backend deployment status');
    return;
  }
  
  if (!userProfile) {
    console.log('❌ ISSUE FOUND: User profile not found in backend');
    console.log('   → The user exists in Cognito but not in the backend database');
    console.log('   → This is why the hub page shows "Please sign in"');
    console.log('   → Solutions:');
    console.log('     1. Create user profile in backend database');
    console.log('     2. Implement automatic user creation on first login');
    console.log('     3. Run user migration script');
    return;
  }
  
  console.log('✅ All authentication components working correctly');
  console.log('   → User authenticated with Cognito: ✓');
  console.log('   → Backend API accessible: ✓');
  console.log('   → User profile exists: ✓');
  
  if (memberships) {
    console.log('   → Memberships loaded: ✓');
  }
  
  console.log('\n🎯 The authentication flow should work correctly in production');
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Testing Production Authentication Flow');
  console.log('=========================================');
  console.log(`Testing with user: ${CONFIG.testUser.email}`);
  console.log(`API URL: ${CONFIG.apiUrl}`);
  console.log('');

  // Step 1: Authenticate with Cognito
  const cognitoAuth = await authenticateWithCognito();
  
  // Step 2: Test API Health
  const apiHealth = await testApiHealth();
  
  let userProfile = null;
  let memberships = null;
  
  if (cognitoAuth && apiHealth) {
    // Step 3: Test User Profile API
    userProfile = await testUserProfileApi(cognitoAuth);
    
    // Step 4: Test Memberships API (only if user profile exists)
    if (userProfile) {
      memberships = await testMembershipsApi(cognitoAuth);
    }
  }
  
  // Step 5: Analyze Results
  analyzeResults(cognitoAuth, apiHealth, userProfile, memberships);
}

// Run the test
main().catch(console.error);