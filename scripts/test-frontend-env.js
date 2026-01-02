#!/usr/bin/env node
// Frontend Environment Variables Test
// Tests that all required environment variables are present and valid

const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_AWS_REGION',
  'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
  'NEXT_PUBLIC_COGNITO_CLIENT_ID',
  'NEXT_PUBLIC_STRAVA_CLIENT_ID'
];

console.log('🔍 Testing Frontend Environment Variables...\n');

let allPresent = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
    allPresent = false;
  }
});

console.log('\n' + (allPresent ? '✅ All environment variables present!' : '❌ Some environment variables missing!'));

// Test API connectivity if API URL is available
if (process.env.NEXT_PUBLIC_API_URL) {
  console.log('\n🔍 Testing API connectivity from Node.js...');
  
  const https = require('https');
  const url = require('url');
  
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/health`;
  const parsedUrl = url.parse(apiUrl);
  
  const options = {
    hostname: parsedUrl.hostname,
    port: parsedUrl.port || 443,
    path: parsedUrl.path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://collective-rides-frontend.vercel.app'
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ API Health Check: PASS');
        try {
          const response = JSON.parse(data);
          console.log('Response:', response);
        } catch (e) {
          console.log('Response:', data);
        }
      } else {
        console.log(`❌ API Health Check: FAIL (Status: ${res.statusCode})`);
        console.log('Response:', data);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ API Health Check Failed:', error.message);
  });
  
  req.end();
} else {
  console.log('\n⚠️ NEXT_PUBLIC_API_URL not set, skipping API connectivity test');
}

// Display configuration summary
console.log('\n📋 Configuration Summary:');
console.log('='.repeat(50));
console.log(`API URL: ${process.env.NEXT_PUBLIC_API_URL || 'NOT SET'}`);
console.log(`AWS Region: ${process.env.NEXT_PUBLIC_AWS_REGION || 'NOT SET'}`);
console.log(`Cognito User Pool: ${process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'NOT SET'}`);
console.log(`Cognito Client: ${process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || 'NOT SET'}`);
console.log(`Strava Client: ${process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || 'NOT SET'}`);
console.log('='.repeat(50));