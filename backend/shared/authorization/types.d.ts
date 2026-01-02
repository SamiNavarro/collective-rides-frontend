/**
 * Authorization Types - Phase 1.3
 *
 * Core type definitions for the Authorization Service Foundation.
 * Defines system-level capabilities and authorization context.
 *
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */
import { AuthContext } from '../types/auth';
import { SystemRole } from '../types/user';
/**
 * System-level capabilities derived from user systemRole
 */
export declare enum SystemCapability {
    MANAGE_PLATFORM = "manage_platform",
    MANAGE_ALL_CLUBS = "manage_all_clubs"
}
/**
 * Enhanced authorization context with capability information
 */
export interface AuthorizationContext extends AuthContext {
    capabilities: SystemCapability[];
    hasCapability: (capability: SystemCapability) => boolean;
    canPerform: (action: string, resource?: string) => boolean;
}
/**
 * Authorization decision result
 */
export interface AuthorizationResult {
    granted: boolean;
    capability: SystemCapability;
    reason?: string;
    context: {
        userId: string;
        systemRole: SystemRole;
        timestamp: string;
    };
}
/**
 * Authorization request for specific capability check
 */
export interface AuthorizationRequest {
    authContext: AuthContext;
    capability: SystemCapability;
    resource?: {
        type: string;
        id: string;
        context?: Record<string, any>;
    };
}
/**
 * Capability cache entry for performance optimization
 */
export interface CapabilityCacheEntry {
    userId: string;
    systemRole: SystemRole;
    capabilities: SystemCapability[];
    expiresAt: Date;
}
/**
 * Authorization service interface
 */
export interface IAuthorizationService {
    /**
     * Create authorization context with derived capabilities
     */
    createAuthorizationContext(authContext: AuthContext): Promise<AuthorizationContext>;
    /**
     * Check if user has specific system capability
     */
    hasSystemCapability(authContext: AuthContext, capability: SystemCapability): Promise<boolean>;
    /**
     * Validate authorization for specific action
     */
    authorize(authContext: AuthContext, requiredCapability: SystemCapability, resource?: string): Promise<AuthorizationResult>;
}
/**
 * Capability resolver interface
 */
export interface ICapabilityResolver {
    /**
     * Derive system capabilities from user context
     */
    deriveCapabilities(authContext: AuthContext): Promise<SystemCapability[]>;
    /**
     * Check if system role grants specific capability
     */
    hasCapability(systemRole: SystemRole, capability: SystemCapability): boolean;
}
