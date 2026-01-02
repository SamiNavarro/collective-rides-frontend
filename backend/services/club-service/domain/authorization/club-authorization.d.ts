/**
 * Club Authorization System - Phase 2.2
 *
 * Club-level authorization middleware and capability checking.
 * Extends Phase 1.3 authorization with club-specific permissions.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
import { ClubCapability, ClubAuthContext } from '../../../../shared/types/club-authorization';
import { ClubRole } from '../../../../shared/types/membership';
import { AuthContext } from '../../../../shared/types/auth';
import { IAuthorizationService } from '../../../../shared/authorization/types';
import { IMembershipRepository } from '../membership/membership-repository';
/**
 * Club authorization service
 */
export declare class ClubAuthorizationService {
    private membershipRepository;
    private authorizationService;
    constructor(membershipRepository: IMembershipRepository, authorizationService: IAuthorizationService);
    /**
     * Create enhanced authorization context with club membership
     */
    createClubAuthContext(authContext: AuthContext, clubId: string): Promise<ClubAuthContext>;
    /**
     * Check if user has club capability
     */
    hasClubCapability(authContext: AuthContext, clubId: string, capability: ClubCapability): Promise<boolean>;
    /**
     * Require club capability (throws if not authorized)
     */
    requireClubCapability(authContext: AuthContext, clubId: string, capability: ClubCapability): Promise<void>;
    /**
     * Check if user can manage member (role hierarchy check)
     */
    canManageMember(authContext: AuthContext, clubId: string, targetMemberRole: ClubRole): Promise<boolean>;
    /**
     * Validate role assignment permissions
     */
    validateRoleAssignment(authContext: AuthContext, clubId: string, targetRole: ClubRole): Promise<void>;
    /**
     * Check if role is admin or owner
     */
    private isAdminOrOwner;
}
/**
 * Create club authorization middleware function
 */
export declare function requireClubCapability(capability: ClubCapability, clubId: string, membershipRepository: IMembershipRepository, authorizationService: IAuthorizationService): (authContext: AuthContext) => Promise<void>;
/**
 * Create club authorization middleware with dynamic club ID
 */
export declare function requireClubCapabilityDynamic(capability: ClubCapability, membershipRepository: IMembershipRepository, authorizationService: IAuthorizationService): (clubId: string) => (authContext: AuthContext) => Promise<void>;
