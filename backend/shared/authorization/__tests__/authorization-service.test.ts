/**
 * Authorization Service Tests - Phase 1.3
 * 
 * Unit tests for the core authorization service.
 * Tests capability derivation, caching, and authorization decisions.
 * 
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */

import { AuthorizationService } from '../authorization-service';
import { SystemCapability } from '../types';
import { SystemRole } from '../../types/user';
import { AuthContext } from '../../types/auth';

describe('AuthorizationService', () => {
  let authorizationService: AuthorizationService;

  beforeEach(() => {
    authorizationService = new AuthorizationService();
  });

  afterEach(() => {
    // Clear cache between tests
    authorizationService.clearUserCache('test-admin');
    authorizationService.clearUserCache('test-user');
  });

  describe('createAuthorizationContext', () => {
    it('should create authorization context for SiteAdmin', async () => {
      const authContext: AuthContext = {
        userId: 'test-admin',
        email: 'admin@example.com',
        systemRole: SystemRole.SITE_ADMIN,
        isAuthenticated: true,
        isSiteAdmin: true,
      };

      const authzContext = await authorizationService.createAuthorizationContext(authContext);

      expect(authzContext.capabilities).toContain(SystemCapability.MANAGE_PLATFORM);
      expect(authzContext.capabilities).toContain(SystemCapability.MANAGE_ALL_CLUBS);
      expect(authzContext.hasCapability(SystemCapability.MANAGE_PLATFORM)).toBe(true);
      expect(authzContext.canPerform('manage_platform')).toBe(true);
    });

    it('should create authorization context for regular user', async () => {
      const authContext: AuthContext = {
        userId: 'test-user',
        email: 'user@example.com',
        systemRole: SystemRole.USER,
        isAuthenticated: true,
        isSiteAdmin: false,
      };

      const authzContext = await authorizationService.createAuthorizationContext(authContext);

      expect(authzContext.capabilities).toHaveLength(0);
      expect(authzContext.hasCapability(SystemCapability.MANAGE_PLATFORM)).toBe(false);
      expect(authzContext.canPerform('manage_platform')).toBe(false);
    });

    it('should throw error for unauthenticated user', async () => {
      const authContext: AuthContext = {
        userId: '',
        email: '',
        systemRole: SystemRole.USER,
        isAuthenticated: false,
        isSiteAdmin: false,
      };

      await expect(
        authorizationService.createAuthorizationContext(authContext)
      ).rejects.toThrow('Cannot create authorization context for unauthenticated user');
    });
  });

  describe('hasSystemCapability', () => {
    it('should return true for SiteAdmin with MANAGE_PLATFORM', async () => {
      const authContext: AuthContext = {
        userId: 'test-admin',
        email: 'admin@example.com',
        systemRole: SystemRole.SITE_ADMIN,
        isAuthenticated: true,
        isSiteAdmin: true,
      };

      const result = await authorizationService.hasSystemCapability(
        authContext,
        SystemCapability.MANAGE_PLATFORM
      );

      expect(result).toBe(true);
    });

    it('should return false for regular user with MANAGE_PLATFORM', async () => {
      const authContext: AuthContext = {
        userId: 'test-user',
        email: 'user@example.com',
        systemRole: SystemRole.USER,
        isAuthenticated: true,
        isSiteAdmin: false,
      };

      const result = await authorizationService.hasSystemCapability(
        authContext,
        SystemCapability.MANAGE_PLATFORM
      );

      expect(result).toBe(false);
    });
  });

  describe('authorize', () => {
    it('should authorize SiteAdmin for platform management', async () => {
      const authContext: AuthContext = {
        userId: 'test-admin',
        email: 'admin@example.com',
        systemRole: SystemRole.SITE_ADMIN,
        isAuthenticated: true,
        isSiteAdmin: true,
      };

      const result = await authorizationService.authorize(
        authContext,
        SystemCapability.MANAGE_PLATFORM
      );

      expect(result.granted).toBe(true);
      expect(result.capability).toBe(SystemCapability.MANAGE_PLATFORM);
      expect(result.reason).toBeUndefined();
      expect(result.context.userId).toBe('test-admin');
      expect(result.context.systemRole).toBe(SystemRole.SITE_ADMIN);
    });

    it('should deny regular user platform management', async () => {
      const authContext: AuthContext = {
        userId: 'test-user',
        email: 'user@example.com',
        systemRole: SystemRole.USER,
        isAuthenticated: true,
        isSiteAdmin: false,
      };

      const result = await authorizationService.authorize(
        authContext,
        SystemCapability.MANAGE_PLATFORM
      );

      expect(result.granted).toBe(false);
      expect(result.capability).toBe(SystemCapability.MANAGE_PLATFORM);
      expect(result.reason).toBe('Insufficient privileges');
      expect(result.context.userId).toBe('test-user');
      expect(result.context.systemRole).toBe(SystemRole.USER);
    });

    it('should include resource in authorization result', async () => {
      const authContext: AuthContext = {
        userId: 'test-admin',
        email: 'admin@example.com',
        systemRole: SystemRole.SITE_ADMIN,
        isAuthenticated: true,
        isSiteAdmin: true,
      };

      const result = await authorizationService.authorize(
        authContext,
        SystemCapability.MANAGE_PLATFORM,
        'user:123'
      );

      expect(result.granted).toBe(true);
    });
  });

  describe('caching', () => {
    it('should cache capabilities for performance', async () => {
      const authContext: AuthContext = {
        userId: 'test-admin',
        email: 'admin@example.com',
        systemRole: SystemRole.SITE_ADMIN,
        isAuthenticated: true,
        isSiteAdmin: true,
      };

      // First call - should cache
      const result1 = await authorizationService.hasSystemCapability(
        authContext,
        SystemCapability.MANAGE_PLATFORM
      );

      // Second call - should use cache
      const result2 = await authorizationService.hasSystemCapability(
        authContext,
        SystemCapability.MANAGE_PLATFORM
      );

      expect(result1).toBe(true);
      expect(result2).toBe(true);

      // Verify cache has entry
      const stats = authorizationService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should clear user cache', async () => {
      const authContext: AuthContext = {
        userId: 'test-admin',
        email: 'admin@example.com',
        systemRole: SystemRole.SITE_ADMIN,
        isAuthenticated: true,
        isSiteAdmin: true,
      };

      // Create cache entry
      await authorizationService.hasSystemCapability(
        authContext,
        SystemCapability.MANAGE_PLATFORM
      );

      // Clear cache
      authorizationService.clearUserCache('test-admin');

      // Verify cache is cleared
      const stats = authorizationService.getCacheStats();
      const userEntries = stats.entries.filter(entry => entry.userId === 'test-admin');
      expect(userEntries).toHaveLength(0);
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully and deny access', async () => {
      // Create a mock that throws an error
      const mockAuthContext = {
        userId: 'test-user',
        email: 'user@example.com',
        systemRole: null as any, // Invalid role to trigger error
        isAuthenticated: true,
        isSiteAdmin: false,
      };

      const result = await authorizationService.hasSystemCapability(
        mockAuthContext,
        SystemCapability.MANAGE_PLATFORM
      );

      // Should fail-safe to deny access
      expect(result).toBe(false);
    });
  });
});