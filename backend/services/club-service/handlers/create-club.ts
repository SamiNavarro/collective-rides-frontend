/**
 * Create Club Handler - Phase 2.1
 * 
 * Lambda handler for POST /clubs endpoint.
 * Admin endpoint for creating new clubs (SiteAdmin only).
 * 
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createEnhancedAuthContext } from '../../../shared/auth/auth-context';
import { createSuccessResponse, handleLambdaError, logStructured } from '../../../shared/utils/lambda-utils';
import { parseJsonBody } from '../../../shared/utils/lambda-utils';
import { CreateClubInput } from '../../../shared/types/club';
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
 * Lambda handler for POST /clubs
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logStructured('INFO', 'Processing create club request', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
  });
  
  try {
    // Parse request body
    const createInput = parseJsonBody<CreateClubInput>(event);

    // Create enhanced authentication context
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);

    logStructured('INFO', 'Authentication context created', {
      requestId,
      userId: authContext.userId,
      isAuthenticated: authContext.isAuthenticated,
      isSiteAdmin: authContext.isSiteAdmin,
    });

    // Check authorization - requires manage_all_clubs capability
    await requireCapability(SystemCapability.MANAGE_ALL_CLUBS)(authContext);

    logStructured('INFO', 'Authorization successful', {
      requestId,
      userId: authContext.userId,
      capability: SystemCapability.MANAGE_ALL_CLUBS,
    });

    // Create club
    const club = await clubService.createClub(createInput);

    logStructured('INFO', 'Club created successfully', {
      requestId,
      userId: authContext.userId,
      clubId: club.id,
      clubName: club.name,
    });

    // Format response with 201 status
    const response = {
      success: true,
      data: club,
      timestamp: new Date().toISOString(),
    };

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    logStructured('ERROR', 'Error processing create club request', {
      requestId,
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