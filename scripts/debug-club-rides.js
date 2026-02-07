#!/usr/bin/env node

/**
 * Debug script to check club rides
 * Tests the list rides endpoint for a specific club
 */

const https = require('https');

const API_URL = 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';
const CLUB_ID = 'attaquercc'; // Attaquer Cycling Club

// Get token from command line or use Alice's token
const TOKEN = process.argv[2] || process.env.ALICE_TOKEN;

if (!TOKEN) {
  console.error('❌ No token provided');
  console.log('Usage: node scripts/debug-club-rides.js <JWT_TOKEN>');
  console.log('Or set ALICE_TOKEN environment variable');
  process.exit(1);
}

async function makeRequest(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    console.log(`\n🔍 ${method} ${url.pathname}${url.search}`);

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function main() {
  console.log('🚀 Debugging Club Rides');
  console.log('='.repeat(50));
  
  try {
    // 1. List all rides for the club
    console.log('\n1️⃣ Listing all rides for club:', CLUB_ID);
    const allRides = await makeRequest(`/v1/clubs/${CLUB_ID}/rides`);
    console.log('Response:', JSON.stringify(allRides.data, null, 2));
    
    if (allRides.data && allRides.data.data) {
      const rides = Array.isArray(allRides.data.data) ? allRides.data.data : allRides.data;
      console.log(`\n✅ Found ${rides.length} rides`);
      
      if (rides.length > 0) {
        console.log('\n📋 Ride Details:');
        rides.forEach((ride, index) => {
          console.log(`\n  Ride ${index + 1}:`);
          console.log(`    ID: ${ride.rideId || ride.id}`);
          console.log(`    Title: ${ride.title}`);
          console.log(`    Status: ${ride.status}`);
          console.log(`    Start: ${ride.startDateTime || ride.startTime}`);
          console.log(`    Participants: ${ride.participantCount || 0}`);
        });
      }
    }
    
    // 2. List published rides only
    console.log('\n\n2️⃣ Listing published rides only');
    const publishedRides = await makeRequest(`/v1/clubs/${CLUB_ID}/rides?status=published`);
    console.log('Response:', JSON.stringify(publishedRides.data, null, 2));
    
    // 3. List draft rides only
    console.log('\n\n3️⃣ Listing draft rides only');
    const draftRides = await makeRequest(`/v1/clubs/${CLUB_ID}/rides?status=draft`);
    console.log('Response:', JSON.stringify(draftRides.data, null, 2));
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Debug complete');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
