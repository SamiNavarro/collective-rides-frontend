"use strict";
/**
 * Join Club Handler - Phase 2.2
 *
 * Lambda handler for POST /v1/clubs/{id}/members endpoint.
 * Allows authenticated users to join clubs.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const api_1 = require("../../../../shared/types/api");
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
 * Lambda handler for POST /v1/clubs/{id}/members
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    const origin = event.headers.origin || event.headers.Origin;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing join club request', {
        requestId,
        httpMethod: event.httpMethod,
        path: event.path,
        origin,
    });
    try {
        // Extract club ID from path parameters
        const clubId = event.pathParameters?.clubId;
        if (!clubId) {
            throw new errors_1.ValidationError('Club ID is required');
        }
        // Parse request body
        const joinInput = (0, lambda_utils_1.parseJsonBody)(event) || {};
        // Create enhanced authentication context
        const authContext = await (0, auth_context_1.createEnhancedAuthContext)(event.requestContext, userRepository);
        (0, lambda_utils_1.logStructured)('INFO', 'Authentication context created', {
            requestId,
            userId: authContext.userId,
            clubId,
            isAuthenticated: authContext.isAuthenticated,
        });
        // Validate user is authenticated
        if (!authContext.isAuthenticated) {
            throw new errors_1.ValidationError('Authentication required');
        }
        // Join club
        const membership = await membershipService.joinClub(clubId, joinInput, authContext);
        (0, lambda_utils_1.logStructured)('INFO', 'User joined club successfully', {
            requestId,
            userId: authContext.userId,
            clubId,
            membershipId: membership.membershipId,
            status: membership.status,
        });
        // Format response
        const response = {
            success: true,
            data: {
                membershipId: membership.membershipId,
                clubId: membership.clubId,
                userId: membership.userId,
                role: membership.role,
                status: membership.status,
                joinedAt: membership.joinedAt,
                message: membership.joinMessage,
            },
            timestamp: new Date().toISOString(),
        };
        return (0, lambda_utils_1.createSuccessResponse)(response.data, api_1.HttpStatusCode.CREATED, origin);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing join club request', {
            requestId,
            clubId: event.pathParameters?.clubId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId, origin);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiam9pbi1jbHViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiam9pbi1jbHViLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBSUgsc0RBQThEO0FBQzlELHVFQUFpRjtBQUNqRix3RUFBK0g7QUFDL0gsNERBQWtFO0FBQ2xFLDRHQUF1RztBQUN2Ryw0RkFBdUY7QUFDdkYsd0dBQW1HO0FBQ25HLG1GQUErRTtBQUMvRSxrR0FBOEY7QUFFOUYsd0JBQXdCO0FBQ3hCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVyxDQUFDO0FBRTNDLHVDQUF1QztBQUN2QyxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlELE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDZEQUE0QixDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUMxRixNQUFNLGlCQUFpQixHQUFHLElBQUksc0NBQWlCLENBQUMsb0JBQW9CLEVBQUUsY0FBYyxFQUFFLDRDQUFvQixDQUFDLENBQUM7QUFFNUc7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQTJCO0lBQ3ZELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO0lBQ2pELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBRTVELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsOEJBQThCLEVBQUU7UUFDcEQsU0FBUztRQUNULFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtRQUM1QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7UUFDaEIsTUFBTTtLQUNQLENBQUMsQ0FBQztJQUVILElBQUk7UUFDRix1Q0FBdUM7UUFDdkMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUM7UUFFNUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE1BQU0sSUFBSSx3QkFBZSxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDbEQ7UUFFRCxxQkFBcUI7UUFDckIsTUFBTSxTQUFTLEdBQUcsSUFBQSw0QkFBYSxFQUFnQixLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFNUQseUNBQXlDO1FBQ3pDLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSx3Q0FBeUIsRUFBQyxLQUFLLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBRTFGLElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsZ0NBQWdDLEVBQUU7WUFDdEQsU0FBUztZQUNULE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTTtZQUMxQixNQUFNO1lBQ04sZUFBZSxFQUFFLFdBQVcsQ0FBQyxlQUFlO1NBQzdDLENBQUMsQ0FBQztRQUVILGlDQUFpQztRQUNqQyxJQUFJLENBQUMsV0FBVyxDQUFDLGVBQWUsRUFBRTtZQUNoQyxNQUFNLElBQUksd0JBQWUsQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO1NBQ3REO1FBRUQsWUFBWTtRQUNaLE1BQU0sVUFBVSxHQUFHLE1BQU0saUJBQWlCLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7UUFFcEYsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSwrQkFBK0IsRUFBRTtZQUNyRCxTQUFTO1lBQ1QsTUFBTSxFQUFFLFdBQVcsQ0FBQyxNQUFNO1lBQzFCLE1BQU07WUFDTixZQUFZLEVBQUUsVUFBVSxDQUFDLFlBQVk7WUFDckMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNO1NBQzFCLENBQUMsQ0FBQztRQUVILGtCQUFrQjtRQUNsQixNQUFNLFFBQVEsR0FBRztZQUNmLE9BQU8sRUFBRSxJQUFJO1lBQ2IsSUFBSSxFQUFFO2dCQUNKLFlBQVksRUFBRSxVQUFVLENBQUMsWUFBWTtnQkFDckMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNO2dCQUN6QixNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU07Z0JBQ3pCLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSTtnQkFDckIsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNO2dCQUN6QixRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVE7Z0JBQzdCLE9BQU8sRUFBRSxVQUFVLENBQUMsV0FBVzthQUNoQztZQUNELFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUNwQyxDQUFDO1FBRUYsT0FBTyxJQUFBLG9DQUFxQixFQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsb0JBQWMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDN0U7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLElBQUEsNEJBQWEsRUFBQyxPQUFPLEVBQUUsb0NBQW9DLEVBQUU7WUFDM0QsU0FBUztZQUNULE1BQU0sRUFBRSxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU07WUFDcEMsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLGdDQUFpQixFQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDcEQ7QUFDSCxDQUFDO0FBekVELDBCQXlFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSm9pbiBDbHViIEhhbmRsZXIgLSBQaGFzZSAyLjJcbiAqIFxuICogTGFtYmRhIGhhbmRsZXIgZm9yIFBPU1QgL3YxL2NsdWJzL3tpZH0vbWVtYmVycyBlbmRwb2ludC5cbiAqIEFsbG93cyBhdXRoZW50aWNhdGVkIHVzZXJzIHRvIGpvaW4gY2x1YnMuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDIuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0yLjIuY2x1Yi1tZW1iZXJzaGlwLXJvbGVzLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgSm9pbkNsdWJJbnB1dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9tZW1iZXJzaGlwJztcbmltcG9ydCB7IEh0dHBTdGF0dXNDb2RlIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL2FwaSc7XG5pbXBvcnQgeyBjcmVhdGVFbmhhbmNlZEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGgvYXV0aC1jb250ZXh0JztcbmltcG9ydCB7IGNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSwgaGFuZGxlTGFtYmRhRXJyb3IsIGxvZ1N0cnVjdHVyZWQsIHBhcnNlSnNvbkJvZHkgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9lcnJvcnMnO1xuaW1wb3J0IHsgRHluYW1vREJVc2VyUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uLy4uL3VzZXItcHJvZmlsZS9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi11c2VyLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJDbHViUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLWNsdWItcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBEeW5hbW9EQk1lbWJlcnNoaXBSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItbWVtYmVyc2hpcC1yZXBvc2l0b3J5JztcbmltcG9ydCB7IE1lbWJlcnNoaXBTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL21lbWJlcnNoaXAvbWVtYmVyc2hpcC1zZXJ2aWNlJztcbmltcG9ydCB7IGF1dGhvcml6YXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGhvcml6YXRpb24vYXV0aG9yaXphdGlvbi1zZXJ2aWNlJztcblxuLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXG5jb25zdCBUQUJMRV9OQU1FID0gcHJvY2Vzcy5lbnYuVEFCTEVfTkFNRSE7XG5cbi8vIEluaXRpYWxpemUgcmVwb3NpdG9yaWVzIGFuZCBzZXJ2aWNlc1xuY29uc3QgdXNlclJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJVc2VyUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IGNsdWJSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkoVEFCTEVfTkFNRSk7XG5jb25zdCBtZW1iZXJzaGlwUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQk1lbWJlcnNoaXBSZXBvc2l0b3J5KFRBQkxFX05BTUUsIHVzZXJSZXBvc2l0b3J5KTtcbmNvbnN0IG1lbWJlcnNoaXBTZXJ2aWNlID0gbmV3IE1lbWJlcnNoaXBTZXJ2aWNlKG1lbWJlcnNoaXBSZXBvc2l0b3J5LCBjbHViUmVwb3NpdG9yeSwgYXV0aG9yaXphdGlvblNlcnZpY2UpO1xuXG4vKipcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBQT1NUIC92MS9jbHVicy97aWR9L21lbWJlcnNcbiAqIFxuICogQHBhcmFtIGV2ZW50IC0gQVBJIEdhdGV3YXkgcHJveHkgZXZlbnRcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xuICBjb25zdCByZXF1ZXN0SWQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5yZXF1ZXN0SWQ7XG4gIGNvbnN0IG9yaWdpbiA9IGV2ZW50LmhlYWRlcnMub3JpZ2luIHx8IGV2ZW50LmhlYWRlcnMuT3JpZ2luO1xuICBcbiAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdQcm9jZXNzaW5nIGpvaW4gY2x1YiByZXF1ZXN0Jywge1xuICAgIHJlcXVlc3RJZCxcbiAgICBodHRwTWV0aG9kOiBldmVudC5odHRwTWV0aG9kLFxuICAgIHBhdGg6IGV2ZW50LnBhdGgsXG4gICAgb3JpZ2luLFxuICB9KTtcbiAgXG4gIHRyeSB7XG4gICAgLy8gRXh0cmFjdCBjbHViIElEIGZyb20gcGF0aCBwYXJhbWV0ZXJzXG4gICAgY29uc3QgY2x1YklkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNsdWJJZDtcbiAgICBcbiAgICBpZiAoIWNsdWJJZCkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignQ2x1YiBJRCBpcyByZXF1aXJlZCcpO1xuICAgIH1cblxuICAgIC8vIFBhcnNlIHJlcXVlc3QgYm9keVxuICAgIGNvbnN0IGpvaW5JbnB1dCA9IHBhcnNlSnNvbkJvZHk8Sm9pbkNsdWJJbnB1dD4oZXZlbnQpIHx8IHt9O1xuXG4gICAgLy8gQ3JlYXRlIGVuaGFuY2VkIGF1dGhlbnRpY2F0aW9uIGNvbnRleHRcbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IGF3YWl0IGNyZWF0ZUVuaGFuY2VkQXV0aENvbnRleHQoZXZlbnQucmVxdWVzdENvbnRleHQsIHVzZXJSZXBvc2l0b3J5KTtcblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnQXV0aGVudGljYXRpb24gY29udGV4dCBjcmVhdGVkJywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBjbHViSWQsXG4gICAgICBpc0F1dGhlbnRpY2F0ZWQ6IGF1dGhDb250ZXh0LmlzQXV0aGVudGljYXRlZCxcbiAgICB9KTtcblxuICAgIC8vIFZhbGlkYXRlIHVzZXIgaXMgYXV0aGVudGljYXRlZFxuICAgIGlmICghYXV0aENvbnRleHQuaXNBdXRoZW50aWNhdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdBdXRoZW50aWNhdGlvbiByZXF1aXJlZCcpO1xuICAgIH1cblxuICAgIC8vIEpvaW4gY2x1YlxuICAgIGNvbnN0IG1lbWJlcnNoaXAgPSBhd2FpdCBtZW1iZXJzaGlwU2VydmljZS5qb2luQ2x1YihjbHViSWQsIGpvaW5JbnB1dCwgYXV0aENvbnRleHQpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdVc2VyIGpvaW5lZCBjbHViIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgY2x1YklkLFxuICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgIHN0YXR1czogbWVtYmVyc2hpcC5zdGF0dXMsXG4gICAgfSk7XG5cbiAgICAvLyBGb3JtYXQgcmVzcG9uc2VcbiAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIG1lbWJlcnNoaXBJZDogbWVtYmVyc2hpcC5tZW1iZXJzaGlwSWQsXG4gICAgICAgIGNsdWJJZDogbWVtYmVyc2hpcC5jbHViSWQsXG4gICAgICAgIHVzZXJJZDogbWVtYmVyc2hpcC51c2VySWQsXG4gICAgICAgIHJvbGU6IG1lbWJlcnNoaXAucm9sZSxcbiAgICAgICAgc3RhdHVzOiBtZW1iZXJzaGlwLnN0YXR1cyxcbiAgICAgICAgam9pbmVkQXQ6IG1lbWJlcnNoaXAuam9pbmVkQXQsXG4gICAgICAgIG1lc3NhZ2U6IG1lbWJlcnNoaXAuam9pbk1lc3NhZ2UsXG4gICAgICB9LFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcblxuICAgIHJldHVybiBjcmVhdGVTdWNjZXNzUmVzcG9uc2UocmVzcG9uc2UuZGF0YSwgSHR0cFN0YXR1c0NvZGUuQ1JFQVRFRCwgb3JpZ2luKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdFcnJvciBwcm9jZXNzaW5nIGpvaW4gY2x1YiByZXF1ZXN0Jywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgY2x1YklkOiBldmVudC5wYXRoUGFyYW1ldGVycz8uY2x1YklkLFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGhhbmRsZUxhbWJkYUVycm9yKGVycm9yLCByZXF1ZXN0SWQsIG9yaWdpbik7XG4gIH1cbn0iXX0=