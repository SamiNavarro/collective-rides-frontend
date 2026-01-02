/**
 * Remove Member Handler - Phase 2.2
 * 
 * Lambda handler for DELETE /v1/clubs/{id}/members/{userId} endpoint.
 * Allows club admins to remove members from clubs.
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { RemoveMemberInput } from '../../../../shared/types/membership';
import { ClubCapability } from '../../../../shared/types/club-authorization';
import { createEnhancedAuthContext } from '../../../../shared/auth/auth-context';
import { createSuccessResponse, handleLambdaError, logStructured, parseJsonBody } from '../../../../shared/utils/lambda-utils';
import { ValidationError } from '../../../../shared/utils/errors';
import { DynamoDBUserRepository } from '../../../user-profile/infrastructure/dynamodb-user-repository';
import { DynamoDBClubRepository } from '../../infrastructure/dynamodb-club-repository';
import { DynamoDBMembershipRepository } from '../../infrastructure/dynamodb-membership-repository';
import { MembershipService } from '../../domain/membership/membership-service';
import { ClubAuthorizationService } from '../../domain/authorization/club-authorization';
import { authorizationService } from '../../../../shared/authorization/authorization-service';

// Environment variables
const TABLE_NAME = process.env.TABLE_NAME!;

// Initialize repositories and services
const userRepository = new DynamoDBUserRepository(TABLE_NAME);
const clubRepository = new DynamoDBClubRepository(TABLE_NAME);
const membershipRepository = new DynamoDBMembershipRepository(TABLE_NAME, userRepository);
const membershipService = new MembershipService(membershipRepository, clubRepository, authorizationService);
const authService = new ClubAuthorizationService(membershipRepository, authorizationService);

/**
 * Lambda handler for DELETE /v1/clubs/{id}/members/{userId}
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logStructured('INFO', 'Processing remove member request', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
  });
  
  try {
    // Extract club ID and user ID from path parameters
    const clubId = event.pathParameters?.clubId;
    const targetUserId = event.pathParameters?.userId;
    
    if (!clubId) {
      throw new ValidationError('Club ID is required');
    }

    if (!targetUserId) {
      throw new ValidationError('User ID is required');
    }

    // Parse request body (optional)
    const removeInput = parseJsonBody<RemoveMemberInput>(event) || {};

    // Create enhanced authentication context
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);

    logStructured('INFO', 'Authentication context created', {
      requestId,
      userId: authContext.userId,
      clubId,
      targetUserId,
      reason: removeInput.reason,
      isAuthenticated: authContext.isAuthenticated,
    });

    // Check authorization - requires remove_members capability
    await authService.requireClubCapability(authContext, clubId, ClubCapability.REMOVE_MEMBERS);

    logStructured('INFO', 'Authorization successful', {
      requestId,
      userId: authContext.userId,
      clubId,
      capability: ClubCapability.REMOVE_MEMBERS,
    });

    // Remove member
    const membership = await membershipService.removeMember(clubId, targetUserId, removeInput, authContext);

    logStructured('INFO', 'Member removed successfully', {
      requestId,
      userId: authContext.userId,
      clubId,
      targetUserId,
      membershipId: membership.membershipId,
      reason: removeInput.reason,
    });

    // Format response
    const response = {
      success: true,
      message: 'Member removed from club',
      timestamp: new Date().toISOString(),
    };

    return createSuccessResponse(response);
  } catch (error) {
    logStructured('ERROR', 'Error processing remove member request', {
      requestId,
      clubId: event.pathParameters?.clubId,
      targetUserId: event.pathParameters?.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return handleLambdaError(error, requestId);
  }
}