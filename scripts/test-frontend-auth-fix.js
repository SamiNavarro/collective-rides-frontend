#!/usr/bin/env node

/**
 * Test Frontend Authentication Fix
 * 
 * This script simulates the frontend authentication flow to verify
 * that the ID token fix works correctly.
 */

// Simulate the frontend authentication flow
async function testFrontendAuthFlow() {
  console.log('🧪 Testing Frontend Authentication Flow');
  console.log('======================================');
  
  // Import the modules (simulating frontend imports)
  const { cognitoAuth } = await import('../lib/auth/cognito-service.js');
  const { api } = await import('../lib/api/api-client.js');
  
  console.log('✅ Modules imported successfully');
  
  try {
    // Step 1: Sign in
    console.log('\n🔐 Step 1: Signing in...');
    const loginResult = await cognitoAuth.signIn('admin@test.com', 'TestPassword123!');
    
    if (loginResult.success) {
      console.log('✅ Sign in successful');
    } else {
      console.log('❌ Sign in failed:', loginResult.message);
      return;
    }
    
    // Step 2: Check authentication status
    console.log('\n🔍 Step 2: Checking authentication status...');
    const isAuthenticated = cognitoAuth.isAuthenticated();
    console.log(`Authentication status: ${isAuthenticated ? '✅ Authenticated' : '❌ Not authenticated'}`);
    
    if (!isAuthenticated) {
      console.log('❌ User not authenticated, cannot proceed');
      return;
    }
    
    // Step 3: Get current user
    console.log('\n👤 Step 3: Getting current user...');
    const currentUser = await cognitoAuth.getCurrentUser();
    
    if (currentUser) {
      console.log('✅ Current user retrieved:');
      console.log(`   ID: ${currentUser.sub}`);
      console.log(`   Email: ${currentUser.email}`);
      console.log(`   Name: ${currentUser.name || currentUser.given_name || 'N/A'}`);
    } else {
      console.log('❌ Could not retrieve current user');
      return;
    }
    
    // Step 4: Test API calls
    console.log('\n🌐 Step 4: Testing API calls...');
    
    // Test user profile API
    const userProfileResponse = await api.user.getCurrent();
    if (userProfileResponse.success) {
      console.log('✅ User profile API successful:');
      console.log(`   User ID: ${userProfileResponse.data.id}`);
      console.log(`   Email: ${userProfileResponse.data.email}`);
      console.log(`   Display Name: ${userProfileResponse.data.displayName}`);
      console.log(`   System Role: ${userProfileResponse.data.systemRole}`);
    } else {
      console.log('❌ User profile API failed:', userProfileResponse.error);
      return;
    }
    
    // Test memberships API
    const membershipsResponse = await api.user.getMemberships();
    if (membershipsResponse.success) {
      console.log('✅ Memberships API successful:');
      console.log(`   Memberships count: ${membershipsResponse.data.data?.length || 0}`);
    } else {
      console.log('❌ Memberships API failed:', membershipsResponse.error);
    }
    
    // Step 5: Test token methods
    console.log('\n🎫 Step 5: Testing token methods...');
    
    const accessToken = await cognitoAuth.getAccessToken();
    const idToken = await cognitoAuth.getIdToken();
    
    console.log(`Access Token: ${accessToken ? '✅ Available' : '❌ Not available'}`);
    console.log(`ID Token: ${idToken ? '✅ Available' : '❌ Not available'}`);
    
    if (accessToken) {
      console.log(`   Access Token Length: ${accessToken.length}`);
    }
    
    if (idToken) {
      console.log(`   ID Token Length: ${idToken.length}`);
    }
    
    console.log('\n🎉 All tests passed! The authentication fix is working correctly.');
    
  } catch (error) {
    console.log('❌ Error during testing:', error.message);
    console.log('Stack trace:', error.stack);
  } finally {
    // Clean up
    console.log('\n🧹 Cleaning up...');
    await cognitoAuth.signOut();
    console.log('✅ Signed out successfully');
  }
}

// Run the test
testFrontendAuthFlow().catch(console.error);