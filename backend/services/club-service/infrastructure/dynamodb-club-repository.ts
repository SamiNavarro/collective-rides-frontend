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
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
  TransactWriteCommand,
  TransactWriteCommandInput
} from '@aws-sdk/lib-dynamodb';
import {
  Club,
  ClubStatus,
  CreateClubInput,
  UpdateClubInput,
  ListClubsOptions,
  ListClubsResult,
  ClubDynamoItem,
  ClubIndexItem,
  CLUB_CONSTRAINTS
} from '../../../shared/types/club';

// Define cursor type locally since it's not exported from shared types
interface ClubCursor {
  nameLower: string;
  clubId: string;
}
import { IClubRepository } from '../domain/club-repository';
import { createClub, fromClubData, normalizeClubName } from '../domain/club';
import { logStructured } from '../../../shared/utils/lambda-utils';
import { NotFoundError } from '../../../shared/utils/errors';

/**
 * DynamoDB club repository implementation
 */
export class DynamoDBClubRepository implements IClubRepository {
  private readonly docClient: DynamoDBDocumentClient;

  constructor(
    private readonly tableName: string,
    dynamoClient?: DynamoDBClient
  ) {
    const client = dynamoClient || new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client);
  }

  /**
   * Get club by ID
   */
  async getClubById(id: string): Promise<Club | null> {
    const startTime = Date.now();

    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          PK: `CLUB#${id}`,
          SK: 'METADATA',
        },
      });

      const result = await this.docClient.send(command);
      const duration = Date.now() - startTime;

      if (!result.Item) {
        logStructured('INFO', 'Club not found', {
          clubId: id,
          duration,
        });
        return null;
      }

      const club = this.mapDynamoItemToClub(result.Item as ClubDynamoItem);

      logStructured('INFO', 'Club retrieved successfully', {
        clubId: id,
        duration,
      });

      return club;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to get club by ID', {
        clubId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });
      throw error;
    }
  }

  /**
   * List clubs with pagination and filtering
   */
  async listClubs(options: ListClubsOptions): Promise<ListClubsResult> {
    const startTime = Date.now();
    const limit = options.limit || CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT;

    try {
      const queryParams: any = {
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
          ':pk': 'INDEX#CLUB',
        },
        Limit: limit + 1, // Get one extra to determine if there are more results
        ScanIndexForward: true, // Sort by GSI1SK (name-based)
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
        const cursor = this.decodeCursor(options.cursor);
        queryParams.ExclusiveStartKey = {
          GSI1PK: 'INDEX#CLUB',
          GSI1SK: `NAME#${cursor.nameLower}#ID#${cursor.clubId}`,
          PK: 'INDEX#CLUB',
          SK: `NAME#${cursor.nameLower}#ID#${cursor.clubId}`,
        };
      }

      const command = new QueryCommand(queryParams);
      const result = await this.docClient.send(command);
      const duration = Date.now() - startTime;

      const items = result.Items || [];
      const hasMore = items.length > limit;
      const clubs = items.slice(0, limit).map(item => this.indexItemToClub(item as ClubIndexItem));

      let nextCursor: string | undefined;
      if (hasMore) {
        const lastClub = clubs[clubs.length - 1];
        nextCursor = this.encodeCursor({
          nameLower: normalizeClubName(lastClub.name),
          clubId: lastClub.id,
        });
      }

      logStructured('INFO', 'Clubs listed successfully', {
        count: clubs.length,
        hasMore,
        duration,
        status: options.status,
      });

      return {
        clubs,
        nextCursor,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to list clubs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        options,
      });
      throw error;
    }
  }

  /**
   * Create a new club
   */
  async createClub(input: CreateClubInput): Promise<Club> {
    const startTime = Date.now();

    try {
      // Create club entity
      const clubEntity = createClub(input);
      const club = clubEntity.data;

      // Prepare canonical club item
      const clubItem: ClubDynamoItem = {
        PK: `CLUB#${club.id}`,
        SK: 'METADATA',
        entityType: 'CLUB',
        id: club.id,
        name: club.name,
        nameLower: normalizeClubName(club.name),
        description: club.description,
        city: club.city,
        logoUrl: club.logoUrl,
        status: club.status,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt,
      };

      // Prepare index item
      const indexItem: ClubIndexItem = {
        PK: 'INDEX#CLUB',
        SK: `NAME#${clubItem.nameLower}#ID#${club.id}`,
        GSI1PK: 'INDEX#CLUB',
        GSI1SK: `NAME#${clubItem.nameLower}#ID#${club.id}`,
        entityType: 'CLUB_INDEX',
        clubId: club.id,
        name: club.name,
        nameLower: clubItem.nameLower,
        status: club.status,
        city: club.city,
        createdAt: club.createdAt,
        updatedAt: club.updatedAt,
      };

      // Use TransactWrite to ensure both items are created atomically
      const transactParams: TransactWriteCommandInput = {
        TransactItems: [
          {
            Put: {
              TableName: this.tableName,
              Item: clubItem,
              ConditionExpression: 'attribute_not_exists(PK)', // Ensure club doesn't already exist
            },
          },
          {
            Put: {
              TableName: this.tableName,
              Item: indexItem,
            },
          },
        ],
      };

      const command = new TransactWriteCommand(transactParams);
      await this.docClient.send(command);

      const duration = Date.now() - startTime;

      logStructured('INFO', 'Club created successfully', {
        clubId: club.id,
        clubName: club.name,
        duration,
      });

      return club;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to create club', {
        clubName: input.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });
      throw error;
    }
  }

  /**
   * Update an existing club
   */
  async updateClub(id: string, input: UpdateClubInput): Promise<Club> {
    const startTime = Date.now();

    try {
      // Get existing club first
      const existingClub = await this.getClubById(id);
      if (!existingClub) {
        throw new NotFoundError('Club not found');
      }

      // Create updated club
      const updatedClub: Club = {
        ...existingClub,
        ...input,
        updatedAt: new Date().toISOString(),
      };

      const transactItems: any[] = [];

      // Always update the canonical club item
      const clubItem: ClubDynamoItem = {
        PK: `CLUB#${id}`,
        SK: 'METADATA',
        entityType: 'CLUB',
        id: updatedClub.id,
        name: updatedClub.name,
        nameLower: normalizeClubName(updatedClub.name),
        description: updatedClub.description,
        city: updatedClub.city,
        logoUrl: updatedClub.logoUrl,
        status: updatedClub.status,
        createdAt: updatedClub.createdAt,
        updatedAt: updatedClub.updatedAt,
      };

      transactItems.push({
        Put: {
          TableName: this.tableName,
          Item: clubItem,
        },
      });

      // If name changed, update index item
      const nameChanged = normalizeClubName(updatedClub.name) !== normalizeClubName(existingClub.name);

      if (nameChanged) {
        // Delete old index item
        transactItems.push({
          Delete: {
            TableName: this.tableName,
            Key: {
              PK: 'INDEX#CLUB',
              SK: `NAME#${normalizeClubName(existingClub.name)}#ID#${id}`,
            },
          },
        });

        // Create new index item
        const newIndexItem: ClubIndexItem = {
          PK: 'INDEX#CLUB',
          SK: `NAME#${clubItem.nameLower}#ID#${id}`,
          GSI1PK: 'INDEX#CLUB',
          GSI1SK: `NAME#${clubItem.nameLower}#ID#${id}`,
          entityType: 'CLUB_INDEX',
          clubId: id,
          name: updatedClub.name,
          nameLower: clubItem.nameLower,
          status: updatedClub.status,
          city: updatedClub.city,
          createdAt: updatedClub.createdAt,
          updatedAt: updatedClub.updatedAt,
        };

        transactItems.push({
          Put: {
            TableName: this.tableName,
            Item: newIndexItem,
          },
        });
      } else {
        // Update existing index item
        const indexItem: ClubIndexItem = {
          PK: 'INDEX#CLUB',
          SK: `NAME#${clubItem.nameLower}#ID#${id}`,
          GSI1PK: 'INDEX#CLUB',
          GSI1SK: `NAME#${clubItem.nameLower}#ID#${id}`,
          entityType: 'CLUB_INDEX',
          clubId: id,
          name: updatedClub.name,
          nameLower: clubItem.nameLower,
          status: updatedClub.status,
          city: updatedClub.city,
          createdAt: updatedClub.createdAt,
          updatedAt: updatedClub.updatedAt,
        };

        transactItems.push({
          Put: {
            TableName: this.tableName,
            Item: indexItem,
          },
        });
      }

      const transactParams: TransactWriteCommandInput = {
        TransactItems: transactItems,
      };

      const command = new TransactWriteCommand(transactParams);
      await this.docClient.send(command);

      const duration = Date.now() - startTime;

      logStructured('INFO', 'Club updated successfully', {
        clubId: id,
        clubName: updatedClub.name,
        nameChanged,
        duration,
      });

      return updatedClub;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to update club', {
        clubId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });
      throw error;
    }
  }

  /**
   * Check if club exists
   */
  async clubExists(id: string): Promise<boolean> {
    const club = await this.getClubById(id);
    return club !== null;
  }

  /**
   * Check if club name is unique
   */
  async isClubNameUnique(name: string, excludeId?: string): Promise<boolean> {
    const startTime = Date.now();

    try {
      const nameLower = normalizeClubName(name);

      const command = new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :namePrefix)',
        ExpressionAttributeValues: {
          ':pk': 'INDEX#CLUB',
          ':namePrefix': `NAME#${nameLower}#`,
        },
        Limit: 10, // Should be very few matches for exact name
      });

      const result = await this.docClient.send(command);
      const duration = Date.now() - startTime;

      const items = result.Items || [];

      // Check if any existing club has the exact same name (excluding the specified club)
      const conflictingClub = items.find((item: any) => {
        const indexItem = item as ClubIndexItem;
        return indexItem.nameLower === nameLower &&
          (!excludeId || indexItem.clubId !== excludeId);
      });

      const isUnique = !conflictingClub;

      logStructured('INFO', 'Club name uniqueness check completed', {
        name,
        isUnique,
        excludeId,
        duration,
      });

      return isUnique;
    } catch (error) {
      const duration = Date.now() - startTime;
      logStructured('ERROR', 'Failed to check club name uniqueness', {
        name,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
      });
      throw error;
    }
  }

  /**
   * Get clubs by status
   */
  async getClubsByStatus(status: string, limit?: number): Promise<Club[]> {
    const result = await this.listClubs({
      status: status as ClubStatus,
      limit: limit || CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT,
    });

    return result.clubs;
  }

  /**
   * Search clubs by name
   */
  async searchClubsByName(nameQuery: string, limit?: number): Promise<Club[]> {
    // For now, this is a simple implementation
    // In the future, this could use more sophisticated search
    const result = await this.listClubs({
      limit: limit || CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT,
    });

    const query = nameQuery.toLowerCase();
    return result.clubs.filter(club =>
      club.name.toLowerCase().includes(query)
    );
  }

  /**
   * Map DynamoDB item to Club
   */
  private mapDynamoItemToClub(item: ClubDynamoItem): Club {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      status: item.status,
      city: item.city,
      logoUrl: item.logoUrl,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  /**
   * Map index item to Club (minimal data)
   */
  private indexItemToClub(item: ClubIndexItem): Club {
    return {
      id: item.clubId,
      name: item.name,
      status: item.status,
      city: item.city,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      // Note: description and logoUrl are not in index items
      // They would need to be fetched separately if needed
    };
  }

  /**
   * Encode cursor for pagination
   */
  private encodeCursor(cursor: ClubCursor): string {
    const cursorData = JSON.stringify(cursor);
    return Buffer.from(cursorData).toString('base64');
  }

  /**
   * Decode cursor for pagination
   */
  private decodeCursor(cursor: string): ClubCursor {
    try {
      const cursorData = Buffer.from(cursor, 'base64').toString('utf-8');
      return JSON.parse(cursorData);
    } catch (error) {
      throw new Error('Invalid pagination cursor');
    }
  }
}