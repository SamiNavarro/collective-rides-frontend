#!/usr/bin/env node

/**
 * Test leave ride fix
 * Tests the complete join → leave → check state cycle
 */

const https = require('https');

const API_URL = 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';
const CLUB_ID = 'attaquercc';

// Use the LEADER token since CAPTAIN_TOKEN is empty
const TOKEN = 'eyJraWQiOiJ2MXgzT09mZnhja2NUaWR3c0JvS05DN2tlRnR0R3ZPcnkzUTI0VXFNa0M0PSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI5MTJiNDVjMC00MDgxLTcwMWUtYTg3OC0wMGZmMGY0MjdjMmQiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMi5hbWF6b25hd3MuY29tXC91cy1lYXN0LTJfdDVVVXBPbVBMIiwiY29nbml0bzp1c2VybmFtZSI6IjkxMmI0NWMwLTQwODEtNzAxZS1hODc4LTAwZmYwZjQyN2MyZCIsIm9yaWdpbl9qdGkiOiI1MjkzYjBmNS1hMTc1LTRjMzMtYTQyYi1hYTZlYTUzZWZjOWEiLCJhdWQiOiI3NjBpZG51MWQwbXVsMm8xMGx1dDZydDdsYSIsImV2ZW50X2lkIjoiYzdmZTU4OTgtMzIzYy00ZmQxLTg2YmYtYTM3MGRhZDY1ZmZmIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3Njk4NjMxMTMsImV4cCI6MTc2OTg2NjcxMywiaWF0IjoxNzY5ODYzMTEzLCJqdGkiOiIwNmEzNjIxMS1iNTVhLTQ5ZjYtOThhNi00OWFhMGFmNzEyOTgiLCJlbWFpbCI6ImNhcm9sLmxlYWRlckBleGFtcGxlLmNvbSJ9.Ucs_q7FWqQyTSCc2Z484WbDkzuDW0g1wIOkJ5H-4X2-CASyW4TP9Ebm7oTqV22pNAQnJJZ2DuTpOakYCfm-W_8IL8MtWNMyqLEIURQAGRyZx2W0PAOYSX53VlENtWHjqF_Vub0o-MS9Kq0Yf9kkHQbnFScH3UFNYNA7MnsdbmMRbXGhQ8svEoXConrOCet7kt54DpAzOJxwfqCRKoO7oA2raTz1SBPf9395vSNRAwP2GJ0GJP2ek2YnSXyqElvUUFwfrMFIRI--M3gRFxG_BkbZCX_sWnJv8CWb3BTfc1Jqh3ee7YBjQO1mbJUAuolDfwkHesqNVTNzdO77918CxEQ';

async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = new URL(endpoint, API_URL);
  
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testLeaveRideFix() {
  console.log('\n=== Testing Leave Ride Fix ===\n');
  
  // Step 1: List rides to find one to test with
  console.log('1. Finding a ride to test with...');
  const ridesResponse = await makeRequest(`/v1/clubs/${CLUB_ID}/rides?status=published&limit=5`);
  
  if (ridesResponse.status !== 200 || !ridesResponse.data.data) {
    console.error('❌ Failed to fetch rides');
    return;
  }
  
  const rides = ridesResponse.data.data.data || ridesResponse.data.data;
  if (rides.length === 0) {
    console.error('❌ No rides found. Please seed rides first.');
    return;
  }
  
  const testRide = rides[0];
  const rideId = testRide.rideId;
  console.log(`✅ Using ride: ${testRide.title} (${rideId})\n`);
  
  // Step 2: Check initial state
  console.log('2. Checking initial state...');
  let rideResponse = await makeRequest(`/v1/clubs/${CLUB_ID}/rides/${rideId}`);
  
  if (rideResponse.status !== 200) {
    console.error('❌ Failed to fetch ride details');
    return;
  }
  
  let ride = rideResponse.data.data;
  console.log(`   Participants: ${ride.currentParticipants}/${ride.maxParticipants || 'unlimited'}`);
  console.log(`   Viewer participating: ${ride.viewerParticipation ? 'YES' : 'NO'}`);
  
  // Step 3: Join the ride (if not already joined)
  if (!ride.viewerParticipation) {
    console.log('\n3. Joining ride...');
    const joinResponse = await makeRequest(
      `/v1/clubs/${CLUB_ID}/rides/${rideId}/join`,
      'POST',
      {}
    );
    
    if (joinResponse.status === 200) {
      console.log('✅ Successfully joined ride');
    } else if (joinResponse.status === 409) {
      console.log('ℹ️  Already participating (409 - expected if already joined)');
    } else {
      console.error(`❌ Failed to join: ${joinResponse.status}`, joinResponse.data);
      return;
    }
    
    // Refresh ride state
    rideResponse = await makeRequest(`/v1/clubs/${CLUB_ID}/rides/${rideId}`);
    ride = rideResponse.data.data;
  } else {
    console.log('\n3. Already participating, skipping join step');
  }
  
  console.log(`   Participants after join: ${ride.currentParticipants}`);
  console.log(`   Viewer participating: ${ride.viewerParticipation ? 'YES' : 'NO'}`);
  
  // Step 4: Leave the ride
  console.log('\n4. Leaving ride...');
  const leaveResponse = await makeRequest(
    `/v1/clubs/${CLUB_ID}/rides/${rideId}/participants/me`,
    'DELETE'
  );
  
  if (leaveResponse.status === 200) {
    console.log('✅ Successfully left ride');
  } else {
    console.error(`❌ Failed to leave: ${leaveResponse.status}`, leaveResponse.data);
    return;
  }
  
  // Step 5: Check state after leaving
  console.log('\n5. Checking state after leaving...');
  rideResponse = await makeRequest(`/v1/clubs/${CLUB_ID}/rides/${rideId}`);
  ride = rideResponse.data.data;
  
  console.log(`   Participants after leave: ${ride.currentParticipants}`);
  console.log(`   Viewer participating: ${ride.viewerParticipation ? 'YES' : 'NO'}`);
  
  if (ride.viewerParticipation) {
    console.error('\n❌ BUG: viewerParticipation should be null/undefined after leaving!');
    console.error('   Current value:', ride.viewerParticipation);
    return;
  }
  
  console.log('✅ viewerParticipation is correctly null/undefined');
  
  // Step 6: Try to leave again (should fail gracefully)
  console.log('\n6. Trying to leave again (should fail gracefully)...');
  const leaveAgainResponse = await makeRequest(
    `/v1/clubs/${CLUB_ID}/rides/${rideId}/participants/me`,
    'DELETE'
  );
  
  if (leaveAgainResponse.status === 404) {
    console.log('✅ Correctly returned 404 (not participating)');
  } else if (leaveAgainResponse.status === 400) {
    console.log('⚠️  Returned 400 instead of 404, but error is handled');
  } else if (leaveAgainResponse.status === 200) {
    console.error('❌ BUG: Should not allow leaving twice!');
    return;
  } else {
    console.error(`❌ Unexpected status: ${leaveAgainResponse.status}`, leaveAgainResponse.data);
    return;
  }
  
  // Step 7: Rejoin to verify we can join again
  console.log('\n7. Rejoining ride to verify we can join again...');
  const rejoinResponse = await makeRequest(
    `/v1/clubs/${CLUB_ID}/rides/${rideId}/join`,
    'POST',
    {}
  );
  
  if (rejoinResponse.status === 200) {
    console.log('✅ Successfully rejoined ride');
  } else {
    console.error(`❌ Failed to rejoin: ${rejoinResponse.status}`, rejoinResponse.data);
    return;
  }
  
  // Final state check
  rideResponse = await makeRequest(`/v1/clubs/${CLUB_ID}/rides/${rideId}`);
  ride = rideResponse.data.data;
  
  console.log(`   Participants after rejoin: ${ride.currentParticipants}`);
  console.log(`   Viewer participating: ${ride.viewerParticipation ? 'YES' : 'NO'}`);
  
  if (!ride.viewerParticipation) {
    console.error('\n❌ BUG: viewerParticipation should exist after rejoining!');
    return;
  }
  
  console.log('\n✅ All tests passed! Leave ride functionality is working correctly.');
}

// Run the test
testLeaveRideFix().catch(error => {
  console.error('\n❌ Test failed with error:', error.message);
  process.exit(1);
});
