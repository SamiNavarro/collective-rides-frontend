"use strict";
/**
 * Get User By ID Handler - Phase 1.2
 *
 * Lambda handler for GET /users/{id} endpoint.
 * Requires SiteAdmin privileges as defined in the canonical specification.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_context_1 = require("../../../shared/auth/auth-context");
const lambda_utils_1 = require("../../../shared/utils/lambda-utils");
const errors_1 = require("../../../shared/utils/errors");
const dynamodb_user_repository_1 = require("../infrastructure/dynamodb-user-repository");
const user_service_1 = require("../domain/user-service");
const authorization_1 = require("../../../shared/authorization");
// Environment variables
const TABLE_NAME = process.env.TABLE_NAME;
// Initialize repository and service
const userRepository = new dynamodb_user_repository_1.DynamoDBUserRepository(TABLE_NAME);
const userService = new user_service_1.UserService(userRepository);
/**
 * Lambda handler for GET /users/{id}
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing get user by ID request', {
        requestId,
        httpMethod: event.httpMethod,
        path: event.path,
    });
    try {
        // Extract user ID from path parameters
        const userId = event.pathParameters?.id;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        // Create enhanced authentication context with database-sourced role information
        const authContext = await (0, auth_context_1.createEnhancedAuthContext)(event.requestContext, userRepository);
        (0, lambda_utils_1.logStructured)('INFO', 'Authentication context created', {
            requestId,
            requestingUserId: authContext.userId,
            targetUserId: userId,
            isAuthenticated: authContext.isAuthenticated,
            isSiteAdmin: authContext.isSiteAdmin,
        });
        // Check authorization using the new authorization service
        await (0, authorization_1.requireCapability)(authorization_1.SystemCapability.MANAGE_ALL_CLUBS, `user:${userId}`)(authContext);
        // Get user by ID (authorization already validated)
        const user = await userService.getUserById(userId, authContext);
        (0, lambda_utils_1.logStructured)('INFO', 'User retrieved successfully', {
            requestId,
            requestingUserId: authContext.userId,
            targetUserId: userId,
            systemRole: user.systemRole,
        });
        return (0, lambda_utils_1.createSuccessResponse)(user);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing get user by ID request', {
            requestId,
            targetUserId: event.pathParameters?.id,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Handle authorization errors with proper response format
        if ((0, authorization_1.isAuthorizationError)(error)) {
            return {
                statusCode: error.statusCode,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
                body: JSON.stringify((0, authorization_1.createAuthorizationErrorResponse)(error, requestId)),
            };
        }
        return (0, lambda_utils_1.handleLambdaError)(error, requestId);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LXVzZXItYnktaWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnZXQtdXNlci1ieS1pZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUdILG9FQUE4RTtBQUM5RSxxRUFBNkc7QUFDN0cseURBQStEO0FBQy9ELHlGQUFvRjtBQUNwRix5REFBcUQ7QUFDckQsaUVBS3VDO0FBRXZDLHdCQUF3QjtBQUN4QixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVcsQ0FBQztBQUUzQyxvQ0FBb0M7QUFDcEMsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RCxNQUFNLFdBQVcsR0FBRyxJQUFJLDBCQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFcEQ7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQTJCO0lBQ3ZELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO0lBRWpELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsbUNBQW1DLEVBQUU7UUFDekQsU0FBUztRQUNULFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtRQUM1QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7S0FDakIsQ0FBQyxDQUFDO0lBRUgsSUFBSTtRQUNGLHVDQUF1QztRQUN2QyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLEVBQUUsQ0FBQztRQUV4QyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1gsTUFBTSxJQUFJLHdCQUFlLENBQUMscUJBQXFCLENBQUMsQ0FBQztTQUNsRDtRQUVELGdGQUFnRjtRQUNoRixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsd0NBQXlCLEVBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUUxRixJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLGdDQUFnQyxFQUFFO1lBQ3RELFNBQVM7WUFDVCxnQkFBZ0IsRUFBRSxXQUFXLENBQUMsTUFBTTtZQUNwQyxZQUFZLEVBQUUsTUFBTTtZQUNwQixlQUFlLEVBQUUsV0FBVyxDQUFDLGVBQWU7WUFDNUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxXQUFXO1NBQ3JDLENBQUMsQ0FBQztRQUVILDBEQUEwRDtRQUMxRCxNQUFNLElBQUEsaUNBQWlCLEVBQUMsZ0NBQWdCLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxNQUFNLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRTFGLG1EQUFtRDtRQUNuRCxNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRWhFLElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsNkJBQTZCLEVBQUU7WUFDbkQsU0FBUztZQUNULGdCQUFnQixFQUFFLFdBQVcsQ0FBQyxNQUFNO1lBQ3BDLFlBQVksRUFBRSxNQUFNO1lBQ3BCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtTQUM1QixDQUFDLENBQUM7UUFFSCxPQUFPLElBQUEsb0NBQXFCLEVBQUMsSUFBSSxDQUFDLENBQUM7S0FDcEM7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLElBQUEsNEJBQWEsRUFBQyxPQUFPLEVBQUUseUNBQXlDLEVBQUU7WUFDaEUsU0FBUztZQUNULFlBQVksRUFBRSxLQUFLLENBQUMsY0FBYyxFQUFFLEVBQUU7WUFDdEMsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsMERBQTBEO1FBQzFELElBQUksSUFBQSxvQ0FBb0IsRUFBQyxLQUFLLENBQUMsRUFBRTtZQUMvQixPQUFPO2dCQUNMLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtnQkFDNUIsT0FBTyxFQUFFO29CQUNQLGNBQWMsRUFBRSxrQkFBa0I7b0JBQ2xDLDZCQUE2QixFQUFFLEdBQUc7aUJBQ25DO2dCQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsZ0RBQWdDLEVBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2FBQ3pFLENBQUM7U0FDSDtRQUVELE9BQU8sSUFBQSxnQ0FBaUIsRUFBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDNUM7QUFDSCxDQUFDO0FBL0RELDBCQStEQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogR2V0IFVzZXIgQnkgSUQgSGFuZGxlciAtIFBoYXNlIDEuMlxuICogXG4gKiBMYW1iZGEgaGFuZGxlciBmb3IgR0VUIC91c2Vycy97aWR9IGVuZHBvaW50LlxuICogUmVxdWlyZXMgU2l0ZUFkbWluIHByaXZpbGVnZXMgYXMgZGVmaW5lZCBpbiB0aGUgY2Fub25pY2FsIHNwZWNpZmljYXRpb24uXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDEuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0xLjIudXNlci1wcm9maWxlLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBjcmVhdGVTdWNjZXNzUmVzcG9uc2UsIGhhbmRsZUxhbWJkYUVycm9yLCBsb2dTdHJ1Y3R1cmVkIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMvZXJyb3JzJztcbmltcG9ydCB7IER5bmFtb0RCVXNlclJlcG9zaXRvcnkgfSBmcm9tICcuLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi11c2VyLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgVXNlclNlcnZpY2UgfSBmcm9tICcuLi9kb21haW4vdXNlci1zZXJ2aWNlJztcbmltcG9ydCB7IFxuICBTeXN0ZW1DYXBhYmlsaXR5LCBcbiAgcmVxdWlyZUNhcGFiaWxpdHksXG4gIGNyZWF0ZUF1dGhvcml6YXRpb25FcnJvclJlc3BvbnNlLFxuICBpc0F1dGhvcml6YXRpb25FcnJvciBcbn0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL2F1dGhvcml6YXRpb24nO1xuXG4vLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcbmNvbnN0IFRBQkxFX05BTUUgPSBwcm9jZXNzLmVudi5UQUJMRV9OQU1FITtcblxuLy8gSW5pdGlhbGl6ZSByZXBvc2l0b3J5IGFuZCBzZXJ2aWNlXG5jb25zdCB1c2VyUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5KFRBQkxFX05BTUUpO1xuY29uc3QgdXNlclNlcnZpY2UgPSBuZXcgVXNlclNlcnZpY2UodXNlclJlcG9zaXRvcnkpO1xuXG4vKipcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBHRVQgL3VzZXJzL3tpZH1cbiAqIFxuICogQHBhcmFtIGV2ZW50IC0gQVBJIEdhdGV3YXkgcHJveHkgZXZlbnRcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xuICBjb25zdCByZXF1ZXN0SWQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5yZXF1ZXN0SWQ7XG4gIFxuICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1Byb2Nlc3NpbmcgZ2V0IHVzZXIgYnkgSUQgcmVxdWVzdCcsIHtcbiAgICByZXF1ZXN0SWQsXG4gICAgaHR0cE1ldGhvZDogZXZlbnQuaHR0cE1ldGhvZCxcbiAgICBwYXRoOiBldmVudC5wYXRoLFxuICB9KTtcbiAgXG4gIHRyeSB7XG4gICAgLy8gRXh0cmFjdCB1c2VyIElEIGZyb20gcGF0aCBwYXJhbWV0ZXJzXG4gICAgY29uc3QgdXNlcklkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LmlkO1xuICAgIFxuICAgIGlmICghdXNlcklkKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdVc2VyIElEIGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuICAgIFxuICAgIC8vIENyZWF0ZSBlbmhhbmNlZCBhdXRoZW50aWNhdGlvbiBjb250ZXh0IHdpdGggZGF0YWJhc2Utc291cmNlZCByb2xlIGluZm9ybWF0aW9uXG4gICAgY29uc3QgYXV0aENvbnRleHQgPSBhd2FpdCBjcmVhdGVFbmhhbmNlZEF1dGhDb250ZXh0KGV2ZW50LnJlcXVlc3RDb250ZXh0LCB1c2VyUmVwb3NpdG9yeSk7XG4gICAgXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdBdXRoZW50aWNhdGlvbiBjb250ZXh0IGNyZWF0ZWQnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICByZXF1ZXN0aW5nVXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICB0YXJnZXRVc2VySWQ6IHVzZXJJZCxcbiAgICAgIGlzQXV0aGVudGljYXRlZDogYXV0aENvbnRleHQuaXNBdXRoZW50aWNhdGVkLFxuICAgICAgaXNTaXRlQWRtaW46IGF1dGhDb250ZXh0LmlzU2l0ZUFkbWluLFxuICAgIH0pO1xuICAgIFxuICAgIC8vIENoZWNrIGF1dGhvcml6YXRpb24gdXNpbmcgdGhlIG5ldyBhdXRob3JpemF0aW9uIHNlcnZpY2VcbiAgICBhd2FpdCByZXF1aXJlQ2FwYWJpbGl0eShTeXN0ZW1DYXBhYmlsaXR5Lk1BTkFHRV9BTExfQ0xVQlMsIGB1c2VyOiR7dXNlcklkfWApKGF1dGhDb250ZXh0KTtcbiAgICBcbiAgICAvLyBHZXQgdXNlciBieSBJRCAoYXV0aG9yaXphdGlvbiBhbHJlYWR5IHZhbGlkYXRlZClcbiAgICBjb25zdCB1c2VyID0gYXdhaXQgdXNlclNlcnZpY2UuZ2V0VXNlckJ5SWQodXNlcklkLCBhdXRoQ29udGV4dCk7XG4gICAgXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdVc2VyIHJldHJpZXZlZCBzdWNjZXNzZnVsbHknLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICByZXF1ZXN0aW5nVXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICB0YXJnZXRVc2VySWQ6IHVzZXJJZCxcbiAgICAgIHN5c3RlbVJvbGU6IHVzZXIuc3lzdGVtUm9sZSxcbiAgICB9KTtcbiAgICBcbiAgICByZXR1cm4gY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHVzZXIpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ1N0cnVjdHVyZWQoJ0VSUk9SJywgJ0Vycm9yIHByb2Nlc3NpbmcgZ2V0IHVzZXIgYnkgSUQgcmVxdWVzdCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHRhcmdldFVzZXJJZDogZXZlbnQucGF0aFBhcmFtZXRlcnM/LmlkLFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgIH0pO1xuICAgIFxuICAgIC8vIEhhbmRsZSBhdXRob3JpemF0aW9uIGVycm9ycyB3aXRoIHByb3BlciByZXNwb25zZSBmb3JtYXRcbiAgICBpZiAoaXNBdXRob3JpemF0aW9uRXJyb3IoZXJyb3IpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShjcmVhdGVBdXRob3JpemF0aW9uRXJyb3JSZXNwb25zZShlcnJvciwgcmVxdWVzdElkKSksXG4gICAgICB9O1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gaGFuZGxlTGFtYmRhRXJyb3IoZXJyb3IsIHJlcXVlc3RJZCk7XG4gIH1cbn0iXX0=