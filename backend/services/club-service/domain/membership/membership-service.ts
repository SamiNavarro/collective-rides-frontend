/**
 * Club Membership Service - Phase 2.2
 * 
 * Business logic layer for club membership operations.
 * Handles membership lifecycle, role management, and business rules.
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import { 
  ClubMembership, 
  ClubRole, 
  MembershipStatus, 
  JoinClubInput, 
  UpdateMemberInput,
  RemoveMemberInput,
  ListMembersOptions, 
  ListMembersResult,
  UserMembershipSummary,
  MEMBERSHIP_CONSTRAINTS
} from '../../../../shared/types/membership';
import { AuthContext } from '../../../../shared/types/auth';
import { NotFoundError, ValidationError, ConflictError } from '../../../../shared/utils/errors';
import { logStructured } from '../../../../shared/utils/lambda-utils';
import { IMembershipRepository } from './membership-repository';
import { IClubRepository } from '../club-repository';
import { 
  AlreadyMemberError, 
  MembershipNotFoundError, 
  CannotRemoveOwnerError,
  MembershipOperationNotAllowedError
} from './membership-errors';
import { ClubAuthorizationService } from '../authorization/club-authorization';
import { IAuthorizationService } from '../../../../shared/authorization/types';

/**
 * Club membership service implementation
 */
export class MembershipService {
  private authService: ClubAuthorizationService;

  constructor(
    private membershipRepository: IMembershipRepository,
    private clubRepository: IClubRepository,
    private authorizationService: IAuthorizationService
  ) {
    this.authService = new ClubAuthorizationService(membershipRepository, authorizationService);
  }

  /**
   * Join a club (create membership request)
   * 
   * @param clubId - Club ID
   * @param input - Join club input
   * @param authContext - Authentication context
   * @returns Created membership
   */
  async joinClub(clubId: string, input: JoinClubInput, authContext: AuthContext): Promise<ClubMembership> {
    logStructured('INFO', 'Processing club join request', {
      clubId,
      userId: authContext.userId,
      operation: 'join_club',
    });

    // Validate input
    this.validateJoinClubInput(input);

    // Check if club exists
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundError('Club not found');
    }

    // Check if user is already a member
    const existingMembership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);
    if (existingMembership && existingMembership.status !== MembershipStatus.REMOVED) {
      throw new AlreadyMemberError(clubId, authContext.userId);
    }

    // Determine initial status based on club settings
    // For Phase 2.2, assume all clubs are public (auto-approve)
    // Future phases can add private club logic
    const initialStatus = MembershipStatus.ACTIVE;

    // Create membership
    const membership = await this.membershipRepository.createMembership(
      clubId,
      authContext.userId,
      input,
      ClubRole.MEMBER,
      initialStatus
    );

    logStructured('INFO', 'User joined club successfully', {
      clubId,
      userId: authContext.userId,
      membershipId: membership.membershipId,
      status: membership.status,
    });

    return membership;
  }

  /**
   * Leave a club (voluntary departure)
   * 
   * @param clubId - Club ID
   * @param authContext - Authentication context
   * @returns Updated membership
   */
  async leaveClub(clubId: string, authContext: AuthContext): Promise<ClubMembership> {
    logStructured('INFO', 'Processing club leave request', {
      clubId,
      userId: authContext.userId,
      operation: 'leave_club',
    });

    // Get user's membership
    const membership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);
    if (!membership || membership.status !== MembershipStatus.ACTIVE) {
      throw new MembershipNotFoundError(undefined, clubId, authContext.userId);
    }

    // Owners cannot leave (must transfer ownership first)
    if (membership.role === ClubRole.OWNER) {
      throw new MembershipOperationNotAllowedError(
        'leave_club', 
        membership.membershipId, 
        'Owners cannot leave - ownership transfer required'
      );
    }

    // Remove membership
    const updatedMembership = await this.membershipRepository.removeMembership(
      membership.membershipId,
      authContext.userId,
      'Voluntary departure'
    );

    logStructured('INFO', 'User left club successfully', {
      clubId,
      userId: authContext.userId,
      membershipId: membership.membershipId,
    });

    return updatedMembership;
  }

  /**
   * List club members
   * 
   * @param clubId - Club ID
   * @param options - List options
   * @param authContext - Authentication context
   * @returns Paginated list of club members
   */
  async listClubMembers(
    clubId: string, 
    options: ListMembersOptions, 
    authContext: AuthContext
  ): Promise<ListMembersResult> {
    logStructured('INFO', 'Listing club members', {
      clubId,
      userId: authContext.userId,
      limit: options.limit,
      role: options.role,
      status: options.status,
      operation: 'list_club_members',
    });

    // Validate options
    const limit = Math.min(
      options.limit || MEMBERSHIP_CONSTRAINTS.DEFAULT_LIST_LIMIT,
      MEMBERSHIP_CONSTRAINTS.MAX_LIST_LIMIT
    );

    // Check if club exists
    const club = await this.clubRepository.getClubById(clubId);
    if (!club) {
      throw new NotFoundError('Club not found');
    }

    // List members
    const result = await this.membershipRepository.listClubMembers(clubId, {
      ...options,
      limit,
    });

    logStructured('INFO', 'Club members listed successfully', {
      clubId,
      userId: authContext.userId,
      resultCount: result.members.length,
      hasNextCursor: !!result.nextCursor,
    });

    return result;
  }

  /**
   * Update member role
   * 
   * @param clubId - Club ID
   * @param targetUserId - Target user ID
   * @param input - Update member input
   * @param authContext - Authentication context
   * @returns Updated membership
   */
  async updateMemberRole(
    clubId: string, 
    targetUserId: string, 
    input: UpdateMemberInput, 
    authContext: AuthContext
  ): Promise<ClubMembership> {
    logStructured('INFO', 'Updating member role', {
      clubId,
      userId: authContext.userId,
      targetUserId,
      newRole: input.role,
      operation: 'update_member_role',
    });

    // Validate input
    this.validateUpdateMemberInput(input);

    // Get target member's membership
    const targetMembership = await this.membershipRepository.getMembershipByClubAndUser(clubId, targetUserId);
    if (!targetMembership || targetMembership.status !== MembershipStatus.ACTIVE) {
      throw new MembershipNotFoundError(undefined, clubId, targetUserId);
    }

    // Check authorization for role assignment
    await this.authService.validateRoleAssignment(authContext, clubId, input.role);

    // Check if user can manage this member
    const canManage = await this.authService.canManageMember(authContext, clubId, targetMembership.role);
    if (!canManage) {
      throw new MembershipOperationNotAllowedError(
        'update_member_role',
        targetMembership.membershipId,
        'Insufficient privileges to manage this member'
      );
    }

    // Update membership role
    const updatedMembership = await this.membershipRepository.updateMembershipRole(
      targetMembership.membershipId,
      input,
      authContext.userId
    );

    logStructured('INFO', 'Member role updated successfully', {
      clubId,
      userId: authContext.userId,
      targetUserId,
      membershipId: targetMembership.membershipId,
      previousRole: targetMembership.role,
      newRole: updatedMembership.role,
    });

    return updatedMembership;
  }

  /**
   * Remove member from club
   * 
   * @param clubId - Club ID
   * @param targetUserId - Target user ID
   * @param input - Remove member input
   * @param authContext - Authentication context
   * @returns Updated membership
   */
  async removeMember(
    clubId: string, 
    targetUserId: string, 
    input: RemoveMemberInput, 
    authContext: AuthContext
  ): Promise<ClubMembership> {
    logStructured('INFO', 'Removing club member', {
      clubId,
      userId: authContext.userId,
      targetUserId,
      reason: input.reason,
      operation: 'remove_member',
    });

    // Validate input
    this.validateRemoveMemberInput(input);

    // Get target member's membership
    const targetMembership = await this.membershipRepository.getMembershipByClubAndUser(clubId, targetUserId);
    if (!targetMembership || targetMembership.status !== MembershipStatus.ACTIVE) {
      throw new MembershipNotFoundError(undefined, clubId, targetUserId);
    }

    // Cannot remove owners (must transfer ownership first)
    if (targetMembership.role === ClubRole.OWNER) {
      throw new CannotRemoveOwnerError(clubId, targetUserId);
    }

    // Check if user can manage this member
    const canManage = await this.authService.canManageMember(authContext, clubId, targetMembership.role);
    if (!canManage) {
      throw new MembershipOperationNotAllowedError(
        'remove_member',
        targetMembership.membershipId,
        'Insufficient privileges to remove this member'
      );
    }

    // Remove membership
    const updatedMembership = await this.membershipRepository.removeMembership(
      targetMembership.membershipId,
      authContext.userId,
      input.reason
    );

    logStructured('INFO', 'Member removed successfully', {
      clubId,
      userId: authContext.userId,
      targetUserId,
      membershipId: targetMembership.membershipId,
      reason: input.reason,
    });

    return updatedMembership;
  }

  /**
   * Get user's club memberships
   * 
   * @param authContext - Authentication context
   * @param status - Optional status filter
   * @returns List of user's club memberships
   */
  async getUserMemberships(
    authContext: AuthContext, 
    status?: MembershipStatus
  ): Promise<UserMembershipSummary[]> {
    logStructured('INFO', 'Getting user memberships', {
      userId: authContext.userId,
      status,
      operation: 'get_user_memberships',
    });

    const memberships = await this.membershipRepository.listUserMemberships(authContext.userId, status);

    logStructured('INFO', 'User memberships retrieved', {
      userId: authContext.userId,
      membershipCount: memberships.length,
      status,
    });

    return memberships;
  }

  /**
   * Get user's role in club
   * 
   * @param clubId - Club ID
   * @param userId - User ID
   * @returns User's role if they are an active member, null otherwise
   */
  async getUserRoleInClub(clubId: string, userId: string): Promise<ClubRole | null> {
    return this.membershipRepository.getUserRoleInClub(clubId, userId);
  }

  /**
   * Check if user is club member
   * 
   * @param clubId - Club ID
   * @param userId - User ID
   * @returns True if user is an active member
   */
  async isUserMember(clubId: string, userId: string): Promise<boolean> {
    return this.membershipRepository.isUserMember(clubId, userId);
  }

  /**
   * Validate join club input
   */
  private validateJoinClubInput(input: JoinClubInput): void {
    if (input.message && input.message.length > MEMBERSHIP_CONSTRAINTS.JOIN_MESSAGE_MAX_LENGTH) {
      throw new ValidationError(`Join message must not exceed ${MEMBERSHIP_CONSTRAINTS.JOIN_MESSAGE_MAX_LENGTH} characters`);
    }
  }

  /**
   * Validate update member input
   */
  private validateUpdateMemberInput(input: UpdateMemberInput): void {
    if (!Object.values(ClubRole).includes(input.role)) {
      throw new ValidationError('Invalid club role');
    }

    if (input.reason && input.reason.length > MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH) {
      throw new ValidationError(`Reason must not exceed ${MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH} characters`);
    }
  }

  /**
   * Validate remove member input
   */
  private validateRemoveMemberInput(input: RemoveMemberInput): void {
    if (input.reason && input.reason.length > MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH) {
      throw new ValidationError(`Reason must not exceed ${MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH} characters`);
    }
  }
}