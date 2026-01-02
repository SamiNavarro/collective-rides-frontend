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
/**
 * Capability resolver implementation
 */
export declare class CapabilityResolver implements ICapabilityResolver {
    /**
     * Derive system capabilities from user authentication context
     *
     * @param authContext - User authentication context
     * @returns Array of system capabilities
     */
    deriveCapabilities(authContext: AuthContext): Promise<SystemCapability[]>;
    /**
     * Check if system role grants specific capability
     *
     * @param systemRole - User's system role
     * @param capability - Capability to check
     * @returns True if role grants capability
     */
    hasCapability(systemRole: SystemRole, capability: SystemCapability): boolean;
    /**
     * Get all capabilities for a system role
     *
     * @param systemRole - System role
     * @returns Array of capabilities
     */
    private getCapabilitiesForRole;
    /**
     * Validate that a capability exists in the system
     *
     * @param capability - Capability to validate
     * @returns True if capability is valid
     */
    isValidCapability(capability: string): capability is SystemCapability;
    /**
     * Get all available system capabilities
     *
     * @returns Array of all system capabilities
     */
    getAllCapabilities(): SystemCapability[];
    /**
     * Get capability matrix for debugging/documentation
     *
     * @returns Complete capability matrix
     */
    getCapabilityMatrix(): Record<SystemRole, SystemCapability[]>;
}
