#!/usr/bin/env node

/**
 * List rides for Attaquer club
 */

const https = require('https');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const CLUB_ID = 'attaquercc';

// Test user tokens from test-tokens.env
const CAPTAIN_TOKEN = process.env.CAPTAIN_TOKEN;

async function makeRequest(endpoint, method = 'GET', token) {
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
    req.end();
  });
}

(async () => {
  try {
    console.log('\n=== Attaquer Rides ===\n');
    
    const response = await makeRequest(
      `/v1/clubs/${CLUB_ID}/rides?status=published&limit=20`,
      'GET',
      CAPTAIN_TOKEN
    );
    
    if (response.status === 200 && response.data.data) {
      const rides = response.data.data.data || response.data.data;
      console.log(`Found ${rides.length} rides:\n`);
      
      rides.forEach((ride, i) => {
        console.log(`${i + 1}. ${ride.title}`);
        console.log(`   ID: ${ride.rideId}`);
        console.log(`   Date: ${ride.startDateTime}`);
        console.log(`   Participants: ${ride.currentParticipants}/${ride.maxParticipants}`);
        console.log('');
      });
    } else {
      console.log('Error:', response.data);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
