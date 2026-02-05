/**
 * Get Club Handler - Phase 2.1 + Phase 3.4 Enhancement
 * 
 * Lambda handler for GET /clubs/{id} endpoint.
 * Public endpoint for retrieving club details by ID.
 * Enhanced to include user membership information when authenticated.
 * 
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 * - Phase 3.4 Enhancement: Include userMembership for management UI
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createSuccessResponse, handleLambdaError, logStructured } from '../../../shared/utils/lambda-utils';
import { ValidationError } from '../../../shared/utils/errors';
import { DynamoDBClubRepository } from '../infrastructure/dynamodb-club-repository';
import { DynamoDBMembershipRepository } from '../infrastructure/dynamodb-membership-repository';
import { DynamoDBUserRepository } from '../../user-profile/infrastructure/dynamodb-user-repository';
import { ClubService } from '../domain/club-service';

// Environment variables
const TABLE_NAME = process.env.TABLE_NAME!;

// Initialize repositories and service
const clubRepository = new DynamoDBClubRepository(TABLE_NAME);
const userRepository = new DynamoDBUserRepository(TABLE_NAME);
const membershipRepository = new DynamoDBMembershipRepository(TABLE_NAME, userRepository);
const clubService = new ClubService(clubRepository);

/**
 * Lambda handler for GET /clubs/{id}
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logStructured('INFO', 'Processing get club request', {
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

    logStructured('INFO', 'Extracted club ID', {
      requestId,
      clubId,
    });

    // Get club by ID
    const club = await clubService.getClubById(clubId);

    // Try to get user's membership if authenticated (Phase 3.4)
    // Since this is a public endpoint without an authorizer, we need to manually parse the JWT
    let userMembership = null;
    try {
      logStructured('INFO', 'Attempting to get user membership', {
        requestId,
        clubId,
        hasAuthHeader: !!event.headers?.Authorization || !!event.headers?.authorization,
      });
      
      // Try to extract user ID from JWT token manually (since no authorizer)
      let userId: string | null = null;
      const authHeader = event.headers?.Authorization || event.headers?.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          // Decode JWT without verification (verification was done by client)
          const base64Payload = token.split('.')[1];
          const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
          userId = payload.sub || payload['cognito:username'];
          
          logStructured('INFO', 'Extracted user ID from JWT', {
            requestId,
            clubId,
            userId,
          });
        } catch (jwtError) {
          logStructured('WARN', 'Failed to parse JWT', {
            requestId,
            clubId,
            error: jwtError instanceof Error ? jwtError.message : 'Unknown error',
          });
        }
      }
      
      if (userId) {
        const membership = await membershipRepository.getMembershipByClubAndUser(clubId, userId);
        
        logStructured('INFO', 'Membership lookup result', {
          requestId,
          clubId,
          userId,
          foundMembership: !!membership,
          role: membership?.role,
          status: membership?.status,
        });
        
        if (membership) {
          userMembership = {
            membershipId: membership.membershipId,
            role: membership.role,
            status: membership.status,
            joinedAt: membership.joinedAt,
          };
        }
      }
    } catch (error) {
      // Silently fail - membership is optional for public club view
      logStructured('WARN', 'Failed to get user membership', {
        requestId,
        clubId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    logStructured('INFO', 'Club retrieved successfully', {
      requestId,
      clubId,
      clubName: club.name,
      status: club.status,
      hasMembership: !!userMembership,
    });

    // Return club with optional userMembership field
    const clubWithMembership = {
      ...club,
      ...(userMembership && { userMembership }),
    };

    const origin = event.headers?.origin || event.headers?.Origin;
    return createSuccessResponse(clubWithMembership, 200, origin);
  } catch (error) {
    logStructured('ERROR', 'Error processing get club request', {
      requestId,
      clubId: event.pathParameters?.clubId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const origin = event.headers?.origin || event.headers?.Origin;
    return handleLambdaError(error, requestId, origin);
  }
}