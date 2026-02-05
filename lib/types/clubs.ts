/**
 * Club Types for Frontend - Phase 3.1 & 3.4
 * 
 * TypeScript types for club-related data structures used in the frontend.
 * Includes hydrated club membership data to eliminate "Unknown Club" issues.
 * 
 * Compliance:
 * - Phase 3.1 Spec: .kiro/specs/phase-3.1.club-navigation-foundations.v1.md
 * - Phase 3.4 Spec: .kiro/specs/phase-3.4-club-administration.v1.md
 */

/**
 * Club role enumeration
 */
export type ClubRole = 'member' | 'ride_leader' | 'ride_captain' | 'admin' | 'owner';

/**
 * Membership status enumeration
 */
export type MembershipStatus = 'pending' | 'active' | 'suspended' | 'removed';

/**
 * Hydrated club membership data (Phase 3.1 spec)
 * This eliminates the "Unknown Club" problem by providing all necessary
 * club information in a single API response.
 */
export interface MyClubMembership {
  clubId: string;
  clubName: string;
  clubSlug: string;
  clubLocation?: string;
  clubAvatarUrl?: string;
  memberCount?: number;
  membershipRole: ClubRole;
  membershipStatus: MembershipStatus;
  joinedAt: string;
}

/**
 * Club discovery data (for /directory page)
 */
export interface ClubDiscovery {
  id: string;
  name: string;
  description?: string;
  city?: string;
  logoUrl?: string;
  memberCount?: number;
  status: 'active' | 'suspended' | 'archived';
  createdAt: string;
  updatedAt: string;
  // User's membership status (if logged in)
  userMembership?: {
    role: 'member' | 'admin' | 'owner';
    status: 'active' | 'pending' | 'suspended' | 'removed';
  };
}

/**
 * Club detail data (for /clubs/[clubId] page)
 */
export interface ClubDetail {
  id: string;
  name: string;
  description?: string;
  city?: string;
  logoUrl?: string;
  memberCount?: number;
  membershipApprovalType?: 'open' | 'request_to_join';
  status: 'active' | 'suspended' | 'archived';
  createdAt: string;
  updatedAt: string;
  // User's membership status (if logged in)
  userMembership?: {
    membershipId: string;
    role: ClubRole;
    status: MembershipStatus;
    joinedAt: string;
  };
}

/**
 * Club member information
 */
export interface ClubMember {
  membershipId: string;
  userId: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  role: ClubRole;
  status: MembershipStatus;
  joinedAt: string;
  requestedAt?: string;
  joinMessage?: string;
  updatedAt?: string;
}

/**
 * Join club request data
 */
export interface JoinClubRequest {
  message?: string;
}

/**
 * Update club request data (Phase 3.4)
 */
export interface UpdateClubRequest {
  name?: string;
  description?: string;
  city?: string;
  logoUrl?: string;
  membershipApprovalType?: 'open' | 'request_to_join';
}

/**
 * Update member request data (Phase 3.4)
 */
export interface UpdateMemberRequest {
  role: ClubRole;
  reason?: string;
}

/**
 * Remove member request data (Phase 3.4)
 */
export interface RemoveMemberRequest {
  reason?: string;
}

/**
 * Process join request data (Phase 3.4)
 */
export interface ProcessJoinRequestRequest {
  action: 'approve' | 'reject';
  message?: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    limit: number;
    nextCursor?: string;
  };
  timestamp: string;
}