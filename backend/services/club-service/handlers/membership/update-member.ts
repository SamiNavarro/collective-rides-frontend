/**
 * Update Member Handler - Phase 2.2
 * 
 * Lambda handler for PUT /v1/clubs/{id}/members/{userId} endpoint.
 * Allows club admins to update member roles.
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UpdateMemberInput } from '../../../../shared/types/membership';
import { ClubCapability } from '../../../../shared/types/club-authorization';
import { createEnhancedAuthContext } from '../../../../shared/auth/auth-context';
import { createSuccessResponse, handleLambdaError, logStructured } from '../../../../shared/utils/lambda-utils';
import { parseJsonBody } from '../../../../shared/utils/lambda-utils';
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
 * Lambda handler for PUT /v1/clubs/{id}/members/{userId}
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logStructured('INFO', 'Processing update member request', {
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

    // Parse request body
    const updateInput = parseJsonBody<UpdateMemberInput>(event);

    if (!updateInput) {
      throw new ValidationError('Request body is required');
    }

    // Create enhanced authentication context
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);

    logStructured('INFO', 'Authentication context created', {
      requestId,
      userId: authContext.userId,
      clubId,
      targetUserId,
      newRole: updateInput.role,
      isAuthenticated: authContext.isAuthenticated,
    });

    // Check authorization - requires remove_members capability (for member management)
    await authService.requireClubCapability(authContext, clubId, ClubCapability.REMOVE_MEMBERS);

    logStructured('INFO', 'Authorization successful', {
      requestId,
      userId: authContext.userId,
      clubId,
      capability: ClubCapability.REMOVE_MEMBERS,
    });

    // Update member role
    const membership = await membershipService.updateMemberRole(clubId, targetUserId, updateInput, authContext);

    logStructured('INFO', 'Member role updated successfully', {
      requestId,
      userId: authContext.userId,
      clubId,
      targetUserId,
      membershipId: membership.membershipId,
      newRole: membership.role,
    });

    // Format response
    const response = {
      success: true,
      data: {
        membershipId: membership.membershipId,
        userId: membership.userId,
        role: membership.role,
        status: membership.status,
        updatedAt: membership.updatedAt,
        updatedBy: membership.processedBy,
        reason: membership.reason,
      },
      timestamp: new Date().toISOString(),
    };

    return createSuccessResponse(response);
  } catch (error) {
    logStructured('ERROR', 'Error processing update member request', {
      requestId,
      clubId: event.pathParameters?.clubId,
      targetUserId: event.pathParameters?.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return handleLambdaError(error, requestId);
  }
}