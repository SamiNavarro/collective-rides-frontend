/**
 * Membership Helper for Ride Service
 *
 * Provides utilities to fetch club memberships for authorization checks.
 * This is a lightweight helper to avoid circular dependencies with club-service.
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
export interface ClubMembership {
    membershipId: string;
    clubId: string;
    role: string;
    status: string;
    joinedAt: string;
}
export declare class MembershipHelper {
    private docClient;
    private tableName;
    constructor(dynamoClient: DynamoDBClient, tableName: string);
    /**
     * Get user's club memberships for authorization
     *
     * @param userId - User ID
     * @returns Array of club memberships
     */
    getUserMemberships(userId: string): Promise<ClubMembership[]>;
    /**
     * Get user's membership for a specific club
     *
     * @param userId - User ID
     * @param clubId - Club ID
     * @returns Club membership or null
     */
    getUserMembershipForClub(userId: string, clubId: string): Promise<ClubMembership | null>;
}
