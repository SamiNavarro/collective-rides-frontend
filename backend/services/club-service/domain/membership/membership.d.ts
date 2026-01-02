/**
 * Club Membership Entity - Phase 2.2
 *
 * Core membership entity with business logic and validation.
 * Implements membership lifecycle management and role transitions.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
import { ClubMembership, ClubRole, MembershipStatus, UpdateMemberInput } from '../../../../shared/types/membership';
/**
 * Club membership entity with business logic
 */
export declare class MembershipEntity {
    private membership;
    constructor(membership: ClubMembership);
    /**
     * Get membership data
     */
    toMembership(): ClubMembership;
    /**
     * Get membership ID
     */
    getId(): string;
    /**
     * Get club ID
     */
    getClubId(): string;
    /**
     * Get user ID
     */
    getUserId(): string;
    /**
     * Get membership role
     */
    getRole(): ClubRole;
    /**
     * Get membership status
     */
    getStatus(): MembershipStatus;
    /**
     * Check if membership is active
     */
    isActive(): boolean;
    /**
     * Check if membership is pending
     */
    isPending(): boolean;
    /**
     * Check if member is owner
     */
    isOwner(): boolean;
    /**
     * Check if member is admin or owner
     */
    isAdminOrOwner(): boolean;
    /**
     * Check if member can be removed
     */
    canBeRemoved(): boolean;
    /**
     * Check if member can leave voluntarily
     */
    canLeave(): boolean;
    /**
     * Update member role
     */
    updateRole(input: UpdateMemberInput, updatedBy: string): MembershipEntity;
    /**
     * Change membership status
     */
    changeStatus(newStatus: MembershipStatus, processedBy?: string, reason?: string): MembershipEntity;
    /**
     * Activate pending membership (accept join request or invitation)
     */
    activate(processedBy?: string): MembershipEntity;
    /**
     * Remove membership
     */
    remove(processedBy: string, reason?: string): MembershipEntity;
    /**
     * Suspend membership
     */
    suspend(processedBy: string, reason?: string): MembershipEntity;
    /**
     * Reinstate suspended membership
     */
    reinstate(processedBy: string): MembershipEntity;
}
/**
 * Create a new club membership (join request)
 */
export declare function createMembership(clubId: string, userId: string, role?: ClubRole, status?: MembershipStatus, joinMessage?: string, invitedBy?: string): MembershipEntity;
/**
 * Create membership entity from existing data
 */
export declare function fromMembershipData(membership: ClubMembership): MembershipEntity;
