"use strict";
/**
 * Remove Member Handler - Phase 2.2
 *
 * Lambda handler for DELETE /v1/clubs/{id}/members/{userId} endpoint.
 * Allows club admins to remove members from clubs.
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
 * Lambda handler for DELETE /v1/clubs/{id}/members/{userId}
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing remove member request', {
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
        // Parse request body (optional)
        const removeInput = (0, lambda_utils_1.parseJsonBody)(event) || {};
        // Create enhanced authentication context
        const authContext = await (0, auth_context_1.createEnhancedAuthContext)(event.requestContext, userRepository);
        (0, lambda_utils_1.logStructured)('INFO', 'Authentication context created', {
            requestId,
            userId: authContext.userId,
            clubId,
            targetUserId,
            reason: removeInput.reason,
            isAuthenticated: authContext.isAuthenticated,
        });
        // Check authorization - requires remove_members capability
        await authService.requireClubCapability(authContext, clubId, club_authorization_1.ClubCapability.REMOVE_MEMBERS);
        (0, lambda_utils_1.logStructured)('INFO', 'Authorization successful', {
            requestId,
            userId: authContext.userId,
            clubId,
            capability: club_authorization_1.ClubCapability.REMOVE_MEMBERS,
        });
        // Remove member
        const membership = await membershipService.removeMember(clubId, targetUserId, removeInput, authContext);
        (0, lambda_utils_1.logStructured)('INFO', 'Member removed successfully', {
            requestId,
            userId: authContext.userId,
            clubId,
            targetUserId,
            membershipId: membership.membershipId,
            reason: removeInput.reason,
        });
        // Format response
        const response = {
            success: true,
            message: 'Member removed from club',
            timestamp: new Date().toISOString(),
        };
        return (0, lambda_utils_1.createSuccessResponse)(response);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing remove member request', {
            requestId,
            clubId: event.pathParameters?.clubId,
            targetUserId: event.pathParameters?.userId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVtb3ZlLW1lbWJlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInJlbW92ZS1tZW1iZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7QUFJSCxvRkFBNkU7QUFDN0UsdUVBQWlGO0FBQ2pGLHdFQUErSDtBQUMvSCw0REFBa0U7QUFDbEUsNEdBQXVHO0FBQ3ZHLDRGQUF1RjtBQUN2Rix3R0FBbUc7QUFDbkcsbUZBQStFO0FBQy9FLHNGQUF5RjtBQUN6RixrR0FBOEY7QUFFOUYsd0JBQXdCO0FBQ3hCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVyxDQUFDO0FBRTNDLHVDQUF1QztBQUN2QyxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlELE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDZEQUE0QixDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUMxRixNQUFNLGlCQUFpQixHQUFHLElBQUksc0NBQWlCLENBQUMsb0JBQW9CLEVBQUUsY0FBYyxFQUFFLDRDQUFvQixDQUFDLENBQUM7QUFDNUcsTUFBTSxXQUFXLEdBQUcsSUFBSSw2Q0FBd0IsQ0FBQyxvQkFBb0IsRUFBRSw0Q0FBb0IsQ0FBQyxDQUFDO0FBRTdGOzs7OztHQUtHO0FBQ0ksS0FBSyxVQUFVLE9BQU8sQ0FBQyxLQUEyQjtJQUN2RCxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztJQUVqRCxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLGtDQUFrQyxFQUFFO1FBQ3hELFNBQVM7UUFDVCxVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVU7UUFDNUIsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO0tBQ2pCLENBQUMsQ0FBQztJQUVILElBQUk7UUFDRixtREFBbUQ7UUFDbkQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUM7UUFDNUMsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUM7UUFFbEQsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE1BQU0sSUFBSSx3QkFBZSxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDbEQ7UUFFRCxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQ2pCLE1BQU0sSUFBSSx3QkFBZSxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDbEQ7UUFFRCxnQ0FBZ0M7UUFDaEMsTUFBTSxXQUFXLEdBQUcsSUFBQSw0QkFBYSxFQUFvQixLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFbEUseUNBQXlDO1FBQ3pDLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSx3Q0FBeUIsRUFBQyxLQUFLLENBQUMsY0FBYyxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBRTFGLElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsZ0NBQWdDLEVBQUU7WUFDdEQsU0FBUztZQUNULE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTTtZQUMxQixNQUFNO1lBQ04sWUFBWTtZQUNaLE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTTtZQUMxQixlQUFlLEVBQUUsV0FBVyxDQUFDLGVBQWU7U0FDN0MsQ0FBQyxDQUFDO1FBRUgsMkRBQTJEO1FBQzNELE1BQU0sV0FBVyxDQUFDLHFCQUFxQixDQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUUsbUNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUU1RixJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLDBCQUEwQixFQUFFO1lBQ2hELFNBQVM7WUFDVCxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07WUFDMUIsTUFBTTtZQUNOLFVBQVUsRUFBRSxtQ0FBYyxDQUFDLGNBQWM7U0FDMUMsQ0FBQyxDQUFDO1FBRUgsZ0JBQWdCO1FBQ2hCLE1BQU0sVUFBVSxHQUFHLE1BQU0saUJBQWlCLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRXhHLElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsNkJBQTZCLEVBQUU7WUFDbkQsU0FBUztZQUNULE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTTtZQUMxQixNQUFNO1lBQ04sWUFBWTtZQUNaLFlBQVksRUFBRSxVQUFVLENBQUMsWUFBWTtZQUNyQyxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07U0FDM0IsQ0FBQyxDQUFDO1FBRUgsa0JBQWtCO1FBQ2xCLE1BQU0sUUFBUSxHQUFHO1lBQ2YsT0FBTyxFQUFFLElBQUk7WUFDYixPQUFPLEVBQUUsMEJBQTBCO1lBQ25DLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUNwQyxDQUFDO1FBRUYsT0FBTyxJQUFBLG9DQUFxQixFQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ3hDO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxJQUFBLDRCQUFhLEVBQUMsT0FBTyxFQUFFLHdDQUF3QyxFQUFFO1lBQy9ELFNBQVM7WUFDVCxNQUFNLEVBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxNQUFNO1lBQ3BDLFlBQVksRUFBRSxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU07WUFDMUMsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLGdDQUFpQixFQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztLQUM1QztBQUNILENBQUM7QUE3RUQsMEJBNkVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBSZW1vdmUgTWVtYmVyIEhhbmRsZXIgLSBQaGFzZSAyLjJcbiAqIFxuICogTGFtYmRhIGhhbmRsZXIgZm9yIERFTEVURSAvdjEvY2x1YnMve2lkfS9tZW1iZXJzL3t1c2VySWR9IGVuZHBvaW50LlxuICogQWxsb3dzIGNsdWIgYWRtaW5zIHRvIHJlbW92ZSBtZW1iZXJzIGZyb20gY2x1YnMuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDIuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0yLjIuY2x1Yi1tZW1iZXJzaGlwLXJvbGVzLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgUmVtb3ZlTWVtYmVySW5wdXQgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvbWVtYmVyc2hpcCc7XG5pbXBvcnQgeyBDbHViQ2FwYWJpbGl0eSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9jbHViLWF1dGhvcml6YXRpb24nO1xuaW1wb3J0IHsgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBjcmVhdGVTdWNjZXNzUmVzcG9uc2UsIGhhbmRsZUxhbWJkYUVycm9yLCBsb2dTdHJ1Y3R1cmVkLCBwYXJzZUpzb25Cb2R5IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvZXJyb3JzJztcbmltcG9ydCB7IER5bmFtb0RCVXNlclJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi8uLi91c2VyLXByb2ZpbGUvaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItdXNlci1yZXBvc2l0b3J5JztcbmltcG9ydCB7IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1jbHViLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJNZW1iZXJzaGlwUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLW1lbWJlcnNoaXAtcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBNZW1iZXJzaGlwU2VydmljZSB9IGZyb20gJy4uLy4uL2RvbWFpbi9tZW1iZXJzaGlwL21lbWJlcnNoaXAtc2VydmljZSc7XG5pbXBvcnQgeyBDbHViQXV0aG9yaXphdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vYXV0aG9yaXphdGlvbi9jbHViLWF1dGhvcml6YXRpb24nO1xuaW1wb3J0IHsgYXV0aG9yaXphdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvYXV0aG9yaXphdGlvbi9hdXRob3JpemF0aW9uLXNlcnZpY2UnO1xuXG4vLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcbmNvbnN0IFRBQkxFX05BTUUgPSBwcm9jZXNzLmVudi5UQUJMRV9OQU1FITtcblxuLy8gSW5pdGlhbGl6ZSByZXBvc2l0b3JpZXMgYW5kIHNlcnZpY2VzXG5jb25zdCB1c2VyUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5KFRBQkxFX05BTUUpO1xuY29uc3QgY2x1YlJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJDbHViUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IG1lbWJlcnNoaXBSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCTWVtYmVyc2hpcFJlcG9zaXRvcnkoVEFCTEVfTkFNRSwgdXNlclJlcG9zaXRvcnkpO1xuY29uc3QgbWVtYmVyc2hpcFNlcnZpY2UgPSBuZXcgTWVtYmVyc2hpcFNlcnZpY2UobWVtYmVyc2hpcFJlcG9zaXRvcnksIGNsdWJSZXBvc2l0b3J5LCBhdXRob3JpemF0aW9uU2VydmljZSk7XG5jb25zdCBhdXRoU2VydmljZSA9IG5ldyBDbHViQXV0aG9yaXphdGlvblNlcnZpY2UobWVtYmVyc2hpcFJlcG9zaXRvcnksIGF1dGhvcml6YXRpb25TZXJ2aWNlKTtcblxuLyoqXG4gKiBMYW1iZGEgaGFuZGxlciBmb3IgREVMRVRFIC92MS9jbHVicy97aWR9L21lbWJlcnMve3VzZXJJZH1cbiAqIFxuICogQHBhcmFtIGV2ZW50IC0gQVBJIEdhdGV3YXkgcHJveHkgZXZlbnRcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xuICBjb25zdCByZXF1ZXN0SWQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5yZXF1ZXN0SWQ7XG4gIFxuICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1Byb2Nlc3NpbmcgcmVtb3ZlIG1lbWJlciByZXF1ZXN0Jywge1xuICAgIHJlcXVlc3RJZCxcbiAgICBodHRwTWV0aG9kOiBldmVudC5odHRwTWV0aG9kLFxuICAgIHBhdGg6IGV2ZW50LnBhdGgsXG4gIH0pO1xuICBcbiAgdHJ5IHtcbiAgICAvLyBFeHRyYWN0IGNsdWIgSUQgYW5kIHVzZXIgSUQgZnJvbSBwYXRoIHBhcmFtZXRlcnNcbiAgICBjb25zdCBjbHViSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8uY2x1YklkO1xuICAgIGNvbnN0IHRhcmdldFVzZXJJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy51c2VySWQ7XG4gICAgXG4gICAgaWYgKCFjbHViSWQpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0NsdWIgSUQgaXMgcmVxdWlyZWQnKTtcbiAgICB9XG5cbiAgICBpZiAoIXRhcmdldFVzZXJJZCkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignVXNlciBJRCBpcyByZXF1aXJlZCcpO1xuICAgIH1cblxuICAgIC8vIFBhcnNlIHJlcXVlc3QgYm9keSAob3B0aW9uYWwpXG4gICAgY29uc3QgcmVtb3ZlSW5wdXQgPSBwYXJzZUpzb25Cb2R5PFJlbW92ZU1lbWJlcklucHV0PihldmVudCkgfHwge307XG5cbiAgICAvLyBDcmVhdGUgZW5oYW5jZWQgYXV0aGVudGljYXRpb24gY29udGV4dFxuICAgIGNvbnN0IGF1dGhDb250ZXh0ID0gYXdhaXQgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dChldmVudC5yZXF1ZXN0Q29udGV4dCwgdXNlclJlcG9zaXRvcnkpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdBdXRoZW50aWNhdGlvbiBjb250ZXh0IGNyZWF0ZWQnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGNsdWJJZCxcbiAgICAgIHRhcmdldFVzZXJJZCxcbiAgICAgIHJlYXNvbjogcmVtb3ZlSW5wdXQucmVhc29uLFxuICAgICAgaXNBdXRoZW50aWNhdGVkOiBhdXRoQ29udGV4dC5pc0F1dGhlbnRpY2F0ZWQsXG4gICAgfSk7XG5cbiAgICAvLyBDaGVjayBhdXRob3JpemF0aW9uIC0gcmVxdWlyZXMgcmVtb3ZlX21lbWJlcnMgY2FwYWJpbGl0eVxuICAgIGF3YWl0IGF1dGhTZXJ2aWNlLnJlcXVpcmVDbHViQ2FwYWJpbGl0eShhdXRoQ29udGV4dCwgY2x1YklkLCBDbHViQ2FwYWJpbGl0eS5SRU1PVkVfTUVNQkVSUyk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0F1dGhvcml6YXRpb24gc3VjY2Vzc2Z1bCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgY2x1YklkLFxuICAgICAgY2FwYWJpbGl0eTogQ2x1YkNhcGFiaWxpdHkuUkVNT1ZFX01FTUJFUlMsXG4gICAgfSk7XG5cbiAgICAvLyBSZW1vdmUgbWVtYmVyXG4gICAgY29uc3QgbWVtYmVyc2hpcCA9IGF3YWl0IG1lbWJlcnNoaXBTZXJ2aWNlLnJlbW92ZU1lbWJlcihjbHViSWQsIHRhcmdldFVzZXJJZCwgcmVtb3ZlSW5wdXQsIGF1dGhDb250ZXh0KTtcblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnTWVtYmVyIHJlbW92ZWQgc3VjY2Vzc2Z1bGx5Jywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBjbHViSWQsXG4gICAgICB0YXJnZXRVc2VySWQsXG4gICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgcmVhc29uOiByZW1vdmVJbnB1dC5yZWFzb24sXG4gICAgfSk7XG5cbiAgICAvLyBGb3JtYXQgcmVzcG9uc2VcbiAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiAnTWVtYmVyIHJlbW92ZWQgZnJvbSBjbHViJyxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICByZXR1cm4gY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdFcnJvciBwcm9jZXNzaW5nIHJlbW92ZSBtZW1iZXIgcmVxdWVzdCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIGNsdWJJZDogZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNsdWJJZCxcbiAgICAgIHRhcmdldFVzZXJJZDogZXZlbnQucGF0aFBhcmFtZXRlcnM/LnVzZXJJZCxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICB9KTtcblxuICAgIHJldHVybiBoYW5kbGVMYW1iZGFFcnJvcihlcnJvciwgcmVxdWVzdElkKTtcbiAgfVxufSJdfQ==