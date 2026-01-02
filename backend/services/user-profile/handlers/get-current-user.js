"use strict";
/**
 * Get Current User Handler - Phase 1.2
 *
 * Lambda handler for GET /users/me endpoint.
 * Implements lazy user creation as defined in the canonical specification.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_context_1 = require("../../../shared/auth/auth-context");
const lambda_utils_1 = require("../../../shared/utils/lambda-utils");
const dynamodb_user_repository_1 = require("../infrastructure/dynamodb-user-repository");
const user_service_1 = require("../domain/user-service");
// Environment variables
const TABLE_NAME = process.env.TABLE_NAME;
// Initialize repository and service
const userRepository = new dynamodb_user_repository_1.DynamoDBUserRepository(TABLE_NAME);
const userService = new user_service_1.UserService(userRepository);
/**
 * Lambda handler for GET /users/me
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing get current user request', {
        requestId,
        httpMethod: event.httpMethod,
        path: event.path,
    });
    try {
        // Create authentication context from API Gateway event
        const authContext = (0, auth_context_1.createAuthContext)(event.requestContext);
        (0, lambda_utils_1.logStructured)('INFO', 'Authentication context created', {
            requestId,
            userId: authContext.userId,
            isAuthenticated: authContext.isAuthenticated,
            isSiteAdmin: authContext.isSiteAdmin,
        });
        // Get current user (with lazy creation)
        const user = await userService.getCurrentUser(authContext);
        (0, lambda_utils_1.logStructured)('INFO', 'Current user retrieved successfully', {
            requestId,
            userId: user.id,
            systemRole: user.systemRole,
        });
        return (0, lambda_utils_1.createSuccessResponse)(user);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing get current user request', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LWN1cnJlbnQtdXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdldC1jdXJyZW50LXVzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7QUFHSCxvRUFBc0U7QUFDdEUscUVBQTZHO0FBQzdHLHlGQUFvRjtBQUNwRix5REFBcUQ7QUFFckQsd0JBQXdCO0FBQ3hCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVyxDQUFDO0FBRTNDLG9DQUFvQztBQUNwQyxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlELE1BQU0sV0FBVyxHQUFHLElBQUksMEJBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUVwRDs7Ozs7R0FLRztBQUNJLEtBQUssVUFBVSxPQUFPLENBQUMsS0FBMkI7SUFDdkQsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUM7SUFFakQsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSxxQ0FBcUMsRUFBRTtRQUMzRCxTQUFTO1FBQ1QsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO1FBQzVCLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtLQUNqQixDQUFDLENBQUM7SUFFSCxJQUFJO1FBQ0YsdURBQXVEO1FBQ3ZELE1BQU0sV0FBVyxHQUFHLElBQUEsZ0NBQWlCLEVBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRTVELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsZ0NBQWdDLEVBQUU7WUFDdEQsU0FBUztZQUNULE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTTtZQUMxQixlQUFlLEVBQUUsV0FBVyxDQUFDLGVBQWU7WUFDNUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxXQUFXO1NBQ3JDLENBQUMsQ0FBQztRQUVILHdDQUF3QztRQUN4QyxNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFM0QsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSxxQ0FBcUMsRUFBRTtZQUMzRCxTQUFTO1lBQ1QsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ2YsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO1NBQzVCLENBQUMsQ0FBQztRQUVILE9BQU8sSUFBQSxvQ0FBcUIsRUFBQyxJQUFJLENBQUMsQ0FBQztLQUNwQztJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsSUFBQSw0QkFBYSxFQUFDLE9BQU8sRUFBRSwyQ0FBMkMsRUFBRTtZQUNsRSxTQUFTO1lBQ1QsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLGdDQUFpQixFQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztLQUM1QztBQUNILENBQUM7QUF0Q0QsMEJBc0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBHZXQgQ3VycmVudCBVc2VyIEhhbmRsZXIgLSBQaGFzZSAxLjJcbiAqIFxuICogTGFtYmRhIGhhbmRsZXIgZm9yIEdFVCAvdXNlcnMvbWUgZW5kcG9pbnQuXG4gKiBJbXBsZW1lbnRzIGxhenkgdXNlciBjcmVhdGlvbiBhcyBkZWZpbmVkIGluIHRoZSBjYW5vbmljYWwgc3BlY2lmaWNhdGlvbi5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMS4yIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTEuMi51c2VyLXByb2ZpbGUudjEubWRcbiAqL1xuXG5pbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBjcmVhdGVBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBjcmVhdGVTdWNjZXNzUmVzcG9uc2UsIGhhbmRsZUxhbWJkYUVycm9yLCBsb2dTdHJ1Y3R1cmVkIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItdXNlci1yZXBvc2l0b3J5JztcbmltcG9ydCB7IFVzZXJTZXJ2aWNlIH0gZnJvbSAnLi4vZG9tYWluL3VzZXItc2VydmljZSc7XG5cbi8vIEVudmlyb25tZW50IHZhcmlhYmxlc1xuY29uc3QgVEFCTEVfTkFNRSA9IHByb2Nlc3MuZW52LlRBQkxFX05BTUUhO1xuXG4vLyBJbml0aWFsaXplIHJlcG9zaXRvcnkgYW5kIHNlcnZpY2VcbmNvbnN0IHVzZXJSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCVXNlclJlcG9zaXRvcnkoVEFCTEVfTkFNRSk7XG5jb25zdCB1c2VyU2VydmljZSA9IG5ldyBVc2VyU2VydmljZSh1c2VyUmVwb3NpdG9yeSk7XG5cbi8qKlxuICogTGFtYmRhIGhhbmRsZXIgZm9yIEdFVCAvdXNlcnMvbWVcbiAqIFxuICogQHBhcmFtIGV2ZW50IC0gQVBJIEdhdGV3YXkgcHJveHkgZXZlbnRcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xuICBjb25zdCByZXF1ZXN0SWQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5yZXF1ZXN0SWQ7XG4gIFxuICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1Byb2Nlc3NpbmcgZ2V0IGN1cnJlbnQgdXNlciByZXF1ZXN0Jywge1xuICAgIHJlcXVlc3RJZCxcbiAgICBodHRwTWV0aG9kOiBldmVudC5odHRwTWV0aG9kLFxuICAgIHBhdGg6IGV2ZW50LnBhdGgsXG4gIH0pO1xuICBcbiAgdHJ5IHtcbiAgICAvLyBDcmVhdGUgYXV0aGVudGljYXRpb24gY29udGV4dCBmcm9tIEFQSSBHYXRld2F5IGV2ZW50XG4gICAgY29uc3QgYXV0aENvbnRleHQgPSBjcmVhdGVBdXRoQ29udGV4dChldmVudC5yZXF1ZXN0Q29udGV4dCk7XG4gICAgXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdBdXRoZW50aWNhdGlvbiBjb250ZXh0IGNyZWF0ZWQnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGlzQXV0aGVudGljYXRlZDogYXV0aENvbnRleHQuaXNBdXRoZW50aWNhdGVkLFxuICAgICAgaXNTaXRlQWRtaW46IGF1dGhDb250ZXh0LmlzU2l0ZUFkbWluLFxuICAgIH0pO1xuICAgIFxuICAgIC8vIEdldCBjdXJyZW50IHVzZXIgKHdpdGggbGF6eSBjcmVhdGlvbilcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgdXNlclNlcnZpY2UuZ2V0Q3VycmVudFVzZXIoYXV0aENvbnRleHQpO1xuICAgIFxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnQ3VycmVudCB1c2VyIHJldHJpZXZlZCBzdWNjZXNzZnVsbHknLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IHVzZXIuaWQsXG4gICAgICBzeXN0ZW1Sb2xlOiB1c2VyLnN5c3RlbVJvbGUsXG4gICAgfSk7XG4gICAgXG4gICAgcmV0dXJuIGNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSh1c2VyKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdFcnJvciBwcm9jZXNzaW5nIGdldCBjdXJyZW50IHVzZXIgcmVxdWVzdCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4gaGFuZGxlTGFtYmRhRXJyb3IoZXJyb3IsIHJlcXVlc3RJZCk7XG4gIH1cbn0iXX0=