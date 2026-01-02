"use strict";
/**
 * Authorization Service - Phase 1.3
 *
 * Core authorization service implementation providing system-level
 * authorization capabilities derived from user systemRole.
 *
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizationService = exports.AuthorizationService = void 0;
const types_1 = require("./types");
const capability_resolver_1 = require("./capability-resolver");
const authorization_errors_1 = require("./authorization-errors");
const authorization_logger_1 = require("./authorization-logger");
/**
 * Cache TTL: 5 minutes (balance between performance and consistency)
 */
const CAPABILITY_CACHE_TTL = 5 * 60 * 1000;
/**
 * Authorization service implementation
 */
class AuthorizationService {
    constructor() {
        this.capabilityResolver = new capability_resolver_1.CapabilityResolver();
        this.capabilityCache = new Map();
        // Clean up expired cache entries periodically
        setInterval(() => this.cleanupExpiredCache(), CAPABILITY_CACHE_TTL);
    }
    /**
     * Create authorization context with derived capabilities
     *
     * @param authContext - Base authentication context
     * @returns Enhanced authorization context
     */
    async createAuthorizationContext(authContext) {
        const startTime = Date.now();
        try {
            if (!authContext.isAuthenticated) {
                throw new authorization_errors_1.AuthorizationServiceError('Cannot create authorization context for unauthenticated user');
            }
            // Get capabilities (with caching)
            const capabilities = await this.getCachedCapabilities(authContext);
            // Create enhanced context
            const authorizationContext = {
                ...authContext,
                capabilities,
                hasCapability: (capability) => capabilities.includes(capability),
                canPerform: (action, resource) => {
                    // For now, map actions to capabilities (can be extended later)
                    const capabilityMap = {
                        'manage_platform': types_1.SystemCapability.MANAGE_PLATFORM,
                        'manage_all_clubs': types_1.SystemCapability.MANAGE_ALL_CLUBS,
                    };
                    const requiredCapability = capabilityMap[action];
                    return requiredCapability ? capabilities.includes(requiredCapability) : false;
                },
            };
            const duration = Date.now() - startTime;
            authorization_logger_1.AuthorizationLogger.logPerformanceMetrics('create_authorization_context', duration, authContext.userId);
            return authorizationContext;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            authorization_logger_1.AuthorizationLogger.logAuthorizationError(authContext.userId, authContext.systemRole, error instanceof Error ? error : new Error('Unknown error'), undefined, undefined, undefined, duration);
            throw error instanceof authorization_errors_1.AuthorizationError
                ? error
                : new authorization_errors_1.AuthorizationServiceError('Failed to create authorization context', error);
        }
    }
    /**
     * Check if user has specific system capability
     *
     * @param authContext - Authentication context
     * @param capability - Required capability
     * @returns True if user has capability
     */
    async hasSystemCapability(authContext, capability) {
        const startTime = Date.now();
        try {
            authorization_logger_1.AuthorizationLogger.logAuthorizationCheck(authContext.userId, authContext.systemRole, capability);
            const capabilities = await this.getCachedCapabilities(authContext);
            const hasCapability = capabilities.includes(capability);
            const duration = Date.now() - startTime;
            if (hasCapability) {
                authorization_logger_1.AuthorizationLogger.logAuthorizationGranted(authContext.userId, authContext.systemRole, capability, undefined, undefined, duration);
            }
            else {
                authorization_logger_1.AuthorizationLogger.logAuthorizationDenied(authContext.userId, authContext.systemRole, capability, 'User does not have required capability', undefined, undefined, duration);
            }
            return hasCapability;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            authorization_logger_1.AuthorizationLogger.logAuthorizationError(authContext.userId, authContext.systemRole, error instanceof Error ? error : new Error('Unknown error'), capability, undefined, undefined, duration);
            // Fail-safe: deny access on error
            return false;
        }
    }
    /**
     * Validate authorization for specific action
     *
     * @param authContext - Authentication context
     * @param requiredCapability - Required capability
     * @param resource - Optional resource identifier
     * @returns Authorization result
     */
    async authorize(authContext, requiredCapability, resource) {
        const startTime = Date.now();
        try {
            authorization_logger_1.AuthorizationLogger.logAuthorizationCheck(authContext.userId, authContext.systemRole, requiredCapability, resource);
            const hasCapability = await this.hasSystemCapability(authContext, requiredCapability);
            const duration = Date.now() - startTime;
            const result = {
                granted: hasCapability,
                capability: requiredCapability,
                reason: hasCapability ? undefined : 'Insufficient privileges',
                context: {
                    userId: authContext.userId,
                    systemRole: authContext.systemRole,
                    timestamp: new Date().toISOString(),
                },
            };
            if (!hasCapability) {
                authorization_logger_1.AuthorizationLogger.logAuthorizationDenied(authContext.userId, authContext.systemRole, requiredCapability, 'Insufficient privileges', resource, undefined, duration);
            }
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            authorization_logger_1.AuthorizationLogger.logAuthorizationError(authContext.userId, authContext.systemRole, error instanceof Error ? error : new Error('Unknown error'), requiredCapability, resource, undefined, duration);
            // Fail-safe: deny access on error
            return {
                granted: false,
                capability: requiredCapability,
                reason: 'Authorization service error',
                context: {
                    userId: authContext.userId,
                    systemRole: authContext.systemRole,
                    timestamp: new Date().toISOString(),
                },
            };
        }
    }
    /**
     * Get capabilities with caching
     *
     * @param authContext - Authentication context
     * @returns Array of capabilities
     */
    async getCachedCapabilities(authContext) {
        const cacheKey = `${authContext.userId}:${authContext.systemRole}`;
        const cached = this.capabilityCache.get(cacheKey);
        // Check cache validity
        if (cached && cached.expiresAt > new Date()) {
            authorization_logger_1.AuthorizationLogger.logCacheEvent('hit', authContext.userId, authContext.systemRole, cached.capabilities);
            return cached.capabilities;
        }
        // Cache miss - derive capabilities
        authorization_logger_1.AuthorizationLogger.logCacheEvent('miss', authContext.userId, authContext.systemRole);
        const capabilities = await this.capabilityResolver.deriveCapabilities(authContext);
        // Cache the result
        const cacheEntry = {
            userId: authContext.userId,
            systemRole: authContext.systemRole,
            capabilities,
            expiresAt: new Date(Date.now() + CAPABILITY_CACHE_TTL),
        };
        this.capabilityCache.set(cacheKey, cacheEntry);
        authorization_logger_1.AuthorizationLogger.logCacheEvent('set', authContext.userId, authContext.systemRole, capabilities);
        return capabilities;
    }
    /**
     * Clean up expired cache entries
     */
    cleanupExpiredCache() {
        const now = new Date();
        const expiredKeys = [];
        for (const [key, entry] of this.capabilityCache.entries()) {
            if (entry.expiresAt <= now) {
                expiredKeys.push(key);
            }
        }
        for (const key of expiredKeys) {
            const entry = this.capabilityCache.get(key);
            if (entry) {
                this.capabilityCache.delete(key);
                authorization_logger_1.AuthorizationLogger.logCacheEvent('evict', entry.userId, entry.systemRole);
            }
        }
    }
    /**
     * Clear cache for specific user (useful for testing or role changes)
     *
     * @param userId - User ID to clear cache for
     */
    clearUserCache(userId) {
        const keysToDelete = [];
        for (const [key, entry] of this.capabilityCache.entries()) {
            if (entry.userId === userId) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            const entry = this.capabilityCache.get(key);
            if (entry) {
                this.capabilityCache.delete(key);
                authorization_logger_1.AuthorizationLogger.logCacheEvent('evict', entry.userId, entry.systemRole);
            }
        }
    }
    /**
     * Get cache statistics for monitoring
     */
    getCacheStats() {
        return {
            size: this.capabilityCache.size,
            entries: Array.from(this.capabilityCache.values()),
        };
    }
    /**
     * Check if user has specific club capability
     *
     * @param userId - User ID
     * @param clubId - Club ID
     * @param capability - Required club capability
     * @returns True if user has capability
     */
    async hasCapability(userId, clubId, capability) {
        try {
            // This is a simplified implementation for MVP
            // In a full implementation, you would:
            // 1. Get user's club membership from database
            // 2. Check the user's role in the club
            // 3. Verify the role has the required capability
            // For now, we'll assume this method is called with proper context
            // and the capability checking is done in the handlers
            // TODO: Implement proper club membership lookup
            // This would require database access to get user's club membership
            return true; // Placeholder - actual implementation needed
        }
        catch (error) {
            console.error('Error checking club capability:', error);
            return false;
        }
    }
}
exports.AuthorizationService = AuthorizationService;
/**
 * Singleton instance for shared usage across Lambda functions
 */
exports.authorizationService = new AuthorizationService();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aG9yaXphdGlvbi1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXV0aG9yaXphdGlvbi1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBSUgsbUNBTWlCO0FBRWpCLCtEQUEyRDtBQUMzRCxpRUFLZ0M7QUFDaEMsaUVBQTZEO0FBRTdEOztHQUVHO0FBQ0gsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztBQUUzQzs7R0FFRztBQUNILE1BQWEsb0JBQW9CO0lBSS9CO1FBQ0UsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksd0NBQWtCLEVBQUUsQ0FBQztRQUNuRCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksR0FBRyxFQUFFLENBQUM7UUFFakMsOENBQThDO1FBQzlDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLEVBQUUsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3RFLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxXQUF3QjtRQUN2RCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFN0IsSUFBSTtZQUNGLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFO2dCQUNoQyxNQUFNLElBQUksZ0RBQXlCLENBQUMsOERBQThELENBQUMsQ0FBQzthQUNyRztZQUVELGtDQUFrQztZQUNsQyxNQUFNLFlBQVksR0FBRyxNQUFNLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUVuRSwwQkFBMEI7WUFDMUIsTUFBTSxvQkFBb0IsR0FBeUI7Z0JBQ2pELEdBQUcsV0FBVztnQkFDZCxZQUFZO2dCQUNaLGFBQWEsRUFBRSxDQUFDLFVBQTRCLEVBQUUsRUFBRSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDO2dCQUNsRixV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Q25ELENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILEtBQUssQ0FBQyxhQUFhLENBQ2pCLE1BQWMsRUFDZCxNQUFjLEVBQ2QsVUFBMEI7UUFFMUIsSUFBSTtZQUNGLDhDQUE4QztZQUM5Qyx1Q0FBdUM7WUFDdkMsOENBQThDO1lBQzlDLHVDQUF1QztZQUN2QyxpREFBaUQ7WUFFakQsa0VBQWtFO1lBQ2xFLHNEQUFzRDtZQUV0RCxnREFBZ0Q7WUFDaEQsbUVBQW1FO1lBRW5FLE9BQU8sSUFBSSxDQUFDLENBQUMsNkNBQTZDO1NBQzNEO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLGlDQUFpQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3hELE9BQU8sS0FBSyxDQUFDO1NBQ2Q7SUFDSCxDQUFDO0NBQ0Y7QUFsVkQsb0RBa1ZDO0FBRUQ7O0dBRUc7QUFDVSxRQUFBLG9CQUFvQixHQUFHLElBQUksb0JBQW9CLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQXV0aG9yaXphdGlvbiBTZXJ2aWNlIC0gUGhhc2UgMS4zXG4gKiBcbiAqIENvcmUgYXV0aG9yaXphdGlvbiBzZXJ2aWNlIGltcGxlbWVudGF0aW9uIHByb3ZpZGluZyBzeXN0ZW0tbGV2ZWxcbiAqIGF1dGhvcml6YXRpb24gY2FwYWJpbGl0aWVzIGRlcml2ZWQgZnJvbSB1c2VyIHN5c3RlbVJvbGUuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDEuMyBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0xLjMuYXV0aG9yaXphdGlvbi5mb3VuZGF0aW9uLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgQXV0aENvbnRleHQgfSBmcm9tICcuLi90eXBlcy9hdXRoJztcbmltcG9ydCB7IFN5c3RlbVJvbGUgfSBmcm9tICcuLi90eXBlcy91c2VyJztcbmltcG9ydCB7XG4gIFN5c3RlbUNhcGFiaWxpdHksXG4gIEF1dGhvcml6YXRpb25Db250ZXh0LFxuICBBdXRob3JpemF0aW9uUmVzdWx0LFxuICBJQXV0aG9yaXphdGlvblNlcnZpY2UsXG4gIENhcGFiaWxpdHlDYWNoZUVudHJ5LFxufSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IENsdWJDYXBhYmlsaXR5LCBnZXRDYXBhYmlsaXRpZXNGb3JSb2xlIH0gZnJvbSAnLi4vdHlwZXMvY2x1Yi1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IENhcGFiaWxpdHlSZXNvbHZlciB9IGZyb20gJy4vY2FwYWJpbGl0eS1yZXNvbHZlcic7XG5pbXBvcnQge1xuICBBdXRob3JpemF0aW9uRXJyb3IsXG4gIEluc3VmZmljaWVudFByaXZpbGVnZXNFcnJvcixcbiAgQXV0aG9yaXphdGlvblNlcnZpY2VFcnJvcixcbiAgVXNlckRhdGFVbmF2YWlsYWJsZUVycm9yLFxufSBmcm9tICcuL2F1dGhvcml6YXRpb24tZXJyb3JzJztcbmltcG9ydCB7IEF1dGhvcml6YXRpb25Mb2dnZXIgfSBmcm9tICcuL2F1dGhvcml6YXRpb24tbG9nZ2VyJztcblxuLyoqXG4gKiBDYWNoZSBUVEw6IDUgbWludXRlcyAoYmFsYW5jZSBiZXR3ZWVuIHBlcmZvcm1hbmNlIGFuZCBjb25zaXN0ZW5jeSlcbiAqL1xuY29uc3QgQ0FQQUJJTElUWV9DQUNIRV9UVEwgPSA1ICogNjAgKiAxMDAwO1xuXG4vKipcbiAqIEF1dGhvcml6YXRpb24gc2VydmljZSBpbXBsZW1lbnRhdGlvblxuICovXG5leHBvcnQgY2xhc3MgQXV0aG9yaXphdGlvblNlcnZpY2UgaW1wbGVtZW50cyBJQXV0aG9yaXphdGlvblNlcnZpY2Uge1xuICBwcml2YXRlIGNhcGFiaWxpdHlSZXNvbHZlcjogQ2FwYWJpbGl0eVJlc29sdmVyO1xuICBwcml2YXRlIGNhcGFiaWxpdHlDYWNoZTogTWFwPHN0cmluZywgQ2FwYWJpbGl0eUNhY2hlRW50cnk+O1xuICBcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5jYXBhYmlsaXR5UmVzb2x2ZXIgPSBuZXcgQ2FwYWJpbGl0eVJlc29sdmVyKCk7XG4gICAgdGhpcy5jYXBhYmlsaXR5Q2FjaGUgPSBuZXcgTWFwKCk7XG4gICAgXG4gICAgLy8gQ2xlYW4gdXAgZXhwaXJlZCBjYWNoZSBlbnRyaWVzIHBlcmlvZGljYWxseVxuICAgIHNldEludGVydmFsKCgpID0+IHRoaXMuY2xlYW51cEV4cGlyZWRDYWNoZSgpLCBDQVBBQklMSVRZX0NBQ0hFX1RUTCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGUgYXV0aG9yaXphdGlvbiBjb250ZXh0IHdpdGggZGVyaXZlZCBjYXBhYmlsaXRpZXNcbiAgICogXG4gICAqIEBwYXJhbSBhdXRoQ29udGV4dCAtIEJhc2UgYXV0aGVudGljYXRpb24gY29udGV4dFxuICAgKiBAcmV0dXJucyBFbmhhbmNlZCBhdXRob3JpemF0aW9uIGNvbnRleHRcbiAgICovXG4gIGFzeW5jIGNyZWF0ZUF1dGhvcml6YXRpb25Db250ZXh0KGF1dGhDb250ZXh0OiBBdXRoQ29udGV4dCk6IFByb21pc2U8QXV0aG9yaXphdGlvbkNvbnRleHQ+IHtcbiAgICBjb25zdCBzdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgIFxuICAgIHRyeSB7XG4gICAgICBpZiAoIWF1dGhDb250ZXh0LmlzQXV0aGVudGljYXRlZCkge1xuICAgICAgICB0aHJvdyBuZXcgQXV0aG9yaXphdGlvblNlcnZpY2VFcnJvcignQ2Fubm90IGNyZWF0ZSBhdXRob3JpemF0aW9uIGNvbnRleHQgZm9yIHVuYXV0aGVudGljYXRlZCB1c2VyJyk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIC8vIEdldCBjYXBhYmlsaXRpZXMgKHdpdGggY2FjaGluZylcbiAgICAgIGNvbnN0IGNhcGFiaWxpdGllcyA9IGF3YWl0IHRoaXMuZ2V0Q2FjaGVkQ2FwYWJpbGl0aWVzKGF1dGhDb250ZXh0KTtcbiAgICAgIFxuICAgICAgLy8gQ3JlYXRlIGVuaGFuY2VkIGNvbnRleHRcbiAgICAgIGNvbnN0IGF1dGhvcml6YXRpb25Db250ZXh0OiBBdXRob3JpemF0aW9uQ29udGV4dCA9IHtcbiAgICAgICAgLi4uYXV0aENvbnRleHQsXG4gICAgICAgIGNhcGFiaWxpdGllcyxcbiAgICAgICAgaGFzQ2FwYWJpbGl0eTogKGNhcGFiaWxpdHk6IFN5c3RlbUNhcGFiaWxpdHkpID0+IGNhcGFiaWxpdGllcy5pbmNsdWRlcyhjYXBhYmlsaXR5KSxcbiAgICAgICAgY2FuUGVyZm9ybTogKGFjdGlvbjogc3RyaW5nLCByZXNvdXJjZT86IHN0cmluZykgPT4ge1xuICAgICAgICAgIC8vIEZvciBub3csIG1hcCBhY3Rpb25zIHRvIGNhcGFiaWxpdGllcyAoY2FuIGJlIGV4dGVuZGVkIGxhdGVyKVxuICAgICAgICAgIGNvbnN0IGNhcGFiaWxpdHlNYXA6IFJlY29yZDxzdHJpbmcsIFN5c3RlbUNhcGFiaWxpdHk+ID0ge1xuICAgICAgICAgICAgJ21hbmFnZV9wbGF0Zm9ybSc6IFN5c3RlbUNhcGFiaWxpdHkuTUFOQUdFX1BMQVRGT1JNLFxuICAgICAgICAgICAgJ21hbmFnZV9hbGxfY2x1YnMnOiBTeXN0ZW1DYXBhYmlsaXR5Lk1BTkFHRV9BTExfQ0xVQlMsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCByZXF1aXJlZENhcGFiaWxpdHkgPSBjYXBhYmlsaXR5TWFwW2FjdGlvbl07XG4gICAgICAgICAgcmV0dXJuIHJlcXVpcmVkQ2FwYWJpbGl0eSA/IGNhcGFiaWxpdGllcy5pbmNsdWRlcyhyZXF1aXJlZENhcGFiaWxpdHkpIDogZmFsc2U7XG4gICAgICAgIH0sXG4gICAgICB9O1xuICAgICAgXG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBcbiAgICAgIEF1dGhvcml6YXRpb25Mb2dnZXIubG9nUGVyZm9ybWFuY2VNZXRyaWNzKFxuICAgICAgICAnY3JlYXRlX2F1dGhvcml6YXRpb25fY29udGV4dCcsXG4gICAgICAgIGR1cmF0aW9uLFxuICAgICAgICBhdXRoQ29udGV4dC51c2VySWRcbiAgICAgICk7XG4gICAgICBcbiAgICAgIHJldHVybiBhdXRob3JpemF0aW9uQ29udGV4dDtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgXG4gICAgICBBdXRob3JpemF0aW9uTG9nZ2VyLmxvZ0F1dGhvcml6YXRpb25FcnJvcihcbiAgICAgICAgYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgICBhdXRoQ29udGV4dC5zeXN0ZW1Sb2xlLFxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoJ1Vua25vd24gZXJyb3InKSxcbiAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgZHVyYXRpb25cbiAgICAgICk7XG4gICAgICBcbiAgICAgIHRocm93IGVycm9yIGluc3RhbmNlb2YgQXV0aG9yaXphdGlvbkVycm9yIFxuICAgICAgICA/IGVycm9yIFxuICAgICAgICA6IG5ldyBBdXRob3JpemF0aW9uU2VydmljZUVycm9yKCdGYWlsZWQgdG8gY3JlYXRlIGF1dGhvcml6YXRpb24gY29udGV4dCcsIGVycm9yIGFzIEVycm9yKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDaGVjayBpZiB1c2VyIGhhcyBzcGVjaWZpYyBzeXN0ZW0gY2FwYWJpbGl0eVxuICAgKiBcbiAgICogQHBhcmFtIGF1dGhDb250ZXh0IC0gQXV0aGVudGljYXRpb24gY29udGV4dFxuICAgKiBAcGFyYW0gY2FwYWJpbGl0eSAtIFJlcXVpcmVkIGNhcGFiaWxpdHlcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB1c2VyIGhhcyBjYXBhYmlsaXR5XG4gICAqL1xuICBhc3luYyBoYXNTeXN0ZW1DYXBhYmlsaXR5KFxuICAgIGF1dGhDb250ZXh0OiBBdXRoQ29udGV4dCxcbiAgICBjYXBhYmlsaXR5OiBTeXN0ZW1DYXBhYmlsaXR5XG4gICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIEF1dGhvcml6YXRpb25Mb2dnZXIubG9nQXV0aG9yaXphdGlvbkNoZWNrKFxuICAgICAgICBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICAgIGF1dGhDb250ZXh0LnN5c3RlbVJvbGUsXG4gICAgICAgIGNhcGFiaWxpdHlcbiAgICAgICk7XG4gICAgICBcbiAgICAgIGNvbnN0IGNhcGFiaWxpdGllcyA9IGF3YWl0IHRoaXMuZ2V0Q2FjaGVkQ2FwYWJpbGl0aWVzKGF1dGhDb250ZXh0KTtcbiAgICAgIGNvbnN0IGhhc0NhcGFiaWxpdHkgPSBjYXBhYmlsaXRpZXMuaW5jbHVkZXMoY2FwYWJpbGl0eSk7XG4gICAgICBcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgIFxuICAgICAgaWYgKGhhc0NhcGFiaWxpdHkpIHtcbiAgICAgICAgQXV0aG9yaXphdGlvbkxvZ2dlci5sb2dBdXRob3JpemF0aW9uR3JhbnRlZChcbiAgICAgICAgICBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICAgICAgYXV0aENvbnRleHQuc3lzdGVtUm9sZSxcbiAgICAgICAgICBjYXBhYmlsaXR5LFxuICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgICAgZHVyYXRpb25cbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIEF1dGhvcml6YXRpb25Mb2dnZXIubG9nQXV0aG9yaXphdGlvbkRlbmllZChcbiAgICAgICAgICBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICAgICAgYXV0aENvbnRleHQuc3lzdGVtUm9sZSxcbiAgICAgICAgICBjYXBhYmlsaXR5LFxuICAgICAgICAgICdVc2VyIGRvZXMgbm90IGhhdmUgcmVxdWlyZWQgY2FwYWJpbGl0eScsXG4gICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgICBkdXJhdGlvblxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4gaGFzQ2FwYWJpbGl0eTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgZHVyYXRpb24gPSBEYXRlLm5vdygpIC0gc3RhcnRUaW1lO1xuICAgICAgXG4gICAgICBBdXRob3JpemF0aW9uTG9nZ2VyLmxvZ0F1dGhvcml6YXRpb25FcnJvcihcbiAgICAgICAgYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgICBhdXRoQ29udGV4dC5zeXN0ZW1Sb2xlLFxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IgOiBuZXcgRXJyb3IoJ1Vua25vd24gZXJyb3InKSxcbiAgICAgICAgY2FwYWJpbGl0eSxcbiAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICB1bmRlZmluZWQsXG4gICAgICAgIGR1cmF0aW9uXG4gICAgICApO1xuICAgICAgXG4gICAgICAvLyBGYWlsLXNhZmU6IGRlbnkgYWNjZXNzIG9uIGVycm9yXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIFxuICAvKipcbiAgICogVmFsaWRhdGUgYXV0aG9yaXphdGlvbiBmb3Igc3BlY2lmaWMgYWN0aW9uXG4gICAqIFxuICAgKiBAcGFyYW0gYXV0aENvbnRleHQgLSBBdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gICAqIEBwYXJhbSByZXF1aXJlZENhcGFiaWxpdHkgLSBSZXF1aXJlZCBjYXBhYmlsaXR5XG4gICAqIEBwYXJhbSByZXNvdXJjZSAtIE9wdGlvbmFsIHJlc291cmNlIGlkZW50aWZpZXJcbiAgICogQHJldHVybnMgQXV0aG9yaXphdGlvbiByZXN1bHRcbiAgICovXG4gIGFzeW5jIGF1dGhvcml6ZShcbiAgICBhdXRoQ29udGV4dDogQXV0aENvbnRleHQsXG4gICAgcmVxdWlyZWRDYXBhYmlsaXR5OiBTeXN0ZW1DYXBhYmlsaXR5LFxuICAgIHJlc291cmNlPzogc3RyaW5nXG4gICk6IFByb21pc2U8QXV0aG9yaXphdGlvblJlc3VsdD4ge1xuICAgIGNvbnN0IHN0YXJ0VGltZSA9IERhdGUubm93KCk7XG4gICAgXG4gICAgdHJ5IHtcbiAgICAgIEF1dGhvcml6YXRpb25Mb2dnZXIubG9nQXV0aG9yaXphdGlvbkNoZWNrKFxuICAgICAgICBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICAgIGF1dGhDb250ZXh0LnN5c3RlbVJvbGUsXG4gICAgICAgIHJlcXVpcmVkQ2FwYWJpbGl0eSxcbiAgICAgICAgcmVzb3VyY2VcbiAgICAgICk7XG4gICAgICBcbiAgICAgIGNvbnN0IGhhc0NhcGFiaWxpdHkgPSBhd2FpdCB0aGlzLmhhc1N5c3RlbUNhcGFiaWxpdHkoYXV0aENvbnRleHQsIHJlcXVpcmVkQ2FwYWJpbGl0eSk7XG4gICAgICBjb25zdCBkdXJhdGlvbiA9IERhdGUubm93KCkgLSBzdGFydFRpbWU7XG4gICAgICBcbiAgICAgIGNvbnN0IHJlc3VsdDogQXV0aG9yaXphdGlvblJlc3VsdCA9IHtcbiAgICAgICAgZ3JhbnRlZDogaGFzQ2FwYWJpbGl0eSxcbiAgICAgICAgY2FwYWJpbGl0eTogcmVxdWlyZWRDYXBhYmlsaXR5LFxuICAgICAgICByZWFzb246IGhhc0NhcGFiaWxpdHkgPyB1bmRlZmluZWQgOiAnSW5zdWZmaWNpZW50IHByaXZpbGVnZXMnLFxuICAgICAgICBjb250ZXh0OiB7XG4gICAgICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICAgICAgc3lzdGVtUm9sZTogYXV0aENvbnRleHQuc3lzdGVtUm9sZSxcbiAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgICBcbiAgICAgIGlmICghaGFzQ2FwYWJpbGl0eSkge1xuICAgICAgICBBdXRob3JpemF0aW9uTG9nZ2VyLmxvZ0F1dGhvcml6YXRpb25EZW5pZWQoXG4gICAgICAgICAgYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgICAgIGF1dGhDb250ZXh0LnN5c3RlbVJvbGUsXG4gICAgICAgICAgcmVxdWlyZWRDYXBhYmlsaXR5LFxuICAgICAgICAgICdJbnN1ZmZpY2llbnQgcHJpdmlsZWdlcycsXG4gICAgICAgICAgcmVzb3VyY2UsXG4gICAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICAgIGR1cmF0aW9uXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IGR1cmF0aW9uID0gRGF0ZS5ub3coKSAtIHN0YXJ0VGltZTtcbiAgICAgIFxuICAgICAgQXV0aG9yaXphdGlvbkxvZ2dlci5sb2dBdXRob3JpemF0aW9uRXJyb3IoXG4gICAgICAgIGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgICAgYXV0aENvbnRleHQuc3lzdGVtUm9sZSxcbiAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yIDogbmV3IEVycm9yKCdVbmtub3duIGVycm9yJyksXG4gICAgICAgIHJlcXVpcmVkQ2FwYWJpbGl0eSxcbiAgICAgICAgcmVzb3VyY2UsXG4gICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgZHVyYXRpb25cbiAgICAgICk7XG4gICAgICBcbiAgICAgIC8vIEZhaWwtc2FmZTogZGVueSBhY2Nlc3Mgb24gZXJyb3JcbiAgICAgIHJldHVybiB7XG4gICAgICAgIGdyYW50ZWQ6IGZhbHNlLFxuICAgICAgICBjYXBhYmlsaXR5OiByZXF1aXJlZENhcGFiaWxpdHksXG4gICAgICAgIHJlYXNvbjogJ0F1dGhvcml6YXRpb24gc2VydmljZSBlcnJvcicsXG4gICAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgICAgICBzeXN0ZW1Sb2xlOiBhdXRoQ29udGV4dC5zeXN0ZW1Sb2xlLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICB9XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgY2FwYWJpbGl0aWVzIHdpdGggY2FjaGluZ1xuICAgKiBcbiAgICogQHBhcmFtIGF1dGhDb250ZXh0IC0gQXV0aGVudGljYXRpb24gY29udGV4dFxuICAgKiBAcmV0dXJucyBBcnJheSBvZiBjYXBhYmlsaXRpZXNcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2V0Q2FjaGVkQ2FwYWJpbGl0aWVzKGF1dGhDb250ZXh0OiBBdXRoQ29udGV4dCk6IFByb21pc2U8U3lzdGVtQ2FwYWJpbGl0eVtdPiB7XG4gICAgY29uc3QgY2FjaGVLZXkgPSBgJHthdXRoQ29udGV4dC51c2VySWR9OiR7YXV0aENvbnRleHQuc3lzdGVtUm9sZX1gO1xuICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMuY2FwYWJpbGl0eUNhY2hlLmdldChjYWNoZUtleSk7XG4gICAgXG4gICAgLy8gQ2hlY2sgY2FjaGUgdmFsaWRpdHlcbiAgICBpZiAoY2FjaGVkICYmIGNhY2hlZC5leHBpcmVzQXQgPiBuZXcgRGF0ZSgpKSB7XG4gICAgICBBdXRob3JpemF0aW9uTG9nZ2VyLmxvZ0NhY2hlRXZlbnQoJ2hpdCcsIGF1dGhDb250ZXh0LnVzZXJJZCwgYXV0aENvbnRleHQuc3lzdGVtUm9sZSwgY2FjaGVkLmNhcGFiaWxpdGllcyk7XG4gICAgICByZXR1cm4gY2FjaGVkLmNhcGFiaWxpdGllcztcbiAgICB9XG4gICAgXG4gICAgLy8gQ2FjaGUgbWlzcyAtIGRlcml2ZSBjYXBhYmlsaXRpZXNcbiAgICBBdXRob3JpemF0aW9uTG9nZ2VyLmxvZ0NhY2hlRXZlbnQoJ21pc3MnLCBhdXRoQ29udGV4dC51c2VySWQsIGF1dGhDb250ZXh0LnN5c3RlbVJvbGUpO1xuICAgIFxuICAgIGNvbnN0IGNhcGFiaWxpdGllcyA9IGF3YWl0IHRoaXMuY2FwYWJpbGl0eVJlc29sdmVyLmRlcml2ZUNhcGFiaWxpdGllcyhhdXRoQ29udGV4dCk7XG4gICAgXG4gICAgLy8gQ2FjaGUgdGhlIHJlc3VsdFxuICAgIGNvbnN0IGNhY2hlRW50cnk6IENhcGFiaWxpdHlDYWNoZUVudHJ5ID0ge1xuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBzeXN0ZW1Sb2xlOiBhdXRoQ29udGV4dC5zeXN0ZW1Sb2xlLFxuICAgICAgY2FwYWJpbGl0aWVzLFxuICAgICAgZXhwaXJlc0F0OiBuZXcgRGF0ZShEYXRlLm5vdygpICsgQ0FQQUJJTElUWV9DQUNIRV9UVEwpLFxuICAgIH07XG4gICAgXG4gICAgdGhpcy5jYXBhYmlsaXR5Q2FjaGUuc2V0KGNhY2hlS2V5LCBjYWNoZUVudHJ5KTtcbiAgICBBdXRob3JpemF0aW9uTG9nZ2VyLmxvZ0NhY2hlRXZlbnQoJ3NldCcsIGF1dGhDb250ZXh0LnVzZXJJZCwgYXV0aENvbnRleHQuc3lzdGVtUm9sZSwgY2FwYWJpbGl0aWVzKTtcbiAgICBcbiAgICByZXR1cm4gY2FwYWJpbGl0aWVzO1xuICB9XG4gIFxuICAvKipcbiAgICogQ2xlYW4gdXAgZXhwaXJlZCBjYWNoZSBlbnRyaWVzXG4gICAqL1xuICBwcml2YXRlIGNsZWFudXBFeHBpcmVkQ2FjaGUoKTogdm9pZCB7XG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBleHBpcmVkS2V5czogc3RyaW5nW10gPSBbXTtcbiAgICBcbiAgICBmb3IgKGNvbnN0IFtrZXksIGVudHJ5XSBvZiB0aGlzLmNhcGFiaWxpdHlDYWNoZS5lbnRyaWVzKCkpIHtcbiAgICAgIGlmIChlbnRyeS5leHBpcmVzQXQgPD0gbm93KSB7XG4gICAgICAgIGV4cGlyZWRLZXlzLnB1c2goa2V5KTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgZm9yIChjb25zdCBrZXkgb2YgZXhwaXJlZEtleXMpIHtcbiAgICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5jYXBhYmlsaXR5Q2FjaGUuZ2V0KGtleSk7XG4gICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgdGhpcy5jYXBhYmlsaXR5Q2FjaGUuZGVsZXRlKGtleSk7XG4gICAgICAgIEF1dGhvcml6YXRpb25Mb2dnZXIubG9nQ2FjaGVFdmVudCgnZXZpY3QnLCBlbnRyeS51c2VySWQsIGVudHJ5LnN5c3RlbVJvbGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIENsZWFyIGNhY2hlIGZvciBzcGVjaWZpYyB1c2VyICh1c2VmdWwgZm9yIHRlc3Rpbmcgb3Igcm9sZSBjaGFuZ2VzKVxuICAgKiBcbiAgICogQHBhcmFtIHVzZXJJZCAtIFVzZXIgSUQgdG8gY2xlYXIgY2FjaGUgZm9yXG4gICAqL1xuICBjbGVhclVzZXJDYWNoZSh1c2VySWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIGNvbnN0IGtleXNUb0RlbGV0ZTogc3RyaW5nW10gPSBbXTtcbiAgICBcbiAgICBmb3IgKGNvbnN0IFtrZXksIGVudHJ5XSBvZiB0aGlzLmNhcGFiaWxpdHlDYWNoZS5lbnRyaWVzKCkpIHtcbiAgICAgIGlmIChlbnRyeS51c2VySWQgPT09IHVzZXJJZCkge1xuICAgICAgICBrZXlzVG9EZWxldGUucHVzaChrZXkpO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBrZXlzVG9EZWxldGUpIHtcbiAgICAgIGNvbnN0IGVudHJ5ID0gdGhpcy5jYXBhYmlsaXR5Q2FjaGUuZ2V0KGtleSk7XG4gICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgdGhpcy5jYXBhYmlsaXR5Q2FjaGUuZGVsZXRlKGtleSk7XG4gICAgICAgIEF1dGhvcml6YXRpb25Mb2dnZXIubG9nQ2FjaGVFdmVudCgnZXZpY3QnLCBlbnRyeS51c2VySWQsIGVudHJ5LnN5c3RlbVJvbGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBjYWNoZSBzdGF0aXN0aWNzIGZvciBtb25pdG9yaW5nXG4gICAqL1xuICBnZXRDYWNoZVN0YXRzKCk6IHsgc2l6ZTogbnVtYmVyOyBlbnRyaWVzOiBDYXBhYmlsaXR5Q2FjaGVFbnRyeVtdIH0ge1xuICAgIHJldHVybiB7XG4gICAgICBzaXplOiB0aGlzLmNhcGFiaWxpdHlDYWNoZS5zaXplLFxuICAgICAgZW50cmllczogQXJyYXkuZnJvbSh0aGlzLmNhcGFiaWxpdHlDYWNoZS52YWx1ZXMoKSksXG4gICAgfTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENoZWNrIGlmIHVzZXIgaGFzIHNwZWNpZmljIGNsdWIgY2FwYWJpbGl0eVxuICAgKiBcbiAgICogQHBhcmFtIHVzZXJJZCAtIFVzZXIgSURcbiAgICogQHBhcmFtIGNsdWJJZCAtIENsdWIgSURcbiAgICogQHBhcmFtIGNhcGFiaWxpdHkgLSBSZXF1aXJlZCBjbHViIGNhcGFiaWxpdHlcbiAgICogQHJldHVybnMgVHJ1ZSBpZiB1c2VyIGhhcyBjYXBhYmlsaXR5XG4gICAqL1xuICBhc3luYyBoYXNDYXBhYmlsaXR5KFxuICAgIHVzZXJJZDogc3RyaW5nLFxuICAgIGNsdWJJZDogc3RyaW5nLFxuICAgIGNhcGFiaWxpdHk6IENsdWJDYXBhYmlsaXR5XG4gICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRyeSB7XG4gICAgICAvLyBUaGlzIGlzIGEgc2ltcGxpZmllZCBpbXBsZW1lbnRhdGlvbiBmb3IgTVZQXG4gICAgICAvLyBJbiBhIGZ1bGwgaW1wbGVtZW50YXRpb24sIHlvdSB3b3VsZDpcbiAgICAgIC8vIDEuIEdldCB1c2VyJ3MgY2x1YiBtZW1iZXJzaGlwIGZyb20gZGF0YWJhc2VcbiAgICAgIC8vIDIuIENoZWNrIHRoZSB1c2VyJ3Mgcm9sZSBpbiB0aGUgY2x1YlxuICAgICAgLy8gMy4gVmVyaWZ5IHRoZSByb2xlIGhhcyB0aGUgcmVxdWlyZWQgY2FwYWJpbGl0eVxuICAgICAgXG4gICAgICAvLyBGb3Igbm93LCB3ZSdsbCBhc3N1bWUgdGhpcyBtZXRob2QgaXMgY2FsbGVkIHdpdGggcHJvcGVyIGNvbnRleHRcbiAgICAgIC8vIGFuZCB0aGUgY2FwYWJpbGl0eSBjaGVja2luZyBpcyBkb25lIGluIHRoZSBoYW5kbGVyc1xuICAgICAgXG4gICAgICAvLyBUT0RPOiBJbXBsZW1lbnQgcHJvcGVyIGNsdWIgbWVtYmVyc2hpcCBsb29rdXBcbiAgICAgIC8vIFRoaXMgd291bGQgcmVxdWlyZSBkYXRhYmFzZSBhY2Nlc3MgdG8gZ2V0IHVzZXIncyBjbHViIG1lbWJlcnNoaXBcbiAgICAgIFxuICAgICAgcmV0dXJuIHRydWU7IC8vIFBsYWNlaG9sZGVyIC0gYWN0dWFsIGltcGxlbWVudGF0aW9uIG5lZWRlZFxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjaGVja2luZyBjbHViIGNhcGFiaWxpdHk6JywgZXJyb3IpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNpbmdsZXRvbiBpbnN0YW5jZSBmb3Igc2hhcmVkIHVzYWdlIGFjcm9zcyBMYW1iZGEgZnVuY3Rpb25zXG4gKi9cbmV4cG9ydCBjb25zdCBhdXRob3JpemF0aW9uU2VydmljZSA9IG5ldyBBdXRob3JpemF0aW9uU2VydmljZSgpOyJdfQ==