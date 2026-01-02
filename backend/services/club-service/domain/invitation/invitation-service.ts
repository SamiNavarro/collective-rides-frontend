/**
 * Club Invitation Service - Phase 2.2
 * 
 * Business logic layer for club invitation operations.
 * Handles dual invitation system (email and in-app) and invitation lifecycle.
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import { 
  ClubInvitation, 
  InvitationType, 
  InvitationStatus, 
  CreateInvitationInput,
  ProcessInvitationInput,
  ProcessJoinRequestInput,
  ListInvitationsOptions, 
  ListInvitationsResult,
  UserInvitationSummary,
  INVITATION_CONSTRAINTS
} from '../../../../shared/types/invitation';
import { ClubRole, MembershipStatus, ClubMembership } from '../../../../shared/types/membership';
import { AuthContext } from '../../../../shared/types/auth';
import { NotFoundError, ValidationError, ConflictError } from '../../../../shared/utils/errors';
import { logStructured } from '../../../../shared/utils/lambda-utils';
import { IInvitationRepository } from './invitation-repository';
import { IMembershipRepository } from '../membership/membership-repository';
import { IClubRepository } from '../club-repository';
import { IUserRepository } from '../../../user-profile/domain/user-repository';
import { 
  InvitationNotFoundError, 
  InvitationExpiredError,
  InvitationAlreadyProcessedError,
  UserAlreadyInvitedError,
  CannotInviteExistingMemberError,
  InvitationOperationNotAllowedError
} from './invitation-errors';
import { AlreadyMemberError } from '../membership/membership-errors';
import { ClubAuthorizationService } from '../authorization/club-authorization';
import { IAuthorizationService } from '../../../../shared/authorization/types';

/**
 * Club invitation service implementation
 */
export class InvitationService {
  private authService: ClubAuthorizationService;

  constructor(
    private invitationRepository: IInvitationRepository,
    private membershipRepository: IMembershipRepository,
    private clubRepository: IClubRepository,
    private userRepository: IUserRepository,
    private authorizationService: IAuthorizationService
  ) {
    this.authService = new ClubAuthorizationService(membershipRepository, authorizationService);
  }

  /**
   * Create club invitation (email or user invitation)
   * 
   * @param clubId - Club ID
   * @param input - Invitation creation input
   * @param authContext - Authentication context
   * @returns Created invitation
   */
  async createInvitation(
    clubId: string, 
    input: CreateInvitationInput, 
    authContext: AuthContext
  ): Promise<ClubInvitation> {
    logStructured('INFO', 'Creating club invitation', {
      clubId,
      userId: authContext.userId,
      invitationType: input.type,
      targetRole: input.role,
      operation: 'create_invitation',
    });

    // Validate input
    this.validateCreateInvitationInput(input);

    // Check if club exists
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundError('Club not found');
    }

    // Type-specific validation and checks
    if (input.type === 'user') {
      await this.validateUserInvitation(clubId, input.userId);
    } else {
      await this.validateEmailInvitation(clubId, input.email);
    }

    // Create invitation
    const invitation = await this.invitationRepository.createInvitation(input, clubId, authContext.userId);

    logStructured('INFO', 'Club invitation created successfully', {
      clubId,
      userId: authContext.userId,
      invitationId: invitation.invitationId,
      invitationType: invitation.type,
      targetRole: invitation.role,
    });

    return invitation;
  }

  /**
   * Accept or decline invitation
   * 
   * @param invitationId - Invitation ID
   * @param input - Process invitation input
   * @param authContext - Authentication context
   * @returns Updated invitation and membership (if accepted)
   */
  async processInvitation(
    invitationId: string, 
    input: ProcessInvitationInput, 
    authContext: AuthContext
  ): Promise<{ invitation: ClubInvitation; membership?: ClubMembership }> {
    logStructured('INFO', 'Processing invitation', {
      invitationId,
      userId: authContext.userId,
      action: input.action,
      operation: 'process_invitation',
    });

    // Get invitation
    const invitation = await this.invitationRepository.getInvitationById(invitationId);
    if (!invitation) {
      throw new InvitationNotFoundError(invitationId);
    }

    // Validate invitation can be processed
    this.validateInvitationProcessing(invitation, authContext.userId);

    // Process invitation
    const updatedInvitation = await this.invitationRepository.processInvitation(
      invitationId, 
      input, 
      authContext.userId
    );

    let membership: ClubMembership | undefined;

    // If accepted, create membership
    if (input.action === 'accept') {
      // Check if user is already a member (race condition protection)
      const existingMembership = await this.membershipRepository.getMembershipByClubAndUser(
        invitation.clubId, 
        authContext.userId
      );
      
      if (existingMembership && existingMembership.status !== MembershipStatus.REMOVED) {
        throw new AlreadyMemberError(invitation.clubId, authContext.userId);
      }

      // Create membership
      membership = await this.membershipRepository.createMembership(
        invitation.clubId,
        authContext.userId,
        { message: `Accepted invitation: ${invitation.message || ''}` },
        invitation.role,
        MembershipStatus.ACTIVE
      );

      logStructured('INFO', 'Invitation accepted and membership created', {
        invitationId,
        userId: authContext.userId,
        clubId: invitation.clubId,
        membershipId: membership.membershipId,
        role: membership.role,
      });
    } else {
      logStructured('INFO', 'Invitation declined', {
        invitationId,
        userId: authContext.userId,
        clubId: invitation.clubId,
      });
    }

    return { invitation: updatedInvitation, membership };
  }

  /**
   * Cancel invitation (admin action)
   * 
   * @param invitationId - Invitation ID
   * @param authContext - Authentication context
   * @returns Updated invitation
   */
  async cancelInvitation(invitationId: string, authContext: AuthContext): Promise<ClubInvitation> {
    logStructured('INFO', 'Cancelling invitation', {
      invitationId,
      userId: authContext.userId,
      operation: 'cancel_invitation',
    });

    // Get invitation
    const invitation = await this.invitationRepository.getInvitationById(invitationId);
    if (!invitation) {
      throw new InvitationNotFoundError(invitationId);
    }

    // Cancel invitation
    const updatedInvitation = await this.invitationRepository.cancelInvitation(invitationId);

    logStructured('INFO', 'Invitation cancelled successfully', {
      invitationId,
      userId: authContext.userId,
      clubId: invitation.clubId,
    });

    return updatedInvitation;
  }

  /**
   * Get user's pending invitations
   * 
   * @param authContext - Authentication context
   * @param options - List options
   * @returns Paginated list of user's invitations
   */
  async getUserInvitations(
    authContext: AuthContext, 
    options: ListInvitationsOptions = {}
  ): Promise<ListInvitationsResult> {
    logStructured('INFO', 'Getting user invitations', {
      userId: authContext.userId,
      limit: options.limit,
      status: options.status,
      operation: 'get_user_invitations',
    });

    // Validate options
    const limit = Math.min(
      options.limit || INVITATION_CONSTRAINTS.DEFAULT_LIST_LIMIT,
      INVITATION_CONSTRAINTS.MAX_LIST_LIMIT
    );

    const result = await this.invitationRepository.listUserInvitations(authContext.userId, {
      ...options,
      limit,
    });

    logStructured('INFO', 'User invitations retrieved', {
      userId: authContext.userId,
      invitationCount: result.invitations.length,
      hasNextCursor: !!result.nextCursor,
    });

    return result;
  }

  /**
   * Get club invitations (admin view)
   * 
   * @param clubId - Club ID
   * @param options - List options
   * @param authContext - Authentication context
   * @returns List of club invitations
   */
  async getClubInvitations(
    clubId: string, 
    options: ListInvitationsOptions, 
    authContext: AuthContext
  ): Promise<ClubInvitation[]> {
    logStructured('INFO', 'Getting club invitations', {
      clubId,
      userId: authContext.userId,
      limit: options.limit,
      status: options.status,
      operation: 'get_club_invitations',
    });

    // Validate options
    const limit = Math.min(
      options.limit || INVITATION_CONSTRAINTS.DEFAULT_LIST_LIMIT,
      INVITATION_CONSTRAINTS.MAX_LIST_LIMIT
    );

    const invitations = await this.invitationRepository.listClubInvitations(clubId, {
      ...options,
      limit,
    });

    logStructured('INFO', 'Club invitations retrieved', {
      clubId,
      userId: authContext.userId,
      invitationCount: invitations.length,
    });

    return invitations;
  }

  /**
   * Process join request (approve/reject)
   * 
   * @param membershipId - Membership ID (pending join request)
   * @param input - Process join request input
   * @param authContext - Authentication context
   * @returns Updated membership
   */
  async processJoinRequest(
    membershipId: string, 
    input: ProcessJoinRequestInput, 
    authContext: AuthContext
  ): Promise<ClubMembership> {
    logStructured('INFO', 'Processing join request', {
      membershipId,
      userId: authContext.userId,
      action: input.action,
      operation: 'process_join_request',
    });

    // Get membership
    const membership = await this.membershipRepository.getMembershipById(membershipId);
    if (!membership) {
      throw new NotFoundError('Join request not found');
    }

    // Validate membership is pending
    if (membership.status !== MembershipStatus.PENDING) {
      throw new ValidationError('Join request is not pending');
    }

    // Process request
    const newStatus = input.action === 'approve' ? MembershipStatus.ACTIVE : MembershipStatus.REMOVED;
    const reason = input.action === 'approve' 
      ? `Join request approved${input.message ? `: ${input.message}` : ''}` 
      : `Join request rejected${input.message ? `: ${input.message}` : ''}`;

    const updatedMembership = await this.membershipRepository.updateMembershipStatus(
      membershipId,
      newStatus,
      authContext.userId,
      reason
    );

    logStructured('INFO', 'Join request processed successfully', {
      membershipId,
      userId: authContext.userId,
      clubId: membership.clubId,
      action: input.action,
      newStatus,
    });

    return updatedMembership;
  }

  /**
   * Validate create invitation input
   */
  private validateCreateInvitationInput(input: CreateInvitationInput): void {
    if (!Object.values(ClubRole).includes(input.role)) {
      throw new ValidationError('Invalid club role');
    }

    if (input.message && input.message.length > INVITATION_CONSTRAINTS.MESSAGE_MAX_LENGTH) {
      throw new ValidationError(`Message must not exceed ${INVITATION_CONSTRAINTS.MESSAGE_MAX_LENGTH} characters`);
    }

    if (input.type === 'email') {
      if (!input.email || input.email.trim().length === 0) {
        throw new ValidationError('Email is required for email invitations');
      }

      if (!this.isValidEmail(input.email)) {
        throw new ValidationError('Invalid email format');
      }
    } else {
      if (!input.userId || input.userId.trim().length === 0) {
        throw new ValidationError('User ID is required for user invitations');
      }
    }
  }

  /**
   * Validate user invitation
   */
  private async validateUserInvitation(clubId: string, userId: string): Promise<void> {
    // Check if user exists
    const user = await this.userRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user is already a member
    const existingMembership = await this.membershipRepository.getMembershipByClubAndUser(clubId, userId);
    if (existingMembership && existingMembership.status !== MembershipStatus.REMOVED) {
      throw new CannotInviteExistingMemberError(clubId, userId);
    }

    // Check if user already has a pending invitation
    const hasPendingInvitation = await this.invitationRepository.hasPendingInvitation(clubId, userId);
    if (hasPendingInvitation) {
      throw new UserAlreadyInvitedError(clubId, undefined, userId);
    }
  }

  /**
   * Validate email invitation
   */
  private async validateEmailInvitation(clubId: string, email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already has a pending invitation
    const hasPendingInvitation = await this.invitationRepository.hasPendingInvitation(clubId, undefined, normalizedEmail);
    if (hasPendingInvitation) {
      throw new UserAlreadyInvitedError(clubId, normalizedEmail);
    }

    // Check if user with this email is already a member
    // Note: This requires looking up user by email, which may not be efficient
    // For Phase 2.2, we'll skip this check and handle it during invitation acceptance
  }

  /**
   * Validate invitation processing
   */
  private validateInvitationProcessing(invitation: ClubInvitation, userId: string): void {
    // Check if invitation is pending
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new InvitationAlreadyProcessedError(invitation.invitationId, invitation.status);
    }

    // Check if invitation is expired
    const now = new Date();
    const expiryDate = new Date(invitation.expiresAt);
    if (now > expiryDate) {
      throw new InvitationExpiredError(invitation.invitationId, invitation.expiresAt);
    }

    // For user invitations, validate the user ID matches
    if (invitation.type === InvitationType.USER && invitation.userId !== userId) {
      throw new InvitationOperationNotAllowedError(
        'process_invitation',
        invitation.invitationId,
        'Invitation is not for this user'
      );
    }

    // For email invitations, we allow any authenticated user to accept
    // (they will be linked to the invitation upon acceptance)
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}