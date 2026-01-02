/**
 * Get User Memberships Handler - Phase 2.2
 * 
 * Lambda handler for GET /v1/users/me/memberships endpoint.
 * Returns the authenticated user's club memberships.
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { MembershipStatus } from '../../../../shared/types/membership';
import { createEnhancedAuthContext } from '../../../../shared/auth/auth-context';
import { createSuccessResponse, handleLambdaError, logStructured } from '../../../../shared/utils/lambda-utils';
import { ValidationError } from '../../../../shared/utils/errors';
import { DynamoDBUserRepository } from '../../../user-profile/infrastructure/dynamodb-user-repository';
import { DynamoDBClubRepository } from '../../infrastructure/dynamodb-club-repository';
import { DynamoDBMembershipRepository } from '../../infrastructure/dynamodb-membership-repository';
import { MembershipService } from '../../domain/membership/membership-service';
import { authorizationService } from '../../../../shared/authorization/authorization-service';

// Environment variables
const TABLE_NAME = process.env.TABLE_NAME!;

// Initialize repositories and services
const userRepository = new DynamoDBUserRepository(TABLE_NAME);
const clubRepository = new DynamoDBClubRepository(TABLE_NAME);
const membershipRepository = new DynamoDBMembershipRepository(TABLE_NAME, userRepository);
const membershipService = new MembershipService(membershipRepository, clubRepository, authorizationService);

/**
 * Lambda handler for GET /v1/users/me/memberships
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logStructured('INFO', 'Processing get user memberships request', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
  });
  
  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    
    // Parse status filter
    let status: MembershipStatus | undefined;
    if (queryParams.status) {
      if (!Object.values(MembershipStatus).includes(queryParams.status as MembershipStatus)) {
        throw new ValidationError('Invalid status parameter');
      }
      status = queryParams.status as MembershipStatus;
    }

    // Create enhanced authentication context
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);

    logStructured('INFO', 'Authentication context created', {
      requestId,
      userId: authContext.userId,
      isAuthenticated: authContext.isAuthenticated,
      status,
    });

    // Validate user is authenticated
    if (!authContext.isAuthenticated) {
      throw new ValidationError('Authentication required');
    }

    // Get user's memberships
    const memberships = await membershipService.getUserMemberships(authContext, status);

    logStructured('INFO', 'User memberships retrieved successfully', {
      requestId,
      userId: authContext.userId,
      membershipCount: memberships.length,
      status,
    });

    // Format response
    const response = {
      success: true,
      data: memberships,
      timestamp: new Date().toISOString(),
    };

    return createSuccessResponse(response);
  } catch (error) {
    logStructured('ERROR', 'Error processing get user memberships request', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return handleLambdaError(error, requestId);
  }
}