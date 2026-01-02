"use strict";
/**
 * Update Member Handler - Phase 2.2
 *
 * Lambda handler for PUT /v1/clubs/{id}/members/{userId} endpoint.
 * Allows club admins to update member roles.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const club_authorization_1 = require("../../../../shared/types/club-authorization");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const lambda_utils_2 = require("../../../../shared/utils/lambda-utils");
const errors_1 = require("../../../../shared/utils/errors");
const dynamodb_user_repository_1 = require("../../../user-profile/infrastructure/dynamodb-user-repository");
const dynamodb_club_repository_1 = require("../../infrastructure/dynamodb-club-repository");
const dynamodb_membership_repository_1 = require("../../infrastructure/dynamodb-membership-repository");
const membership_service_1 = require("../../domain/membership/membership-service");
const club_authorization_2 = require("../../domain/authorization/club-authorization");
const authorization_service_1 = require("../../../../shared/authorization/authorization-service");
// Environment variables
const TABLE_NAME = process.env.TABLE_NAME;
// Initialize repositories and services
const userRepository = new dynamodb_user_repository_1.DynamoDBUserRepository(TABLE_NAME);
const clubRepository = new dynamodb_club_repository_1.DynamoDBClubRepository(TABLE_NAME);
const membershipRepository = new dynamodb_membership_repository_1.DynamoDBMembershipRepository(TABLE_NAME, userRepository);
const membershipService = new membership_service_1.MembershipService(membershipRepository, clubRepository, authorization_service_1.authorizationService);
const authService = new club_authorization_2.ClubAuthorizationService(membershipRepository, authorization_service_1.authorizationService);
/**
 * Lambda handler for PUT /v1/clubs/{id}/members/{userId}
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing update member request', {
        requestId,
        httpMethod: event.httpMethod,
        path: event.path,
    });
    try {
        // Extract club ID and user ID from path parameters
        const clubId = event.pathParameters?.clubId;
        const targetUserId = event.pathParameters?.userId;
        if (!clubId) {
            throw new errors_1.ValidationError('Club ID is required');
        }
        if (!targetUserId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        // Parse request body
        const updateInput = (0, lambda_utils_2.parseJsonBody)(event);
        if (!updateInput) {
            throw new errors_1.ValidationError('Request body is required');
        }
        // Create enhanced authentication context
        const authContext = await (0, auth_context_1.createEnhancedAuthContext)(event.requestContext, userRepository);
        (0, lambda_utils_1.logStructured)('INFO', 'Authentication context created', {
            requestId,
            userId: authContext.userId,
            clubId,
            targetUserId,
            newRole: updateInput.role,
            isAuthenticated: authContext.isAuthenticated,
        });
        // Check authorization - requires remove_members capability (for member management)
        await authService.requireClubCapability(authContext, clubId, club_authorization_1.ClubCapability.REMOVE_MEMBERS);
        (0, lambda_utils_1.logStructured)('INFO', 'Authorization successful', {
            requestId,
            userId: authContext.userId,
            clubId,
            capability: club_authorization_1.ClubCapability.REMOVE_MEMBERS,
        });
        // Update member role
        const membership = await membershipService.updateMemberRole(clubId, targetUserId, updateInput, authContext);
        (0, lambda_utils_1.logStructured)('INFO', 'Member role updated successfully', {
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
        return (0, lambda_utils_1.createSuccessResponse)(response);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing update member request', {
            requestId,
            clubId: event.pathParameters?.clubId,
            targetUserId: event.pathParameters?.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLW1lbWJlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInVwZGF0ZS1tZW1iZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7QUFJSCxvRkFBNkU7QUFDN0UsdUVBQWlGO0FBQ2pGLHdFQUFnSDtBQUNoSCx3RUFBc0U7QUFDdEUsNERBQWtFO0FBQ2xFLDRHQUF1RztBQUN2Ryw0RkFBdUY7QUFDdkYsd0dBQW1HO0FBQ25HLG1GQUErRTtBQUMvRSxzRkFBeUY7QUFDekYsa0dBQThGO0FBRTlGLHdCQUF3QjtBQUN4QixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVcsQ0FBQztBQUUzQyx1Q0FBdUM7QUFDdkMsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RCxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSw2REFBNEIsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDMUYsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLHNDQUFpQixDQUFDLG9CQUFvQixFQUFFLGNBQWMsRUFBRSw0Q0FBb0IsQ0FBQyxDQUFDO0FBQzVHLE1BQU0sV0FBVyxHQUFHLElBQUksNkNBQXdCLENBQUMsb0JBQW9CLEVBQUUsNENBQW9CLENBQUMsQ0FBQztBQUU3Rjs7Ozs7R0FLRztBQUNJLEtBQUssVUFBVSxPQUFPLENBQUMsS0FBMkI7SUFDdkQsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUM7SUFFakQsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSxrQ0FBa0MsRUFBRTtRQUN4RCxTQUFTO1FBQ1QsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO1FBQzVCLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtLQUNqQixDQUFDLENBQUM7SUFFSCxJ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QUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlO1NBQ2hFLENBQUMsQ0FBQztRQUVILE9BQU8sSUFBQSxnQ0FBaUIsRUFBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDNUM7QUFDSCxDQUFDO0FBekZELDBCQXlGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVXBkYXRlIE1lbWJlciBIYW5kbGVyIC0gUGhhc2UgMi4yXG4gKiBcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBQVVQgL3YxL2NsdWJzL3tpZH0vbWVtYmVycy97dXNlcklkfSBlbmRwb2ludC5cbiAqIEFsbG93cyBjbHViIGFkbWlucyB0byB1cGRhdGUgbWVtYmVyIHJvbGVzLlxuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBQaGFzZSAyLjIgU3BlYzogLmtpcm8vc3BlY3MvcGhhc2UtMi4yLmNsdWItbWVtYmVyc2hpcC1yb2xlcy52MS5tZFxuICovXG5cbmltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IFVwZGF0ZU1lbWJlcklucHV0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL21lbWJlcnNoaXAnO1xuaW1wb3J0IHsgQ2x1YkNhcGFiaWxpdHkgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvY2x1Yi1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IGNyZWF0ZUVuaGFuY2VkQXV0aENvbnRleHQgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvYXV0aC9hdXRoLWNvbnRleHQnO1xuaW1wb3J0IHsgY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlLCBoYW5kbGVMYW1iZGFFcnJvciwgbG9nU3RydWN0dXJlZCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9sYW1iZGEtdXRpbHMnO1xuaW1wb3J0IHsgcGFyc2VKc29uQm9keSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9sYW1iZGEtdXRpbHMnO1xuaW1wb3J0IHsgVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2Vycm9ycyc7XG5pbXBvcnQgeyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vLi4vdXNlci1wcm9maWxlL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLXVzZXItcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBEeW5hbW9EQkNsdWJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItY2x1Yi1yZXBvc2l0b3J5JztcbmltcG9ydCB7IER5bmFtb0RCTWVtYmVyc2hpcFJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1tZW1iZXJzaGlwLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgTWVtYmVyc2hpcFNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vbWVtYmVyc2hpcC9tZW1iZXJzaGlwLXNlcnZpY2UnO1xuaW1wb3J0IHsgQ2x1YkF1dGhvcml6YXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2F1dGhvcml6YXRpb24vY2x1Yi1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IGF1dGhvcml6YXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGhvcml6YXRpb24vYXV0aG9yaXphdGlvbi1zZXJ2aWNlJztcblxuLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXG5jb25zdCBUQUJMRV9OQU1FID0gcHJvY2Vzcy5lbnYuVEFCTEVfTkFNRSE7XG5cbi8vIEluaXRpYWxpemUgcmVwb3NpdG9yaWVzIGFuZCBzZXJ2aWNlc1xuY29uc3QgdXNlclJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJVc2VyUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IGNsdWJSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkoVEFCTEVfTkFNRSk7XG5jb25zdCBtZW1iZXJzaGlwUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQk1lbWJlcnNoaXBSZXBvc2l0b3J5KFRBQkxFX05BTUUsIHVzZXJSZXBvc2l0b3J5KTtcbmNvbnN0IG1lbWJlcnNoaXBTZXJ2aWNlID0gbmV3IE1lbWJlcnNoaXBTZXJ2aWNlKG1lbWJlcnNoaXBSZXBvc2l0b3J5LCBjbHViUmVwb3NpdG9yeSwgYXV0aG9yaXphdGlvblNlcnZpY2UpO1xuY29uc3QgYXV0aFNlcnZpY2UgPSBuZXcgQ2x1YkF1dGhvcml6YXRpb25TZXJ2aWNlKG1lbWJlcnNoaXBSZXBvc2l0b3J5LCBhdXRob3JpemF0aW9uU2VydmljZSk7XG5cbi8qKlxuICogTGFtYmRhIGhhbmRsZXIgZm9yIFBVVCAvdjEvY2x1YnMve2lkfS9tZW1iZXJzL3t1c2VySWR9XG4gKiBcbiAqIEBwYXJhbSBldmVudCAtIEFQSSBHYXRld2F5IHByb3h5IGV2ZW50XG4gKiBAcmV0dXJucyBBUEkgR2F0ZXdheSBwcm94eSByZXN1bHRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+IHtcbiAgY29uc3QgcmVxdWVzdElkID0gZXZlbnQucmVxdWVzdENvbnRleHQucmVxdWVzdElkO1xuICBcbiAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdQcm9jZXNzaW5nIHVwZGF0ZSBtZW1iZXIgcmVxdWVzdCcsIHtcbiAgICByZXF1ZXN0SWQsXG4gICAgaHR0cE1ldGhvZDogZXZlbnQuaHR0cE1ldGhvZCxcbiAgICBwYXRoOiBldmVudC5wYXRoLFxuICB9KTtcbiAgXG4gIHRyeSB7XG4gICAgLy8gRXh0cmFjdCBjbHViIElEIGFuZCB1c2VyIElEIGZyb20gcGF0aCBwYXJhbWV0ZXJzXG4gICAgY29uc3QgY2x1YklkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNsdWJJZDtcbiAgICBjb25zdCB0YXJnZXRVc2VySWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8udXNlcklkO1xuICAgIFxuICAgIGlmICghY2x1YklkKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdDbHViIElEIGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgaWYgKCF0YXJnZXRVc2VySWQpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1VzZXIgSUQgaXMgcmVxdWlyZWQnKTtcbiAgICB9XG5cbiAgICAvLyBQYXJzZSByZXF1ZXN0IGJvZHlcbiAgICBjb25zdCB1cGRhdGVJbnB1dCA9IHBhcnNlSnNvbkJvZHk8VXBkYXRlTWVtYmVySW5wdXQ+KGV2ZW50KTtcblxuICAgIGlmICghdXBkYXRlSW5wdXQpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1JlcXVlc3QgYm9keSBpcyByZXF1aXJlZCcpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBlbmhhbmNlZCBhdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gICAgY29uc3QgYXV0aENvbnRleHQgPSBhd2FpdCBjcmVhdGVFbmhhbmNlZEF1dGhDb250ZXh0KGV2ZW50LnJlcXVlc3RDb250ZXh0LCB1c2VyUmVwb3NpdG9yeSk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0F1dGhlbnRpY2F0aW9uIGNvbnRleHQgY3JlYXRlZCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgY2x1YklkLFxuICAgICAgdGFyZ2V0VXNlcklkLFxuICAgICAgbmV3Um9sZTogdXBkYXRlSW5wdXQucm9sZSxcbiAgICAgIGlzQXV0aGVudGljYXRlZDogYXV0aENvbnRleHQuaXNBdXRoZW50aWNhdGVkLFxuICAgIH0pO1xuXG4gICAgLy8gQ2hlY2sgYXV0aG9yaXphdGlvbiAtIHJlcXVpcmVzIHJlbW92ZV9tZW1iZXJzIGNhcGFiaWxpdHkgKGZvciBtZW1iZXIgbWFuYWdlbWVudClcbiAgICBhd2FpdCBhdXRoU2VydmljZS5yZXF1aXJlQ2x1YkNhcGFiaWxpdHkoYXV0aENvbnRleHQsIGNsdWJJZCwgQ2x1YkNhcGFiaWxpdHkuUkVNT1ZFX01FTUJFUlMpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdBdXRob3JpemF0aW9uIHN1Y2Nlc3NmdWwnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGNsdWJJZCxcbiAgICAgIGNhcGFiaWxpdHk6IENsdWJDYXBhYmlsaXR5LlJFTU9WRV9NRU1CRVJTLFxuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIG1lbWJlciByb2xlXG4gICAgY29uc3QgbWVtYmVyc2hpcCA9IGF3YWl0IG1lbWJlcnNoaXBTZXJ2aWNlLnVwZGF0ZU1lbWJlclJvbGUoY2x1YklkLCB0YXJnZXRVc2VySWQsIHVwZGF0ZUlucHV0LCBhdXRoQ29udGV4dCk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ01lbWJlciByb2xlIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5Jywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBjbHViSWQsXG4gICAgICB0YXJnZXRVc2VySWQsXG4gICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgbmV3Um9sZTogbWVtYmVyc2hpcC5yb2xlLFxuICAgIH0pO1xuXG4gICAgLy8gRm9ybWF0IHJlc3BvbnNlXG4gICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YToge1xuICAgICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgICB1c2VySWQ6IG1lbWJlcnNoaXAudXNlcklkLFxuICAgICAgICByb2xlOiBtZW1iZXJzaGlwLnJvbGUsXG4gICAgICAgIHN0YXR1czogbWVtYmVyc2hpcC5zdGF0dXMsXG4gICAgICAgIHVwZGF0ZWRBdDogbWVtYmVyc2hpcC51cGRhdGVkQXQsXG4gICAgICAgIHVwZGF0ZWRCeTogbWVtYmVyc2hpcC5wcm9jZXNzZWRCeSxcbiAgICAgICAgcmVhc29uOiBtZW1iZXJzaGlwLnJlYXNvbixcbiAgICAgIH0sXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIGNyZWF0ZVN1Y2Nlc3NSZXNwb25zZShyZXNwb25zZSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRXJyb3IgcHJvY2Vzc2luZyB1cGRhdGUgbWVtYmVyIHJlcXVlc3QnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICBjbHViSWQ6IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5jbHViSWQsXG4gICAgICB0YXJnZXRVc2VySWQ6IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy51c2VySWQsXG4gICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gaGFuZGxlTGFtYmRhRXJyb3IoZXJyb3IsIHJlcXVlc3RJZCk7XG4gIH1cbn0iXX0=