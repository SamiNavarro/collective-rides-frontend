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
export declare enum InvitationType {
    EMAIL = "email",
    USER = "user"
}
/**
 * Invitation status enumeration
 */
export declare enum InvitationStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    DECLINED = "declined",
    EXPIRED = "expired",
    CANCELLED = "cancelled"
}
/**
 * Core club invitation entity
 */
export interface ClubInvitation {
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
    PK: string;
    SK: string;
    entityType: string;
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
    PK: string;
    SK: string;
    GSI1PK: string;
    GSI1SK: string;
    entityType: string;
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
export declare const INVITATION_CONSTRAINTS: {
    readonly MESSAGE_MAX_LENGTH: 500;
    readonly DEFAULT_EXPIRY_DAYS: 7;
    readonly MAX_EXPIRY_DAYS: 30;
    readonly TOKEN_LENGTH: 32;
    readonly DEFAULT_LIST_LIMIT: 20;
    readonly MAX_LIST_LIMIT: 100;
};
/**
 * Invitation status transition matrix
 */
export declare const INVITATION_STATUS_TRANSITIONS: Record<InvitationStatus, InvitationStatus[]>;
/**
 * Check if invitation status transition is valid
 */
export declare function isValidInvitationStatusTransition(from: InvitationStatus, to: InvitationStatus): boolean;
/**
 * Generate secure invitation token
 */
export declare function generateInvitationToken(): string;
/**
 * Calculate invitation expiry date
 */
export declare function calculateInvitationExpiry(days?: number): string;
