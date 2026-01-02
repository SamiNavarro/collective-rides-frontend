/**
 * User Domain Types - Phase 1.2
 * 
 * Type definitions for the User entity as defined in the canonical
 * Phase 1.2 specification.
 * 
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - Domain Model: .kiro/specs/domain.v1.md
 */

/**
 * SystemRole enum as defined in canonical domain model
 */
export enum SystemRole {
  USER = 'User',
  SITE_ADMIN = 'SiteAdmin',
}

/**
 * User entity representing a user profile in the system
 */
export interface User {
  /** User ID (Cognito sub) */
  id: string;
  
  /** Email address (immutable, from Cognito) */
  email: string;
  
  /** Display name */
  displayName: string;
  
  /** Optional avatar URL */
  avatarUrl?: string;
  
  /** System-wide role */
  systemRole: SystemRole;
  
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  
  /** Last update timestamp (ISO 8601) */
  updatedAt: string;
}

/**
 * User creation input (for lazy user creation)
 */
export interface CreateUserInput {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

/**
 * User update input
 */
export interface UpdateUserInput {
  displayName?: string;
  avatarUrl?: string;
  systemRole?: SystemRole; // Only allowed for SiteAdmin
}

/**
 * User repository interface
 */
export interface IUserRepository {
  getUserById(userId: string): Promise<User | null>;
  createUser(input: CreateUserInput): Promise<User>;
  updateUser(userId: string, input: UpdateUserInput): Promise<User>;
  userExists(userId: string): Promise<boolean>;
}