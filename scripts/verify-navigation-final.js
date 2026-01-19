#!/usr/bin/env node

/**
 * Final Navigation Verification - Phase 3.1
 * 
 * Quick verification that the key navigation updates are working
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

async function fetchPage(path) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function verifyNavigation() {
  console.log('🔍 Final Navigation Verification - Phase 3.1');
  console.log('=' .repeat(50));
  
  try {
    // Test 1: Header navigation points to /clubs/directory
    console.log('\n1. Testing header navigation...');
    const homePage = await fetchPage('/');
    const hasDirectoryLink = homePage.body.includes('href="/clubs/directory"');
    console.log(`   Header "Clubs" → /clubs/directory: ${hasDirectoryLink ? '✅' : '❌'}`);
    
    // Test 2: Clubs page CTAs point to /clubs/directory  
    console.log('\n2. Testing clubs page CTAs...');
    const clubsPage = await fetchPage('/clubs');
    const hasDirectoryCTA = clubsPage.body.includes('href="/clubs/directory"');
    console.log(`   Clubs page CTA → /clubs/directory: ${hasDirectoryCTA ? '✅' : '❌'}`);
    
    // Test 3: Directory page is accessible
    console.log('\n3. Testing directory accessibility...');
    const directoryPage = await fetchPage('/clubs/directory');
    const directoryWorks = directoryPage.status === 200;
    console.log(`   /clubs/directory accessible: ${directoryWorks ? '✅' : '❌'}`);
    
    // Test 4: My clubs page is accessible
    console.log('\n4. Testing my-clubs accessibility...');
    const myClubsPage = await fetchPage('/my-clubs');
    const myClubsWorks = myClubsPage.status === 200;
    console.log(`   /my-clubs accessible: ${myClubsWorks ? '✅' : '❌'}`);
    
    const allPassed = hasDirectoryLink && hasDirectoryCTA && directoryWorks && myClubsWorks;
    
    console.log('\n' + '=' .repeat(50));
    if (allPassed) {
      console.log('🎉 All navigation updates verified successfully!');
      console.log('\n✅ Phase 3.1 Navigation Updates Complete:');
      console.log('   • Header "Clubs" links → /clubs/directory');
      console.log('   • All CTAs point to club directory');
      console.log('   • /clubs serves as landing page');
      console.log('   • /clubs/directory is primary discovery');
      console.log('   • /my-clubs personal dashboard working');
    } else {
      console.log('⚠️  Some navigation updates need attention');
    }
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
    return false;
  }
}

// Run verification
verifyNavigation().catch(console.error);