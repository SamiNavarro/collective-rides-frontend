/**
 * Club Invitation Repository Interface - Phase 2.2
 *
 * Repository interface for club invitation data access operations.
 * Defines the contract for invitation persistence layer.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
import { ClubInvitation, CreateInvitationInput, ProcessInvitationInput, ListInvitationsOptions, ListInvitationsResult } from '../../../../shared/types/invitation';
/**
 * Club invitation repository interface
 */
export interface IInvitationRepository {
    /**
     * Get invitation by ID
     *
     * @param invitationId - Invitation ID
     * @returns Invitation if found, null otherwise
     */
    getInvitationById(invitationId: string): Promise<ClubInvitation | null>;
    /**
     * Get invitation by token (for email invitations)
     *
     * @param token - Invitation token
     * @returns Invitation if found, null otherwise
     */
    getInvitationByToken(token: string): Promise<ClubInvitation | null>;
    /**
     * List user's pending invitations
     *
     * @param userId - User ID
     * @param options - List options
     * @returns Paginated list of user's invitations
     */
    listUserInvitations(userId: string, options: ListInvitationsOptions): Promise<ListInvitationsResult>;
    /**
     * Create a new invitation
     *
     * @param input - Invitation creation input
     * @param clubId - Club ID
     * @param invitedBy - User ID of who is creating the invitation
     * @returns Created invitation
     */
    createInvitation(input: CreateInvitationInput, clubId: string, invitedBy: string): Promise<ClubInvitation>;
    /**
     * Process invitation (accept/decline)
     *
     * @param invitationId - Invitation ID
     * @param input - Process invitation input
     * @param userId - User ID (for email invitations when accepting)
     * @returns Updated invitation
     * @throws InvitationNotFoundError if invitation doesn't exist
     */
    processInvitation(invitationId: string, input: ProcessInvitationInput, userId?: string): Promise<ClubInvitation>;
    /**
     * Cancel invitation (admin action)
     *
     * @param invitationId - Invitation ID
     * @returns Updated invitation
     * @throws InvitationNotFoundError if invitation doesn't exist
     */
    cancelInvitation(invitationId: string): Promise<ClubInvitation>;
    /**
     * Check if user has pending invitation to club
     *
     * @param clubId - Club ID
     * @param userId - User ID (for user invitations)
     * @param email - Email address (for email invitations)
     * @returns True if user has pending invitation
     */
    hasPendingInvitation(clubId: string, userId?: string, email?: string): Promise<boolean>;
    /**
     * Get pending invitations for club (admin view)
     *
     * @param clubId - Club ID
     * @param options - List options
     * @returns List of pending invitations for the club
     */
    listClubInvitations(clubId: string, options: ListInvitationsOptions): Promise<ClubInvitation[]>;
    /**
     * Expire old invitations
     *
     * @param beforeDate - Expire invitations created before this date
     * @returns Number of invitations expired
     */
    expireInvitations(beforeDate: Date): Promise<number>;
    /**
     * Get invitation statistics for club
     *
     * @param clubId - Club ID
     * @returns Invitation statistics
     */
    getInvitationStats(clubId: string): Promise<{
        pending: number;
        accepted: number;
        declined: number;
        expired: number;
        cancelled: number;
    }>;
}
