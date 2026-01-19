/**
 * Approve Membership Directly via API
 * 
 * This script approves a pending membership using the backend API
 * Requires admin/owner token for the club
 */

const API_URL = 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';

async function listPendingMembers(token, clubId) {
  console.log(`\n📋 Fetching pending members for club: ${clubId}...\n`);
  
  try {
    const response = await fetch(`${API_URL}/v1/clubs/${clubId}/members?status=pending`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      const members = Array.isArray(data.data) ? data.data : (data.data.members || []);
      console.log(`\n✅ Found ${members.length} pending members:\n`);
      members.forEach((member, index) => {
        console.log(`${index + 1}. ${member.userName || member.userId}`);
        console.log(`   User ID: ${member.userId}`);
        console.log(`   Status: ${member.status}`);
        console.log(`   Applied: ${member.joinedAt || 'N/A'}`);
        console.log('');
      });
      return members;
    } else {
      console.log('❌ No pending members found or unexpected response format');
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching members:', error.message);
    return [];
  }
}

async function approveMember(token, clubId, userId) {
  console.log(`\n✅ Approving member: ${userId} for club: ${clubId}...\n`);
  
  try {
    const response = await fetch(`${API_URL}/v1/clubs/${clubId}/members/${userId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      },
      body: JSON.stringify({
        action: 'approve'
      })
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Successfully approved member!');
      return true;
    } else {
      console.log('\n❌ Failed to approve member');
      console.log('   This might be because:');
      console.log('   - You are not an admin/owner of this club');
      console.log('   - The endpoint does not exist yet');
      console.log('   - The membership is already approved');
      return false;
    }
  } catch (error) {
    console.error('\n❌ Error approving member:', error.message);
    return false;
  }
}

async function main() {
  console.log('🧪 Approve Membership Script');
  console.log('============================\n');
  
  const token = process.argv[2];
  const clubId = process.argv[3];
  const userId = process.argv[4];
  
  if (!token || !clubId) {
    console.log('❌ Missing required arguments\n');
    console.log('Usage:');
    console.log('   node scripts/approve-membership-direct.js ADMIN_TOKEN CLUB_ID [USER_ID]\n');
    console.log('Steps:');
    console.log('   1. Login as a club admin/owner');
    console.log('   2. Get token: localStorage.getItem("idToken")');
    console.log('   3. Run: node scripts/approve-membership-direct.js TOKEN CLUB_ID\n');
    console.log('Example:');
    console.log('   node scripts/approve-membership-direct.js eyJhbG... pastriescc\n');
    console.log('Note: If the approve endpoint does not exist, we will need to');
    console.log('      manually update the database or create the endpoint.\n');
    return;
  }
  
  // List pending members
  const pendingMembers = await listPendingMembers(token, clubId);
  
  if (pendingMembers.length === 0) {
    console.log('\n⚠️  No pending members to approve.');
    return;
  }
  
  // If userId provided, approve that specific user
  if (userId) {
    await approveMember(token, clubId, userId);
  } else {
    console.log('\n📝 To approve a specific member, run:');
    console.log(`   node scripts/approve-membership-direct.js ${token.substring(0, 20)}... ${clubId} USER_ID\n`);
  }
}

main().catch(console.error);
