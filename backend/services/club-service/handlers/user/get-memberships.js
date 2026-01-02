"use strict";
/**
 * Get User Memberships Handler - Phase 2.2
 *
 * Lambda handler for GET /v1/users/me/memberships endpoint.
 * Returns the authenticated user's club memberships.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
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
 * Lambda handler for GET /v1/users/me/memberships
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing get user memberships request', {
        requestId,
        httpMethod: event.httpMethod,
        path: event.path,
    });
    try {
        // Parse query parameters
        const queryParams = event.queryStringParameters || {};
        // Parse status filter
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
        // Get user's memberships
        const memberships = await membershipService.getUserMemberships(authContext, status);
        (0, lambda_utils_1.logStructured)('INFO', 'User memberships retrieved successfully', {
            requestId,
            userId: authContext.userId,
            membershipCount: memberships.length,
            status,
        });
        // Format response
        const response = {
            success: true,
            data: memberships,
            timestamp: new Date().toISOString(),
        };
        return (0, lambda_utils_1.createSuccessResponse)(response);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing get user memberships request', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LW1lbWJlcnNoaXBzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2V0LW1lbWJlcnNoaXBzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBR0gsb0VBQXVFO0FBQ3ZFLHVFQUFpRjtBQUNqRix3RUFBZ0g7QUFDaEgsNERBQWtFO0FBQ2xFLDRHQUF1RztBQUN2Ryw0RkFBdUY7QUFDdkYsd0dBQW1HO0FBQ25HLG1GQUErRTtBQUMvRSxrR0FBOEY7QUFFOUYsd0JBQXdCO0FBQ3hCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVyxDQUFDO0FBRTNDLHVDQUF1QztBQUN2QyxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlELE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDZEQUE0QixDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUMxRixNQUFNLGlCQUFpQixHQUFHLElBQUksc0NBQWlCLENBQUMsb0JBQW9CLEVBQUUsY0FBYyxFQUFFLDRDQUFvQixDQUFDLENBQUM7QUFFNUc7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQTJCO0lBQ3ZELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO0lBRWpELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUseUNBQXlDLEVBQUU7UUFDL0QsU0FBUztRQUNULFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtRQUM1QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7S0FDakIsQ0FBQyxDQUFDO0lBRUgsSUFBSTtRQUNGLHlCQUF5QjtRQUN6QixNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMscUJBQXFCLElBQUksRUFBRSxDQUFDO1FBRXRELHNCQUFzQjtRQUN0QixJQUFJLE1BQW9DLENBQUM7UUFDekMsSUFBSSxXQUFXLENBQUMsTUFBTSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLDZCQUFnQixDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUEwQixDQUFDLEVBQUU7Z0JBQ3JGLE1BQU0sSUFBSSx3QkFBZSxDQUFDLDBCQUEwQixDQUFDLENBQUM7YUFDdkQ7WUFDRCxNQUFNLEdBQUcsV0FBVyxDQUFDLE1BQTBCLENBQUM7U0FDakQ7UUFFRCx5Q0FBeUM7UUFDekMsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFBLHdDQUF5QixFQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFFMUYsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSxnQ0FBZ0MsRUFBRTtZQUN0RCxTQUFTO1lBQ1QsTUFBTSxFQUFFLFdBQVcsQ0FBQyxNQUFNO1lBQzFCLGVBQWUsRUFBRSxXQUFXLENBQUMsZUFBZTtZQUM1QyxNQUFNO1NBQ1AsQ0FBQyxDQUFDO1FBRUgsaUNBQWlDO1FBQ2pDLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFO1lBQ2hDLE1BQU0sSUFBSSx3QkFBZSxDQUFDLHlCQUF5QixDQUFDLENBQUM7U0FDdEQ7UUFFRCx5QkFBeUI7UUFDekIsTUFBTSxXQUFXLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFcEYsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSx5Q0FBeUMsRUFBRTtZQUMvRCxTQUFTO1lBQ1QsTUFBTSxFQUFFLFdBQVcsQ0FBQyxNQUFNO1lBQzFCLGVBQWUsRUFBRSxXQUFXLENBQUMsTUFBTTtZQUNuQyxNQUFNO1NBQ1AsQ0FBQyxDQUFDO1FBRUgsa0JBQWtCO1FBQ2xCLE1BQU0sUUFBUSxHQUFHO1lBQ2YsT0FBTyxFQUFFLElBQUk7WUFDYixJQUFJLEVBQUUsV0FBVztZQUNqQixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDcEMsQ0FBQztRQUVGLE9BQU8sSUFBQSxvQ0FBcUIsRUFBQyxRQUFRLENBQUMsQ0FBQztLQUN4QztJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsSUFBQSw0QkFBYSxFQUFDLE9BQU8sRUFBRSwrQ0FBK0MsRUFBRTtZQUN0RSxTQUFTO1lBQ1QsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLGdDQUFpQixFQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztLQUM1QztBQUNILENBQUM7QUEvREQsMEJBK0RDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBHZXQgVXNlciBNZW1iZXJzaGlwcyBIYW5kbGVyIC0gUGhhc2UgMi4yXG4gKiBcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBHRVQgL3YxL3VzZXJzL21lL21lbWJlcnNoaXBzIGVuZHBvaW50LlxuICogUmV0dXJucyB0aGUgYXV0aGVudGljYXRlZCB1c2VyJ3MgY2x1YiBtZW1iZXJzaGlwcy5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMi4yIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTIuMi5jbHViLW1lbWJlcnNoaXAtcm9sZXMudjEubWRcbiAqL1xuXG5pbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBNZW1iZXJzaGlwU3RhdHVzIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL21lbWJlcnNoaXAnO1xuaW1wb3J0IHsgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBjcmVhdGVTdWNjZXNzUmVzcG9uc2UsIGhhbmRsZUxhbWJkYUVycm9yLCBsb2dTdHJ1Y3R1cmVkIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvZXJyb3JzJztcbmltcG9ydCB7IER5bmFtb0RCVXNlclJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi8uLi91c2VyLXByb2ZpbGUvaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItdXNlci1yZXBvc2l0b3J5JztcbmltcG9ydCB7IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1jbHViLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJNZW1iZXJzaGlwUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLW1lbWJlcnNoaXAtcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBNZW1iZXJzaGlwU2VydmljZSB9IGZyb20gJy4uLy4uL2RvbWFpbi9tZW1iZXJzaGlwL21lbWJlcnNoaXAtc2VydmljZSc7XG5pbXBvcnQgeyBhdXRob3JpemF0aW9uU2VydmljZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRob3JpemF0aW9uL2F1dGhvcml6YXRpb24tc2VydmljZSc7XG5cbi8vIEVudmlyb25tZW50IHZhcmlhYmxlc1xuY29uc3QgVEFCTEVfTkFNRSA9IHByb2Nlc3MuZW52LlRBQkxFX05BTUUhO1xuXG4vLyBJbml0aWFsaXplIHJlcG9zaXRvcmllcyBhbmQgc2VydmljZXNcbmNvbnN0IHVzZXJSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCVXNlclJlcG9zaXRvcnkoVEFCTEVfTkFNRSk7XG5jb25zdCBjbHViUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQkNsdWJSZXBvc2l0b3J5KFRBQkxFX05BTUUpO1xuY29uc3QgbWVtYmVyc2hpcFJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJNZW1iZXJzaGlwUmVwb3NpdG9yeShUQUJMRV9OQU1FLCB1c2VyUmVwb3NpdG9yeSk7XG5jb25zdCBtZW1iZXJzaGlwU2VydmljZSA9IG5ldyBNZW1iZXJzaGlwU2VydmljZShtZW1iZXJzaGlwUmVwb3NpdG9yeSwgY2x1YlJlcG9zaXRvcnksIGF1dGhvcml6YXRpb25TZXJ2aWNlKTtcblxuLyoqXG4gKiBMYW1iZGEgaGFuZGxlciBmb3IgR0VUIC92MS91c2Vycy9tZS9tZW1iZXJzaGlwc1xuICogXG4gKiBAcGFyYW0gZXZlbnQgLSBBUEkgR2F0ZXdheSBwcm94eSBldmVudFxuICogQHJldHVybnMgQVBJIEdhdGV3YXkgcHJveHkgcmVzdWx0XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCk6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiB7XG4gIGNvbnN0IHJlcXVlc3RJZCA9IGV2ZW50LnJlcXVlc3RDb250ZXh0LnJlcXVlc3RJZDtcbiAgXG4gIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnUHJvY2Vzc2luZyBnZXQgdXNlciBtZW1iZXJzaGlwcyByZXF1ZXN0Jywge1xuICAgIHJlcXVlc3RJZCxcbiAgICBodHRwTWV0aG9kOiBldmVudC5odHRwTWV0aG9kLFxuICAgIHBhdGg6IGV2ZW50LnBhdGgsXG4gIH0pO1xuICBcbiAgdHJ5IHtcbiAgICAvLyBQYXJzZSBxdWVyeSBwYXJhbWV0ZXJzXG4gICAgY29uc3QgcXVlcnlQYXJhbXMgPSBldmVudC5xdWVyeVN0cmluZ1BhcmFtZXRlcnMgfHwge307XG4gICAgXG4gICAgLy8gUGFyc2Ugc3RhdHVzIGZpbHRlclxuICAgIGxldCBzdGF0dXM6IE1lbWJlcnNoaXBTdGF0dXMgfCB1bmRlZmluZWQ7XG4gICAgaWYgKHF1ZXJ5UGFyYW1zLnN0YXR1cykge1xuICAgICAgaWYgKCFPYmplY3QudmFsdWVzKE1lbWJlcnNoaXBTdGF0dXMpLmluY2x1ZGVzKHF1ZXJ5UGFyYW1zLnN0YXR1cyBhcyBNZW1iZXJzaGlwU3RhdHVzKSkge1xuICAgICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnZhbGlkIHN0YXR1cyBwYXJhbWV0ZXInKTtcbiAgICAgIH1cbiAgICAgIHN0YXR1cyA9IHF1ZXJ5UGFyYW1zLnN0YXR1cyBhcyBNZW1iZXJzaGlwU3RhdHVzO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBlbmhhbmNlZCBhdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gICAgY29uc3QgYXV0aENvbnRleHQgPSBhd2FpdCBjcmVhdGVFbmhhbmNlZEF1dGhDb250ZXh0KGV2ZW50LnJlcXVlc3RDb250ZXh0LCB1c2VyUmVwb3NpdG9yeSk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0F1dGhlbnRpY2F0aW9uIGNvbnRleHQgY3JlYXRlZCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgaXNBdXRoZW50aWNhdGVkOiBhdXRoQ29udGV4dC5pc0F1dGhlbnRpY2F0ZWQsXG4gICAgICBzdGF0dXMsXG4gICAgfSk7XG5cbiAgICAvLyBWYWxpZGF0ZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWRcbiAgICBpZiAoIWF1dGhDb250ZXh0LmlzQXV0aGVudGljYXRlZCkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignQXV0aGVudGljYXRpb24gcmVxdWlyZWQnKTtcbiAgICB9XG5cbiAgICAvLyBHZXQgdXNlcidzIG1lbWJlcnNoaXBzXG4gICAgY29uc3QgbWVtYmVyc2hpcHMgPSBhd2FpdCBtZW1iZXJzaGlwU2VydmljZS5nZXRVc2VyTWVtYmVyc2hpcHMoYXV0aENvbnRleHQsIHN0YXR1cyk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1VzZXIgbWVtYmVyc2hpcHMgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgbWVtYmVyc2hpcENvdW50OiBtZW1iZXJzaGlwcy5sZW5ndGgsXG4gICAgICBzdGF0dXMsXG4gICAgfSk7XG5cbiAgICAvLyBGb3JtYXQgcmVzcG9uc2VcbiAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiBtZW1iZXJzaGlwcyxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICByZXR1cm4gY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdFcnJvciBwcm9jZXNzaW5nIGdldCB1c2VyIG1lbWJlcnNoaXBzIHJlcXVlc3QnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gaGFuZGxlTGFtYmRhRXJyb3IoZXJyb3IsIHJlcXVlc3RJZCk7XG4gIH1cbn0iXX0=