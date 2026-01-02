/**
 * User Service - Phase 1.2
 * 
 * Business logic service for user operations as defined in the
 * canonical Phase 1.2 specification.
 * 
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - Domain Model: .kiro/specs/domain.v1.md
 */

import { User, CreateUserInput, UpdateUserInput } from '../../../shared/types/user';
import { AuthContext } from '../../../shared/types/auth';
import { AuthenticationError, AuthorizationError, NotFoundError, ValidationError } from '../../../shared/utils/errors';
import { validateUpdateUserInput } from '../../../shared/utils/validation';
import { IUserRepository } from './user-repository';
import { UserEntity, createUser, fromUserData } from './user';
import { 
  SystemCapability, 
  hasCapability,
  InsufficientPrivilegesError 
} from '../../../shared/authorization';

/**
 * User service for business logic operations
 */
export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}
  
  /**
   * Get current user profile (lazy creation)
   * 
   * @param authContext - Authentication context
   * @returns User profile
   */
  async getCurrentUser(authContext: AuthContext): Promise<User> {
    if (!authContext.isAuthenticated) {
      throw new AuthenticationError('Authentication required');
    }
    
    // Try to get existing user
    let user = await this.userRepository.getUserById(authContext.userId);
    
    // Create user lazily if not found
    if (!user) {
      const createInput: CreateUserInput = {
        id: authContext.userId,
        email: authContext.email,
      };
      
      user = await this.userRepository.createUser(createInput);
    }
    
    return user;
  }
  
  /**
   * Get user by ID
   * 
   * @param userId - User ID
   * @param authContext - Authentication context
   * @returns User profile
   */
  async getUserById(userId: string, authContext: AuthContext): Promise<User> {
    if (!authContext.isAuthenticated) {
      throw new AuthenticationError('Authentication required');
    }
    
    // Authorization is now handled by the Lambda handler using the authorization service
    // This method assumes authorization has already been validated
    
    const user = await this.userRepository.getUserById(userId);
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    return user;
  }
  
  /**
   * Update user profile
   * 
   * @param userId - User ID
   * @param input - Update input
   * @param authContext - Authentication context
   * @returns Updated user profile
   */
  async updateUser(userId: string, input: UpdateUserInput, authContext: AuthContext): Promise<User> {
    if (!authContext.isAuthenticated) {
      throw new AuthenticationError('Authentication required');
    }
    
    // Get existing user
    const existingUser = await this.userRepository.getUserById(userId);
    
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }
    
    const userEntity = fromUserData(existingUser);
    
    // Check if user can modify this profile
    if (!userEntity.canModifyUser(userId) && !authContext.isSiteAdmin) {
      throw new AuthorizationError('Cannot modify this user profile');
    }
    
    // Check if user can modify system role using the new authorization service
    const canModifySystemRole = await hasCapability(authContext, SystemCapability.MANAGE_PLATFORM);
    
    // If trying to modify system role without permission, throw authorization error
    if (input.systemRole && !canModifySystemRole) {
      throw new InsufficientPrivilegesError(SystemCapability.MANAGE_PLATFORM, authContext.userId, `user:${userId}`);
    }
    
    // Validate input
    validateUpdateUserInput(input, canModifySystemRole);
    
    // Update user through domain entity
    const updatedEntity = userEntity.update(input, canModifySystemRole);
    
    // Persist changes
    return await this.userRepository.updateUser(userId, {
      displayName: updatedEntity.displayName,
      avatarUrl: updatedEntity.avatarUrl,
      systemRole: updatedEntity.systemRole,
    });
  }
  
  /**
   * Check if user exists
   * 
   * @param userId - User ID
   * @returns True if user exists
   */
  async userExists(userId: string): Promise<boolean> {
    return await this.userRepository.userExists(userId);
  }
}