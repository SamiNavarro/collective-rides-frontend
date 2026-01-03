#!/usr/bin/env node

/**
 * Cognito Error Diagnostic Script
 * 
 * This script helps identify exactly where the old User Pool ID error is coming from.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing Cognito User Pool Error Source...\n');

const OLD_USER_POOL_ID = 'us-east-2_taARRQ6vu';
const CORRECT_USER_POOL_ID = 'us-east-2_t5UUpOmPL';

// Step 1: Check all possible sources
console.log('1️⃣ Checking All Possible Configuration Sources...\n');

// Check environment files
const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
console.log('📁 Environment Files:');
envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(OLD_USER_POOL_ID)) {
      console.log(`❌ ${file} contains old User Pool ID`);
    } else if (content.includes(CORRECT_USER_POOL_ID)) {
      console.log(`✅ ${file} contains correct User Pool ID`);
    } else if (content.includes('COGNITO_USER_POOL_ID')) {
      console.log(`⚠️ ${file} has Cognito config but different User Pool ID`);
    } else {
      console.log(`➖ ${file} exists but no Cognito config found`);
    }
  }
});

// Check Next.js config files
console.log('\n📁 Next.js Configuration:');
const nextConfigFiles = ['next.config.js', 'next.config.mjs', 'next.config.ts'];
nextConfigFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(OLD_USER_POOL_ID)) {
      console.log(`❌ ${file} contains old User Pool ID`);
    } else {
      console.log(`✅ ${file} looks clean`);
    }
  }
});

// Check package.json for any scripts or config
console.log('\n📁 Package Configuration:');
if (fs.existsSync('package.json')) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const packageStr = JSON.stringify(packageJson);
  if (packageStr.includes(OLD_USER_POOL_ID)) {
    console.log('❌ package.json contains old User Pool ID');
  } else {
    console.log('✅ package.json looks clean');
  }
}

// Check Vercel configuration
console.log('\n📁 Vercel Configuration:');
const vercelFiles = ['vercel.json', '.vercel/project.json'];
vercelFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(OLD_USER_POOL_ID)) {
      console.log(`❌ ${file} contains old User Pool ID`);
    } else {
      console.log(`✅ ${file} looks clean`);
    }
  }
});

// Step 2: Check for any build artifacts
console.log('\n2️⃣ Checking Build Artifacts...\n');

const buildDirs = ['.next', 'dist', 'build'];
buildDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`⚠️ ${dir} directory exists - may contain cached builds`);
    console.log(`   Recommendation: Delete ${dir} and rebuild`);
  }
});

// Step 3: Generate browser debugging script
console.log('\n3️⃣ Browser Debugging Instructions...\n');

const debugScript = `
// Run this in your browser console to debug the issue:

// 1. Check current environment variables
console.log('Environment Variables:', {
  userPoolId: process.env?.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
  clientId: process.env?.NEXT_PUBLIC_COGNITO_CLIENT_ID,
  region: process.env?.NEXT_PUBLIC_AWS_REGION,
  apiUrl: process.env?.NEXT_PUBLIC_API_URL
});

// 2. Check localStorage for cached data
console.log('LocalStorage Cognito Data:', {
  tokens: localStorage.getItem('cognito_tokens'),
  allKeys: Object.keys(localStorage).filter(key => key.includes('cognito') || key.includes('auth'))
});

// 3. Clear all Cognito-related data
localStorage.removeItem('cognito_tokens');
sessionStorage.clear();
console.log('Cleared Cognito data');

// 4. Check network requests
console.log('Monitor Network tab for Cognito API calls');
console.log('Look for requests to cognito-idp.us-east-2.amazonaws.com');
console.log('Check if they contain the old User Pool ID: ${OLD_USER_POOL_ID}');
`;

fs.writeFileSync('debug-cognito-browser.js', debugScript);
console.log('📝 Created debug-cognito-browser.js - copy and paste into browser console');

// Step 4: Check for potential sources of the error
console.log('\n4️⃣ Potential Error Sources Analysis...\n');

console.log('🔍 The error "Failed to fetch user pool us-east-2_taARRQ6vu" could come from:');
console.log('');
console.log('1. 🌐 Browser Cache:');
console.log('   - Cached JavaScript files with old configuration');
console.log('   - LocalStorage with old tokens or configuration');
console.log('   - Service Worker cache (if any)');
console.log('');
console.log('2. 🏗️ Build Cache:');
console.log('   - Next.js build cache (.next directory)');
console.log('   - Webpack cache');
console.log('   - Node modules cache');
console.log('');
console.log('3. 🔧 Configuration Issues:');
console.log('   - Environment variables not loaded correctly');
console.log('   - Multiple environment files conflicting');
console.log('   - Runtime environment variable override');
console.log('');
console.log('4. 🌍 External Services:');
console.log('   - CDN cache (if deployed)');
console.log('   - Vercel deployment cache');
console.log('   - DNS cache');

// Step 5: Provide fix recommendations
console.log('\n5️⃣ Recommended Fix Steps...\n');

console.log('🔧 Try these steps in order:');
console.log('');
console.log('1. 🧹 Complete Cache Clear:');
console.log('   rm -rf .next node_modules package-lock.json');
console.log('   npm install');
console.log('   npm run dev');
console.log('');
console.log('2. 🌐 Browser Hard Reset:');
console.log('   - Close all browser windows');
console.log('   - Clear all browsing data');
console.log('   - Restart browser');
console.log('   - Visit site in incognito/private mode');
console.log('');
console.log('3. 🔍 Debug Network Requests:');
console.log('   - Open Developer Tools');
console.log('   - Go to Network tab');
console.log('   - Clear network log');
console.log('   - Reproduce the error');
console.log('   - Look for Cognito API calls');
console.log('   - Check request URLs and payloads');
console.log('');
console.log('4. 🧪 Test with Fresh Environment:');
console.log('   - Create new .env.local file');
console.log('   - Copy exact values from working configuration');
console.log('   - Restart development server');

// Step 6: Create cleanup script
const cleanupScript = `#!/bin/bash
echo "🧹 Cleaning all caches and rebuilding..."

# Remove build artifacts
rm -rf .next
rm -rf node_modules
rm -rf package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install

# Restart development server
echo "✅ Cleanup complete. Run 'npm run dev' to start fresh."
`;

fs.writeFileSync('cleanup-and-rebuild.sh', cleanupScript);
fs.chmodSync('cleanup-and-rebuild.sh', '755');
console.log('📝 Created cleanup-and-rebuild.sh script');

console.log('\n🎯 Next Steps:');
console.log('1. Run: ./cleanup-and-rebuild.sh');
console.log('2. Start dev server: npm run dev');
console.log('3. Test in incognito browser window');
console.log('4. Use browser debug script if issue persists');
console.log('5. Check network requests for the source of old User Pool ID');