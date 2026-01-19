#!/usr/bin/env node

/**
 * Test CORS Fix on Vercel
 * 
 * This script tests that the backend now returns the correct CORS headers
 * for requests from Vercel.
 * 
 * Usage:
 *   1. Get a token from Vercel app (check browser console after login)
 *   2. Run: TOKEN="your-token" node scripts/test-cors-fix-vercel.js
 */

const API_URL = 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';
const VERCEL_ORIGIN = 'https://collective-rides-frontend.vercel.app';

async function testLeaveClub(accessToken, clubId) {
  console.log(`\n🚪 Testing leave club with Vercel origin...`);
  console.log(`   Club ID: ${clubId}`);
  console.log(`   Origin: ${VERCEL_ORIGIN}`);
  
  const response = await fetch(`${API_URL}/v1/clubs/${clubId}/members/me`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Origin': VERCEL_ORIGIN,
    },
  });

  console.log(`\n📊 Response Status: ${response.status}`);
  console.log(`📊 CORS Headers:`);
  console.log(`   Access-Control-Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
  console.log(`   Access-Control-Allow-Credentials: ${response.headers.get('Access-Control-Allow-Credentials')}`);

  const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
  
  if (corsOrigin === VERCEL_ORIGIN) {
    console.log('\n✅ CORS FIX SUCCESSFUL! Backend returns correct Vercel origin');
  } else if (corsOrigin === 'http://localhost:3000') {
    console.log('\n❌ CORS FIX FAILED! Backend still returns localhost:3000');
    console.log('   This means the backend deployment did not pick up the changes.');
  } else {
    console.log(`\n⚠️  Unexpected origin: ${corsOrigin}`);
  }

  const data = await response.json();
  console.log('\n📦 Response Body:', JSON.stringify(data, null, 2));
  
  return response.ok;
}

async function testGetUserClubs(accessToken) {
  console.log(`\n📋 Testing get user clubs with Vercel origin...`);
  console.log(`   Origin: ${VERCEL_ORIGIN}`);
  
  const response = await fetch(`${API_URL}/v1/users/me/clubs`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Origin': VERCEL_ORIGIN,
    },
  });

  console.log(`\n📊 Response Status: ${response.status}`);
  console.log(`📊 CORS Headers:`);
  console.log(`   Access-Control-Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);

  const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
  
  if (corsOrigin === VERCEL_ORIGIN) {
    console.log('✅ CORS correct for get user clubs');
  } else {
    console.log(`❌ CORS incorrect: ${corsOrigin}`);
  }

  const data = await response.json();
  console.log(`\n📦 User has ${data.data?.length || 0} clubs`);
  
  return data.data || [];
}

async function main() {
  console.log('🧪 Testing CORS Fix on Vercel');
  console.log('================================\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`Vercel Origin: ${VERCEL_ORIGIN}`);
  
  const accessToken = process.env.TOKEN;
  
  if (!accessToken) {
    console.log('\n❌ No access token provided');
    console.log('\n📝 To get a token:');
    console.log('   1. Go to https://collective-rides-frontend.vercel.app');
    console.log('   2. Login with testuser2@test.com / TestPassword123!');
    console.log('   3. Open browser console');
    console.log('   4. Type: localStorage.getItem("accessToken")');
    console.log('   5. Copy the token (without quotes)');
    console.log('   6. Run: TOKEN="your-token" node scripts/test-cors-fix-vercel.js');
    process.exit(1);
  }
  
  try {
    // Get user clubs
    const clubs = await testGetUserClubs(accessToken);
    
    if (clubs.length === 0) {
      console.log('\n⚠️  No clubs to test leave functionality');
      console.log('   Please join a club first using the Vercel app');
      return;
    }
    
    // Test leave club with first club
    const firstClub = clubs[0];
    console.log(`\n🎯 Testing with club: ${firstClub.clubName} (${firstClub.clubId})`);
    
    await testLeaveClub(accessToken, firstClub.clubId);
    
    console.log('\n✅ CORS test complete!');
    console.log('\n📝 Next Steps:');
    console.log('   1. If CORS is correct, test on Vercel app');
    console.log('   2. Try leaving a club and verify it disappears');
    console.log('   3. Check browser console for any errors');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

main();
