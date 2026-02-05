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
export enum ClubRole {
  MEMBER = 'member',
  CAPTAIN = 'captain',
  ADMIN = 'admin',
  OWNER = 'owner',
}

/**
 * Membership status enumeration
 */
export enum MembershipStatus {
  PENDING = 'pending',     // Join request or invitation awaiting approval
  ACTIVE = 'active',       // Active club member
  SUSPENDED = 'suspended', // Temporarily suspended member
  REMOVED = 'removed',     // Permanently removed from club
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
  PK: string;           // CLUB#{clubId}
  SK: string;           // MEMBER#{userId}
  entityType: string;   // CLUB_MEMBERSHIP
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
  PK: string;           // USER#{userId}
  SK: string;           // MEMBERSHIP#{clubId}
  GSI1PK: string;       // USER#{userId}
  GSI1SK: string;       // MEMBERSHIP#{clubId}
  entityType: string;   // USER_MEMBERSHIP
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
  PK: string;           // CLUB#{clubId}#MEMBERS
  SK: string;           // ROLE#{role}#USER#{userId}
  GSI2PK: string;       // CLUB#{clubId}#MEMBERS
  GSI2SK: string;       // ROLE#{role}#USER#{userId}
  entityType: string;   // CLUB_MEMBER_INDEX
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
export const MEMBERSHIP_CONSTRAINTS = {
  JOIN_MESSAGE_MAX_LENGTH: 500,
  REASON_MAX_LENGTH: 500,
  DEFAULT_LIST_LIMIT: 20,
  MAX_LIST_LIMIT: 100,
} as const;

/**
 * Membership status transition matrix
 */
export const MEMBERSHIP_STATUS_TRANSITIONS: Record<MembershipStatus, MembershipStatus[]> = {
  [MembershipStatus.PENDING]: [MembershipStatus.ACTIVE, MembershipStatus.REMOVED],
  [MembershipStatus.ACTIVE]: [MembershipStatus.SUSPENDED, MembershipStatus.REMOVED],
  [MembershipStatus.SUSPENDED]: [MembershipStatus.ACTIVE, MembershipStatus.REMOVED],
  [MembershipStatus.REMOVED]: [], // Cannot transition from removed
};

/**
 * Check if membership status transition is valid
 */
export function isValidMembershipStatusTransition(from: MembershipStatus, to: MembershipStatus): boolean {
  return MEMBERSHIP_STATUS_TRANSITIONS[from].includes(to);
}