/**
 * List Clubs Handler - Phase 2.1
 * 
 * Lambda handler for GET /clubs endpoint.
 * Public endpoint for club discovery with pagination and filtering.
 * 
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createSuccessResponse, handleLambdaError, logStructured } from '../../../shared/utils/lambda-utils';
import { ValidationError } from '../../../shared/utils/errors';
import { ClubStatus, CLUB_CONSTRAINTS } from '../../../shared/types/club';
import { DynamoDBClubRepository } from '../infrastructure/dynamodb-club-repository';
import { ClubService } from '../domain/club-service';

// Environment variables
const TABLE_NAME = process.env.TABLE_NAME!;

// Initialize repository and service
const clubRepository = new DynamoDBClubRepository(TABLE_NAME);
const clubService = new ClubService(clubRepository);

/**
 * Lambda handler for GET /clubs
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logStructured('INFO', 'Processing list clubs request', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
    queryParams: event.queryStringParameters,
  });
  
  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const limit = parseLimit(queryParams.limit);
    const cursor = queryParams.cursor;
    const status = parseStatus(queryParams.status);

    logStructured('INFO', 'Parsed query parameters', {
      requestId,
      limit,
      status,
      hasCursor: !!cursor,
    });

    // List clubs
    const result = await clubService.listClubs({
      limit,
      cursor,
      status,
    });

    // Format response
    const response = {
      success: true,
      data: result.clubs,
      pagination: {
        limit,
        ...(result.nextCursor && { nextCursor: result.nextCursor }),
      },
      timestamp: new Date().toISOString(),
    };

    logStructured('INFO', 'Clubs listed successfully', {
      requestId,
      count: result.clubs.length,
      hasNextCursor: !!result.nextCursor,
    });

    return createSuccessResponse(response);
  } catch (error) {
    logStructured('ERROR', 'Error processing list clubs request', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return handleLambdaError(error, requestId);
  }
}

/**
 * Parse and validate limit parameter
 */
function parseLimit(limitParam?: string | null): number {
  if (!limitParam) {
    return CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT;
  }

  const limit = parseInt(limitParam, 10);
  
  if (isNaN(limit) || limit < 1) {
    throw new ValidationError('Limit must be a positive number');
  }

  if (limit > CLUB_CONSTRAINTS.MAX_LIST_LIMIT) {
    return CLUB_CONSTRAINTS.MAX_LIST_LIMIT;
  }

  return limit;
}

/**
 * Parse and validate status parameter
 */
function parseStatus(statusParam?: string | null): ClubStatus | undefined {
  if (!statusParam) {
    return ClubStatus.ACTIVE; // Default to active clubs
  }

  const status = statusParam.toLowerCase();
  
  // Map string to enum
  switch (status) {
    case 'active':
      return ClubStatus.ACTIVE;
    case 'suspended':
      return ClubStatus.SUSPENDED;
    case 'archived':
      return ClubStatus.ARCHIVED;
    default:
      throw new ValidationError(`Invalid status: ${statusParam}. Must be one of: active, suspended, archived`);
  }
}