/**
 * Leave Club Handler - Phase 2.2
 * 
 * Lambda handler for DELETE /v1/clubs/{id}/members/me endpoint.
 * Allows authenticated users to leave clubs voluntarily.
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
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
 * Lambda handler for DELETE /v1/clubs/{id}/members/me
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  const origin = event.headers.origin || event.headers.Origin;
  
  logStructured('INFO', 'Processing leave club request', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
    origin,
  });
  
  try {
    // Extract club ID from path parameters
    const clubId = event.pathParameters?.clubId;
    
    if (!clubId) {
      throw new ValidationError('Club ID is required');
    }

    // Create enhanced authentication context
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);

    logStructured('INFO', 'Authentication context created', {
      requestId,
      userId: authContext.userId,
      clubId,
      isAuthenticated: authContext.isAuthenticated,
    });

    // Validate user is authenticated
    if (!authContext.isAuthenticated) {
      throw new ValidationError('Authentication required');
    }

    // Leave club
    const membership = await membershipService.leaveClub(clubId, authContext);

    logStructured('INFO', 'User left club successfully', {
      requestId,
      userId: authContext.userId,
      clubId,
      membershipId: membership.membershipId,
    });

    // Format response
    const response = {
      success: true,
      message: 'Successfully left the club',
      timestamp: new Date().toISOString(),
    };

    return createSuccessResponse(response, undefined, origin);
  } catch (error) {
    logStructured('ERROR', 'Error processing leave club request', {
      requestId,
      clubId: event.pathParameters?.clubId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return handleLambdaError(error, requestId);
  }
}