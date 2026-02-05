#!/usr/bin/env node

/**
 * Test Alice Admin Login
 * Tests the exact same flow as the frontend
 */

const USER_POOL_ID = 'us-east-2_t5UUpOmPL';
const CLIENT_ID = '760idnu1d0mul2o10lut6rt7la';
const REGION = 'us-east-2';
const BASE_URL = `https://cognito-idp.${REGION}.amazonaws.com`;

async function testLogin(email, password) {
  console.log(`\n🔐 Testing login for: ${email}`);
  console.log('━'.repeat(60));

  try {
    const response = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      },
      body: JSON.stringify({
        ClientId: CLIENT_ID,
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      }),
    });

    const data = await response.json();

    console.log(`\nResponse Status: ${response.status}`);
    console.log(`Response OK: ${response.ok}`);

    if (!response.ok) {
      console.log('\n❌ Login Failed');
      console.log('Error Type:', data.__type || data.code);
      console.log('Error Message:', data.message);
      console.log('\nFull Response:', JSON.stringify(data, null, 2));
      return false;
    }

    if (data.AuthenticationResult) {
      console.log('\n✅ Login Successful!');
      console.log('\nTokens received:');
      console.log('- AccessToken:', data.AuthenticationResult.AccessToken ? '✓' : '✗');
      console.log('- IdToken:', data.AuthenticationResult.IdToken ? '✓' : '✗');
      console.log('- RefreshToken:', data.AuthenticationResult.RefreshToken ? '✓' : '✗');
      
      // Decode ID token to show user info
      if (data.AuthenticationResult.IdToken) {
        const idToken = data.AuthenticationResult.IdToken;
        const base64Url = idToken.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = JSON.parse(Buffer.from(base64, 'base64').toString());
        
        console.log('\nUser Info:');
        console.log('- Email:', jsonPayload.email);
        console.log('- Sub:', jsonPayload.sub);
        console.log('- System Role:', jsonPayload['custom:system_role'] || 'None');
        console.log('- Email Verified:', jsonPayload.email_verified);
      }
      
      return true;
    }

    if (data.ChallengeName) {
      console.log('\n⚠️  Challenge Required');
      console.log('Challenge:', data.ChallengeName);
      console.log('\nThis user needs to complete a challenge before logging in.');
      return false;
    }

    console.log('\n❌ Unexpected Response');
    console.log(JSON.stringify(data, null, 2));
    return false;

  } catch (error) {
    console.log('\n❌ Network Error');
    console.error('Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║          Test Alice Admin Login - Phase 3.4               ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const testUsers = [
    { email: 'alice.admin@example.com', password: 'TempPassword123!', role: 'Owner' },
    { email: 'admin@test.com', password: 'TestPassword123!', role: 'Admin' },
    { email: 'bob.captain@example.com', password: 'TempPassword123!', role: 'Captain' },
    { email: 'carol.leader@example.com', password: 'TempPassword123!', role: 'Leader' },
    { email: 'testuser2@test.com', password: 'TestPassword123!', role: 'Member' },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const user of testUsers) {
    const success = await testLogin(user.email, user.password);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    console.log('\n' + '━'.repeat(60));
  }

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                      TEST SUMMARY                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${testUsers.length}`);
  console.log('');

  process.exit(failCount > 0 ? 1 : 0);
}

main();
