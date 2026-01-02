/**
 * Process Join Request Handler - Phase 2.2
 * 
 * Lambda handler for PUT /v1/clubs/{id}/requests/{membershipId} endpoint.
 * Allows club admins to approve or reject join requests.
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ProcessJoinRequestInput } from '../../../../shared/types/invitation';
import { ClubCapability } from '../../../../shared/types/club-authorization';
import { createEnhancedAuthContext } from '../../../../shared/auth/auth-context';
import { createSuccessResponse, handleLambdaError, logStructured, parseJsonBody } from '../../../../shared/utils/lambda-utils';
import { ValidationError } from '../../../../shared/utils/errors';
import { DynamoDBUserRepository } from '../../../user-profile/infrastructure/dynamodb-user-repository';
import { DynamoDBClubRepository } from '../../infrastructure/dynamodb-club-repository';
import { DynamoDBMembershipRepository } from '../../infrastructure/dynamodb-membership-repository';
import { DynamoDBInvitationRepository } from '../../infrastructure/dynamodb-invitation-repository';
import { InvitationService } from '../../domain/invitation/invitation-service';
import { ClubAuthorizationService } from '../../domain/authorization/club-authorization';
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
const authService = new ClubAuthorizationService(membershipRepository, authorizationService);

/**
 * Lambda handler for PUT /v1/clubs/{id}/requests/{membershipId}
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logStructured('INFO', 'Processing join request', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
  });
  
  try {
    // Extract club ID and membership ID from path parameters
    const clubId = event.pathParameters?.clubId;
    const membershipId = event.pathParameters?.membershipId;
    
    if (!clubId) {
      throw new ValidationError('Club ID is required');
    }

    if (!membershipId) {
      throw new ValidationError('Membership ID is required');
    }

    // Parse request body
    const processInput = parseJsonBody<ProcessJoinRequestInput>(event);

    if (!processInput) {
      throw new ValidationError('Request body is required');
    }

    if (!['approve', 'reject'].includes(processInput.action)) {
      throw new ValidationError('Action must be either "approve" or "reject"');
    }

    // Create enhanced authentication context
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);

    logStructured('INFO', 'Authentication context created', {
      requestId,
      userId: authContext.userId,
      clubId,
      membershipId,
      action: processInput.action,
      isAuthenticated: authContext.isAuthenticated,
    });

    // Check authorization - requires manage_join_requests capability
    await authService.requireClubCapability(authContext, clubId, ClubCapability.MANAGE_JOIN_REQUESTS);

    logStructured('INFO', 'Authorization successful', {
      requestId,
      userId: authContext.userId,
      clubId,
      capability: ClubCapability.MANAGE_JOIN_REQUESTS,
    });

    // Process join request
    const membership = await invitationService.processJoinRequest(membershipId, processInput, authContext);

    logStructured('INFO', 'Join request processed successfully', {
      requestId,
      userId: authContext.userId,
      clubId,
      membershipId,
      action: processInput.action,
      newStatus: membership.status,
    });

    // Format response
    const response = {
      success: true,
      data: {
        membershipId: membership.membershipId,
        status: membership.status,
        processedAt: membership.processedAt,
        processedBy: membership.processedBy,
        message: processInput.message,
      },
      message: processInput.action === 'approve' ? 'Join request approved' : 'Join request rejected',
      timestamp: new Date().toISOString(),
    };

    return createSuccessResponse(response);
  } catch (error) {
    logStructured('ERROR', 'Error processing join request', {
      requestId,
      clubId: event.pathParameters?.clubId,
      membershipId: event.pathParameters?.membershipId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return handleLambdaError(error, requestId);
  }
}