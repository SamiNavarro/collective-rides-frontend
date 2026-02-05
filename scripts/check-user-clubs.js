#!/usr/bin/env node

/**
 * Check User's Clubs
 * Verifies what clubs the user is a member of
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

async function fetchUserClubs(token) {
  const url = `${API_URL}/v1/users/me/clubs`;
  
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
  console.log('🔑 Getting token for testuser2...');
  const token = await getToken();
  console.log('✅ Token obtained\n');
  
  console.log('📋 Fetching user clubs...');
  const response = await fetchUserClubs(token);
  
  console.log(`   Status: ${response.status}`);
  
  if (response.data.data) {
    const clubs = response.data.data;
    console.log(`\n   Total clubs: ${clubs.length}`);
    console.log('\n   Clubs:');
    clubs.forEach(club => {
      console.log(`      - ${club.clubName} (${club.clubId})`);
      console.log(`        Status: ${club.membershipStatus}`);
      console.log(`        Role: ${club.role || 'N/A'}`);
    });
    
    const activeClubs = clubs.filter(c => c.membershipStatus === 'active');
    console.log(`\n   Active clubs: ${activeClubs.length}`);
    console.log(`   Active club IDs: ${activeClubs.map(c => c.clubId).join(', ')}`);
    
    const hasAttaquer = activeClubs.some(c => c.clubId === 'attaquercc');
    if (hasAttaquer) {
      console.log('\n   ✅ User IS a member of attaquercc');
    } else {
      console.log('\n   ❌ User is NOT a member of attaquercc');
      console.log('   This is why rides are not showing!');
    }
  } else {
    console.log('\n   Response:', JSON.stringify(response.data, null, 2));
  }
}

main().catch(console.error);
