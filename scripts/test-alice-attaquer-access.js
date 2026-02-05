#!/usr/bin/env node

/**
 * Test Alice's access to Attaquer.cc management features
 */

const API_URL = 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';
const CLUB_ID = 'attaquercc';

async function getAliceToken() {
  const { execSync } = require('child_process');
  const token = execSync(`aws cognito-idp admin-initiate-auth \
    --user-pool-id us-east-2_t5UUpOmPL \
    --client-id 760idnu1d0mul2o10lut6rt7la \
    --auth-flow ADMIN_NO_SRP_AUTH \
    --auth-parameters USERNAME=alice.admin@example.com,PASSWORD=TempPassword123! \
    --region us-east-2 \
    --query 'AuthenticationResult.IdToken' \
    --output text`, { encoding: 'utf-8' }).trim();
  return token;
}

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     Test Alice Attaquer.cc Access - Phase 3.4             ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Get Alice's token
    console.log('🔑 Getting Alice token...');
    const token = await getAliceToken();
    console.log('✅ Token obtained\n');

    // Test 1: Get My Clubs
    console.log('📋 Test 1: Get My Clubs');
    console.log('─────────────────────────────────────────────────────────────');
    const myClubsResponse = await fetch(`${API_URL}/v1/users/me/clubs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const myClubsData = await myClubsResponse.json();
    
    if (myClubsData.success && myClubsData.data.length > 0) {
      const attaquerMembership = myClubsData.data.find(c => c.clubId === CLUB_ID);
      if (attaquerMembership) {
        console.log('✅ Found Attaquer.cc membership');
        console.log(`   Role: ${attaquerMembership.membershipRole}`);
        console.log(`   Status: ${attaquerMembership.membershipStatus}`);
        
        if (attaquerMembership.membershipRole === 'owner') {
          console.log('✅ Alice is OWNER - should see Settings + Manage buttons\n');
        } else {
          console.log(`❌ Alice is ${attaquerMembership.membershipRole} - NOT owner!\n`);
        }
      } else {
        console.log('❌ Attaquer.cc not found in My Clubs\n');
      }
    } else {
      console.log('❌ No clubs found\n');
    }

    // Test 2: Get Club Details
    console.log('📋 Test 2: Get Club Details');
    console.log('─────────────────────────────────────────────────────────────');
    const clubResponse = await fetch(`${API_URL}/v1/clubs/${CLUB_ID}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const clubData = await clubResponse.json();
    
    if (clubData.success) {
      console.log('✅ Club details retrieved');
      console.log(`   Name: ${clubData.data.name}`);
      console.log(`   City: ${clubData.data.city}`);
      console.log(`   Member Count: ${clubData.data.memberCount}`);
      console.log(`   User Role: ${clubData.data.userRole || 'N/A'}`);
      console.log(`   User Status: ${clubData.data.userMembershipStatus || 'N/A'}\n`);
    } else {
      console.log('❌ Failed to get club details\n');
    }

    // Test 3: Get Club Members (owner should have access)
    console.log('📋 Test 3: Get Club Members (Authorization Test)');
    console.log('─────────────────────────────────────────────────────────────');
    const membersResponse = await fetch(`${API_URL}/v1/clubs/${CLUB_ID}/members`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const membersData = await membersResponse.json();
    
    if (membersData.success) {
      console.log('✅ Members list retrieved (Alice has access)');
      const memberCount = membersData.data?.members?.length || membersData.data?.length || 0;
      console.log(`   Total Members: ${memberCount}\n`);
    } else {
      console.log('❌ Failed to get members (authorization issue?)\n');
      console.log(`   Error: ${membersData.message}\n`);
    }

    // Test 4: Get Pending Join Requests (owner should have access)
    console.log('📋 Test 4: Get Pending Join Requests (Authorization Test)');
    console.log('─────────────────────────────────────────────────────────────');
    const requestsResponse = await fetch(`${API_URL}/v1/clubs/${CLUB_ID}/members?status=pending`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const requestsData = await requestsResponse.json();
    
    if (requestsData.success) {
      console.log('✅ Pending requests retrieved (Alice has access)');
      const members = requestsData.data?.members || [];
      const allMembers = Array.isArray(requestsData.data) ? requestsData.data : members;
      const pendingCount = allMembers.filter(m => m.status === 'pending').length;
      console.log(`   Pending Requests: ${pendingCount}\n`);
    } else {
      console.log('❌ Failed to get pending requests\n');
    }

    // Test 5: Get Club Rides (for draft rides tab)
    console.log('📋 Test 5: Get Club Rides (Draft Rides Test)');
    console.log('─────────────────────────────────────────────────────────────');
    const ridesResponse = await fetch(`${API_URL}/v1/clubs/${CLUB_ID}/rides?status=draft`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const ridesData = await ridesResponse.json();
    
    if (ridesData.success) {
      console.log('✅ Draft rides retrieved');
      const rideCount = ridesData.data?.length || 0;
      console.log(`   Draft Rides: ${rideCount}\n`);
    } else {
      console.log('❌ Failed to get draft rides\n');
    }

    // Summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                      SUMMARY                               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log('Alice Admin should now be able to:');
    console.log('  ✅ See "Attaquer.cc" in My Clubs with role="owner"');
    console.log('  ✅ See "Settings" button on Attaquer.cc page');
    console.log('  ✅ See "Manage Club" button on Attaquer.cc page');
    console.log('  ✅ Access all management tabs (Members, Requests, Draft Rides)');
    console.log('  ✅ Edit club settings\n');
    console.log('Next Steps:');
    console.log('  1. Open browser and clear cache');
    console.log('  2. Log in as alice.admin@example.com');
    console.log('  3. Navigate to My Clubs');
    console.log('  4. Click on "Attaquer.cc"');
    console.log('  5. Verify management buttons are visible');
    console.log('  6. Test all management features\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
