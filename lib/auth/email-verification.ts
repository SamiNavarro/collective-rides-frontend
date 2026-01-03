/**
 * Email Verification Service for AWS Cognito
 * 
 * Handles email verification flow including:
 * - Confirming signup with verification code
 * - Resending verification codes
 * - Checking verification status
 */

interface VerificationResult {
  success: boolean;
  message?: string;
  needsVerification?: boolean;
}

export class EmailVerificationService {
  private baseUrl: string;
  private config: {
    userPoolId: string;
    clientId: string;
    region: string;
  };

  constructor() {
    this.config = {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      region: process.env.NEXT_PUBLIC_AWS_REGION!,
    };

    if (!this.config.userPoolId || !this.config.clientId || !this.config.region) {
      throw new Error('Missing required Cognito configuration for email verification');
    }

    this.baseUrl = `https://cognito-idp.${this.config.region}.amazonaws.com`;
  }

  /**
   * Confirm user signup with verification code
   */
  async confirmSignUp(email: string, verificationCode: string): Promise<VerificationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.ConfirmSignUp',
        },
        body: JSON.stringify({
          ClientId: this.config.clientId,
          Username: email,
          ConfirmationCode: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: this.getErrorMessage(data),
        };
      }

      return {
        success: true,
        message: 'Email verified successfully! You can now sign in.',
      };
    } catch (error) {
      console.error('Confirm signup error:', error);
      return {
        success: false,
        message: 'Verification failed. Please try again.',
      };
    }
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(email: string): Promise<VerificationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.ResendConfirmationCode',
        },
        body: JSON.stringify({
          ClientId: this.config.clientId,
          Username: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: this.getErrorMessage(data),
        };
      }

      return {
        success: true,
        message: 'Verification code sent! Please check your email.',
      };
    } catch (error) {
      console.error('Resend verification code error:', error);
      return {
        success: false,
        message: 'Failed to resend verification code. Please try again.',
      };
    }
  }

  /**
   * Check if user needs email verification
   */
  async checkVerificationStatus(email: string): Promise<{ needsVerification: boolean; message?: string }> {
    try {
      // Try to get user attributes to check verification status
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.AdminGetUser',
        },
        body: JSON.stringify({
          UserPoolId: this.config.userPoolId,
          Username: email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If user not found, they might need to sign up first
        if (data.__type === 'UserNotFoundException') {
          return {
            needsVerification: false,
            message: 'User not found. Please sign up first.',
          };
        }
        return {
          needsVerification: true,
          message: 'Unable to check verification status.',
        };
      }

      // Check if email is verified
      const emailVerified = data.UserAttributes?.find(
        (attr: any) => attr.Name === 'email_verified'
      )?.Value === 'true';

      return {
        needsVerification: !emailVerified,
        message: emailVerified ? 'Email is already verified' : 'Email verification required',
      };
    } catch (error) {
      console.error('Check verification status error:', error);
      return {
        needsVerification: true,
        message: 'Unable to check verification status.',
      };
    }
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    const errorCode = error.__type || error.code;
    
    switch (errorCode) {
      case 'CodeMismatchException':
        return 'Invalid verification code. Please check and try again.';
      case 'ExpiredCodeException':
        return 'Verification code has expired. Please request a new one.';
      case 'NotAuthorizedException':
        return 'User is already confirmed or verification failed.';
      case 'UserNotFoundException':
        return 'User not found. Please sign up first.';
      case 'TooManyRequestsException':
        return 'Too many requests. Please wait before trying again.';
      case 'LimitExceededException':
        return 'Attempt limit exceeded. Please try again later.';
      case 'InvalidParameterException':
        return 'Invalid verification code format.';
      default:
        return error.message || 'Verification failed. Please try again.';
    }
  }
}

// Export singleton instance
export const emailVerification = new EmailVerificationService();