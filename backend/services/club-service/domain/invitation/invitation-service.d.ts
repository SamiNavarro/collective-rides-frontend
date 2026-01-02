/**
 * Club Invitation Service - Phase 2.2
 *
 * Business logic layer for club invitation operations.
 * Handles dual invitation system (email and in-app) and invitation lifecycle.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
import { ClubInvitation, CreateInvitationInput, ProcessInvitationInput, ProcessJoinRequestInput, ListInvitationsOptions, ListInvitationsResult } from '../../../../shared/types/invitation';
import { ClubMembership } from '../../../../shared/types/membership';
import { AuthContext } from '../../../../shared/types/auth';
import { IInvitationRepository } from './invitation-repository';
import { IMembershipRepository } from '../membership/membership-repository';
import { IClubRepository } from '../club-repository';
import { IUserRepository } from '../../../user-profile/domain/user-repository';
import { IAuthorizationService } from '../../../../shared/authorization/types';
/**
 * Club invitation service implementation
 */
export declare class InvitationService {
    private invitationRepository;
    private membershipRepository;
    private clubRepository;
    private userRepository;
    private authorizationService;
    private authService;
    constructor(invitationRepository: IInvitationRepository, membershipRepository: IMembershipRepository, clubRepository: IClubRepository, userRepository: IUserRepository, authorizationService: IAuthorizationService);
    /**
     * Create club invitation (email or user invitation)
     *
     * @param clubId - Club ID
     * @param input - Invitation creation input
     * @param authContext - Authentication context
     * @returns Created invitation
     */
    createInvitation(clubId: string, input: CreateInvitationInput, authContext: AuthContext): Promise<ClubInvitation>;
    /**
     * Accept or decline invitation
     *
     * @param invitationId - Invitation ID
     * @param input - Process invitation input
     * @param authContext - Authentication context
     * @returns Updated invitation and membership (if accepted)
     */
    processInvitation(invitationId: string, input: ProcessInvitationInput, authContext: AuthContext): Promise<{
        invitation: ClubInvitation;
        membership?: ClubMembership;
    }>;
    /**
     * Cancel invitation (admin action)
     *
     * @param invitationId - Invitation ID
     * @param authContext - Authentication context
     * @returns Updated invitation
     */
    cancelInvitation(invitationId: string, authContext: AuthContext): Promise<ClubInvitation>;
    /**
     * Get user's pending invitations
     *
     * @param authContext - Authentication context
     * @param options - List options
     * @returns Paginated list of user's invitations
     */
    getUserInvitations(authContext: AuthContext, options?: ListInvitationsOptions): Promise<ListInvitationsResult>;
    /**
     * Get club invitations (admin view)
     *
     * @param clubId - Club ID
     * @param options - List options
     * @param authContext - Authentication context
     * @returns List of club invitations
     */
    getClubInvitations(clubId: string, options: ListInvitationsOptions, authContext: AuthContext): Promise<ClubInvitation[]>;
    /**
     * Process join request (approve/reject)
     *
     * @param membershipId - Membership ID (pending join request)
     * @param input - Process join request input
     * @param authContext - Authentication context
     * @returns Updated membership
     */
    processJoinRequest(membershipId: string, input: ProcessJoinRequestInput, authContext: AuthContext): Promise<ClubMembership>;
    /**
     * Validate create invitation input
     */
    private validateCreateInvitationInput;
    /**
     * Validate user invitation
     */
    private validateUserInvitation;
    /**
     * Validate email invitation
     */
    private validateEmailInvitation;
    /**
     * Validate invitation processing
     */
    private validateInvitationProcessing;
    /**
     * Validate email format
     */
    private isValidEmail;
}
