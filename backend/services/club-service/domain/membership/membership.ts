/**
 * Club Membership Entity - Phase 2.2
 * 
 * Core membership entity with business logic and validation.
 * Implements membership lifecycle management and role transitions.
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import { 
  ClubMembership, 
  ClubRole, 
  MembershipStatus, 
  UpdateMemberInput,
  MEMBERSHIP_CONSTRAINTS,
  MEMBERSHIP_STATUS_TRANSITIONS,
  isValidMembershipStatusTransition
} from '../../../../shared/types/membership';
import { ValidationError } from '../../../../shared/utils/errors';

/**
 * Club membership entity with business logic
 */
export class MembershipEntity {
  constructor(private membership: ClubMembership) {}

  /**
   * Get membership data
   */
  toMembership(): ClubMembership {
    return { ...this.membership };
  }

  /**
   * Get membership ID
   */
  getId(): string {
    return this.membership.membershipId;
  }

  /**
   * Get club ID
   */
  getClubId(): string {
    return this.membership.clubId;
  }

  /**
   * Get user ID
   */
  getUserId(): string {
    return this.membership.userId;
  }

  /**
   * Get membership role
   */
  getRole(): ClubRole {
    return this.membership.role;
  }

  /**
   * Get membership status
   */
  getStatus(): MembershipStatus {
    return this.membership.status;
  }

  /**
   * Check if membership is active
   */
  isActive(): boolean {
    return this.membership.status === MembershipStatus.ACTIVE;
  }

  /**
   * Check if membership is pending
   */
  isPending(): boolean {
    return this.membership.status === MembershipStatus.PENDING;
  }

  /**
   * Check if member is owner
   */
  isOwner(): boolean {
    return this.membership.role === ClubRole.OWNER;
  }

  /**
   * Check if member is admin or owner
   */
  isAdminOrOwner(): boolean {
    return this.membership.role === ClubRole.ADMIN || this.membership.role === ClubRole.OWNER;
  }

  /**
   * Check if member can be removed
   */
  canBeRemoved(): boolean {
    // Owners cannot be removed (must transfer ownership first)
    return this.membership.role !== ClubRole.OWNER;
  }

  /**
   * Check if member can leave voluntarily
   */
  canLeave(): boolean {
    // Owners cannot leave (must transfer ownership first)
    return this.membership.role !== ClubRole.OWNER && this.isActive();
  }

  /**
   * Update member role
   */
  updateRole(input: UpdateMemberInput, updatedBy: string): MembershipEntity {
    // Validate role transition
    validateRoleTransition(this.membership.role, input.role);

    // Owners cannot be demoted (must transfer ownership first)
    if (this.membership.role === ClubRole.OWNER) {
      throw new ValidationError('Cannot change owner role - ownership transfer required');
    }

    const updatedMembership: ClubMembership = {
      ...this.membership,
      role: input.role,
      updatedAt: new Date().toISOString(),
      processedBy: updatedBy,
      processedAt: new Date().toISOString(),
      reason: input.reason,
    };

    return new MembershipEntity(updatedMembership);
  }

  /**
   * Change membership status
   */
  changeStatus(newStatus: MembershipStatus, processedBy?: string, reason?: string): MembershipEntity {
    if (this.membership.status === newStatus) {
      return this; // No change needed
    }

    // Validate status transition
    if (!isValidMembershipStatusTransition(this.membership.status, newStatus)) {
      throw new ValidationError(`Cannot transition membership from ${this.membership.status} to ${newStatus}`);
    }

    // Owners cannot be suspended or removed (must transfer ownership first)
    if (this.membership.role === ClubRole.OWNER && 
        (newStatus === MembershipStatus.SUSPENDED || newStatus === MembershipStatus.REMOVED)) {
      throw new ValidationError('Cannot suspend or remove owner - ownership transfer required');
    }

    const updatedMembership: ClubMembership = {
      ...this.membership,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      processedBy,
      processedAt: processedBy ? new Date().toISOString() : undefined,
      reason,
    };

    return new MembershipEntity(updatedMembership);
  }

  /**
   * Activate pending membership (accept join request or invitation)
   */
  activate(processedBy?: string): MembershipEntity {
    return this.changeStatus(MembershipStatus.ACTIVE, processedBy, 'Membership activated');
  }

  /**
   * Remove membership
   */
  remove(processedBy: string, reason?: string): MembershipEntity {
    return this.changeStatus(MembershipStatus.REMOVED, processedBy, reason || 'Member removed');
  }

  /**
   * Suspend membership
   */
  suspend(processedBy: string, reason?: string): MembershipEntity {
    return this.changeStatus(MembershipStatus.SUSPENDED, processedBy, reason || 'Member suspended');
  }

  /**
   * Reinstate suspended membership
   */
  reinstate(processedBy: string): MembershipEntity {
    return this.changeStatus(MembershipStatus.ACTIVE, processedBy, 'Member reinstated');
  }
}

/**
 * Create a new club membership (join request)
 */
export function createMembership(
  clubId: string, 
  userId: string, 
  role: ClubRole = ClubRole.MEMBER,
  status: MembershipStatus = MembershipStatus.PENDING,
  joinMessage?: string,
  invitedBy?: string
): MembershipEntity {
  const now = new Date().toISOString();
  const membershipId = generateMembershipId();

  const membership: ClubMembership = {
    membershipId,
    clubId,
    userId,
    role,
    status,
    joinedAt: now,
    updatedAt: now,
    joinMessage: joinMessage?.trim(),
    invitedBy,
  };

  // Validate membership data
  validateMembershipData(membership);

  return new MembershipEntity(membership);
}

/**
 * Create membership entity from existing data
 */
export function fromMembershipData(membership: ClubMembership): MembershipEntity {
  // Validate existing membership data
  validateMembershipData(membership);
  return new MembershipEntity(membership);
}

/**
 * Validate membership data
 */
function validateMembershipData(membership: ClubMembership): void {
  // Validate required fields
  if (!membership.membershipId || membership.membershipId.trim().length === 0) {
    throw new ValidationError('Membership ID is required');
  }

  if (!membership.clubId || membership.clubId.trim().length === 0) {
    throw new ValidationError('Club ID is required');
  }

  if (!membership.userId || membership.userId.trim().length === 0) {
    throw new ValidationError('User ID is required');
  }

  // Validate role
  if (!Object.values(ClubRole).includes(membership.role)) {
    throw new ValidationError('Invalid club role');
  }

  // Validate status
  if (!Object.values(MembershipStatus).includes(membership.status)) {
    throw new ValidationError('Invalid membership status');
  }

  // Validate join message length
  if (membership.joinMessage && membership.joinMessage.length > MEMBERSHIP_CONSTRAINTS.JOIN_MESSAGE_MAX_LENGTH) {
    throw new ValidationError(`Join message must not exceed ${MEMBERSHIP_CONSTRAINTS.JOIN_MESSAGE_MAX_LENGTH} characters`);
  }

  // Validate reason length
  if (membership.reason && membership.reason.length > MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH) {
    throw new ValidationError(`Reason must not exceed ${MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH} characters`);
  }
}

/**
 * Validate role transition
 */
function validateRoleTransition(currentRole: ClubRole, newRole: ClubRole): void {
  // Define allowed role transitions
  const allowedTransitions: Record<ClubRole, ClubRole[]> = {
    [ClubRole.MEMBER]: [ClubRole.CAPTAIN, ClubRole.ADMIN], // Members can be promoted to captain or admin
    [ClubRole.CAPTAIN]: [ClubRole.MEMBER, ClubRole.ADMIN], // Captains can be promoted to admin or demoted to member
    [ClubRole.ADMIN]: [ClubRole.CAPTAIN, ClubRole.MEMBER], // Admins can be demoted to captain or member
    [ClubRole.OWNER]: [], // Owners cannot change roles (must transfer ownership)
  };

  const allowed = allowedTransitions[currentRole];
  if (!allowed.includes(newRole)) {
    throw new ValidationError(`Cannot transition role from ${currentRole} to ${newRole}`);
  }
}

/**
 * Generate unique membership ID
 */
function generateMembershipId(): string {
  // Generate a unique membership ID with timestamp and random component
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `mem_${timestamp}_${random}`;
}