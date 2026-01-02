/**
 * Authentication Context - Phase 1.2
 *
 * Utilities for creating and managing user authentication context
 * from API Gateway events.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 */
import { APIGatewayProxyEvent } from 'aws-lambda';
import { AuthContext, LambdaRequestContext } from '../types/auth';
import { SystemRole } from '../types/user';
/**
 * Get authentication context from API Gateway event
 *
 * @param event - API Gateway proxy event
 * @returns Authentication context
 */
export declare function getAuthContext(event: APIGatewayProxyEvent): Promise<AuthContext>;
/**
 * Create authentication context from Lambda event request context
 *
 * @param requestContext - Lambda request context from API Gateway
 * @returns Authentication context
 * @throws Error if authentication context cannot be created
 */
export declare function createAuthContext(requestContext: LambdaRequestContext): AuthContext;
/**
 * Create enhanced authentication context with database-sourced role information
 *
 * @param requestContext - Lambda request context from API Gateway
 * @param userRepository - User repository for fetching current role
 * @returns Enhanced authentication context with current systemRole
 */
export declare function createEnhancedAuthContext(requestContext: LambdaRequestContext, userRepository: {
    getUserById: (id: string) => Promise<{
        systemRole: SystemRole;
    } | null>;
}): Promise<AuthContext>;
/**
 * Validate that user is authenticated
 *
 * @param authContext - Authentication context
 * @throws Error if user is not authenticated
 */
export declare function requireAuthentication(authContext: AuthContext): void;
/**
 * Validate that user is a site administrator
 *
 * @param authContext - Authentication context
 * @throws Error if user is not a site administrator
 */
export declare function requireSiteAdmin(authContext: AuthContext): void;
/**
 * Check if user can access another user's profile
 *
 * @param authContext - Authentication context
 * @param targetUserId - ID of the user being accessed
 * @returns True if access is allowed
 */
export declare function canAccessUser(authContext: AuthContext, targetUserId: string): boolean;
/**
 * Check if user can modify another user's profile
 *
 * @param authContext - Authentication context
 * @param targetUserId - ID of the user being modified
 * @returns True if modification is allowed
 */
export declare function canModifyUser(authContext: AuthContext, targetUserId: string): boolean;
/**
 * Check if user can modify system role
 *
 * @param authContext - Authentication context
 * @returns True if system role modification is allowed
 */
export declare function canModifySystemRole(authContext: AuthContext): boolean;
/**
 * Validate authentication context from API Gateway event
 *
 * @param event - API Gateway proxy event
 * @returns Authentication context
 * @throws Error if user is not authenticated
 */
export declare function validateAuthContext(event: APIGatewayProxyEvent): AuthContext;
