#!/usr/bin/env node

/**
 * Create test rides for Pastries.cc (cpcc)
 * 
 * This script creates rides using your current browser session.
 * Make sure you're logged in to localhost:3000 as a captain of cpcc.
 */

const https = require('https');
const readline = require('readline');

const API_URL = 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';
const CLUB_ID = 'cpcc';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

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

function getNextThursday() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
  const thursday = new Date(now);
  thursday.setDate(now.getDate() + daysUntilThursday);
  thursday.setHours(6, 0, 0, 0);
  return thursday.toISOString();
}

function getNextSaturday() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  const saturday = new Date(now);
  saturday.setDate(now.getDate() + daysUntilSaturday);
  saturday.setHours(7, 0, 0, 0);
  return saturday.toISOString();
}

const rides = [
  {
    title: "CP Thursday",
    description: "Classic Thursday morning ride through Centennial Park. Fast-paced social ride with coffee stop at the end. All levels welcome but expect a brisk pace!",
    rideType: "social",
    difficulty: "intermediate",
    startDateTime: getNextThursday(),
    estimatedDuration: 5400,
    maxParticipants: 25,
    meetingPoint: {
      name: "Centennial Park - Grand Drive Gate",
      address: "Grand Dr, Centennial Park NSW 2021",
      coordinates: {
        latitude: -33.8968,
        longitude: 151.2290
      },
      instructions: "Meet at the main Grand Drive entrance. We roll out promptly at 6am!"
    },
    route: {
      name: "Centennial Park Loops",
      type: "basic",
      distance: 30000,
      difficulty: "intermediate"
    },
    requirements: {
      equipment: ["Road bike", "Helmet", "Front and rear lights"],
      experience: "Comfortable riding in a group",
      fitness: "Moderate fitness - we maintain 28-32km/h average"
    },
    isPublic: false,
    allowWaitlist: true
  },
  {
    title: "Royal National Park",
    description: "Epic ride through the stunning Royal National Park. Challenging climbs with breathtaking coastal views. This is a proper workout - bring plenty of water and nutrition!",
    rideType: "training",
    difficulty: "advanced",
    startDateTime: getNextSaturday(),
    estimatedDuration: 12600,
    maxParticipants: 20,
    meetingPoint: {
      name: "Loftus Oval",
      address: "Loftus Ave, Loftus NSW 2232",
      coordinates: {
        latitude: -34.0450,
        longitude: 151.0500
      },
      instructions: "Meet at the car park. We'll do a quick bike check before rolling out."
    },
    route: {
      name: "Royal National Park Loop",
      type: "basic",
      distance: 75000,
      difficulty: "advanced"
    },
    requirements: {
      equipment: ["Road bike", "Helmet", "2+ water bottles", "Spare tubes", "Pump", "Nutrition"],
      experience: "Experienced with long rides and climbing",
      fitness: "High fitness level - 75km with significant elevation"
    },
    isPublic: false,
    allowWaitlist: true
  }
];

async function createRides() {
  console.log('\n=== Create Pastries.cc Rides ===\n');
  console.log('This script will create test rides for Pastries.cc (cpcc).\n');
  console.log('To get your token:');
  console.log('1. Open http://localhost:3000 in your browser');
  console.log('2. Make sure you\'re logged in as a captain of cpcc');
  console.log('3. Open Developer Tools (F12)');
  console.log('4. Go to Console tab');
  console.log('5. Type: JSON.parse(localStorage.getItem(\'cognito_tokens\')).idToken');
  console.log('6. Copy the token (without quotes)\n');
  
  const token = await question('Paste your ID token here: ');
  
  if (!token || token.length < 100) {
    console.error('\n❌ Invalid token. Please try again.');
    rl.close();
    return;
  }
  
  console.log('\n✅ Token received\n');
  console.log('========================================');
  console.log('Creating Rides');
  console.log('========================================\n');
  
  for (let i = 0; i < rides.length; i++) {
    const ride = rides[i];
    console.log(`${i + 1}. Creating '${ride.title}'...`);
    
    try {
      // Create ride
      const createResponse = await makeRequest(
        `/v1/clubs/${CLUB_ID}/rides`,
        'POST',
        token,
        ride
      );
      
      if (createResponse.status === 200 || createResponse.status === 201) {
        const rideId = createResponse.data.data?.rideId;
        console.log(`   ✅ Created: ${rideId}`);
        
        // Publish ride
        console.log('   📢 Publishing...');
        const publishResponse = await makeRequest(
          `/v1/clubs/${CLUB_ID}/rides/${rideId}/publish`,
          'PUT',
          token,
          {}
        );
        
        if (publishResponse.status === 200) {
          console.log('   ✅ Published');
        } else {
          console.log(`   ⚠️  Publish failed: ${publishResponse.status}`);
        }
      } else {
        console.log(`   ❌ Failed: ${createResponse.status}`);
        console.log('   Error:', createResponse.data);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('========================================');
  console.log('✅ Done!');
  console.log('========================================\n');
  console.log('Created rides:');
  console.log('  1. CP Thursday (next Thursday 6am, intermediate, 30km)');
  console.log('  2. Royal National Park (next Saturday 7am, advanced, 75km)\n');
  console.log('Next steps:');
  console.log('  1. Navigate to http://localhost:3000/rides');
  console.log('  2. Click on a ride to test join/leave functionality');
  console.log('  3. Verify the leave ride fix is working\n');
  
  rl.close();
}

createRides().catch(error => {
  console.error('\n❌ Error:', error.message);
  rl.close();
  process.exit(1);
});
