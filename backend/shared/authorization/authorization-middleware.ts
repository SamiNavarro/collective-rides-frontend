/**
 * Authorization Middleware - Phase 1.3
 * 
 * Middleware functions and decorators for common authorization patterns.
 * Provides reusable authorization logic for Lambda handlers and services.
 * 
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */

import { AuthContext } from '../types/auth';
import { SystemCapability, AuthorizationContext } from './types';
import { authorizationService } from './authorization-service';
import { InsufficientPrivilegesError } from './authorization-errors';
import { AuthorizationLogger } from './authorization-logger';

/**
 * Authorization middleware function type
 */
export type AuthorizationMiddleware = (authContext: AuthContext) => Promise<void>;

/**
 * Create middleware that requires specific capability
 * 
 * @param capability - Required system capability
 * @param resource - Optional resource identifier
 * @returns Authorization middleware function
 */
export function requireCapability(
  capability: SystemCapability,
  resource?: string
): AuthorizationMiddleware {
  return async (authContext: AuthContext): Promise<void> => {
    const result = await authorizationService.authorize(authContext, capability, resource);
    
    if (!result.granted) {
      throw new InsufficientPrivilegesError(capability, authContext.userId, resource);
    }
  };
}

/**
 * Create middleware that requires platform management privileges
 */
export const requirePlatformManagement = requireCapability(SystemCapability.MANAGE_PLATFORM);

/**
 * Create middleware that requires club management privileges
 */
export const requireClubManagement = requireCapability(SystemCapability.MANAGE_ALL_CLUBS);

/**
 * Authorization decorator for service methods
 * 
 * @param capability - Required capability
 * @param resourceExtractor - Function to extract resource from method arguments
 */
export function Authorize(
  capability: SystemCapability,
  resourceExtractor?: (...args: any[]) => string
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      // Find AuthContext in arguments (should be last parameter by convention)
      const authContext = args.find(arg => arg && typeof arg === 'object' && 'isAuthenticated' in arg) as AuthContext;
      
      if (!authContext) {
        throw new Error('AuthContext not found in method arguments');
      }
      
      // Extract resource if extractor provided
      const resource = resourceExtractor ? resourceExtractor(...args) : undefined;
      
      // Perform authorization check
      const result = await authorizationService.authorize(authContext, capability, resource);
      
      if (!result.granted) {
        throw new InsufficientPrivilegesError(capability, authContext.userId, resource);
      }
      
      // Call original method
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

/**
 * Enhanced authorization context creator
 * 
 * @param authContext - Base authentication context
 * @returns Enhanced authorization context
 */
export async function createAuthorizationContext(authContext: AuthContext): Promise<AuthorizationContext> {
  return await authorizationService.createAuthorizationContext(authContext);
}

/**
 * Quick capability check utility
 * 
 * @param authContext - Authentication context
 * @param capability - Capability to check
 * @returns True if user has capability
 */
export async function hasCapability(
  authContext: AuthContext,
  capability: SystemCapability
): Promise<boolean> {
  return await authorizationService.hasSystemCapability(authContext, capability);
}

/**
 * Authorization guard for Lambda handlers
 * 
 * @param authContext - Authentication context
 * @param requiredCapabilities - Array of required capabilities (user needs at least one)
 * @param resource - Optional resource identifier
 * @throws InsufficientPrivilegesError if authorization fails
 */
export async function authorizeRequest(
  authContext: AuthContext,
  requiredCapabilities: SystemCapability[],
  resource?: string
): Promise<void> {
  if (requiredCapabilities.length === 0) {
    return; // No authorization required
  }
  
  // Check if user has any of the required capabilities
  for (const capability of requiredCapabilities) {
    const hasCapability = await authorizationService.hasSystemCapability(authContext, capability);
    if (hasCapability) {
      return; // User has at least one required capability
    }
  }
  
  // User doesn't have any required capabilities
  const primaryCapability = requiredCapabilities[0];
  throw new InsufficientPrivilegesError(primaryCapability, authContext.userId, resource);
}

/**
 * Conditional authorization - only check if condition is met
 * 
 * @param condition - Condition to check
 * @param authContext - Authentication context
 * @param capability - Required capability if condition is true
 * @param resource - Optional resource identifier
 */
export async function authorizeIf(
  condition: boolean,
  authContext: AuthContext,
  capability: SystemCapability,
  resource?: string
): Promise<void> {
  if (condition) {
    await requireCapability(capability, resource)(authContext);
  }
}

/**
 * Authorization context validator
 * 
 * @param authContext - Context to validate
 * @throws Error if context is invalid
 */
export function validateAuthContext(authContext: AuthContext): void {
  if (!authContext) {
    throw new Error('AuthContext is required');
  }
  
  if (!authContext.isAuthenticated) {
    throw new Error('User must be authenticated');
  }
  
  if (!authContext.userId) {
    throw new Error('User ID is required');
  }
  
  if (!authContext.systemRole) {
    throw new Error('System role is required');
  }
}