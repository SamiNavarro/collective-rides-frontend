"use strict";
/**
 * Invite User Handler - Phase 2.2
 *
 * Lambda handler for POST /v1/clubs/{id}/invitations endpoint.
 * Allows club admins to invite users (both email and in-app invitations).
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
 * Lambda handler for POST /v1/clubs/{id}/invitations
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing invite user request', {
        requestId,
        httpMethod: event.httpMethod,
        path: event.path,
    });
    try {
        // Extract club ID from path parameters
        const clubId = event.pathParameters?.clubId;
        if (!clubId) {
            throw new errors_1.ValidationError('Club ID is required');
        }
        // Parse request body
        const invitationInput = (0, lambda_utils_2.parseJsonBody)(event);
        if (!invitationInput) {
            throw new errors_1.ValidationError('Request body is required');
        }
        // Create enhanced authentication context
        const authContext = await (0, auth_context_1.createEnhancedAuthContext)(event.requestContext, userRepository);
        (0, lambda_utils_1.logStructured)('INFO', 'Authentication context created', {
            requestId,
            userId: authContext.userId,
            clubId,
            invitationType: invitationInput.type,
            targetRole: invitationInput.role,
            isAuthenticated: authContext.isAuthenticated,
        });
        // Check authorization - requires invite_members capability
        await authService.requireClubCapability(authContext, clubId, club_authorization_1.ClubCapability.INVITE_MEMBERS);
        (0, lambda_utils_1.logStructured)('INFO', 'Authorization successful', {
            requestId,
            userId: authContext.userId,
            clubId,
            capability: club_authorization_1.ClubCapability.INVITE_MEMBERS,
        });
        // Create invitation
        const invitation = await invitationService.createInvitation(clubId, invitationInput, authContext);
        (0, lambda_utils_1.logStructured)('INFO', 'Invitation created successfully', {
            requestId,
            userId: authContext.userId,
            clubId,
            invitationId: invitation.invitationId,
            invitationType: invitation.type,
            targetRole: invitation.role,
        });
        // Format response
        const response = {
            success: true,
            data: {
                invitationId: invitation.invitationId,
                type: invitation.type,
                clubId: invitation.clubId,
                email: invitation.email,
                userId: invitation.userId,
                role: invitation.role,
                status: invitation.status,
                invitedBy: invitation.invitedBy,
                invitedAt: invitation.invitedAt,
                expiresAt: invitation.expiresAt,
                message: invitation.message,
                deliveryMethod: invitation.deliveryMethod,
            },
            timestamp: new Date().toISOString(),
        };
        return {
            statusCode: 201,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(response),
        };
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing invite user request', {
            requestId,
            clubId: event.pathParameters?.clubId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52aXRlLXVzZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnZpdGUtdXNlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUlILG9GQUE2RTtBQUM3RSx1RUFBaUY7QUFDakYsd0VBQWdIO0FBQ2hILHdFQUFzRTtBQUN0RSw0REFBa0U7QUFDbEUsNEdBQXVHO0FBQ3ZHLDRGQUF1RjtBQUN2Rix3R0FBbUc7QUFDbkcsd0dBQW1HO0FBQ25HLG1GQUErRTtBQUMvRSxzRkFBeUY7QUFDekYsa0dBQThGO0FBRTlGLHdCQUF3QjtBQUN4QixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVcsQ0FBQztBQUUzQyx1Q0FBdUM7QUFDdkMsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RCxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSw2REFBNEIsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDMUYsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDZEQUE0QixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzFFLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxzQ0FBaUIsQ0FDN0Msb0JBQW9CLEVBQ3BCLG9CQUFvQixFQUNwQixjQUFjLEVBQ2QsY0FBYyxFQUNkLDRDQUFvQixDQUNyQixDQUFDO0FBQ0YsTUFBTSxXQUFXLEdBQUcsSUFBSSw2Q0FBd0IsQ0FBQyxvQkFBb0IsRUFBRSw0Q0FBb0IsQ0FBQyxDQUFDO0FBRTdGOzs7OztHQUtHO0FBQ0ksS0FBSyxVQUFVLE9BQU8sQ0FBQyxLQUEyQjtJQUN2RCxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztJQUVqRCxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLGdDQUFnQyxFQUFFO1FBQ3RE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LEdBQUc7YUFDbkM7WUFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUM7U0FDL0IsQ0FBQztLQUNIO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxJQUFBLDRCQUFhLEVBQUMsT0FBTyxFQUFFLHNDQUFzQyxFQUFFO1lBQzdELFNBQVM7WUFDVCxNQUFNLEVBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxNQUFNO1lBQ3BDLEtBQUssRUFBRSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlO1NBQ2hFLENBQUMsQ0FBQztRQUVILE9BQU8sSUFBQSxnQ0FBaUIsRUFBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDNUM7QUFDSCxDQUFDO0FBL0ZELDBCQStGQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSW52aXRlIFVzZXIgSGFuZGxlciAtIFBoYXNlIDIuMlxuICogXG4gKiBMYW1iZGEgaGFuZGxlciBmb3IgUE9TVCAvdjEvY2x1YnMve2lkfS9pbnZpdGF0aW9ucyBlbmRwb2ludC5cbiAqIEFsbG93cyBjbHViIGFkbWlucyB0byBpbnZpdGUgdXNlcnMgKGJvdGggZW1haWwgYW5kIGluLWFwcCBpbnZpdGF0aW9ucykuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDIuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0yLjIuY2x1Yi1tZW1iZXJzaGlwLXJvbGVzLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgQ3JlYXRlSW52aXRhdGlvbklucHV0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL2ludml0YXRpb24nO1xuaW1wb3J0IHsgQ2x1YkNhcGFiaWxpdHkgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvY2x1Yi1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IGNyZWF0ZUVuaGFuY2VkQXV0aENvbnRleHQgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvYXV0aC9hdXRoLWNvbnRleHQnO1xuaW1wb3J0IHsgY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlLCBoYW5kbGVMYW1iZGFFcnJvciwgbG9nU3RydWN0dXJlZCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9sYW1iZGEtdXRpbHMnO1xuaW1wb3J0IHsgcGFyc2VKc29uQm9keSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9sYW1iZGEtdXRpbHMnO1xuaW1wb3J0IHsgVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2Vycm9ycyc7XG5pbXBvcnQgeyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vLi4vdXNlci1wcm9maWxlL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLXVzZXItcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBEeW5hbW9EQkNsdWJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItY2x1Yi1yZXBvc2l0b3J5JztcbmltcG9ydCB7IER5bmFtb0RCTWVtYmVyc2hpcFJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1tZW1iZXJzaGlwLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJJbnZpdGF0aW9uUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLWludml0YXRpb24tcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBJbnZpdGF0aW9uU2VydmljZSB9IGZyb20gJy4uLy4uL2RvbWFpbi9pbnZpdGF0aW9uL2ludml0YXRpb24tc2VydmljZSc7XG5pbXBvcnQgeyBDbHViQXV0aG9yaXphdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vYXV0aG9yaXphdGlvbi9jbHViLWF1dGhvcml6YXRpb24nO1xuaW1wb3J0IHsgYXV0aG9yaXphdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvYXV0aG9yaXphdGlvbi9hdXRob3JpemF0aW9uLXNlcnZpY2UnO1xuXG4vLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcbmNvbnN0IFRBQkxFX05BTUUgPSBwcm9jZXNzLmVudi5UQUJMRV9OQU1FITtcblxuLy8gSW5pdGlhbGl6ZSByZXBvc2l0b3JpZXMgYW5kIHNlcnZpY2VzXG5jb25zdCB1c2VyUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5KFRBQkxFX05BTUUpO1xuY29uc3QgY2x1YlJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJDbHViUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IG1lbWJlcnNoaXBSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCTWVtYmVyc2hpcFJlcG9zaXRvcnkoVEFCTEVfTkFNRSwgdXNlclJlcG9zaXRvcnkpO1xuY29uc3QgaW52aXRhdGlvblJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJJbnZpdGF0aW9uUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IGludml0YXRpb25TZXJ2aWNlID0gbmV3IEludml0YXRpb25TZXJ2aWNlKFxuICBpbnZpdGF0aW9uUmVwb3NpdG9yeSxcbiAgbWVtYmVyc2hpcFJlcG9zaXRvcnksXG4gIGNsdWJSZXBvc2l0b3J5LFxuICB1c2VyUmVwb3NpdG9yeSxcbiAgYXV0aG9yaXphdGlvblNlcnZpY2Vcbik7XG5jb25zdCBhdXRoU2VydmljZSA9IG5ldyBDbHViQXV0aG9yaXphdGlvblNlcnZpY2UobWVtYmVyc2hpcFJlcG9zaXRvcnksIGF1dGhvcml6YXRpb25TZXJ2aWNlKTtcblxuLyoqXG4gKiBMYW1iZGEgaGFuZGxlciBmb3IgUE9TVCAvdjEvY2x1YnMve2lkfS9pbnZpdGF0aW9uc1xuICogXG4gKiBAcGFyYW0gZXZlbnQgLSBBUEkgR2F0ZXdheSBwcm94eSBldmVudFxuICogQHJldHVybnMgQVBJIEdhdGV3YXkgcHJveHkgcmVzdWx0XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCk6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiB7XG4gIGNvbnN0IHJlcXVlc3RJZCA9IGV2ZW50LnJlcXVlc3RDb250ZXh0LnJlcXVlc3RJZDtcbiAgXG4gIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnUHJvY2Vzc2luZyBpbnZpdGUgdXNlciByZXF1ZXN0Jywge1xuICAgIHJlcXVlc3RJZCxcbiAgICBodHRwTWV0aG9kOiBldmVudC5odHRwTWV0aG9kLFxuICAgIHBhdGg6IGV2ZW50LnBhdGgsXG4gIH0pO1xuICBcbiAgdHJ5IHtcbiAgICAvLyBFeHRyYWN0IGNsdWIgSUQgZnJvbSBwYXRoIHBhcmFtZXRlcnNcbiAgICBjb25zdCBjbHViSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8uY2x1YklkO1xuICAgIFxuICAgIGlmICghY2x1YklkKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdDbHViIElEIGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgLy8gUGFyc2UgcmVxdWVzdCBib2R5XG4gICAgY29uc3QgaW52aXRhdGlvbklucHV0ID0gcGFyc2VKc29uQm9keTxDcmVhdGVJbnZpdGF0aW9uSW5wdXQ+KGV2ZW50KTtcblxuICAgIGlmICghaW52aXRhdGlvbklucHV0KSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdSZXF1ZXN0IGJvZHkgaXMgcmVxdWlyZWQnKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgZW5oYW5jZWQgYXV0aGVudGljYXRpb24gY29udGV4dFxuICAgIGNvbnN0IGF1dGhDb250ZXh0ID0gYXdhaXQgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dChldmVudC5yZXF1ZXN0Q29udGV4dCwgdXNlclJlcG9zaXRvcnkpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdBdXRoZW50aWNhdGlvbiBjb250ZXh0IGNyZWF0ZWQnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGNsdWJJZCxcbiAgICAgIGludml0YXRpb25UeXBlOiBpbnZpdGF0aW9uSW5wdXQudHlwZSxcbiAgICAgIHRhcmdldFJvbGU6IGludml0YXRpb25JbnB1dC5yb2xlLFxuICAgICAgaXNBdXRoZW50aWNhdGVkOiBhdXRoQ29udGV4dC5pc0F1dGhlbnRpY2F0ZWQsXG4gICAgfSk7XG5cbiAgICAvLyBDaGVjayBhdXRob3JpemF0aW9uIC0gcmVxdWlyZXMgaW52aXRlX21lbWJlcnMgY2FwYWJpbGl0eVxuICAgIGF3YWl0IGF1dGhTZXJ2aWNlLnJlcXVpcmVDbHViQ2FwYWJpbGl0eShhdXRoQ29udGV4dCwgY2x1YklkLCBDbHViQ2FwYWJpbGl0eS5JTlZJVEVfTUVNQkVSUyk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0F1dGhvcml6YXRpb24gc3VjY2Vzc2Z1bCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgY2x1YklkLFxuICAgICAgY2FwYWJpbGl0eTogQ2x1YkNhcGFiaWxpdHkuSU5WSVRFX01FTUJFUlMsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgaW52aXRhdGlvblxuICAgIGNvbnN0IGludml0YXRpb24gPSBhd2FpdCBpbnZpdGF0aW9uU2VydmljZS5jcmVhdGVJbnZpdGF0aW9uKGNsdWJJZCwgaW52aXRhdGlvbklucHV0LCBhdXRoQ29udGV4dCk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0ludml0YXRpb24gY3JlYXRlZCBzdWNjZXNzZnVsbHknLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGNsdWJJZCxcbiAgICAgIGludml0YXRpb25JZDogaW52aXRhdGlvbi5pbnZpdGF0aW9uSWQsXG4gICAgICBpbnZpdGF0aW9uVHlwZTogaW52aXRhdGlvbi50eXBlLFxuICAgICAgdGFyZ2V0Um9sZTogaW52aXRhdGlvbi5yb2xlLFxuICAgIH0pO1xuXG4gICAgLy8gRm9ybWF0IHJlc3BvbnNlXG4gICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YToge1xuICAgICAgICBpbnZpdGF0aW9uSWQ6IGludml0YXRpb24uaW52aXRhdGlvbklkLFxuICAgICAgICB0eXBlOiBpbnZpdGF0aW9uLnR5cGUsXG4gICAgICAgIGNsdWJJZDogaW52aXRhdGlvbi5jbHViSWQsXG4gICAgICAgIGVtYWlsOiBpbnZpdGF0aW9uLmVtYWlsLFxuICAgICAgICB1c2VySWQ6IGludml0YXRpb24udXNlcklkLFxuICAgICAgICByb2xlOiBpbnZpdGF0aW9uLnJvbGUsXG4gICAgICAgIHN0YXR1czogaW52aXRhdGlvbi5zdGF0dXMsXG4gICAgICAgIGludml0ZWRCeTogaW52aXRhdGlvbi5pbnZpdGVkQnksXG4gICAgICAgIGludml0ZWRBdDogaW52aXRhdGlvbi5pbnZpdGVkQXQsXG4gICAgICAgIGV4cGlyZXNBdDogaW52aXRhdGlvbi5leHBpcmVzQXQsXG4gICAgICAgIG1lc3NhZ2U6IGludml0YXRpb24ubWVzc2FnZSxcbiAgICAgICAgZGVsaXZlcnlNZXRob2Q6IGludml0YXRpb24uZGVsaXZlcnlNZXRob2QsXG4gICAgICB9LFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcblxuICAgIHJldHVybiB7XG4gICAgICBzdGF0dXNDb2RlOiAyMDEsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UpLFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRXJyb3IgcHJvY2Vzc2luZyBpbnZpdGUgdXNlciByZXF1ZXN0Jywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgY2x1YklkOiBldmVudC5wYXRoUGFyYW1ldGVycz8uY2x1YklkLFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGhhbmRsZUxhbWJkYUVycm9yKGVycm9yLCByZXF1ZXN0SWQpO1xuICB9XG59Il19