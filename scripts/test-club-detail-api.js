#!/usr/bin/env node

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
  console.log('\n🔍 Testing Club Detail API Response\n');

  try {
    const token = await getAliceToken();
    console.log('✅ Got Alice token\n');

    // Test club detail endpoint
    console.log(`📋 GET /v1/clubs/${CLUB_ID}`);
    console.log('─────────────────────────────────────────────────────────────');
    const response = await fetch(`${API_URL}/v1/clubs/${CLUB_ID}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    
    // Check for userMembership field
    if (data.success && data.data) {
      console.log('📊 Analysis:');
      console.log(`   Has userMembership field: ${!!data.data.userMembership}`);
      if (data.data.userMembership) {
        console.log(`   Role: ${data.data.userMembership.role}`);
        console.log(`   Status: ${data.data.userMembership.status}`);
      } else {
        console.log('   ❌ userMembership field is missing!');
        console.log('   This is why the management buttons don\'t show.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main();
