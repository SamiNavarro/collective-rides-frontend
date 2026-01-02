/**
 * Accept Invitation Handler - Phase 2.2
 * 
 * Lambda handler for PUT /v1/invitations/{id} endpoint.
 * Allows users to accept or decline club invitations.
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ProcessInvitationInput } from '../../../../shared/types/invitation';
import { createEnhancedAuthContext } from '../../../../shared/auth/auth-context';
import { createSuccessResponse, handleLambdaError, logStructured } from '../../../../shared/utils/lambda-utils';
import { parseJsonBody } from '../../../../shared/utils/lambda-utils';
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
 * Lambda handler for PUT /v1/invitations/{id}
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logStructured('INFO', 'Processing accept invitation request', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
  });
  
  try {
    // Extract invitation ID from path parameters
    const invitationId = event.pathParameters?.id;
    
    if (!invitationId) {
      throw new ValidationError('Invitation ID is required');
    }

    // Parse request body
    const processInput = parseJsonBody<ProcessInvitationInput>(event);

    if (!processInput) {
      throw new ValidationError('Request body is required');
    }

    if (!['accept', 'decline'].includes(processInput.action)) {
      throw new ValidationError('Action must be either "accept" or "decline"');
    }

    // Create enhanced authentication context
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);

    logStructured('INFO', 'Authentication context created', {
      requestId,
      userId: authContext.userId,
      invitationId,
      action: processInput.action,
      isAuthenticated: authContext.isAuthenticated,
    });

    // Validate user is authenticated
    if (!authContext.isAuthenticated) {
      throw new ValidationError('Authentication required');
    }

    // Process invitation
    const result = await invitationService.processInvitation(invitationId, processInput, authContext);

    logStructured('INFO', 'Invitation processed successfully', {
      requestId,
      userId: authContext.userId,
      invitationId,
      action: processInput.action,
      clubId: result.invitation.clubId,
      membershipId: result.membership?.membershipId,
    });

    // Format response based on action
    if (processInput.action === 'accept') {
      const response = {
        success: true,
        data: {
          invitation: {
            invitationId: result.invitation.invitationId,
            status: result.invitation.status,
            processedAt: result.invitation.processedAt,
          },
          membership: result.membership ? {
            membershipId: result.membership.membershipId,
            clubId: result.membership.clubId,
            userId: result.membership.userId,
            role: result.membership.role,
            status: result.membership.status,
            joinedAt: result.membership.joinedAt,
          } : undefined,
        },
        message: 'Invitation accepted successfully',
        timestamp: new Date().toISOString(),
      };

      return createSuccessResponse(response);
    } else {
      const response = {
        success: true,
        data: {
          invitationId: result.invitation.invitationId,
          status: result.invitation.status,
          processedAt: result.invitation.processedAt,
        },
        message: 'Invitation declined',
        timestamp: new Date().toISOString(),
      };

      return createSuccessResponse(response);
    }
  } catch (error) {
    logStructured('ERROR', 'Error processing accept invitation request', {
      requestId,
      invitationId: event.pathParameters?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return handleLambdaError(error, requestId);
  }
}