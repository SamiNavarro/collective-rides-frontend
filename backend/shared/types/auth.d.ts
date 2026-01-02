/**
 * Authentication and Authorization Types - Phase 1.2
 *
 * Type definitions for JWT claims and authentication context as used
 * in the Phase 1.2 User Profile Service.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 */
import { SystemRole } from './user';
/**
 * JWT claims extracted from Cognito token
 * These are provided by API Gateway after JWT validation
 */
export interface JwtClaims {
    /** Cognito user ID (sub claim) */
    sub: string;
    /** Email address */
    email: string;
    /** Token issued at timestamp */
    iat: number;
    /** Token expiration timestamp */
    exp: number;
    /** Token issuer */
    iss: string;
    /** Audience */
    aud: string;
    /** Custom system role attribute (if set) */
    'custom:system_role'?: string;
}
/**
 * User authentication context
 * Extracted from API Gateway event after JWT validation
 */
export interface AuthContext {
    /** User ID (from JWT sub claim) */
    userId: string;
    /** Email address (from JWT email claim) */
    email: string;
    /** System role (from custom attribute or default to User) */
    systemRole: SystemRole;
    /** Whether the user is authenticated */
    isAuthenticated: boolean;
    /** Whether the user is a site administrator */
    isSiteAdmin: boolean;
    /** System-level capabilities */
    systemCapabilities?: string[];
    /** Club memberships (populated by club service) */
    clubMemberships?: Array<{
        membershipId: string;
        clubId: string;
        role: string;
        status: string;
        joinedAt: string;
    }>;
}
/**
 * API Gateway authorizer context
 * Structure provided by API Gateway after Cognito authorization
 */
export interface ApiGatewayAuthorizerContext {
    claims?: {
        sub: string;
        email: string;
        iat: string;
        exp: string;
        iss: string;
        aud: string;
        'custom:system_role'?: string;
        [key: string]: string | undefined;
    };
    [key: string]: any;
}
/**
 * Lambda event request context (subset relevant to auth)
 */
export interface LambdaRequestContext {
    requestId: string;
    authorizer?: ApiGatewayAuthorizerContext | null;
    identity: {
        sourceIp: string;
        userAgent: string | null;
    };
}
