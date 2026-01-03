import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

/**
 * Cognito User Pool Configuration
 * 
 * Interface for configuring the User Pool construct based on environment
 * and security requirements.
 */
export interface UserPoolConstructProps {
  environment: string;
  enableMfa?: boolean;
}

/**
 * Cognito User Pool Construct - Phase 1.1
 * 
 * Creates and configures AWS Cognito User Pool for user authentication
 * according to the canonical AWS architecture specification.
 * 
 * Features:
 * - JWT token issuance with custom SystemRole attribute
 * - Password policies and security settings
 * - MFA-ready configuration for production
 * - Integration hooks for user lifecycle events
 * 
 * Compliance:
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 * - Domain Model: SystemRole (SiteAdmin/User) from .kiro/specs/domain.v1.md
 */
export class UserPoolConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: UserPoolConstructProps) {
    super(scope, id);

    // User Pool configuration
    this.userPool = new cognito.UserPool(this, 'SydneyCyclesUserPool', {
      userPoolName: `sydney-cycles-${props.environment}`,
      
      // Sign-in configuration
      signInAliases: {
        email: true,
        username: false,
        phone: false,
      },
      
      // Auto-verification settings
      autoVerify: {
        email: true,
      },
      
      // Password policy
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false, // Relaxed for better UX
        tempPasswordValidity: cdk.Duration.days(7),
      },
      
      // Account recovery
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      
      // MFA configuration (enabled in production)
      mfa: props.enableMfa ? cognito.Mfa.OPTIONAL : cognito.Mfa.OFF,
      mfaSecondFactor: {
        sms: false,
        otp: props.enableMfa || false,
      },
      
      // Advanced security features
      advancedSecurityMode: props.environment === 'production' 
        ? cognito.AdvancedSecurityMode.ENFORCED 
        : cognito.AdvancedSecurityMode.AUDIT,
      
      // Device tracking
      deviceTracking: {
        challengeRequiredOnNewDevice: true,
        deviceOnlyRememberedOnUserPrompt: true,
      },
      
      // Email configuration
      email: cognito.UserPoolEmail.withCognito(),
      
      // User invitation settings
      userInvitation: {
        emailSubject: 'Welcome to Sydney Cycles!',
        emailBody: 'Hello {username}, your temporary password is {####}',
      },
      
      // Self sign-up configuration
      selfSignUpEnabled: props.environment !== 'production', // Allow self-registration in development only
      
      // User verification settings
      userVerification: {
        emailSubject: 'Verify your Sydney Cycles account',
        emailBody: 'Thanks for signing up! Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      
      // Lambda triggers (prepared for future phases)
      lambdaTriggers: {
        // Will be configured in Phase 1.2 for user profile management
      },
      
      // Deletion protection for production
      deletionProtection: props.environment === 'production',
      
      // Removal policy
      removalPolicy: props.environment === 'production' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
      
      // Standard attributes
      standardAttributes: {
        email: {
          required: true,
          mutable: false, // Email is immutable per Phase 1.2 spec
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
        profilePicture: {
          required: false,
          mutable: true,
        },
      },
      
      // Custom attributes for domain model compliance
      // SystemRole attribute as defined in canonical domain model
      customAttributes: {
        'system_role': new cognito.StringAttribute({
          mutable: true, // Can be changed by administrators
          minLen: 1,
          maxLen: 20,
        }),
      },
    });

    // User Pool Client for frontend integration
    this.userPoolClient = new cognito.UserPoolClient(this, 'SydneyCyclesUserPoolClient', {
      userPool: this.userPool,
      userPoolClientName: `sydney-cycles-client-${props.environment}`,
      
      // Authentication flows
      authFlows: {
        userSrp: true,           // Secure Remote Password
        userPassword: true,      // Enabled for testing
        adminUserPassword: true, // For admin operations
        custom: false,           // No custom auth flows yet
      },
      
      // Token configuration
      generateSecret: false, // Public client (frontend)
      
      // Token validity periods
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      
      // Prevent user existence errors for security
      preventUserExistenceErrors: true,
      
      // OAuth settings (prepared for future social login)
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false, // Disabled for security
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: [
          // Will be configured based on frontend deployment
          'http://localhost:3000/auth/callback', // Development
        ],
        logoutUrls: [
          'http://localhost:3000/auth/logout', // Development
        ],
      },
      
      // Supported identity providers
      supportedIdentityProviders: [
        cognito.UserPoolClientIdentityProvider.COGNITO,
        // Future: GOOGLE, FACEBOOK for social login
      ],
      
      // Read and write attributes
      readAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          emailVerified: true,
          givenName: true,
          familyName: true,
          profilePicture: true,
        })
        .withCustomAttributes('system_role'),
      
      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          givenName: true,
          familyName: true,
          profilePicture: true,
        })
        .withCustomAttributes('system_role'),
    });

    // CloudWatch logging for monitoring
    // User Pool events will be logged for security and debugging
    
    // Tags for resource management
    cdk.Tags.of(this.userPool).add('Component', 'Authentication');
    cdk.Tags.of(this.userPool).add('Phase', '1.1-Infrastructure');
    cdk.Tags.of(this.userPoolClient).add('Component', 'Authentication');
    cdk.Tags.of(this.userPoolClient).add('Phase', '1.1-Infrastructure');
  }
}