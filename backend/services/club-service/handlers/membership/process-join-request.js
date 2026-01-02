"use strict";
/**
 * Process Join Request Handler - Phase 2.2
 *
 * Lambda handler for PUT /v1/clubs/{id}/requests/{membershipId} endpoint.
 * Allows club admins to approve or reject join requests.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const club_authorization_1 = require("../../../../shared/types/club-authorization");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const errors_1 = require("../../../../shared/utils/errors");
const dynamodb_user_repository_1 = require("../../../user-profile/infrastructure/dynamodb-user-repository");
const dynamodb_club_repository_1 = require("../../infrastructure/dynamodb-club-repository");
const dynamodb_membership_repository_1 = require("../../infrastructure/dynamodb-membership-repository");
const dynamodb_invitation_repository_1 = require("../../infrastructure/dynamodb-invitation-repository");
const invitation_service_1 = require("../../domain/invitation/invitation-service");
const club_authorization_2 = require("../../domain/authorization/club-authorization");
const authorization_service_1 = require("../../../../shared/authorization/authorization-service");
// Environment variables
const TABLE_NAME = process.env.TABLE_NAME;
// Initialize repositories and services
const userRepository = new dynamodb_user_repository_1.DynamoDBUserRepository(TABLE_NAME);
const clubRepository = new dynamodb_club_repository_1.DynamoDBClubRepository(TABLE_NAME);
const membershipRepository = new dynamodb_membership_repository_1.DynamoDBMembershipRepository(TABLE_NAME, userRepository);
const invitationRepository = new dynamodb_invitation_repository_1.DynamoDBInvitationRepository(TABLE_NAME);
const invitationService = new invitation_service_1.InvitationService(invitationRepository, membershipRepository, clubRepository, userRepository, authorization_service_1.authorizationService);
const authService = new club_authorization_2.ClubAuthorizationService(membershipRepository, authorization_service_1.authorizationService);
/**
 * Lambda handler for PUT /v1/clubs/{id}/requests/{membershipId}
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing join request', {
        requestId,
        httpMethod: event.httpMethod,
        path: event.path,
    });
    try {
        // Extract club ID and membership ID from path parameters
        const clubId = event.pathParameters?.clubId;
        const membershipId = event.pathParameters?.membershipId;
        if (!clubId) {
            throw new errors_1.ValidationError('Club ID is required');
        }
        if (!membershipId) {
            throw new errors_1.ValidationError('Membership ID is required');
        }
        // Parse request body
        const processInput = (0, lambda_utils_1.parseJsonBody)(event);
        if (!processInput) {
            throw new errors_1.ValidationError('Request body is required');
        }
        if (!['approve', 'reject'].includes(processInput.action)) {
            throw new errors_1.ValidationError('Action must be either "approve" or "reject"');
        }
        // Create enhanced authentication context
        const authContext = await (0, auth_context_1.createEnhancedAuthContext)(event.requestContext, userRepository);
        (0, lambda_utils_1.logStructured)('INFO', 'Authentication context created', {
            requestId,
            userId: authContext.userId,
            clubId,
            membershipId,
            action: processInput.action,
            isAuthenticated: authContext.isAuthenticated,
        });
        // Check authorization - requires manage_join_requests capability
        await authService.requireClubCapability(authContext, clubId, club_authorization_1.ClubCapability.MANAGE_JOIN_REQUESTS);
        (0, lambda_utils_1.logStructured)('INFO', 'Authorization successful', {
            requestId,
            userId: authContext.userId,
            clubId,
            capability: club_authorization_1.ClubCapability.MANAGE_JOIN_REQUESTS,
        });
        // Process join request
        const membership = await invitationService.processJoinRequest(membershipId, processInput, authContext);
        (0, lambda_utils_1.logStructured)('INFO', 'Join request processed successfully', {
            requestId,
            userId: authContext.userId,
            clubId,
            membershipId,
            action: processInput.action,
            newStatus: membership.status,
        });
        // Format response
        const response = {
            success: true,
            data: {
                membershipId: membership.membershipId,
                status: membership.status,
                processedAt: membership.processedAt,
                processedBy: membership.processedBy,
                message: processInput.message,
            },
            message: processInput.action === 'approve' ? 'Join request approved' : 'Join request rejected',
            timestamp: new Date().toISOString(),
        };
        return (0, lambda_utils_1.createSuccessResponse)(response);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing join request', {
            requestId,
            clubId: event.pathParameters?.clubId,
            membershipId: event.pathParameters?.membershipId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzcy1qb2luLXJlcXVlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwcm9jZXNzLWpvaW4tcmVxdWVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUlILG9GQUE2RTtBQUM3RSx1RUFBaUY7QUFDakYsd0VBQStIO0FBQy9ILDREQUFrRTtBQUNsRSw0R0FBdUc7QUFDdkcsNEZBQXVGO0FBQ3ZGLHdHQUFtRztBQUNuRyx3R0FBbUc7QUFDbkcsbUZBQStFO0FBQy9FLHNGQUF5RjtBQUN6RixrR0FBOEY7QUFFOUYsd0JBQXdCO0FBQ3hCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVyxDQUFDO0FBRTNDLHVDQUF1QztBQUN2QyxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlELE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDZEQUE0QixDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUMxRixNQUFNLG9CQUFvQixHQUFHLElBQUksNkRBQTRCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDMUUsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLHNDQUFpQixDQUM3QyxvQkFBb0IsRUFDcEIsb0JBQW9CLEVBQ3BCLGNBQWMsRUFDZCxjQUFjLEVBQ2QsNENBQW9CLENBQ3JCLENBQUM7QUFDRixNQUFNLFdBQVcsR0FBRyxJQUFJLDZDQUF3QixDQUFDLG9CQUFvQixFQUFFLDRDQUFvQixDQUFDLENBQUM7QUFFN0Y7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQTJCO0lBQ3ZELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO0lBRWpELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUseUJBQXlCLEVBQUU7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RUYsT0FBTyxJQUFBLG9DQUFxQixFQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ3hDO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxJQUFBLDRCQUFhLEVBQUMsT0FBTyxFQUFFLCtCQUErQixFQUFFO1lBQ3RELFNBQVM7WUFDVCxNQUFNLEVBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxNQUFNO1lBQ3BDLFlBQVksRUFBRSxLQUFLLENBQUMsY0FBYyxFQUFFLFlBQVk7WUFDaEQsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLGdDQUFpQixFQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztLQUM1QztBQUNILENBQUM7QUE1RkQsMEJBNEZDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBQcm9jZXNzIEpvaW4gUmVxdWVzdCBIYW5kbGVyIC0gUGhhc2UgMi4yXG4gKiBcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBQVVQgL3YxL2NsdWJzL3tpZH0vcmVxdWVzdHMve21lbWJlcnNoaXBJZH0gZW5kcG9pbnQuXG4gKiBBbGxvd3MgY2x1YiBhZG1pbnMgdG8gYXBwcm92ZSBvciByZWplY3Qgam9pbiByZXF1ZXN0cy5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMi4yIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTIuMi5jbHViLW1lbWJlcnNoaXAtcm9sZXMudjEubWRcbiAqL1xuXG5pbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBQcm9jZXNzSm9pblJlcXVlc3RJbnB1dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9pbnZpdGF0aW9uJztcbmltcG9ydCB7IENsdWJDYXBhYmlsaXR5IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL2NsdWItYXV0aG9yaXphdGlvbic7XG5pbXBvcnQgeyBjcmVhdGVFbmhhbmNlZEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGgvYXV0aC1jb250ZXh0JztcbmltcG9ydCB7IGNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSwgaGFuZGxlTGFtYmRhRXJyb3IsIGxvZ1N0cnVjdHVyZWQsIHBhcnNlSnNvbkJvZHkgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9lcnJvcnMnO1xuaW1wb3J0IHsgRHluYW1vREJVc2VyUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uLy4uL3VzZXItcHJvZmlsZS9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi11c2VyLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJDbHViUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLWNsdWItcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBEeW5hbW9EQk1lbWJlcnNoaXBSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItbWVtYmVyc2hpcC1yZXBvc2l0b3J5JztcbmltcG9ydCB7IER5bmFtb0RCSW52aXRhdGlvblJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1pbnZpdGF0aW9uLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgSW52aXRhdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vaW52aXRhdGlvbi9pbnZpdGF0aW9uLXNlcnZpY2UnO1xuaW1wb3J0IHsgQ2x1YkF1dGhvcml6YXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2F1dGhvcml6YXRpb24vY2x1Yi1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IGF1dGhvcml6YXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGhvcml6YXRpb24vYXV0aG9yaXphdGlvbi1zZXJ2aWNlJztcblxuLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXG5jb25zdCBUQUJMRV9OQU1FID0gcHJvY2Vzcy5lbnYuVEFCTEVfTkFNRSE7XG5cbi8vIEluaXRpYWxpemUgcmVwb3NpdG9yaWVzIGFuZCBzZXJ2aWNlc1xuY29uc3QgdXNlclJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJVc2VyUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IGNsdWJSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkoVEFCTEVfTkFNRSk7XG5jb25zdCBtZW1iZXJzaGlwUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQk1lbWJlcnNoaXBSZXBvc2l0b3J5KFRBQkxFX05BTUUsIHVzZXJSZXBvc2l0b3J5KTtcbmNvbnN0IGludml0YXRpb25SZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCSW52aXRhdGlvblJlcG9zaXRvcnkoVEFCTEVfTkFNRSk7XG5jb25zdCBpbnZpdGF0aW9uU2VydmljZSA9IG5ldyBJbnZpdGF0aW9uU2VydmljZShcbiAgaW52aXRhdGlvblJlcG9zaXRvcnksXG4gIG1lbWJlcnNoaXBSZXBvc2l0b3J5LFxuICBjbHViUmVwb3NpdG9yeSxcbiAgdXNlclJlcG9zaXRvcnksXG4gIGF1dGhvcml6YXRpb25TZXJ2aWNlXG4pO1xuY29uc3QgYXV0aFNlcnZpY2UgPSBuZXcgQ2x1YkF1dGhvcml6YXRpb25TZXJ2aWNlKG1lbWJlcnNoaXBSZXBvc2l0b3J5LCBhdXRob3JpemF0aW9uU2VydmljZSk7XG5cbi8qKlxuICogTGFtYmRhIGhhbmRsZXIgZm9yIFBVVCAvdjEvY2x1YnMve2lkfS9yZXF1ZXN0cy97bWVtYmVyc2hpcElkfVxuICogXG4gKiBAcGFyYW0gZXZlbnQgLSBBUEkgR2F0ZXdheSBwcm94eSBldmVudFxuICogQHJldHVybnMgQVBJIEdhdGV3YXkgcHJveHkgcmVzdWx0XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCk6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiB7XG4gIGNvbnN0IHJlcXVlc3RJZCA9IGV2ZW50LnJlcXVlc3RDb250ZXh0LnJlcXVlc3RJZDtcbiAgXG4gIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnUHJvY2Vzc2luZyBqb2luIHJlcXVlc3QnLCB7XG4gICAgcmVxdWVzdElkLFxuICAgIGh0dHBNZXRob2Q6IGV2ZW50Lmh0dHBNZXRob2QsXG4gICAgcGF0aDogZXZlbnQucGF0aCxcbiAgfSk7XG4gIFxuICB0cnkge1xuICAgIC8vIEV4dHJhY3QgY2x1YiBJRCBhbmQgbWVtYmVyc2hpcCBJRCBmcm9tIHBhdGggcGFyYW1ldGVyc1xuICAgIGNvbnN0IGNsdWJJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5jbHViSWQ7XG4gICAgY29uc3QgbWVtYmVyc2hpcElkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/Lm1lbWJlcnNoaXBJZDtcbiAgICBcbiAgICBpZiAoIWNsdWJJZCkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignQ2x1YiBJRCBpcyByZXF1aXJlZCcpO1xuICAgIH1cblxuICAgIGlmICghbWVtYmVyc2hpcElkKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdNZW1iZXJzaGlwIElEIGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgLy8gUGFyc2UgcmVxdWVzdCBib2R5XG4gICAgY29uc3QgcHJvY2Vzc0lucHV0ID0gcGFyc2VKc29uQm9keTxQcm9jZXNzSm9pblJlcXVlc3RJbnB1dD4oZXZlbnQpO1xuXG4gICAgaWYgKCFwcm9jZXNzSW5wdXQpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1JlcXVlc3QgYm9keSBpcyByZXF1aXJlZCcpO1xuICAgIH1cblxuICAgIGlmICghWydhcHByb3ZlJywgJ3JlamVjdCddLmluY2x1ZGVzKHByb2Nlc3NJbnB1dC5hY3Rpb24pKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdBY3Rpb24gbXVzdCBiZSBlaXRoZXIgXCJhcHByb3ZlXCIgb3IgXCJyZWplY3RcIicpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBlbmhhbmNlZCBhdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gICAgY29uc3QgYXV0aENvbnRleHQgPSBhd2FpdCBjcmVhdGVFbmhhbmNlZEF1dGhDb250ZXh0KGV2ZW50LnJlcXVlc3RDb250ZXh0LCB1c2VyUmVwb3NpdG9yeSk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0F1dGhlbnRpY2F0aW9uIGNvbnRleHQgY3JlYXRlZCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgY2x1YklkLFxuICAgICAgbWVtYmVyc2hpcElkLFxuICAgICAgYWN0aW9uOiBwcm9jZXNzSW5wdXQuYWN0aW9uLFxuICAgICAgaXNBdXRoZW50aWNhdGVkOiBhdXRoQ29udGV4dC5pc0F1dGhlbnRpY2F0ZWQsXG4gICAgfSk7XG5cbiAgICAvLyBDaGVjayBhdXRob3JpemF0aW9uIC0gcmVxdWlyZXMgbWFuYWdlX2pvaW5fcmVxdWVzdHMgY2FwYWJpbGl0eVxuICAgIGF3YWl0IGF1dGhTZXJ2aWNlLnJlcXVpcmVDbHViQ2FwYWJpbGl0eShhdXRoQ29udGV4dCwgY2x1YklkLCBDbHViQ2FwYWJpbGl0eS5NQU5BR0VfSk9JTl9SRVFVRVNUUyk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0F1dGhvcml6YXRpb24gc3VjY2Vzc2Z1bCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgY2x1YklkLFxuICAgICAgY2FwYWJpbGl0eTogQ2x1YkNhcGFiaWxpdHkuTUFOQUdFX0pPSU5fUkVRVUVTVFMsXG4gICAgfSk7XG5cbiAgICAvLyBQcm9jZXNzIGpvaW4gcmVxdWVzdFxuICAgIGNvbnN0IG1lbWJlcnNoaXAgPSBhd2FpdCBpbnZpdGF0aW9uU2VydmljZS5wcm9jZXNzSm9pblJlcXVlc3QobWVtYmVyc2hpcElkLCBwcm9jZXNzSW5wdXQsIGF1dGhDb250ZXh0KTtcblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnSm9pbiByZXF1ZXN0IHByb2Nlc3NlZCBzdWNjZXNzZnVsbHknLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGNsdWJJZCxcbiAgICAgIG1lbWJlcnNoaXBJZCxcbiAgICAgIGFjdGlvbjogcHJvY2Vzc0lucHV0LmFjdGlvbixcbiAgICAgIG5ld1N0YXR1czogbWVtYmVyc2hpcC5zdGF0dXMsXG4gICAgfSk7XG5cbiAgICAvLyBGb3JtYXQgcmVzcG9uc2VcbiAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIG1lbWJlcnNoaXBJZDogbWVtYmVyc2hpcC5tZW1iZXJzaGlwSWQsXG4gICAgICAgIHN0YXR1czogbWVtYmVyc2hpcC5zdGF0dXMsXG4gICAgICAgIHByb2Nlc3NlZEF0OiBtZW1iZXJzaGlwLnByb2Nlc3NlZEF0LFxuICAgICAgICBwcm9jZXNzZWRCeTogbWVtYmVyc2hpcC5wcm9jZXNzZWRCeSxcbiAgICAgICAgbWVzc2FnZTogcHJvY2Vzc0lucHV0Lm1lc3NhZ2UsXG4gICAgICB9LFxuICAgICAgbWVzc2FnZTogcHJvY2Vzc0lucHV0LmFjdGlvbiA9PT0gJ2FwcHJvdmUnID8gJ0pvaW4gcmVxdWVzdCBhcHByb3ZlZCcgOiAnSm9pbiByZXF1ZXN0IHJlamVjdGVkJyxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICByZXR1cm4gY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdFcnJvciBwcm9jZXNzaW5nIGpvaW4gcmVxdWVzdCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIGNsdWJJZDogZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNsdWJJZCxcbiAgICAgIG1lbWJlcnNoaXBJZDogZXZlbnQucGF0aFBhcmFtZXRlcnM/Lm1lbWJlcnNoaXBJZCxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICB9KTtcblxuICAgIHJldHVybiBoYW5kbGVMYW1iZGFFcnJvcihlcnJvciwgcmVxdWVzdElkKTtcbiAgfVxufSJdfQ==