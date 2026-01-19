#!/usr/bin/env node

/**
 * Test Localhost After Phase 3.1 Rollback
 * 
 * This script tests the localhost application to ensure it's working
 * properly after the Phase 3.1 rollback.
 */

const http = require('http');

const config = {
  host: 'localhost',
  port: 3000,
  timeout: 5000
};

console.log('🧪 Testing Localhost After Phase 3.1 Rollback');
console.log('===============================================');
console.log(`Testing: http://${config.host}:${config.port}`);
console.log('');

async function testEndpoint(path = '/') {
  return new Promise((resolve) => {
    const options = {
      hostname: config.host,
      port: config.port,
      path: path,
      method: 'GET',
      timeout: config.timeout
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          success: res.statusCode >= 200 && res.statusCode < 400
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

    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 0,
        error: 'Request timeout',
        success: false
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('Testing main endpoints...\n');

  const endpoints = [
    { path: '/', name: 'Home Page' },
    { path: '/hub', name: 'Hub Page' },
    { path: '/my-clubs', name: 'My Clubs Page' },
    { path: '/auth/login', name: 'Login Page' },
    { path: '/coffee', name: 'Coffee Page' },
    { path: '/guides', name: 'Guides Page' }
  ];

  const results = [];

  for (const endpoint of endpoints) {
    process.stdout.write(`Testing ${endpoint.name}... `);
    
    const result = await testEndpoint(endpoint.path);
    results.push({ ...endpoint, ...result });

    if (result.success) {
      console.log(`✅ ${result.status}`);
    } else {
      console.log(`❌ ${result.status || 'ERROR'} - ${result.error || 'Unknown error'}`);
    }
  }

  console.log('\n📊 Test Results Summary');
  console.log('========================');
  
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);
  
  if (successful === total) {
    console.log('\n🎉 All tests passed! Localhost is working properly.');
    console.log('✨ Phase 3.1 rollback was successful.');
    console.log('\n🌐 You can access the application at: http://localhost:3000');
  } else {
    console.log('\n⚠️  Some endpoints are not working properly.');
    console.log('This might be expected after the rollback.');
    
    const failedEndpoints = results.filter(r => !r.success);
    console.log('\nFailed endpoints:');
    failedEndpoints.forEach(endpoint => {
      console.log(`  - ${endpoint.name} (${endpoint.path}): ${endpoint.error || endpoint.status}`);
    });
  }

  console.log('\n📝 Next Steps:');
  console.log('- Check the development server logs for any errors');
  console.log('- Test the working endpoints in your browser');
  console.log('- When ready, implement club functionality with a simpler approach');
}

// Run the tests
runTests().catch(console.error);