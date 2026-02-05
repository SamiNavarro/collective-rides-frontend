import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createResponse, parseJSON } from '../../../../shared/utils/lambda-utils';
import { getAuthContext } from '../../../../shared/auth/auth-context';
import { DynamoDBRideRepository } from '../../infrastructure/dynamodb-ride-repository';
import { MembershipHelper } from '../../infrastructure/dynamodb-membership-helper';
import { RideService } from '../../domain/ride/ride-service';
import { RideAuthorizationService } from '../../domain/authorization/ride-authorization';
import { RideCapability } from '../../../../shared/types/ride-authorization';
import { PublishRideRequest } from '../../../../shared/types/ride';

const dynamoClient = new DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME!;
const rideRepository = new DynamoDBRideRepository(dynamoClient, tableName);
const membershipHelper = new MembershipHelper(dynamoClient, tableName);
const rideService = new RideService(rideRepository);

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

    // Check authorization - only leadership can publish rides
    await RideAuthorizationService.requireRideCapability(
      RideCapability.PUBLISH_OFFICIAL_RIDES,
      authContext,
      clubId,
      rideId
    );

    // Parse request (optional body)
    const request = event.body ? parseJSON<PublishRideRequest>(event.body) : {};

    // Publish ride
    const ride = await rideService.publishRide(rideId, authContext.userId, request);

    return createResponse(200, {
      success: true,
      data: {
        rideId: ride.rideId,
        status: ride.status,
        audience: ride.audience,
        publishedBy: authContext.userId,
        publishedAt: ride.toJSON().publishedAt,
        publishMessage: request.publishMessage
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Publish ride error:', error);
    
    if (error.statusCode) {
      return createResponse(error.statusCode, { 
        error: error.message,
        errorType: error.errorType 
      });
    }
    
    return createResponse(500, { error: 'Internal server error' });
  }
};