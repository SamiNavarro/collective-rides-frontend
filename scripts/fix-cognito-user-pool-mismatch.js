#!/usr/bin/env node

/**
 * Cognito User Pool Mismatch Fix Script
 * 
 * This script helps diagnose and fix User Pool ID mismatches between
 * frontend configuration and AWS deployment.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing Cognito User Pool ID Mismatch...\n');

// The correct User Pool ID from AWS
const CORRECT_USER_POOL_ID = 'us-east-2_t5UUpOmPL';
const INCORRECT_USER_POOL_ID = 'us-east-2_taARRQ6vu';

// Step 1: Check environment files
console.log('1️⃣ Checking Environment Configuration...');

const envFiles = ['.env.local', '.env.example', '.env'];
let envIssues = [];

envFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(INCORRECT_USER_POOL_ID)) {
      envIssues.push(`❌ ${file} contains incorrect User Pool ID: ${INCORRECT_USER_POOL_ID}`);
    } else if (content.includes(CORRECT_USER_POOL_ID)) {
      console.log(`✅ ${file} has correct User Pool ID: ${CORRECT_USER_POOL_ID}`);
    } else if (content.includes('COGNITO_USER_POOL_ID')) {
      console.log(`⚠️ ${file} has Cognito config but no User Pool ID found`);
    }
  }
});

if (envIssues.length > 0) {
  console.log('\n🚨 Environment Issues Found:');
  envIssues.forEach(issue => console.log(issue));
} else {
  console.log('✅ Environment files look correct');
}

// Step 2: Check for hardcoded references
console.log('\n2️⃣ Checking for Hardcoded References...');

const filesToCheck = [
  'lib/auth/cognito-service.ts',
  'lib/api/api-client.ts',
  'contexts/auth-context.tsx',
  'app/test-cognito/page.tsx'
];

let hardcodedIssues = [];

filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(INCORRECT_USER_POOL_ID)) {
      hardcodedIssues.push(`❌ ${file} contains hardcoded incorrect User Pool ID`);
    } else if (content.includes(CORRECT_USER_POOL_ID)) {
      hardcodedIssues.push(`⚠️ ${file} contains hardcoded User Pool ID (should use env var)`);
    } else {
      console.log(`✅ ${file} uses environment variables correctly`);
    }
  }
});

if (hardcodedIssues.length > 0) {
  console.log('\n🚨 Hardcoded Reference Issues:');
  hardcodedIssues.forEach(issue => console.log(issue));
} else {
  console.log('✅ No hardcoded User Pool IDs found');
}

// Step 3: Check documentation files
console.log('\n3️⃣ Checking Documentation Files...');

const docFiles = [
  'backend/docs/testing-guide.md',
  'docs/frontend-backend-integration-summary.md',
  'docs/cognito-integration-implementation.md',
  'DEPLOYMENT_STATUS.md'
];

let docIssues = [];
let docUpdates = [];

docFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(INCORRECT_USER_POOL_ID)) {
      docIssues.push(file);
      // Fix the documentation
      const updatedContent = content.replace(new RegExp(INCORRECT_USER_POOL_ID, 'g'), CORRECT_USER_POOL_ID);
      fs.writeFileSync(filePath, updatedContent);
      docUpdates.push(`✅ Fixed ${file}`);
    }
  }
});

if (docIssues.length > 0) {
  console.log('\n🔧 Documentation Updates:');
  docUpdates.forEach(update => console.log(update));
} else {
  console.log('✅ Documentation files are correct');
}

// Step 4: Generate browser cache clearing instructions
console.log('\n4️⃣ Browser Cache Clearing Instructions...');
console.log('If you\'re still seeing the old User Pool ID error, clear browser data:');
console.log('');
console.log('🌐 Chrome/Edge:');
console.log('   1. Open Developer Tools (F12)');
console.log('   2. Go to Application tab');
console.log('   3. Clear Storage > Clear site data');
console.log('   4. Or run: localStorage.clear() in console');
console.log('');
console.log('🦊 Firefox:');
console.log('   1. Open Developer Tools (F12)');
console.log('   2. Go to Storage tab');
console.log('   3. Delete localStorage entries');
console.log('');
console.log('🧭 Safari:');
console.log('   1. Open Web Inspector');
console.log('   2. Go to Storage tab');
console.log('   3. Clear localStorage');

// Step 5: Verify current configuration
console.log('\n5️⃣ Current Configuration Summary...');
console.log(`✅ Correct User Pool ID: ${CORRECT_USER_POOL_ID}`);
console.log(`❌ Incorrect User Pool ID: ${INCORRECT_USER_POOL_ID}`);
console.log('');

// Read current .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const lines = envContent.split('\n');
  
  console.log('📋 Current .env.local Configuration:');
  lines.forEach(line => {
    if (line.includes('COGNITO') || line.includes('API_URL') || line.includes('AWS_REGION')) {
      console.log(`   ${line}`);
    }
  });
} else {
  console.log('❌ .env.local file not found!');
}

// Step 6: Provide next steps
console.log('\n6️⃣ Next Steps to Resolve the Issue...');
console.log('');
console.log('1. 🔄 Restart the development server:');
console.log('   npm run dev');
console.log('');
console.log('2. 🧹 Clear browser cache and localStorage:');
console.log('   - Open browser developer tools');
console.log('   - Run: localStorage.clear()');
console.log('   - Hard refresh the page (Ctrl+Shift+R)');
console.log('');
console.log('3. 🧪 Test the configuration:');
console.log('   - Visit: http://localhost:3000/test-cognito');
console.log('   - Run the automated tests');
console.log('   - Check for any remaining errors');
console.log('');
console.log('4. 🔍 If issues persist:');
console.log('   - Check browser network tab for API calls');
console.log('   - Verify environment variables are loaded');
console.log('   - Check AWS Cognito console for the User Pool');

console.log('\n🎉 Diagnosis Complete!');
console.log('The script has fixed any documentation issues found.');
console.log('Follow the next steps above to resolve any remaining browser cache issues.');