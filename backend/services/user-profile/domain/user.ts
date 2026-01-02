/**
 * User Domain Entity - Phase 1.2
 * 
 * Core User entity with business logic and validation rules as defined
 * in the canonical Phase 1.2 specification.
 * 
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - Domain Model: .kiro/specs/domain.v1.md
 */

import { User, CreateUserInput, UpdateUserInput, SystemRole } from '../../../shared/types/user';
import { ValidationError } from '../../../shared/utils/errors';

/**
 * User domain entity with business logic
 */
export class UserEntity {
  constructor(private readonly user: User) {}
  
  /**
   * Get user data
   */
  get data(): User {
    return { ...this.user };
  }
  
  /**
   * Get user ID
   */
  get id(): string {
    return this.user.id;
  }
  
  /**
   * Get user email
   */
  get email(): string {
    return this.user.email;
  }
  
  /**
   * Get display name
   */
  get displayName(): string {
    return this.user.displayName;
  }
  
  /**
   * Get avatar URL
   */
  get avatarUrl(): string | undefined {
    return this.user.avatarUrl;
  }
  
  /**
   * Get system role
   */
  get systemRole(): SystemRole {
    return this.user.systemRole;
  }
  
  /**
   * Check if user is a site administrator
   */
  get isSiteAdmin(): boolean {
    return this.user.systemRole === SystemRole.SITE_ADMIN;
  }
  
  /**
   * Update user with new data
   * 
   * @param input - Update input
   * @param canModifySystemRole - Whether system role can be modified
   * @returns Updated user entity
   */
  update(input: UpdateUserInput, canModifySystemRole: boolean = false): UserEntity {
    // Validate system role change permission
    if (input.systemRole !== undefined && !canModifySystemRole) {
      throw new ValidationError('System role changes are not allowed');
    }
    
    // Create updated user data
    const updatedUser: User = {
      ...this.user,
      updatedAt: new Date().toISOString(),
    };
    
    // Update allowed fields
    if (input.displayName !== undefined) {
      updatedUser.displayName = input.displayName.trim();
    }
    
    if (input.avatarUrl !== undefined) {
      updatedUser.avatarUrl = input.avatarUrl.trim() || undefined;
    }
    
    if (input.systemRole !== undefined && canModifySystemRole) {
      updatedUser.systemRole = input.systemRole;
    }
    
    return new UserEntity(updatedUser);
  }
  
  /**
   * Check if this user can access another user's profile
   * 
   * @param targetUserId - Target user ID
   * @returns True if access is allowed
   */
  canAccessUser(targetUserId: string): boolean {
    // Users can access their own profile
    if (this.id === targetUserId) {
      return true;
    }
    
    // Site admins can access any profile
    if (this.isSiteAdmin) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if this user can modify another user's profile
   * 
   * @param targetUserId - Target user ID
   * @returns True if modification is allowed
   */
  canModifyUser(targetUserId: string): boolean {
    return this.canAccessUser(targetUserId);
  }
}

/**
 * Create a new user entity from creation input
 * 
 * @param input - User creation input
 * @returns New user entity
 */
export function createUser(input: CreateUserInput): UserEntity {
  const now = new Date().toISOString();
  
  const user: User = {
    id: input.id,
    email: input.email,
    displayName: input.displayName || extractDisplayNameFromEmail(input.email),
    avatarUrl: input.avatarUrl,
    systemRole: SystemRole.USER, // Default to User as per domain rules
    createdAt: now,
    updatedAt: now,
  };
  
  return new UserEntity(user);
}

/**
 * Create user entity from existing user data
 * 
 * @param userData - Existing user data
 * @returns User entity
 */
export function fromUserData(userData: User): UserEntity {
  return new UserEntity(userData);
}

/**
 * Extract display name from email address
 * 
 * @param email - Email address
 * @returns Display name
 */
function extractDisplayNameFromEmail(email: string): string {
  const localPart = email.split('@')[0];
  
  // Convert to title case and replace common separators
  return localPart
    .replace(/[._-]/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}