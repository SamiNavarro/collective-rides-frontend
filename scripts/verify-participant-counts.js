#!/usr/bin/env node

/**
 * Verify Participant Counts
 * 
 * Checks that participant counts match between database and API responses
 */

const https = require('https');

const API_BASE_URL = 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';

// Test user token (from test-tokens.env)
const TOKEN = process.env.MEMBER_TOKEN || process.env.ADMIN_TOKEN || '';

if (!TOKEN) {
  console.error('❌ Error: MEMBER_TOKEN or ADMIN_TOKEN environment variable not set');
  console.log('\nRun: source backend/test-tokens.env');
  process.exit(1);
}

function makeRequest(path, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function verifyParticipantCounts() {
  console.log('\n=== Verifying Participant Counts ===\n');
  
  // Get all rides
  console.log('1. Fetching rides from API...');
  const ridesResponse = await makeRequest('/v1/rides', TOKEN);
  
  if (ridesResponse.status !== 200) {
    console.error('❌ Failed to fetch rides:', ridesResponse.status);
    return;
  }
  
  const rides = ridesResponse.data.data.rides;
  console.log(`   Found ${rides.length} rides\n`);
  
  // Check each ride
  console.log('2. Checking participant counts...\n');
  
  for (const ride of rides) {
    console.log(`Ride: ${ride.title}`);
    console.log(`  Club: ${ride.clubId}`);
    console.log(`  Participants: ${ride.currentParticipants} / ${ride.maxParticipants}`);
    
    // Get full ride details
    const detailResponse = await makeRequest(
      `/v1/clubs/${ride.clubId}/rides/${ride.rideId}`,
      TOKEN
    );
    
    if (detailResponse.status === 200) {
      const detail = detailResponse.data.data;
      const actualCount = detail.participants ? detail.participants.length : 0;
      
      console.log(`  Actual participants in list: ${actualCount}`);
      
      if (ride.currentParticipants === actualCount) {
        console.log(`  ✅ Count matches!\n`);
      } else {
        console.log(`  ❌ MISMATCH! Listed: ${ride.currentParticipants}, Actual: ${actualCount}\n`);
      }
    } else {
      console.log(`  ⚠️  Could not fetch details (status ${detailResponse.status})\n`);
    }
  }
  
  console.log('========================================');
  console.log('Verification Complete');
  console.log('========================================\n');
}

verifyParticipantCounts().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
