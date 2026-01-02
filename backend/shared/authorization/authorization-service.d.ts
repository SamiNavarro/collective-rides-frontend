/**
 * Authorization Service - Phase 1.3
 *
 * Core authorization service implementation providing system-level
 * authorization capabilities derived from user systemRole.
 *
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */
import { AuthContext } from '../types/auth';
import { SystemCapability, AuthorizationContext, AuthorizationResult, IAuthorizationService, CapabilityCacheEntry } from './types';
import { ClubCapability } from '../types/club-authorization';
/**
 * Authorization service implementation
 */
export declare class AuthorizationService implements IAuthorizationService {
    private capabilityResolver;
    private capabilityCache;
    constructor();
    /**
     * Create authorization context with derived capabilities
     *
     * @param authContext - Base authentication context
     * @returns Enhanced authorization context
     */
    createAuthorizationContext(authContext: AuthContext): Promise<AuthorizationContext>;
    /**
     * Check if user has specific system capability
     *
     * @param authContext - Authentication context
     * @param capability - Required capability
     * @returns True if user has capability
     */
    hasSystemCapability(authContext: AuthContext, capability: SystemCapability): Promise<boolean>;
    /**
     * Validate authorization for specific action
     *
     * @param authContext - Authentication context
     * @param requiredCapability - Required capability
     * @param resource - Optional resource identifier
     * @returns Authorization result
     */
    authorize(authContext: AuthContext, requiredCapability: SystemCapability, resource?: string): Promise<AuthorizationResult>;
    /**
     * Get capabilities with caching
     *
     * @param authContext - Authentication context
     * @returns Array of capabilities
     */
    private getCachedCapabilities;
    /**
     * Clean up expired cache entries
     */
    private cleanupExpiredCache;
    /**
     * Clear cache for specific user (useful for testing or role changes)
     *
     * @param userId - User ID to clear cache for
     */
    clearUserCache(userId: string): void;
    /**
     * Get cache statistics for monitoring
     */
    getCacheStats(): {
        size: number;
        entries: CapabilityCacheEntry[];
    };
    /**
     * Check if user has specific club capability
     *
     * @param userId - User ID
     * @param clubId - Club ID
     * @param capability - Required club capability
     * @returns True if user has capability
     */
    hasCapability(userId: string, clubId: string, capability: ClubCapability): Promise<boolean>;
}
/**
 * Singleton instance for shared usage across Lambda functions
 */
export declare const authorizationService: AuthorizationService;
