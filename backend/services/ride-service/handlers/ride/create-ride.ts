import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createResponse, parseJSON } from '../../../../shared/utils/lambda-utils';
import { getAuthContext } from '../../../../shared/auth/auth-context';
import { validateRequest } from '../../../../shared/utils/validation';
import { DynamoDBRideRepository } from '../../infrastructure/dynamodb-ride-repository';
import { DynamoDBParticipationRepository } from '../../infrastructure/dynamodb-participation-repository';
import { RideService } from '../../domain/ride/ride-service';
import { ParticipationService } from '../../domain/participation/participation-service';
import { ParticipationEntity } from '../../domain/participation/participation';
import { RideAuthorizationService } from '../../domain/authorization/ride-authorization';
import { RideCapability } from '../../../../shared/types/ride-authorization';
import { CreateRideRequest } from '../../../../shared/types/ride';

const dynamoClient = new DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME!;
const rideRepository = new DynamoDBRideRepository(dynamoClient, tableName);
const participationRepository = new DynamoDBParticipationRepository(dynamoClient, tableName);
const rideService = new RideService(rideRepository);
const participationService = new ParticipationService(participationRepository, rideRepository);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Create ride handler invoked'); // Added for rebuild trigger
  try {
    // Get auth context
    const authContext = await getAuthContext(event);
    const clubId = event.pathParameters?.clubId;
    
    if (!clubId) {
      return createResponse(400, { error: 'Club ID is required' });
    }

    // Check authorization - any club member can create ride proposals
    await RideAuthorizationService.requireRideCapability(
      RideCapability.CREATE_RIDE_PROPOSALS,
      authContext,
      clubId
    );

    // Parse and validate request
    const request = parseJSON<CreateRideRequest>(event.body);
    validateRequest(request, [
      'title',
      'description', 
      'rideType',
      'difficulty',
      'startDateTime',
      'estimatedDuration',
      'meetingPoint'
    ]);

    // Check if user can publish immediately
    const canPublish = RideAuthorizationService.canPublishRide(authContext, clubId);
    if (request.publishImmediately && !canPublish) {
      return createResponse(403, { 
        error: 'Insufficient privileges to publish rides immediately' 
      });
    }

    // Create ride
    const ride = await rideService.createRide(request, authContext.userId, clubId);

    // Create captain participation for ride creator
    const captainParticipation = ParticipationEntity.createCaptain(
      ride.rideId,
      clubId,
      authContext.userId
    );
    await participationRepository.create(captainParticipation);

    return createResponse(201, {
      success: true,
      data: ride.toJSON(),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Create ride error:', error);
    
    if (error.statusCode) {
      return createResponse(error.statusCode, { 
        error: error.message,
        errorType: error.errorType 
      });
    }
    
    return createResponse(500, { error: 'Internal server error' });
  }
};