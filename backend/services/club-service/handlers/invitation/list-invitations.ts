/**
 * List User Invitations Handler - Phase 2.2
 * 
 * Lambda handler for GET /v1/users/me/invitations endpoint.
 * Returns the authenticated user's pending invitations.
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InvitationStatus, INVITATION_CONSTRAINTS } from '../../../../shared/types/invitation';
import { createEnhancedAuthContext } from '../../../../shared/auth/auth-context';
import { createSuccessResponse, handleLambdaError, logStructured } from '../../../../shared/utils/lambda-utils';
import { ValidationError } from '../../../../shared/utils/errors';
import { DynamoDBUserRepository } from '../../../user-profile/infrastructure/dynamodb-user-repository';
import { DynamoDBClubRepository } from '../../infrastructure/dynamodb-club-repository';
import { DynamoDBMembershipRepository } from '../../infrastructure/dynamodb-membership-repository';
import { DynamoDBInvitationRepository } from '../../infrastructure/dynamodb-invitation-repository';
import { InvitationService } from '../../domain/invitation/invitation-service';
import { authorizationService } from '../../../../shared/authorization/authorization-service';

// Environment variables
const TABLE_NAME = process.env.TABLE_NAME!;

// Initialize repositories and services
const userRepository = new DynamoDBUserRepository(TABLE_NAME);
const clubRepository = new DynamoDBClubRepository(TABLE_NAME);
const membershipRepository = new DynamoDBMembershipRepository(TABLE_NAME, userRepository);
const invitationRepository = new DynamoDBInvitationRepository(TABLE_NAME);
const invitationService = new InvitationService(
  invitationRepository,
  membershipRepository,
  clubRepository,
  userRepository,
  authorizationService
);

/**
 * Lambda handler for GET /v1/users/me/invitations
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;

  logStructured('INFO', 'Processing list user invitations request', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
  });

  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};

    // Parse limit
    let limit: number = INVITATION_CONSTRAINTS.DEFAULT_LIST_LIMIT;
    if (queryParams.limit) {
      const parsedLimit = parseInt(queryParams.limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        throw new ValidationError('Limit must be a positive integer');
      }
      if (parsedLimit > INVITATION_CONSTRAINTS.MAX_LIST_LIMIT) {
        throw new ValidationError(`Limit cannot exceed ${INVITATION_CONSTRAINTS.MAX_LIST_LIMIT}`);
      }
      limit = parsedLimit;
    }

    // Parse status filter
    let status: InvitationStatus | undefined;
    if (queryParams.status) {
      if (!Object.values(InvitationStatus).includes(queryParams.status as InvitationStatus)) {
        throw new ValidationError('Invalid status parameter');
      }
      status = queryParams.status as InvitationStatus;
    }

    // Parse cursor
    const cursor = queryParams.cursor || undefined;

    // Create enhanced authentication context
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);

    logStructured('INFO', 'Authentication context created', {
      requestId,
      userId: authContext.userId,
      isAuthenticated: authContext.isAuthenticated,
      limit,
      status,
    });

    // Validate user is authenticated
    if (!authContext.isAuthenticated) {
      throw new ValidationError('Authentication required');
    }

    // Get user's invitations
    const result = await invitationService.getUserInvitations(authContext, {
      limit,
      status,
      cursor,
    });

    logStructured('INFO', 'User invitations retrieved successfully', {
      requestId,
      userId: authContext.userId,
      invitationCount: result.invitations.length,
      hasNextCursor: !!result.nextCursor,
      status,
    });

    // Format response
    const response = {
      success: true,
      data: result.invitations,
      pagination: {
        limit,
        nextCursor: result.nextCursor,
      },
      timestamp: new Date().toISOString(),
    };

    return createSuccessResponse(response);
  } catch (error) {
    logStructured('ERROR', 'Error processing list user invitations request', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return handleLambdaError(error, requestId);
  }
}