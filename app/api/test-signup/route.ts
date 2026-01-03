import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Validate password requirements based on Cognito User Pool policy
    const passwordValidation = {
      minLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasDigits: /\d/.test(password),
      // Symbols not required based on User Pool config
    };

    const isPasswordValid = Object.values(passwordValidation).every(Boolean);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);

    // Validate name
    const isNameValid = name && name.trim().length > 0;

    const validation = {
      email: {
        valid: isEmailValid,
        value: email,
        error: !isEmailValid ? 'Invalid email format' : null,
      },
      password: {
        valid: isPasswordValid,
        requirements: passwordValidation,
        error: !isPasswordValid ? 'Password does not meet requirements' : null,
      },
      name: {
        valid: isNameValid,
        value: name,
        error: !isNameValid ? 'Name is required' : null,
      },
    };

    const allValid = validation.email.valid && validation.password.valid && validation.name.valid;

    // If validation passes, we can test the actual Cognito call
    let cognitoResult = null;
    if (allValid) {
      try {
        // Make direct Cognito API call to test
        const cognitoResponse = await fetch(`https://cognito-idp.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
          },
          body: JSON.stringify({
            ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
            Username: email,
            Password: password,
            UserAttributes: [
              {
                Name: 'email',
                Value: email,
              },
              {
                Name: 'given_name',
                Value: name,
              },
            ],
          }),
        });

        const cognitoData = await cognitoResponse.json();
        
        cognitoResult = {
          success: cognitoResponse.ok,
          status: cognitoResponse.status,
          data: cognitoData,
          error: !cognitoResponse.ok ? cognitoData : null,
        };
      } catch (error) {
        cognitoResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return NextResponse.json({
      validation,
      allValid,
      cognitoResult,
      passwordRequirements: {
        minLength: '8 characters minimum',
        requireLowercase: 'At least one lowercase letter (a-z)',
        requireUppercase: 'At least one uppercase letter (A-Z)',
        requireDigits: 'At least one digit (0-9)',
        requireSymbols: 'Not required',
      },
      environment: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
        region: process.env.NEXT_PUBLIC_AWS_REGION,
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}