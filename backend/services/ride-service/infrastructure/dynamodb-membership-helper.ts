/**
 * Membership Helper for Ride Service
 * 
 * Provides utilities to fetch club memberships for authorization checks.
 * This is a lightweight helper to avoid circular dependencies with club-service.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

export interface ClubMembership {
  membershipId: string;
  clubId: string;
  role: string;
  status: string;
  joinedAt: string;
}

export class MembershipHelper {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(dynamoClient: DynamoDBClient, tableName: string) {
    this.docClient = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = tableName;
  }

  /**
   * Get user's club memberships for authorization
   * 
   * @param userId - User ID
   * @returns Array of club memberships
   */
  async getUserMemberships(userId: string): Promise<ClubMembership[]> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'MEMBERSHIP#',
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return [];
    }

    return result.Items.map((item) => ({
      membershipId: item.membershipId,
      clubId: item.clubId,
      role: item.role,
      status: item.status,
      joinedAt: item.joinedAt,
    }));
  }

  /**
   * Get user's membership for a specific club
   * 
   * @param userId - User ID
   * @param clubId - Club ID
   * @returns Club membership or null
   */
  async getUserMembershipForClub(
    userId: string,
    clubId: string
  ): Promise<ClubMembership | null> {
    const result = await this.docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND SK = :sk',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': `MEMBERSHIP#${clubId}`,
        },
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    const item = result.Items[0];
    return {
      membershipId: item.membershipId,
      clubId: item.clubId,
      role: item.role,
      status: item.status,
      joinedAt: item.joinedAt,
    };
  }
}
