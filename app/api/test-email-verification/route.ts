import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, verificationCode, action } = body;

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 });
    }

    const config = {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      region: process.env.NEXT_PUBLIC_AWS_REGION,
    };

    if (!config.userPoolId || !config.clientId || !config.region) {
      return NextResponse.json({
        success: false,
        error: 'Missing Cognito configuration'
      }, { status: 500 });
    }

    const baseUrl = `https://cognito-idp.${config.region}.amazonaws.com`;

    if (action === 'confirm') {
      if (!verificationCode) {
        return NextResponse.json({
          success: false,
          error: 'Verification code is required'
        }, { status: 400 });
      }

      // Confirm signup
      const response = await fetch(`${baseUrl}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp',
        },
        body: JSON.stringify({
          ClientId: config.clientId,
          Username: email,
          ConfirmationCode: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: data.message || 'Verification failed',
          cognitoError: data
        }, { status: response.status });
      }

      return NextResponse.json({
        success: true,
        message: 'Email verified successfully!',
        data
      });

    } else if (action === 'resend') {
      // Resend verification code
      const response = await fetch(`${baseUrl}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.ResendConfirmationCode',
        },
        body: JSON.stringify({
          ClientId: config.clientId,
          Username: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json({
          success: false,
          error: data.message || 'Failed to resend verification code',
          cognitoError: data
        }, { status: response.status });
      }

      return NextResponse.json({
        success: true,
        message: 'Verification code sent!',
        data
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "confirm" or "resend"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Email verification API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}