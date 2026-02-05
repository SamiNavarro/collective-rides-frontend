import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createResponse } from '../../../../shared/utils/lambda-utils';
import { getAuthContext } from '../../../../shared/auth/auth-context';
import { DynamoDBRideRepository } from '../../infrastructure/dynamodb-ride-repository';
import { DynamoDBParticipationRepository } from '../../infrastructure/dynamodb-participation-repository';
import { ParticipationService } from '../../domain/participation/participation-service';

const dynamoClient = new DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME!;
const rideRepository = new DynamoDBRideRepository(dynamoClient, tableName);
const participationRepository = new DynamoDBParticipationRepository(dynamoClient, tableName);
const participationService = new ParticipationService(participationRepository, rideRepository);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get auth context
    const authContext = await getAuthContext(event);
    const clubId = event.pathParameters?.clubId;
    const rideId = event.pathParameters?.rideId;
    
    if (!clubId || !rideId) {
      return createResponse(400, { error: 'Club ID and Ride ID are required' });
    }

    // Leave ride (user can always leave their own participation)
    await participationService.leaveRide(rideId, authContext.userId);

    return createResponse(200, {
      success: true,
      message: 'Successfully left the ride',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Leave ride error:', error);
    
    // Handle specific error cases
    if (error.errorType === 'PARTICIPATION_NOT_FOUND') {
      return createResponse(404, { 
        error: 'You are not participating in this ride',
        errorType: error.errorType 
      });
    }
    
    if (error.statusCode) {
      return createResponse(error.statusCode, { 
        error: error.message,
        errorType: error.errorType 
      });
    }
    
    return createResponse(500, { error: 'Internal server error' });
  }
};