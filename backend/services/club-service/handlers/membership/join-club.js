"use strict";
/**
 * Join Club Handler - Phase 2.2
 *
 * Lambda handler for POST /v1/clubs/{id}/members endpoint.
 * Allows authenticated users to join clubs.
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
 * Lambda handler for POST /v1/clubs/{id}/members
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing join club request', {
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
        const joinInput = (0, lambda_utils_1.parseJsonBody)(event) || {};
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
        // Join club
        const membership = await membershipService.joinClub(clubId, joinInput, authContext);
        (0, lambda_utils_1.logStructured)('INFO', 'User joined club successfully', {
            requestId,
            userId: authContext.userId,
            clubId,
            membershipId: membership.membershipId,
            status: membership.status,
        });
        // Format response
        const response = {
            success: true,
            data: {
                membershipId: membership.membershipId,
                clubId: membership.clubId,
                userId: membership.userId,
                role: membership.role,
                status: membership.status,
                joinedAt: membership.joinedAt,
                message: membership.joinMessage,
            },
            timestamp: new Date().toISOString(),
        };
        return {
            statusCode: membership.status === 'active' ? 201 : 202,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify(response),
        };
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing join club request', {
            requestId,
            clubId: event.pathParameters?.clubId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiam9pbi1jbHViLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiam9pbi1jbHViLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBSUgsdUVBQWlGO0FBQ2pGLHdFQUErSDtBQUMvSCw0REFBa0U7QUFDbEUsNEdBQXVHO0FBQ3ZHLDRGQUF1RjtBQUN2Rix3R0FBbUc7QUFDbkcsbUZBQStFO0FBQy9FLGtHQUE4RjtBQUU5Rix3QkFBd0I7QUFDeEIsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFXLENBQUM7QUFFM0MsdUNBQXVDO0FBQ3ZDLE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RCxNQUFNLG9CQUFvQixHQUFHLElBQUksNkRBQTRCLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQzFGLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxzQ0FBaUIsQ0FBQyxvQkFBb0IsRUFBRSxjQUFjLEVBQUUsNENBQW9CLENBQUMsQ0FBQztBQUU1Rzs7Ozs7R0FLRztBQUNJLEtBQUssVUFBVSxPQUFPLENBQUMsS0FBMkI7SUFDdkQsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUM7SUFFakQsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSw4QkFBOEIsRUFBRTtRQUNwRCxTQUFTO1FBQ1QsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO1FBQzVCLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtLQUNqQixDQUFDLENBQUM7SUFFSCxJQUFJO1FBQ0YsdUNBQXVDO1FBQ3ZDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBRTVDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxNQUFNLElBQUksd0JBQWUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1NBQ2xEO1FBRUQscUJBQXFCO1FBQ3JCLE1BQU0sU0FBUyxHQUFHLElBQUEsNEJBQWEsRUFBZ0IsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBRTVELHlDQUF5QztRQUN6QyxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsd0NBQXlCLEVBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUUxRixJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLGdDQUFnQyxFQUFFO1lBQ3RELFNBQVM7WUFDVCxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07WUFDMUIsTUFBTTtZQUNOLGVBQWUsRUFBRSxXQUFXLENBQUMsZUFBZTtTQUM3QyxDQUFDLENBQUM7UUFFSCxpQ0FBaUM7UUFDakMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxlQUFlLEVBQUU7WUFDaEMsTUFBTSxJQUFJLHdCQUFlLENBQUMseUJBQXlCLENBQUMsQ0FBQztTQUN0RDtRQUVELFlBQVk7UUFDWixNQUFNLFVBQVUsR0FBRyxNQUFNLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRXBGLElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsK0JBQStCLEVBQUU7WUFDckQsU0FBUztZQUNULE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTTtZQUMxQixNQUFNO1lBQ04sWUFBWSxFQUFFLFVBQVUsQ0FBQyxZQUFZO1lBQ3JDLE1BQU0sRUFBRSxVQUFVLENBQUMsTUFBTTtTQUMxQixDQUFDLENBQUM7UUFFSCxrQkFBa0I7UUFDbEIsTUFBTSxRQUFRLEdBQUc7WUFDZixPQUFPLEVBQUUsSUFBSTtZQUNiLElBQUksRUFBRTtnQkFDSixZQUFZLEVBQUUsVUFBVSxDQUFDLFlBQVk7Z0JBQ3JDLE1BQU0sRUFBRSxVQUFVLENBQUMsTUFBTTtnQkFDekIsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNO2dCQUN6QixJQUFJLEVBQUUsVUFBVSxDQUFDLElBQUk7Z0JBQ3JCLE1BQU0sRUFBRSxVQUFVLENBQUMsTUFBTTtnQkFDekIsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRO2dCQUM3QixPQUFPLEVBQUUsVUFBVSxDQUFDLFdBQVc7YUFDaEM7WUFDRCxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDcEMsQ0FBQztRQUVGLE9BQU87WUFDTCxVQUFVLEVBQUUsVUFBVSxDQUFDLE1BQU0sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRztZQUN0RCxPQUFPLEVBQUU7Z0JBQ1AsY0FBYyxFQUFFLGtCQUFrQjtnQkFDbEMsNkJBQTZCLEVBQUUsR0FBRzthQUNuQztZQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztTQUMvQixDQUFDO0tBQ0g7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLElBQUEsNEJBQWEsRUFBQyxPQUFPLEVBQUUsb0NBQW9DLEVBQUU7WUFDM0QsU0FBUztZQUNULE1BQU0sRUFBRSxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU07WUFDcEMsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLGdDQUFpQixFQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztLQUM1QztBQUNILENBQUM7QUE5RUQsMEJBOEVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBKb2luIENsdWIgSGFuZGxlciAtIFBoYXNlIDIuMlxuICogXG4gKiBMYW1iZGEgaGFuZGxlciBmb3IgUE9TVCAvdjEvY2x1YnMve2lkfS9tZW1iZXJzIGVuZHBvaW50LlxuICogQWxsb3dzIGF1dGhlbnRpY2F0ZWQgdXNlcnMgdG8gam9pbiBjbHVicy5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMi4yIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTIuMi5jbHViLW1lbWJlcnNoaXAtcm9sZXMudjEubWRcbiAqL1xuXG5pbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBKb2luQ2x1YklucHV0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL21lbWJlcnNoaXAnO1xuaW1wb3J0IHsgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBjcmVhdGVTdWNjZXNzUmVzcG9uc2UsIGhhbmRsZUxhbWJkYUVycm9yLCBsb2dTdHJ1Y3R1cmVkLCBwYXJzZUpzb25Cb2R5IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvZXJyb3JzJztcbmltcG9ydCB7IER5bmFtb0RCVXNlclJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi8uLi91c2VyLXByb2ZpbGUvaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItdXNlci1yZXBvc2l0b3J5JztcbmltcG9ydCB7IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1jbHViLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJNZW1iZXJzaGlwUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLW1lbWJlcnNoaXAtcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBNZW1iZXJzaGlwU2VydmljZSB9IGZyb20gJy4uLy4uL2RvbWFpbi9tZW1iZXJzaGlwL21lbWJlcnNoaXAtc2VydmljZSc7XG5pbXBvcnQgeyBhdXRob3JpemF0aW9uU2VydmljZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRob3JpemF0aW9uL2F1dGhvcml6YXRpb24tc2VydmljZSc7XG5cbi8vIEVudmlyb25tZW50IHZhcmlhYmxlc1xuY29uc3QgVEFCTEVfTkFNRSA9IHByb2Nlc3MuZW52LlRBQkxFX05BTUUhO1xuXG4vLyBJbml0aWFsaXplIHJlcG9zaXRvcmllcyBhbmQgc2VydmljZXNcbmNvbnN0IHVzZXJSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCVXNlclJlcG9zaXRvcnkoVEFCTEVfTkFNRSk7XG5jb25zdCBjbHViUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQkNsdWJSZXBvc2l0b3J5KFRBQkxFX05BTUUpO1xuY29uc3QgbWVtYmVyc2hpcFJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJNZW1iZXJzaGlwUmVwb3NpdG9yeShUQUJMRV9OQU1FLCB1c2VyUmVwb3NpdG9yeSk7XG5jb25zdCBtZW1iZXJzaGlwU2VydmljZSA9IG5ldyBNZW1iZXJzaGlwU2VydmljZShtZW1iZXJzaGlwUmVwb3NpdG9yeSwgY2x1YlJlcG9zaXRvcnksIGF1dGhvcml6YXRpb25TZXJ2aWNlKTtcblxuLyoqXG4gKiBMYW1iZGEgaGFuZGxlciBmb3IgUE9TVCAvdjEvY2x1YnMve2lkfS9tZW1iZXJzXG4gKiBcbiAqIEBwYXJhbSBldmVudCAtIEFQSSBHYXRld2F5IHByb3h5IGV2ZW50XG4gKiBAcmV0dXJucyBBUEkgR2F0ZXdheSBwcm94eSByZXN1bHRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+IHtcbiAgY29uc3QgcmVxdWVzdElkID0gZXZlbnQucmVxdWVzdENvbnRleHQucmVxdWVzdElkO1xuICBcbiAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdQcm9jZXNzaW5nIGpvaW4gY2x1YiByZXF1ZXN0Jywge1xuICAgIHJlcXVlc3RJZCxcbiAgICBodHRwTWV0aG9kOiBldmVudC5odHRwTWV0aG9kLFxuICAgIHBhdGg6IGV2ZW50LnBhdGgsXG4gIH0pO1xuICBcbiAgdHJ5IHtcbiAgICAvLyBFeHRyYWN0IGNsdWIgSUQgZnJvbSBwYXRoIHBhcmFtZXRlcnNcbiAgICBjb25zdCBjbHViSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8uY2x1YklkO1xuICAgIFxuICAgIGlmICghY2x1YklkKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdDbHViIElEIGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgLy8gUGFyc2UgcmVxdWVzdCBib2R5XG4gICAgY29uc3Qgam9pbklucHV0ID0gcGFyc2VKc29uQm9keTxKb2luQ2x1YklucHV0PihldmVudCkgfHwge307XG5cbiAgICAvLyBDcmVhdGUgZW5oYW5jZWQgYXV0aGVudGljYXRpb24gY29udGV4dFxuICAgIGNvbnN0IGF1dGhDb250ZXh0ID0gYXdhaXQgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dChldmVudC5yZXF1ZXN0Q29udGV4dCwgdXNlclJlcG9zaXRvcnkpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdBdXRoZW50aWNhdGlvbiBjb250ZXh0IGNyZWF0ZWQnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGNsdWJJZCxcbiAgICAgIGlzQXV0aGVudGljYXRlZDogYXV0aENvbnRleHQuaXNBdXRoZW50aWNhdGVkLFxuICAgIH0pO1xuXG4gICAgLy8gVmFsaWRhdGUgdXNlciBpcyBhdXRoZW50aWNhdGVkXG4gICAgaWYgKCFhdXRoQ29udGV4dC5pc0F1dGhlbnRpY2F0ZWQpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0F1dGhlbnRpY2F0aW9uIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgLy8gSm9pbiBjbHViXG4gICAgY29uc3QgbWVtYmVyc2hpcCA9IGF3YWl0IG1lbWJlcnNoaXBTZXJ2aWNlLmpvaW5DbHViKGNsdWJJZCwgam9pbklucHV0LCBhdXRoQ29udGV4dCk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1VzZXIgam9pbmVkIGNsdWIgc3VjY2Vzc2Z1bGx5Jywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBjbHViSWQsXG4gICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgc3RhdHVzOiBtZW1iZXJzaGlwLnN0YXR1cyxcbiAgICB9KTtcblxuICAgIC8vIEZvcm1hdCByZXNwb25zZVxuICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgICAgY2x1YklkOiBtZW1iZXJzaGlwLmNsdWJJZCxcbiAgICAgICAgdXNlcklkOiBtZW1iZXJzaGlwLnVzZXJJZCxcbiAgICAgICAgcm9sZTogbWVtYmVyc2hpcC5yb2xlLFxuICAgICAgICBzdGF0dXM6IG1lbWJlcnNoaXAuc3RhdHVzLFxuICAgICAgICBqb2luZWRBdDogbWVtYmVyc2hpcC5qb2luZWRBdCxcbiAgICAgICAgbWVzc2FnZTogbWVtYmVyc2hpcC5qb2luTWVzc2FnZSxcbiAgICAgIH0sXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN0YXR1c0NvZGU6IG1lbWJlcnNoaXAuc3RhdHVzID09PSAnYWN0aXZlJyA/IDIwMSA6IDIwMiwgLy8gMjAxIGZvciBpbW1lZGlhdGUgam9pbiwgMjAyIGZvciBwZW5kaW5nXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW4nOiAnKicsXG4gICAgICB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UpLFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRXJyb3IgcHJvY2Vzc2luZyBqb2luIGNsdWIgcmVxdWVzdCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIGNsdWJJZDogZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNsdWJJZCxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICB9KTtcblxuICAgIHJldHVybiBoYW5kbGVMYW1iZGFFcnJvcihlcnJvciwgcmVxdWVzdElkKTtcbiAgfVxufSJdfQ==