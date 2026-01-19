#!/usr/bin/env node

/**
 * Test Navigation Updates - Phase 3.1
 * 
 * Verifies that header navigation and CTAs now point to /clubs/directory
 * instead of /clubs as the primary club discovery page.
 */

const https = require('https');

const BASE_URL = 'http://localhost:3000';

async function fetchPage(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const protocol = url.startsWith('https') ? https : require('http');
    
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function testNavigationUpdates() {
  console.log('🧪 Testing Navigation Updates - Phase 3.1');
  console.log('=' .repeat(50));
  
  const tests = [
    {
      name: 'Header Navigation - Desktop',
      path: '/',
      check: (body) => body.includes('href="/clubs/directory"') && body.includes('<span>Clubs</span>'),
      description: 'Desktop header should link to /clubs/directory'
    },
    {
      name: 'Header Navigation - Mobile',
      path: '/',
      check: (body) => body.includes('href="/clubs/directory"') && body.includes('onClick={closeMobileMenu}'),
      description: 'Mobile header should link to /clubs/directory'
    },
    {
      name: 'Clubs Landing Page CTA',
      path: '/clubs',
      check: (body) => body.includes('href="/clubs/directory"') && body.includes('Browse & Join Clubs'),
      description: 'Clubs page should have CTA pointing to /clubs/directory'
    },
    {
      name: 'Clubs Directory Accessibility',
      path: '/clubs/directory',
      check: (body) => body.includes('Club Directory') && body.includes('Apply to Join'),
      description: 'Clubs directory should be accessible and functional'
    },
    {
      name: 'My Clubs Page',
      path: '/my-clubs',
      check: (body) => body.includes('My Clubs') && !body.includes('Unknown Club'),
      description: 'My clubs page should load without "Unknown Club" issues'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      const result = await fetchPage(test.path);
      
      if (result.status !== 200) {
        console.log(`❌ FAIL: HTTP ${result.status} for ${test.path}`);
        failed++;
        continue;
      }
      
      if (test.check(result.body)) {
        console.log(`✅ PASS: ${test.description}`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${test.description}`);
        console.log(`   Expected content not found in ${test.path}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${test.name} - ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All navigation updates working correctly!');
    console.log('\n✅ Phase 3.1 Navigation Updates Complete:');
    console.log('   • Header "Clubs" links → /clubs/directory');
    console.log('   • CTAs point to club directory');
    console.log('   • /clubs serves as landing page');
    console.log('   • /clubs/directory is primary discovery');
  } else {
    console.log('⚠️  Some tests failed. Please check the issues above.');
  }
  
  return failed === 0;
}

// Run the tests
testNavigationUpdates().catch(console.error);