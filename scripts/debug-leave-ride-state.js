#!/usr/bin/env node

/**
 * Debug script to check ride participation state
 * Helps diagnose leave ride issues
 */

const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CLUB_ID = 'attaquercc';

// Test user tokens from test-tokens.env
const CAPTAIN_TOKEN = process.env.CAPTAIN_TOKEN;

async function makeRequest(endpoint, method = 'GET', token, body = null) {
  const url = new URL(endpoint, API_URL);
  
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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

async function debugRideState(rideId) {
  console.log('\n=== Debugging Ride State ===\n');
  console.log(`Ride ID: ${rideId}`);
  console.log(`Club ID: ${CLUB_ID}\n`);

  // Get ride details
  console.log('1. Fetching ride details...');
  const rideResponse = await makeRequest(
    `/v1/clubs/${CLUB_ID}/rides/${rideId}`,
    'GET',
    CAPTAIN_TOKEN
  );

  console.log(`Status: ${rideResponse.status}`);
  
  if (rideResponse.status === 200) {
    const ride = rideResponse.data.data;
    console.log('\nRide Details:');
    console.log(`- Title: ${ride.title}`);
    console.log(`- Current Participants: ${ride.currentParticipants}`);
    console.log(`- Max Participants: ${ride.maxParticipants}`);
    console.log(`- Status: ${ride.status}`);
    
    console.log('\nViewer Participation:');
    if (ride.viewerParticipation) {
      console.log(`- Participation ID: ${ride.viewerParticipation.participationId}`);
      console.log(`- Role: ${ride.viewerParticipation.role}`);
      console.log(`- Status: ${ride.viewerParticipation.status}`);
      console.log(`- Joined At: ${ride.viewerParticipation.joinedAt}`);
    } else {
      console.log('- Not participating');
    }
    
    console.log('\nParticipants:');
    if (ride.participants && ride.participants.length > 0) {
      ride.participants.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.displayName} (${p.role}) - ${p.status}`);
      });
    } else {
      console.log('  No participants');
    }
    
    console.log('\nWaitlist:');
    if (ride.waitlist && ride.waitlist.length > 0) {
      ride.waitlist.forEach((w, i) => {
        console.log(`  ${i + 1}. ${w.displayName} - Position ${w.position}`);
      });
    } else {
      console.log('  No waitlist');
    }
  } else {
    console.log('Error:', rideResponse.data);
  }
}

async function testLeaveRide(rideId) {
  console.log('\n=== Testing Leave Ride ===\n');
  
  // First check current state
  await debugRideState(rideId);
  
  // Try to leave
  console.log('\n2. Attempting to leave ride...');
  const leaveResponse = await makeRequest(
    `/v1/clubs/${CLUB_ID}/rides/${rideId}/participants/me`,
    'DELETE',
    CAPTAIN_TOKEN
  );
  
  console.log(`Status: ${leaveResponse.status}`);
  console.log('Response:', JSON.stringify(leaveResponse.data, null, 2));
  
  // Check state after leaving
  console.log('\n3. Checking state after leave...');
  await debugRideState(rideId);
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];
const rideId = args[1];

if (!command || !rideId) {
  console.log('Usage:');
  console.log('  node scripts/debug-leave-ride-state.js check <rideId>');
  console.log('  node scripts/debug-leave-ride-state.js test <rideId>');
  process.exit(1);
}

if (!CAPTAIN_TOKEN) {
  console.error('Error: CAPTAIN_TOKEN not found in test-tokens.env');
  process.exit(1);
}

(async () => {
  try {
    if (command === 'check') {
      await debugRideState(rideId);
    } else if (command === 'test') {
      await testLeaveRide(rideId);
    } else {
      console.error('Unknown command:', command);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
