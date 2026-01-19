/**
 * Test API Response Format
 * 
 * Quick test to see what format the API is returning
 */

const API_URL = 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development';

async function testGetUserClubs() {
  console.log('\n🧪 Testing GET /v1/users/me/clubs response format\n');
  
  // You need to provide your token
  const token = process.argv[2];
  
  if (!token) {
    console.log('❌ No token provided');
    console.log('\nUsage:');
    console.log('1. Open http://localhost:3000 in browser');
    console.log('2. Login as testuser2@test.com');
    console.log('3. Open browser console and run: localStorage.getItem("idToken")');
    console.log('4. Copy the token and run:');
    console.log('   node scripts/test-api-response-format.js YOUR_TOKEN\n');
    return;
  }
  
  try {
    console.log('📡 Making request to:', `${API_URL}/v1/users/me/clubs`);
    console.log('🔑 Using token:', token.substring(0, 20) + '...\n');
    
    const response = await fetch(`${API_URL}/v1/users/me/clubs`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:');
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });
    
    const rawText = await response.text();
    console.log('\n📦 Raw Response Body:');
    console.log(rawText);
    
    console.log('\n🔍 Parsing JSON...');
    const data = JSON.parse(rawText);
    
    console.log('\n📊 Parsed Response Structure:');
    console.log('   typeof data:', typeof data);
    console.log('   data.success:', data.success);
    console.log('   typeof data.data:', typeof data.data);
    console.log('   Array.isArray(data.data):', Array.isArray(data.data));
    
    if (data.data && typeof data.data === 'object') {
      console.log('   data.data keys:', Object.keys(data.data));
      
      if ('data' in data.data) {
        console.log('   ⚠️  DOUBLE WRAPPING DETECTED!');
        console.log('   typeof data.data.data:', typeof data.data.data);
        console.log('   Array.isArray(data.data.data):', Array.isArray(data.data.data));
        
        if (Array.isArray(data.data.data)) {
          console.log('   ✅ data.data.data is an array with', data.data.data.length, 'items');
          console.log('\n📋 First club:');
          console.log(JSON.stringify(data.data.data[0], null, 2));
        }
      } else if (Array.isArray(data.data)) {
        console.log('   ✅ data.data is an array with', data.data.length, 'items');
        console.log('\n📋 First club:');
        console.log(JSON.stringify(data.data[0], null, 2));
      }
    }
    
    console.log('\n✅ Test complete!');
    console.log('\n📝 Summary:');
    if (data.data && 'data' in data.data) {
      console.log('   ❌ Response is DOUBLE-WRAPPED');
      console.log('   Frontend should use: response.data.data');
    } else if (Array.isArray(data.data)) {
      console.log('   ✅ Response is SINGLE-WRAPPED');
      console.log('   Frontend should use: response.data');
    } else {
      console.log('   ⚠️  Unexpected response format');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  }
}

testGetUserClubs();
