"use strict";
/**
 * Accept Invitation Handler - Phase 2.2
 *
 * Lambda handler for PUT /v1/invitations/{id} endpoint.
 * Allows users to accept or decline club invitations.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_context_1 = require("../../../../shared/auth/auth-context");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const lambda_utils_2 = require("../../../../shared/utils/lambda-utils");
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
 * Lambda handler for PUT /v1/invitations/{id}
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing accept invitation request', {
        requestId,
        httpMethod: event.httpMethod,
        path: event.path,
    });
    try {
        // Extract invitation ID from path parameters
        const invitationId = event.pathParameters?.id;
        if (!invitationId) {
            throw new errors_1.ValidationError('Invitation ID is required');
        }
        // Parse request body
        const processInput = (0, lambda_utils_2.parseJsonBody)(event);
        if (!processInput) {
            throw new errors_1.ValidationError('Request body is required');
        }
        if (!['accept', 'decline'].includes(processInput.action)) {
            throw new errors_1.ValidationError('Action must be either "accept" or "decline"');
        }
        // Create enhanced authentication context
        const authContext = await (0, auth_context_1.createEnhancedAuthContext)(event.requestContext, userRepository);
        (0, lambda_utils_1.logStructured)('INFO', 'Authentication context created', {
            requestId,
            userId: authContext.userId,
            invitationId,
            action: processInput.action,
            isAuthenticated: authContext.isAuthenticated,
        });
        // Validate user is authenticated
        if (!authContext.isAuthenticated) {
            throw new errors_1.ValidationError('Authentication required');
        }
        // Process invitation
        const result = await invitationService.processInvitation(invitationId, processInput, authContext);
        (0, lambda_utils_1.logStructured)('INFO', 'Invitation processed successfully', {
            requestId,
            userId: authContext.userId,
            invitationId,
            action: processInput.action,
            clubId: result.invitation.clubId,
            membershipId: result.membership?.membershipId,
        });
        // Format response based on action
        if (processInput.action === 'accept') {
            const response = {
                success: true,
                data: {
                    invitation: {
                        invitationId: result.invitation.invitationId,
                        status: result.invitation.status,
                        processedAt: result.invitation.processedAt,
                    },
                    membership: result.membership ? {
                        membershipId: result.membership.membershipId,
                        clubId: result.membership.clubId,
                        userId: result.membership.userId,
                        role: result.membership.role,
                        status: result.membership.status,
                        joinedAt: result.membership.joinedAt,
                    } : undefined,
                },
                message: 'Invitation accepted successfully',
                timestamp: new Date().toISOString(),
            };
            return (0, lambda_utils_1.createSuccessResponse)(response);
        }
        else {
            const response = {
                success: true,
                data: {
                    invitationId: result.invitation.invitationId,
                    status: result.invitation.status,
                    processedAt: result.invitation.processedAt,
                },
                message: 'Invitation declined',
                timestamp: new Date().toISOString(),
            };
            return (0, lambda_utils_1.createSuccessResponse)(response);
        }
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing accept invitation request', {
            requestId,
            invitationId: event.pathParameters?.id,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWNjZXB0LWludml0YXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJhY2NlcHQtaW52aXRhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUlILHVFQUFpRjtBQUNqRix3RUFBZ0g7QUFDaEgsd0VBQXNFO0FBQ3RFLDREQUFrRTtBQUNsRSw0R0FBdUc7QUFDdkcsNEZBQXVGO0FBQ3ZGLHdHQUFtRztBQUNuRyx3R0FBbUc7QUFDbkcsbUZBQStFO0FBQy9FLGtHQUE4RjtBQUU5Rix3QkFBd0I7QUFDeEIsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFXLENBQUM7QUFFM0MsdUNBQXVDO0FBQ3ZDLE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RCxNQUFNLG9CQUFvQixHQUFHLElBQUksNkRBQTRCLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQzFGLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSw2REFBNEIsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMxRSxNQUFNLGlCQUFpQixHQUFHLElBQUksc0NBQWlCLENBQzdDLG9CQUFvQixFQUNwQixvQkFBb0IsRUFDcEIsY0FBYyxFQUNkLGNBQWMsRUFDZCw0Q0FBb0IsQ0FDckIsQ0FBQztBQUVGOzs7OztHQUtHO0FBQ0ksS0FBSyxVQUFVLE9BQU8sQ0FBQyxLQUEyQjtJQUN2RCxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztJQUVqRCxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLHNDQUFzQyxFQUFFO1FBQzVELFNBQVM7UUFDVCxVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVU7UUFDNUIsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO0tBQ2pCLENBQUMsQ0FBQztJQUVILElBQUk7UUFDRiw2Q0FBNkM7UUFDN0MsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUM7UUFFOUMsSUFBSSxDQUFDLFlBQVksRUFBRTtZQUNqQixNQUFNLElBQUksd0JBQWUsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1NBQ3hEO1FBRUQscUJBQXFCO1FBQ3JCLE1BQU0sWUFBWSxHQUFHLElBQUEsNEJBQWEsRUFBeUIsS0FBSyxDQUFDLENBQUM7UUFFbEUsSUFBSSxDQUFDLFlBQVksRUFBRTtZQUNqQixNQUFNLElBQUksd0JBQWUsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1NBQ3ZEO1FBRUQsSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDeEQsTUFBTSxJQUFJLHdCQUFlLENBQUMsNkNBQTZDLENBQUMsQ0FBQztTQUMxRTtRQUVELHlDQUF5QztRQUN6QyxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsd0NBQXlCLEVBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUUxRixJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLGdDQUFnQyxFQUFFO1lBQ3RELFNBQVM7WUFDVCxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07WUFDMUIsWUFBWTtZQUNaLE1BQU0sRUFBRSxZQUFZLENBQUMsTUFBTTtZQUMzQixlQUFlLEVBQUUsV0FBVyxDQUFDLGVBQWU7U0FDN0MsQ0FBQyxDQUFDO1FBRUgsaUNBQWlDO1FBQ2pDLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFO1lBQ2hDLE1BQU0sSUFBSSx3QkFBZSxDQUFDLHlCQUF5QixDQUFDLENBQUM7U0FDdEQ7UUFFRCxxQkFBcUI7UUFDckIsTUFBTSxNQUFNLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsWUFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRWxHLElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsbUNBQW1DLEVBQUU7WUFDekQsU0FBUztZQUNULE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTTtZQUMxQixZQUFZO1lBQ1osTUFBTSxFQUFFLFlBQVksQ0FBQyxNQUFNO1lBQzNCLE1BQU0sRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU07WUFDaEMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxVQUFVLEVBQUUsWUFBWTtTQUM5QyxDQUFDLENBQUM7UUFFSCxrQ0FBa0M7UUFDbEMsSUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLFFBQVEsRUFBRTtZQUNwQyxNQUFNLFFBQVEsR0FBRztnQkFDZixPQUFPLEVBQUUsSUFBSTtnQkFDYixJQUFJLEVBQUU7b0JBQ0osVUFBVSxFQUFFO3dCQUNWLFlBQVksRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLFlBQVk7d0JBQzVDLE1BQU0sRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU07d0JBQ2hDLFdBQVcsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLFdBQVc7cUJBQzNDO29CQUNELFVBQVUsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQzt3QkFDOUIsWUFBWSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWTt3QkFDNUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTTt3QkFDaEMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTTt3QkFDaEMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSTt3QkFDNUIsTUFBTSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTTt3QkFDaEMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxVQUFVLENBQUMsUUFBUTtxQkFDckMsQ0FBQyxDQUFDLENBQUMsU0FBUztpQkFDZDtnQkFDRCxPQUFPLEVBQUUsa0NBQWtDO2dCQUMzQyxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7YUFDcEMsQ0FBQztZQUVGLE9BQU8sSUFBQSxvQ0FBcUIsRUFBQyxRQUFRLENBQUMsQ0FBQztTQUN4QzthQUFNO1lBQ0wsTUFBTSxRQUFRLEdBQUc7Z0JBQ2YsT0FBTyxFQUFFLElBQUk7Z0JBQ2IsSUFBSSxFQUFFO29CQUNKLFlBQVksRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLFlBQVk7b0JBQzVDLE1BQU0sRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU07b0JBQ2hDLFdBQVcsRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLFdBQVc7aUJBQzNDO2dCQUNELE9BQU8sRUFBRSxxQkFBcUI7Z0JBQzlCLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTthQUNwQyxDQUFDO1lBRUYsT0FBTyxJQUFBLG9DQUFxQixFQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ3hDO0tBQ0Y7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLElBQUEsNEJBQWEsRUFBQyxPQUFPLEVBQUUsNENBQTRDLEVBQUU7WUFDbkUsU0FBUztZQUNULFlBQVksRUFBRSxLQUFLLENBQUMsY0FBYyxFQUFFLEVBQUU7WUFDdEMsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLGdDQUFpQixFQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztLQUM1QztBQUNILENBQUM7QUF2R0QsMEJBdUdDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBBY2NlcHQgSW52aXRhdGlvbiBIYW5kbGVyIC0gUGhhc2UgMi4yXG4gKiBcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBQVVQgL3YxL2ludml0YXRpb25zL3tpZH0gZW5kcG9pbnQuXG4gKiBBbGxvd3MgdXNlcnMgdG8gYWNjZXB0IG9yIGRlY2xpbmUgY2x1YiBpbnZpdGF0aW9ucy5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMi4yIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTIuMi5jbHViLW1lbWJlcnNoaXAtcm9sZXMudjEubWRcbiAqL1xuXG5pbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBQcm9jZXNzSW52aXRhdGlvbklucHV0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL2ludml0YXRpb24nO1xuaW1wb3J0IHsgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBjcmVhdGVTdWNjZXNzUmVzcG9uc2UsIGhhbmRsZUxhbWJkYUVycm9yLCBsb2dTdHJ1Y3R1cmVkIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBwYXJzZUpzb25Cb2R5IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvZXJyb3JzJztcbmltcG9ydCB7IER5bmFtb0RCVXNlclJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi8uLi91c2VyLXByb2ZpbGUvaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItdXNlci1yZXBvc2l0b3J5JztcbmltcG9ydCB7IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1jbHViLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJNZW1iZXJzaGlwUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLW1lbWJlcnNoaXAtcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBEeW5hbW9EQkludml0YXRpb25SZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItaW52aXRhdGlvbi1yZXBvc2l0b3J5JztcbmltcG9ydCB7IEludml0YXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2ludml0YXRpb24vaW52aXRhdGlvbi1zZXJ2aWNlJztcbmltcG9ydCB7IGF1dGhvcml6YXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGhvcml6YXRpb24vYXV0aG9yaXphdGlvbi1zZXJ2aWNlJztcblxuLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXG5jb25zdCBUQUJMRV9OQU1FID0gcHJvY2Vzcy5lbnYuVEFCTEVfTkFNRSE7XG5cbi8vIEluaXRpYWxpemUgcmVwb3NpdG9yaWVzIGFuZCBzZXJ2aWNlc1xuY29uc3QgdXNlclJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJVc2VyUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IGNsdWJSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkoVEFCTEVfTkFNRSk7XG5jb25zdCBtZW1iZXJzaGlwUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQk1lbWJlcnNoaXBSZXBvc2l0b3J5KFRBQkxFX05BTUUsIHVzZXJSZXBvc2l0b3J5KTtcbmNvbnN0IGludml0YXRpb25SZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCSW52aXRhdGlvblJlcG9zaXRvcnkoVEFCTEVfTkFNRSk7XG5jb25zdCBpbnZpdGF0aW9uU2VydmljZSA9IG5ldyBJbnZpdGF0aW9uU2VydmljZShcbiAgaW52aXRhdGlvblJlcG9zaXRvcnksXG4gIG1lbWJlcnNoaXBSZXBvc2l0b3J5LFxuICBjbHViUmVwb3NpdG9yeSxcbiAgdXNlclJlcG9zaXRvcnksXG4gIGF1dGhvcml6YXRpb25TZXJ2aWNlXG4pO1xuXG4vKipcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBQVVQgL3YxL2ludml0YXRpb25zL3tpZH1cbiAqIFxuICogQHBhcmFtIGV2ZW50IC0gQVBJIEdhdGV3YXkgcHJveHkgZXZlbnRcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xuICBjb25zdCByZXF1ZXN0SWQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5yZXF1ZXN0SWQ7XG4gIFxuICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1Byb2Nlc3NpbmcgYWNjZXB0IGludml0YXRpb24gcmVxdWVzdCcsIHtcbiAgICByZXF1ZXN0SWQsXG4gICAgaHR0cE1ldGhvZDogZXZlbnQuaHR0cE1ldGhvZCxcbiAgICBwYXRoOiBldmVudC5wYXRoLFxuICB9KTtcbiAgXG4gIHRyeSB7XG4gICAgLy8gRXh0cmFjdCBpbnZpdGF0aW9uIElEIGZyb20gcGF0aCBwYXJhbWV0ZXJzXG4gICAgY29uc3QgaW52aXRhdGlvbklkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LmlkO1xuICAgIFxuICAgIGlmICghaW52aXRhdGlvbklkKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnZpdGF0aW9uIElEIGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgLy8gUGFyc2UgcmVxdWVzdCBib2R5XG4gICAgY29uc3QgcHJvY2Vzc0lucHV0ID0gcGFyc2VKc29uQm9keTxQcm9jZXNzSW52aXRhdGlvbklucHV0PihldmVudCk7XG5cbiAgICBpZiAoIXByb2Nlc3NJbnB1dCkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignUmVxdWVzdCBib2R5IGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgaWYgKCFbJ2FjY2VwdCcsICdkZWNsaW5lJ10uaW5jbHVkZXMocHJvY2Vzc0lucHV0LmFjdGlvbikpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0FjdGlvbiBtdXN0IGJlIGVpdGhlciBcImFjY2VwdFwiIG9yIFwiZGVjbGluZVwiJyk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGVuaGFuY2VkIGF1dGhlbnRpY2F0aW9uIGNvbnRleHRcbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IGF3YWl0IGNyZWF0ZUVuaGFuY2VkQXV0aENvbnRleHQoZXZlbnQucmVxdWVzdENvbnRleHQsIHVzZXJSZXBvc2l0b3J5KTtcblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnQXV0aGVudGljYXRpb24gY29udGV4dCBjcmVhdGVkJywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBpbnZpdGF0aW9uSWQsXG4gICAgICBhY3Rpb246IHByb2Nlc3NJbnB1dC5hY3Rpb24sXG4gICAgICBpc0F1dGhlbnRpY2F0ZWQ6IGF1dGhDb250ZXh0LmlzQXV0aGVudGljYXRlZCxcbiAgICB9KTtcblxuICAgIC8vIFZhbGlkYXRlIHVzZXIgaXMgYXV0aGVudGljYXRlZFxuICAgIGlmICghYXV0aENvbnRleHQuaXNBdXRoZW50aWNhdGVkKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdBdXRoZW50aWNhdGlvbiByZXF1aXJlZCcpO1xuICAgIH1cblxuICAgIC8vIFByb2Nlc3MgaW52aXRhdGlvblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGludml0YXRpb25TZXJ2aWNlLnByb2Nlc3NJbnZpdGF0aW9uKGludml0YXRpb25JZCwgcHJvY2Vzc0lucHV0LCBhdXRoQ29udGV4dCk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0ludml0YXRpb24gcHJvY2Vzc2VkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgaW52aXRhdGlvbklkLFxuICAgICAgYWN0aW9uOiBwcm9jZXNzSW5wdXQuYWN0aW9uLFxuICAgICAgY2x1YklkOiByZXN1bHQuaW52aXRhdGlvbi5jbHViSWQsXG4gICAgICBtZW1iZXJzaGlwSWQ6IHJlc3VsdC5tZW1iZXJzaGlwPy5tZW1iZXJzaGlwSWQsXG4gICAgfSk7XG5cbiAgICAvLyBGb3JtYXQgcmVzcG9uc2UgYmFzZWQgb24gYWN0aW9uXG4gICAgaWYgKHByb2Nlc3NJbnB1dC5hY3Rpb24gPT09ICdhY2NlcHQnKSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGludml0YXRpb246IHtcbiAgICAgICAgICAgIGludml0YXRpb25JZDogcmVzdWx0Lmludml0YXRpb24uaW52aXRhdGlvbklkLFxuICAgICAgICAgICAgc3RhdHVzOiByZXN1bHQuaW52aXRhdGlvbi5zdGF0dXMsXG4gICAgICAgICAgICBwcm9jZXNzZWRBdDogcmVzdWx0Lmludml0YXRpb24ucHJvY2Vzc2VkQXQsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBtZW1iZXJzaGlwOiByZXN1bHQubWVtYmVyc2hpcCA/IHtcbiAgICAgICAgICAgIG1lbWJlcnNoaXBJZDogcmVzdWx0Lm1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgICAgICAgY2x1YklkOiByZXN1bHQubWVtYmVyc2hpcC5jbHViSWQsXG4gICAgICAgICAgICB1c2VySWQ6IHJlc3VsdC5tZW1iZXJzaGlwLnVzZXJJZCxcbiAgICAgICAgICAgIHJvbGU6IHJlc3VsdC5tZW1iZXJzaGlwLnJvbGUsXG4gICAgICAgICAgICBzdGF0dXM6IHJlc3VsdC5tZW1iZXJzaGlwLnN0YXR1cyxcbiAgICAgICAgICAgIGpvaW5lZEF0OiByZXN1bHQubWVtYmVyc2hpcC5qb2luZWRBdCxcbiAgICAgICAgICB9IDogdW5kZWZpbmVkLFxuICAgICAgICB9LFxuICAgICAgICBtZXNzYWdlOiAnSW52aXRhdGlvbiBhY2NlcHRlZCBzdWNjZXNzZnVsbHknLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBjcmVhdGVTdWNjZXNzUmVzcG9uc2UocmVzcG9uc2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGludml0YXRpb25JZDogcmVzdWx0Lmludml0YXRpb24uaW52aXRhdGlvbklkLFxuICAgICAgICAgIHN0YXR1czogcmVzdWx0Lmludml0YXRpb24uc3RhdHVzLFxuICAgICAgICAgIHByb2Nlc3NlZEF0OiByZXN1bHQuaW52aXRhdGlvbi5wcm9jZXNzZWRBdCxcbiAgICAgICAgfSxcbiAgICAgICAgbWVzc2FnZTogJ0ludml0YXRpb24gZGVjbGluZWQnLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIH07XG5cbiAgICAgIHJldHVybiBjcmVhdGVTdWNjZXNzUmVzcG9uc2UocmVzcG9uc2UpO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdFcnJvciBwcm9jZXNzaW5nIGFjY2VwdCBpbnZpdGF0aW9uIHJlcXVlc3QnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICBpbnZpdGF0aW9uSWQ6IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5pZCxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICB9KTtcblxuICAgIHJldHVybiBoYW5kbGVMYW1iZGFFcnJvcihlcnJvciwgcmVxdWVzdElkKTtcbiAgfVxufSJdfQ==