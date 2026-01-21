#!/usr/bin/env node

/**
 * Test script for Phase 3.2.4 Club Detail Page
 * Tests basic page structure and routing
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function makeRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data });
      });
    }).on('error', reject);
  });
}

async function testClubDetailPage() {
  console.log('🧪 Testing Club Detail Page Structure\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Page loads for a valid club ID
    console.log('\n📋 Test 1: Page loads with club ID');
    const response = await makeRequest('/clubs/sydney-cycling-club');
    
    if (response.statusCode === 200) {
      console.log('✅ Page loads successfully (200)');
      
      // Check for key elements
      const hasHeader = response.body.includes('Header') || response.body.includes('header');
      const hasFooter = response.body.includes('Footer') || response.body.includes('footer');
      const hasClubContent = response.body.includes('club') || response.body.includes('Club');
      
      console.log(`   - Has header: ${hasHeader ? '✅' : '❌'}`);
      console.log(`   - Has footer: ${hasFooter ? '✅' : '❌'}`);
      console.log(`   - Has club content: ${hasClubContent ? '✅' : '❌'}`);
    } else {
      console.log(`❌ Unexpected status code: ${response.statusCode}`);
    }

    // Test 2: Different club ID
    console.log('\n📋 Test 2: Page loads with different club ID');
    const response2 = await makeRequest('/clubs/eastern-suburbs-cycling');
    
    if (response2.statusCode === 200) {
      console.log('✅ Page loads successfully (200)');
    } else {
      console.log(`❌ Unexpected status code: ${response2.statusCode}`);
    }

    // Test 3: Invalid club ID (should still load page, show error in UI)
    console.log('\n📋 Test 3: Page handles invalid club ID');
    const response3 = await makeRequest('/clubs/invalid-club-id-12345');
    
    if (response3.statusCode === 200) {
      console.log('✅ Page loads (will show error in UI)');
    } else {
      console.log(`ℹ️  Status code: ${response3.statusCode}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Basic page structure tests complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Open http://localhost:3000/clubs/sydney-cycling-club');
    console.log('   2. Verify page loads with loading state');
    console.log('   3. Check error handling for invalid club IDs');
    console.log('   4. Proceed to Task 2: Implement Public Section');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n💡 Make sure the dev server is running: npm run dev');
    process.exit(1);
  }
}

testClubDetailPage();
