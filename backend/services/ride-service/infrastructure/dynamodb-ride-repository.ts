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
import { RideEntity } from '../domain/ride/ride';
import { RideRepository, PaginatedRides } from '../domain/ride/ride-repository';
import { ListRidesQuery, RideStatus } from '../../../shared/types/ride';
import { RideSummary } from '../../../shared/types/strava';
import { RideParticipation } from '../../../shared/types/participation';

export class DynamoDBRideRepository implements RideRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(dynamoClient: DynamoDBClient, tableName: string) {
    this.docClient = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = tableName;
  }

  async create(ride: RideEntity): Promise<void> {
    const rideData = ride.toJSON();
    const now = new Date().toISOString();

    const items = [
      // Main ride item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `CLUB#${rideData.clubId}`,
            SK: `RIDE#${rideData.rideId}`,
            GSI1PK: `RIDE#${rideData.rideId}`,
            GSI1SK: 'METADATA',
            entityType: 'RIDE',
            ...rideData
          }
        }
      },
      // Club ride index item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `CLUB#${rideData.clubId}#RIDES`,
            SK: `DATE#${rideData.startDateTime.split('T')[0]}#RIDE#${rideData.rideId}`,
            GSI2PK: `CLUB#${rideData.clubId}#RIDES#${rideData.status}`,
            GSI2SK: `DATE#${rideData.startDateTime.split('T')[0]}#RIDE#${rideData.rideId}`,
            entityType: 'CLUB_RIDE_INDEX',
            rideId: rideData.rideId,
            title: rideData.title,
            rideType: rideData.rideType,
            difficulty: rideData.difficulty,
            status: rideData.status,
            startDateTime: rideData.startDateTime,
            currentParticipants: rideData.currentParticipants,
            maxParticipants: rideData.maxParticipants,
            createdBy: rideData.createdBy,
            publishedBy: rideData.publishedBy,
            publishedAt: rideData.publishedAt
          }
        }
      }
    ];

    await this.docClient.send(new TransactWriteCommand({ TransactItems: items }));
  }

  async findById(rideId: string): Promise<RideEntity | null> {
    const result = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
      ExpressionAttributeValues: {
        ':pk': `RIDE#${rideId}`,
        ':sk': 'METADATA'
      }
    }));

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    const item = result.Items[0];
    return new RideEntity(item as any);
  }

  async findByClubId(clubId: string, query: ListRidesQuery): Promise<PaginatedRides> {
    let keyCondition: string;
    let expressionAttributeValues: Record<string, any>;
    let indexName: string | undefined;

    if (query.status) {
      // Query by status using GSI2
      keyCondition = 'GSI2PK = :pk';
      expressionAttributeValues = {
        ':pk': `CLUB#${clubId}#RIDES#${query.status}`
      };
      indexName = 'GSI2';

      // Add date filtering to GSI2SK if provided
      if (query.startDate || query.endDate) {
        if (query.startDate && query.endDate) {
          keyCondition += ' AND GSI2SK BETWEEN :startDate AND :endDate';
          expressionAttributeValues[':startDate'] = `DATE#${query.startDate}`;
          expressionAttributeValues[':endDate'] = `DATE#${query.endDate}~`;
        } else if (query.startDate) {
          keyCondition += ' AND GSI2SK >= :startDate';
          expressionAttributeValues[':startDate'] = `DATE#${query.startDate}`;
        } else if (query.endDate) {
          keyCondition += ' AND GSI2SK <= :endDate';
          expressionAttributeValues[':endDate'] = `DATE#${query.endDate}~`;
        }
      } else {
        // Must provide sort key condition for GSI2
        keyCondition += ' AND begins_with(GSI2SK, :skPrefix)';
        expressionAttributeValues[':skPrefix'] = 'DATE#';
      }
    } else {
      // Query all rides for club using main table
      keyCondition = 'PK = :pk';
      expressionAttributeValues = {
        ':pk': `CLUB#${clubId}#RIDES`
      };

      // Add date filtering to SK if provided
      if (query.startDate || query.endDate) {
        if (query.startDate && query.endDate) {
          keyCondition += ' AND SK BETWEEN :startDate AND :endDate';
          expressionAttributeValues[':startDate'] = `DATE#${query.startDate}#RIDE#`;
          expressionAttributeValues[':endDate'] = `DATE#${query.endDate}#RIDE#~`;
        } else if (query.startDate) {
          keyCondition += ' AND SK >= :startDate';
          expressionAttributeValues[':startDate'] = `DATE#${query.startDate}#RIDE#`;
        } else if (query.endDate) {
          keyCondition += ' AND SK <= :endDate';
          expressionAttributeValues[':endDate'] = `DATE#${query.endDate}#RIDE#~`;
        }
      }
    }

    const queryParams: any = {
      TableName: this.tableName,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: expressionAttributeValues,
      Limit: query.limit || 20,
      ScanIndexForward: true // Sort by date ascending
    };

    if (indexName) {
      queryParams.IndexName = indexName;
    }

    if (query.cursor) {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(query.cursor, 'base64').toString());
    }

    // Add filtering for other attributes
    const filterExpressions: string[] = [];
    if (query.rideType) {
      filterExpressions.push('rideType = :rideType');
      expressionAttributeValues[':rideType'] = query.rideType;
    }
    if (query.difficulty) {
      filterExpressions.push('difficulty = :difficulty');
      expressionAttributeValues[':difficulty'] = query.difficulty;
    }

    if (filterExpressions.length > 0) {
      queryParams.FilterExpression = filterExpressions.join(' AND ');
    }

    const result = await this.docClient.send(new QueryCommand(queryParams));

    // Get full ride details for each result
    const rides: RideEntity[] = [];
    if (result.Items) {
      for (const item of result.Items) {
        const fullRide = await this.findById(item.rideId);
        if (fullRide) {
          rides.push(fullRide);
        }
      }
    }

    let nextCursor: string | undefined;
    if (result.LastEvaluatedKey) {
      nextCursor = Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64');
    }

    return { rides, nextCursor };
  }

  async update(ride: RideEntity): Promise<void> {
    const rideData = ride.toJSON();
    const now = new Date().toISOString();

    const items = [
      // Update main ride item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `CLUB#${rideData.clubId}`,
            SK: `RIDE#${rideData.rideId}`,
            GSI1PK: `RIDE#${rideData.rideId}`,
            GSI1SK: 'METADATA',
            entityType: 'RIDE',
            ...rideData,
            updatedAt: now
          }
        }
      },
      // Update club ride index item
      {
        Put: {
          TableName: this.tableName,
          Item: {
            PK: `CLUB#${rideData.clubId}#RIDES`,
            SK: `DATE#${rideData.startDateTime.split('T')[0]}#RIDE#${rideData.rideId}`,
            GSI2PK: `CLUB#${rideData.clubId}#RIDES#${rideData.status}`,
            GSI2SK: `DATE#${rideData.startDateTime.split('T')[0]}#RIDE#${rideData.rideId}`,
            entityType: 'CLUB_RIDE_INDEX',
            rideId: rideData.rideId,
            title: rideData.title,
            rideType: rideData.rideType,
            difficulty: rideData.difficulty,
            status: rideData.status,
            startDateTime: rideData.startDateTime,
            currentParticipants: rideData.currentParticipants,
            maxParticipants: rideData.maxParticipants,
            createdBy: rideData.createdBy,
            publishedBy: rideData.publishedBy,
            publishedAt: rideData.publishedAt,
            updatedAt: now
          }
        }
      }
    ];

    await this.docClient.send(new TransactWriteCommand({ TransactItems: items }));
  }

  async delete(rideId: string): Promise<void> {
    // First get the ride to know its club
    const ride = await this.findById(rideId);
    if (!ride) {
      return; // Already deleted
    }

    const rideData = ride.toJSON();

    const items = [
      // Delete main ride item
      {
        Delete: {
          TableName: this.tableName,
          Key: {
            PK: `CLUB#${rideData.clubId}`,
            SK: `RIDE#${rideId}`
          }
        }
      },
      // Delete club ride index item
      {
        Delete: {
          TableName: this.tableName,
          Key: {
            PK: `CLUB#${rideData.clubId}#RIDES`,
            SK: `DATE#${rideData.startDateTime.split('T')[0]}#RIDE#${rideId}`
          }
        }
      }
    ];

    await this.docClient.send(new TransactWriteCommand({ TransactItems: items }));
  }

  // Phase 2.5: Additional methods for completion and summary support
  async findParticipations(rideId: string): Promise<RideParticipation[]> {
    const result = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `RIDE#${rideId}#PARTICIPANTS`,
        ':sk': 'PARTICIPANT#'
      }
    }));

    return result.Items?.map(item => item as RideParticipation) || [];
  }

  async saveRideSummary(summary: RideSummary): Promise<void> {
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        PK: `RIDE#${summary.rideId}`,
        SK: 'SUMMARY',
        entityType: 'RIDE_SUMMARY',
        ...summary
      }
    }));
  }

  async findRideSummary(rideId: string): Promise<RideSummary | null> {
    const result = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: {
        PK: `RIDE#${rideId}`,
        SK: 'SUMMARY'
      }
    }));

    if (!result.Item) {
      return null;
    }

    const { PK, SK, entityType, ...summary } = result.Item;
    return summary as RideSummary;
  }
}