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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci1wb29sLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidXNlci1wb29sLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLGlFQUFtRDtBQUNuRCwyQ0FBdUM7QUFhdkM7Ozs7Ozs7Ozs7Ozs7OztHQWVHO0FBQ0gsTUFBYSxpQkFBa0IsU0FBUSxzQkFBUztJQUk5QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTZCO1FBQ3JFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsMEJBQTBCO1FBQzFCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxzQkFBc0IsRUFBRTtZQUNqRSxZQUFZLEVBQUUsaUJBQWlCLEtBQUssQ0FBQyxXQUFXLEVBQUU7WUFFbEQsd0JBQXdCO1lBQ3hCLGFBQWEsRUFBRTtnQkFDYixLQUFLLEVBQUUsSUFBSTtnQkFDWCxRQUFRLEVBQUUsS0FBSztnQkFDZixLQUFLLEVBQUUsS0FBSzthQUNiO1lBRUQsNkJBQTZCO1lBQzdCLFVBQVUsRUFBRTtnQkFDVixLQUFLLEVBQUUsSUFBSTthQUNaO1lBRUQsa0JBQWtCO1lBQ2xCLGNBQWMsRUFBRTtnQkFDZCxTQUFTLEVBQUUsQ0FBQztnQkFDWixnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixnQkFBZ0IsRUFBRSxJQUFJO2dCQUN0QixhQUFhLEVBQUUsSUFBSTtnQkFDbkIsY0FBYyxFQUFFLEtBQUs7Z0JBQ3JCLG9CQUFvQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUMzQztZQUVELG1CQUFtQjtZQUNuQixlQUFlLEVBQUUsT0FBTyxDQUFDLGVBQWUsQ0FBQyxVQUFVO1lBRW5ELDRDQUE0QztZQUM1QyxHQUFHLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxD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QUFJO2FBQ3JCLENBQUM7aUJBQ0Qsb0JBQW9CLENBQUMsYUFBYSxDQUFDO1NBQ3ZDLENBQUMsQ0FBQztRQUVILG9DQUFvQztRQUNwQyw2REFBNkQ7UUFFN0QsK0JBQStCO1FBQy9CLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFDOUQsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUM5RCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3BFLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLG9CQUFvQixDQUFDLENBQUM7SUFDdEUsQ0FBQztDQUNGO0FBbE1ELDhDQWtNQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG4vKipcbiAqIENvZ25pdG8gVXNlciBQb29sIENvbmZpZ3VyYXRpb25cbiAqIFxuICogSW50ZXJmYWNlIGZvciBjb25maWd1cmluZyB0aGUgVXNlciBQb29sIGNvbnN0cnVjdCBiYXNlZCBvbiBlbnZpcm9ubWVudFxuICogYW5kIHNlY3VyaXR5IHJlcXVpcmVtZW50cy5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBVc2VyUG9vbENvbnN0cnVjdFByb3BzIHtcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgZW5hYmxlTWZhPzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBDb2duaXRvIFVzZXIgUG9vbCBDb25zdHJ1Y3QgLSBQaGFzZSAxLjFcbiAqIFxuICogQ3JlYXRlcyBhbmQgY29uZmlndXJlcyBBV1MgQ29nbml0byBVc2VyIFBvb2wgZm9yIHVzZXIgYXV0aGVudGljYXRpb25cbiAqIGFjY29yZGluZyB0byB0aGUgY2Fub25pY2FsIEFXUyBhcmNoaXRlY3R1cmUgc3BlY2lmaWNhdGlvbi5cbiAqIFxuICogRmVhdHVyZXM6XG4gKiAtIEpXVCB0b2tlbiBpc3N1YW5jZSB3aXRoIGN1c3RvbSBTeXN0ZW1Sb2xlIGF0dHJpYnV0ZVxuICogLSBQYXNzd29yZCBwb2xpY2llcyBhbmQgc2VjdXJpdHkgc2V0dGluZ3NcbiAqIC0gTUZBLXJlYWR5IGNvbmZpZ3VyYXRpb24gZm9yIHByb2R1Y3Rpb25cbiAqIC0gSW50ZWdyYXRpb24gaG9va3MgZm9yIHVzZXIgbGlmZWN5Y2xlIGV2ZW50c1xuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBBV1MgQXJjaGl0ZWN0dXJlOiAua2lyby9zcGVjcy9hcmNoaXRlY3R1cmUuYXdzLnYxLm1kXG4gKiAtIERvbWFpbiBNb2RlbDogU3lzdGVtUm9sZSAoU2l0ZUFkbWluL1VzZXIpIGZyb20gLmtpcm8vc3BlY3MvZG9tYWluLnYxLm1kXG4gKi9cbmV4cG9ydCBjbGFzcyBVc2VyUG9vbENvbnN0cnVjdCBleHRlbmRzIENvbnN0cnVjdCB7XG4gIHB1YmxpYyByZWFkb25seSB1c2VyUG9vbDogY29nbml0by5Vc2VyUG9vbDtcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJQb29sQ2xpZW50OiBjb2duaXRvLlVzZXJQb29sQ2xpZW50O1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBVc2VyUG9vbENvbnN0cnVjdFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIFVzZXIgUG9vbCBjb25maWd1cmF0aW9uXG4gICAgdGhpcy51c2VyUG9vbCA9IG5ldyBjb2duaXRvLlVzZXJQb29sKHRoaXMsICdTeWRuZXlDeWNsZXNVc2VyUG9vbCcsIHtcbiAgICAgIHVzZXJQb29sTmFtZTogYHN5ZG5leS1jeWNsZXMtJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgXG4gICAgICAvLyBTaWduLWluIGNvbmZpZ3VyYXRpb25cbiAgICAgIHNpZ25JbkFsaWFzZXM6IHtcbiAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgIHVzZXJuYW1lOiBmYWxzZSxcbiAgICAgICAgcGhvbmU6IGZhbHNlLFxuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8gQXV0by12ZXJpZmljYXRpb24gc2V0dGluZ3NcbiAgICAgIGF1dG9WZXJpZnk6IHtcbiAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBQYXNzd29yZCBwb2xpY3lcbiAgICAgIHBhc3N3b3JkUG9saWN5OiB7XG4gICAgICAgIG1pbkxlbmd0aDogOCxcbiAgICAgICAgcmVxdWlyZUxvd2VyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVVwcGVyY2FzZTogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZURpZ2l0czogdHJ1ZSxcbiAgICAgICAgcmVxdWlyZVN5bWJvbHM6IGZhbHNlLCAvLyBSZWxheGVkIGZvciBiZXR0ZXIgVVhcbiAgICAgICAgdGVtcFBhc3N3b3JkVmFsaWRpdHk6IGNkay5EdXJhdGlvbi5kYXlzKDcpLFxuICAgICAgfSxcbiAgICAgIFxuICAgICAgLy8gQWNjb3VudCByZWNvdmVyeVxuICAgICAgYWNjb3VudFJlY292ZXJ5OiBjb2duaXRvLkFjY291bnRSZWNvdmVyeS5FTUFJTF9PTkxZLFxuICAgICAgXG4gICAgICAvLyBNRkEgY29uZmlndXJhdGlvbiAoZW5hYmxlZCBpbiBwcm9kdWN0aW9uKVxuICAgICAgbWZhOiBwcm9wcy5lbmFibGVNZmEgPyBjb2duaXRvLk1mYS5PUFRJT05BTCA6IGNvZ25pdG8uTWZhLk9GRixcbiAgICAgIG1mYVNlY29uZEZhY3Rvcjoge1xuICAgICAgICBzbXM6IGZhbHNlLFxuICAgICAgICBvdHA6IHByb3BzLmVuYWJsZU1mYSB8fCBmYWxzZSxcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIEFkdmFuY2VkIHNlY3VyaXR5IGZlYXR1cmVzXG4gICAgICBhZHZhbmNlZFNlY3VyaXR5TW9kZTogcHJvcHMuZW52aXJvbm1lbnQgPT09ICdwcm9kdWN0aW9uJyBcbiAgICAgICAgPyBjb2duaXRvLkFkdmFuY2VkU2VjdXJpdHlNb2RlLkVORk9SQ0VEIFxuICAgICAgICA6IGNvZ25pdG8uQWR2YW5jZWRTZWN1cml0eU1vZGUuQVVESVQsXG4gICAgICBcbiAgICAgIC8vIERldmljZSB0cmFja2luZ1xuICAgICAgZGV2aWNlVHJhY2tpbmc6IHtcbiAgICAgICAgY2hhbGxlbmdlUmVxdWlyZWRPbk5ld0RldmljZTogdHJ1ZSxcbiAgICAgICAgZGV2aWNlT25seVJlbWVtYmVyZWRPblVzZXJQcm9tcHQ6IHRydWUsXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBFbWFpbCBjb25maWd1cmF0aW9uXG4gICAgICBlbWFpbDogY29nbml0by5Vc2VyUG9vbEVtYWlsLndpdGhDb2duaXRvKCksXG4gICAgICBcbiAgICAgIC8vIFVzZXIgaW52aXRhdGlvbiBzZXR0aW5nc1xuICAgICAgdXNlckludml0YXRpb246IHtcbiAgICAgICAgZW1haWxTdWJqZWN0OiAnV2VsY29tZSB0byBTeWRuZXkgQ3ljbGVzIScsXG4gICAgICAgIGVtYWlsQm9keTogJ0hlbGxvIHt1c2VybmFtZX0sIHlvdXIgdGVtcG9yYXJ5IHBhc3N3b3JkIGlzIHsjIyMjfScsXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBVc2VyIHZlcmlmaWNhdGlvbiBzZXR0aW5nc1xuICAgICAgdXNlclZlcmlmaWNhdGlvbjoge1xuICAgICAgICBlbWFpbFN1YmplY3Q6ICdWZXJpZnkgeW91ciBTeWRuZXkgQ3ljbGVzIGFjY291bnQnLFxuICAgICAgICBlbWFpbEJvZHk6ICdUaGFua3MgZm9yIHNpZ25pbmcgdXAhIFlvdXIgdmVyaWZpY2F0aW9uIGNvZGUgaXMgeyMjIyN9JyxcbiAgICAgICAgZW1haWxTdHlsZTogY29nbml0by5WZXJpZmljYXRpb25FbWFpbFN0eWxlLkNPREUsXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBMYW1iZGEgdHJpZ2dlcnMgKHByZXBhcmVkIGZvciBmdXR1cmUgcGhhc2VzKVxuICAgICAgbGFtYmRhVHJpZ2dlcnM6IHtcbiAgICAgICAgLy8gV2lsbCBiZSBjb25maWd1cmVkIGluIFBoYXNlIDEuMiBmb3IgdXNlciBwcm9maWxlIG1hbmFnZW1lbnRcbiAgICAgIH0sXG4gICAgICBcbiAgICAgIC8vIERlbGV0aW9uIHByb3RlY3Rpb24gZm9yIHByb2R1Y3Rpb25cbiAgICAgIGRlbGV0aW9uUHJvdGVjdGlvbjogcHJvcHMuZW52aXJvbm1lbnQgPT09ICdwcm9kdWN0aW9uJyxcbiAgICAgIFxuICAgICAgLy8gUmVtb3ZhbCBwb2xpY3lcbiAgICAgIHJlbW92YWxQb2xpY3k6IHByb3BzLmVudmlyb25tZW50ID09PSAncHJvZHVjdGlvbicgXG4gICAgICAgID8gY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOIFxuICAgICAgICA6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgICBcbiAgICAgIC8vIFN0YW5kYXJkIGF0dHJpYnV0ZXNcbiAgICAgIHN0YW5kYXJkQXR0cmlidXRlczoge1xuICAgICAgICBlbWFpbDoge1xuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG11dGFibGU6IGZhbHNlLCAvLyBFbWFpbCBpcyBpbW11dGFibGUgcGVyIFBoYXNlIDEuMiBzcGVjXG4gICAgICAgIH0sXG4gICAgICAgIGdpdmVuTmFtZToge1xuICAgICAgICAgIHJlcXVpcmVkOiBmYWxzZSxcbiAgICAgICAgICBtdXRhYmxlOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgICBmYW1pbHlOYW1lOiB7XG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG11dGFibGU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIHByb2ZpbGVQaWN0dXJlOiB7XG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlLFxuICAgICAgICAgIG11dGFibGU6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBDdXN0b20gYXR0cmlidXRlcyBmb3IgZG9tYWluIG1vZGVsIGNvbXBsaWFuY2VcbiAgICAgIC8vIFN5c3RlbVJvbGUgYXR0cmlidXRlIGFzIGRlZmluZWQgaW4gY2Fub25pY2FsIGRvbWFpbiBtb2RlbFxuICAgICAgY3VzdG9tQXR0cmlidXRlczoge1xuICAgICAgICAnc3lzdGVtX3JvbGUnOiBuZXcgY29nbml0by5TdHJpbmdBdHRyaWJ1dGUoe1xuICAgICAgICAgIG11dGFibGU6IHRydWUsIC8vIENhbiBiZSBjaGFuZ2VkIGJ5IGFkbWluaXN0cmF0b3JzXG4gICAgICAgICAgbWluTGVuOiAxLFxuICAgICAgICAgIG1heExlbjogMjAsXG4gICAgICAgIH0pLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFVzZXIgUG9vbCBDbGllbnQgZm9yIGZyb250ZW5kIGludGVncmF0aW9uXG4gICAgdGhpcy51c2VyUG9vbENsaWVudCA9IG5ldyBjb2duaXRvLlVzZXJQb29sQ2xpZW50KHRoaXMsICdTeWRuZXlDeWNsZXNVc2VyUG9vbENsaWVudCcsIHtcbiAgICAgIHVzZXJQb29sOiB0aGlzLnVzZXJQb29sLFxuICAgICAgdXNlclBvb2xDbGllbnROYW1lOiBgc3lkbmV5LWN5Y2xlcy1jbGllbnQtJHtwcm9wcy5lbnZpcm9ubWVudH1gLFxuICAgICAgXG4gICAgICAvLyBBdXRoZW50aWNhdGlvbiBmbG93c1xuICAgICAgYXV0aEZsb3dzOiB7XG4gICAgICAgIHVzZXJTcnA6IHRydWUsICAgICAgICAgICAvLyBTZWN1cmUgUmVtb3RlIFBhc3N3b3JkXG4gICAgICAgIHVzZXJQYXNzd29yZDogdHJ1ZSwgICAgICAvLyBFbmFibGVkIGZvciB0ZXN0aW5nXG4gICAgICAgIGFkbWluVXNlclBhc3N3b3JkOiB0cnVlLCAvLyBGb3IgYWRtaW4gb3BlcmF0aW9uc1xuICAgICAgICBjdXN0b206IGZhbHNlLCAgICAgICAgICAgLy8gTm8gY3VzdG9tIGF1dGggZmxvd3MgeWV0XG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBUb2tlbiBjb25maWd1cmF0aW9uXG4gICAgICBnZW5lcmF0ZVNlY3JldDogZmFsc2UsIC8vIFB1YmxpYyBjbGllbnQgKGZyb250ZW5kKVxuICAgICAgXG4gICAgICAvLyBUb2tlbiB2YWxpZGl0eSBwZXJpb2RzXG4gICAgICBhY2Nlc3NUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uaG91cnMoMSksXG4gICAgICBpZFRva2VuVmFsaWRpdHk6IGNkay5EdXJhdGlvbi5ob3VycygxKSxcbiAgICAgIHJlZnJlc2hUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uZGF5cygzMCksXG4gICAgICBcbiAgICAgIC8vIFByZXZlbnQgdXNlciBleGlzdGVuY2UgZXJyb3JzIGZvciBzZWN1cml0eVxuICAgICAgcHJldmVudFVzZXJFeGlzdGVuY2VFcnJvcnM6IHRydWUsXG4gICAgICBcbiAgICAgIC8vIE9BdXRoIHNldHRpbmdzIChwcmVwYXJlZCBmb3IgZnV0dXJlIHNvY2lhbCBsb2dpbilcbiAgICAgIG9BdXRoOiB7XG4gICAgICAgIGZsb3dzOiB7XG4gICAgICAgICAgYXV0aG9yaXphdGlvbkNvZGVHcmFudDogdHJ1ZSxcbiAgICAgICAgICBpbXBsaWNpdENvZGVHcmFudDogZmFsc2UsIC8vIERpc2FibGVkIGZvciBzZWN1cml0eVxuICAgICAgICB9LFxuICAgICAgICBzY29wZXM6IFtcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuRU1BSUwsXG4gICAgICAgICAgY29nbml0by5PQXV0aFNjb3BlLk9QRU5JRCxcbiAgICAgICAgICBjb2duaXRvLk9BdXRoU2NvcGUuUFJPRklMRSxcbiAgICAgICAgXSxcbiAgICAgICAgY2FsbGJhY2tVcmxzOiBbXG4gICAgICAgICAgLy8gV2lsbCBiZSBjb25maWd1cmVkIGJhc2VkIG9uIGZyb250ZW5kIGRlcGxveW1lbnRcbiAgICAgICAgICAnaHR0cDovL2xvY2FsaG9zdDozMDAwL2F1dGgvY2FsbGJhY2snLCAvLyBEZXZlbG9wbWVudFxuICAgICAgICBdLFxuICAgICAgICBsb2dvdXRVcmxzOiBbXG4gICAgICAgICAgJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMC9hdXRoL2xvZ291dCcsIC8vIERldmVsb3BtZW50XG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgXG4gICAgICAvLyBTdXBwb3J0ZWQgaWRlbnRpdHkgcHJvdmlkZXJzXG4gICAgICBzdXBwb3J0ZWRJZGVudGl0eVByb3ZpZGVyczogW1xuICAgICAgICBjb2duaXRvLlVzZXJQb29sQ2xpZW50SWRlbnRpdHlQcm92aWRlci5DT0dOSVRPLFxuICAgICAgICAvLyBGdXR1cmU6IEdPT0dMRSwgRkFDRUJPT0sgZm9yIHNvY2lhbCBsb2dpblxuICAgICAgXSxcbiAgICAgIFxuICAgICAgLy8gUmVhZCBhbmQgd3JpdGUgYXR0cmlidXRlc1xuICAgICAgcmVhZEF0dHJpYnV0ZXM6IG5ldyBjb2duaXRvLkNsaWVudEF0dHJpYnV0ZXMoKVxuICAgICAgICAud2l0aFN0YW5kYXJkQXR0cmlidXRlcyh7XG4gICAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgICAgZW1haWxWZXJpZmllZDogdHJ1ZSxcbiAgICAgICAgICBnaXZlbk5hbWU6IHRydWUsXG4gICAgICAgICAgZmFtaWx5TmFtZTogdHJ1ZSxcbiAgICAgICAgICBwcm9maWxlUGljdHVyZTogdHJ1ZSxcbiAgICAgICAgfSlcbiAgICAgICAgLndpdGhDdXN0b21BdHRyaWJ1dGVzKCdzeXN0ZW1fcm9sZScpLFxuICAgICAgXG4gICAgICB3cml0ZUF0dHJpYnV0ZXM6IG5ldyBjb2duaXRvLkNsaWVudEF0dHJpYnV0ZXMoKVxuICAgICAgICAud2l0aFN0YW5kYXJkQXR0cmlidXRlcyh7XG4gICAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgICAgZ2l2ZW5OYW1lOiB0cnVlLFxuICAgICAgICAgIGZhbWlseU5hbWU6IHRydWUsXG4gICAgICAgICAgcHJvZmlsZVBpY3R1cmU6IHRydWUsXG4gICAgICAgIH0pXG4gICAgICAgIC53aXRoQ3VzdG9tQXR0cmlidXRlcygnc3lzdGVtX3JvbGUnKSxcbiAgICB9KTtcblxuICAgIC8vIENsb3VkV2F0Y2ggbG9nZ2luZyBmb3IgbW9uaXRvcmluZ1xuICAgIC8vIFVzZXIgUG9vbCBldmVudHMgd2lsbCBiZSBsb2dnZWQgZm9yIHNlY3VyaXR5IGFuZCBkZWJ1Z2dpbmdcbiAgICBcbiAgICAvLyBUYWdzIGZvciByZXNvdXJjZSBtYW5hZ2VtZW50XG4gICAgY2RrLlRhZ3Mub2YodGhpcy51c2VyUG9vbCkuYWRkKCdDb21wb25lbnQnLCAnQXV0aGVudGljYXRpb24nKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLnVzZXJQb29sKS5hZGQoJ1BoYXNlJywgJzEuMS1JbmZyYXN0cnVjdHVyZScpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMudXNlclBvb2xDbGllbnQpLmFkZCgnQ29tcG9uZW50JywgJ0F1dGhlbnRpY2F0aW9uJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy51c2VyUG9vbENsaWVudCkuYWRkKCdQaGFzZScsICcxLjEtSW5mcmFzdHJ1Y3R1cmUnKTtcbiAgfVxufSJdfQ==