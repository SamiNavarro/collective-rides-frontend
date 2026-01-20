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
    const origin = event.headers.origin || event.headers.Origin;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing get current user request', {
        requestId,
        httpMethod: event.httpMethod,
        path: event.path,
        origin,
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
        return (0, lambda_utils_1.createSuccessResponse)(user, undefined, origin);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LWN1cnJlbnQtdXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdldC1jdXJyZW50LXVzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7QUFHSCxvRUFBc0U7QUFDdEUscUVBQTZHO0FBQzdHLHlGQUFvRjtBQUNwRix5REFBcUQ7QUFFckQsd0JBQXdCO0FBQ3hCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVyxDQUFDO0FBRTNDLG9DQUFvQztBQUNwQyxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlELE1BQU0sV0FBVyxHQUFHLElBQUksMEJBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUVwRDs7Ozs7R0FLRztBQUNJLEtBQUssVUFBVSxPQUFPLENBQUMsS0FBMkI7SUFDdkQsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUM7SUFDakQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7SUFFNUQsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSxxQ0FBcUMsRUFBRTtRQUMzRCxTQUFTO1FBQ1QsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO1FBQzVCLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtRQUNoQixNQUFNO0tBQ1AsQ0FBQyxDQUFDO0lBRUgsSUFBSTtRQUNGLHVEQUF1RDtRQUN2RCxNQUFNLFdBQVcsR0FBRyxJQUFBLGdDQUFpQixFQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUU1RCxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLGdDQUFnQyxFQUFFO1lBQ3RELFNBQVM7WUFDVCxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07WUFDMUIsZUFBZSxFQUFFLFdBQVcsQ0FBQyxlQUFlO1lBQzVDLFdBQVcsRUFBRSxXQUFXLENBQUMsV0FBVztTQUNyQyxDQUFDLENBQUM7UUFFSCx3Q0FBd0M7UUFDeEMsTUFBTSxJQUFJLEdBQUcsTUFBTSxXQUFXLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRTNELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUscUNBQXFDLEVBQUU7WUFDM0QsU0FBUztZQUNULE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRTtZQUNmLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtTQUM1QixDQUFDLENBQUM7UUFFSCxPQUFPLElBQUEsb0NBQXFCLEVBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztLQUN2RDtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsSUFBQSw0QkFBYSxFQUFDLE9BQU8sRUFBRSwyQ0FBMkMsRUFBRTtZQUNsRSxTQUFTO1lBQ1QsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLGdDQUFpQixFQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztLQUM1QztBQUNILENBQUM7QUF4Q0QsMEJBd0NDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBHZXQgQ3VycmVudCBVc2VyIEhhbmRsZXIgLSBQaGFzZSAxLjJcbiAqIFxuICogTGFtYmRhIGhhbmRsZXIgZm9yIEdFVCAvdXNlcnMvbWUgZW5kcG9pbnQuXG4gKiBJbXBsZW1lbnRzIGxhenkgdXNlciBjcmVhdGlvbiBhcyBkZWZpbmVkIGluIHRoZSBjYW5vbmljYWwgc3BlY2lmaWNhdGlvbi5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMS4yIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTEuMi51c2VyLXByb2ZpbGUudjEubWRcbiAqL1xuXG5pbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBjcmVhdGVBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBjcmVhdGVTdWNjZXNzUmVzcG9uc2UsIGhhbmRsZUxhbWJkYUVycm9yLCBsb2dTdHJ1Y3R1cmVkIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItdXNlci1yZXBvc2l0b3J5JztcbmltcG9ydCB7IFVzZXJTZXJ2aWNlIH0gZnJvbSAnLi4vZG9tYWluL3VzZXItc2VydmljZSc7XG5cbi8vIEVudmlyb25tZW50IHZhcmlhYmxlc1xuY29uc3QgVEFCTEVfTkFNRSA9IHByb2Nlc3MuZW52LlRBQkxFX05BTUUhO1xuXG4vLyBJbml0aWFsaXplIHJlcG9zaXRvcnkgYW5kIHNlcnZpY2VcbmNvbnN0IHVzZXJSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCVXNlclJlcG9zaXRvcnkoVEFCTEVfTkFNRSk7XG5jb25zdCB1c2VyU2VydmljZSA9IG5ldyBVc2VyU2VydmljZSh1c2VyUmVwb3NpdG9yeSk7XG5cbi8qKlxuICogTGFtYmRhIGhhbmRsZXIgZm9yIEdFVCAvdXNlcnMvbWVcbiAqIFxuICogQHBhcmFtIGV2ZW50IC0gQVBJIEdhdGV3YXkgcHJveHkgZXZlbnRcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xuICBjb25zdCByZXF1ZXN0SWQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5yZXF1ZXN0SWQ7XG4gIGNvbnN0IG9yaWdpbiA9IGV2ZW50LmhlYWRlcnMub3JpZ2luIHx8IGV2ZW50LmhlYWRlcnMuT3JpZ2luO1xuICBcbiAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdQcm9jZXNzaW5nIGdldCBjdXJyZW50IHVzZXIgcmVxdWVzdCcsIHtcbiAgICByZXF1ZXN0SWQsXG4gICAgaHR0cE1ldGhvZDogZXZlbnQuaHR0cE1ldGhvZCxcbiAgICBwYXRoOiBldmVudC5wYXRoLFxuICAgIG9yaWdpbixcbiAgfSk7XG4gIFxuICB0cnkge1xuICAgIC8vIENyZWF0ZSBhdXRoZW50aWNhdGlvbiBjb250ZXh0IGZyb20gQVBJIEdhdGV3YXkgZXZlbnRcbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IGNyZWF0ZUF1dGhDb250ZXh0KGV2ZW50LnJlcXVlc3RDb250ZXh0KTtcbiAgICBcbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0F1dGhlbnRpY2F0aW9uIGNvbnRleHQgY3JlYXRlZCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgaXNBdXRoZW50aWNhdGVkOiBhdXRoQ29udGV4dC5pc0F1dGhlbnRpY2F0ZWQsXG4gICAgICBpc1NpdGVBZG1pbjogYXV0aENvbnRleHQuaXNTaXRlQWRtaW4sXG4gICAgfSk7XG4gICAgXG4gICAgLy8gR2V0IGN1cnJlbnQgdXNlciAod2l0aCBsYXp5IGNyZWF0aW9uKVxuICAgIGNvbnN0IHVzZXIgPSBhd2FpdCB1c2VyU2VydmljZS5nZXRDdXJyZW50VXNlcihhdXRoQ29udGV4dCk7XG4gICAgXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdDdXJyZW50IHVzZXIgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogdXNlci5pZCxcbiAgICAgIHN5c3RlbVJvbGU6IHVzZXIuc3lzdGVtUm9sZSxcbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4gY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHVzZXIsIHVuZGVmaW5lZCwgb3JpZ2luKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdFcnJvciBwcm9jZXNzaW5nIGdldCBjdXJyZW50IHVzZXIgcmVxdWVzdCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4gaGFuZGxlTGFtYmRhRXJyb3IoZXJyb3IsIHJlcXVlc3RJZCk7XG4gIH1cbn0iXX0=