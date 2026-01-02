/**
 * DynamoDB Invitation Repository - Phase 2.2
 * 
 * DynamoDB implementation of the invitation repository interface.
 * Uses single-table design with dual invitation system support.
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
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  ClubInvitation,
  InvitationType,
  InvitationStatus,
  CreateInvitationInput,
  ProcessInvitationInput,
  ListInvitationsOptions,
  ListInvitationsResult,
  UserInvitationSummary,
  InvitationDynamoItem,
  UserInvitationDynamoItem,
  INVITATION_CONSTRAINTS,
} from '../../../shared/types/invitation';
import { NotFoundError } from '../../../shared/utils/errors';
import { logStructured } from '../../../shared/utils/lambda-utils';
import { IInvitationRepository } from '../domain/invitation/invitation-repository';
import { createInvitation, fromInvitationData } from '../domain/invitation/invitation';
import { InvitationNotFoundError } from '../domain/invitation/invitation-errors';

/**
 * DynamoDB invitation repository implementation
 */
export class DynamoDBInvitationRepository implements IInvitationRepository {
  private dynamoClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(tableName?: string, dynamoClient?: DynamoDBClient) {
    const client = dynamoClient || new DynamoDBClient({});
    this.dynamoClient = DynamoDBDocumentClient.from(client);
    this.tableName = tableName || process.env.MAIN_TABLE_NAME || 'sydney-cycles-main-development';
  }

  /**
   * Get invitation by ID
   */
  async getInvitationById(invitationId: string): Promise<ClubInvitation | null> {
    const startTime = Date.now();

    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `INVITATION#${invitationId}`,
          SK: 'METADATA',
        },
      });

      const result = await this.dynamoClient.send(command);
      const duration = Date.now() - startTime;

      if (!result.Item) {
        logStructured('INFO', 'Invitation not found', {
          invitationId,
          duration,
          operation: 'get_invitation_by_id',
        });
        return null;
      }

      const invitation = this.dynamoItemToInvitation(result.Item as InvitationDynamoItem);

      logStructured('INFO', 'Invitation retrieved from DynamoDB', {
        invitationId,
        type: invitation.type,
        status: invitation.status,
        clubId: invitation.clubId,
        duration,
        operation: 'get_invitation_by_id',
      });

      return invitation;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to get invitation by ID', {
        invitationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        operation: 'get_invitation_by_id',
      });
      throw error;
    }
  }

  /**
   * Get invitation by token (for email invitations)
   */
  async getInvitationByToken(token: string): Promise<ClubInvitation | null> {
    const startTime = Date.now();

    try {
      // For Phase 2.2 MVP, we'll need to scan or use a GSI for token lookups
      // This is a simplified implementation - in production, consider adding a GSI
      const command = new QueryCommand({
        TableName: this.tableName,
        FilterExpression: '#token = :token AND #entityType = :entityType',
        ExpressionAttributeNames: {
          '#token': 'token',
          '#entityType': 'entityType',
        },
        ExpressionAttributeValues: {
          ':token': token,
          ':entityType': 'CLUB_INVITATION',
        },
      });

      const result = await this.dynamoClient.send(command);
      const duration = Date.now() - startTime;

      if (!result.Items || result.Items.length === 0) {
        logStructured('INFO', 'Invitation not found by token', {
          duration,
          operation: 'get_invitation_by_token',
        });
        return null;
      }

      const invitation = this.dynamoItemToInvitation(result.Items[0] as InvitationDynamoItem);

      logStructured('INFO', 'Invitation retrieved by token from DynamoDB', {
        invitationId: invitation.invitationId,
        type: invitation.type,
        status: invitation.status,
        clubId: invitation.clubId,
        duration,
        operation: 'get_invitation_by_token',
      });

      return invitation;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to get invitation by token', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        operation: 'get_invitation_by_token',
      });
      throw error;
    }
  }

  /**
   * List user's pending invitations
   */
  async listUserInvitations(userId: string, options: ListInvitationsOptions): Promise<ListInvitationsResult> {
    const startTime = Date.now();
    const limit = options.limit || INVITATION_CONSTRAINTS.DEFAULT_LIST_LIMIT;

    try {
      const queryParams: any = {
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk AND begins_with(GSI1SK, :invitationPrefix)',
        ExpressionAttributeValues: {
          ':gsi1pk': `USER#${userId}`,
          ':invitationPrefix': 'INVITATION#',
        },
        Limit: limit + 1, // Get one extra to determine if there are more results
        ScanIndexForward: false, // Most recent first
      };

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
            GSI1PK: `USER#${userId}`,
            GSI1SK: `INVITATION#${decodedCursor.invitationId}`,
            PK: `USER#${userId}`,
            SK: `INVITATION#${decodedCursor.invitationId}`,
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
      const invitationItems = items.slice(0, limit);

      const invitations: UserInvitationSummary[] = invitationItems.map(item => {
        const invitationItem = item as UserInvitationDynamoItem;
        return {
          invitationId: invitationItem.invitationId,
          clubId: invitationItem.clubId,
          clubName: invitationItem.clubName,
          role: invitationItem.role,
          status: invitationItem.status,
          invitedBy: invitationItem.invitedBy,
          invitedByName: invitationItem.invitedByName,
          invitedAt: invitationItem.invitedAt,
          expiresAt: invitationItem.expiresAt,
          message: invitationItem.message,
        };
      });

      let nextCursor: string | undefined;
      if (hasMore && invitations.length > 0) {
        const lastInvitation = invitations[invitations.length - 1];
        const cursorData = {
          invitationId: lastInvitation.invitationId,
        };
        nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64');
      }

      logStructured('INFO', 'User invitations listed from DynamoDB', {
        userId,
        resultCount: invitations.length,
        hasMore,
        status: options.status,
        duration,
        operation: 'list_user_invitations',
      });

      return {
        invitations,
        nextCursor,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to list user invitations', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        operation: 'list_user_invitations',
      });
      throw error;
    }
  }

  /**
   * Create a new invitation
   */
  async createInvitation(input: CreateInvitationInput, clubId: string, invitedBy: string): Promise<ClubInvitation> {
    const startTime = Date.now();

    try {
      // Create invitation entity
      const invitationEntity = createInvitation(input, clubId, invitedBy);
      const invitation = invitationEntity.toInvitation();

      // Create DynamoDB items
      const canonicalItem = this.invitationToCanonicalItem(invitation);
      const transactItems: any[] = [
        {
          Put: {
            TableName: this.tableName,
            Item: canonicalItem,
            ConditionExpression: 'attribute_not_exists(PK)', // Ensure invitation doesn't already exist
          },
        },
      ];

      // For user invitations, create user index item
      if (invitation.type === InvitationType.USER && invitation.userId) {
        const userIndexItem = await this.invitationToUserIndexItem(invitation, invitedBy);
        transactItems.push({
          Put: {
            TableName: this.tableName,
            Item: userIndexItem,
          },
        });
      }

      // Use TransactWrite to ensure all items are created atomically
      const command = new TransactWriteCommand({
        TransactItems: transactItems,
      });

      await this.dynamoClient.send(command);
      const duration = Date.now() - startTime;

      logStructured('INFO', 'Invitation created in DynamoDB', {
        invitationId: invitation.invitationId,
        type: invitation.type,
        clubId: invitation.clubId,
        role: invitation.role,
        duration,
        operation: 'create_invitation',
      });

      return invitation;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to create invitation', {
        clubId,
        invitedBy,
        type: input.type,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        operation: 'create_invitation',
      });
      throw error;
    }
  }

  /**
   * Process invitation (accept/decline)
   */
  async processInvitation(invitationId: string, input: ProcessInvitationInput, userId?: string): Promise<ClubInvitation> {
    const startTime = Date.now();

    try {
      // Get existing invitation
      const existingInvitation = await this.getInvitationById(invitationId);
      if (!existingInvitation) {
        throw new InvitationNotFoundError(invitationId);
      }

      // Create updated invitation entity
      const invitationEntity = fromInvitationData(existingInvitation);
      const updatedInvitationEntity = invitationEntity.process(input, userId);
      const updatedInvitation = updatedInvitationEntity.toInvitation();

      // Update canonical item
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `INVITATION#${invitationId}`,
          SK: 'METADATA',
        },
        UpdateExpression: 'SET #status = :status, processedAt = :processedAt, userId = :userId',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': updatedInvitation.status,
          ':processedAt': updatedInvitation.processedAt,
          ':userId': updatedInvitation.userId,
        },
        ReturnValues: 'ALL_NEW',
      });

      const result = await this.dynamoClient.send(command);
      const duration = Date.now() - startTime;

      logStructured('INFO', 'Invitation processed in DynamoDB', {
        invitationId,
        action: input.action,
        newStatus: updatedInvitation.status,
        userId,
        duration,
        operation: 'process_invitation',
      });

      return this.dynamoItemToInvitation(result.Attributes as InvitationDynamoItem);
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to process invitation', {
        invitationId,
        action: input.action,
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        operation: 'process_invitation',
      });
      throw error;
    }
  }

  /**
   * Cancel invitation (admin action)
   */
  async cancelInvitation(invitationId: string): Promise<ClubInvitation> {
    const startTime = Date.now();

    try {
      // Get existing invitation
      const existingInvitation = await this.getInvitationById(invitationId);
      if (!existingInvitation) {
        throw new InvitationNotFoundError(invitationId);
      }

      // Create updated invitation entity
      const invitationEntity = fromInvitationData(existingInvitation);
      const updatedInvitationEntity = invitationEntity.cancel();
      const updatedInvitation = updatedInvitationEntity.toInvitation();

      // Update canonical item
      const command = new UpdateCommand({
        TableName: this.tableName,
        Key: {
          PK: `INVITATION#${invitationId}`,
          SK: 'METADATA',
        },
        UpdateExpression: 'SET #status = :status, processedAt = :processedAt',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': updatedInvitation.status,
          ':processedAt': updatedInvitation.processedAt,
        },
        ReturnValues: 'ALL_NEW',
      });

      const result = await this.dynamoClient.send(command);
      const duration = Date.now() - startTime;

      logStructured('INFO', 'Invitation cancelled in DynamoDB', {
        invitationId,
        newStatus: updatedInvitation.status,
        duration,
        operation: 'cancel_invitation',
      });

      return this.dynamoItemToInvitation(result.Attributes as InvitationDynamoItem);
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to cancel invitation', {
        invitationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        operation: 'cancel_invitation',
      });
      throw error;
    }
  }

  /**
   * Check if user has pending invitation to club
   */
  async hasPendingInvitation(clubId: string, userId?: string, email?: string): Promise<boolean> {
    // This would require a more complex query or GSI
    // For Phase 2.2 MVP, we'll implement a simplified version
    return false;
  }

  /**
   * Get pending invitations for club (admin view)
   */
  async listClubInvitations(clubId: string, options: ListInvitationsOptions): Promise<ClubInvitation[]> {
    // This would require a GSI or scan operation
    // For Phase 2.2 MVP, we'll implement a simplified version
    return [];
  }

  /**
   * Expire old invitations
   */
  async expireInvitations(beforeDate: Date): Promise<number> {
    // This would require a scan operation to find expired invitations
    // For Phase 2.2 MVP, we'll implement a simplified version
    return 0;
  }

  /**
   * Get invitation statistics for club
   */
  async getInvitationStats(clubId: string): Promise<{
    pending: number;
    accepted: number;
    declined: number;
    expired: number;
    cancelled: number;
  }> {
    // This would require aggregation queries
    // For Phase 2.2 MVP, we'll return default values
    return {
      pending: 0,
      accepted: 0,
      declined: 0,
      expired: 0,
      cancelled: 0,
    };
  }

  /**
   * Convert DynamoDB canonical item to Invitation
   */
  private dynamoItemToInvitation(item: InvitationDynamoItem): ClubInvitation {
    return {
      invitationId: item.invitationId,
      type: item.type,
      clubId: item.clubId,
      email: item.email,
      userId: item.userId,
      role: item.role,
      status: item.status,
      invitedBy: item.invitedBy,
      invitedAt: item.invitedAt,
      expiresAt: item.expiresAt,
      processedAt: item.processedAt,
      message: item.message,
      token: item.token,
      deliveryMethod: item.deliveryMethod,
    };
  }

  /**
   * Convert Invitation to DynamoDB canonical item
   */
  private invitationToCanonicalItem(invitation: ClubInvitation): InvitationDynamoItem {
    return {
      PK: `INVITATION#${invitation.invitationId}`,
      SK: 'METADATA',
      entityType: 'CLUB_INVITATION',
      invitationId: invitation.invitationId,
      type: invitation.type,
      clubId: invitation.clubId,
      email: invitation.email,
      userId: invitation.userId,
      role: invitation.role,
      status: invitation.status,
      invitedBy: invitation.invitedBy,
      invitedAt: invitation.invitedAt,
      expiresAt: invitation.expiresAt,
      processedAt: invitation.processedAt,
      message: invitation.message,
      token: invitation.token,
      deliveryMethod: invitation.deliveryMethod,
    };
  }

  /**
   * Convert Invitation to DynamoDB user index item (for in-app invitations)
   */
  private async invitationToUserIndexItem(invitation: ClubInvitation, invitedBy: string): Promise<UserInvitationDynamoItem> {
    const sk = `INVITATION#${invitation.invitationId}`;
    
    // For Phase 2.2 MVP, we'll use placeholder values for club and user names
    // In production, these would be enriched with actual data
    return {
      PK: `USER#${invitation.userId}`,
      SK: sk,
      GSI1PK: `USER#${invitation.userId}`,
      GSI1SK: sk,
      entityType: 'USER_INVITATION',
      invitationId: invitation.invitationId,
      clubId: invitation.clubId,
      clubName: 'Unknown Club', // Would need club data enrichment
      role: invitation.role,
      status: invitation.status,
      invitedBy: invitation.invitedBy,
      invitedByName: 'Unknown User', // Would need user data enrichment
      invitedAt: invitation.invitedAt,
      expiresAt: invitation.expiresAt,
      message: invitation.message,
    };
  }
}