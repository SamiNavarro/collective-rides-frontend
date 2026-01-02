/**
 * DynamoDB Club Repository - Phase 2.1
 *
 * DynamoDB implementation of the club repository interface.
 * Uses single-table design with index item pattern for efficient queries.
 *
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { Club, CreateClubInput, UpdateClubInput, ListClubsOptions, ListClubsResult } from '../../../shared/types/club';
import { IClubRepository } from '../domain/club-repository';
/**
 * DynamoDB club repository implementation
 */
export declare class DynamoDBClubRepository implements IClubRepository {
    private readonly tableName;
    private readonly docClient;
    constructor(tableName: string, dynamoClient?: DynamoDBClient);
    /**
     * Get club by ID
     */
    getClubById(id: string): Promise<Club | null>;
    /**
     * List clubs with pagination and filtering
     */
    listClubs(options: ListClubsOptions): Promise<ListClubsResult>;
    /**
     * Create a new club
     */
    createClub(input: CreateClubInput): Promise<Club>;
    /**
     * Update an existing club
     */
    updateClub(id: string, input: UpdateClubInput): Promise<Club>;
    /**
     * Check if club exists
     */
    clubExists(id: string): Promise<boolean>;
    /**
     * Check if club name is unique
     */
    isClubNameUnique(name: string, excludeId?: string): Promise<boolean>;
    /**
     * Get clubs by status
     */
    getClubsByStatus(status: string, limit?: number): Promise<Club[]>;
    /**
     * Search clubs by name
     */
    searchClubsByName(nameQuery: string, limit?: number): Promise<Club[]>;
    /**
     * Map DynamoDB item to Club
     */
    private mapDynamoItemToClub;
    /**
     * Map index item to Club (minimal data)
     */
    private indexItemToClub;
    /**
     * Encode cursor for pagination
     */
    private encodeCursor;
    /**
     * Decode cursor for pagination
     */
    private decodeCursor;
}
