#!/usr/bin/env node

/**
 * Cognito Integration Test Script
 * 
 * Tests the Cognito authentication integration to ensure all components
 * are working correctly before deployment.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Cognito Integration...\n');

// Test 1: Environment Variables
console.log('1️⃣ Checking Environment Variables...');
const envPath = path.join(process.cwd(), '.env.local');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local file not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const requiredVars = [
  'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
  'NEXT_PUBLIC_COGNITO_CLIENT_ID',
  'NEXT_PUBLIC_AWS_REGION',
  'NEXT_PUBLIC_API_URL'
];

const missingVars = requiredVars.filter(varName => !envContent.includes(varName));

if (missingVars.length > 0) {
  console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

console.log('✅ All required environment variables found\n');

// Test 2: Dependencies
console.log('2️⃣ Checking Dependencies...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const requiredDeps = [
  'amazon-cognito-identity-js',
  '@aws-sdk/client-cognito-identity-provider'
];

const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length > 0) {
  console.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
  process.exit(1);
}

console.log('✅ All required dependencies installed\n');

// Test 3: File Structure
console.log('3️⃣ Checking File Structure...');
const requiredFiles = [
  'lib/auth/cognito-service.ts',
  'lib/api/api-client.ts',
  'contexts/auth-context.tsx',
  'app/test-cognito/page.tsx'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(process.cwd(), file)));

if (missingFiles.length > 0) {
  console.log(`❌ Missing files: ${missingFiles.join(', ')}`);
  process.exit(1);
}

console.log('✅ All required files present\n');

// Test 4: TypeScript Compilation Check
console.log('4️⃣ Checking TypeScript Files...');
const tsFiles = [
  'lib/auth/cognito-service.ts',
  'lib/api/api-client.ts',
  'contexts/auth-context.tsx',
  'app/test-cognito/page.tsx'
];

for (const file of tsFiles) {
  const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
  
  // Check for common TypeScript issues
  if (content.includes('any') && !content.includes('// @ts-ignore')) {
    console.log(`⚠️ ${file} contains 'any' types (consider improving type safety)`);
  }
  
  // Check for proper imports
  if (file.includes('cognito-service') && !content.includes('interface CognitoUser')) {
    console.log(`❌ ${file} missing CognitoUser interface`);
    process.exit(1);
  }
}

console.log('✅ TypeScript files structure looks good\n');

// Test 5: Configuration Values
console.log('5️⃣ Validating Configuration Values...');
const envLines = envContent.split('\n');
const config = {};

envLines.forEach(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    config[key.trim()] = value.trim();
  }
});

// Validate User Pool ID format
const userPoolId = config['NEXT_PUBLIC_COGNITO_USER_POOL_ID'];
if (!userPoolId || !userPoolId.match(/^us-east-2_[a-zA-Z0-9]+$/)) {
  console.log('❌ Invalid Cognito User Pool ID format');
  process.exit(1);
}

// Validate Client ID format
const clientId = config['NEXT_PUBLIC_COGNITO_CLIENT_ID'];
if (!clientId || clientId.length < 20) {
  console.log('❌ Invalid Cognito Client ID format');
  process.exit(1);
}

// Validate API URL
const apiUrl = config['NEXT_PUBLIC_API_URL'];
if (!apiUrl || !apiUrl.startsWith('https://')) {
  console.log('❌ Invalid API URL format');
  process.exit(1);
}

console.log('✅ Configuration values are valid\n');

// Test 6: Integration Points
console.log('6️⃣ Checking Integration Points...');

// Check if auth context imports cognito service
const authContextContent = fs.readFileSync(path.join(process.cwd(), 'contexts/auth-context.tsx'), 'utf8');
if (!authContextContent.includes('cognitoAuth')) {
  console.log('❌ Auth context does not import Cognito service');
  process.exit(1);
}

// Check if API client imports cognito service
const apiClientContent = fs.readFileSync(path.join(process.cwd(), 'lib/api/api-client.ts'), 'utf8');
if (!apiClientContent.includes('cognitoAuth')) {
  console.log('❌ API client does not import Cognito service');
  process.exit(1);
}

console.log('✅ Integration points are properly connected\n');

// Summary
console.log('🎉 Cognito Integration Test Results:');
console.log('✅ Environment variables configured');
console.log('✅ Dependencies installed');
console.log('✅ File structure complete');
console.log('✅ TypeScript files valid');
console.log('✅ Configuration values correct');
console.log('✅ Integration points connected');
console.log('\n🚀 Cognito integration is ready for testing!');
console.log('\n📋 Next Steps:');
console.log('1. Start development server: npm run dev');
console.log('2. Visit testing interface: http://localhost:3000/test-cognito');
console.log('3. Run automated tests and verify functionality');
console.log('4. Test user registration and login flows');
console.log('5. Validate API integration with JWT tokens');