#!/usr/bin/env node

/**
 * Email Verification Testing Script
 * 
 * Tests the complete email verification flow:
 * 1. User signup
 * 2. Email verification code receipt
 * 3. Code verification
 * 4. Successful login
 */

const https = require('https');
const readline = require('readline');

// Configuration
const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development',
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || 'us-east-2_t5UUpOmPL',
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '760idnu1d0mul2o10lut6rt7la',
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testSignup(email, password, name) {
  console.log('\n🔄 Testing user signup...');
  
  const baseUrl = `https://cognito-idp.${config.region}.amazonaws.com`;
  
  try {
    const response = await makeRequest(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
      }
    }, {
      ClientId: config.clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'given_name', Value: name }
      ]
    });

    if (response.statusCode === 200) {
      console.log('✅ Signup successful!');
      console.log('📧 Check your email for the verification code');
      return { success: true, data: response.data };
    } else {
      console.log('❌ Signup failed:', response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Signup error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testVerification(email, code) {
  console.log('\n🔄 Testing email verification...');
  
  const baseUrl = `https://cognito-idp.${config.region}.amazonaws.com`;
  
  try {
    const response = await makeRequest(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp',
      }
    }, {
      ClientId: config.clientId,
      Username: email,
      ConfirmationCode: code
    });

    if (response.statusCode === 200) {
      console.log('✅ Email verification successful!');
      return { success: true, data: response.data };
    } else {
      console.log('❌ Verification failed:', response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Verification error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testSignin(email, password) {
  console.log('\n🔄 Testing signin after verification...');
  
  const baseUrl = `https://cognito-idp.${config.region}.amazonaws.com`;
  
  try {
    const response = await makeRequest(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
      }
    }, {
      ClientId: config.clientId,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });

    if (response.statusCode === 200 && response.data.AuthenticationResult) {
      console.log('✅ Signin successful!');
      console.log('🎟️ Access token received');
      return { success: true, tokens: response.data.AuthenticationResult };
    } else {
      console.log('❌ Signin failed:', response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Signin error:', error.message);
    return { success: false, error: error.message };
  }
}

async function testResendCode(email) {
  console.log('\n🔄 Testing resend verification code...');
  
  const baseUrl = `https://cognito-idp.${config.region}.amazonaws.com`;
  
  try {
    const response = await makeRequest(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.ResendConfirmationCode',
      }
    }, {
      ClientId: config.clientId,
      Username: email
    });

    if (response.statusCode === 200) {
      console.log('✅ Verification code resent!');
      return { success: true, data: response.data };
    } else {
      console.log('❌ Resend failed:', response.data);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Resend error:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🧪 Email Verification Testing Script');
  console.log('=====================================');
  
  console.log('\n📋 Configuration:');
  console.log(`User Pool ID: ${config.userPoolId}`);
  console.log(`Client ID: ${config.clientId}`);
  console.log(`Region: ${config.region}`);
  
  try {
    // Get test credentials
    const email = await question('\n📧 Enter test email: ');
    const password = await question('🔐 Enter password (8+ chars, A-Z, a-z, 0-9): ');
    const name = await question('👤 Enter name: ');
    
    // Test signup
    const signupResult = await testSignup(email, password, name);
    
    if (!signupResult.success) {
      console.log('\n❌ Cannot proceed without successful signup');
      rl.close();
      return;
    }
    
    // Ask if user wants to resend code
    const resend = await question('\n❓ Do you want to test resending the verification code? (y/n): ');
    if (resend.toLowerCase() === 'y') {
      await testResendCode(email);
    }
    
    // Get verification code
    const code = await question('\n📧 Enter the 6-digit verification code from your email: ');
    
    // Test verification
    const verificationResult = await testVerification(email, code);
    
    if (!verificationResult.success) {
      console.log('\n❌ Verification failed. Cannot test signin.');
      rl.close();
      return;
    }
    
    // Test signin
    const signinResult = await testSignin(email, password);
    
    if (signinResult.success) {
      console.log('\n🎉 Complete email verification flow successful!');
      console.log('\n📊 Summary:');
      console.log('✅ User signup: SUCCESS');
      console.log('✅ Email verification: SUCCESS');
      console.log('✅ User signin: SUCCESS');
      console.log('✅ JWT tokens received: SUCCESS');
    } else {
      console.log('\n❌ Signin failed after verification');
    }
    
  } catch (error) {
    console.error('\n💥 Test failed:', error.message);
  } finally {
    rl.close();
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Test interrupted by user');
  rl.close();
  process.exit(0);
});

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testSignup, testVerification, testSignin, testResendCode };