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
export declare class UserPoolConstruct extends Construct {
    readonly userPool: cognito.UserPool;
    readonly userPoolClient: cognito.UserPoolClient;
    constructor(scope: Construct, id: string, props: UserPoolConstructProps);
}
