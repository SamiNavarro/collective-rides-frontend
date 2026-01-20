// Find clubs user is NOT a member of
// Uses the API to check membership status

const API_URL = 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';
const USER_ID = '512be5a0-f031-701c-787e-15a05bbb0ad1';

// Test user credentials
const TEST_EMAIL = 'testuser2@test.com';
const TEST_PASSWORD = 'TestPassword123!';

// All clubs in the system
const ALL_CLUBS = [
  { id: 'pastriescc', name: 'Pastries.cc' },
  { id: 'ratpackcc', name: 'Ratpack.cc' },
  { id: 'cpcc', name: 'CP.cc' },
  { id: 'functioncc', name: 'Function.cc' },
  { id: 'attaquercc', name: 'Attaquer.cc' },
  { id: 'pelocc', name: 'Pelo.cc' }
];

async function getAuthToken() {
  console.log('🔐 Getting auth token...');
  
  const response = await fetch(`${API_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    })
  });
  
  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data.accessToken;
}

async function getUserClubs(token) {
  console.log('📋 Fetching user clubs...');
  
  const response = await fetch(`${API_URL}/v1/clubs/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get user clubs: ${response.status}`);
  }
  
  const data = await response.json();
  return data.data || [];
}

async function main() {
  try {
    const token = await getAuthToken();
    const userClubs = await getUserClubs(token);
    
    console.log('\n📊 User Membership Status:');
    console.log('='.repeat(50));
    
    // Get club IDs user is a member of (excluding removed)
    const memberClubIds = userClubs
      .filter(club => club.membershipStatus !== 'removed')
      .map(club => club.id);
    
    console.log(`\n✅ Member of ${memberClubIds.length} clubs:`);
    userClubs
      .filter(club => club.membershipStatus !== 'removed')
      .forEach(club => {
        console.log(`   • ${club.name} (${club.id}) - Status: ${club.membershipStatus}`);
      });
    
    // Find clubs user is NOT a member of
    const availableClubs = ALL_CLUBS.filter(club => !memberClubIds.includes(club.id));
    
    console.log(`\n🎯 Available to join (${availableClubs.length} clubs):`);
    if (availableClubs.length > 0) {
      availableClubs.forEach(club => {
        console.log(`   • ${club.name} (${club.id})`);
      });
      
      console.log('\n💡 To test join club, use one of these club IDs:');
      console.log(`   ${availableClubs.map(c => c.id).join(', ')}`);
    } else {
      console.log('   None - user is a member of all clubs!');
      console.log('\n💡 To test join club:');
      console.log('   1. Leave a club first using the "Leave Club" button');
      console.log('   2. Then try joining it again');
    }
    
    // Check for removed clubs
    const removedClubs = userClubs.filter(club => club.membershipStatus === 'removed');
    if (removedClubs.length > 0) {
      console.log(`\n🚫 Removed memberships (${removedClubs.length}):`);
      removedClubs.forEach(club => {
        console.log(`   • ${club.name} (${club.id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
