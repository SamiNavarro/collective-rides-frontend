"use strict";
/**
 * List User Invitations Handler - Phase 2.2
 *
 * Lambda handler for GET /v1/users/me/invitations endpoint.
 * Returns the authenticated user's pending invitations.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const invitation_1 = require("../../../../shared/types/invitation");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const errors_1 = require("../../../../shared/utils/errors");
const dynamodb_user_repository_1 = require("../../../user-profile/infrastructure/dynamodb-user-repository");
const dynamodb_club_repository_1 = require("../../infrastructure/dynamodb-club-repository");
const dynamodb_membership_repository_1 = require("../../infrastructure/dynamodb-membership-repository");
const dynamodb_invitation_repository_1 = require("../../infrastructure/dynamodb-invitation-repository");
const invitation_service_1 = require("../../domain/invitation/invitation-service");
const authorization_service_1 = require("../../../../shared/authorization/authorization-service");
// Environment variables
const TABLE_NAME = process.env.TABLE_NAME;
// Initialize repositories and services
const userRepository = new dynamodb_user_repository_1.DynamoDBUserRepository(TABLE_NAME);
const clubRepository = new dynamodb_club_repository_1.DynamoDBClubRepository(TABLE_NAME);
const membershipRepository = new dynamodb_membership_repository_1.DynamoDBMembershipRepository(TABLE_NAME, userRepository);
const invitationRepository = new dynamodb_invitation_repository_1.DynamoDBInvitationRepository(TABLE_NAME);
const invitationService = new invitation_service_1.InvitationService(invitationRepository, membershipRepository, clubRepository, userRepository, authorization_service_1.authorizationService);
/**
 * Lambda handler for GET /v1/users/me/invitations
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing list user invitations request', {
        requestId,
        httpMethod: event.httpMethod,
        path: event.path,
    });
    try {
        // Parse query parameters
        const queryParams = event.queryStringParameters || {};
        // Parse limit
        let limit = invitation_1.INVITATION_CONSTRAINTS.DEFAULT_LIST_LIMIT;
        if (queryParams.limit) {
            const parsedLimit = parseInt(queryParams.limit, 10);
            if (isNaN(parsedLimit) || parsedLimit < 1) {
                throw new errors_1.ValidationError('Limit must be a positive integer');
            }
            if (parsedLimit > invitation_1.INVITATION_CONSTRAINTS.MAX_LIST_LIMIT) {
                throw new errors_1.ValidationError(`Limit cannot exceed ${invitation_1.INVITATION_CONSTRAINTS.MAX_LIST_LIMIT}`);
            }
            limit = parsedLimit;
        }
        // Parse status filter
        let status;
        if (queryParams.status) {
            if (!Object.values(invitation_1.InvitationStatus).includes(queryParams.status)) {
                throw new errors_1.ValidationError('Invalid status parameter');
            }
            status = queryParams.status;
        }
        // Parse cursor
        const cursor = queryParams.cursor || undefined;
        // Create enhanced authentication context
        const authContext = await (0, auth_context_1.createEnhancedAuthContext)(event.requestContext, userRepository);
        (0, lambda_utils_1.logStructured)('INFO', 'Authentication context created', {
            requestId,
            userId: authContext.userId,
            isAuthenticated: authContext.isAuthenticated,
            limit,
            status,
        });
        // Validate user is authenticated
        if (!authContext.isAuthenticated) {
            throw new errors_1.ValidationError('Authentication required');
        }
        // Get user's invitations
        const result = await invitationService.getUserInvitations(authContext, {
            limit,
            status,
            cursor,
        });
        (0, lambda_utils_1.logStructured)('INFO', 'User invitations retrieved successfully', {
            requestId,
            userId: authContext.userId,
            invitationCount: result.invitations.length,
            hasNextCursor: !!result.nextCursor,
            status,
        });
        // Format response
        const response = {
            success: true,
            data: result.invitations,
            pagination: {
                limit,
                nextCursor: result.nextCursor,
            },
            timestamp: new Date().toISOString(),
        };
        return (0, lambda_utils_1.createSuccessResponse)(response);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing list user invitations request', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1pbnZpdGF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxpc3QtaW52aXRhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7QUFHSCxvRUFBK0Y7QUFDL0YsdUVBQWlGO0FBQ2pGLHdFQUFnSDtBQUNoSCw0REFBa0U7QUFDbEUsNEdBQXVHO0FBQ3ZHLDRGQUF1RjtBQUN2Rix3R0FBbUc7QUFDbkcsd0dBQW1HO0FBQ25HLG1GQUErRTtBQUMvRSxrR0FBOEY7QUFFOUYsd0JBQXdCO0FBQ3hCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVyxDQUFDO0FBRTNDLHVDQUF1QztBQUN2QyxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlELE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDZEQUE0QixDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUMxRixNQUFNLG9CQUFvQixHQUFHLElBQUksNkRBQTRCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDMUUsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLHNDQUFpQixDQUM3QyxvQkFBb0IsRUFDcEIsb0JBQW9CLEVBQ3BCLGNBQWMsRUFDZCxjQUFjLEVBQ2QsNENBQW9CLENBQ3JCLENBQUM7QUFFRjs7Ozs7R0FLRztBQUNJLEtBQUssVUFBVSxPQUFPLENBQUMsS0FBMkI7SUFDdkQsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUM7SUFFakQsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSwwQ0FBMEMsRUFBRTtRQUNoRSxTQUFTO1FBQ1QsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO1FBQzVCLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtLQUNqQixDQUFDLENBQUM7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QUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlO1NBQ2hFLENBQUMsQ0FBQztRQUVILE9BQU8sSUFBQSxnQ0FBaUIsRUFBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDNUM7QUFDSCxDQUFDO0FBekZELDBCQXlGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTGlzdCBVc2VyIEludml0YXRpb25zIEhhbmRsZXIgLSBQaGFzZSAyLjJcbiAqIFxuICogTGFtYmRhIGhhbmRsZXIgZm9yIEdFVCAvdjEvdXNlcnMvbWUvaW52aXRhdGlvbnMgZW5kcG9pbnQuXG4gKiBSZXR1cm5zIHRoZSBhdXRoZW50aWNhdGVkIHVzZXIncyBwZW5kaW5nIGludml0YXRpb25zLlxuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBQaGFzZSAyLjIgU3BlYzogLmtpcm8vc3BlY3MvcGhhc2UtMi4yLmNsdWItbWVtYmVyc2hpcC1yb2xlcy52MS5tZFxuICovXG5cbmltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IEludml0YXRpb25TdGF0dXMsIElOVklUQVRJT05fQ09OU1RSQUlOVFMgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvaW52aXRhdGlvbic7XG5pbXBvcnQgeyBjcmVhdGVFbmhhbmNlZEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGgvYXV0aC1jb250ZXh0JztcbmltcG9ydCB7IGNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSwgaGFuZGxlTGFtYmRhRXJyb3IsIGxvZ1N0cnVjdHVyZWQgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9lcnJvcnMnO1xuaW1wb3J0IHsgRHluYW1vREJVc2VyUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uLy4uL3VzZXItcHJvZmlsZS9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi11c2VyLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJDbHViUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLWNsdWItcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBEeW5hbW9EQk1lbWJlcnNoaXBSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItbWVtYmVyc2hpcC1yZXBvc2l0b3J5JztcbmltcG9ydCB7IER5bmFtb0RCSW52aXRhdGlvblJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1pbnZpdGF0aW9uLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgSW52aXRhdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vaW52aXRhdGlvbi9pbnZpdGF0aW9uLXNlcnZpY2UnO1xuaW1wb3J0IHsgYXV0aG9yaXphdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvYXV0aG9yaXphdGlvbi9hdXRob3JpemF0aW9uLXNlcnZpY2UnO1xuXG4vLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcbmNvbnN0IFRBQkxFX05BTUUgPSBwcm9jZXNzLmVudi5UQUJMRV9OQU1FITtcblxuLy8gSW5pdGlhbGl6ZSByZXBvc2l0b3JpZXMgYW5kIHNlcnZpY2VzXG5jb25zdCB1c2VyUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5KFRBQkxFX05BTUUpO1xuY29uc3QgY2x1YlJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJDbHViUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IG1lbWJlcnNoaXBSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCTWVtYmVyc2hpcFJlcG9zaXRvcnkoVEFCTEVfTkFNRSwgdXNlclJlcG9zaXRvcnkpO1xuY29uc3QgaW52aXRhdGlvblJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJJbnZpdGF0aW9uUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IGludml0YXRpb25TZXJ2aWNlID0gbmV3IEludml0YXRpb25TZXJ2aWNlKFxuICBpbnZpdGF0aW9uUmVwb3NpdG9yeSxcbiAgbWVtYmVyc2hpcFJlcG9zaXRvcnksXG4gIGNsdWJSZXBvc2l0b3J5LFxuICB1c2VyUmVwb3NpdG9yeSxcbiAgYXV0aG9yaXphdGlvblNlcnZpY2Vcbik7XG5cbi8qKlxuICogTGFtYmRhIGhhbmRsZXIgZm9yIEdFVCAvdjEvdXNlcnMvbWUvaW52aXRhdGlvbnNcbiAqIFxuICogQHBhcmFtIGV2ZW50IC0gQVBJIEdhdGV3YXkgcHJveHkgZXZlbnRcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xuICBjb25zdCByZXF1ZXN0SWQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5yZXF1ZXN0SWQ7XG5cbiAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdQcm9jZXNzaW5nIGxpc3QgdXNlciBpbnZpdGF0aW9ucyByZXF1ZXN0Jywge1xuICAgIHJlcXVlc3RJZCxcbiAgICBodHRwTWV0aG9kOiBldmVudC5odHRwTWV0aG9kLFxuICAgIHBhdGg6IGV2ZW50LnBhdGgsXG4gIH0pO1xuXG4gIHRyeSB7XG4gICAgLy8gUGFyc2UgcXVlcnkgcGFyYW1ldGVyc1xuICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZXZlbnQucXVlcnlTdHJpbmdQYXJhbWV0ZXJzIHx8IHt9O1xuXG4gICAgLy8gUGFyc2UgbGltaXRcbiAgICBsZXQgbGltaXQ6IG51bWJlciA9IElOVklUQVRJT05fQ09OU1RSQUlOVFMuREVGQVVMVF9MSVNUX0xJTUlUO1xuICAgIGlmIChxdWVyeVBhcmFtcy5saW1pdCkge1xuICAgICAgY29uc3QgcGFyc2VkTGltaXQgPSBwYXJzZUludChxdWVyeVBhcmFtcy5saW1pdCwgMTApO1xuICAgICAgaWYgKGlzTmFOKHBhcnNlZExpbWl0KSB8fCBwYXJzZWRMaW1pdCA8IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignTGltaXQgbXVzdCBiZSBhIHBvc2l0aXZlIGludGVnZXInKTtcbiAgICAgIH1cbiAgICAgIGlmIChwYXJzZWRMaW1pdCA+IElOVklUQVRJT05fQ09OU1RSQUlOVFMuTUFYX0xJU1RfTElNSVQpIHtcbiAgICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcihgTGltaXQgY2Fubm90IGV4Y2VlZCAke0lOVklUQVRJT05fQ09OU1RSQUlOVFMuTUFYX0xJU1RfTElNSVR9YCk7XG4gICAgICB9XG4gICAgICBsaW1pdCA9IHBhcnNlZExpbWl0O1xuICAgIH1cblxuICAgIC8vIFBhcnNlIHN0YXR1cyBmaWx0ZXJcbiAgICBsZXQgc3RhdHVzOiBJbnZpdGF0aW9uU3RhdHVzIHwgdW5kZWZpbmVkO1xuICAgIGlmIChxdWVyeVBhcmFtcy5zdGF0dXMpIHtcbiAgICAgIGlmICghT2JqZWN0LnZhbHVlcyhJbnZpdGF0aW9uU3RhdHVzKS5pbmNsdWRlcyhxdWVyeVBhcmFtcy5zdGF0dXMgYXMgSW52aXRhdGlvblN0YXR1cykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignSW52YWxpZCBzdGF0dXMgcGFyYW1ldGVyJyk7XG4gICAgICB9XG4gICAgICBzdGF0dXMgPSBxdWVyeVBhcmFtcy5zdGF0dXMgYXMgSW52aXRhdGlvblN0YXR1cztcbiAgICB9XG5cbiAgICAvLyBQYXJzZSBjdXJzb3JcbiAgICBjb25zdCBjdXJzb3IgPSBxdWVyeVBhcmFtcy5jdXJzb3IgfHwgdW5kZWZpbmVkO1xuXG4gICAgLy8gQ3JlYXRlIGVuaGFuY2VkIGF1dGhlbnRpY2F0aW9uIGNvbnRleHRcbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IGF3YWl0IGNyZWF0ZUVuaGFuY2VkQXV0aENvbnRleHQoZXZlbnQucmVxdWVzdENvbnRleHQsIHVzZXJSZXBvc2l0b3J5KTtcblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnQXV0aGVudGljYXRpb24gY29udGV4dCBjcmVhdGVkJywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBpc0F1dGhlbnRpY2F0ZWQ6IGF1dGhDb250ZXh0LmlzQXV0aGVudGljYXRlZCxcbiAgICAgIGxpbWl0LFxuICAgICAgc3RhdHVzLFxuICAgIH0pO1xuXG4gICAgLy8gVmFsaWRhdGUgdXNlciBpcyBhdXRoZW50aWNhdGVkXG4gICAgaWYgKCFhdXRoQ29udGV4dC5pc0F1dGhlbnRpY2F0ZWQpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0F1dGhlbnRpY2F0aW9uIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgLy8gR2V0IHVzZXIncyBpbnZpdGF0aW9uc1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGludml0YXRpb25TZXJ2aWNlLmdldFVzZXJJbnZpdGF0aW9ucyhhdXRoQ29udGV4dCwge1xuICAgICAgbGltaXQsXG4gICAgICBzdGF0dXMsXG4gICAgICBjdXJzb3IsXG4gICAgfSk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1VzZXIgaW52aXRhdGlvbnMgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgaW52aXRhdGlvbkNvdW50OiByZXN1bHQuaW52aXRhdGlvbnMubGVuZ3RoLFxuICAgICAgaGFzTmV4dEN1cnNvcjogISFyZXN1bHQubmV4dEN1cnNvcixcbiAgICAgIHN0YXR1cyxcbiAgICB9KTtcblxuICAgIC8vIEZvcm1hdCByZXNwb25zZVxuICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHJlc3VsdC5pbnZpdGF0aW9ucyxcbiAgICAgIHBhZ2luYXRpb246IHtcbiAgICAgICAgbGltaXQsXG4gICAgICAgIG5leHRDdXJzb3I6IHJlc3VsdC5uZXh0Q3Vyc29yLFxuICAgICAgfSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICByZXR1cm4gY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdFcnJvciBwcm9jZXNzaW5nIGxpc3QgdXNlciBpbnZpdGF0aW9ucyByZXF1ZXN0Jywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGhhbmRsZUxhbWJkYUVycm9yKGVycm9yLCByZXF1ZXN0SWQpO1xuICB9XG59Il19