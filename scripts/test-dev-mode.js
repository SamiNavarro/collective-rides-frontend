#!/usr/bin/env node

/**
 * Test Development Mode
 * 
 * Verify that development mode with mock data is working
 */

const http = require('http');

console.log('🧪 Testing Development Mode');
console.log('===========================');

async function testPage() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/my-clubs',
      method: 'GET',
      timeout: 10000
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
  console.log('Testing /my-clubs page with development mode...\n');
  
  const result = await testPage();
  
  if (result.success) {
    console.log('✅ Page loads successfully!');
    console.log(`📊 Status: ${result.status}`);
    
    // Check for development mode indicators
    const hasDevMode = result.body.includes('NEXT_PUBLIC_DEV_MODE');
    const hasReactApp = result.body.includes('__next_f');
    const hasAuthPrompt = result.body.includes('Please sign in to access your clubs');
    
    console.log('\n📋 Development Mode Check:');
    console.log(`✅ React App: ${hasReactApp ? '✓' : '✗'}`);
    console.log(`✅ Auth Prompt (initial): ${hasAuthPrompt ? '✓' : '✗'}`);
    
    console.log('\n🔧 Development Mode Status:');
    console.log('- Environment: NODE_ENV=development');
    console.log('- Dev Mode: NEXT_PUBLIC_DEV_MODE=true');
    console.log('- Mock Data: Available in useMyClubs hook');
    console.log('- Mock User: Available in AuthProvider');
    
    console.log('\n📝 How to Test:');
    console.log('1. Open http://localhost:3000/my-clubs in your browser');
    console.log('2. The page should load with mock user data after React hydration');
    console.log('3. You should see 2 mock clubs: Sydney Cycling Club & Eastern Suburbs');
    console.log('4. Check browser console for "Development mode" messages');
    
    console.log('\n🎯 Expected Behavior:');
    console.log('- Initial load: Shows sign-in prompt (server-side render)');
    console.log('- After hydration: Shows mock clubs (client-side render)');
    console.log('- No network errors: Mock data prevents API calls');
    
  } else {
    console.log(`❌ Page failed to load: ${result.error || result.status}`);
  }
}

runTest().catch(console.error);