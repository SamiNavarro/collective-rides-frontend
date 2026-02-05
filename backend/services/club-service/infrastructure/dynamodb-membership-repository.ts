/**
 * DynamoDB Membership Repository - Phase 2.2
 * 
 * DynamoDB implementation of the membership repository interface.
 * Uses single-table design with multiple index items for efficient queries.
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  BatchGetCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  ClubMembership,
  ClubRole,
  MembershipStatus,
  JoinClubInput,
  UpdateMemberInput,
  ListMembersOptions,
  ListMembersResult,
  ClubMemberInfo,
  UserMembershipSummary,
  MembershipDynamoItem,
  UserMembershipDynamoItem,
  ClubMemberDynamoItem,
  MEMBERSHIP_CONSTRAINTS,
} from '../../../shared/types/membership';
import { NotFoundError } from '../../../shared/utils/errors';
import { logStructured } from '../../../shared/utils/lambda-utils';
import { IMembershipRepository } from '../domain/membership/membership-repository';
import { IUserRepository } from '../../user-profile/domain/user-repository';
import { createMembership, fromMembershipData } from '../domain/membership/membership';
import { MembershipNotFoundError } from '../domain/membership/membership-errors';

/**
 * DynamoDB membership repository implementation
 */
export class DynamoDBMembershipRepository implements IMembershipRepository {
  private dynamoClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(
    tableName?: string,
    private userRepository?: IUserRepository,
    dynamoClient?: DynamoDBClient
  ) {
    const client = dynamoClient || new DynamoDBClient({});
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName || process.env.MAIN_TABLE_NAME || 'sydney-cycles-main-development';
  }

  /**
   * Get membership by club and user
   */
  async getMembershipByClubAndUser(clubId: string, userId: string): Promise<ClubMembership | null> {
    const startTime = Date.now();

    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `CLUB#${clubId}`,
          SK: `MEMBER#${userId}`,
        },
      });

      const result = await this.dynamoClient.send(command);
      const duration = Date.now() - startTime;

      if (!result.Item) {
        logStructured('INFO', 'Membership not found', {
          clubId,
          userId,
          duration,
          operation: 'get_membership_by_club_and_user',
        });
        return null;
      }

      const membership = this.dynamoItemToMembership(result.Item as MembershipDynamoItem);

      logStructured('INFO', 'Membership retrieved from DynamoDB', {
        clubId,
        userId,
        membershipId: membership.membershipId,
        role: membership.role,
        status: membership.status,
        duration,
        operation: 'get_membership_by_club_and_user',
      });

      return membership;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to get membership by club and user', {
        clubId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        operation: 'get_membership_by_club_and_user',
      });
      throw error;
    }
  }

  /**
   * Get membership by ID
   */
  async getMembershipById(membershipId: string): Promise<ClubMembership | null> {
    // For Phase 2.2, we need to scan or maintain a GSI for membership ID lookups
    // This is a simplified implementation - in production, consider adding a GSI
    throw new Error('getMembershipById not implemented - requires GSI or scan operation');
  }

  /**
   * List club members with pagination and filtering
   */
  async listClubMembers(clubId: string, options: ListMembersOptions): Promise<ListMembersResult> {
    const startTime = Date.now();
    const limit = options.limit || MEMBERSHIP_CONSTRAINTS.DEFAULT_LIST_LIMIT;

    try {
      const queryParams: any = {
        TableName: this.tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :gsi2pk',
        ExpressionAttributeValues: {
          ':gsi2pk': `CLUB#${clubId}#MEMBERS`,
        },
        Limit: limit + 1, // Get one extra to determine if there are more results
        ScanIndexForward: true,
      };

      // Add role filter
      if (options.role) {
        queryParams.KeyConditionExpression += ' AND begins_with(GSI2SK, :rolePrefix)';
        queryParams.ExpressionAttributeValues[':rolePrefix'] = `ROLE#${options.role}#`;
      }

      // Add status filter
      if (options.status) {
        queryParams.FilterExpression = '#status = :status';
        queryParams.ExpressionAttributeNames = {
          '#status': 'status',
        };
        queryParams.ExpressionAttributeValues[':status'] = options.status;
      }

      // Add cursor for pagination
      if (options.cursor) {
        try {
          const decodedCursor = JSON.parse(Buffer.from(options.cursor, 'base64').toString());
          queryParams.ExclusiveStartKey = {
            GSI2PK: `CLUB#${clubId}#MEMBERS`,
            GSI2SK: `ROLE#${decodedCursor.role}#USER#${decodedCursor.userId}`,
            PK: `CLUB#${clubId}#MEMBERS`,
            SK: `ROLE#${decodedCursor.role}#USER#${decodedCursor.userId}`,
          };
        } catch (error) {
          throw new Error('Invalid cursor format');
        }
      }

      const command = new QueryCommand(queryParams);
      const result = await this.dynamoClient.send(command);
      const duration = Date.now() - startTime;

      const items = result.Items || [];
      const hasMore = items.length > limit;
      const memberItems = items.slice(0, limit);

      // Enrich with user data
      const members: ClubMemberInfo[] = [];
      if (this.userRepository && memberItems.length > 0) {
        const userIds = memberItems.map(item => (item as ClubMemberDynamoItem).userId);
        const users = await Promise.all(
          userIds.map(userId => this.userRepository!.getUserById(userId))
        );

        for (let i = 0; i < memberItems.length; i++) {
          const memberItem = memberItems[i] as ClubMemberDynamoItem;
          const user = users[i];
          
          members.push({
            membershipId: memberItem.membershipId,
            userId: memberItem.userId,
            displayName: user?.displayName || 'Unknown User',
            email: user?.email || '',
            avatarUrl: user?.avatarUrl,
            role: memberItem.role,
            status: memberItem.status,
            joinedAt: memberItem.joinedAt,
            updatedAt: memberItem.updatedAt,
          });
        }
      } else {
        // Fallback without user enrichment
        for (const item of memberItems) {
          const memberItem = item as ClubMemberDynamoItem;
          members.push({
            membershipId: memberItem.membershipId,
            userId: memberItem.userId,
            displayName: 'Unknown User',
            email: '',
            role: memberItem.role,
            status: memberItem.status,
            joinedAt: memberItem.joinedAt,
            updatedAt: memberItem.updatedAt,
          });
        }
      }

      let nextCursor: string | undefined;
      if (hasMore && members.length > 0) {
        const lastMember = memberItems[memberItems.length - 1] as ClubMemberDynamoItem;
        const cursorData = {
          role: lastMember.role,
          userId: lastMember.userId,
        };
        nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
      }

      logStructured('INFO', 'Club members listed from DynamoDB', {
        clubId,
        resultCount: members.length,
        hasMore,
        role: options.role,
        status: options.status,
        duration,
        operation: 'list_club_members',
      });

      return {
        members,
        nextCursor,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to list club members', {
        clubId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        operation: 'list_club_members',
      });
      throw error;
    }
  }

  /**
   * List user's club memberships
   */
  async listUserMemberships(userId: string, status?: MembershipStatus): Promise<UserMembershipSummary[]> {
    const startTime = Date.now();

    try {
      const queryParams: any = {
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :membershipPrefix)',
        ExpressionAttributeValues: {
          ':gsi1pk': `USER#${userId}`,
          ':membershipPrefix': 'MEMBERSHIP#',
        },
      };

      // Add status filter and entity type filter to avoid duplicates
      // Filter for USER_MEMBERSHIP records only (not CLUB_MEMBERSHIP records)
      if (status) {
        queryParams.FilterExpression = '#status = :status AND #entityType = :entityType';
        queryParams.ExpressionAttributeNames = {
          '#status': 'status',
          '#entityType': 'entityType',
        };
        queryParams.ExpressionAttributeValues[':status'] = status;
        queryParams.ExpressionAttributeValues[':entityType'] = 'USER_MEMBERSHIP';
      } else {
        queryParams.FilterExpression = '#entityType = :entityType';
        queryParams.ExpressionAttributeNames = {
          '#entityType': 'entityType',
        };
        queryParams.ExpressionAttributeValues[':entityType'] = 'USER_MEMBERSHIP';
      }

      const command = new QueryCommand(queryParams);
      const result = await this.dynamoClient.send(command);
      const duration = Date.now() - startTime;

      const items = result.Items || [];
      const memberships: UserMembershipSummary[] = items.map(item => {
        const membershipItem = item as UserMembershipDynamoItem;
        return {
          membershipId: membershipItem.membershipId,
          clubId: membershipItem.clubId,
          clubName: 'Unknown Club', // Would need club data enrichment
          role: membershipItem.role,
          status: membershipItem.status,
          joinedAt: membershipItem.joinedAt,
        };
      });

      logStructured('INFO', 'User memberships listed from DynamoDB', {
        userId,
        resultCount: memberships.length,
        status,
        duration,
        operation: 'list_user_memberships',
      });

      return memberships;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to list user memberships', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        operation: 'list_user_memberships',
      });
      throw error;
    }
  }

  /**
   * Create a new membership
   */
  async createMembership(
    clubId: string,
    userId: string,
    input: JoinClubInput,
    role: ClubRole = ClubRole.MEMBER,
    status: MembershipStatus = MembershipStatus.PENDING
  ): Promise<ClubMembership> {
    const startTime = Date.now();

    try {
      // Create membership entity
      const membershipEntity = createMembership(clubId, userId, role, status, input.message);
      const membership = membershipEntity.toMembership();

      // Create DynamoDB items
      const canonicalItem = this.membershipToCanonicalItem(membership);
      const userIndexItem = this.membershipToUserIndexItem(membership);
      const clubMemberIndexItem = this.membershipToClubMemberIndexItem(membership);

      // Use TransactWrite to ensure all items are created atomically
      const command = new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: canonicalItem,
              ConditionExpression: 'attribute_not_exists(PK)', // Ensure membership doesn't already exist
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: userIndexItem,
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: clubMemberIndexItem,
            },
          },
        ],
      });

      await this.dynamoClient.send(command);
      const duration = Date.now() - startTime;

      logStructured('INFO', 'Membership created in DynamoDB', {
        clubId,
        userId,
        membershipId: membership.membershipId,
        role: membership.role,
        status: membership.status,
        duration,
        operation: 'create_membership',
      });

      return membership;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to create membership', {
        clubId,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        operation: 'create_membership',
      });
      throw error;
    }
  }

  /**
   * Update membership role
   */
  async updateMembershipRole(membershipId: string, input: UpdateMemberInput, updatedBy: string): Promise<ClubMembership> {
    // This would require implementing membership lookup by ID and update logic
    // For Phase 2.2 MVP, we'll implement a simplified version
    throw new Error('updateMembershipRole not fully implemented');
  }

  /**
   * Update membership status
   */
  async updateMembershipStatus(
    membershipId: string,
    status: MembershipStatus,
    processedBy?: string,
    reason?: string
  ): Promise<ClubMembership> {
    const startTime = Date.now();

    try {
      // First, we need to find the membership by scanning for the membershipId
      // This is inefficient but works for MVP - in production, add a GSI on membershipId
      const scanCommand = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        FilterExpression: 'membershipId = :membershipId',
        ExpressionAttributeValues: {
          ':membershipId': membershipId,
        },
        Limit: 1,
      });

      // Try to find membership across all users
      // This is a workaround - ideally we'd have a GSI on membershipId
      // For now, we'll need the clubId and userId to be passed or stored differently
      throw new MembershipNotFoundError(`Cannot update membership ${membershipId} - requires clubId and userId`);
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to update membership status', {
        membershipId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        operation: 'update_membership_status',
      });
      throw error;
    }
  }

  /**
   * Update membership status by club and user (more efficient)
   */
  async updateMembershipStatusByClubAndUser(
    clubId: string,
    userId: string,
    status: MembershipStatus,
    processedBy?: string,
    reason?: string
  ): Promise<ClubMembership> {
    const startTime = Date.now();

    try {
      // Get existing membership
      const membership = await this.getMembershipByClubAndUser(clubId, userId);
      if (!membership) {
        throw new MembershipNotFoundError(`Membership not found for club ${clubId} and user ${userId}`);
      }

      const now = new Date().toISOString();
      const updatedMembership: ClubMembership = {
        ...membership,
        status,
        updatedAt: now,
        processedBy,
        processedAt: processedBy ? now : membership.processedAt,
        reason: reason || membership.reason,
      };

      // Update all three items atomically
      const canonicalItem = this.membershipToCanonicalItem(updatedMembership);
      const userIndexItem = this.membershipToUserIndexItem(updatedMembership);
      const clubMemberIndexItem = this.membershipToClubMemberIndexItem(updatedMembership);

      const command = new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: canonicalItem,
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: userIndexItem,
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: clubMemberIndexItem,
            },
          },
        ],
      });

      await this.dynamoClient.send(command);
      const duration = Date.now() - startTime;

      logStructured('INFO', 'Membership status updated in DynamoDB', {
        clubId,
        userId,
        membershipId: membership.membershipId,
        oldStatus: membership.status,
        newStatus: status,
        processedBy,
        duration,
        operation: 'update_membership_status_by_club_and_user',
      });

      return updatedMembership;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to update membership status by club and user', {
        clubId,
        userId,
        status,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        operation: 'update_membership_status_by_club_and_user',
      });
      throw error;
    }
  }

  /**
   * Remove membership
   */
  async removeMembership(membershipId: string, removedBy: string, reason?: string): Promise<ClubMembership> {
    return this.updateMembershipStatus(membershipId, MembershipStatus.REMOVED, removedBy, reason);
  }

  /**
   * Remove membership by club and user (more efficient)
   */
  async removeMembershipByClubAndUser(clubId: string, userId: string, removedBy: string, reason?: string): Promise<ClubMembership> {
    return this.updateMembershipStatusByClubAndUser(clubId, userId, MembershipStatus.REMOVED, removedBy, reason);
  }

  /**
   * Check if user is a member of club
   */
  async isUserMember(clubId: string, userId: string): Promise<boolean> {
    const membership = await this.getMembershipByClubAndUser(clubId, userId);
    return membership !== null && membership.status === MembershipStatus.ACTIVE;
  }

  /**
   * Get user's role in club
   */
  async getUserRoleInClub(clubId: string, userId: string): Promise<ClubRole | null> {
    const membership = await this.getMembershipByClubAndUser(clubId, userId);
    return membership && membership.status === MembershipStatus.ACTIVE ? membership.role : null;
  }

  /**
   * Count club members by status
   */
  async countClubMembers(clubId: string, status: MembershipStatus = MembershipStatus.ACTIVE): Promise<number> {
    // This would require a count query or aggregation
    // For Phase 2.2 MVP, we'll implement a simplified version
    const members = await this.listClubMembers(clubId, { status, limit: 1000 });
    return members.members.length;
  }

  /**
   * Get club owner
   */
  async getClubOwner(clubId: string): Promise<ClubMembership | null> {
    const members = await this.listClubMembers(clubId, { role: ClubRole.OWNER, status: MembershipStatus.ACTIVE });
    return members.members.length > 0 ? this.memberInfoToMembership(members.members[0]) : null;
  }

  /**
   * Get club admins (including owner)
   */
  async getClubAdmins(clubId: string): Promise<ClubMembership[]> {
    const [admins, owners] = await Promise.all([
      this.listClubMembers(clubId, { role: ClubRole.ADMIN, status: MembershipStatus.ACTIVE }),
      this.listClubMembers(clubId, { role: ClubRole.OWNER, status: MembershipStatus.ACTIVE }),
    ]);

    return [
      ...admins.members.map(member => this.memberInfoToMembership(member)),
      ...owners.members.map(member => this.memberInfoToMembership(member)),
    ];
  }

  /**
   * Check if user has pending membership request
   */
  async hasPendingMembershipRequest(clubId: string, userId: string): Promise<boolean> {
    const membership = await this.getMembershipByClubAndUser(clubId, userId);
    return membership !== null && membership.status === MembershipStatus.PENDING;
  }

  /**
   * Get club member count (active members only)
   */
  async getClubMemberCount(clubId: string): Promise<number> {
    return this.countClubMembers(clubId, MembershipStatus.ACTIVE);
  }

  /**
   * Convert DynamoDB canonical item to Membership
   */
  private dynamoItemToMembership(item: MembershipDynamoItem): ClubMembership {
    return {
      membershipId: item.membershipId,
      clubId: item.clubId,
      userId: item.userId,
      role: item.role,
      status: item.status,
      joinedAt: item.joinedAt,
      updatedAt: item.updatedAt,
      joinMessage: item.joinMessage,
      invitedBy: item.invitedBy,
      processedBy: item.processedBy,
      processedAt: item.processedAt,
      reason: item.reason,
    };
  }

  /**
   * Convert ClubMemberInfo to ClubMembership
   */
  private memberInfoToMembership(memberInfo: ClubMemberInfo): ClubMembership {
    return {
      membershipId: memberInfo.membershipId,
      clubId: '', // Would need to be provided or looked up
      userId: memberInfo.userId,
      role: memberInfo.role,
      status: memberInfo.status,
      joinedAt: memberInfo.joinedAt,
      updatedAt: memberInfo.updatedAt || memberInfo.joinedAt,
    };
  }

  /**
   * Convert Membership to DynamoDB canonical item
   */
  private membershipToCanonicalItem(membership: ClubMembership): MembershipDynamoItem {
    return {
      PK: `CLUB#${membership.clubId}`,
      SK: `MEMBER#${membership.userId}`,
      entityType: 'CLUB_MEMBERSHIP',
      membershipId: membership.membershipId,
      clubId: membership.clubId,
      userId: membership.userId,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt,
      updatedAt: membership.updatedAt,
      joinMessage: membership.joinMessage,
      invitedBy: membership.invitedBy,
      processedBy: membership.processedBy,
      processedAt: membership.processedAt,
      reason: membership.reason,
    };
  }

  /**
   * Convert Membership to DynamoDB user index item
   */
  private membershipToUserIndexItem(membership: ClubMembership): UserMembershipDynamoItem {
    const sk = `MEMBERSHIP#${membership.clubId}`;
    return {
      PK: `USER#${membership.userId}`,
      SK: sk,
      GSI1PK: `USER#${membership.userId}`,
      GSI1SK: sk,
      entityType: 'USER_MEMBERSHIP',
      membershipId: membership.membershipId,
      clubId: membership.clubId,
      userId: membership.userId,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt,
      updatedAt: membership.updatedAt,
    };
  }

  /**
   * Convert Membership to DynamoDB club member index item
   */
  private membershipToClubMemberIndexItem(membership: ClubMembership): ClubMemberDynamoItem {
    const sk = `ROLE#${membership.role}#USER#${membership.userId}`;
    return {
      PK: `CLUB#${membership.clubId}#MEMBERS`,
      SK: sk,
      GSI2PK: `CLUB#${membership.clubId}#MEMBERS`,
      GSI2SK: sk,
      entityType: 'CLUB_MEMBER_INDEX',
      membershipId: membership.membershipId,
      userId: membership.userId,
      role: membership.role,
      status: membership.status,
      joinedAt: membership.joinedAt,
      updatedAt: membership.updatedAt,
    };
  }
}