import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createResponse, parseJSON } from '../../../../shared/utils/lambda-utils';
import { getAuthContext } from '../../../../shared/auth/auth-context';
import { DynamoDBRideRepository } from '../../infrastructure/dynamodb-ride-repository';
import { DynamoDBParticipationRepository } from '../../infrastructure/dynamodb-participation-repository';
import { MembershipHelper } from '../../infrastructure/dynamodb-membership-helper';
import { ParticipationService } from '../../domain/participation/participation-service';
import { RideAuthorizationService } from '../../domain/authorization/ride-authorization';
import { RideCapability } from '../../../../shared/types/ride-authorization';
import { JoinRideRequest } from '../../../../shared/types/participation';

const dynamoClient = new DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME!;
const rideRepository = new DynamoDBRideRepository(dynamoClient, tableName);
const participationRepository = new DynamoDBParticipationRepository(dynamoClient, tableName);
const membershipHelper = new MembershipHelper(dynamoClient, tableName);
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

    // Populate club memberships for authorization
    const memberships = await membershipHelper.getUserMemberships(authContext.userId);
    authContext.clubMemberships = memberships;

    // Check authorization - club membership required to join rides
    await RideAuthorizationService.requireRideCapability(
      RideCapability.JOIN_RIDES,
      authContext,
      clubId,
      rideId
    );

    // Parse request (optional body)
    const request = event.body ? parseJSON<JoinRideRequest>(event.body) : {};

    // Join ride
    const participation = await participationService.joinRide(rideId, authContext.userId, request);

    return createResponse(201, {
      success: true,
      data: participation.toJSON(),
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Join ride error:', error);
    
    if (error.statusCode) {
      return createResponse(error.statusCode, { 
        error: error.message,
        errorType: error.errorType 
      });
    }
    
    return createResponse(500, { error: 'Internal server error' });
  }
};