import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT,
    appName: process.env.NEXT_PUBLIC_APP_NAME,
  };

  const expectedValues = {
    userPoolId: 'us-east-2_t5UUpOmPL',
    clientId: '760idnu1d0mul2o10lut6rt7la',
    region: 'us-east-2',
    apiUrl: 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development',
  };

  const validation = {
    userPoolId: envVars.userPoolId === expectedValues.userPoolId,
    clientId: envVars.clientId === expectedValues.clientId,
    region: envVars.region === expectedValues.region,
    apiUrl: envVars.apiUrl === expectedValues.apiUrl,
  };

  const allCorrect = Object.values(validation).every(Boolean);

  return NextResponse.json({
    success: allCorrect,
    envVars,
    expectedValues,
    validation,
    message: allCorrect ? 'All environment variables are correct' : 'Some environment variables are incorrect',
    timestamp: new Date().toISOString(),
  });
}