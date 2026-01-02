/**
 * User Repository Interface - Phase 1.2
 * 
 * Repository interface for user data access as defined in the
 * canonical Phase 1.2 specification.
 * 
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 */

import { User, CreateUserInput, UpdateUserInput } from '../../../shared/types/user';

/**
 * User repository interface
 * 
 * Defines the contract for user data persistence operations.
 * Implementation will be provided by infrastructure layer.
 */
export interface IUserRepository {
  /**
   * Get user by ID
   * 
   * @param userId - User ID
   * @returns User data or null if not found
   */
  getUserById(userId: string): Promise<User | null>;
  
  /**
   * Create a new user
   * 
   * @param input - User creation input
   * @returns Created user data
   */
  createUser(input: CreateUserInput): Promise<User>;
  
  /**
   * Update an existing user
   * 
   * @param userId - User ID
   * @param input - Update input
   * @returns Updated user data
   * @throws Error if user not found
   */
  updateUser(userId: string, input: UpdateUserInput): Promise<User>;
  
  /**
   * Check if user exists
   * 
   * @param userId - User ID
   * @returns True if user exists
   */
  userExists(userId: string): Promise<boolean>;
}