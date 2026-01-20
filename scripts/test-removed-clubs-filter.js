// Test that removed clubs are filtered out from My Clubs page
// This verifies the fix for clubs not disappearing after leaving

const puppeteer = require('puppeteer');

const LOCALHOST_URL = 'http://localhost:3000';
const TEST_EMAIL = 'testuser2@test.com';
const TEST_PASSWORD = 'TestPassword123!';

async function testRemovedClubsFilter() {
  console.log('🧪 Testing Removed Clubs Filter');
  console.log('='.repeat(50));
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('useMyClubs') || text.includes('Filtered clubs') || text.includes('Leave')) {
        console.log('  📱', text);
      }
    });
    
    // Step 1: Login
    console.log('\n1️⃣ Logging in...');
    await page.goto(`${LOCALHOST_URL}/auth/login`);
    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', TEST_EMAIL);
    await page.type('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    console.log('   ✅ Logged in');
    
    // Step 2: Go to My Clubs
    console.log('\n2️⃣ Navigating to My Clubs...');
    await page.goto(`${LOCALHOST_URL}/my-clubs`);
    await page.waitForSelector('h1');
    
    // Wait for clubs to load
    await page.waitForTimeout(2000);
    
    // Step 3: Count clubs before leaving
    const clubsBefore = await page.$$eval('[data-testid="club-card"], .p-4.rounded-lg.border', 
      cards => cards.length
    );
    console.log(`   📊 Clubs displayed: ${clubsBefore}`);
    
    if (clubsBefore === 0) {
      console.log('   ℹ️ No clubs to test with. User needs to join clubs first.');
      return;
    }
    
    // Step 4: Leave a club
    console.log('\n3️⃣ Leaving a club...');
    const leaveButtons = await page.$$('button:has-text("Leave Club")');
    if (leaveButtons.length === 0) {
      console.log('   ⚠️ No "Leave Club" buttons found');
      return;
    }
    
    // Click the first Leave Club button
    await leaveButtons[0].click();
    console.log('   🖱️ Clicked Leave Club button');
    
    // Wait for dialog
    await page.waitForTimeout(500);
    
    // Click confirm in dialog
    const confirmButton = await page.$('button:has-text("Leave Club")');
    if (confirmButton) {
      await confirmButton.click();
      console.log('   ✅ Confirmed leave');
    }
    
    // Step 5: Wait for refetch and check if club disappeared
    console.log('\n4️⃣ Waiting for club to disappear...');
    await page.waitForTimeout(3000); // Wait for refetch
    
    const clubsAfter = await page.$$eval('[data-testid="club-card"], .p-4.rounded-lg.border', 
      cards => cards.length
    );
    console.log(`   📊 Clubs displayed after: ${clubsAfter}`);
    
    // Step 6: Verify
    console.log('\n5️⃣ Verification:');
    if (clubsAfter < clubsBefore) {
      console.log('   ✅ SUCCESS: Club disappeared from list!');
      console.log(`   📉 Count reduced from ${clubsBefore} to ${clubsAfter}`);
    } else {
      console.log('   ❌ FAIL: Club still showing in list');
      console.log(`   📊 Count: ${clubsBefore} → ${clubsAfter} (expected decrease)`);
      
      // Check if any clubs have "removed" status
      const removedClubs = await page.$$eval('.p-4.rounded-lg.border', cards => {
        return cards.filter(card => card.textContent.includes('removed')).length;
      });
      
      if (removedClubs > 0) {
        console.log(`   ⚠️ Found ${removedClubs} clubs with "removed" status still displayed`);
      }
    }
    
    console.log('\n✅ Test complete');
    console.log('\n💡 Keep browser open for manual inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testRemovedClubsFilter();
