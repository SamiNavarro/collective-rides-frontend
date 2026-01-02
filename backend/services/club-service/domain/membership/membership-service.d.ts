/**
 * Club Membership Service - Phase 2.2
 *
 * Business logic layer for club membership operations.
 * Handles membership lifecycle, role management, and business rules.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
import { ClubMembership, ClubRole, MembershipStatus, JoinClubInput, UpdateMemberInput, RemoveMemberInput, ListMembersOptions, ListMembersResult, UserMembershipSummary } from '../../../../shared/types/membership';
import { AuthContext } from '../../../../shared/types/auth';
import { IMembershipRepository } from './membership-repository';
import { IClubRepository } from '../club-repository';
import { IAuthorizationService } from '../../../../shared/authorization/types';
/**
 * Club membership service implementation
 */
export declare class MembershipService {
    private membershipRepository;
    private clubRepository;
    private authorizationService;
    private authService;
    constructor(membershipRepository: IMembershipRepository, clubRepository: IClubRepository, authorizationService: IAuthorizationService);
    /**
     * Join a club (create membership request)
     *
     * @param clubId - Club ID
     * @param input - Join club input
     * @param authContext - Authentication context
     * @returns Created membership
     */
    joinClub(clubId: string, input: JoinClubInput, authContext: AuthContext): Promise<ClubMembership>;
    /**
     * Leave a club (voluntary departure)
     *
     * @param clubId - Club ID
     * @param authContext - Authentication context
     * @returns Updated membership
     */
    leaveClub(clubId: string, authContext: AuthContext): Promise<ClubMembership>;
    /**
     * List club members
     *
     * @param clubId - Club ID
     * @param options - List options
     * @param authContext - Authentication context
     * @returns Paginated list of club members
     */
    listClubMembers(clubId: string, options: ListMembersOptions, authContext: AuthContext): Promise<ListMembersResult>;
    /**
     * Update member role
     *
     * @param clubId - Club ID
     * @param targetUserId - Target user ID
     * @param input - Update member input
     * @param authContext - Authentication context
     * @returns Updated membership
     */
    updateMemberRole(clubId: string, targetUserId: string, input: UpdateMemberInput, authContext: AuthContext): Promise<ClubMembership>;
    /**
     * Remove member from club
     *
     * @param clubId - Club ID
     * @param targetUserId - Target user ID
     * @param input - Remove member input
     * @param authContext - Authentication context
     * @returns Updated membership
     */
    removeMember(clubId: string, targetUserId: string, input: RemoveMemberInput, authContext: AuthContext): Promise<ClubMembership>;
    /**
     * Get user's club memberships
     *
     * @param authContext - Authentication context
     * @param status - Optional status filter
     * @returns List of user's club memberships
     */
    getUserMemberships(authContext: AuthContext, status?: MembershipStatus): Promise<UserMembershipSummary[]>;
    /**
     * Get user's role in club
     *
     * @param clubId - Club ID
     * @param userId - User ID
     * @returns User's role if they are an active member, null otherwise
     */
    getUserRoleInClub(clubId: string, userId: string): Promise<ClubRole | null>;
    /**
     * Check if user is club member
     *
     * @param clubId - Club ID
     * @param userId - User ID
     * @returns True if user is an active member
     */
    isUserMember(clubId: string, userId: string): Promise<boolean>;
    /**
     * Validate join club input
     */
    private validateJoinClubInput;
    /**
     * Validate update member input
     */
    private validateUpdateMemberInput;
    /**
     * Validate remove member input
     */
    private validateRemoveMemberInput;
}
