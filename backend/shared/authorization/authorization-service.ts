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
import { SystemRole } from '../types/user';
import {
  SystemCapability,
  AuthorizationContext,
  AuthorizationResult,
  IAuthorizationService,
  CapabilityCacheEntry,
} from './types';
import { ClubCapability, getCapabilitiesForRole } from '../types/club-authorization';
import { CapabilityResolver } from './capability-resolver';
import {
  AuthorizationError,
  InsufficientPrivilegesError,
  AuthorizationServiceError,
  UserDataUnavailableError,
} from './authorization-errors';
import { AuthorizationLogger } from './authorization-logger';

/**
 * Cache TTL: 5 minutes (balance between performance and consistency)
 */
const CAPABILITY_CACHE_TTL = 5 * 60 * 1000;

/**
 * Authorization service implementation
 */
export class AuthorizationService implements IAuthorizationService {
  private capabilityResolver: CapabilityResolver;
  private capabilityCache: Map<string, CapabilityCacheEntry>;
  
  constructor() {
    this.capabilityResolver = new CapabilityResolver();
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
  async createAuthorizationContext(authContext: AuthContext): Promise<AuthorizationContext> {
    const startTime = Date.now();
    
    try {
      if (!authContext.isAuthenticated) {
        throw new AuthorizationServiceError('Cannot create authorization context for unauthenticated user');
      }
      
      // Get capabilities (with caching)
      const capabilities = await this.getCachedCapabilities(authContext);
      
      // Create enhanced context
      const authorizationContext: AuthorizationContext = {
        ...authContext,
        capabilities,
        hasCapability: (capability: SystemCapability) => capabilities.includes(capability),
        canPerform: (action: string, resource?: string) => {
          // For now, map actions to capabilities (can be extended later)
          const capabilityMap: Record<string, SystemCapability> = {
            'manage_platform': SystemCapability.MANAGE_PLATFORM,
            'manage_all_clubs': SystemCapability.MANAGE_ALL_CLUBS,
          };
          
          const requiredCapability = capabilityMap[action];
          return requiredCapability ? capabilities.includes(requiredCapability) : false;
        },
      };
      
      const duration = Date.now() - startTime;
      
      AuthorizationLogger.logPerformanceMetrics(
        'create_authorization_context',
        duration,
        authContext.userId
      );
      
      return authorizationContext;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      AuthorizationLogger.logAuthorizationError(
        authContext.userId,
        authContext.systemRole,
        error instanceof Error ? error : new Error('Unknown error'),
        undefined,
        undefined,
        undefined,
        duration
      );
      
      throw error instanceof AuthorizationError 
        ? error 
        : new AuthorizationServiceError('Failed to create authorization context', error as Error);
    }
  }
  
  /**
   * Check if user has specific system capability
   * 
   * @param authContext - Authentication context
   * @param capability - Required capability
   * @returns True if user has capability
   */
  async hasSystemCapability(
    authContext: AuthContext,
    capability: SystemCapability
  ): Promise<boolean> {
    const startTime = Date.now();
    
    try {
      AuthorizationLogger.logAuthorizationCheck(
        authContext.userId,
        authContext.systemRole,
        capability
      );
      
      const capabilities = await this.getCachedCapabilities(authContext);
      const hasCapability = capabilities.includes(capability);
      
      const duration = Date.now() - startTime;
      
      if (hasCapability) {
        AuthorizationLogger.logAuthorizationGranted(
          authContext.userId,
          authContext.systemRole,
          capability,
          undefined,
          undefined,
          duration
        );
      } else {
        AuthorizationLogger.logAuthorizationDenied(
          authContext.userId,
          authContext.systemRole,
          capability,
          'User does not have required capability',
          undefined,
          undefined,
          duration
        );
      }
      
      return hasCapability;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      AuthorizationLogger.logAuthorizationError(
        authContext.userId,
        authContext.systemRole,
        error instanceof Error ? error : new Error('Unknown error'),
        capability,
        undefined,
        undefined,
        duration
      );
      
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
  async authorize(
    authContext: AuthContext,
    requiredCapability: SystemCapability,
    resource?: string
  ): Promise<AuthorizationResult> {
    const startTime = Date.now();
    
    try {
      AuthorizationLogger.logAuthorizationCheck(
        authContext.userId,
        authContext.systemRole,
        requiredCapability,
        resource
      );
      
      const hasCapability = await this.hasSystemCapability(authContext, requiredCapability);
      const duration = Date.now() - startTime;
      
      const result: AuthorizationResult = {
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
        AuthorizationLogger.logAuthorizationDenied(
          authContext.userId,
          authContext.systemRole,
          requiredCapability,
          'Insufficient privileges',
          resource,
          undefined,
          duration
        );
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      AuthorizationLogger.logAuthorizationError(
        authContext.userId,
        authContext.systemRole,
        error instanceof Error ? error : new Error('Unknown error'),
        requiredCapability,
        resource,
        undefined,
        duration
      );
      
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
  private async getCachedCapabilities(authContext: AuthContext): Promise<SystemCapability[]> {
    const cacheKey = `${authContext.userId}:${authContext.systemRole}`;
    const cached = this.capabilityCache.get(cacheKey);
    
    // Check cache validity
    if (cached && cached.expiresAt > new Date()) {
      AuthorizationLogger.logCacheEvent('hit', authContext.userId, authContext.systemRole, cached.capabilities);
      return cached.capabilities;
    }
    
    // Cache miss - derive capabilities
    AuthorizationLogger.logCacheEvent('miss', authContext.userId, authContext.systemRole);
    
    const capabilities = await this.capabilityResolver.deriveCapabilities(authContext);
    
    // Cache the result
    const cacheEntry: CapabilityCacheEntry = {
      userId: authContext.userId,
      systemRole: authContext.systemRole,
      capabilities,
      expiresAt: new Date(Date.now() + CAPABILITY_CACHE_TTL),
    };
    
    this.capabilityCache.set(cacheKey, cacheEntry);
    AuthorizationLogger.logCacheEvent('set', authContext.userId, authContext.systemRole, capabilities);
    
    return capabilities;
  }
  
  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = new Date();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.capabilityCache.entries()) {
      if (entry.expiresAt <= now) {
        expiredKeys.push(key);
      }
    }
    
    for (const key of expiredKeys) {
      const entry = this.capabilityCache.get(key);
      if (entry) {
        this.capabilityCache.delete(key);
        AuthorizationLogger.logCacheEvent('evict', entry.userId, entry.systemRole);
      }
    }
  }
  
  /**
   * Clear cache for specific user (useful for testing or role changes)
   * 
   * @param userId - User ID to clear cache for
   */
  clearUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.capabilityCache.entries()) {
      if (entry.userId === userId) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      const entry = this.capabilityCache.get(key);
      if (entry) {
        this.capabilityCache.delete(key);
        AuthorizationLogger.logCacheEvent('evict', entry.userId, entry.systemRole);
      }
    }
  }
  
  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; entries: CapabilityCacheEntry[] } {
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
  async hasCapability(
    userId: string,
    clubId: string,
    capability: ClubCapability
  ): Promise<boolean> {
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
    } catch (error) {
      console.error('Error checking club capability:', error);
      return false;
    }
  }
}

/**
 * Singleton instance for shared usage across Lambda functions
 */
export const authorizationService = new AuthorizationService();