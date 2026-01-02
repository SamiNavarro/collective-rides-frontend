import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createResponse } from '../../../../shared/utils/lambda-utils';
import { getAuthContext } from '../../../../shared/auth/auth-context';
import { DynamoDBRideRepository } from '../../infrastructure/dynamodb-ride-repository';
import { RideService } from '../../domain/ride/ride-service';
import { RideAuthorizationService } from '../../domain/authorization/ride-authorization';
import { RideCapability } from '../../../../shared/types/ride-authorization';
import { ListRidesQuery, RideStatus } from '../../../../shared/types/ride';

const dynamoClient = new DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME!;
const rideRepository = new DynamoDBRideRepository(dynamoClient, tableName);
const rideService = new RideService(rideRepository);

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Get auth context
    const authContext = await getAuthContext(event);
    const clubId = event.pathParameters?.clubId;
    
    if (!clubId) {
      return createResponse(400, { error: 'Club ID is required' });
    }

    // Check basic authorization - club membership required
    await RideAuthorizationService.requireRideCapability(
      RideCapability.VIEW_CLUB_RIDES,
      authContext,
      clubId
    );

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const query: ListRidesQuery = {
      limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
      cursor: queryParams.cursor,
      status: queryParams.status as RideStatus,
      rideType: queryParams.rideType as any,
      difficulty: queryParams.difficulty as any,
      startDate: queryParams.startDate,
      endDate: queryParams.endDate,
      includeDrafts: queryParams.includeDrafts === 'true'
    };

    // Validate limit
    if (query.limit && (query.limit < 1 || query.limit > 100)) {
      return createResponse(400, { error: 'Limit must be between 1 and 100' });
    }

    // Check if user can view draft rides
    const canViewDrafts = RideAuthorizationService.getUserRideCapabilities(authContext, clubId)
      .includes(RideCapability.VIEW_DRAFT_RIDES);

    if (query.includeDrafts && !canViewDrafts) {
      return createResponse(403, { 
        error: 'Insufficient privileges to view draft rides' 
      });
    }

    // Get rides
    const result = await rideService.listClubRides(clubId, query);

    // Filter rides based on visibility rules
    const visibleRides = result.rides.filter(ride => {
      const rideData = ride.toJSON();
      return RideAuthorizationService.canViewRide(
        authContext,
        clubId,
        rideData.status,
        rideData.scope,
        rideData.createdBy,
        rideData.isPublic
      );
    });

    // Transform response
    const responseData = visibleRides.map(ride => {
      const rideData = ride.toJSON();
      return {
        rideId: rideData.rideId,
        title: rideData.title,
        rideType: rideData.rideType,
        difficulty: rideData.difficulty,
        status: rideData.status,
        scope: rideData.scope,
        audience: rideData.audience,
        startDateTime: rideData.startDateTime,
        estimatedDuration: rideData.estimatedDuration,
        maxParticipants: rideData.maxParticipants,
        currentParticipants: rideData.currentParticipants,
        meetingPoint: {
          name: rideData.meetingPoint.name,
          address: rideData.meetingPoint.address
        },
        route: rideData.route ? {
          name: rideData.route.name,
          type: rideData.route.type,
          distance: rideData.route.distance,
          difficulty: rideData.route.difficulty
        } : undefined,
        createdBy: rideData.createdBy,
        createdByName: 'Unknown', // TODO: Enrich with user name
        publishedBy: rideData.publishedBy,
        publishedAt: rideData.publishedAt
      };
    });

    return createResponse(200, {
      success: true,
      data: responseData,
      pagination: {
        limit: query.limit,
        nextCursor: result.nextCursor
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('List rides error:', error);
    
    if (error.statusCode) {
      return createResponse(error.statusCode, { 
        error: error.message,
        errorType: error.errorType 
      });
    }
    
    return createResponse(500, { error: 'Internal server error' });
  }
};