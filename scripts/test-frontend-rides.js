#!/usr/bin/env node

/**
 * Test Frontend Rides API Call
 * Simulates what the frontend does when fetching rides
 */

const https = require('https');

const API_URL = 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';
const CLIENT_ID = '760idnu1d0mul2o10lut6rt7la';

// testuser2 is captain of Attaquer
const email = 'testuser2@test.com';
const password = 'TestPassword123!';

async function getToken() {
  const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');
  
  const client = new CognitoIdentityProviderClient({ region: 'us-east-2' });
  const command = new InitiateAuthCommand({
    ClientId: CLIENT_ID,
    AuthFlow: 'USER_PASSWORD_AUTH',
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });
  
  const response = await client.send(command);
  return response.AuthenticationResult.IdToken;
}

async function fetchRides(token, clubId, params) {
  const queryString = new URLSearchParams(params).toString();
  const url = `${API_URL}/v1/clubs/${clubId}/rides${queryString ? `?${queryString}` : ''}`;
  
  console.log(`\n📡 Fetching: ${url}`);
  
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
  });
}

async function main() {
  console.log('🔑 Getting token for testuser1...');
  const token = await getToken();
  console.log('✅ Token obtained\n');
  
  // Simulate frontend date filter (7 days ago)
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  
  console.log('📅 Date filter:');
  console.log(`   Start: ${startDate.toISOString()}`);
  console.log(`   (7 days ago)`);
  
  // Test 1: Exact frontend call
  console.log('\n🧪 Test 1: Simulating frontend call');
  const response1 = await fetchRides(token, 'attaquercc', {
    status: 'published',
    startDate: startDate.toISOString(),
    limit: 50,
  });
  
  console.log(`   Status: ${response1.status}`);
  console.log(`   Rides found: ${response1.data.data?.length || 0}`);
  
  if (response1.data.data && response1.data.data.length > 0) {
    console.log('\n   ✅ SUCCESS! Rides are being returned:');
    response1.data.data.slice(0, 5).forEach(ride => {
      console.log(`      - ${ride.title} (${ride.startDateTime})`);
    });
    if (response1.data.data.length > 5) {
      console.log(`      ... and ${response1.data.data.length - 5} more`);
    }
  } else {
    console.log('\n   ❌ No rides returned');
    console.log('   Response:', JSON.stringify(response1.data, null, 2));
  }
  
  // Test 2: Without date filter
  console.log('\n🧪 Test 2: Without date filter');
  const response2 = await fetchRides(token, 'attaquercc', {
    status: 'published',
    limit: 50,
  });
  
  console.log(`   Status: ${response2.status}`);
  console.log(`   Rides found: ${response2.data.data?.length || 0}`);
  
  console.log('\n✅ Tests complete!');
  console.log('\nIf rides are showing here but not in the frontend:');
  console.log('  1. Check browser console for errors');
  console.log('  2. Clear React Query cache (hard refresh)');
  console.log('  3. Check if clubIds array is correct in useRides hook');
}

main().catch(console.error);
