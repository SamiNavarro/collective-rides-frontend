/**
 * Get User Clubs Handler - Phase 3.1
 * 
 * Lambda handler for GET /v1/users/me/clubs endpoint.
 * Returns hydrated club membership data to eliminate "Unknown Club" issues.
 * 
 * Compliance:
 * - Phase 3.1 Spec: .kiro/specs/phase-3.1.club-navigation-foundations.v1.md
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
 * Hydrated club membership data (Phase 3.1 spec)
 */
export interface MyClubMembership {
  clubId: string;
  clubName: string;
  clubSlug: string;
  clubLocation?: string;
  clubAvatarUrl?: string;
  memberCount?: number;
  membershipRole: 'member' | 'admin' | 'owner';
  membershipStatus: 'active' | 'pending' | 'suspended';
  joinedAt: string;
}

/**
 * Lambda handler for GET /v1/users/me/clubs
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result with hydrated club data
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logStructured('INFO', 'Processing get user clubs request (hydrated)', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
  });
  
  try {
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    
    // Parse status filter (optional)
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

    // Get user's memberships (existing method)
    const memberships = await membershipService.getUserMemberships(authContext, status);

    // Hydrate with additional club data
    const hydratedClubs: MyClubMembership[] = [];
    
    for (const membership of memberships) {
      try {
        // Get full club details
        const club = await clubRepository.getClubById(membership.clubId);
        
        if (club) {
          // Get member count (approximate)
          const memberCount = await membershipRepository.getClubMemberCount(membership.clubId);
          
          const hydratedClub: MyClubMembership = {
            clubId: membership.clubId,
            clubName: club.name,
            clubSlug: membership.clubId, // Use club ID as slug for Phase 3.1
            clubLocation: club.city,
            clubAvatarUrl: club.logoUrl,
            memberCount,
            membershipRole: membership.role as 'member' | 'admin' | 'owner',
            membershipStatus: membership.status as 'active' | 'pending' | 'suspended',
            joinedAt: membership.joinedAt,
          };
          
          hydratedClubs.push(hydratedClub);
        } else {
          // Log missing club but don't fail the entire request
          logStructured('WARN', 'Club not found for membership', {
            requestId,
            userId: authContext.userId,
            clubId: membership.clubId,
            membershipId: membership.membershipId,
          });
        }
      } catch (error) {
        // Log error but continue with other clubs
        logStructured('ERROR', 'Error hydrating club data', {
          requestId,
          userId: authContext.userId,
          clubId: membership.clubId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logStructured('INFO', 'User clubs retrieved successfully (hydrated)', {
      requestId,
      userId: authContext.userId,
      totalMemberships: memberships.length,
      hydratedClubs: hydratedClubs.length,
      status,
    });

    // Format response
    const response = {
      success: true,
      data: hydratedClubs,
      timestamp: new Date().toISOString(),
    };

    return createSuccessResponse(response);
  } catch (error) {
    logStructured('ERROR', 'Error processing get user clubs request', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return handleLambdaError(error, requestId);
  }
}