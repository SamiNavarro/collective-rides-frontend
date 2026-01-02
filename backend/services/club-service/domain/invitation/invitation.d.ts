/**
 * Club Invitation Entity - Phase 2.2
 *
 * Core invitation entity with business logic and validation.
 * Implements dual invitation system (email and in-app) and lifecycle management.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
import { ClubInvitation, InvitationType, InvitationStatus, CreateInvitationInput, ProcessInvitationInput } from '../../../../shared/types/invitation';
import { ClubRole } from '../../../../shared/types/membership';
/**
 * Club invitation entity with business logic
 */
export declare class InvitationEntity {
    private invitation;
    constructor(invitation: ClubInvitation);
    /**
     * Get invitation data
     */
    toInvitation(): ClubInvitation;
    /**
     * Get invitation ID
     */
    getId(): string;
    /**
     * Get club ID
     */
    getClubId(): string;
    /**
     * Get invitation type
     */
    getType(): InvitationType;
    /**
     * Get target email (for email invitations)
     */
    getEmail(): string | undefined;
    /**
     * Get target user ID (for user invitations or accepted email invitations)
     */
    getUserId(): string | undefined;
    /**
     * Get invitation role
     */
    getRole(): ClubRole;
    /**
     * Get invitation status
     */
    getStatus(): InvitationStatus;
    /**
     * Check if invitation is pending
     */
    isPending(): boolean;
    /**
     * Check if invitation is expired
     */
    isExpired(): boolean;
    /**
     * Check if invitation can be processed (accepted/declined)
     */
    canBeProcessed(): boolean;
    /**
     * Check if invitation can be cancelled
     */
    canBeCancelled(): boolean;
    /**
     * Process invitation (accept or decline)
     */
    process(input: ProcessInvitationInput, userId?: string): InvitationEntity;
    /**
     * Accept invitation
     */
    accept(userId?: string): InvitationEntity;
    /**
     * Decline invitation
     */
    decline(): InvitationEntity;
    /**
     * Cancel invitation (admin action)
     */
    cancel(): InvitationEntity;
    /**
     * Mark invitation as expired
     */
    expire(): InvitationEntity;
}
/**
 * Create a new club invitation
 */
export declare function createInvitation(input: CreateInvitationInput, clubId: string, invitedBy: string): InvitationEntity;
/**
 * Create invitation entity from existing data
 */
export declare function fromInvitationData(invitation: ClubInvitation): InvitationEntity;
