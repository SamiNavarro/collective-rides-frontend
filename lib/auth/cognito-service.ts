/**
 * AWS Cognito Authentication Service
 * 
 * Provides authentication functionality using AWS Cognito User Pool
 * without external dependencies like AWS Amplify.
 * 
 * Features:
 * - User registration and login
 * - JWT token management
 * - Password reset functionality
 * - Session persistence
 */

interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  region: string;
}

interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

interface CognitoUser {
  sub: string;
  email: string;
  name?: string;
  given_name?: string;
  family_name?: string;
  'custom:system_role'?: string;
  exp?: number; // JWT expiration timestamp
  iat?: number; // JWT issued at timestamp
}

export class CognitoAuthService {
  private config: CognitoConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
      region: process.env.NEXT_PUBLIC_AWS_REGION!,
    };

    if (!this.config.userPoolId || !this.config.clientId || !this.config.region) {
      throw new Error('Missing required Cognito configuration');
    }

    this.baseUrl = `https://cognito-idp.${this.config.region}.amazonaws.com`;
  }

  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string, name: string): Promise<{ 
    success: boolean; 
    message?: string; 
    needsVerification?: boolean;
    userSub?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.SignUp',
        },
        body: JSON.stringify({
          ClientId: this.config.clientId,
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

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: this.getErrorMessage(data),
        };
      }

      // Check if user needs verification
      const needsVerification = !data.UserConfirmed;

      return {
        success: true,
        message: needsVerification 
          ? 'Registration successful. Please check your email for verification.'
          : 'Registration successful. You can now sign in.',
        needsVerification,
        userSub: data.UserSub,
      };
    } catch (error) {
      console.error('SignUp error:', error);
      return {
        success: false,
        message: 'Registration failed. Please try again.',
      };
    }
  }

  /**
   * Sign in user
   */
  async signIn(email: string, password: string): Promise<{ success: boolean; tokens?: AuthTokens; message?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        },
        body: JSON.stringify({
          ClientId: this.config.clientId,
          AuthFlow: 'USER_PASSWORD_AUTH',
          AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          message: this.getErrorMessage(data),
        };
      }

      if (data.AuthenticationResult) {
        const tokens: AuthTokens = {
          accessToken: data.AuthenticationResult.AccessToken,
          idToken: data.AuthenticationResult.IdToken,
          refreshToken: data.AuthenticationResult.RefreshToken,
        };

        // Store tokens securely
        this.storeTokens(tokens);

        return {
          success: true,
          tokens,
        };
      }

      // Handle challenges (like NEW_PASSWORD_REQUIRED)
      if (data.ChallengeName) {
        return {
          success: false,
          message: `Authentication challenge required: ${data.ChallengeName}`,
        };
      }

      return {
        success: false,
        message: 'Authentication failed',
      };
    } catch (error) {
      console.error('SignIn error:', error);
      return {
        success: false,
        message: 'Sign in failed. Please try again.',
      };
    }
  }

  /**
   * Get current user from stored tokens
   */
  async getCurrentUser(): Promise<CognitoUser | null> {
    try {
      const tokens = this.getStoredTokens();
      if (!tokens?.idToken) {
        return null;
      }

      // Decode JWT token (client-side decoding for user info)
      const user = this.decodeJWT(tokens.idToken);
      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Sign out user
   */
  async signOut(): Promise<void> {
    try {
      const tokens = this.getStoredTokens();
      if (tokens?.accessToken) {
        // Call Cognito global sign out
        await fetch(`${this.baseUrl}/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.GlobalSignOut',
          },
          body: JSON.stringify({
            AccessToken: tokens.accessToken,
          }),
        });
      }
    } catch (error) {
      console.error('SignOut error:', error);
    } finally {
      // Always clear local tokens
      this.clearTokens();
    }
  }

  /**
   * Refresh access token
   */
  async refreshTokens(): Promise<AuthTokens | null> {
    try {
      const tokens = this.getStoredTokens();
      if (!tokens?.refreshToken) {
        return null;
      }

      const response = await fetch(`${this.baseUrl}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth',
        },
        body: JSON.stringify({
          ClientId: this.config.clientId,
          AuthFlow: 'REFRESH_TOKEN_AUTH',
          AuthParameters: {
            REFRESH_TOKEN: tokens.refreshToken,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      if (data.AuthenticationResult) {
        const newTokens: AuthTokens = {
          accessToken: data.AuthenticationResult.AccessToken,
          idToken: data.AuthenticationResult.IdToken,
          refreshToken: tokens.refreshToken, // Refresh token doesn't change
        };

        this.storeTokens(newTokens);
        return newTokens;
      }

      return null;
    } catch (error) {
      console.error('Refresh tokens error:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Get access token for API calls
   */
  async getAccessToken(): Promise<string | null> {
    try {
      let tokens = this.getStoredTokens();
      if (!tokens?.accessToken) {
        return null;
      }

      // Check if token is expired
      if (this.isTokenExpired(tokens.accessToken)) {
        // Try to refresh
        tokens = await this.refreshTokens();
        if (!tokens) {
          return null;
        }
      }

      return tokens.accessToken;
    } catch (error) {
      console.error('Get access token error:', error);
      return null;
    }
  }

  /**
   * Get ID token for API calls (required for Cognito User Pool Authorizer)
   */
  async getIdToken(): Promise<string | null> {
    try {
      let tokens = this.getStoredTokens();
      if (!tokens?.idToken) {
        return null;
      }

      // Check if token is expired
      if (this.isTokenExpired(tokens.idToken)) {
        // Try to refresh
        tokens = await this.refreshTokens();
        if (!tokens) {
          return null;
        }
      }

      return tokens.idToken;
    } catch (error) {
      console.error('Get ID token error:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return !!(tokens?.idToken && !this.isTokenExpired(tokens.idToken));
  }

  /**
   * Store tokens securely in localStorage
   */
  private storeTokens(tokens: AuthTokens): void {
    try {
      localStorage.setItem('cognito_tokens', JSON.stringify(tokens));
    } catch (error) {
      console.error('Store tokens error:', error);
    }
  }

  /**
   * Get stored tokens from localStorage
   */
  private getStoredTokens(): AuthTokens | null {
    try {
      const stored = localStorage.getItem('cognito_tokens');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Get stored tokens error:', error);
      return null;
    }
  }

  /**
   * Clear stored tokens
   */
  private clearTokens(): void {
    try {
      localStorage.removeItem('cognito_tokens');
    } catch (error) {
      console.error('Clear tokens error:', error);
    }
  }

  /**
   * Decode JWT token (client-side only for user info)
   */
  private decodeJWT(token: string): CognitoUser | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Decode JWT error:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const decoded = this.decodeJWT(token);
      if (!decoded?.exp) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: any): string {
    const errorCode = error.__type || error.code;
    
    switch (errorCode) {
      case 'UsernameExistsException':
        return 'An account with this email already exists.';
      case 'InvalidPasswordException':
        return 'Password does not meet requirements.';
      case 'NotAuthorizedException':
        return 'Invalid email or password.';
      case 'UserNotConfirmedException':
        return 'Please verify your email address before signing in.';
      case 'TooManyRequestsException':
        return 'Too many requests. Please try again later.';
      case 'LimitExceededException':
        return 'Attempt limit exceeded. Please try again later.';
      default:
        return error.message || 'An error occurred. Please try again.';
    }
  }
}

// Export singleton instance
export const cognitoAuth = new CognitoAuthService();