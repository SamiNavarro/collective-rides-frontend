#!/usr/bin/env node

/**
 * Test Restored /clubs Page
 */

const http = require('http');

console.log('🧪 Testing Restored /clubs Page');
console.log('===============================');

async function testClubsPage() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/clubs',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          body: data,
          success: res.statusCode === 200
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        status: 0,
        error: error.message,
        success: false
      });
    });

    req.end();
  });
}

async function runTest() {
  console.log('Testing /clubs page...\n');
  
  const result = await testClubsPage();
  
  if (result.success) {
    console.log('✅ /clubs page is working!');
    console.log(`📊 Status: ${result.status}`);
    
    // Check if the page contains expected content
    const hasTitle = result.body.includes('Sydney Cycling Clubs');
    const hasClubs = result.body.includes('Sydney Cycling Club');
    const hasJoinSection = result.body.includes('How to Join a Cycling Club');
    
    console.log('\n📋 Content Check:');
    console.log(`✅ Page Title: ${hasTitle ? 'Found' : 'Missing'}`);
    console.log(`✅ Club Content: ${hasClubs ? 'Found' : 'Missing'}`);
    console.log(`✅ Join Instructions: ${hasJoinSection ? 'Found' : 'Missing'}`);
    
    if (hasTitle && hasClubs && hasJoinSection) {
      console.log('\n🎉 Perfect! The /clubs page has been fully restored.');
      console.log('🌐 Visit: http://localhost:3000/clubs');
    } else {
      console.log('\n⚠️  Page loads but some content may be missing.');
    }
  } else {
    console.log(`❌ /clubs page failed: ${result.error || result.status}`);
  }
}

runTest().catch(console.error);