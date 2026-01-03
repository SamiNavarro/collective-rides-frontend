#!/usr/bin/env node

/**
 * Debug JWT Token
 * 
 * This script helps debug JWT token issues by:
 * 1. Getting a JWT token from Cognito
 * 2. Decoding and inspecting the token
 * 3. Testing the token with the API Gateway
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
 * Decode JWT token (without verification)
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    
    return { header, payload };
  } catch (error) {
    console.log('Error decoding JWT:', error.message);
    return null;
  }
}

/**
 * Get JWT tokens from Cognito
 */
async function getJWTTokens() {
  console.log('🔐 Getting JWT tokens from Cognito...');
  
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
      const tokens = response.data.AuthenticationResult;
      console.log('✅ Successfully obtained JWT tokens');
      
      return {
        accessToken: tokens.AccessToken,
        idToken: tokens.IdToken,
        refreshToken: tokens.RefreshToken,
      };
    } else {
      console.log('❌ Failed to get JWT tokens');
      console.log('Response:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error getting JWT tokens:', error.message);
    return null;
  }
}

/**
 * Analyze JWT tokens
 */
function analyzeJWTTokens(tokens) {
  console.log('\n🔍 Analyzing JWT tokens...');
  
  // Decode Access Token
  console.log('\n📋 Access Token Analysis:');
  const accessTokenDecoded = decodeJWT(tokens.accessToken);
  if (accessTokenDecoded) {
    console.log('Header:', JSON.stringify(accessTokenDecoded.header, null, 2));
    console.log('Payload:', JSON.stringify(accessTokenDecoded.payload, null, 2));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const exp = accessTokenDecoded.payload.exp;
    const timeUntilExpiry = exp - now;
    console.log(`Expires in: ${timeUntilExpiry} seconds (${Math.floor(timeUntilExpiry / 60)} minutes)`);
  }
  
  // Decode ID Token
  console.log('\n🆔 ID Token Analysis:');
  const idTokenDecoded = decodeJWT(tokens.idToken);
  if (idTokenDecoded) {
    console.log('Header:', JSON.stringify(idTokenDecoded.header, null, 2));
    console.log('Payload:', JSON.stringify(idTokenDecoded.payload, null, 2));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const exp = idTokenDecoded.payload.exp;
    const timeUntilExpiry = exp - now;
    console.log(`Expires in: ${timeUntilExpiry} seconds (${Math.floor(timeUntilExpiry / 60)} minutes)`);
  }
  
  return { accessTokenDecoded, idTokenDecoded };
}

/**
 * Test API with different token types
 */
async function testApiWithTokens(tokens) {
  console.log('\n🧪 Testing API with different token types...');
  
  // Test with Access Token
  console.log('\n1. Testing with Access Token:');
  await testApiCall(tokens.accessToken, 'Access Token');
  
  // Test with ID Token
  console.log('\n2. Testing with ID Token:');
  await testApiCall(tokens.idToken, 'ID Token');
}

/**
 * Test API call with specific token
 */
async function testApiCall(token, tokenType) {
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await makeRequest(`${CONFIG.apiUrl}/v1/users/me`, options);
    
    console.log(`${tokenType} Result:`);
    console.log(`  Status: ${response.statusCode}`);
    console.log(`  Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 401) {
      console.log(`  🔍 ${tokenType} was rejected by API Gateway Cognito Authorizer`);
    } else if (response.statusCode === 200) {
      console.log(`  ✅ ${tokenType} was accepted by API Gateway`);
    }
    
  } catch (error) {
    console.log(`  ❌ Error testing ${tokenType}:`, error.message);
  }
}

/**
 * Test token validation manually
 */
function validateTokenFormat(tokens, decoded) {
  console.log('\n🔧 Manual Token Validation:');
  
  // Check Access Token format
  console.log('\nAccess Token Validation:');
  if (decoded.accessTokenDecoded) {
    const payload = decoded.accessTokenDecoded.payload;
    console.log(`  ✓ Token Type: ${payload.token_use || 'unknown'}`);
    console.log(`  ✓ Client ID: ${payload.client_id || payload.aud || 'unknown'}`);
    console.log(`  ✓ User Pool: ${payload.iss ? payload.iss.split('/').pop() : 'unknown'}`);
    console.log(`  ✓ Subject: ${payload.sub || 'unknown'}`);
    
    // Check if it's the right token type for API Gateway
    if (payload.token_use === 'access') {
      console.log('  ✅ Correct token type for API Gateway (access token)');
    } else {
      console.log('  ⚠️  This might not be the right token type for API Gateway');
    }
  }
  
  // Check ID Token format
  console.log('\nID Token Validation:');
  if (decoded.idTokenDecoded) {
    const payload = decoded.idTokenDecoded.payload;
    console.log(`  ✓ Token Type: ${payload.token_use || 'unknown'}`);
    console.log(`  ✓ Audience: ${payload.aud || 'unknown'}`);
    console.log(`  ✓ User Pool: ${payload.iss ? payload.iss.split('/').pop() : 'unknown'}`);
    console.log(`  ✓ Subject: ${payload.sub || 'unknown'}`);
    console.log(`  ✓ Email: ${payload.email || 'unknown'}`);
    console.log(`  ✓ Name: ${payload.name || payload.given_name || 'unknown'}`);
    
    if (payload.token_use === 'id') {
      console.log('  ✅ Correct token type for user information (ID token)');
    }
  }
}

/**
 * Provide recommendations
 */
function provideRecommendations(tokens, decoded) {
  console.log('\n💡 Recommendations:');
  console.log('=====================================');
  
  if (!tokens) {
    console.log('❌ Could not obtain JWT tokens from Cognito');
    console.log('   → Check Cognito configuration and user credentials');
    return;
  }
  
  if (!decoded.accessTokenDecoded || !decoded.idTokenDecoded) {
    console.log('❌ Could not decode JWT tokens');
    console.log('   → Tokens may be malformed or corrupted');
    return;
  }
  
  const accessPayload = decoded.accessTokenDecoded.payload;
  const idPayload = decoded.idTokenDecoded.payload;
  
  // Check token configuration
  console.log('\n🔧 Token Configuration:');
  
  if (accessPayload.client_id !== CONFIG.clientId) {
    console.log(`❌ Access token client_id (${accessPayload.client_id}) doesn't match expected (${CONFIG.clientId})`);
  } else {
    console.log('✅ Access token client_id matches configuration');
  }
  
  if (idPayload.aud !== CONFIG.clientId) {
    console.log(`❌ ID token audience (${idPayload.aud}) doesn't match expected (${CONFIG.clientId})`);
  } else {
    console.log('✅ ID token audience matches configuration');
  }
  
  // Check user pool
  const expectedIssuer = `https://cognito-idp.${CONFIG.region}.amazonaws.com/${CONFIG.userPoolId}`;
  if (accessPayload.iss !== expectedIssuer) {
    console.log(`❌ Access token issuer (${accessPayload.iss}) doesn't match expected (${expectedIssuer})`);
  } else {
    console.log('✅ Access token issuer matches configuration');
  }
  
  // API Gateway recommendations
  console.log('\n🚪 API Gateway Integration:');
  console.log('For Cognito User Pool Authorizer, you should typically use:');
  console.log('  → ID Token for user authentication (contains user info)');
  console.log('  → Access Token for API authorization (contains scopes)');
  console.log('');
  console.log('Current API Gateway Cognito Authorizer expects:');
  console.log('  → Authorization: Bearer <id_token>');
  console.log('  → The authorizer validates the token and populates requestContext.authorizer.claims');
  
  // Check if we should try ID token
  if (accessPayload.token_use === 'access' && idPayload.token_use === 'id') {
    console.log('\n🎯 Next Steps:');
    console.log('1. The API is currently being called with Access Token');
    console.log('2. Try using ID Token instead for Cognito User Pool Authorizer');
    console.log('3. Verify API Gateway Cognito Authorizer configuration');
    console.log('4. Check if the authorizer is configured for the correct User Pool');
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 JWT Token Debug Tool');
  console.log('========================');
  console.log(`User: ${CONFIG.testUser.email}`);
  console.log(`User Pool: ${CONFIG.userPoolId}`);
  console.log(`Client ID: ${CONFIG.clientId}`);
  console.log(`API URL: ${CONFIG.apiUrl}`);
  console.log('');

  // Step 1: Get JWT tokens
  const tokens = await getJWTTokens();
  if (!tokens) {
    console.log('❌ Cannot proceed without JWT tokens');
    return;
  }

  // Step 2: Analyze tokens
  const decoded = analyzeJWTTokens(tokens);

  // Step 3: Test API with tokens
  await testApiWithTokens(tokens);

  // Step 4: Validate token format
  validateTokenFormat(tokens, decoded);

  // Step 5: Provide recommendations
  provideRecommendations(tokens, decoded);
}

// Run the debug tool
main().catch(console.error);