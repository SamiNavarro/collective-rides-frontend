#!/usr/bin/env node

/**
 * Test Join Club Flow
 * 
 * This script tests the complete join club flow:
 * 1. Login
 * 2. Get clubs list
 * 3. Join a club
 * 4. Verify it appears in My Clubs
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';

// Test credentials
const TEST_EMAIL = 'testuser2@test.com';
const TEST_PASSWORD = 'TestPassword123!';

async function loginToCognito() {
  console.log('\n🔐 Step 1: Logging in to Cognito...');
  
  const { CognitoIdentityProviderClient, InitiateAuthCommand } = await import('@aws-sdk/client-cognito-identity-provider');
  
  const client = new CognitoIdentityProviderClient({ region: 'us-east-2' });
  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: '760idnu1d0mul2o10lut6rt7la',
    AuthParameters: {
      USERNAME: TEST_EMAIL,
      PASSWORD: TEST_PASSWORD,
    },
  });

  const response = await client.send(command);
  const accessToken = response.AuthenticationResult.AccessToken;
  
  console.log('✅ Login successful');
  console.log(`   Token: ${accessToken.substring(0, 50)}...`);
  
  return accessToken;
}

async function getClubsList(accessToken) {
  console.log('\n📋 Step 2: Getting clubs list...');
  
  const response = await fetch(`${API_URL}/v1/clubs`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get clubs: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`✅ Got ${data.data?.length || 0} clubs`);
  
  return data.data || [];
}

async function getMyClubs(accessToken) {
  console.log('\n📋 Getting My Clubs...');
  
  const response = await fetch(`${API_URL}/v1/users/me/clubs`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get my clubs: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const clubs = data.data || [];
  console.log(`✅ User has ${clubs.length} clubs`);
  
  if (clubs.length > 0) {
    console.log('\n   Current clubs:');
    clubs.forEach(club => {
      console.log(`   - ${club.clubName} (${club.clubId}) - ${club.membershipStatus}`);
    });
  }
  
  return clubs;
}

async function joinClub(accessToken, clubId, clubName) {
  console.log(`\n🚀 Step 3: Joining club "${clubName}" (${clubId})...`);
  
  const response = await fetch(`${API_URL}/v1/clubs/${clubId}/members`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'Test join from script',
    }),
  });

  console.log(`   Response status: ${response.status}`);
  
  const data = await response.json();
  console.log(`   Response data:`, JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(`Failed to join club: ${data.error || response.statusText}`);
  }

  console.log(`✅ Successfully joined club`);
  console.log(`   Membership ID: ${data.membershipId || data.data?.membershipId}`);
  console.log(`   Status: ${data.status || data.data?.status}`);
  console.log(`   Role: ${data.role || data.data?.role}`);
  
  return data;
}

async function verifyClubInMyClubs(accessToken, clubId, clubName) {
  console.log(`\n✓ Step 4: Verifying club appears in My Clubs...`);
  
  // Wait a moment for the data to propagate
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const myClubs = await getMyClubs(accessToken);
  const foundClub = myClubs.find(c => c.clubId === clubId);
  
  if (foundClub) {
    console.log(`✅ SUCCESS! Club "${clubName}" found in My Clubs`);
    console.log(`   Status: ${foundClub.membershipStatus}`);
    console.log(`   Role: ${foundClub.membershipRole}`);
    return true;
  } else {
    console.log(`❌ FAILED! Club "${clubName}" NOT found in My Clubs`);
    console.log(`\n   Expected club ID: ${clubId}`);
    console.log(`   Clubs in My Clubs: ${myClubs.map(c => c.clubId).join(', ')}`);
    return false;
  }
}

async function main() {
  console.log('🧪 Testing Join Club Flow');
  console.log('==========================\n');
  console.log(`API URL: ${API_URL}`);
  
  try {
    // Step 1: Login
    const accessToken = await loginToCognito();
    
    // Step 2: Get current clubs
    const myClubsBefore = await getMyClubs(accessToken);
    
    // Step 3: Get available clubs
    const allClubs = await getClubsList(accessToken);
    
    if (allClubs.length === 0) {
      console.log('\n❌ No clubs available to join');
      return;
    }
    
    // Find a club we're not already a member of
    const clubToJoin = allClubs.find(club => 
      !myClubsBefore.some(myClub => myClub.clubId === club.id)
    );
    
    if (!clubToJoin) {
      console.log('\n⚠️  Already a member of all clubs. Testing with first club anyway...');
      const firstClub = allClubs[0];
      
      // Try to join (might fail with "already a member")
      try {
        await joinClub(accessToken, firstClub.id, firstClub.name);
      } catch (error) {
        console.log(`   Expected error: ${error.message}`);
      }
      
      // Verify it's in My Clubs
      await verifyClubInMyClubs(accessToken, firstClub.id, firstClub.name);
      return;
    }
    
    console.log(`\n🎯 Selected club to join: ${clubToJoin.name} (${clubToJoin.id})`);
    
    // Step 4: Join the club
    const joinResult = await joinClub(accessToken, clubToJoin.id, clubToJoin.name);
    
    // Step 5: Verify it appears in My Clubs
    const success = await verifyClubInMyClubs(accessToken, clubToJoin.id, clubToJoin.name);
    
    if (success) {
      console.log('\n🎉 TEST PASSED! Join club flow working correctly.');
    } else {
      console.log('\n❌ TEST FAILED! Club did not appear in My Clubs.');
      console.log('\n🔍 Debugging info:');
      console.log('   - Join API returned success');
      console.log('   - But club not found in My Clubs API');
      console.log('   - This suggests a data consistency issue');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

main();
