/**
 * Club Invitation Entity - Phase 2.2
 * 
 * Core invitation entity with business logic and validation.
 * Implements dual invitation system (email and in-app) and lifecycle management.
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
  INVITATION_CONSTRAINTS,
  INVITATION_STATUS_TRANSITIONS,
  isValidInvitationStatusTransition,
  generateInvitationToken,
  calculateInvitationExpiry
} from '../../../../shared/types/invitation';
import { ClubRole } from '../../../../shared/types/membership';
import { ValidationError } from '../../../../shared/utils/errors';

/**
 * Club invitation entity with business logic
 */
export class InvitationEntity {
  constructor(private invitation: ClubInvitation) {}

  /**
   * Get invitation data
   */
  toInvitation(): ClubInvitation {
    return { ...this.invitation };
  }

  /**
   * Get invitation ID
   */
  getId(): string {
    return this.invitation.invitationId;
  }

  /**
   * Get club ID
   */
  getClubId(): string {
    return this.invitation.clubId;
  }

  /**
   * Get invitation type
   */
  getType(): InvitationType {
    return this.invitation.type;
  }

  /**
   * Get target email (for email invitations)
   */
  getEmail(): string | undefined {
    return this.invitation.email;
  }

  /**
   * Get target user ID (for user invitations or accepted email invitations)
   */
  getUserId(): string | undefined {
    return this.invitation.userId;
  }

  /**
   * Get invitation role
   */
  getRole(): ClubRole {
    return this.invitation.role;
  }

  /**
   * Get invitation status
   */
  getStatus(): InvitationStatus {
    return this.invitation.status;
  }

  /**
   * Check if invitation is pending
   */
  isPending(): boolean {
    return this.invitation.status === InvitationStatus.PENDING;
  }

  /**
   * Check if invitation is expired
   */
  isExpired(): boolean {
    if (this.invitation.status === InvitationStatus.EXPIRED) {
      return true;
    }
    
    // Check if expiry date has passed
    const now = new Date();
    const expiryDate = new Date(this.invitation.expiresAt);
    return now > expiryDate;
  }

  /**
   * Check if invitation can be processed (accepted/declined)
   */
  canBeProcessed(): boolean {
    return this.isPending() && !this.isExpired();
  }

  /**
   * Check if invitation can be cancelled
   */
  canBeCancelled(): boolean {
    return this.isPending();
  }

  /**
   * Process invitation (accept or decline)
   */
  process(input: ProcessInvitationInput, userId?: string): InvitationEntity {
    if (!this.canBeProcessed()) {
      throw new ValidationError('Invitation cannot be processed - it may be expired or already processed');
    }

    const newStatus = input.action === 'accept' ? InvitationStatus.ACCEPTED : InvitationStatus.DECLINED;
    
    // Validate status transition
    if (!isValidInvitationStatusTransition(this.invitation.status, newStatus)) {
      throw new ValidationError(`Cannot transition invitation from ${this.invitation.status} to ${newStatus}`);
    }

    const updatedInvitation: ClubInvitation = {
      ...this.invitation,
      status: newStatus,
      processedAt: new Date().toISOString(),
      // Set userId for email invitations when accepted
      userId: userId || this.invitation.userId,
    };

    return new InvitationEntity(updatedInvitation);
  }

  /**
   * Accept invitation
   */
  accept(userId?: string): InvitationEntity {
    return this.process({ action: 'accept' }, userId);
  }

  /**
   * Decline invitation
   */
  decline(): InvitationEntity {
    return this.process({ action: 'decline' });
  }

  /**
   * Cancel invitation (admin action)
   */
  cancel(): InvitationEntity {
    if (!this.canBeCancelled()) {
      throw new ValidationError('Invitation cannot be cancelled - it may already be processed');
    }

    const updatedInvitation: ClubInvitation = {
      ...this.invitation,
      status: InvitationStatus.CANCELLED,
      processedAt: new Date().toISOString(),
    };

    return new InvitationEntity(updatedInvitation);
  }

  /**
   * Mark invitation as expired
   */
  expire(): InvitationEntity {
    if (!isValidInvitationStatusTransition(this.invitation.status, InvitationStatus.EXPIRED)) {
      throw new ValidationError(`Cannot expire invitation with status ${this.invitation.status}`);
    }

    const updatedInvitation: ClubInvitation = {
      ...this.invitation,
      status: InvitationStatus.EXPIRED,
      processedAt: new Date().toISOString(),
    };

    return new InvitationEntity(updatedInvitation);
  }
}

/**
 * Create a new club invitation
 */
export function createInvitation(
  input: CreateInvitationInput,
  clubId: string,
  invitedBy: string
): InvitationEntity {
  const now = new Date().toISOString();
  const invitationId = generateInvitationId();
  const expiresAt = calculateInvitationExpiry();

  const baseInvitation = {
    invitationId,
    clubId,
    role: input.role,
    status: InvitationStatus.PENDING,
    invitedBy,
    invitedAt: now,
    expiresAt,
    message: input.message?.trim(),
  };

  let invitation: ClubInvitation;

  if (input.type === 'email') {
    invitation = {
      ...baseInvitation,
      type: InvitationType.EMAIL,
      email: input.email.toLowerCase().trim(),
      userId: undefined,
      token: generateInvitationToken(),
      deliveryMethod: 'email',
    };
  } else {
    invitation = {
      ...baseInvitation,
      type: InvitationType.USER,
      email: undefined,
      userId: input.userId,
      token: undefined,
      deliveryMethod: 'in_app',
    };
  }

  // Validate invitation data
  validateInvitationData(invitation);

  return new InvitationEntity(invitation);
}

/**
 * Create invitation entity from existing data
 */
export function fromInvitationData(invitation: ClubInvitation): InvitationEntity {
  // Validate existing invitation data
  validateInvitationData(invitation);
  return new InvitationEntity(invitation);
}

/**
 * Validate invitation data
 */
function validateInvitationData(invitation: ClubInvitation): void {
  // Validate required fields
  if (!invitation.invitationId || invitation.invitationId.trim().length === 0) {
    throw new ValidationError('Invitation ID is required');
  }

  if (!invitation.clubId || invitation.clubId.trim().length === 0) {
    throw new ValidationError('Club ID is required');
  }

  if (!invitation.invitedBy || invitation.invitedBy.trim().length === 0) {
    throw new ValidationError('Inviter ID is required');
  }

  // Validate type
  if (!Object.values(InvitationType).includes(invitation.type)) {
    throw new ValidationError('Invalid invitation type');
  }

  // Validate status
  if (!Object.values(InvitationStatus).includes(invitation.status)) {
    throw new ValidationError('Invalid invitation status');
  }

  // Validate role
  if (!Object.values(ClubRole).includes(invitation.role)) {
    throw new ValidationError('Invalid club role');
  }

  // Type-specific validation
  if (invitation.type === InvitationType.EMAIL) {
    if (!invitation.email || invitation.email.trim().length === 0) {
      throw new ValidationError('Email is required for email invitations');
    }
    
    if (!isValidEmail(invitation.email)) {
      throw new ValidationError('Invalid email format');
    }

    if (!invitation.token || invitation.token.length !== INVITATION_CONSTRAINTS.TOKEN_LENGTH) {
      throw new ValidationError('Invalid invitation token');
    }
  } else {
    if (!invitation.userId || invitation.userId.trim().length === 0) {
      throw new ValidationError('User ID is required for user invitations');
    }
  }

  // Validate message length
  if (invitation.message && invitation.message.length > INVITATION_CONSTRAINTS.MESSAGE_MAX_LENGTH) {
    throw new ValidationError(`Message must not exceed ${INVITATION_CONSTRAINTS.MESSAGE_MAX_LENGTH} characters`);
  }

  // Validate expiry date
  const expiryDate = new Date(invitation.expiresAt);
  const now = new Date();
  const maxExpiry = new Date(now.getTime() + (INVITATION_CONSTRAINTS.MAX_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
  
  if (expiryDate > maxExpiry) {
    throw new ValidationError(`Invitation expiry cannot exceed ${INVITATION_CONSTRAINTS.MAX_EXPIRY_DAYS} days`);
  }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate unique invitation ID
 */
function generateInvitationId(): string {
  // Generate a unique invitation ID with timestamp and random component
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `inv_${timestamp}_${random}`;
}