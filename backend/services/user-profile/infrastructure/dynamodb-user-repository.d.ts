/**
 * DynamoDB User Repository - Phase 1.2
 *
 * DynamoDB implementation of the user repository interface using the
 * existing single table from Phase 1.1.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { User, CreateUserInput, UpdateUserInput } from '../../../shared/types/user';
import { IUserRepository } from '../domain/user-repository';
/**
 * DynamoDB implementation of user repository
 */
export declare class DynamoDBUserRepository implements IUserRepository {
    private readonly tableName;
    private readonly docClient;
    constructor(tableName: string, dynamoClient?: DynamoDBClient);
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
     */
    updateUser(userId: string, input: UpdateUserInput): Promise<User>;
    /**
     * Check if user exists
     *
     * @param userId - User ID
     * @returns True if user exists
     */
    userExists(userId: string): Promise<boolean>;
    /**
     * Map DynamoDB item to User object
     *
     * @param item - DynamoDB item
     * @returns User object
     */
    private mapDynamoItemToUser;
    /**
     * Extract display name from email address
     *
     * @param email - Email address
     * @returns Display name
     */
    private extractDisplayNameFromEmail;
}
