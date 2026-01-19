/**
 * Join Club Test Script
 * 
 * Helps testuser2 join a club for testing
 */

const API_URL = 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';

async function listClubs() {
  console.log('\n📋 Fetching available clubs...\n');
  
  try {
    const response = await fetch(`${API_URL}/v1/clubs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      const clubs = Array.isArray(data.data) ? data.data : [];
      console.log(`\n✅ Found ${clubs.length} clubs:\n`);
      clubs.forEach((club, index) => {
        console.log(`${index + 1}. ${club.name} (${club.id})`);
        console.log(`   Location: ${club.city || 'N/A'}`);
        console.log(`   Status: ${club.status}`);
        console.log('');
      });
      return clubs;
    } else {
      console.log('❌ No clubs found or unexpected response format');
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching clubs:', error.message);
    return [];
  }
}

async function joinClub(token, clubId) {
  console.log(`\n🚀 Joining club: ${clubId}...\n`);
  
  try {
    const response = await fetch(`${API_URL}/v1/clubs/${clubId}/members`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify({
        message: 'Test join from script'
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Successfully joined club!');
      console.log('   Status: Pending approval');
      return true;
    } else {
      console.log('\n❌ Failed to join club');
      return false;
    }
  } catch (error) {
    console.error('\n❌ Error joining club:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Join Club Test Script');
  console.log('========================\n');
  
  // Step 1: List available clubs
  const clubs = await listClubs();
  
  if (clubs.length === 0) {
    console.log('\n⚠️  No clubs available to join.');
    console.log('You may need to seed clubs first using:');
    console.log('   cd backend && ./scripts/seed-clubs-direct.sh');
    return;
  }
  
  // Step 2: Get token from command line
  const token = process.argv[2];
  const clubIndex = parseInt(process.argv[3]) || 0;
  
  if (!token) {
    console.log('\n📝 To join a club, run:');
    console.log('   node scripts/join-club-test.js YOUR_TOKEN [CLUB_INDEX]');
    console.log('\nTo get your token:');
    console.log('   1. Open http://localhost:3000');
    console.log('   2. Login as testuser2@test.com');
    console.log('   3. Open browser console');
    console.log('   4. Run: localStorage.getItem("idToken")');
    console.log('   5. Copy the token\n');
    console.log(`Example: node scripts/join-club-test.js YOUR_TOKEN 0`);
    console.log(`         (0 = first club, 1 = second club, etc.)\n`);
    return;
  }
  
  // Step 3: Join the selected club
  if (clubIndex >= clubs.length) {
    console.log(`\n❌ Invalid club index: ${clubIndex}`);
    console.log(`   Available clubs: 0-${clubs.length - 1}`);
    return;
  }
  
  const clubToJoin = clubs[clubIndex];
  console.log(`\n📍 Selected club: ${clubToJoin.name} (${clubToJoin.id})`);
  
  const success = await joinClub(token, clubToJoin.id);
  
  if (success) {
    console.log('\n🎉 Success! Now you can:');
    console.log('   1. Go to http://localhost:3000/my-clubs');
    console.log('   2. See the club with "Pending Approval" badge');
    console.log('   3. Test the "Leave Club" functionality');
  }
}

main().catch(console.error);
