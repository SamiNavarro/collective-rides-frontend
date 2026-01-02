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
import { User, UpdateUserInput } from '../../../shared/types/user';
import { AuthContext } from '../../../shared/types/auth';
import { IUserRepository } from './user-repository';
/**
 * User service for business logic operations
 */
export declare class UserService {
    private readonly userRepository;
    constructor(userRepository: IUserRepository);
    /**
     * Get current user profile (lazy creation)
     *
     * @param authContext - Authentication context
     * @returns User profile
     */
    getCurrentUser(authContext: AuthContext): Promise<User>;
    /**
     * Get user by ID
     *
     * @param userId - User ID
     * @param authContext - Authentication context
     * @returns User profile
     */
    getUserById(userId: string, authContext: AuthContext): Promise<User>;
    /**
     * Update user profile
     *
     * @param userId - User ID
     * @param input - Update input
     * @param authContext - Authentication context
     * @returns Updated user profile
     */
    updateUser(userId: string, input: UpdateUserInput, authContext: AuthContext): Promise<User>;
    /**
     * Check if user exists
     *
     * @param userId - User ID
     * @returns True if user exists
     */
    userExists(userId: string): Promise<boolean>;
}
