"use strict";
/**
 * Update User Handler - Phase 1.2
 *
 * Lambda handler for PUT /users/{id} endpoint.
 * Implements user profile updates with proper authorization as defined
 * in the canonical specification.
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
 * Lambda handler for PUT /users/{id}
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing update user request', {
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
        // Parse request body
        const updateInput = (0, lambda_utils_1.parseJsonBody)(event);
        // Create enhanced authentication context with database-sourced role information
        const authContext = await (0, auth_context_1.createEnhancedAuthContext)(event.requestContext, userRepository);
        (0, lambda_utils_1.logStructured)('INFO', 'Authentication context created', {
            requestId,
            requestingUserId: authContext.userId,
            targetUserId: userId,
            isAuthenticated: authContext.isAuthenticated,
            isSiteAdmin: authContext.isSiteAdmin,
            updateFields: Object.keys(updateInput),
        });
        // Update user profile
        const updatedUser = await userService.updateUser(userId, updateInput, authContext);
        (0, lambda_utils_1.logStructured)('INFO', 'User updated successfully', {
            requestId,
            requestingUserId: authContext.userId,
            targetUserId: userId,
            updatedFields: Object.keys(updateInput),
            systemRole: updatedUser.systemRole,
        });
        return (0, lambda_utils_1.createSuccessResponse)(updatedUser);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing update user request', {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLXVzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1cGRhdGUtdXNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7OztHQVNHOzs7QUFHSCxvRUFBOEU7QUFDOUUscUVBQTRIO0FBQzVILHlEQUErRDtBQUUvRCx5RkFBb0Y7QUFDcEYseURBQXFEO0FBQ3JELGlFQUt1QztBQUV2Qyx3QkFBd0I7QUFDeEIsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFXLENBQUM7QUFFM0Msb0NBQW9DO0FBQ3BDLE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsTUFBTSxXQUFXLEdBQUcsSUFBSSwwQkFBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRXBEOzs7OztHQUtHO0FBQ0ksS0FBSyxVQUFVLE9BQU8sQ0FBQyxLQUEyQjtJQUN2RCxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztJQUVqRCxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLGdDQUFnQyxFQUFFO1FBQ3RELFNBQVM7UUFDVCxVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVU7UUFDNUIsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO0tBQ2pCLENBQUMsQ0FBQztJQUVILElBQUk7UUFDRix1Q0FBdUM7UUFDdkMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUM7UUFFeEMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE1BQU0sSUFBSSx3QkFBZSxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDbEQ7UUFFRCxxQkFBcUI7UUFDckIsTUFBTSxXQUFXLEdBQUcsSUFBQSw0QkFBYSxFQUFvQixLQUFLLENBQUMsQ0FBQztRQUU1RCxnRkFBZ0Y7UUFDaEYsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFBLHdDQUF5QixFQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFFMUYsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSxnQ0FBZ0MsRUFBRTtZQUN0RCxTQUFTO1lBQ1QsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLE1BQU07WUFDcEMsWUFBWSxFQUFFLE1BQU07WUFDcEIsZUFBZSxFQUFFLFdBQVcsQ0FBQyxlQUFlO1lBQzVDLFdBQVcsRUFBRSxXQUFXLENBQUMsV0FBVztZQUNwQyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7U0FDdkMsQ0FBQyxDQUFDO1FBRUgsc0JBQXNCO1FBQ3RCLE1BQU0sV0FBVyxHQUFHLE1BQU0sV0FBVyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRW5GLElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsMkJBQTJCLEVBQUU7WUFDakQsU0FBUztZQUNULGdCQUFnQixFQUFFLFdBQVcsQ0FBQyxNQUFNO1lBQ3BDLFlBQVksRUFBRSxNQUFNO1lBQ3BCLGFBQWEsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQztZQUN2QyxVQUFVLEVBQUUsV0FBVyxDQUFDLFVBQVU7U0FDbkMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLG9DQUFxQixFQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQzNDO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxJQUFBLDRCQUFhLEVBQUMsT0FBTyxFQUFFLHNDQUFzQyxFQUFFO1lBQzdELFNBQVM7WUFDVCxZQUFZLEVBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxFQUFFO1lBQ3RDLEtBQUssRUFBRSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlO1NBQ2hFLENBQUMsQ0FBQztRQUVILDBEQUEwRDtRQUMxRCxJQUFJLElBQUEsb0NBQW9CLEVBQUMsS0FBSyxDQUFDLEVBQUU7WUFDL0IsT0FBTztnQkFDTCxVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVU7Z0JBQzVCLE9BQU8sRUFBRTtvQkFDUCxjQUFjLEVBQUUsa0JBQWtCO29CQUNsQyw2QkFBNkIsRUFBRSxHQUFHO2lCQUNuQztnQkFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFBLGdEQUFnQyxFQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQzthQUN6RSxDQUFDO1NBQ0g7UUFFRCxPQUFPLElBQUEsZ0NBQWlCLEVBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQzVDO0FBQ0gsQ0FBQztBQWpFRCwwQkFpRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFVwZGF0ZSBVc2VyIEhhbmRsZXIgLSBQaGFzZSAxLjJcbiAqIFxuICogTGFtYmRhIGhhbmRsZXIgZm9yIFBVVCAvdXNlcnMve2lkfSBlbmRwb2ludC5cbiAqIEltcGxlbWVudHMgdXNlciBwcm9maWxlIHVwZGF0ZXMgd2l0aCBwcm9wZXIgYXV0aG9yaXphdGlvbiBhcyBkZWZpbmVkXG4gKiBpbiB0aGUgY2Fub25pY2FsIHNwZWNpZmljYXRpb24uXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDEuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0xLjIudXNlci1wcm9maWxlLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBjcmVhdGVTdWNjZXNzUmVzcG9uc2UsIGhhbmRsZUxhbWJkYUVycm9yLCBsb2dTdHJ1Y3R1cmVkLCBwYXJzZUpzb25Cb2R5IH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMvZXJyb3JzJztcbmltcG9ydCB7IFVwZGF0ZVVzZXJSZXF1ZXN0IH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3R5cGVzL2FwaSc7XG5pbXBvcnQgeyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItdXNlci1yZXBvc2l0b3J5JztcbmltcG9ydCB7IFVzZXJTZXJ2aWNlIH0gZnJvbSAnLi4vZG9tYWluL3VzZXItc2VydmljZSc7XG5pbXBvcnQgeyBcbiAgU3lzdGVtQ2FwYWJpbGl0eSwgXG4gIGhhc0NhcGFiaWxpdHksXG4gIGNyZWF0ZUF1dGhvcml6YXRpb25FcnJvclJlc3BvbnNlLFxuICBpc0F1dGhvcml6YXRpb25FcnJvciBcbn0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL2F1dGhvcml6YXRpb24nO1xuXG4vLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcbmNvbnN0IFRBQkxFX05BTUUgPSBwcm9jZXNzLmVudi5UQUJMRV9OQU1FITtcblxuLy8gSW5pdGlhbGl6ZSByZXBvc2l0b3J5IGFuZCBzZXJ2aWNlXG5jb25zdCB1c2VyUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5KFRBQkxFX05BTUUpO1xuY29uc3QgdXNlclNlcnZpY2UgPSBuZXcgVXNlclNlcnZpY2UodXNlclJlcG9zaXRvcnkpO1xuXG4vKipcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBQVVQgL3VzZXJzL3tpZH1cbiAqIFxuICogQHBhcmFtIGV2ZW50IC0gQVBJIEdhdGV3YXkgcHJveHkgZXZlbnRcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xuICBjb25zdCByZXF1ZXN0SWQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5yZXF1ZXN0SWQ7XG4gIFxuICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1Byb2Nlc3NpbmcgdXBkYXRlIHVzZXIgcmVxdWVzdCcsIHtcbiAgICByZXF1ZXN0SWQsXG4gICAgaHR0cE1ldGhvZDogZXZlbnQuaHR0cE1ldGhvZCxcbiAgICBwYXRoOiBldmVudC5wYXRoLFxuICB9KTtcbiAgXG4gIHRyeSB7XG4gICAgLy8gRXh0cmFjdCB1c2VyIElEIGZyb20gcGF0aCBwYXJhbWV0ZXJzXG4gICAgY29uc3QgdXNlcklkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LmlkO1xuICAgIFxuICAgIGlmICghdXNlcklkKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdVc2VyIElEIGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuICAgIFxuICAgIC8vIFBhcnNlIHJlcXVlc3QgYm9keVxuICAgIGNvbnN0IHVwZGF0ZUlucHV0ID0gcGFyc2VKc29uQm9keTxVcGRhdGVVc2VyUmVxdWVzdD4oZXZlbnQpO1xuICAgIFxuICAgIC8vIENyZWF0ZSBlbmhhbmNlZCBhdXRoZW50aWNhdGlvbiBjb250ZXh0IHdpdGggZGF0YWJhc2Utc291cmNlZCByb2xlIGluZm9ybWF0aW9uXG4gICAgY29uc3QgYXV0aENvbnRleHQgPSBhd2FpdCBjcmVhdGVFbmhhbmNlZEF1dGhDb250ZXh0KGV2ZW50LnJlcXVlc3RDb250ZXh0LCB1c2VyUmVwb3NpdG9yeSk7XG4gICAgXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdBdXRoZW50aWNhdGlvbiBjb250ZXh0IGNyZWF0ZWQnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICByZXF1ZXN0aW5nVXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICB0YXJnZXRVc2VySWQ6IHVzZXJJZCxcbiAgICAgIGlzQXV0aGVudGljYXRlZDogYXV0aENvbnRleHQuaXNBdXRoZW50aWNhdGVkLFxuICAgICAgaXNTaXRlQWRtaW46IGF1dGhDb250ZXh0LmlzU2l0ZUFkbWluLFxuICAgICAgdXBkYXRlRmllbGRzOiBPYmplY3Qua2V5cyh1cGRhdGVJbnB1dCksXG4gICAgfSk7XG4gICAgXG4gICAgLy8gVXBkYXRlIHVzZXIgcHJvZmlsZVxuICAgIGNvbnN0IHVwZGF0ZWRVc2VyID0gYXdhaXQgdXNlclNlcnZpY2UudXBkYXRlVXNlcih1c2VySWQsIHVwZGF0ZUlucHV0LCBhdXRoQ29udGV4dCk7XG4gICAgXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdVc2VyIHVwZGF0ZWQgc3VjY2Vzc2Z1bGx5Jywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgcmVxdWVzdGluZ1VzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgdGFyZ2V0VXNlcklkOiB1c2VySWQsXG4gICAgICB1cGRhdGVkRmllbGRzOiBPYmplY3Qua2V5cyh1cGRhdGVJbnB1dCksXG4gICAgICBzeXN0ZW1Sb2xlOiB1cGRhdGVkVXNlci5zeXN0ZW1Sb2xlLFxuICAgIH0pO1xuICAgIFxuICAgIHJldHVybiBjcmVhdGVTdWNjZXNzUmVzcG9uc2UodXBkYXRlZFVzZXIpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ1N0cnVjdHVyZWQoJ0VSUk9SJywgJ0Vycm9yIHByb2Nlc3NpbmcgdXBkYXRlIHVzZXIgcmVxdWVzdCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHRhcmdldFVzZXJJZDogZXZlbnQucGF0aFBhcmFtZXRlcnM/LmlkLFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgIH0pO1xuICAgIFxuICAgIC8vIEhhbmRsZSBhdXRob3JpemF0aW9uIGVycm9ycyB3aXRoIHByb3BlciByZXNwb25zZSBmb3JtYXRcbiAgICBpZiAoaXNBdXRob3JpemF0aW9uRXJyb3IoZXJyb3IpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShjcmVhdGVBdXRob3JpemF0aW9uRXJyb3JSZXNwb25zZShlcnJvciwgcmVxdWVzdElkKSksXG4gICAgICB9O1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gaGFuZGxlTGFtYmRhRXJyb3IoZXJyb3IsIHJlcXVlc3RJZCk7XG4gIH1cbn0iXX0=