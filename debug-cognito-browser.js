
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
console.log('Check if they contain the old User Pool ID: us-east-2_taARRQ6vu');
