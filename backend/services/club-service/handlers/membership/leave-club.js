"use strict";
/**
 * Leave Club Handler - Phase 2.2
 *
 * Lambda handler for DELETE /v1/clubs/{id}/members/me endpoint.
 * Allows authenticated users to leave clubs voluntarily.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
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
 * Lambda handler for DELETE /v1/clubs/{id}/members/me
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing leave club request', {
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
        // Create enhanced authentication context
        const authContext = await (0, auth_context_1.createEnhancedAuthContext)(event.requestContext, userRepository);
        (0, lambda_utils_1.logStructured)('INFO', 'Authentication context created', {
            requestId,
            userId: authContext.userId,
            clubId,
            isAuthenticated: authContext.isAuthenticated,
        });
        // Validate user is authenticated
        if (!authContext.isAuthenticated) {
            throw new errors_1.ValidationError('Authentication required');
        }
        // Leave club
        const membership = await membershipService.leaveClub(clubId, authContext);
        (0, lambda_utils_1.logStructured)('INFO', 'User left club successfully', {
            requestId,
            userId: authContext.userId,
            clubId,
            membershipId: membership.membershipId,
        });
        // Format response
        const response = {
            success: true,
            message: 'Successfully left the club',
            timestamp: new Date().toISOString(),
        };
        return (0, lambda_utils_1.createSuccessResponse)(response);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing leave club request', {
            requestId,
            clubId: event.pathParameters?.clubId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVhdmUtY2x1Yi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxlYXZlLWNsdWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7QUFHSCx1RUFBaUY7QUFDakYsd0VBQWdIO0FBQ2hILDREQUFrRTtBQUNsRSw0R0FBdUc7QUFDdkcsNEZBQXVGO0FBQ3ZGLHdHQUFtRztBQUNuRyxtRkFBK0U7QUFDL0Usa0dBQThGO0FBRTlGLHdCQUF3QjtBQUN4QixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVcsQ0FBQztBQUUzQyx1Q0FBdUM7QUFDdkMsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RCxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSw2REFBNEIsQ0FBQyxVQUFVLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFDMUYsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLHNDQUFpQixDQUFDLG9CQUFvQixFQUFFLGNBQWMsRUFBRSw0Q0FBb0IsQ0FBQyxDQUFDO0FBRTVHOzs7OztHQUtHO0FBQ0ksS0FBSyxVQUFVLE9BQU8sQ0FBQyxLQUEyQjtJQUN2RCxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztJQUVqRCxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLCtCQUErQixFQUFFO1FBQ3JELFNBQVM7UUFDVCxVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVU7UUFDNUIsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO0tBQ2pCLENBQUMsQ0FBQztJQUVILElBQUk7UUFDRix1Q0FBdUM7UUFDdkMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUM7UUFFNUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE1BQU0sSUFBSSx3QkFBZSxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDbEQ7UUFFRCx5Q0FBeUM7UUFDekMsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFBLHdDQUF5QixFQUFDLEtBQUssQ0FBQyxjQUFjLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFFMUYsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSxnQ0FBZ0MsRUFBRTtZQUN0RCxTQUFTO1lBQ1QsTUFBTSxFQUFFLFdBQVcsQ0FBQyxNQUFNO1lBQzFCLE1BQU07WUFDTixlQUFlLEVBQUUsV0FBVyxDQUFDLGVBQWU7U0FDN0MsQ0FBQyxDQUFDO1FBRUgsaUNBQWlDO1FBQ2pDLElBQUksQ0FBQyxXQUFXLENBQUMsZUFBZSxFQUFFO1lBQ2hDLE1BQU0sSUFBSSx3QkFBZSxDQUFDLHlCQUF5QixDQUFDLENBQUM7U0FDdEQ7UUFFRCxhQUFhO1FBQ2IsTUFBTSxVQUFVLEdBQUcsTUFBTSxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRTFFLElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsNkJBQTZCLEVBQUU7WUFDbkQsU0FBUztZQUNULE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTTtZQUMxQixNQUFNO1lBQ04sWUFBWSxFQUFFLFVBQVUsQ0FBQyxZQUFZO1NBQ3RDLENBQUMsQ0FBQztRQUVILGtCQUFrQjtRQUNsQixNQUFNLFFBQVEsR0FBRztZQUNmLE9BQU8sRUFBRSxJQUFJO1lBQ2IsT0FBTyxFQUFFLDRCQUE0QjtZQUNyQyxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDcEMsQ0FBQztRQUVGLE9BQU8sSUFBQSxvQ0FBcUIsRUFBQyxRQUFRLENBQUMsQ0FBQztLQUN4QztJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsSUFBQSw0QkFBYSxFQUFDLE9BQU8sRUFBRSxxQ0FBcUMsRUFBRTtZQUM1RCxTQUFTO1lBQ1QsTUFBTSxFQUFFLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTTtZQUNwQyxLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZTtTQUNoRSxDQUFDLENBQUM7UUFFSCxPQUFPLElBQUEsZ0NBQWlCLEVBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQzVDO0FBQ0gsQ0FBQztBQTNERCwwQkEyREMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIExlYXZlIENsdWIgSGFuZGxlciAtIFBoYXNlIDIuMlxuICogXG4gKiBMYW1iZGEgaGFuZGxlciBmb3IgREVMRVRFIC92MS9jbHVicy97aWR9L21lbWJlcnMvbWUgZW5kcG9pbnQuXG4gKiBBbGxvd3MgYXV0aGVudGljYXRlZCB1c2VycyB0byBsZWF2ZSBjbHVicyB2b2x1bnRhcmlseS5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMi4yIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTIuMi5jbHViLW1lbWJlcnNoaXAtcm9sZXMudjEubWRcbiAqL1xuXG5pbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBjcmVhdGVFbmhhbmNlZEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGgvYXV0aC1jb250ZXh0JztcbmltcG9ydCB7IGNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSwgaGFuZGxlTGFtYmRhRXJyb3IsIGxvZ1N0cnVjdHVyZWQgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9lcnJvcnMnO1xuaW1wb3J0IHsgRHluYW1vREJVc2VyUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uLy4uL3VzZXItcHJvZmlsZS9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi11c2VyLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJDbHViUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLWNsdWItcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBEeW5hbW9EQk1lbWJlcnNoaXBSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItbWVtYmVyc2hpcC1yZXBvc2l0b3J5JztcbmltcG9ydCB7IE1lbWJlcnNoaXBTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL21lbWJlcnNoaXAvbWVtYmVyc2hpcC1zZXJ2aWNlJztcbmltcG9ydCB7IGF1dGhvcml6YXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGhvcml6YXRpb24vYXV0aG9yaXphdGlvbi1zZXJ2aWNlJztcblxuLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXG5jb25zdCBUQUJMRV9OQU1FID0gcHJvY2Vzcy5lbnYuVEFCTEVfTkFNRSE7XG5cbi8vIEluaXRpYWxpemUgcmVwb3NpdG9yaWVzIGFuZCBzZXJ2aWNlc1xuY29uc3QgdXNlclJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJVc2VyUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IGNsdWJSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkoVEFCTEVfTkFNRSk7XG5jb25zdCBtZW1iZXJzaGlwUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQk1lbWJlcnNoaXBSZXBvc2l0b3J5KFRBQkxFX05BTUUsIHVzZXJSZXBvc2l0b3J5KTtcbmNvbnN0IG1lbWJlcnNoaXBTZXJ2aWNlID0gbmV3IE1lbWJlcnNoaXBTZXJ2aWNlKG1lbWJlcnNoaXBSZXBvc2l0b3J5LCBjbHViUmVwb3NpdG9yeSwgYXV0aG9yaXphdGlvblNlcnZpY2UpO1xuXG4vKipcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBERUxFVEUgL3YxL2NsdWJzL3tpZH0vbWVtYmVycy9tZVxuICogXG4gKiBAcGFyYW0gZXZlbnQgLSBBUEkgR2F0ZXdheSBwcm94eSBldmVudFxuICogQHJldHVybnMgQVBJIEdhdGV3YXkgcHJveHkgcmVzdWx0XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCk6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiB7XG4gIGNvbnN0IHJlcXVlc3RJZCA9IGV2ZW50LnJlcXVlc3RDb250ZXh0LnJlcXVlc3RJZDtcbiAgXG4gIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnUHJvY2Vzc2luZyBsZWF2ZSBjbHViIHJlcXVlc3QnLCB7XG4gICAgcmVxdWVzdElkLFxuICAgIGh0dHBNZXRob2Q6IGV2ZW50Lmh0dHBNZXRob2QsXG4gICAgcGF0aDogZXZlbnQucGF0aCxcbiAgfSk7XG4gIFxuICB0cnkge1xuICAgIC8vIEV4dHJhY3QgY2x1YiBJRCBmcm9tIHBhdGggcGFyYW1ldGVyc1xuICAgIGNvbnN0IGNsdWJJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5jbHViSWQ7XG4gICAgXG4gICAgaWYgKCFjbHViSWQpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0NsdWIgSUQgaXMgcmVxdWlyZWQnKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgZW5oYW5jZWQgYXV0aGVudGljYXRpb24gY29udGV4dFxuICAgIGNvbnN0IGF1dGhDb250ZXh0ID0gYXdhaXQgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dChldmVudC5yZXF1ZXN0Q29udGV4dCwgdXNlclJlcG9zaXRvcnkpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdBdXRoZW50aWNhdGlvbiBjb250ZXh0IGNyZWF0ZWQnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGNsdWJJZCxcbiAgICAgIGlzQXV0aGVudGljYXRlZDogYXV0aENvbnRleHQuaXNBdXRoZW50aWNhdGVkLFxuICAgIH0pO1xuXG4gICAgLy8gVmFsaWRhdGUgdXNlciBpcyBhdXRoZW50aWNhdGVkXG4gICAgaWYgKCFhdXRoQ29udGV4dC5pc0F1dGhlbnRpY2F0ZWQpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0F1dGhlbnRpY2F0aW9uIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgLy8gTGVhdmUgY2x1YlxuICAgIGNvbnN0IG1lbWJlcnNoaXAgPSBhd2FpdCBtZW1iZXJzaGlwU2VydmljZS5sZWF2ZUNsdWIoY2x1YklkLCBhdXRoQ29udGV4dCk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1VzZXIgbGVmdCBjbHViIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgY2x1YklkLFxuICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICB9KTtcblxuICAgIC8vIEZvcm1hdCByZXNwb25zZVxuICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG1lc3NhZ2U6ICdTdWNjZXNzZnVsbHkgbGVmdCB0aGUgY2x1YicsXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIGNyZWF0ZVN1Y2Nlc3NSZXNwb25zZShyZXNwb25zZSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRXJyb3IgcHJvY2Vzc2luZyBsZWF2ZSBjbHViIHJlcXVlc3QnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICBjbHViSWQ6IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5jbHViSWQsXG4gICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gaGFuZGxlTGFtYmRhRXJyb3IoZXJyb3IsIHJlcXVlc3RJZCk7XG4gIH1cbn0iXX0=