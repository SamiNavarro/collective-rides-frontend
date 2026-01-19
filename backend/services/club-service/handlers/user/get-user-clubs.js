"use strict";
/**
 * Get User Clubs Handler - Phase 3.1
 *
 * Lambda handler for GET /v1/users/me/clubs endpoint.
 * Returns hydrated club membership data to eliminate "Unknown Club" issues.
 *
 * Compliance:
 * - Phase 3.1 Spec: .kiro/specs/phase-3.1.club-navigation-foundations.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const membership_1 = require("../../../../shared/types/membership");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const errors_1 = require("../../../../shared/utils/errors");
const dynamodb_user_repository_1 = require("../../../user-profile/infrastructure/dynamodb-user-repository");
const dynamodb_club_repository_1 = require("../../infrastructure/dynamodb-club-repository");
const dynamodb_membership_repository_1 = require("../../infrastructure/dynamodb-membership-repository");
const membership_service_1 = require("../../domain/membership/membership-service");
const authorization_service_1 = require("../../../../shared/authorization/authorization-service");
// Environment variables
const TABLE_NAME = process.env.TABLE_NAME;
// Initialize repositories and services
const userRepository = new dynamodb_user_repository_1.DynamoDBUserRepository(TABLE_NAME);
const clubRepository = new dynamodb_club_repository_1.DynamoDBClubRepository(TABLE_NAME);
const membershipRepository = new dynamodb_membership_repository_1.DynamoDBMembershipRepository(TABLE_NAME, userRepository);
const membershipService = new membership_service_1.MembershipService(membershipRepository, clubRepository, authorization_service_1.authorizationService);
/**
 * Lambda handler for GET /v1/users/me/clubs
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result with hydrated club data
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    const origin = event.headers.origin || event.headers.Origin;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing get user clubs request (hydrated)', {
        requestId,
        httpMethod: event.httpMethod,
        path: event.path,
        origin,
    });
    try {
        // Parse query parameters
        const queryParams = event.queryStringParameters || {};
        // Parse status filter (optional)
        let status;
        if (queryParams.status) {
            if (!Object.values(membership_1.MembershipStatus).includes(queryParams.status)) {
                throw new errors_1.ValidationError('Invalid status parameter');
            }
            status = queryParams.status;
        }
        // Create enhanced authentication context
        const authContext = await (0, auth_context_1.createEnhancedAuthContext)(event.requestContext, userRepository);
        (0, lambda_utils_1.logStructured)('INFO', 'Authentication context created', {
            requestId,
            userId: authContext.userId,
            isAuthenticated: authContext.isAuthenticated,
            status,
        });
        // Validate user is authenticated
        if (!authContext.isAuthenticated) {
            throw new errors_1.ValidationError('Authentication required');
        }
        // Get user's memberships (existing method)
        const memberships = await membershipService.getUserMemberships(authContext, status);
        // Hydrate with additional club data
        const hydratedClubs = [];
        for (const membership of memberships) {
            try {
                // Get full club details
                const club = await clubRepository.getClubById(membership.clubId);
                if (club) {
                    // Get member count (approximate)
                    const memberCount = await membershipRepository.getClubMemberCount(membership.clubId);
                    const hydratedClub = {
                        clubId: membership.clubId,
                        clubName: club.name,
                        clubSlug: membership.clubId,
                        clubLocation: club.city,
                        clubAvatarUrl: club.logoUrl,
                        memberCount,
                        membershipRole: membership.role,
                        membershipStatus: membership.status,
                        joinedAt: membership.joinedAt,
                    };
                    hydratedClubs.push(hydratedClub);
                }
                else {
                    // Log missing club but don't fail the entire request
                    (0, lambda_utils_1.logStructured)('WARN', 'Club not found for membership', {
                        requestId,
                        userId: authContext.userId,
                        clubId: membership.clubId,
                        membershipId: membership.membershipId,
                    });
                }
            }
            catch (error) {
                // Log error but continue with other clubs
                (0, lambda_utils_1.logStructured)('ERROR', 'Error hydrating club data', {
                    requestId,
                    userId: authContext.userId,
                    clubId: membership.clubId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        (0, lambda_utils_1.logStructured)('INFO', 'User clubs retrieved successfully (hydrated)', {
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
        return (0, lambda_utils_1.createSuccessResponse)(response, undefined, origin);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing get user clubs request', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LXVzZXItY2x1YnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnZXQtdXNlci1jbHVicy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUdILG9FQUF1RTtBQUN2RSx1RUFBaUY7QUFDakYsd0VBQWdIO0FBQ2hILDREQUFrRTtBQUNsRSw0R0FBdUc7QUFDdkcsNEZBQXVGO0FBQ3ZGLHdHQUFtRztBQUNuRyxtRkFBK0U7QUFDL0Usa0dBQThGO0FBRTlGLHdCQUF3QjtBQUN4QixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVcsQ0FBQztBQUUzQyx1Q0FBdUM7QUFDdkMsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RCxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSw2REFBNEIsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDMUYsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLHNDQUFpQixDQUFDLG9CQUFvQixFQUFFLGNBQWMsRUFBRSw0Q0FBb0IsQ0FBQyxDQUFDO0FBaUI1Rzs7Ozs7R0FLRztBQUNJLEtBQUssVUFBVSxPQUFPLENBQUMsS0FBMkI7SUFDdkQsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUM7SUFDakQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7SUFFNUQsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSw4Q0FBOEMsRUFBRTtRQUNwRSxTQUFTO1FBQ1QsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO1FBQzVCLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtRQUNoQixNQUFNO0tBQ1AsQ0FBQyxDQUFDO0lBRUgs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LENBQUMsZUFBZTtpQkFDaEUsQ0FBQyxDQUFDO2FBQ0o7U0FDRjtRQUVELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsOENBQThDLEVBQUU7WUFDcEUsU0FBUztZQUNULE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTTtZQUMxQixnQkFBZ0IsRUFBRSxXQUFXLENBQUMsTUFBTTtZQUNwQyxhQUFhLEVBQUUsYUFBYSxDQUFDLE1BQU07WUFDbkMsTUFBTTtTQUNQLENBQUMsQ0FBQztRQUVILGtCQUFrQjtRQUNsQixNQUFNLFFBQVEsR0FBRztZQUNmLE9BQU8sRUFBRSxJQUFJO1lBQ2IsSUFBSSxFQUFFLGFBQWE7WUFDbkIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3BDLENBQUM7UUFFRixPQUFPLElBQUEsb0NBQXFCLEVBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztLQUMzRDtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsSUFBQSw0QkFBYSxFQUFDLE9BQU8sRUFBRSx5Q0FBeUMsRUFBRTtZQUNoRSxTQUFTO1lBQ1QsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLGdDQUFpQixFQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztLQUM1QztBQUNILENBQUM7QUEvR0QsMEJBK0dDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBHZXQgVXNlciBDbHVicyBIYW5kbGVyIC0gUGhhc2UgMy4xXG4gKiBcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBHRVQgL3YxL3VzZXJzL21lL2NsdWJzIGVuZHBvaW50LlxuICogUmV0dXJucyBoeWRyYXRlZCBjbHViIG1lbWJlcnNoaXAgZGF0YSB0byBlbGltaW5hdGUgXCJVbmtub3duIENsdWJcIiBpc3N1ZXMuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDMuMSBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0zLjEuY2x1Yi1uYXZpZ2F0aW9uLWZvdW5kYXRpb25zLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgTWVtYmVyc2hpcFN0YXR1cyB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9tZW1iZXJzaGlwJztcbmltcG9ydCB7IGNyZWF0ZUVuaGFuY2VkQXV0aENvbnRleHQgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvYXV0aC9hdXRoLWNvbnRleHQnO1xuaW1wb3J0IHsgY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlLCBoYW5kbGVMYW1iZGFFcnJvciwgbG9nU3RydWN0dXJlZCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9sYW1iZGEtdXRpbHMnO1xuaW1wb3J0IHsgVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2Vycm9ycyc7XG5pbXBvcnQgeyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vLi4vdXNlci1wcm9maWxlL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLXVzZXItcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBEeW5hbW9EQkNsdWJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItY2x1Yi1yZXBvc2l0b3J5JztcbmltcG9ydCB7IER5bmFtb0RCTWVtYmVyc2hpcFJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1tZW1iZXJzaGlwLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgTWVtYmVyc2hpcFNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vbWVtYmVyc2hpcC9tZW1iZXJzaGlwLXNlcnZpY2UnO1xuaW1wb3J0IHsgYXV0aG9yaXphdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvYXV0aG9yaXphdGlvbi9hdXRob3JpemF0aW9uLXNlcnZpY2UnO1xuXG4vLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcbmNvbnN0IFRBQkxFX05BTUUgPSBwcm9jZXNzLmVudi5UQUJMRV9OQU1FITtcblxuLy8gSW5pdGlhbGl6ZSByZXBvc2l0b3JpZXMgYW5kIHNlcnZpY2VzXG5jb25zdCB1c2VyUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5KFRBQkxFX05BTUUpO1xuY29uc3QgY2x1YlJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJDbHViUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IG1lbWJlcnNoaXBSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCTWVtYmVyc2hpcFJlcG9zaXRvcnkoVEFCTEVfTkFNRSwgdXNlclJlcG9zaXRvcnkpO1xuY29uc3QgbWVtYmVyc2hpcFNlcnZpY2UgPSBuZXcgTWVtYmVyc2hpcFNlcnZpY2UobWVtYmVyc2hpcFJlcG9zaXRvcnksIGNsdWJSZXBvc2l0b3J5LCBhdXRob3JpemF0aW9uU2VydmljZSk7XG5cbi8qKlxuICogSHlkcmF0ZWQgY2x1YiBtZW1iZXJzaGlwIGRhdGEgKFBoYXNlIDMuMSBzcGVjKVxuICovXG5leHBvcnQgaW50ZXJmYWNlIE15Q2x1Yk1lbWJlcnNoaXAge1xuICBjbHViSWQ6IHN0cmluZztcbiAgY2x1Yk5hbWU6IHN0cmluZztcbiAgY2x1YlNsdWc6IHN0cmluZztcbiAgY2x1YkxvY2F0aW9uPzogc3RyaW5nO1xuICBjbHViQXZhdGFyVXJsPzogc3RyaW5nO1xuICBtZW1iZXJDb3VudD86IG51bWJlcjtcbiAgbWVtYmVyc2hpcFJvbGU6ICdtZW1iZXInIHwgJ2FkbWluJyB8ICdvd25lcic7XG4gIG1lbWJlcnNoaXBTdGF0dXM6ICdhY3RpdmUnIHwgJ3BlbmRpbmcnIHwgJ3N1c3BlbmRlZCc7XG4gIGpvaW5lZEF0OiBzdHJpbmc7XG59XG5cbi8qKlxuICogTGFtYmRhIGhhbmRsZXIgZm9yIEdFVCAvdjEvdXNlcnMvbWUvY2x1YnNcbiAqIFxuICogQHBhcmFtIGV2ZW50IC0gQVBJIEdhdGV3YXkgcHJveHkgZXZlbnRcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdCB3aXRoIGh5ZHJhdGVkIGNsdWIgZGF0YVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xuICBjb25zdCByZXF1ZXN0SWQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5yZXF1ZXN0SWQ7XG4gIGNvbnN0IG9yaWdpbiA9IGV2ZW50LmhlYWRlcnMub3JpZ2luIHx8IGV2ZW50LmhlYWRlcnMuT3JpZ2luO1xuICBcbiAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdQcm9jZXNzaW5nIGdldCB1c2VyIGNsdWJzIHJlcXVlc3QgKGh5ZHJhdGVkKScsIHtcbiAgICByZXF1ZXN0SWQsXG4gICAgaHR0cE1ldGhvZDogZXZlbnQuaHR0cE1ldGhvZCxcbiAgICBwYXRoOiBldmVudC5wYXRoLFxuICAgIG9yaWdpbixcbiAgfSk7XG4gIFxuICB0cnkge1xuICAgIC8vIFBhcnNlIHF1ZXJ5IHBhcmFtZXRlcnNcbiAgICBjb25zdCBxdWVyeVBhcmFtcyA9IGV2ZW50LnF1ZXJ5U3RyaW5nUGFyYW1ldGVycyB8fCB7fTtcbiAgICBcbiAgICAvLyBQYXJzZSBzdGF0dXMgZmlsdGVyIChvcHRpb25hbClcbiAgICBsZXQgc3RhdHVzOiBNZW1iZXJzaGlwU3RhdHVzIHwgdW5kZWZpbmVkO1xuICAgIGlmIChxdWVyeVBhcmFtcy5zdGF0dXMpIHtcbiAgICAgIGlmICghT2JqZWN0LnZhbHVlcyhNZW1iZXJzaGlwU3RhdHVzKS5pbmNsdWRlcyhxdWVyeVBhcmFtcy5zdGF0dXMgYXMgTWVtYmVyc2hpcFN0YXR1cykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignSW52YWxpZCBzdGF0dXMgcGFyYW1ldGVyJyk7XG4gICAgICB9XG4gICAgICBzdGF0dXMgPSBxdWVyeVBhcmFtcy5zdGF0dXMgYXMgTWVtYmVyc2hpcFN0YXR1cztcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgZW5oYW5jZWQgYXV0aGVudGljYXRpb24gY29udGV4dFxuICAgIGNvbnN0IGF1dGhDb250ZXh0ID0gYXdhaXQgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dChldmVudC5yZXF1ZXN0Q29udGV4dCwgdXNlclJlcG9zaXRvcnkpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdBdXRoZW50aWNhdGlvbiBjb250ZXh0IGNyZWF0ZWQnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGlzQXV0aGVudGljYXRlZDogYXV0aENvbnRleHQuaXNBdXRoZW50aWNhdGVkLFxuICAgICAgc3RhdHVzLFxuICAgIH0pO1xuXG4gICAgLy8gVmFsaWRhdGUgdXNlciBpcyBhdXRoZW50aWNhdGVkXG4gICAgaWYgKCFhdXRoQ29udGV4dC5pc0F1dGhlbnRpY2F0ZWQpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0F1dGhlbnRpY2F0aW9uIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgLy8gR2V0IHVzZXIncyBtZW1iZXJzaGlwcyAoZXhpc3RpbmcgbWV0aG9kKVxuICAgIGNvbnN0IG1lbWJlcnNoaXBzID0gYXdhaXQgbWVtYmVyc2hpcFNlcnZpY2UuZ2V0VXNlck1lbWJlcnNoaXBzKGF1dGhDb250ZXh0LCBzdGF0dXMpO1xuXG4gICAgLy8gSHlkcmF0ZSB3aXRoIGFkZGl0aW9uYWwgY2x1YiBkYXRhXG4gICAgY29uc3QgaHlkcmF0ZWRDbHViczogTXlDbHViTWVtYmVyc2hpcFtdID0gW107XG4gICAgXG4gICAgZm9yIChjb25zdCBtZW1iZXJzaGlwIG9mIG1lbWJlcnNoaXBzKSB7XG4gICAgICB0cnkge1xuICAgICAgICAvLyBHZXQgZnVsbCBjbHViIGRldGFpbHNcbiAgICAgICAgY29uc3QgY2x1YiA9IGF3YWl0IGNsdWJSZXBvc2l0b3J5LmdldENsdWJCeUlkKG1lbWJlcnNoaXAuY2x1YklkKTtcbiAgICAgICAgXG4gICAgICAgIGlmIChjbHViKSB7XG4gICAgICAgICAgLy8gR2V0IG1lbWJlciBjb3VudCAoYXBwcm94aW1hdGUpXG4gICAgICAgICAgY29uc3QgbWVtYmVyQ291bnQgPSBhd2FpdCBtZW1iZXJzaGlwUmVwb3NpdG9yeS5nZXRDbHViTWVtYmVyQ291bnQobWVtYmVyc2hpcC5jbHViSWQpO1xuICAgICAgICAgIFxuICAgICAgICAgIGNvbnN0IGh5ZHJhdGVkQ2x1YjogTXlDbHViTWVtYmVyc2hpcCA9IHtcbiAgICAgICAgICAgIGNsdWJJZDogbWVtYmVyc2hpcC5jbHViSWQsXG4gICAgICAgICAgICBjbHViTmFtZTogY2x1Yi5uYW1lLFxuICAgICAgICAgICAgY2x1YlNsdWc6IG1lbWJlcnNoaXAuY2x1YklkLCAvLyBVc2UgY2x1YiBJRCBhcyBzbHVnIGZvciBQaGFzZSAzLjFcbiAgICAgICAgICAgIGNsdWJMb2NhdGlvbjogY2x1Yi5jaXR5LFxuICAgICAgICAgICAgY2x1YkF2YXRhclVybDogY2x1Yi5sb2dvVXJsLFxuICAgICAgICAgICAgbWVtYmVyQ291bnQsXG4gICAgICAgICAgICBtZW1iZXJzaGlwUm9sZTogbWVtYmVyc2hpcC5yb2xlIGFzICdtZW1iZXInIHwgJ2FkbWluJyB8ICdvd25lcicsXG4gICAgICAgICAgICBtZW1iZXJzaGlwU3RhdHVzOiBtZW1iZXJzaGlwLnN0YXR1cyBhcyAnYWN0aXZlJyB8ICdwZW5kaW5nJyB8ICdzdXNwZW5kZWQnLFxuICAgICAgICAgICAgam9pbmVkQXQ6IG1lbWJlcnNoaXAuam9pbmVkQXQsXG4gICAgICAgICAgfTtcbiAgICAgICAgICBcbiAgICAgICAgICBoeWRyYXRlZENsdWJzLnB1c2goaHlkcmF0ZWRDbHViKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBMb2cgbWlzc2luZyBjbHViIGJ1dCBkb24ndCBmYWlsIHRoZSBlbnRpcmUgcmVxdWVzdFxuICAgICAgICAgIGxvZ1N0cnVjdHVyZWQoJ1dBUk4nLCAnQ2x1YiBub3QgZm91bmQgZm9yIG1lbWJlcnNoaXAnLCB7XG4gICAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgICAgICAgIGNsdWJJZDogbWVtYmVyc2hpcC5jbHViSWQsXG4gICAgICAgICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAvLyBMb2cgZXJyb3IgYnV0IGNvbnRpbnVlIHdpdGggb3RoZXIgY2x1YnNcbiAgICAgICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRXJyb3IgaHlkcmF0aW5nIGNsdWIgZGF0YScsIHtcbiAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICAgICAgY2x1YklkOiBtZW1iZXJzaGlwLmNsdWJJZCxcbiAgICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnVXNlciBjbHVicyByZXRyaWV2ZWQgc3VjY2Vzc2Z1bGx5IChoeWRyYXRlZCknLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIHRvdGFsTWVtYmVyc2hpcHM6IG1lbWJlcnNoaXBzLmxlbmd0aCxcbiAgICAgIGh5ZHJhdGVkQ2x1YnM6IGh5ZHJhdGVkQ2x1YnMubGVuZ3RoLFxuICAgICAgc3RhdHVzLFxuICAgIH0pO1xuXG4gICAgLy8gRm9ybWF0IHJlc3BvbnNlXG4gICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YTogaHlkcmF0ZWRDbHVicyxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICByZXR1cm4gY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlLCB1bmRlZmluZWQsIG9yaWdpbik7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRXJyb3IgcHJvY2Vzc2luZyBnZXQgdXNlciBjbHVicyByZXF1ZXN0Jywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGhhbmRsZUxhbWJkYUVycm9yKGVycm9yLCByZXF1ZXN0SWQpO1xuICB9XG59Il19