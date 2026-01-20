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
        // Return clubs array directly (createSuccessResponse will wrap it)
        return (0, lambda_utils_1.createSuccessResponse)(hydratedClubs, undefined, origin);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing get user clubs request', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId, origin);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LXVzZXItY2x1YnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnZXQtdXNlci1jbHVicy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUdILG9FQUF1RTtBQUN2RSx1RUFBaUY7QUFDakYsd0VBQWdIO0FBQ2hILDREQUFrRTtBQUNsRSw0R0FBdUc7QUFDdkcsNEZBQXVGO0FBQ3ZGLHdHQUFtRztBQUNuRyxtRkFBK0U7QUFDL0Usa0dBQThGO0FBRTlGLHdCQUF3QjtBQUN4QixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVcsQ0FBQztBQUUzQyx1Q0FBdUM7QUFDdkMsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RCxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSw2REFBNEIsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDMUYsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLHNDQUFpQixDQUFDLG9CQUFvQixFQUFFLGNBQWMsRUFBRSw0Q0FBb0IsQ0FBQyxDQUFDO0FBaUI1Rzs7Ozs7R0FLRztBQUNJLEtBQUssVUFBVSxPQUFPLENBQUMsS0FBMkI7SUFDdkQsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUM7SUFDakQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7SUFFNUQsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSw4Q0FBOEMsRUFBRTtRQUNwRSxTQUFTO1FBQ1QsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO1FBQzVCLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtRQUNoQixNQUFNO0tBQ1AsQ0FBQyxDQUFDO0lBRUgs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LENBQUMsZUFBZTtpQkFDaEUsQ0FBQyxDQUFDO2FBQ0o7U0FDRjtRQUVELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsOENBQThDLEVBQUU7WUFDcEUsU0FBUztZQUNULE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTTtZQUMxQixnQkFBZ0IsRUFBRSxXQUFXLENBQUMsTUFBTTtZQUNwQyxhQUFhLEVBQUUsYUFBYSxDQUFDLE1BQU07WUFDbkMsTUFBTTtTQUNQLENBQUMsQ0FBQztRQUVILG1FQUFtRTtRQUNuRSxPQUFPLElBQUEsb0NBQXFCLEVBQUMsYUFBYSxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztLQUNoRTtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsSUFBQSw0QkFBYSxFQUFDLE9BQU8sRUFBRSx5Q0FBeUMsRUFBRTtZQUNoRSxTQUFTO1lBQ1QsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLGdDQUFpQixFQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDcEQ7QUFDSCxDQUFDO0FBekdELDBCQXlHQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogR2V0IFVzZXIgQ2x1YnMgSGFuZGxlciAtIFBoYXNlIDMuMVxuICogXG4gKiBMYW1iZGEgaGFuZGxlciBmb3IgR0VUIC92MS91c2Vycy9tZS9jbHVicyBlbmRwb2ludC5cbiAqIFJldHVybnMgaHlkcmF0ZWQgY2x1YiBtZW1iZXJzaGlwIGRhdGEgdG8gZWxpbWluYXRlIFwiVW5rbm93biBDbHViXCIgaXNzdWVzLlxuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBQaGFzZSAzLjEgU3BlYzogLmtpcm8vc3BlY3MvcGhhc2UtMy4xLmNsdWItbmF2aWdhdGlvbi1mb3VuZGF0aW9ucy52MS5tZFxuICovXG5cbmltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IE1lbWJlcnNoaXBTdGF0dXMgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvbWVtYmVyc2hpcCc7XG5pbXBvcnQgeyBjcmVhdGVFbmhhbmNlZEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGgvYXV0aC1jb250ZXh0JztcbmltcG9ydCB7IGNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSwgaGFuZGxlTGFtYmRhRXJyb3IsIGxvZ1N0cnVjdHVyZWQgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9lcnJvcnMnO1xuaW1wb3J0IHsgRHluYW1vREJVc2VyUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uLy4uL3VzZXItcHJvZmlsZS9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi11c2VyLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJDbHViUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLWNsdWItcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBEeW5hbW9EQk1lbWJlcnNoaXBSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItbWVtYmVyc2hpcC1yZXBvc2l0b3J5JztcbmltcG9ydCB7IE1lbWJlcnNoaXBTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL21lbWJlcnNoaXAvbWVtYmVyc2hpcC1zZXJ2aWNlJztcbmltcG9ydCB7IGF1dGhvcml6YXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGhvcml6YXRpb24vYXV0aG9yaXphdGlvbi1zZXJ2aWNlJztcblxuLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXG5jb25zdCBUQUJMRV9OQU1FID0gcHJvY2Vzcy5lbnYuVEFCTEVfTkFNRSE7XG5cbi8vIEluaXRpYWxpemUgcmVwb3NpdG9yaWVzIGFuZCBzZXJ2aWNlc1xuY29uc3QgdXNlclJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJVc2VyUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IGNsdWJSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkoVEFCTEVfTkFNRSk7XG5jb25zdCBtZW1iZXJzaGlwUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQk1lbWJlcnNoaXBSZXBvc2l0b3J5KFRBQkxFX05BTUUsIHVzZXJSZXBvc2l0b3J5KTtcbmNvbnN0IG1lbWJlcnNoaXBTZXJ2aWNlID0gbmV3IE1lbWJlcnNoaXBTZXJ2aWNlKG1lbWJlcnNoaXBSZXBvc2l0b3J5LCBjbHViUmVwb3NpdG9yeSwgYXV0aG9yaXphdGlvblNlcnZpY2UpO1xuXG4vKipcbiAqIEh5ZHJhdGVkIGNsdWIgbWVtYmVyc2hpcCBkYXRhIChQaGFzZSAzLjEgc3BlYylcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBNeUNsdWJNZW1iZXJzaGlwIHtcbiAgY2x1YklkOiBzdHJpbmc7XG4gIGNsdWJOYW1lOiBzdHJpbmc7XG4gIGNsdWJTbHVnOiBzdHJpbmc7XG4gIGNsdWJMb2NhdGlvbj86IHN0cmluZztcbiAgY2x1YkF2YXRhclVybD86IHN0cmluZztcbiAgbWVtYmVyQ291bnQ/OiBudW1iZXI7XG4gIG1lbWJlcnNoaXBSb2xlOiAnbWVtYmVyJyB8ICdhZG1pbicgfCAnb3duZXInO1xuICBtZW1iZXJzaGlwU3RhdHVzOiAnYWN0aXZlJyB8ICdwZW5kaW5nJyB8ICdzdXNwZW5kZWQnO1xuICBqb2luZWRBdDogc3RyaW5nO1xufVxuXG4vKipcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBHRVQgL3YxL3VzZXJzL21lL2NsdWJzXG4gKiBcbiAqIEBwYXJhbSBldmVudCAtIEFQSSBHYXRld2F5IHByb3h5IGV2ZW50XG4gKiBAcmV0dXJucyBBUEkgR2F0ZXdheSBwcm94eSByZXN1bHQgd2l0aCBoeWRyYXRlZCBjbHViIGRhdGFcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+IHtcbiAgY29uc3QgcmVxdWVzdElkID0gZXZlbnQucmVxdWVzdENvbnRleHQucmVxdWVzdElkO1xuICBjb25zdCBvcmlnaW4gPSBldmVudC5oZWFkZXJzLm9yaWdpbiB8fCBldmVudC5oZWFkZXJzLk9yaWdpbjtcbiAgXG4gIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnUHJvY2Vzc2luZyBnZXQgdXNlciBjbHVicyByZXF1ZXN0IChoeWRyYXRlZCknLCB7XG4gICAgcmVxdWVzdElkLFxuICAgIGh0dHBNZXRob2Q6IGV2ZW50Lmh0dHBNZXRob2QsXG4gICAgcGF0aDogZXZlbnQucGF0aCxcbiAgICBvcmlnaW4sXG4gIH0pO1xuICBcbiAgdHJ5IHtcbiAgICAvLyBQYXJzZSBxdWVyeSBwYXJhbWV0ZXJzXG4gICAgY29uc3QgcXVlcnlQYXJhbXMgPSBldmVudC5xdWVyeVN0cmluZ1BhcmFtZXRlcnMgfHwge307XG4gICAgXG4gICAgLy8gUGFyc2Ugc3RhdHVzIGZpbHRlciAob3B0aW9uYWwpXG4gICAgbGV0IHN0YXR1czogTWVtYmVyc2hpcFN0YXR1cyB8IHVuZGVmaW5lZDtcbiAgICBpZiAocXVlcnlQYXJhbXMuc3RhdHVzKSB7XG4gICAgICBpZiAoIU9iamVjdC52YWx1ZXMoTWVtYmVyc2hpcFN0YXR1cykuaW5jbHVkZXMocXVlcnlQYXJhbXMuc3RhdHVzIGFzIE1lbWJlcnNoaXBTdGF0dXMpKSB7XG4gICAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0ludmFsaWQgc3RhdHVzIHBhcmFtZXRlcicpO1xuICAgICAgfVxuICAgICAgc3RhdHVzID0gcXVlcnlQYXJhbXMuc3RhdHVzIGFzIE1lbWJlcnNoaXBTdGF0dXM7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGVuaGFuY2VkIGF1dGhlbnRpY2F0aW9uIGNvbnRleHRcbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IGF3YWl0IGNyZWF0ZUVuaGFuY2VkQXV0aENvbnRleHQoZXZlbnQucmVxdWVzdENvbnRleHQsIHVzZXJSZXBvc2l0b3J5KTtcblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnQXV0aGVudGljYXRpb24gY29udGV4dCBjcmVhdGVkJywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBpc0F1dGhlbnRpY2F0ZWQ6IGF1dGhDb250ZXh0LmlzQXV0aGVudGljYXRlZCxcbiAgICAgIHN0YXR1cyxcbiAgICB9KTtcblxuICAgIC8vIFZhbGlkYXRlIHVzZXIgaXMgYXV0aGVudGljYXRlZFxuICAgIGlmICghYXV0aENvbnRleHQuaXNBdXRoZW50aWNhdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdBdXRoZW50aWNhdGlvbiByZXF1aXJlZCcpO1xuICAgIH1cblxuICAgIC8vIEdldCB1c2VyJ3MgbWVtYmVyc2hpcHMgKGV4aXN0aW5nIG1ldGhvZClcbiAgICBjb25zdCBtZW1iZXJzaGlwcyA9IGF3YWl0IG1lbWJlcnNoaXBTZXJ2aWNlLmdldFVzZXJNZW1iZXJzaGlwcyhhdXRoQ29udGV4dCwgc3RhdHVzKTtcblxuICAgIC8vIEh5ZHJhdGUgd2l0aCBhZGRpdGlvbmFsIGNsdWIgZGF0YVxuICAgIGNvbnN0IGh5ZHJhdGVkQ2x1YnM6IE15Q2x1Yk1lbWJlcnNoaXBbXSA9IFtdO1xuICAgIFxuICAgIGZvciAoY29uc3QgbWVtYmVyc2hpcCBvZiBtZW1iZXJzaGlwcykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gR2V0IGZ1bGwgY2x1YiBkZXRhaWxzXG4gICAgICAgIGNvbnN0IGNsdWIgPSBhd2FpdCBjbHViUmVwb3NpdG9yeS5nZXRDbHViQnlJZChtZW1iZXJzaGlwLmNsdWJJZCk7XG4gICAgICAgIFxuICAgICAgICBpZiAoY2x1Yikge1xuICAgICAgICAgIC8vIEdldCBtZW1iZXIgY291bnQgKGFwcHJveGltYXRlKVxuICAgICAgICAgIGNvbnN0IG1lbWJlckNvdW50ID0gYXdhaXQgbWVtYmVyc2hpcFJlcG9zaXRvcnkuZ2V0Q2x1Yk1lbWJlckNvdW50KG1lbWJlcnNoaXAuY2x1YklkKTtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zdCBoeWRyYXRlZENsdWI6IE15Q2x1Yk1lbWJlcnNoaXAgPSB7XG4gICAgICAgICAgICBjbHViSWQ6IG1lbWJlcnNoaXAuY2x1YklkLFxuICAgICAgICAgICAgY2x1Yk5hbWU6IGNsdWIubmFtZSxcbiAgICAgICAgICAgIGNsdWJTbHVnOiBtZW1iZXJzaGlwLmNsdWJJZCwgLy8gVXNlIGNsdWIgSUQgYXMgc2x1ZyBmb3IgUGhhc2UgMy4xXG4gICAgICAgICAgICBjbHViTG9jYXRpb246IGNsdWIuY2l0eSxcbiAgICAgICAgICAgIGNsdWJBdmF0YXJVcmw6IGNsdWIubG9nb1VybCxcbiAgICAgICAgICAgIG1lbWJlckNvdW50LFxuICAgICAgICAgICAgbWVtYmVyc2hpcFJvbGU6IG1lbWJlcnNoaXAucm9sZSBhcyAnbWVtYmVyJyB8ICdhZG1pbicgfCAnb3duZXInLFxuICAgICAgICAgICAgbWVtYmVyc2hpcFN0YXR1czogbWVtYmVyc2hpcC5zdGF0dXMgYXMgJ2FjdGl2ZScgfCAncGVuZGluZycgfCAnc3VzcGVuZGVkJyxcbiAgICAgICAgICAgIGpvaW5lZEF0OiBtZW1iZXJzaGlwLmpvaW5lZEF0LFxuICAgICAgICAgIH07XG4gICAgICAgICAgXG4gICAgICAgICAgaHlkcmF0ZWRDbHVicy5wdXNoKGh5ZHJhdGVkQ2x1Yik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gTG9nIG1pc3NpbmcgY2x1YiBidXQgZG9uJ3QgZmFpbCB0aGUgZW50aXJlIHJlcXVlc3RcbiAgICAgICAgICBsb2dTdHJ1Y3R1cmVkKCdXQVJOJywgJ0NsdWIgbm90IGZvdW5kIGZvciBtZW1iZXJzaGlwJywge1xuICAgICAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICAgICAgICBjbHViSWQ6IG1lbWJlcnNoaXAuY2x1YklkLFxuICAgICAgICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgLy8gTG9nIGVycm9yIGJ1dCBjb250aW51ZSB3aXRoIG90aGVyIGNsdWJzXG4gICAgICAgIGxvZ1N0cnVjdHVyZWQoJ0VSUk9SJywgJ0Vycm9yIGh5ZHJhdGluZyBjbHViIGRhdGEnLCB7XG4gICAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgICAgIGNsdWJJZDogbWVtYmVyc2hpcC5jbHViSWQsXG4gICAgICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1VzZXIgY2x1YnMgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseSAoaHlkcmF0ZWQpJywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICB0b3RhbE1lbWJlcnNoaXBzOiBtZW1iZXJzaGlwcy5sZW5ndGgsXG4gICAgICBoeWRyYXRlZENsdWJzOiBoeWRyYXRlZENsdWJzLmxlbmd0aCxcbiAgICAgIHN0YXR1cyxcbiAgICB9KTtcblxuICAgIC8vIFJldHVybiBjbHVicyBhcnJheSBkaXJlY3RseSAoY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlIHdpbGwgd3JhcCBpdClcbiAgICByZXR1cm4gY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKGh5ZHJhdGVkQ2x1YnMsIHVuZGVmaW5lZCwgb3JpZ2luKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdFcnJvciBwcm9jZXNzaW5nIGdldCB1c2VyIGNsdWJzIHJlcXVlc3QnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gaGFuZGxlTGFtYmRhRXJyb3IoZXJyb3IsIHJlcXVlc3RJZCwgb3JpZ2luKTtcbiAgfVxufSJdfQ==