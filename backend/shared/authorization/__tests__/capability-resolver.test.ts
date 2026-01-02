/**
 * Capability Resolver Tests - Phase 1.3
 * 
 * Unit tests for capability derivation logic.
 * Validates the capability matrix and role-based access control.
 * 
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */

import { CapabilityResolver } from '../capability-resolver';
import { SystemCapability } from '../types';
import { SystemRole } from '../../types/user';
import { AuthContext } from '../../types/auth';

describe('CapabilityResolver', () => {
  let capabilityResolver: CapabilityResolver;

  beforeEach(() => {
    capabilityResolver = new CapabilityResolver();
  });

  describe('deriveCapabilities', () => {
    it('should grant all system capabilities to SiteAdmin', async () => {
      const authContext: AuthContext = {
        userId: 'test-admin',
        email: 'admin@example.com',
        systemRole: SystemRole.SITE_ADMIN,
        isAuthenticated: true,
        isSiteAdmin: true,
      };

      const capabilities = await capabilityResolver.deriveCapabilities(authContext);

      expect(capabilities).toContain(SystemCapability.MANAGE_PLATFORM);
      expect(capabilities).toContain(SystemCapability.MANAGE_ALL_CLUBS);
      expect(capabilities).toHaveLength(2);
    });

    it('should grant no system capabilities to regular users', async () => {
      const authContext: AuthContext = {
        userId: 'test-user',
        email: 'user@example.com',
        systemRole: SystemRole.USER,
        isAuthenticated: true,
        isSiteAdmin: false,
      };

      const capabilities = await capabilityResolver.deriveCapabilities(authContext);

      expect(capabilities).toHaveLength(0);
    });

    it('should handle invalid system role gracefully', async () => {
      const authContext: AuthContext = {
        userId: 'test-user',
        email: 'user@example.com',
        systemRole: 'INVALID_ROLE' as SystemRole,
        isAuthenticated: true,
        isSiteAdmin: false,
      };

      const capabilities = await capabilityResolver.deriveCapabilities(authContext);

      expect(capabilities).toHaveLength(0);
    });
  });

  describe('hasCapability', () => {
    it('should return true for SiteAdmin with MANAGE_PLATFORM', () => {
      const result = capabilityResolver.hasCapability(
        SystemRole.SITE_ADMIN,
        SystemCapability.MANAGE_PLATFORM
      );

      expect(result).toBe(true);
    });

    it('should return true for SiteAdmin with MANAGE_ALL_CLUBS', () => {
      const result = capabilityResolver.hasCapability(
        SystemRole.SITE_ADMIN,
        SystemCapability.MANAGE_ALL_CLUBS
      );

      expect(result).toBe(true);
    });

    it('should return false for regular user with MANAGE_PLATFORM', () => {
      const result = capabilityResolver.hasCapability(
        SystemRole.USER,
        SystemCapability.MANAGE_PLATFORM
      );

      expect(result).toBe(false);
    });

    it('should return false for regular user with MANAGE_ALL_CLUBS', () => {
      const result = capabilityResolver.hasCapability(
        SystemRole.USER,
        SystemCapability.MANAGE_ALL_CLUBS
      );

      expect(result).toBe(false);
    });
  });

  describe('isValidCapability', () => {
    it('should return true for valid capabilities', () => {
      expect(capabilityResolver.isValidCapability('manage_platform')).toBe(true);
      expect(capabilityResolver.isValidCapability('manage_all_clubs')).toBe(true);
    });

    it('should return false for invalid capabilities', () => {
      expect(capabilityResolver.isValidCapability('invalid_capability')).toBe(false);
      expect(capabilityResolver.isValidCapability('')).toBe(false);
    });
  });

  describe('getAllCapabilities', () => {
    it('should return all system capabilities', () => {
      const capabilities = capabilityResolver.getAllCapabilities();

      expect(capabilities).toContain(SystemCapability.MANAGE_PLATFORM);
      expect(capabilities).toContain(SystemCapability.MANAGE_ALL_CLUBS);
      expect(capabilities).toHaveLength(2);
    });
  });

  describe('getCapabilityMatrix', () => {
    it('should return complete capability matrix', () => {
      const matrix = capabilityResolver.getCapabilityMatrix();

      expect(matrix[SystemRole.USER]).toEqual([]);
      expect(matrix[SystemRole.SITE_ADMIN]).toContain(SystemCapability.MANAGE_PLATFORM);
      expect(matrix[SystemRole.SITE_ADMIN]).toContain(SystemCapability.MANAGE_ALL_CLUBS);
    });
  });
});