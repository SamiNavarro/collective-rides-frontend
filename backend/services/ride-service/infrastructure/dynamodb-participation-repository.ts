import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  QueryCommand, 
  UpdateCommand,
  DeleteCommand,
  TransactWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { ParticipationEntity } from '../domain/participation/participation';
import { 
  ParticipationRepository, 
  PaginatedParticipations,
  UserRideInfo,
  PaginatedUserRides 
} from '../domain/participation/participation-repository';
import { ListUserRidesQuery, ParticipationStatus } from '../../../shared/types/participation';

export class DynamoDBParticipationRepository implements ParticipationRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(dynamoClient: DynamoDBClient, tableName: string) {
    this.docClient = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = tableName;
  }

  async create(participation: ParticipationEntity): Promise<void> {
    const participationData = participation.toJSON();
    const now = new Date().toISOString();

    const items = [
      // Main participation item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `RIDE#${participationData.rideId}`,
            SK: `PARTICIPANT#${participationData.userId}`,
            entityType: 'RIDE_PARTICIPATION',
            ...participationData
          }
        }
      },
      // User ride index item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `USER#${participationData.userId}`,
            SK: `RIDE#${participationData.rideId}`,
            GSI1PK: `USER#${participationData.userId}`,
            GSI1SK: `RIDE#${participationData.rideId}`,
            entityType: 'USER_RIDE',
            participationId: participationData.participationId,
            rideId: participationData.rideId,
            clubId: participationData.clubId,
            role: participationData.role,
            status: participationData.status,
            joinedAt: participationData.joinedAt
          }
        }
      }
    ];

    await this.docClient.send(new TransactWriteCommand({ TransactItems: items }));
  }

  async findById(participationId: string): Promise<ParticipationEntity | null> {
    // We need to scan for participation by ID since it's not in the key
    // In a real implementation, you might want to add a GSI for this
    const result = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      FilterExpression: 'participationId = :participationId',
      ExpressionAttributeValues: {
        ':participationId': participationId
      }
    }));

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return new ParticipationEntity(result.Items[0] as any);
  }

  async findByRideAndUser(rideId: string, userId: string): Promise<ParticipationEntity | null> {
    const result = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `RIDE#${rideId}`,
        SK: `PARTICIPANT#${userId}`
      }
    }));

    if (!result.Item) {
      return null;
    }

    return new ParticipationEntity(result.Item as any);
  }

  async findByRideId(rideId: string): Promise<ParticipationEntity[]> {
    const result = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `RIDE#${rideId}`,
        ':sk': 'PARTICIPANT#'
      }
    }));

    if (!result.Items) {
      return [];
    }

    return result.Items.map(item => new ParticipationEntity(item as any));
  }

  async findByUserId(userId: string, query: ListUserRidesQuery): Promise<PaginatedUserRides> {
    const queryParams: any = {
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'RIDE#'
      },
      Limit: query.limit || 20,
      ScanIndexForward: false // Most recent first
    };

    if (query.cursor) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(query.cursor, 'base64').toString());
    }

    // Add filtering
    const filterExpressions: string[] = [];
    if (query.role) {
      filterExpressions.push('#role = :role');
      queryParams.ExpressionAttributeNames = { '#role': 'role' };
      queryParams.ExpressionAttributeValues[':role'] = query.role;
    }
    if (query.status) {
      filterExpressions.push('#status = :status');
      queryParams.ExpressionAttributeNames = { 
        ...queryParams.ExpressionAttributeNames,
        '#status': 'status' 
      };
      queryParams.ExpressionAttributeValues[':status'] = query.status;
    }

    if (filterExpressions.length > 0) {
      queryParams.FilterExpression = filterExpressions.join(' AND ');
    }

    const result = await this.docClient.send(new QueryCommand(queryParams));

    // Transform to UserRideInfo (in real implementation, you'd join with ride data)
    const rides: UserRideInfo[] = [];
    if (result.Items) {
      for (const item of result.Items) {
        // Get full ride details
        const rideResult = await this.docClient.send(new QueryCommand({
          TableName: this.tableName,
          IndexName: 'GSI1',
          KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
          ExpressionAttributeValues: {
            ':pk': `RIDE#${item.rideId}`,
            ':sk': 'METADATA'
          }
        }));

        if (rideResult.Items && rideResult.Items.length > 0) {
          const rideData = rideResult.Items[0];
          
          // Get club name (simplified - in real implementation you'd cache this)
          const clubResult = await this.docClient.send(new GetCommand({
            TableName: this.tableName,
            Key: {
              PK: `CLUB#${item.clubId}`,
              SK: 'METADATA'
            }
          }));

          const clubName = clubResult.Item?.name || 'Unknown Club';

          rides.push({
            participationId: item.participationId,
            rideId: item.rideId,
            clubId: item.clubId,
            clubName,
            title: rideData.title,
            rideType: rideData.rideType,
            difficulty: rideData.difficulty,
            startDateTime: rideData.startDateTime,
            role: item.role,
            status: item.status,
            joinedAt: item.joinedAt
          });
        }
      }
    }

    let nextCursor: string | undefined;
    if (result.LastEvaluatedKey) {
      nextCursor = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
    }

    return { rides, nextCursor };
  }

  async update(participation: ParticipationEntity): Promise<void> {
    const participationData = participation.toJSON();

    const items = [
      // Update main participation item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `RIDE#${participationData.rideId}`,
            SK: `PARTICIPANT#${participationData.userId}`,
            entityType: 'RIDE_PARTICIPATION',
            ...participationData
          }
        }
      },
      // Update user ride index item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `USER#${participationData.userId}`,
            SK: `RIDE#${participationData.rideId}`,
            GSI1PK: `USER#${participationData.userId}`,
            GSI1SK: `RIDE#${participationData.rideId}`,
            entityType: 'USER_RIDE',
            participationId: participationData.participationId,
            rideId: participationData.rideId,
            clubId: participationData.clubId,
            role: participationData.role,
            status: participationData.status,
            joinedAt: participationData.joinedAt
          }
        }
      }
    ];

    await this.docClient.send(new TransactWriteCommand({ TransactItems: items }));
  }

  async delete(participationId: string): Promise<void> {
    // First find the participation to get keys
    const participation = await this.findById(participationId);
    if (!participation) {
      return; // Already deleted
    }

    const participationData = participation.toJSON();

    const items = [
      // Delete main participation item
      {
        Delete: {
          TableName: this.tableName,
          Key: {
            PK: `RIDE#${participationData.rideId}`,
            SK: `PARTICIPANT#${participationData.userId}`
          }
        }
      },
      // Delete user ride index item
      {
        Delete: {
          TableName: this.tableName,
          Key: {
            PK: `USER#${participationData.userId}`,
            SK: `RIDE#${participationData.rideId}`
          }
        }
      }
    ];

    await this.docClient.send(new TransactWriteCommand({ TransactItems: items }));
  }

  async getWaitlistPosition(rideId: string): Promise<number> {
    const result = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      FilterExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':pk': `RIDE#${rideId}`,
        ':sk': 'PARTICIPANT#',
        ':status': ParticipationStatus.WAITLISTED
      }
    }));

    return result.Items?.length || 0;
  }
}