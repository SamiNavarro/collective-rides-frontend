/**
 * Authorization Middleware Tests - Phase 1.3
 * 
 * Unit tests for authorization middleware and utilities.
 * Tests middleware functions, decorators, and utility functions.
 * 
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */

import {
  requireCapability,
  requirePlatformManagement,
  requireClubManagement,
  Authorize,
  hasCapability,
  authorizeRequest,
  authorizeIf,
  validateAuthContext,
} from '../authorization-middleware';
import { SystemCapability } from '../types';
import { SystemRole } from '../../types/user';
import { AuthContext } from '../../types/auth';
import { InsufficientPrivilegesError } from '../authorization-errors';

describe('Authorization Middleware', () => {
  const adminAuthContext: AuthContext = {
    userId: 'test-admin',
    email: 'admin@example.com',
    systemRole: SystemRole.SITE_ADMIN,
    isAuthenticated: true,
    isSiteAdmin: true,
  };

  const userAuthContext: AuthContext = {
    userId: 'test-user',
    email: 'user@example.com',
    systemRole: SystemRole.USER,
    isAuthenticated: true,
    isSiteAdmin: false,
  };

  describe('requireCapability', () => {
    it('should allow SiteAdmin with required capability', async () => {
      const middleware = requireCapability(SystemCapability.MANAGE_PLATFORM);

      await expect(middleware(adminAuthContext)).resolves.not.toThrow();
    });

    it('should deny regular user without required capability', async () => {
      const middleware = requireCapability(SystemCapability.MANAGE_PLATFORM);

      await expect(middleware(userAuthContext)).rejects.toThrow(InsufficientPrivilegesError);
    });

    it('should include resource in error', async () => {
      const middleware = requireCapability(SystemCapability.MANAGE_PLATFORM, 'user:123');

      try {
        await middleware(userAuthContext);
        fail('Expected InsufficientPrivilegesError');
      } catch (error) {
        expect(error).toBeInstanceOf(InsufficientPrivilegesError);
        expect((error as InsufficientPrivilegesError).resource).toBe('user:123');
      }
    });
  });

  describe('requirePlatformManagement', () => {
    it('should allow SiteAdmin', async () => {
      await expect(requirePlatformManagement(adminAuthContext)).resolves.not.toThrow();
    });

    it('should deny regular user', async () => {
      await expect(requirePlatformManagement(userAuthContext)).rejects.toThrow(InsufficientPrivilegesError);
    });
  });

  describe('requireClubManagement', () => {
    it('should allow SiteAdmin', async () => {
      await expect(requireClubManagement(adminAuthContext)).resolves.not.toThrow();
    });

    it('should deny regular user', async () => {
      await expect(requireClubManagement(userAuthContext)).rejects.toThrow(InsufficientPrivilegesError);
    });
  });

  describe('Authorize decorator', () => {
    class TestService {
      @Authorize(SystemCapability.MANAGE_PLATFORM)
      async adminMethod(data: any, authContext: AuthContext): Promise<string> {
        return 'success';
      }

      @Authorize(SystemCapability.MANAGE_PLATFORM, (data, authContext) => `user:${data.userId}`)
      async adminMethodWithResource(data: { userId: string }, authContext: AuthContext): Promise<string> {
        return 'success';
      }
    }

    let service: TestService;

    beforeEach(() => {
      service = new TestService();
    });

    it('should allow authorized user', async () => {
      const result = await service.adminMethod({ test: 'data' }, adminAuthContext);
      expect(result).toBe('success');
    });

    it('should deny unauthorized user', async () => {
      await expect(
        service.adminMethod({ test: 'data' }, userAuthContext)
      ).rejects.toThrow(InsufficientPrivilegesError);
    });

    it('should extract resource from arguments', async () => {
      const result = await service.adminMethodWithResource({ userId: '123' }, adminAuthContext);
      expect(result).toBe('success');
    });

    it('should throw error if AuthContext not found', async () => {
      await expect(
        (service as any).adminMethod({ test: 'data' })
      ).rejects.toThrow('AuthContext not found in method arguments');
    });
  });

  describe('hasCapability', () => {
    it('should return true for SiteAdmin with platform capability', async () => {
      const result = await hasCapability(adminAuthContext, SystemCapability.MANAGE_PLATFORM);
      expect(result).toBe(true);
    });

    it('should return false for regular user with platform capability', async () => {
      const result = await hasCapability(userAuthContext, SystemCapability.MANAGE_PLATFORM);
      expect(result).toBe(false);
    });
  });

  describe('authorizeRequest', () => {
    it('should allow user with any required capability', async () => {
      await expect(
        authorizeRequest(adminAuthContext, [SystemCapability.MANAGE_PLATFORM, SystemCapability.MANAGE_ALL_CLUBS])
      ).resolves.not.toThrow();
    });

    it('should deny user without any required capability', async () => {
      await expect(
        authorizeRequest(userAuthContext, [SystemCapability.MANAGE_PLATFORM, SystemCapability.MANAGE_ALL_CLUBS])
      ).rejects.toThrow(InsufficientPrivilegesError);
    });

    it('should allow request with no required capabilities', async () => {
      await expect(
        authorizeRequest(userAuthContext, [])
      ).resolves.not.toThrow();
    });
  });

  describe('authorizeIf', () => {
    it('should check authorization when condition is true', async () => {
      await expect(
        authorizeIf(true, userAuthContext, SystemCapability.MANAGE_PLATFORM)
      ).rejects.toThrow(InsufficientPrivilegesError);
    });

    it('should skip authorization when condition is false', async () => {
      await expect(
        authorizeIf(false, userAuthContext, SystemCapability.MANAGE_PLATFORM)
      ).resolves.not.toThrow();
    });
  });

  describe('validateAuthContext', () => {
    it('should validate correct auth context', () => {
      expect(() => validateAuthContext(adminAuthContext)).not.toThrow();
    });

    it('should throw error for null context', () => {
      expect(() => validateAuthContext(null as any)).toThrow('AuthContext is required');
    });

    it('should throw error for unauthenticated user', () => {
      const unauthenticatedContext = { ...adminAuthContext, isAuthenticated: false };
      expect(() => validateAuthContext(unauthenticatedContext)).toThrow('User must be authenticated');
    });

    it('should throw error for missing user ID', () => {
      const contextWithoutUserId = { ...adminAuthContext, userId: '' };
      expect(() => validateAuthContext(contextWithoutUserId)).toThrow('User ID is required');
    });

    it('should throw error for missing system role', () => {
      const contextWithoutRole = { ...adminAuthContext, systemRole: null as any };
      expect(() => validateAuthContext(contextWithoutRole)).toThrow('System role is required');
    });
  });
});