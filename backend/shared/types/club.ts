/**
 * Club Types - Phase 2.1
 * 
 * Type definitions for the Club Service v1.
 * Defines club entities, status enums, and API request/response types.
 * 
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 * - Domain Model: .kiro/specs/domain.v1.md
 */

/**
 * Club status enumeration
 */
export enum ClubStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
}

/**
 * Core club entity
 */
export interface Club {
  id: string;
  name: string;
  description?: string;
  status: ClubStatus;
  city?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a new club
 */
export interface CreateClubInput {
  name: string;
  description?: string;
  city?: string;
  logoUrl?: string;
}

/**
 * Input for updating an existing club (partial update)
 */
export interface UpdateClubInput {
  name?: string;
  description?: string;
  city?: string;
  logoUrl?: string;
  status?: ClubStatus;
}

/**
 * Options for listing clubs
 */
export interface ListClubsOptions {
  limit?: number;
  cursor?: string;
  status?: ClubStatus;
}

/**
 * Result of listing clubs with pagination
 */
export interface ListClubsResult {
  clubs: Club[];
  nextCursor?: string;
}

/**
 * Pagination information for API responses
 */
export interface ClubPagination {
  limit: number;
  nextCursor?: string;
}

/**
 * DynamoDB club item structure (canonical)
 */
export interface ClubDynamoItem {
  PK: string;                    // CLUB#{clubId}
  SK: string;                    // METADATA
  entityType: string;            // CLUB
  id: string;
  name: string;
  nameLower: string;             // For case-insensitive operations
  description?: string;
  city?: string;
  logoUrl?: string;
  status: ClubStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * DynamoDB club index item structure (for listing)
 */
export interface ClubIndexItem {
  PK: string;                    // INDEX#CLUB
  SK: string;                    // NAME#{nameLower}#ID#{clubId}
  GSI1PK: string;                // INDEX#CLUB
  GSI1SK: string;                // NAME#{nameLower}#ID#{clubId}
  entityType: string;            // CLUB_INDEX
  clubId: string;
  name: string;
  nameLower: string;
  status: ClubStatus;
  city?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pagination cursor structure (internal)
 */
export interface ClubCursor {
  nameLower: string;
  clubId: string;
}

/**
 * Club validation constraints
 */
export const CLUB_CONSTRAINTS = {
  NAME_MIN_LENGTH: 1,
  NAME_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 500,
  CITY_MAX_LENGTH: 50,
  DEFAULT_LIST_LIMIT: 20,
  MAX_LIST_LIMIT: 100,
} as const;