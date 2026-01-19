#!/usr/bin/env node

/**
 * Test Script: Phase 3.2.3 - Pending Applications API
 * 
 * Tests the backend API to verify pending applications are returned correctly
 * 
 * Test User: testuser2@test.com / TestPassword123!
 */

const https = require('https');

const API_BASE_URL = process.env.API_URL || 'https://api.sydneycycles.cc';
const TEST_EMAIL = 'testuser2@test.com';
const TEST_PASSWORD = 'TestPassword123!';

async function makeRequest(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

async function testPendingApplicationsAPI() {
  console.log('🧪 Testing Phase 3.2.3: Pending Applications API\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);
  
  try {
    // Step 1: Login to get token
    console.log('📝 Step 1: Login with testuser2');
    const loginResponse = await makeRequest('POST', '/v1/auth/login', null, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    
    if (loginResponse.status !== 200) {
      console.log('   ❌ Login failed:', loginResponse.status, loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data?.idToken || loginResponse.data.idToken;
    if (!token) {
      console.log('   ❌ No token received from login');
      return;
    }
    
    console.log('   ✅ Login successful');
    
    // Step 2: Get all clubs (no status filter)
    console.log('\n📝 Step 2: Get all user clubs (no filter)');
    const allClubsResponse = await makeRequest('GET', '/v1/users/me/clubs', token);
    
    if (allClubsResponse.status === 200) {
      const clubs = allClubsResponse.data.data || [];
      console.log(`   ✅ Received ${clubs.length} clubs`);
      clubs.forEach(club => {
        console.log(`      - ${club.clubName} (${club.membershipStatus})`);
      });
    } else {
      console.log('   ❌ Failed to get clubs:', allClubsResponse.status);
    }
    
    // Step 3: Get active clubs only
    console.log('\n📝 Step 3: Get active clubs only');
    const activeClubsResponse = await makeRequest('GET', '/v1/users/me/clubs?status=active', token);
    
    if (activeClubsResponse.status === 200) {
      const clubs = activeClubsResponse.data.data || [];
      console.log(`   ✅ Received ${clubs.length} active clubs`);
      clubs.forEach(club => {
        console.log(`      - ${club.clubName} (${club.membershipStatus})`);
      });
    } else {
      console.log('   ❌ Failed to get active clubs:', activeClubsResponse.status);
    }
    
    // Step 4: Get pending clubs only
    console.log('\n📝 Step 4: Get pending clubs only');
    const pendingClubsResponse = await makeRequest('GET', '/v1/users/me/clubs?status=pending', token);
    
    if (pendingClubsResponse.status === 200) {
      const clubs = pendingClubsResponse.data.data || [];
      console.log(`   ✅ Received ${clubs.length} pending clubs`);
      
      if (clubs.length > 0) {
        console.log('   🎉 PENDING APPLICATIONS FOUND:');
        clubs.forEach(club => {
          console.log(`      - ${club.clubName}`);
          console.log(`        Club ID: ${club.clubId}`);
          console.log(`        Status: ${club.membershipStatus}`);
          console.log(`        Applied: ${club.joinedAt}`);
        });
      } else {
        console.log('   ⚠️  No pending applications found');
        console.log('   💡 This might mean:');
        console.log('      1. The application was already approved');
        console.log('      2. The application was rejected');
        console.log('      3. The application wasn\'t created successfully');
      }
    } else {
      console.log('   ❌ Failed to get pending clubs:', pendingClubsResponse.status);
      console.log('   Response:', JSON.stringify(pendingClubsResponse.data, null, 2));
    }
    
    // Step 5: Check if Pastries.cc exists in any status
    console.log('\n📝 Step 5: Search for Pastries.cc membership');
    const allClubs = allClubsResponse.data.data || [];
    const pastriesClub = allClubs.find(c => c.clubName.includes('Pastries'));
    
    if (pastriesClub) {
      console.log('   ✅ Found Pastries.cc membership:');
      console.log(`      Status: ${pastriesClub.membershipStatus}`);
      console.log(`      Role: ${pastriesClub.membershipRole}`);
      console.log(`      Joined: ${pastriesClub.joinedAt}`);
    } else {
      console.log('   ⚠️  No Pastries.cc membership found');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));
    console.log(`Total clubs: ${allClubs.length}`);
    console.log(`Active clubs: ${(activeClubsResponse.data.data || []).length}`);
    console.log(`Pending applications: ${(pendingClubsResponse.data.data || []).length}`);
    
    if ((pendingClubsResponse.data.data || []).length > 0) {
      console.log('\n✅ Phase 3.2.3: Pending applications API is working!');
    } else {
      console.log('\n⚠️  Phase 3.2.3: No pending applications found');
      console.log('   Check if the application was created successfully');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    throw error;
  }
}

// Run test
testPendingApplicationsAPI()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
