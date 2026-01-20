// Check what the My Clubs API is returning
// This will show us if clubs have 'removed' status

const API_URL = 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';

// You need to get a fresh token first
// Go to http://localhost:3000, open console, and run: localStorage.getItem('auth_token')
// Then paste it here:
const TOKEN = process.argv[2];

if (!TOKEN) {
  console.log('❌ Please provide auth token as argument');
  console.log('\n📝 How to get token:');
  console.log('   1. Go to http://localhost:3000');
  console.log('   2. Open browser console (F12)');
  console.log('   3. Run: localStorage.getItem("auth_token")');
  console.log('   4. Copy the token (without quotes)');
  console.log('   5. Run: node scripts/check-my-clubs-api.js YOUR_TOKEN');
  process.exit(1);
}

async function checkMyClubs() {
  console.log('🔍 Checking My Clubs API...');
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(`${API_URL}/v1/clubs/me`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`\n📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Error response:', error);
      return;
    }
    
    const data = await response.json();
    console.log('\n📦 Full Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && Array.isArray(data.data)) {
      console.log('\n📊 Clubs Summary:');
      console.log(`   Total clubs: ${data.data.length}`);
      
      // Group by status
      const byStatus = {
        active: [],
        pending: [],
        suspended: [],
        removed: []
      };
      
      data.data.forEach(club => {
        const status = club.membershipStatus || 'unknown';
        if (byStatus[status]) {
          byStatus[status].push(club);
        }
      });
      
      console.log(`   ✅ Active: ${byStatus.active.length}`);
      console.log(`   ⏳ Pending: ${byStatus.pending.length}`);
      console.log(`   ⏸️  Suspended: ${byStatus.suspended.length}`);
      console.log(`   🚫 Removed: ${byStatus.removed.length}`);
      
      if (byStatus.removed.length > 0) {
        console.log('\n🚫 Removed clubs:');
        byStatus.removed.forEach(club => {
          console.log(`   • ${club.clubName} (${club.clubId})`);
        });
      }
      
      if (byStatus.active.length > 0) {
        console.log('\n✅ Active clubs:');
        byStatus.active.forEach(club => {
          console.log(`   • ${club.clubName} (${club.clubId})`);
        });
      }
      
      if (byStatus.removed.length > 0 && byStatus.active.length === 0) {
        console.log('\n⚠️  ALL clubs are marked as removed!');
        console.log('   The filter is working correctly - that\'s why My Clubs is empty.');
        console.log('\n💡 To fix: Join clubs from the directory');
        console.log('   http://localhost:3000/clubs/directory');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkMyClubs();
