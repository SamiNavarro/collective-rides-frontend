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
import { extractJwtClaims, getUserIdFromClaims, getEmailFromClaims, getSystemRoleFromClaims } from './jwt-utils';

/**
 * Get authentication context from API Gateway event
 * 
 * @param event - API Gateway proxy event
 * @returns Authentication context
 */
export async function getAuthContext(event: APIGatewayProxyEvent): Promise<AuthContext> {
  return createAuthContext(event.requestContext as LambdaRequestContext);
}

/**
 * Create authentication context from Lambda event request context
 * 
 * @param requestContext - Lambda request context from API Gateway
 * @returns Authentication context
 * @throws Error if authentication context cannot be created
 */
export function createAuthContext(requestContext: LambdaRequestContext): AuthContext {
  // Check if authorizer context exists (user is authenticated)
  if (!requestContext.authorizer) {
    return {
      userId: '',
      email: '',
      systemRole: SystemRole.USER,
      isAuthenticated: false,
      isSiteAdmin: false,
    };
  }
  
  try {
    // Extract JWT claims from API Gateway authorizer context
    const claims = extractJwtClaims(requestContext.authorizer);
    
    // Extract user information
    const userId = getUserIdFromClaims(claims);
    const email = getEmailFromClaims(claims);
    
    // Note: systemRole is determined from database, not JWT claims
    // This allows for real-time role changes without re-authentication
    const systemRole = SystemRole.USER; // Default, will be updated by service layer
    
    return {
      userId,
      email,
      systemRole,
      isAuthenticated: true,
      isSiteAdmin: false, // Will be updated by service layer
    };
  } catch (error) {
    throw new Error(`Failed to create auth context: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create enhanced authentication context with database-sourced role information
 * 
 * @param requestContext - Lambda request context from API Gateway
 * @param userRepository - User repository for fetching current role
 * @returns Enhanced authentication context with current systemRole
 */
export async function createEnhancedAuthContext(
  requestContext: LambdaRequestContext, 
  userRepository: { getUserById: (id: string) => Promise<{ systemRole: SystemRole } | null> }
): Promise<AuthContext> {
  const baseContext = createAuthContext(requestContext);
  
  if (!baseContext.isAuthenticated) {
    return baseContext;
  }
  
  try {
    // Fetch current user data from database to get accurate systemRole
    const userData = await userRepository.getUserById(baseContext.userId);
    
    if (userData) {
      return {
        ...baseContext,
        systemRole: userData.systemRole,
        isSiteAdmin: userData.systemRole === SystemRole.SITE_ADMIN,
      };
    }
    
    return baseContext;
  } catch (error) {
    // If database lookup fails, return base context with default role
    return baseContext;
  }
}

/**
 * Validate that user is authenticated
 * 
 * @param authContext - Authentication context
 * @throws Error if user is not authenticated
 */
export function requireAuthentication(authContext: AuthContext): void {
  if (!authContext.isAuthenticated) {
    throw new Error('Authentication required');
  }
}

/**
 * Validate that user is a site administrator
 * 
 * @param authContext - Authentication context
 * @throws Error if user is not a site administrator
 */
export function requireSiteAdmin(authContext: AuthContext): void {
  requireAuthentication(authContext);
  
  if (!authContext.isSiteAdmin) {
    throw new Error('Site administrator privileges required');
  }
}

/**
 * Check if user can access another user's profile
 * 
 * @param authContext - Authentication context
 * @param targetUserId - ID of the user being accessed
 * @returns True if access is allowed
 */
export function canAccessUser(authContext: AuthContext, targetUserId: string): boolean {
  if (!authContext.isAuthenticated) {
    return false;
  }
  
  // Users can access their own profile
  if (authContext.userId === targetUserId) {
    return true;
  }
  
  // Site admins can access any profile
  if (authContext.isSiteAdmin) {
    return true;
  }
  
  return false;
}

/**
 * Check if user can modify another user's profile
 * 
 * @param authContext - Authentication context
 * @param targetUserId - ID of the user being modified
 * @returns True if modification is allowed
 */
export function canModifyUser(authContext: AuthContext, targetUserId: string): boolean {
  return canAccessUser(authContext, targetUserId);
}

/**
 * Check if user can modify system role
 * 
 * @param authContext - Authentication context
 * @returns True if system role modification is allowed
 */
export function canModifySystemRole(authContext: AuthContext): boolean {
  return authContext.isSiteAdmin;
}

/**
 * Validate authentication context from API Gateway event
 * 
 * @param event - API Gateway proxy event
 * @returns Authentication context
 * @throws Error if user is not authenticated
 */
export function validateAuthContext(event: APIGatewayProxyEvent): AuthContext {
  const authContext = createAuthContext(event.requestContext as LambdaRequestContext);
  
  if (!authContext.isAuthenticated) {
    throw new Error('Authentication required');
  }
  
  return authContext;
}