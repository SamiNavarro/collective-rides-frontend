/**
 * Get Club Handler - Phase 2.1
 * 
 * Lambda handler for GET /clubs/{id} endpoint.
 * Public endpoint for retrieving club details by ID.
 * 
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createSuccessResponse, handleLambdaError, logStructured } from '../../../shared/utils/lambda-utils';
import { ValidationError } from '../../../shared/utils/errors';
import { DynamoDBClubRepository } from '../infrastructure/dynamodb-club-repository';
import { ClubService } from '../domain/club-service';

// Environment variables
const TABLE_NAME = process.env.TABLE_NAME!;

// Initialize repository and service
const clubRepository = new DynamoDBClubRepository(TABLE_NAME);
const clubService = new ClubService(clubRepository);

/**
 * Lambda handler for GET /clubs/{id}
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logStructured('INFO', 'Processing get club request', {
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

    logStructured('INFO', 'Extracted club ID', {
      requestId,
      clubId,
    });

    // Get club by ID
    const club = await clubService.getClubById(clubId);

    logStructured('INFO', 'Club retrieved successfully', {
      requestId,
      clubId,
      clubName: club.name,
      status: club.status,
    });

    // Return club directly - createSuccessResponse will wrap it
    const origin = event.headers?.origin || event.headers?.Origin;
    return createSuccessResponse(club, 200, origin);
  } catch (error) {
    logStructured('ERROR', 'Error processing get club request', {
      requestId,
      clubId: event.pathParameters?.clubId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const origin = event.headers?.origin || event.headers?.Origin;
    return handleLambdaError(error, requestId, origin);
  }
}