#!/usr/bin/env node

/**
 * Test Script: Phase 3.3.2 - Ride Detail + Join/Leave
 * 
 * Tests the ride detail page and join/leave functionality.
 */

const https = require('https');

const API_URL = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';

// Test user token (from test-tokens.env)
const TEST_TOKEN = process.env.MEMBER_TOKEN || process.env.ADMIN_TOKEN || process.env.TEST_USER_TOKEN;

if (!TEST_TOKEN) {
  console.error('❌ MEMBER_TOKEN, ADMIN_TOKEN or TEST_USER_TOKEN not found in environment');
  console.log('Run: source test-tokens.env');
  process.exit(1);
}

// Helper to make API requests
function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
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

async function runTests() {
  console.log('🧪 Phase 3.3.2: Ride Detail + Join/Leave Tests\n');

  try {
    // Step 1: Get a published ride from any club
    console.log('1️⃣ Getting published rides...');
    
    // First get all clubs (public endpoint, no auth needed)
    const clubsRes = await apiRequest('GET', '/v1/clubs?limit=10');
    
    const clubsData = clubsRes.data.data || clubsRes.data;
    if (!Array.isArray(clubsData) || clubsData.length === 0) {
      console.error('❌ No clubs found');
      console.log('Response:', JSON.stringify(clubsRes, null, 2));
      return;
    }

    let ride = null;
    let club = null;

    // Try to find a published ride from any club
    for (const c of clubsData) {
      const clubId = c.id || c.clubId;
      const ridesRes = await apiRequest('GET', `/v1/clubs/${clubId}/rides?status=published&limit=1`);
      
      const ridesData = ridesRes.data.data || ridesRes.data;
      if (Array.isArray(ridesData) && ridesData.length > 0) {
        club = c;
        ride = ridesData[0];
        break;
      }
    }

    if (!ride || !club) {
      console.error('❌ No published rides found in any club');
      return;
    }

    const clubId = club.id || club.clubId;
    const rideId = ride.id || ride.rideId;

    console.log(`✅ Found club: ${club.name} (${clubId})`);
    console.log(`✅ Found ride: ${ride.title} (${rideId})\n`);

    // Step 2: Get ride detail (with viewerParticipation)
    console.log('2️⃣ Getting ride detail...');
    const detailRes = await apiRequest('GET', `/v1/clubs/${clubId}/rides/${rideId}`);
    
    if (!detailRes.data.success) {
      console.error('❌ Failed to get ride detail');
      return;
    }

    const rideDetail = detailRes.data.data;
    console.log(`✅ Ride Detail:`);
    console.log(`   Title: ${rideDetail.title}`);
    console.log(`   Status: ${rideDetail.status}`);
    console.log(`   Participants: ${rideDetail.currentParticipants}${rideDetail.maxParticipants ? ` / ${rideDetail.maxParticipants}` : ''}`);
    console.log(`   Viewer Participation: ${rideDetail.viewerParticipation ? 'Joined' : 'Not joined'}`);
    
    if (rideDetail.viewerParticipation) {
      console.log(`   Participation ID: ${rideDetail.viewerParticipation.participationId}`);
      console.log(`   Role: ${rideDetail.viewerParticipation.role}`);
    }
    console.log();

    // Step 3: Test join/leave based on current state
    if (rideDetail.viewerParticipation) {
      // Already joined - test leave
      console.log('3️⃣ Testing LEAVE ride...');
      const leaveRes = await apiRequest('DELETE', `/v1/participations/${rideDetail.viewerParticipation.participationId}`);
      
      if (leaveRes.data.success) {
        console.log('✅ Successfully left ride');
        
        // Verify participant count decreased
        const verifyRes = await apiRequest('GET', `/v1/clubs/${clubId}/rides/${rideId}`);
        if (verifyRes.data.success) {
          const newCount = verifyRes.data.data.currentParticipants;
          console.log(`   Participant count: ${rideDetail.currentParticipants} → ${newCount}`);
          console.log(`   Viewer participation: ${verifyRes.data.data.viewerParticipation ? 'Still joined' : 'Left'}`);
        }
      } else {
        console.error(`❌ Failed to leave ride: ${leaveRes.data.error || 'Unknown error'}`);
      }
    } else {
      // Not joined - test join
      console.log('3️⃣ Testing JOIN ride...');
      const joinRes = await apiRequest('POST', `/v1/clubs/${clubId}/rides/${rideId}/participants`, {});
      
      if (joinRes.data.success) {
        console.log('✅ Successfully joined ride');
        console.log(`   Participation ID: ${joinRes.data.data.participationId}`);
        
        // Verify participant count increased
        const verifyRes = await apiRequest('GET', `/v1/clubs/${clubId}/rides/${rideId}`);
        if (verifyRes.data.success) {
          const newCount = verifyRes.data.data.currentParticipants;
          console.log(`   Participant count: ${rideDetail.currentParticipants} → ${newCount}`);
          console.log(`   Viewer participation: ${verifyRes.data.data.viewerParticipation ? 'Joined' : 'Not joined'}`);
        }
      } else {
        console.error(`❌ Failed to join ride: ${joinRes.data.error || 'Unknown error'}`);
      }
    }

    console.log('\n✅ All tests completed!');
    console.log('\n📝 Frontend URL:');
    console.log(`   http://localhost:3000/clubs/${clubId}/rides/${rideId}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
