import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse, parseJSON } from '../../../../shared/utils/lambda-utils';
import { getAuthContext } from '../../../../shared/auth/auth-context';
import { ParticipationService } from '../../domain/participation/participation-service';
import { LinkManualEvidenceRequest } from '../../../../shared/types/participation';
import { ClubCapability } from '../../../../shared/types/club-authorization';
import { generateId } from '../../../../shared/utils/id-generator';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get auth context
    const authContext = await getAuthContext(event);
    const clubId = event.pathParameters?.clubId;
    const rideId = event.pathParameters?.rideId;
    const userId = event.pathParameters?.userId;
    
    if (!clubId || !rideId || !userId) {
      return createResponse(400, {
        success: false,
        error: 'Club ID, Ride ID, and User ID are required'
      });
    }
    
    const request: LinkManualEvidenceRequest = parseJSON(event.body);

    // TODO: Verify user has permission to manage evidence in this club
    // This would require implementing the authorization service
    // For now, we'll allow any authenticated user to link evidence

    // TODO: Initialize participation service with proper repositories
    // const participationService = new ParticipationService(participationRepository, rideRepository);
    
    // Generate a unique evidence ID for the manual evidence
    const evidenceId = generateId('evidence');
    
    // For now, return a placeholder response
    return createResponse(200, {
      success: true,
      data: {
        participationId: `part_${rideId}_${userId}`,
        userId: userId,
        attendanceStatus: 'attended',
        evidence: {
          type: 'manual',
          refId: evidenceId,
          matchType: 'manual',
          linkedAt: new Date().toISOString()
        },
        confirmedBy: authContext.userId,
        confirmedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Link manual evidence error:', error);
    if (error instanceof Error) {
      return createResponse(400, {
        success: false,
        error: error.message
      });
    }
    return createResponse(500, {
      success: false,
      error: 'Internal server error'
    });
  }
};