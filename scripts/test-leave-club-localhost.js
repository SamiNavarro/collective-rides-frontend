/**
 * Test Leave Club Functionality - Localhost
 * 
 * Tests the leave club flow on localhost to debug why clubs aren't being removed from the list
 */

const API_URL = 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';
const TEST_USER = {
  email: 'testuser2@test.com',
  password: 'TestPassword123!',
  userId: '512be5a0-f031-701c-787e-15a05bbb0ad1'
};

// Test credentials
const COGNITO_CONFIG = {
  userPoolId: 'us-east-2_Hn0Aq0Aqz',
  clientId: '6rvhqvvvvvvvvvvvvvvvvvvvvv',
  region: 'us-east-2'
};

async function getAuthToken() {
  console.log('\n📝 Getting auth token for testuser2...');
  
  // For testing, we'll need to get the token from the browser
  console.log('⚠️  Please get the ID token from browser localStorage:');
  console.log('   1. Open http://localhost:3000 in browser');
  console.log('   2. Login as testuser2@test.com');
  console.log('   3. Open browser console');
  console.log('   4. Run: localStorage.getItem("idToken")');
  console.log('   5. Copy the token and paste it here\n');
  
  return null; // Will be manually provided
}

async function testGetUserClubs(token) {
  console.log('\n🔍 Testing GET /v1/users/me/clubs...');
  
  try {
    const response = await fetch(`${API_URL}/v1/users/me/clubs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data && data.data.data) {
      console.log(`\n✅ Found ${data.data.data.length} clubs`);
      data.data.data.forEach(club => {
        console.log(`   - ${club.clubName} (${club.clubId})`);
      });
      return data.data.data;
    } else {
      console.log('❌ Unexpected response format');
      return [];
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
}

async function testLeaveClub(token, clubId) {
  console.log(`\n🚪 Testing DELETE /v1/clubs/${clubId}/members/me...`);
  
  try {
    const response = await fetch(`${API_URL}/v1/clubs/${clubId}/members/me`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Successfully left club');
      return true;
    } else {
      console.log('❌ Failed to leave club');
      return false;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Leave Club Test - Localhost Debugging');
  console.log('=========================================\n');
  
  console.log('Instructions:');
  console.log('1. Make sure localhost:3000 is running');
  console.log('2. Login as testuser2@test.com');
  console.log('3. Get the ID token from browser localStorage');
  console.log('4. Run this script with the token as argument:\n');
  console.log('   node scripts/test-leave-club-localhost.js YOUR_TOKEN\n');
  
  const token = process.argv[2];
  
  if (!token) {
    console.log('❌ No token provided. Please provide token as argument.');
    console.log('\nTo get token:');
    console.log('1. Open http://localhost:3000');
    console.log('2. Login as testuser2@test.com');
    console.log('3. Open browser console');
    console.log('4. Run: localStorage.getItem("idToken")');
    console.log('5. Copy and run: node scripts/test-leave-club-localhost.js YOUR_TOKEN');
    return;
  }
  
  console.log('✅ Token provided, starting tests...\n');
  
  // Step 1: Get current clubs
  const clubs = await testGetUserClubs(token);
  
  if (clubs.length === 0) {
    console.log('\n⚠️  No clubs found. User needs to join a club first.');
    return;
  }
  
  // Step 2: Leave the first club
  const clubToLeave = clubs[0];
  console.log(`\n📋 Will leave club: ${clubToLeave.clubName} (${clubToLeave.clubId})`);
  
  const leftSuccessfully = await testLeaveClub(token, clubToLeave.clubId);
  
  if (!leftSuccessfully) {
    console.log('\n❌ Failed to leave club. Check backend logs.');
    return;
  }
  
  // Step 3: Verify club was removed
  console.log('\n⏳ Waiting 2 seconds before checking...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const clubsAfter = await testGetUserClubs(token);
  
  console.log('\n📊 Comparison:');
  console.log(`   Before: ${clubs.length} clubs`);
  console.log(`   After: ${clubsAfter.length} clubs`);
  
  if (clubsAfter.length < clubs.length) {
    console.log('\n✅ SUCCESS! Club was removed from list');
  } else {
    console.log('\n❌ ISSUE! Club count did not decrease');
    console.log('   This suggests the backend is not properly removing the membership');
  }
  
  console.log('\n🔍 Next steps:');
  console.log('1. Check if the club still appears in the My Clubs page');
  console.log('2. Check browser console for React Query cache updates');
  console.log('3. Try refreshing the page to see if it persists');
}

main().catch(console.error);
