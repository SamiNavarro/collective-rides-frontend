/**
 * List Club Members Handler - Phase 2.2
 * 
 * Lambda handler for GET /v1/clubs/{id}/members endpoint.
 * Lists club members with role-based access control.
 * 
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ClubRole, MembershipStatus, MEMBERSHIP_CONSTRAINTS } from '../../../../shared/types/membership';
import { ClubCapability } from '../../../../shared/types/club-authorization';
import { createEnhancedAuthContext } from '../../../../shared/auth/auth-context';
import { createSuccessResponse, handleLambdaError, logStructured } from '../../../../shared/utils/lambda-utils';
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
 * Lambda handler for GET /v1/clubs/{id}/members
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logStructured('INFO', 'Processing list club members request', {
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

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    
    // Parse limit
    let limit: number = MEMBERSHIP_CONSTRAINTS.DEFAULT_LIST_LIMIT;
    if (queryParams.limit) {
      const parsedLimit = parseInt(queryParams.limit, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        throw new ValidationError('Limit must be a positive integer');
      }
      if (parsedLimit > MEMBERSHIP_CONSTRAINTS.MAX_LIST_LIMIT) {
        throw new ValidationError(`Limit cannot exceed ${MEMBERSHIP_CONSTRAINTS.MAX_LIST_LIMIT}`);
      }
      limit = parsedLimit;
    }
    
    // Parse role filter
    let role: ClubRole | undefined;
    if (queryParams.role) {
      if (!Object.values(ClubRole).includes(queryParams.role as ClubRole)) {
        throw new ValidationError('Invalid role parameter');
      }
      role = queryParams.role as ClubRole;
    }
    
    // Parse status filter
    let status: MembershipStatus | undefined;
    if (queryParams.status) {
      if (!Object.values(MembershipStatus).includes(queryParams.status as MembershipStatus)) {
        throw new ValidationError('Invalid status parameter');
      }
      status = queryParams.status as MembershipStatus;
    }
    
    // Parse cursor
    const cursor = queryParams.cursor || undefined;

    // Create enhanced authentication context
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);

    logStructured('INFO', 'Authentication context created', {
      requestId,
      userId: authContext.userId,
      clubId,
      isAuthenticated: authContext.isAuthenticated,
    });

    // Check authorization - requires view_club_members capability
    await authService.requireClubCapability(authContext, clubId, ClubCapability.VIEW_CLUB_MEMBERS);

    logStructured('INFO', 'Authorization successful', {
      requestId,
      userId: authContext.userId,
      clubId,
      capability: ClubCapability.VIEW_CLUB_MEMBERS,
    });

    // List club members
    const result = await membershipService.listClubMembers(clubId, {
      limit,
      role,
      status,
      cursor,
    }, authContext);

    logStructured('INFO', 'Club members listed successfully', {
      requestId,
      userId: authContext.userId,
      clubId,
      resultCount: result.members.length,
      hasNextCursor: !!result.nextCursor,
    });

    // Format response
    const response = {
      success: true,
      data: result.members,
      pagination: {
        limit,
        nextCursor: result.nextCursor,
      },
      timestamp: new Date().toISOString(),
    };

    return createSuccessResponse(response);
  } catch (error) {
    logStructured('ERROR', 'Error processing list club members request', {
      requestId,
      clubId: event.pathParameters?.clubId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return handleLambdaError(error, requestId);
  }
}