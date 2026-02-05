import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { createResponse } from '../../../../shared/utils/lambda-utils';
import { getAuthContext } from '../../../../shared/auth/auth-context';
import { DynamoDBRideRepository } from '../../infrastructure/dynamodb-ride-repository';
import { DynamoDBParticipationRepository } from '../../infrastructure/dynamodb-participation-repository';
import { MembershipHelper } from '../../infrastructure/dynamodb-membership-helper';
import { RideService } from '../../domain/ride/ride-service';
import { ParticipationService } from '../../domain/participation/participation-service';
import { RideAuthorizationService } from '../../domain/authorization/ride-authorization';
import { ParticipationStatus } from '../../../../shared/types/participation';

const dynamoClient = new DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME!;
const rideRepository = new DynamoDBRideRepository(dynamoClient, tableName);
const participationRepository = new DynamoDBParticipationRepository(dynamoClient, tableName);
const membershipHelper = new MembershipHelper(dynamoClient, tableName);
const rideService = new RideService(rideRepository);
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

    // Get ride
    const ride = await rideService.getRide(rideId);
    const rideData = ride.toJSON();

    // Check if user can view this ride
    const canView = RideAuthorizationService.canViewRide(
      authContext,
      clubId,
      rideData.status,
      rideData.scope,
      rideData.createdBy,
      rideData.isPublic
    );

    if (!canView) {
      return createResponse(403, { error: 'Insufficient privileges to view this ride' });
    }

    // Get participants
    const participants = await participationService.getRideParticipants(rideId);
    
    // Find viewer's participation (if any) - only if they're actively participating
    const viewerParticipationEntity = participants.find(
      p => p.userId === authContext.userId && 
      (p.status === ParticipationStatus.CONFIRMED || p.status === ParticipationStatus.WAITLISTED)
    );
    const viewerParticipationData = viewerParticipationEntity?.toJSON();
    
    // Transform participants data
    const participantsData = participants
      .filter(p => p.status === ParticipationStatus.CONFIRMED)
      .map(p => {
        const pData = p.toJSON();
        return {
          userId: pData.userId,
          displayName: 'Unknown', // TODO: Enrich with user name
          role: pData.role,
          status: pData.status,
          joinedAt: pData.joinedAt
        };
      });

    // Get waitlist
    const waitlistData = participants
      .filter(p => p.status === ParticipationStatus.WAITLISTED)
      .sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0))
      .map(p => {
        const pData = p.toJSON();
        return {
          userId: pData.userId,
          displayName: 'Unknown', // TODO: Enrich with user name
          joinedWaitlistAt: pData.joinedAt,
          position: pData.waitlistPosition
        };
      });

    return createResponse(200, {
      success: true,
      data: {
        ...rideData,
        participants: participantsData,
        waitlist: waitlistData,
        // Viewer-specific participation context (Phase 3.3)
        viewerParticipation: viewerParticipationData ? {
          participationId: viewerParticipationData.participationId,
          role: viewerParticipationData.role,
          status: viewerParticipationData.status,
          joinedAt: viewerParticipationData.joinedAt
        } : undefined
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Get ride error:', error);
    
    if (error.statusCode) {
      return createResponse(error.statusCode, { 
        error: error.message,
        errorType: error.errorType 
      });
    }
    
    return createResponse(500, { error: 'Internal server error' });
  }
};