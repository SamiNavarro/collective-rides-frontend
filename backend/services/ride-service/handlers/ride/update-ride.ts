import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createResponse, parseJSON } from '../../../../shared/utils/lambda-utils';
import { getAuthContext } from '../../../../shared/auth/auth-context';
import { DynamoDBRideRepository } from '../../infrastructure/dynamodb-ride-repository';
import { MembershipHelper } from '../../infrastructure/dynamodb-membership-helper';
import { RideService } from '../../domain/ride/ride-service';
import { RideAuthorizationService } from '../../domain/authorization/ride-authorization';
import { RideCapability } from '../../../../shared/types/ride-authorization';
import { UpdateRideRequest } from '../../../../shared/types/ride';

const dynamoClient = new DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME!;
const rideRepository = new DynamoDBRideRepository(dynamoClient, tableName);
const membershipHelper = new MembershipHelper(dynamoClient, tableName);
const rideService = new RideService(rideRepository);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Update ride handler invoked');
  const origin = event.headers?.origin || event.headers?.Origin;
  
  try {
    // Get auth context
    const authContext = await getAuthContext(event);
    const clubId = event.pathParameters?.clubId;
    const rideId = event.pathParameters?.rideId;
    
    if (!clubId) {
      return createResponse(400, { error: 'Club ID is required' }, origin);
    }
    
    if (!rideId) {
      return createResponse(400, { error: 'Ride ID is required' }, origin);
    }

    // Populate club memberships for authorization
    const memberships = await membershipHelper.getUserMemberships(authContext.userId);
    authContext.clubMemberships = memberships;

    // Get existing ride
    const ride = await rideService.getRide(rideId);
    
    // Check authorization - must be ride creator or have MANAGE_RIDES capability
    try {
      await RideAuthorizationService.requireRideCapability(
        RideCapability.MANAGE_RIDES,
        authContext,
        clubId,
        rideId,
        ride.toJSON().createdBy
      );
    } catch (error) {
      return createResponse(403, { 
        error: 'Insufficient privileges to edit this ride' 
      }, origin);
    }

    // Parse request
    const request = parseJSON<UpdateRideRequest>(event.body);

    // Update ride
    const updatedRide = await rideService.updateRide(rideId, request);

    return createResponse(200, {
      success: true,
      data: updatedRide.toJSON(),
      timestamp: new Date().toISOString()
    }, origin);

  } catch (error: any) {
    console.error('Update ride error:', error);
    
    const origin = event.headers?.origin || event.headers?.Origin;
    
    if (error.statusCode) {
      return createResponse(error.statusCode, { 
        error: error.message,
        errorType: error.errorType 
      }, origin);
    }
    
    return createResponse(500, { error: 'Internal server error' }, origin);
  }
};
