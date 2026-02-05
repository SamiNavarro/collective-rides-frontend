/**
 * Club Authorization System - Phase 2.2
 * 
 * Club-level authorization middleware and capability checking.
 * Extends Phase 1.3 authorization with club-specific permissions.
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import {
    ClubCapability,
    ClubAuthContext,
    getCapabilitiesForRole,
    roleHasCapability,
    getMinimumRoleForCapability
} from '../../../../shared/types/club-authorization';
import { ClubRole, MembershipStatus } from '../../../../shared/types/membership';
import { AuthContext } from '../../../../shared/types/auth';
import { SystemCapability, IAuthorizationService } from '../../../../shared/authorization/types';
import { AuthorizationError, AuthorizationErrorType } from '../../../../shared/authorization/authorization-errors';
import { IMembershipRepository } from '../membership/membership-repository';

/**
 * Club authorization service
 */
export class ClubAuthorizationService {
    constructor(
        private membershipRepository: IMembershipRepository,
        private authorizationService: IAuthorizationService
    ) { }

    /**
     * Create enhanced authorization context with club membership
     */
    async createClubAuthContext(
        authContext: AuthContext,
        clubId: string
    ): Promise<ClubAuthContext> {
        // Get user's club membership
        const membership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);

        let clubCapabilities: ClubCapability[] = [];
        let clubMembership: ClubAuthContext['clubMembership'] = undefined;

        if (membership && membership.status === MembershipStatus.ACTIVE) {
            clubCapabilities = getCapabilitiesForRole(membership.role);
            clubMembership = {
                membershipId: membership.membershipId,
                clubId: membership.clubId,
                role: membership.role,
                status: membership.status,
                joinedAt: membership.joinedAt,
            };
        }

        return {
            ...authContext,
            clubMembership,
            clubCapabilities,
        };
    }

    /**
     * Check if user has club capability
     */
    async hasClubCapability(
        authContext: AuthContext,
        clubId: string,
        capability: ClubCapability
    ): Promise<boolean> {
        try {
            await this.requireClubCapability(authContext, clubId, capability);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Require club capability (throws if not authorized)
     */
    async requireClubCapability(
        authContext: AuthContext,
        clubId: string,
        capability: ClubCapability
    ): Promise<void> {
        // Check system-level capabilities first (SiteAdmin override)
        const hasSystemOverride = await this.authorizationService.hasSystemCapability(
            authContext, 
            SystemCapability.MANAGE_ALL_CLUBS
        );
        if (hasSystemOverride) {
            return; // System admin has all club capabilities
        }

        // Get user's club membership (real-time check - no caching)
        const membership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);

        if (!membership || membership.status !== MembershipStatus.ACTIVE) {
            throw new AuthorizationError(
                `Insufficient privileges: ${capability} required`,
                AuthorizationErrorType.INSUFFICIENT_PRIVILEGES,
                403,
                {
                    capability: capability as any, // Type assertion for compatibility
                    userId: authContext.userId,
                    resource: `club:${clubId}`,
                }
            );
        }

        // Check club-level capability
        if (!roleHasCapability(membership.role, capability)) {
            const requiredRoles = [getMinimumRoleForCapability(capability)].filter(Boolean) as ClubRole[];

            throw new AuthorizationError(
                `Insufficient privileges: ${capability} requires ${requiredRoles.join(' or ')} role`,
                AuthorizationErrorType.INSUFFICIENT_PRIVILEGES,
                403,
                {
                    capability: capability as any, // Type assertion for compatibility
                    userId: authContext.userId,
                    resource: `club:${clubId}`,
                }
            );
        }
    }

    /**
     * Check if user can manage member (role hierarchy check)
     */
    async canManageMember(
        authContext: AuthContext,
        clubId: string,
        targetMemberRole: ClubRole
    ): Promise<boolean> {
        // System admins can manage anyone
        const hasSystemOverride = await this.authorizationService.hasSystemCapability(
            authContext, 
            SystemCapability.MANAGE_ALL_CLUBS
        );
        if (hasSystemOverride) {
            return true;
        }

        // Get user's club membership
        const membership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);

        if (!membership || membership.status !== MembershipStatus.ACTIVE) {
            return false;
        }

        // Role hierarchy: Owner > Admin > Captain > Member
        const roleHierarchy: Record<ClubRole, number> = {
            [ClubRole.MEMBER]: 1,
            [ClubRole.CAPTAIN]: 2,
            [ClubRole.ADMIN]: 3,
            [ClubRole.OWNER]: 4,
        };

        const userLevel = roleHierarchy[membership.role];
        const targetLevel = roleHierarchy[targetMemberRole];

        // Can only manage members with lower or equal role level
        // Exception: Owners cannot be managed by anyone except system admins
        if (targetMemberRole === ClubRole.OWNER) {
            return false; // Owners cannot be managed (ownership transfer required)
        }

        return userLevel >= targetLevel;
    }

    /**
     * Validate role assignment permissions
     */
    async validateRoleAssignment(
        authContext: AuthContext,
        clubId: string,
        targetRole: ClubRole
    ): Promise<void> {
        // System admins can assign any role
        const hasSystemOverride = await this.authorizationService.hasSystemCapability(
            authContext, 
            SystemCapability.MANAGE_ALL_CLUBS
        );
        if (hasSystemOverride) {
            return;
        }

        // Get user's club membership
        const membership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);

        if (!membership || membership.status !== MembershipStatus.ACTIVE) {
            throw new AuthorizationError(
                'Must be an active club member to assign roles',
                AuthorizationErrorType.INSUFFICIENT_PRIVILEGES,
                403,
                {
                    userId: authContext.userId,
                    resource: `club:${clubId}`,
                }
            );
        }

        // Role assignment rules:
        // - Only owners can assign admin roles
        // - Admins and owners can assign member roles
        // - Nobody can assign owner roles (ownership transfer required)

        if (targetRole === ClubRole.OWNER) {
            throw new AuthorizationError(
                'Cannot assign owner role - ownership transfer required',
                AuthorizationErrorType.INSUFFICIENT_PRIVILEGES,
                403,
                {
                    userId: authContext.userId,
                    resource: `club:${clubId}`,
                }
            );
        }

        if (targetRole === ClubRole.ADMIN && membership.role !== ClubRole.OWNER) {
            throw new AuthorizationError(
                'Only club owners can assign admin roles',
                AuthorizationErrorType.INSUFFICIENT_PRIVILEGES,
                403,
                {
                    userId: authContext.userId,
                    resource: `club:${clubId}`,
                }
            );
        }

        if (targetRole === ClubRole.MEMBER && !this.isAdminOrOwner(membership.role)) {
            throw new AuthorizationError(
                'Only club admins and owners can assign member roles',
                AuthorizationErrorType.INSUFFICIENT_PRIVILEGES,
                403,
                {
                    userId: authContext.userId,
                    resource: `club:${clubId}`,
                }
            );
        }
    }

    /**
     * Check if role is admin or owner
     */
    private isAdminOrOwner(role: ClubRole): boolean {
        return role === ClubRole.ADMIN || role === ClubRole.OWNER;
    }
}

/**
 * Create club authorization middleware function
 */
export function requireClubCapability(
    capability: ClubCapability,
    clubId: string,
    membershipRepository: IMembershipRepository,
    authorizationService: IAuthorizationService
) {
    return async (authContext: AuthContext): Promise<void> => {
        const authService = new ClubAuthorizationService(membershipRepository, authorizationService);
        await authService.requireClubCapability(authContext, clubId, capability);
    };
}

/**
 * Create club authorization middleware with dynamic club ID
 */
export function requireClubCapabilityDynamic(
    capability: ClubCapability,
    membershipRepository: IMembershipRepository,
    authorizationService: IAuthorizationService
) {
    return (clubId: string) => async (authContext: AuthContext): Promise<void> => {
        const authService = new ClubAuthorizationService(membershipRepository, authorizationService);
        await authService.requireClubCapability(authContext, clubId, capability);
    };
}