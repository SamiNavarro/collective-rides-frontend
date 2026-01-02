/**
 * Club Invitation Types - Phase 2.2
 * 
 * Type definitions for club invitation management and dual invitation system.
 * Supports both in-app invitations (existing users) and email invitations (new users).
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import { ClubRole } from './membership';

/**
 * Invitation type enumeration
 */
export enum InvitationType {
  EMAIL = 'email',     // Email invitation for new users
  USER = 'user',       // In-app invitation for existing users
}

/**
 * Invitation status enumeration
 */
export enum InvitationStatus {
  PENDING = 'pending',     // Invitation sent, awaiting response
  ACCEPTED = 'accepted',   // Invitation accepted
  DECLINED = 'declined',   // Invitation declined
  EXPIRED = 'expired',     // Invitation expired
  CANCELLED = 'cancelled', // Invitation cancelled by admin
}

/**
 * Core club invitation entity
 */
export interface ClubInvitation {
  invitationId: string;
  type: InvitationType;
  clubId: string;
  email?: string;        // For email invitations
  userId?: string;       // For user invitations (set when accepted for email invitations)
  role: ClubRole;
  status: InvitationStatus;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  processedAt?: string;
  message?: string;
  token?: string;        // Secure token for email invitations
  deliveryMethod: 'email' | 'in_app';
}

/**
 * Input for creating email invitation
 */
export interface CreateEmailInvitationInput {
  type: 'email';
  email: string;
  role: ClubRole;
  message?: string;
}

/**
 * Input for creating user invitation
 */
export interface CreateUserInvitationInput {
  type: 'user';
  userId: string;
  role: ClubRole;
  message?: string;
}

/**
 * Union type for invitation creation
 */
export type CreateInvitationInput = CreateEmailInvitationInput | CreateUserInvitationInput;

/**
 * Input for processing invitation (accept/decline)
 */
export interface ProcessInvitationInput {
  action: 'accept' | 'decline';
}

/**
 * Input for processing join request (approve/reject)
 */
export interface ProcessJoinRequestInput {
  action: 'approve' | 'reject';
  message?: string;
}

/**
 * User's invitation summary
 */
export interface UserInvitationSummary {
  invitationId: string;
  clubId: string;
  clubName: string;
  clubLogoUrl?: string;
  role: ClubRole;
  status: InvitationStatus;
  invitedBy: string;
  invitedByName: string;
  invitedAt: string;
  expiresAt: string;
  message?: string;
}

/**
 * Options for listing invitations
 */
export interface ListInvitationsOptions {
  limit?: number;
  cursor?: string;
  status?: InvitationStatus;
}

/**
 * Result of invitation listing operation
 */
export interface ListInvitationsResult {
  invitations: UserInvitationSummary[];
  nextCursor?: string;
}

/**
 * DynamoDB club invitation item structure (canonical)
 */
export interface InvitationDynamoItem {
  PK: string;           // INVITATION#{invitationId}
  SK: string;           // METADATA
  entityType: string;   // CLUB_INVITATION
  invitationId: string;
  type: InvitationType;
  clubId: string;
  email?: string;
  userId?: string;
  role: ClubRole;
  status: InvitationStatus;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  processedAt?: string;
  message?: string;
  token?: string;
  deliveryMethod: 'email' | 'in_app';
}

/**
 * DynamoDB user invitation index item structure (for in-app invitations)
 */
export interface UserInvitationDynamoItem {
  PK: string;           // USER#{userId}
  SK: string;           // INVITATION#{invitationId}
  GSI1PK: string;       // USER#{userId}
  GSI1SK: string;       // INVITATION#{invitationId}
  entityType: string;   // USER_INVITATION
  invitationId: string;
  clubId: string;
  clubName: string;
  role: ClubRole;
  status: InvitationStatus;
  invitedBy: string;
  invitedByName: string;
  invitedAt: string;
  expiresAt: string;
  message?: string;
}

/**
 * Invitation validation constraints
 */
export const INVITATION_CONSTRAINTS = {
  MESSAGE_MAX_LENGTH: 500,
  DEFAULT_EXPIRY_DAYS: 7,
  MAX_EXPIRY_DAYS: 30,
  TOKEN_LENGTH: 32,
  DEFAULT_LIST_LIMIT: 20,
  MAX_LIST_LIMIT: 100,
} as const;

/**
 * Invitation status transition matrix
 */
export const INVITATION_STATUS_TRANSITIONS: Record<InvitationStatus, InvitationStatus[]> = {
  [InvitationStatus.PENDING]: [InvitationStatus.ACCEPTED, InvitationStatus.DECLINED, InvitationStatus.EXPIRED, InvitationStatus.CANCELLED],
  [InvitationStatus.ACCEPTED]: [], // Final state
  [InvitationStatus.DECLINED]: [], // Final state
  [InvitationStatus.EXPIRED]: [], // Final state
  [InvitationStatus.CANCELLED]: [], // Final state
};

/**
 * Check if invitation status transition is valid
 */
export function isValidInvitationStatusTransition(from: InvitationStatus, to: InvitationStatus): boolean {
  return INVITATION_STATUS_TRANSITIONS[from].includes(to);
}

/**
 * Generate secure invitation token
 */
export function generateInvitationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < INVITATION_CONSTRAINTS.TOKEN_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Calculate invitation expiry date
 */
export function calculateInvitationExpiry(days: number = INVITATION_CONSTRAINTS.DEFAULT_EXPIRY_DAYS): string {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate.toISOString();
}