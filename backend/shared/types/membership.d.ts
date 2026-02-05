/**
 * Club Membership Types - Phase 2.2
 *
 * Type definitions for club membership management, roles, and lifecycle.
 * Defines membership entities, status enums, and API request/response types.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
/**
 * Club role enumeration (hierarchical)
 */
export declare enum ClubRole {
    MEMBER = "member",
    CAPTAIN = "captain",
    ADMIN = "admin",
    OWNER = "owner"
}
/**
 * Membership status enumeration
 */
export declare enum MembershipStatus {
    PENDING = "pending",
    ACTIVE = "active",
    SUSPENDED = "suspended",
    REMOVED = "removed"
}
/**
 * Core club membership entity
 */
export interface ClubMembership {
    membershipId: string;
    clubId: string;
    userId: string;
    role: ClubRole;
    status: MembershipStatus;
    joinedAt: string;
    updatedAt: string;
    joinMessage?: string;
    invitedBy?: string;
    processedBy?: string;
    processedAt?: string;
    reason?: string;
}
/**
 * Input for joining a club
 */
export interface JoinClubInput {
    message?: string;
}
/**
 * Input for updating member role
 */
export interface UpdateMemberInput {
    role: ClubRole;
    reason?: string;
}
/**
 * Input for removing a member
 */
export interface RemoveMemberInput {
    reason?: string;
}
/**
 * Options for listing club members
 */
export interface ListMembersOptions {
    limit?: number;
    cursor?: string;
    role?: ClubRole;
    status?: MembershipStatus;
}
/**
 * Result of member listing operation
 */
export interface ListMembersResult {
    members: ClubMemberInfo[];
    nextCursor?: string;
}
/**
 * Club member information (enriched with user data)
 */
export interface ClubMemberInfo {
    membershipId: string;
    userId: string;
    displayName: string;
    email: string;
    avatarUrl?: string;
    role: ClubRole;
    status: MembershipStatus;
    joinedAt: string;
    updatedAt?: string;
}
/**
 * User's club membership summary
 */
export interface UserMembershipSummary {
    membershipId: string;
    clubId: string;
    clubName: string;
    clubLogoUrl?: string;
    role: ClubRole;
    status: MembershipStatus;
    joinedAt: string;
}
/**
 * DynamoDB club membership item structure (canonical)
 */
export interface MembershipDynamoItem {
    PK: string;
    SK: string;
    entityType: string;
    membershipId: string;
    clubId: string;
    userId: string;
    role: ClubRole;
    status: MembershipStatus;
    joinedAt: string;
    updatedAt: string;
    joinMessage?: string;
    invitedBy?: string;
    processedBy?: string;
    processedAt?: string;
    reason?: string;
}
/**
 * DynamoDB user membership index item structure
 */
export interface UserMembershipDynamoItem {
    PK: string;
    SK: string;
    GSI1PK: string;
    GSI1SK: string;
    entityType: string;
    membershipId: string;
    clubId: string;
    userId: string;
    role: ClubRole;
    status: MembershipStatus;
    joinedAt: string;
    updatedAt: string;
}
/**
 * DynamoDB club member index item structure
 */
export interface ClubMemberDynamoItem {
    PK: string;
    SK: string;
    GSI2PK: string;
    GSI2SK: string;
    entityType: string;
    membershipId: string;
    userId: string;
    role: ClubRole;
    status: MembershipStatus;
    joinedAt: string;
    updatedAt: string;
}
/**
 * Membership validation constraints
 */
export declare const MEMBERSHIP_CONSTRAINTS: {
    readonly JOIN_MESSAGE_MAX_LENGTH: 500;
    readonly REASON_MAX_LENGTH: 500;
    readonly DEFAULT_LIST_LIMIT: 20;
    readonly MAX_LIST_LIMIT: 100;
};
/**
 * Membership status transition matrix
 */
export declare const MEMBERSHIP_STATUS_TRANSITIONS: Record<MembershipStatus, MembershipStatus[]>;
/**
 * Check if membership status transition is valid
 */
export declare function isValidMembershipStatusTransition(from: MembershipStatus, to: MembershipStatus): boolean;
