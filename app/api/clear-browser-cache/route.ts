import { NextResponse } from 'next/server';

export async function POST() {
  // This endpoint helps identify what's causing the old User Pool ID to persist
  
  const diagnostics = {
    serverEnvironment: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      region: process.env.NEXT_PUBLIC_AWS_REGION,
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
    },
    timestamp: new Date().toISOString(),
    instructions: {
      step1: 'Clear localStorage: localStorage.clear()',
      step2: 'Clear sessionStorage: sessionStorage.clear()',
      step3: 'Clear cookies: document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"))',
      step4: 'Hard refresh: Ctrl+Shift+R or Cmd+Shift+R',
      step5: 'Close all browser windows and restart browser',
    },
    expectedUserPoolId: 'us-east-2_t5UUpOmPL',
    incorrectUserPoolId: 'us-east-2_taARRQ6vu',
  };

  return NextResponse.json(diagnostics);
}