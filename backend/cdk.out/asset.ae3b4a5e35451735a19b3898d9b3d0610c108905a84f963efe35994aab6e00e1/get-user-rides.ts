import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createResponse } from '../../../../shared/utils/lambda-utils';
import { getAuthContext } from '../../../../shared/auth/auth-context';
import { DynamoDBRideRepository } from '../../infrastructure/dynamodb-ride-repository';
import { DynamoDBParticipationRepository } from '../../infrastructure/dynamodb-participation-repository';
import { ParticipationService } from '../../domain/participation/participation-service';
import { ListUserRidesQuery, RideRole } from '../../../../shared/types/participation';

const dynamoClient = new DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME!;
const rideRepository = new DynamoDBRideRepository(dynamoClient, tableName);
const participationRepository = new DynamoDBParticipationRepository(dynamoClient, tableName);
const participationService = new ParticipationService(participationRepository, rideRepository);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get auth context
    const authContext = await getAuthContext(event);
    
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const query: ListUserRidesQuery = {
      status: queryParams.status as any,
      role: queryParams.role as RideRole,
      limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
      cursor: queryParams.cursor
    };

    // Validate limit
    if (query.limit && (query.limit < 1 || query.limit > 100)) {
      return createResponse(400, { error: 'Limit must be between 1 and 100' });
    }

    // Get user's rides
    const result = await participationService.getUserRides(authContext.userId, query);

    return createResponse(200, {
      success: true,
      data: result.rides,
      pagination: {
        limit: query.limit,
        nextCursor: result.nextCursor
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Get user rides error:', error);
    
    if (error.statusCode) {
      return createResponse(error.statusCode, { 
        error: error.message,
        errorType: error.errorType 
      });
    }
    
    return createResponse(500, { error: 'Internal server error' });
  }
};