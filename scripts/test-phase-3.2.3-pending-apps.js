#!/usr/bin/env node

/**
 * Test Script: Phase 3.2.3 - Pending Applications Visibility
 * 
 * Tests that pending club applications are visible in:
 * 1. My Clubs page (/my-clubs)
 * 2. Club Directory (/clubs/directory) - with "Pending" badge
 * 3. Individual Club Page (/clubs/[clubId]) - with status banner
 * 
 * Test User: testuser2@test.com / TestPassword123!
 * Expected: Should see pending application to Pastries.cc
 */

const puppeteer = require('puppeteer');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_EMAIL = 'testuser2@test.com';
const TEST_PASSWORD = 'TestPassword123!';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testPendingApplicationsVisibility() {
  console.log('🧪 Testing Phase 3.2.3: Pending Applications Visibility\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      const type = msg.type();
      if (type === 'error' || type === 'warning') {
        console.log(`   [Browser ${type}]:`, msg.text());
      }
    });
    
    // ========================================
    // Test 1: Login
    // ========================================
    console.log('📝 Test 1: Login with testuser2');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle0' });
    
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    await sleep(3000); // Wait for login and redirect
    
    const currentUrl = page.url();
    if (currentUrl.includes('/hub')) {
      console.log('   ✅ Login successful, redirected to hub');
    } else {
      console.log(`   ⚠️  Unexpected redirect to: ${currentUrl}`);
    }
    
    // ========================================
    // Test 2: Check My Clubs Page
    // ========================================
    console.log('\n📝 Test 2: Check My Clubs page for pending applications');
    await page.goto(`${BASE_URL}/my-clubs`, { waitUntil: 'networkidle0' });
    await sleep(2000);
    
    // Check for pending applications section
    const hasPendingSection = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h3, h2'));
      return headings.some(h => h.textContent.includes('Pending Applications'));
    });
    
    if (hasPendingSection) {
      console.log('   ✅ Found "Pending Applications" section');
      
      // Check for Pastries.cc
      const hasPastriesApp = await page.evaluate(() => {
        const text = document.body.textContent;
        return text.includes('Pastries.cc');
      });
      
      if (hasPastriesApp) {
        console.log('   ✅ Found Pastries.cc in pending applications');
      } else {
        console.log('   ❌ Pastries.cc NOT found in pending applications');
      }
      
      // Check for "Pending Approval" badge
      const hasPendingBadge = await page.evaluate(() => {
        const text = document.body.textContent;
        return text.includes('Pending Approval');
      });
      
      if (hasPendingBadge) {
        console.log('   ✅ Found "Pending Approval" badge');
      } else {
        console.log('   ⚠️  "Pending Approval" badge not found');
      }
    } else {
      console.log('   ❌ "Pending Applications" section NOT found');
      console.log('   📋 Page content preview:');
      const pageText = await page.evaluate(() => document.body.textContent.substring(0, 500));
      console.log('   ', pageText.replace(/\n/g, ' ').substring(0, 200));
    }
    
    // ========================================
    // Test 3: Check Club Directory
    // ========================================
    console.log('\n📝 Test 3: Check Club Directory for membership badges');
    await page.goto(`${BASE_URL}/clubs/directory`, { waitUntil: 'networkidle0' });
    await sleep(2000);
    
    // Check if Pastries.cc shows a "Pending" or "Applied" badge
    const directoryBadge = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[class*="card"]'));
      for (const card of cards) {
        if (card.textContent.includes('Pastries.cc')) {
          const badges = Array.from(card.querySelectorAll('[class*="badge"]'));
          return badges.map(b => b.textContent).join(', ');
        }
      }
      return null;
    });
    
    if (directoryBadge) {
      console.log(`   ✅ Found Pastries.cc with badges: ${directoryBadge}`);
      if (directoryBadge.includes('Pending') || directoryBadge.includes('Applied')) {
        console.log('   ✅ Membership status badge is showing');
      } else {
        console.log('   ⚠️  No pending/applied badge found');
      }
    } else {
      console.log('   ⚠️  Could not find Pastries.cc card or badges');
    }
    
    // ========================================
    // Test 4: Check Individual Club Page
    // ========================================
    console.log('\n📝 Test 4: Check Pastries.cc club page');
    
    // Find Pastries.cc club ID from directory
    const pastriesClubId = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href*="/clubs/"]'));
      for (const link of links) {
        if (link.textContent.includes('Pastries.cc')) {
          const href = link.getAttribute('href');
          return href.split('/clubs/')[1];
        }
      }
      return null;
    });
    
    if (pastriesClubId) {
      console.log(`   📍 Found Pastries.cc club ID: ${pastriesClubId}`);
      await page.goto(`${BASE_URL}/clubs/${pastriesClubId}`, { waitUntil: 'networkidle0' });
      await sleep(2000);
      
      // Check for pending status banner or message
      const hasPendingStatus = await page.evaluate(() => {
        const text = document.body.textContent;
        return text.includes('Pending') || text.includes('Application') || text.includes('Applied');
      });
      
      if (hasPendingStatus) {
        console.log('   ✅ Club page shows pending application status');
      } else {
        console.log('   ⚠️  No pending status found on club page');
      }
    } else {
      console.log('   ⚠️  Could not find Pastries.cc club link');
    }
    
    // ========================================
    // Summary
    // ========================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log('✅ = Working as expected');
    console.log('⚠️  = Needs attention');
    console.log('❌ = Not working');
    console.log('\nPhase 3.2.3 implementation status:');
    console.log('- Pending applications should be visible in My Clubs');
    console.log('- Membership badges should show in directory');
    console.log('- Club page should show application status');
    console.log('\nKeep browser open for manual inspection...');
    
    await sleep(30000); // Keep browser open for 30 seconds
    
  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run tests
testPendingApplicationsVisibility()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
