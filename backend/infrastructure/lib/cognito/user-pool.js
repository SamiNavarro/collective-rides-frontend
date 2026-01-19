"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserPoolConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
const constructs_1 = require("constructs");
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
class UserPoolConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
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
                requireSymbols: false,
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
            selfSignUpEnabled: props.environment !== 'production',
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
                    mutable: true,
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
                userSrp: true,
                userPassword: true,
                adminUserPassword: true,
                custom: false, // No custom auth flows yet
            },
            // Token configuration
            generateSecret: false,
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
exports.UserPoolConstruct = UserPoolConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci1wb29sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidXNlci1wb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLGlFQUFtRDtBQUNuRCwyQ0FBdUM7QUFhdkM7Ozs7Ozs7Ozs7Ozs7OztHQWVHO0FBQ0gsTUFBYSxpQkFBa0IsU0FBUSxzQkFBUztJQUk5QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTZCO1FBQ3JFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsMEJBQTBCO1FBQzFCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUNqRSxZQUFZLEVBQUUsaUJBQWlCLEtBQUssQ0FBQyxXQUFXLEVBQUU7WUFFbEQsd0JBQXdCO1lBQ3hCLGFBQWEsRUFBRTtnQkFDYixLQUFLLEVBQUUsSUFBSTtnQkFDWCxRQUFRLEVBQUUsS0FBSztnQkFDZixLQUFLLEVBQUUsS0FBSzthQUNiO1lBRUQsNkJBQTZCO1lBQzdCLFVBQVUsRUFBRTtnQkFDVixLQUFLLEVBQUUsSUFBSTthQUNaO1lBRUQsa0JBQWtCO1lBQ2xCLGNBQWMsRUFBRTtnQkFDZCxTQUFTLEVBQUUsQ0FBQztnQkFDWixnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixhQUFhLEVBQUUsSUFBSTtnQkFDbkIsY0FBYyxFQUFFLEtBQUs7Z0JBQ3JCLG9CQUFvQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUMzQztZQUVELG1CQUFtQjtZQUNuQixlQUFlLEVBQUUsT0FBTyxDQUFDLGVBQWUsQ0FBQyxVQUFVO1lBRW5ELDRDQUE0QztZQUM1QyxHQUFHLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxD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WCxTQUFTLEVBQUUsSUFBSTtnQkFDZixVQUFVLEVBQUUsSUFBSTtnQkFDaEIsY0FBYyxFQUFFLElBQUk7YUFDckIsQ0FBQztpQkFDRCxvQkFBb0IsQ0FBQyxhQUFhLENBQUM7U0FDdkMsQ0FBQyxDQUFDO1FBRUgsb0NBQW9DO1FBQ3BDLDZEQUE2RDtRQUU3RCwrQkFBK0I7UUFDL0IsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUM5RCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQzlELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDcEUsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztJQUN0RSxDQUFDO0NBQ0Y7QUFyTUQsOENBcU1DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbi8qKlxuICogQ29nbml0byBVc2VyIFBvb2wgQ29uZmlndXJhdGlvblxuICogXG4gKiBJbnRlcmZhY2UgZm9yIGNvbmZpZ3VyaW5nIHRoZSBVc2VyIFBvb2wgY29uc3RydWN0IGJhc2VkIG9uIGVudmlyb25tZW50XG4gKiBhbmQgc2VjdXJpdHkgcmVxdWlyZW1lbnRzLlxuICovXG5leHBvcnQgaW50ZXJmYWNlIFVzZXJQb29sQ29uc3RydWN0UHJvcHMge1xuICBlbnZpcm9ubWVudDogc3RyaW5nO1xuICBlbmFibGVNZmE/OiBib29sZWFuO1xufVxuXG4vKipcbiAqIENvZ25pdG8gVXNlciBQb29sIENvbnN0cnVjdCAtIFBoYXNlIDEuMVxuICogXG4gKiBDcmVhdGVzIGFuZCBjb25maWd1cmVzIEFXUyBDb2duaXRvIFVzZXIgUG9vbCBmb3IgdXNlciBhdXRoZW50aWNhdGlvblxuICogYWNjb3JkaW5nIHRvIHRoZSBjYW5vbmljYWwgQVdTIGFyY2hpdGVjdHVyZSBzcGVjaWZpY2F0aW9uLlxuICogXG4gKiBGZWF0dXJlczpcbiAqIC0gSldUIHRva2VuIGlzc3VhbmNlIHdpdGggY3VzdG9tIFN5c3RlbVJvbGUgYXR0cmlidXRlXG4gKiAtIFBhc3N3b3JkIHBvbGljaWVzIGFuZCBzZWN1cml0eSBzZXR0aW5nc1xuICogLSBNRkEtcmVhZHkgY29uZmlndXJhdGlvbiBmb3IgcHJvZHVjdGlvblxuICogLSBJbnRlZ3JhdGlvbiBob29rcyBmb3IgdXNlciBsaWZlY3ljbGUgZXZlbnRzXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIEFXUyBBcmNoaXRlY3R1cmU6IC5raXJvL3NwZWNzL2FyY2hpdGVjdHVyZS5hd3MudjEubWRcbiAqIC0gRG9tYWluIE1vZGVsOiBTeXN0ZW1Sb2xlIChTaXRlQWRtaW4vVXNlcikgZnJvbSAua2lyby9zcGVjcy9kb21haW4udjEubWRcbiAqL1xuZXhwb3J0IGNsYXNzIFVzZXJQb29sQ29uc3RydWN0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJQb29sOiBjb2duaXRvLlVzZXJQb29sO1xuICBwdWJsaWMgcmVhZG9ubHkgdXNlclBvb2xDbGllbnQ6IGNvZ25pdG8uVXNlclBvb2xDbGllbnQ7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFVzZXJQb29sQ29uc3RydWN0UHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8gVXNlciBQb29sIGNvbmZpZ3VyYXRpb25cbiAgICB0aGlzLnVzZXJQb29sID0gbmV3IGNvZ25pdG8uVXNlclBvb2wodGhpcywgJ1N5ZG5leUN5Y2xlc1VzZXJQb29sJywge1xuICAgICAgdXNlclBvb2xOYW1lOiBgc3lkbmV5LWN5Y2xlcy0ke3Byb3BzLmVudmlyb25tZW50fWAsXG4gICAgICBcbiAgICAgIC8vIFNpZ24taW4gY29uZmlndXJhdGlvblxuICAgICAgc2lnbkluQWxpYXNlczoge1xuICAgICAgICBlbWFpbDogdHJ1ZSxcbiAgICAgICAgdXNlcm5hbWU6IGZhbHNlLFxuICAgICAgICBwaG9uZTogZmFsc2UsXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBBdXRvLXZlcmlmaWNhdGlvbiBzZXR0aW5nc1xuICAgICAgYXV0b1ZlcmlmeToge1xuICAgICAgICBlbWFpbDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIFBhc3N3b3JkIHBvbGljeVxuICAgICAgcGFzc3dvcmRQb2xpY3k6IHtcbiAgICAgICAgbWluTGVuZ3RoOiA4LFxuICAgICAgICByZXF1aXJlTG93ZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlVXBwZXJjYXNlOiB0cnVlLFxuICAgICAgICByZXF1aXJlRGlnaXRzOiB0cnVlLFxuICAgICAgICByZXF1aXJlU3ltYm9sczogZmFsc2UsIC8vIFJlbGF4ZWQgZm9yIGJldHRlciBVWFxuICAgICAgICB0ZW1wUGFzc3dvcmRWYWxpZGl0eTogY2RrLkR1cmF0aW9uLmRheXMoNyksXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBBY2NvdW50IHJlY292ZXJ5XG4gICAgICBhY2NvdW50UmVjb3Zlcnk6IGNvZ25pdG8uQWNjb3VudFJlY292ZXJ5LkVNQUlMX09OTFksXG4gICAgICBcbiAgICAgIC8vIE1GQSBjb25maWd1cmF0aW9uIChlbmFibGVkIGluIHByb2R1Y3Rpb24pXG4gICAgICBtZmE6IHByb3BzLmVuYWJsZU1mYSA/IGNvZ25pdG8uTWZhLk9QVElPTkFMIDogY29nbml0by5NZmEuT0ZGLFxuICAgICAgbWZhU2Vjb25kRmFjdG9yOiB7XG4gICAgICAgIHNtczogZmFsc2UsXG4gICAgICAgIG90cDogcHJvcHMuZW5hYmxlTWZhIHx8IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8gQWR2YW5jZWQgc2VjdXJpdHkgZmVhdHVyZXNcbiAgICAgIGFkdmFuY2VkU2VjdXJpdHlNb2RlOiBwcm9wcy5lbnZpcm9ubWVudCA9PT0gJ3Byb2R1Y3Rpb24nIFxuICAgICAgICA/IGNvZ25pdG8uQWR2YW5jZWRTZWN1cml0eU1vZGUuRU5GT1JDRUQgXG4gICAgICAgIDogY29nbml0by5BZHZhbmNlZFNlY3VyaXR5TW9kZS5BVURJVCxcbiAgICAgIFxuICAgICAgLy8gRGV2aWNlIHRyYWNraW5nXG4gICAgICBkZXZpY2VUcmFja2luZzoge1xuICAgICAgICBjaGFsbGVuZ2VSZXF1aXJlZE9uTmV3RGV2aWNlOiB0cnVlLFxuICAgICAgICBkZXZpY2VPbmx5UmVtZW1iZXJlZE9uVXNlclByb21wdDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIEVtYWlsIGNvbmZpZ3VyYXRpb25cbiAgICAgIGVtYWlsOiBjb2duaXRvLlVzZXJQb29sRW1haWwud2l0aENvZ25pdG8oKSxcbiAgICAgIFxuICAgICAgLy8gVXNlciBpbnZpdGF0aW9uIHNldHRpbmdzXG4gICAgICB1c2VySW52aXRhdGlvbjoge1xuICAgICAgICBlbWFpbFN1YmplY3Q6ICdXZWxjb21lIHRvIFN5ZG5leSBDeWNsZXMhJyxcbiAgICAgICAgZW1haWxCb2R5OiAnSGVsbG8ge3VzZXJuYW1lfSwgeW91ciB0ZW1wb3JhcnkgcGFzc3dvcmQgaXMgeyMjIyN9JyxcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIFNlbGYgc2lnbi11cCBjb25maWd1cmF0aW9uXG4gICAgICBzZWxmU2lnblVwRW5hYmxlZDogcHJvcHMuZW52aXJvbm1lbnQgIT09ICdwcm9kdWN0aW9uJywgLy8gQWxsb3cgc2VsZi1yZWdpc3RyYXRpb24gaW4gZGV2ZWxvcG1lbnQgb25seVxuICAgICAgXG4gICAgICAvLyBVc2VyIHZlcmlmaWNhdGlvbiBzZXR0aW5nc1xuICAgICAgdXNlclZlcmlmaWNhdGlvbjoge1xuICAgICAgICBlbWFpbFN1YmplY3Q6ICdWZXJpZnkgeW91ciBTeWRuZXkgQ3ljbGVzIGFjY291bnQnLFxuICAgICAgICBlbWFpbEJvZHk6ICdUaGFua3MgZm9yIHNpZ25pbmcgdXAhIFlvdXIgdmVyaWZpY2F0aW9uIGNvZGUgaXMgeyMjIyN9JyxcbiAgICAgICAgZW1haWxTdHlsZTogY29nbml0by5WZXJpZmljYXRpb25FbWFpbFN0eWxlLkNPREUsXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBMYW1iZGEgdHJpZ2dlcnMgKHByZXBhcmVkIGZvciBmdXR1cmUgcGhhc2VzKVxuICAgICAgbGFtYmRhVHJpZ2dlcnM6IHtcbiAgICAgICAgLy8gV2lsbCBiZSBjb25maWd1cmVkIGluIFBoYXNlIDEuMiBmb3IgdXNlciBwcm9maWxlIG1hbmFnZW1lbnRcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIERlbGV0aW9uIHByb3RlY3Rpb24gZm9yIHByb2R1Y3Rpb25cbiAgICAgIGRlbGV0aW9uUHJvdGVjdGlvbjogcHJvcHMuZW52aXJvbm1lbnQgPT09ICdwcm9kdWN0aW9uJyxcbiAgICAgIFxuICAgICAgLy8gUmVtb3ZhbCBwb2xpY3lcbiAgICAgIHJlbW92YWxQb2xpY3k6IHByb3BzLmVudmlyb25tZW50ID09PSAncHJvZHVjdGlvbicgXG4gICAgICAgID8gY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOIFxuICAgICAgICA6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBcbiAgICAgIC8vIFN0YW5kYXJkIGF0dHJpYnV0ZXNcbiAgICAgIHN0YW5kYXJkQXR0cmlidXRlczoge1xuICAgICAgICBlbWFpbDoge1xuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG11dGFibGU6IGZhbHNlLCAvLyBFbWFpbCBpcyBpbW11dGFibGUgcGVyIFBoYXNlIDEuMiBzcGVjXG4gICAgICAgIH0sXG4gICAgICAgIGdpdmVuTmFtZToge1xuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBmYW1pbHlOYW1lOiB7XG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG11dGFibGU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHByb2ZpbGVQaWN0dXJlOiB7XG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG11dGFibGU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBDdXN0b20gYXR0cmlidXRlcyBmb3IgZG9tYWluIG1vZGVsIGNvbXBsaWFuY2VcbiAgICAgIC8vIFN5c3RlbVJvbGUgYXR0cmlidXRlIGFzIGRlZmluZWQgaW4gY2Fub25pY2FsIGRvbWFpbiBtb2RlbFxuICAgICAgY3VzdG9tQXR0cmlidXRlczoge1xuICAgICAgICAnc3lzdGVtX3JvbGUnOiBuZXcgY29nbml0by5TdHJpbmdBdHRyaWJ1dGUoe1xuICAgICAgICAgIG11dGFibGU6IHRydWUsIC8vIENhbiBiZSBjaGFuZ2VkIGJ5IGFkbWluaXN0cmF0b3JzXG4gICAgICAgICAgbWluTGVuOiAxLFxuICAgICAgICAgIG1heExlbjogMjAsXG4gICAgICAgIH0pLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFVzZXIgUG9vbCBDbGllbnQgZm9yIGZyb250ZW5kIGludGVncmF0aW9uXG4gICAgdGhpcy51c2VyUG9vbENsaWVudCA9IG5ldyBjb2duaXRvLlVzZXJQb29sQ2xpZW50KHRoaXMsICdTeWRuZXlDeWNsZXNVc2VyUG9vbENsaWVudCcsIHtcbiAgICAgIHVzZXJQb29sOiB0aGlzLnVzZXJQb29sLFxuICAgICAgdXNlclBvb2xDbGllbnROYW1lOiBgc3lkbmV5LWN5Y2xlcy1jbGllbnQtJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgXG4gICAgICAvLyBBdXRoZW50aWNhdGlvbiBmbG93c1xuICAgICAgYXV0aEZsb3dzOiB7XG4gICAgICAgIHVzZXJTcnA6IHRydWUsICAgICAgICAgICAvLyBTZWN1cmUgUmVtb3RlIFBhc3N3b3JkXG4gICAgICAgIHVzZXJQYXNzd29yZDogdHJ1ZSwgICAgICAvLyBFbmFibGVkIGZvciB0ZXN0aW5nXG4gICAgICAgIGFkbWluVXNlclBhc3N3b3JkOiB0cnVlLCAvLyBGb3IgYWRtaW4gb3BlcmF0aW9uc1xuICAgICAgICBjdXN0b206IGZhbHNlLCAgICAgICAgICAgLy8gTm8gY3VzdG9tIGF1dGggZmxvd3MgeWV0XG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBUb2tlbiBjb25maWd1cmF0aW9uXG4gICAgICBnZW5lcmF0ZVNlY3JldDogZmFsc2UsIC8vIFB1YmxpYyBjbGllbnQgKGZyb250ZW5kKVxuICAgICAgXG4gICAgICAvLyBUb2tlbiB2YWxpZGl0eSBwZXJpb2RzXG4gICAgICBhY2Nlc3NUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uaG91cnMoMSksXG4gICAgICBpZFRva2VuVmFsaWRpdHk6IGNkay5EdXJhdGlvbi5ob3VycygxKSxcbiAgICAgIHJlZnJlc2hUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uZGF5cygzMCksXG4gICAgICBcbiAgICAgIC8vIFByZXZlbnQgdXNlciBleGlzdGVuY2UgZXJyb3JzIGZvciBzZWN1cml0eVxuICAgICAgcHJldmVudFVzZXJFeGlzdGVuY2VFcnJvcnM6IHRydWUsXG4gICAgICBcbiAgICAgIC8vIE9BdXRoIHNldHRpbmdzIChwcmVwYXJlZCBmb3IgZnV0dXJlIHNvY2lhbCBsb2dpbilcbiAgICAgIG9BdXRoOiB7XG4gICAgICAgIGZsb3dzOiB7XG4gICAgICAgICAgYXV0aG9yaXphdGlvbkNvZGVHcmFudDogdHJ1ZSxcbiAgICAgICAgICBpbXBsaWNpdENvZGVHcmFudDogZmFsc2UsIC8vIERpc2FibGVkIGZvciBzZWN1cml0eVxuICAgICAgICB9LFxuICAgICAgICBzY29wZXM6IFtcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuRU1BSUwsXG4gICAgICAgICAgY29nbml0by5PQXV0aFNjb3BlLk9QRU5JRCxcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuUFJPRklMRSxcbiAgICAgICAgXSxcbiAgICAgICAgY2FsbGJhY2tVcmxzOiBbXG4gICAgICAgICAgLy8gV2lsbCBiZSBjb25maWd1cmVkIGJhc2VkIG9uIGZyb250ZW5kIGRlcGxveW1lbnRcbiAgICAgICAgICAnaHR0cDovL2xvY2FsaG9zdDozMDAwL2F1dGgvY2FsbGJhY2snLCAvLyBEZXZlbG9wbWVudFxuICAgICAgICBdLFxuICAgICAgICBsb2dvdXRVcmxzOiBbXG4gICAgICAgICAgJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9hdXRoL2xvZ291dCcsIC8vIERldmVsb3BtZW50XG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBTdXBwb3J0ZWQgaWRlbnRpdHkgcHJvdmlkZXJzXG4gICAgICBzdXBwb3J0ZWRJZGVudGl0eVByb3ZpZGVyczogW1xuICAgICAgICBjb2duaXRvLlVzZXJQb29sQ2xpZW50SWRlbnRpdHlQcm92aWRlci5DT0dOSVRPLFxuICAgICAgICAvLyBGdXR1cmU6IEdPT0dMRSwgRkFDRUJPT0sgZm9yIHNvY2lhbCBsb2dpblxuICAgICAgXSxcbiAgICAgIFxuICAgICAgLy8gUmVhZCBhbmQgd3JpdGUgYXR0cmlidXRlc1xuICAgICAgcmVhZEF0dHJpYnV0ZXM6IG5ldyBjb2duaXRvLkNsaWVudEF0dHJpYnV0ZXMoKVxuICAgICAgICAud2l0aFN0YW5kYXJkQXR0cmlidXRlcyh7XG4gICAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgICAgZW1haWxWZXJpZmllZDogdHJ1ZSxcbiAgICAgICAgICBnaXZlbk5hbWU6IHRydWUsXG4gICAgICAgICAgZmFtaWx5TmFtZTogdHJ1ZSxcbiAgICAgICAgICBwcm9maWxlUGljdHVyZTogdHJ1ZSxcbiAgICAgICAgfSlcbiAgICAgICAgLndpdGhDdXN0b21BdHRyaWJ1dGVzKCdzeXN0ZW1fcm9sZScpLFxuICAgICAgXG4gICAgICB3cml0ZUF0dHJpYnV0ZXM6IG5ldyBjb2duaXRvLkNsaWVudEF0dHJpYnV0ZXMoKVxuICAgICAgICAud2l0aFN0YW5kYXJkQXR0cmlidXRlcyh7XG4gICAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgICAgZ2l2ZW5OYW1lOiB0cnVlLFxuICAgICAgICAgIGZhbWlseU5hbWU6IHRydWUsXG4gICAgICAgICAgcHJvZmlsZVBpY3R1cmU6IHRydWUsXG4gICAgICAgIH0pXG4gICAgICAgIC53aXRoQ3VzdG9tQXR0cmlidXRlcygnc3lzdGVtX3JvbGUnKSxcbiAgICB9KTtcblxuICAgIC8vIENsb3VkV2F0Y2ggbG9nZ2luZyBmb3IgbW9uaXRvcmluZ1xuICAgIC8vIFVzZXIgUG9vbCBldmVudHMgd2lsbCBiZSBsb2dnZWQgZm9yIHNlY3VyaXR5IGFuZCBkZWJ1Z2dpbmdcbiAgICBcbiAgICAvLyBUYWdzIGZvciByZXNvdXJjZSBtYW5hZ2VtZW50XG4gICAgY2RrLlRhZ3Mub2YodGhpcy51c2VyUG9vbCkuYWRkKCdDb21wb25lbnQnLCAnQXV0aGVudGljYXRpb24nKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLnVzZXJQb29sKS5hZGQoJ1BoYXNlJywgJzEuMS1JbmZyYXN0cnVjdHVyZScpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMudXNlclBvb2xDbGllbnQpLmFkZCgnQ29tcG9uZW50JywgJ0F1dGhlbnRpY2F0aW9uJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy51c2VyUG9vbENsaWVudCkuYWRkKCdQaGFzZScsICcxLjEtSW5mcmFzdHJ1Y3R1cmUnKTtcbiAgfVxufSJdfQ==