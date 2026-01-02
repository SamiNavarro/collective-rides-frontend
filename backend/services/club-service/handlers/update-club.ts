/**
 * Update Club Handler - Phase 2.1
 * 
 * Lambda handler for PUT /clubs/{id} endpoint.
 * Admin endpoint for updating existing clubs (SiteAdmin only).
 * 
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createEnhancedAuthContext } from '../../../shared/auth/auth-context';
import { createSuccessResponse, handleLambdaError, logStructured, parseJsonBody } from '../../../shared/utils/lambda-utils';
import { ValidationError } from '../../../shared/utils/errors';
import { UpdateClubInput } from '../../../shared/types/club';
import { DynamoDBUserRepository } from '../../user-profile/infrastructure/dynamodb-user-repository';
import { DynamoDBClubRepository } from '../infrastructure/dynamodb-club-repository';
import { ClubService } from '../domain/club-service';
import { 
  SystemCapability, 
  requireCapability,
  createAuthorizationErrorResponse,
  isAuthorizationError 
} from '../../../shared/authorization';

// Environment variables
const TABLE_NAME = process.env.TABLE_NAME!;

// Initialize repositories and services
const userRepository = new DynamoDBUserRepository(TABLE_NAME);
const clubRepository = new DynamoDBClubRepository(TABLE_NAME);
const clubService = new ClubService(clubRepository);

/**
 * Lambda handler for PUT /clubs/{id}
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logStructured('INFO', 'Processing update club request', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
  });
  
  try {
    // Extract club ID from path parameters
    const clubId = event.pathParameters?.clubId;
    
    if (!clubId) {
      throw new ValidationError('Club ID is required');
    }

    // Parse request body
    const updateInput = parseJsonBody<UpdateClubInput>(event);

    // Create enhanced authentication context
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);

    logStructured('INFO', 'Authentication context created', {
      requestId,
      userId: authContext.userId,
      clubId,
      isAuthenticated: authContext.isAuthenticated,
      isSiteAdmin: authContext.isSiteAdmin,
      updateFields: Object.keys(updateInput),
    });

    // Check authorization - requires manage_all_clubs capability
    await requireCapability(SystemCapability.MANAGE_ALL_CLUBS, `club:${clubId}`)(authContext);

    logStructured('INFO', 'Authorization successful', {
      requestId,
      userId: authContext.userId,
      clubId,
      capability: SystemCapability.MANAGE_ALL_CLUBS,
    });

    // Update club
    const updatedClub = await clubService.updateClub(clubId, updateInput);

    logStructured('INFO', 'Club updated successfully', {
      requestId,
      userId: authContext.userId,
      clubId,
      clubName: updatedClub.name,
      status: updatedClub.status,
      updateFields: Object.keys(updateInput),
    });

    // Format response
    const response = {
      success: true,
      data: updatedClub,
      timestamp: new Date().toISOString(),
    };

    return createSuccessResponse(response);
  } catch (error) {
    logStructured('ERROR', 'Error processing update club request', {
      requestId,
      clubId: event.pathParameters?.clubId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Handle authorization errors with proper response format
    if (isAuthorizationError(error)) {
      return {
        statusCode: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(createAuthorizationErrorResponse(error, requestId)),
      };
    }

    return handleLambdaError(error, requestId);
  }
}