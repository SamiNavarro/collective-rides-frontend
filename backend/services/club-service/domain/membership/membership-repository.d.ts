/**
 * Club Membership Repository Interface - Phase 2.2
 *
 * Repository interface for club membership data access operations.
 * Defines the contract for membership persistence layer.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
import { ClubMembership, ClubRole, MembershipStatus, JoinClubInput, UpdateMemberInput, ListMembersOptions, ListMembersResult, UserMembershipSummary } from '../../../../shared/types/membership';
/**
 * Club membership repository interface
 */
export interface IMembershipRepository {
    /**
     * Get membership by club and user
     *
     * @param clubId - Club ID
     * @param userId - User ID
     * @returns Membership if found, null otherwise
     */
    getMembershipByClubAndUser(clubId: string, userId: string): Promise<ClubMembership | null>;
    /**
     * Get membership by ID
     *
     * @param membershipId - Membership ID
     * @returns Membership if found, null otherwise
     */
    getMembershipById(membershipId: string): Promise<ClubMembership | null>;
    /**
     * List club members with pagination and filtering
     *
     * @param clubId - Club ID
     * @param options - List options (limit, cursor, role, status filter)
     * @returns Paginated list of club members with user info
     */
    listClubMembers(clubId: string, options: ListMembersOptions): Promise<ListMembersResult>;
    /**
     * List user's club memberships
     *
     * @param userId - User ID
     * @param status - Optional status filter
     * @returns List of user's club memberships
     */
    listUserMemberships(userId: string, status?: MembershipStatus): Promise<UserMembershipSummary[]>;
    /**
     * Create a new membership (join club)
     *
     * @param clubId - Club ID
     * @param userId - User ID
     * @param input - Join club input
     * @param role - Member role (default: member)
     * @param status - Membership status (default: pending for private clubs, active for public)
     * @returns Created membership
     */
    createMembership(clubId: string, userId: string, input: JoinClubInput, role?: ClubRole, status?: MembershipStatus): Promise<ClubMembership>;
    /**
     * Update membership role
     *
     * @param membershipId - Membership ID
     * @param input - Update member input
     * @param updatedBy - User ID of who is making the update
     * @returns Updated membership
     * @throws MembershipNotFoundError if membership doesn't exist
     */
    updateMembershipRole(membershipId: string, input: UpdateMemberInput, updatedBy: string): Promise<ClubMembership>;
    /**
     * Update membership status
     *
     * @param membershipId - Membership ID
     * @param status - New status
     * @param processedBy - User ID of who is making the update
     * @param reason - Optional reason for status change
     * @returns Updated membership
     * @throws MembershipNotFoundError if membership doesn't exist
     */
    updateMembershipStatus(membershipId: string, status: MembershipStatus, processedBy?: string, reason?: string): Promise<ClubMembership>;
    /**
     * Remove membership (set status to removed)
     *
     * @param membershipId - Membership ID
     * @param removedBy - User ID of who is removing the member
     * @param reason - Optional reason for removal
     * @returns Updated membership
     * @throws MembershipNotFoundError if membership doesn't exist
     */
    removeMembership(membershipId: string, removedBy: string, reason?: string): Promise<ClubMembership>;
    /**
     * Check if user is a member of club
     *
     * @param clubId - Club ID
     * @param userId - User ID
     * @returns True if user is an active member
     */
    isUserMember(clubId: string, userId: string): Promise<boolean>;
    /**
     * Get user's role in club
     *
     * @param clubId - Club ID
     * @param userId - User ID
     * @returns User's role if they are an active member, null otherwise
     */
    getUserRoleInClub(clubId: string, userId: string): Promise<ClubRole | null>;
    /**
     * Count club members by status
     *
     * @param clubId - Club ID
     * @param status - Membership status (default: active)
     * @returns Number of members with the specified status
     */
    countClubMembers(clubId: string, status?: MembershipStatus): Promise<number>;
    /**
     * Get club owner
     *
     * @param clubId - Club ID
     * @returns Club owner membership, null if not found
     */
    getClubOwner(clubId: string): Promise<ClubMembership | null>;
    /**
     * Get club admins (including owner)
     *
     * @param clubId - Club ID
     * @returns List of admin and owner memberships
     */
    getClubAdmins(clubId: string): Promise<ClubMembership[]>;
    /**
     * Check if user has pending membership request
     *
     * @param clubId - Club ID
     * @param userId - User ID
     * @returns True if user has pending membership request
     */
    hasPendingMembershipRequest(clubId: string, userId: string): Promise<boolean>;
}
