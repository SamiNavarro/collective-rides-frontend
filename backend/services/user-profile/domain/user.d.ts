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
/**
 * User domain entity with business logic
 */
export declare class UserEntity {
    private readonly user;
    constructor(user: User);
    /**
     * Get user data
     */
    get data(): User;
    /**
     * Get user ID
     */
    get id(): string;
    /**
     * Get user email
     */
    get email(): string;
    /**
     * Get display name
     */
    get displayName(): string;
    /**
     * Get avatar URL
     */
    get avatarUrl(): string | undefined;
    /**
     * Get system role
     */
    get systemRole(): SystemRole;
    /**
     * Check if user is a site administrator
     */
    get isSiteAdmin(): boolean;
    /**
     * Update user with new data
     *
     * @param input - Update input
     * @param canModifySystemRole - Whether system role can be modified
     * @returns Updated user entity
     */
    update(input: UpdateUserInput, canModifySystemRole?: boolean): UserEntity;
    /**
     * Check if this user can access another user's profile
     *
     * @param targetUserId - Target user ID
     * @returns True if access is allowed
     */
    canAccessUser(targetUserId: string): boolean;
    /**
     * Check if this user can modify another user's profile
     *
     * @param targetUserId - Target user ID
     * @returns True if modification is allowed
     */
    canModifyUser(targetUserId: string): boolean;
}
/**
 * Create a new user entity from creation input
 *
 * @param input - User creation input
 * @returns New user entity
 */
export declare function createUser(input: CreateUserInput): UserEntity;
/**
 * Create user entity from existing user data
 *
 * @param userData - Existing user data
 * @returns User entity
 */
export declare function fromUserData(userData: User): UserEntity;
