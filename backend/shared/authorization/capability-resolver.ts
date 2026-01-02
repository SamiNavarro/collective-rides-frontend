/**
 * Capability Resolver - Phase 1.3
 * 
 * Derives system-level capabilities from user systemRole.
 * Implements the capability matrix defined in the specification.
 * 
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */

import { AuthContext } from '../types/auth';
import { SystemRole } from '../types/user';
import { SystemCapability, ICapabilityResolver } from './types';
import { logStructured } from '../utils/lambda-utils';

/**
 * System capability matrix mapping roles to capabilities
 */
const CAPABILITY_MATRIX: Record<SystemRole, SystemCapability[]> = {
  [SystemRole.USER]: [],
  [SystemRole.SITE_ADMIN]: [
    SystemCapability.MANAGE_PLATFORM,
    SystemCapability.MANAGE_ALL_CLUBS,
  ],
};

/**
 * Capability resolver implementation
 */
export class CapabilityResolver implements ICapabilityResolver {
  /**
   * Derive system capabilities from user authentication context
   * 
   * @param authContext - User authentication context
   * @returns Array of system capabilities
   */
  async deriveCapabilities(authContext: AuthContext): Promise<SystemCapability[]> {
    const startTime = Date.now();
    
    try {
      // Get capabilities for user's system role
      const capabilities = this.getCapabilitiesForRole(authContext.systemRole);
      
      const duration = Date.now() - startTime;
      
      logStructured('INFO', 'Capabilities derived', {
        userId: authContext.userId,
        systemRole: authContext.systemRole,
        capabilities: capabilities,
        duration,
      });
      
      return capabilities;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logStructured('ERROR', 'Failed to derive capabilities', {
        userId: authContext.userId,
        systemRole: authContext.systemRole,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });
      
      // Fail-safe: return empty capabilities on error
      return [];
    }
  }
  
  /**
   * Check if system role grants specific capability
   * 
   * @param systemRole - User's system role
   * @param capability - Capability to check
   * @returns True if role grants capability
   */
  hasCapability(systemRole: SystemRole, capability: SystemCapability): boolean {
    const roleCapabilities = this.getCapabilitiesForRole(systemRole);
    return roleCapabilities.includes(capability);
  }
  
  /**
   * Get all capabilities for a system role
   * 
   * @param systemRole - System role
   * @returns Array of capabilities
   */
  private getCapabilitiesForRole(systemRole: SystemRole): SystemCapability[] {
    return CAPABILITY_MATRIX[systemRole] || [];
  }
  
  /**
   * Validate that a capability exists in the system
   * 
   * @param capability - Capability to validate
   * @returns True if capability is valid
   */
  isValidCapability(capability: string): capability is SystemCapability {
    return Object.values(SystemCapability).includes(capability as SystemCapability);
  }
  
  /**
   * Get all available system capabilities
   * 
   * @returns Array of all system capabilities
   */
  getAllCapabilities(): SystemCapability[] {
    return Object.values(SystemCapability);
  }
  
  /**
   * Get capability matrix for debugging/documentation
   * 
   * @returns Complete capability matrix
   */
  getCapabilityMatrix(): Record<SystemRole, SystemCapability[]> {
    return { ...CAPABILITY_MATRIX };
  }
}