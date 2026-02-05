#!/usr/bin/env node

const API_URL = 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';
const CLUB_ID = 'club_1770115571029';

async function getAliceToken() {
  const { execSync } = require('child_process');
  const token = execSync(`aws cognito-idp admin-initiate-auth \
    --user-pool-id us-east-2_t5UUpOmPL \
    --client-id 760idnu1d0mul2o10lut6rt7la \
    --auth-flow ADMIN_NO_SRP_AUTH \
    --auth-parameters USERNAME=alice.admin@example.com,PASSWORD=TempPassword123! \
    --region us-east-2 \
    --query 'AuthenticationResult.IdToken' \
    --output text`, { encoding: 'utf-8' }).trim();
  return token;
}

async function main() {
  console.log('\n🔍 Verifying Alice Test Club...\n');

  try {
    const token = await getAliceToken();
    console.log('✅ Got Alice token\n');

    // Try to get the club directly
    console.log(`📋 Fetching club ${CLUB_ID}...`);
    const clubResponse = await fetch(`${API_URL}/v1/clubs/${CLUB_ID}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const clubData = await clubResponse.json();
    console.log('Club response:', JSON.stringify(clubData, null, 2));
    console.log('');

    // Try to get Alice's clubs
    console.log('📋 Fetching Alice\'s clubs...');
    const myClubsResponse = await fetch(`${API_URL}/v1/users/me/clubs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const myClubsData = await myClubsResponse.json();
    console.log('My clubs response:', JSON.stringify(myClubsData, null, 2));
    console.log('');

    // List all clubs
    console.log('📋 Listing all clubs...');
    const allClubsResponse = await fetch(`${API_URL}/v1/clubs`);
    const allClubsData = await allClubsResponse.json();
    console.log('All clubs response:', JSON.stringify(allClubsData, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
