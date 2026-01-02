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
export declare function requireCapability(capability: SystemCapability, resource?: string): AuthorizationMiddleware;
/**
 * Create middleware that requires platform management privileges
 */
export declare const requirePlatformManagement: AuthorizationMiddleware;
/**
 * Create middleware that requires club management privileges
 */
export declare const requireClubManagement: AuthorizationMiddleware;
/**
 * Authorization decorator for service methods
 *
 * @param capability - Required capability
 * @param resourceExtractor - Function to extract resource from method arguments
 */
export declare function Authorize(capability: SystemCapability, resourceExtractor?: (...args: any[]) => string): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
/**
 * Enhanced authorization context creator
 *
 * @param authContext - Base authentication context
 * @returns Enhanced authorization context
 */
export declare function createAuthorizationContext(authContext: AuthContext): Promise<AuthorizationContext>;
/**
 * Quick capability check utility
 *
 * @param authContext - Authentication context
 * @param capability - Capability to check
 * @returns True if user has capability
 */
export declare function hasCapability(authContext: AuthContext, capability: SystemCapability): Promise<boolean>;
/**
 * Authorization guard for Lambda handlers
 *
 * @param authContext - Authentication context
 * @param requiredCapabilities - Array of required capabilities (user needs at least one)
 * @param resource - Optional resource identifier
 * @throws InsufficientPrivilegesError if authorization fails
 */
export declare function authorizeRequest(authContext: AuthContext, requiredCapabilities: SystemCapability[], resource?: string): Promise<void>;
/**
 * Conditional authorization - only check if condition is met
 *
 * @param condition - Condition to check
 * @param authContext - Authentication context
 * @param capability - Required capability if condition is true
 * @param resource - Optional resource identifier
 */
export declare function authorizeIf(condition: boolean, authContext: AuthContext, capability: SystemCapability, resource?: string): Promise<void>;
/**
 * Authorization context validator
 *
 * @param authContext - Context to validate
 * @throws Error if context is invalid
 */
export declare function validateAuthContext(authContext: AuthContext): void;
