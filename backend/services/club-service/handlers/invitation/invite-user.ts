/**
 * Invite User Handler - Phase 2.2
 * 
 * Lambda handler for POST /v1/clubs/{id}/invitations endpoint.
 * Allows club admins to invite users (both email and in-app invitations).
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CreateInvitationInput } from '../../../../shared/types/invitation';
import { ClubCapability } from '../../../../shared/types/club-authorization';
import { createEnhancedAuthContext } from '../../../../shared/auth/auth-context';
import { createSuccessResponse, handleLambdaError, logStructured } from '../../../../shared/utils/lambda-utils';
import { parseJsonBody } from '../../../../shared/utils/lambda-utils';
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
 * Lambda handler for POST /v1/clubs/{id}/invitations
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logStructured('INFO', 'Processing invite user request', {
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
    const invitationInput = parseJsonBody<CreateInvitationInput>(event);

    if (!invitationInput) {
      throw new ValidationError('Request body is required');
    }

    // Create enhanced authentication context
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);

    logStructured('INFO', 'Authentication context created', {
      requestId,
      userId: authContext.userId,
      clubId,
      invitationType: invitationInput.type,
      targetRole: invitationInput.role,
      isAuthenticated: authContext.isAuthenticated,
    });

    // Check authorization - requires invite_members capability
    await authService.requireClubCapability(authContext, clubId, ClubCapability.INVITE_MEMBERS);

    logStructured('INFO', 'Authorization successful', {
      requestId,
      userId: authContext.userId,
      clubId,
      capability: ClubCapability.INVITE_MEMBERS,
    });

    // Create invitation
    const invitation = await invitationService.createInvitation(clubId, invitationInput, authContext);

    logStructured('INFO', 'Invitation created successfully', {
      requestId,
      userId: authContext.userId,
      clubId,
      invitationId: invitation.invitationId,
      invitationType: invitation.type,
      targetRole: invitation.role,
    });

    // Format response
    const response = {
      success: true,
      data: {
        invitationId: invitation.invitationId,
        type: invitation.type,
        clubId: invitation.clubId,
        email: invitation.email,
        userId: invitation.userId,
        role: invitation.role,
        status: invitation.status,
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.invitedAt,
        expiresAt: invitation.expiresAt,
        message: invitation.message,
        deliveryMethod: invitation.deliveryMethod,
      },
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
    logStructured('ERROR', 'Error processing invite user request', {
      requestId,
      clubId: event.pathParameters?.clubId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return handleLambdaError(error, requestId);
  }
}