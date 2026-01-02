"use strict";
/**
 * Update Club Handler - Phase 2.1
 *
 * Lambda handler for PUT /clubs/{id} endpoint.
 * Admin endpoint for updating existing clubs (SiteAdmin only).
 *
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_context_1 = require("../../../shared/auth/auth-context");
const lambda_utils_1 = require("../../../shared/utils/lambda-utils");
const errors_1 = require("../../../shared/utils/errors");
const dynamodb_user_repository_1 = require("../../user-profile/infrastructure/dynamodb-user-repository");
const dynamodb_club_repository_1 = require("../infrastructure/dynamodb-club-repository");
const club_service_1 = require("../domain/club-service");
const authorization_1 = require("../../../shared/authorization");
// Environment variables
const TABLE_NAME = process.env.TABLE_NAME;
// Initialize repositories and services
const userRepository = new dynamodb_user_repository_1.DynamoDBUserRepository(TABLE_NAME);
const clubRepository = new dynamodb_club_repository_1.DynamoDBClubRepository(TABLE_NAME);
const clubService = new club_service_1.ClubService(clubRepository);
/**
 * Lambda handler for PUT /clubs/{id}
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing update club request', {
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
        const updateInput = (0, lambda_utils_1.parseJsonBody)(event);
        // Create enhanced authentication context
        const authContext = await (0, auth_context_1.createEnhancedAuthContext)(event.requestContext, userRepository);
        (0, lambda_utils_1.logStructured)('INFO', 'Authentication context created', {
            requestId,
            userId: authContext.userId,
            clubId,
            isAuthenticated: authContext.isAuthenticated,
            isSiteAdmin: authContext.isSiteAdmin,
            updateFields: Object.keys(updateInput),
        });
        // Check authorization - requires manage_all_clubs capability
        await (0, authorization_1.requireCapability)(authorization_1.SystemCapability.MANAGE_ALL_CLUBS, `club:${clubId}`)(authContext);
        (0, lambda_utils_1.logStructured)('INFO', 'Authorization successful', {
            requestId,
            userId: authContext.userId,
            clubId,
            capability: authorization_1.SystemCapability.MANAGE_ALL_CLUBS,
        });
        // Update club
        const updatedClub = await clubService.updateClub(clubId, updateInput);
        (0, lambda_utils_1.logStructured)('INFO', 'Club updated successfully', {
            requestId,
            userId: authContext.userId,
            clubId,
            clubName: updatedClub.name,
            status: updatedClub.status,
            updateFields: Object.keys(updateInput),
        });
        // Format response
        const response = {
            success: true,
            data: updatedClub,
            timestamp: new Date().toISOString(),
        };
        return (0, lambda_utils_1.createSuccessResponse)(response);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing update club request', {
            requestId,
            clubId: event.pathParameters?.clubId,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLWNsdWIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1cGRhdGUtY2x1Yi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUdILG9FQUE4RTtBQUM5RSxxRUFBNEg7QUFDNUgseURBQStEO0FBRS9ELHlHQUFvRztBQUNwRyx5RkFBb0Y7QUFDcEYseURBQXFEO0FBQ3JELGlFQUt1QztBQUV2Qyx3QkFBd0I7QUFDeEIsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFXLENBQUM7QUFFM0MsdUNBQXVDO0FBQ3ZDLE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RCxNQUFNLFdBQVcsR0FBRyxJQUFJLDBCQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFcEQ7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQTJCO0lBQ3ZELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO0lBRWpELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsZ0NBQWdDLEVBQUU7UUFDdEQsU0FBUztRQUNULFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtRQUM1QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7S0FDakIsQ0FBQyxDQUFDO0lBRUgsSUFBSTtRQUNGLHVDQUF1QztRQUN2QyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUU1QyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1gsTUFBTSxJQUFJLHdCQUFlLENBQUMscUJBQXFCLENBQUMsQ0FBQztTQUNsRDtRQUVELHFCQUFxQjtRQUNyQixNQUFNLFdBQVcsR0FBRyxJQUFBLDRCQUFhLEVBQWtCLEtBQUssQ0FBQyxDQUFDO1FBRTFELHlDQUF5QztRQUN6QyxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsd0NBQXlCLEVBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUUxRixJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLGdDQUFnQyxFQUFFO1lBQ3RELFNBQVM7WUFDVCxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07WUFDMUIsTUFBTTtZQUNOLGVBQWUsRUFBRSxXQUFXLENBQUMsZUFBZTtZQUM1QyxXQUFXLEVBQUUsV0FBVyxDQUFDLFdBQVc7WUFDcEMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO1NBQ3ZDLENBQUMsQ0FBQztRQUVILDZEQUE2RDtRQUM3RCxNQUFNLElBQUEsaUNBQWlCLEVBQUMsZ0NBQWdCLENBQUMsZ0JBQWdCLEVBQUUsUUFBUSxNQUFNLEVBQUUsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRTFGLElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsMEJBQTBCLEVBQUU7WUFDaEQsU0FBUztZQUNULE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTTtZQUMxQixNQUFNO1lBQ04sVUFBVSxFQUFFLGdDQUFnQixDQUFDLGdCQUFnQjtTQUM5QyxDQUFDLENBQUM7UUFFSCxjQUFjO1FBQ2QsTUFBTSxXQUFXLEdBQUcsTUFBTSxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztRQUV0RSxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLDJCQUEyQixFQUFFO1lBQ2pELFNBQVM7WUFDVCxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07WUFDMUIsTUFBTTtZQUNOLFFBQVEsRUFBRSxXQUFXLENBQUMsSUFBSTtZQUMxQixNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07WUFDMUIsWUFBWSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDO1NBQ3ZDLENBQUMsQ0FBQztRQUVILGtCQUFrQjtRQUNsQixNQUFNLFFBQVEsR0FBRztZQUNmLE9BQU8sRUFBRSxJQUFJO1lBQ2IsSUFBSSxFQUFFLFdBQVc7WUFDakIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3BDLENBQUM7UUFFRixPQUFPLElBQUEsb0NBQXFCLEVBQUMsUUFBUSxDQUFDLENBQUM7S0FDeEM7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLElBQUEsNEJBQWEsRUFBQyxPQUFPLEVBQUUsc0NBQXNDLEVBQUU7WUFDN0QsU0FBUztZQUNULE1BQU0sRUFBRSxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU07WUFDcEMsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsMERBQTBEO1FBQzFELElBQUksSUFBQSxvQ0FBb0IsRUFBQyxLQUFLLENBQUMsRUFBRTtZQUMvQixPQUFPO2dCQUNMLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtnQkFDNUIsT0FBTyxFQUFFO29CQUNQLGNBQWMsRUFBRSxrQkFBa0I7b0JBQ2xDLDZCQUE2QixFQUFFLEdBQUc7aUJBQ25DO2dCQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsZ0RBQWdDLEVBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2FBQ3pFLENBQUM7U0FDSDtRQUVELE9BQU8sSUFBQSxnQ0FBaUIsRUFBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDNUM7QUFDSCxDQUFDO0FBbkZELDBCQW1GQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVXBkYXRlIENsdWIgSGFuZGxlciAtIFBoYXNlIDIuMVxuICogXG4gKiBMYW1iZGEgaGFuZGxlciBmb3IgUFVUIC9jbHVicy97aWR9IGVuZHBvaW50LlxuICogQWRtaW4gZW5kcG9pbnQgZm9yIHVwZGF0aW5nIGV4aXN0aW5nIGNsdWJzIChTaXRlQWRtaW4gb25seSkuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDIuMSBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0yLjEuY2x1Yi1zZXJ2aWNlLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBjcmVhdGVTdWNjZXNzUmVzcG9uc2UsIGhhbmRsZUxhbWJkYUVycm9yLCBsb2dTdHJ1Y3R1cmVkLCBwYXJzZUpzb25Cb2R5IH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMvZXJyb3JzJztcbmltcG9ydCB7IFVwZGF0ZUNsdWJJbnB1dCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC90eXBlcy9jbHViJztcbmltcG9ydCB7IER5bmFtb0RCVXNlclJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi91c2VyLXByb2ZpbGUvaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItdXNlci1yZXBvc2l0b3J5JztcbmltcG9ydCB7IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkgfSBmcm9tICcuLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1jbHViLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgQ2x1YlNlcnZpY2UgfSBmcm9tICcuLi9kb21haW4vY2x1Yi1zZXJ2aWNlJztcbmltcG9ydCB7IFxuICBTeXN0ZW1DYXBhYmlsaXR5LCBcbiAgcmVxdWlyZUNhcGFiaWxpdHksXG4gIGNyZWF0ZUF1dGhvcml6YXRpb25FcnJvclJlc3BvbnNlLFxuICBpc0F1dGhvcml6YXRpb25FcnJvciBcbn0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL2F1dGhvcml6YXRpb24nO1xuXG4vLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcbmNvbnN0IFRBQkxFX05BTUUgPSBwcm9jZXNzLmVudi5UQUJMRV9OQU1FITtcblxuLy8gSW5pdGlhbGl6ZSByZXBvc2l0b3JpZXMgYW5kIHNlcnZpY2VzXG5jb25zdCB1c2VyUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5KFRBQkxFX05BTUUpO1xuY29uc3QgY2x1YlJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJDbHViUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IGNsdWJTZXJ2aWNlID0gbmV3IENsdWJTZXJ2aWNlKGNsdWJSZXBvc2l0b3J5KTtcblxuLyoqXG4gKiBMYW1iZGEgaGFuZGxlciBmb3IgUFVUIC9jbHVicy97aWR9XG4gKiBcbiAqIEBwYXJhbSBldmVudCAtIEFQSSBHYXRld2F5IHByb3h5IGV2ZW50XG4gKiBAcmV0dXJucyBBUEkgR2F0ZXdheSBwcm94eSByZXN1bHRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+IHtcbiAgY29uc3QgcmVxdWVzdElkID0gZXZlbnQucmVxdWVzdENvbnRleHQucmVxdWVzdElkO1xuICBcbiAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdQcm9jZXNzaW5nIHVwZGF0ZSBjbHViIHJlcXVlc3QnLCB7XG4gICAgcmVxdWVzdElkLFxuICAgIGh0dHBNZXRob2Q6IGV2ZW50Lmh0dHBNZXRob2QsXG4gICAgcGF0aDogZXZlbnQucGF0aCxcbiAgfSk7XG4gIFxuICB0cnkge1xuICAgIC8vIEV4dHJhY3QgY2x1YiBJRCBmcm9tIHBhdGggcGFyYW1ldGVyc1xuICAgIGNvbnN0IGNsdWJJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5jbHViSWQ7XG4gICAgXG4gICAgaWYgKCFjbHViSWQpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0NsdWIgSUQgaXMgcmVxdWlyZWQnKTtcbiAgICB9XG5cbiAgICAvLyBQYXJzZSByZXF1ZXN0IGJvZHlcbiAgICBjb25zdCB1cGRhdGVJbnB1dCA9IHBhcnNlSnNvbkJvZHk8VXBkYXRlQ2x1YklucHV0PihldmVudCk7XG5cbiAgICAvLyBDcmVhdGUgZW5oYW5jZWQgYXV0aGVudGljYXRpb24gY29udGV4dFxuICAgIGNvbnN0IGF1dGhDb250ZXh0ID0gYXdhaXQgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dChldmVudC5yZXF1ZXN0Q29udGV4dCwgdXNlclJlcG9zaXRvcnkpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdBdXRoZW50aWNhdGlvbiBjb250ZXh0IGNyZWF0ZWQnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGNsdWJJZCxcbiAgICAgIGlzQXV0aGVudGljYXRlZDogYXV0aENvbnRleHQuaXNBdXRoZW50aWNhdGVkLFxuICAgICAgaXNTaXRlQWRtaW46IGF1dGhDb250ZXh0LmlzU2l0ZUFkbWluLFxuICAgICAgdXBkYXRlRmllbGRzOiBPYmplY3Qua2V5cyh1cGRhdGVJbnB1dCksXG4gICAgfSk7XG5cbiAgICAvLyBDaGVjayBhdXRob3JpemF0aW9uIC0gcmVxdWlyZXMgbWFuYWdlX2FsbF9jbHVicyBjYXBhYmlsaXR5XG4gICAgYXdhaXQgcmVxdWlyZUNhcGFiaWxpdHkoU3lzdGVtQ2FwYWJpbGl0eS5NQU5BR0VfQUxMX0NMVUJTLCBgY2x1Yjoke2NsdWJJZH1gKShhdXRoQ29udGV4dCk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0F1dGhvcml6YXRpb24gc3VjY2Vzc2Z1bCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgY2x1YklkLFxuICAgICAgY2FwYWJpbGl0eTogU3lzdGVtQ2FwYWJpbGl0eS5NQU5BR0VfQUxMX0NMVUJTLFxuICAgIH0pO1xuXG4gICAgLy8gVXBkYXRlIGNsdWJcbiAgICBjb25zdCB1cGRhdGVkQ2x1YiA9IGF3YWl0IGNsdWJTZXJ2aWNlLnVwZGF0ZUNsdWIoY2x1YklkLCB1cGRhdGVJbnB1dCk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0NsdWIgdXBkYXRlZCBzdWNjZXNzZnVsbHknLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGNsdWJJZCxcbiAgICAgIGNsdWJOYW1lOiB1cGRhdGVkQ2x1Yi5uYW1lLFxuICAgICAgc3RhdHVzOiB1cGRhdGVkQ2x1Yi5zdGF0dXMsXG4gICAgICB1cGRhdGVGaWVsZHM6IE9iamVjdC5rZXlzKHVwZGF0ZUlucHV0KSxcbiAgICB9KTtcblxuICAgIC8vIEZvcm1hdCByZXNwb25zZVxuICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHVwZGF0ZWRDbHViLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcblxuICAgIHJldHVybiBjcmVhdGVTdWNjZXNzUmVzcG9uc2UocmVzcG9uc2UpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ1N0cnVjdHVyZWQoJ0VSUk9SJywgJ0Vycm9yIHByb2Nlc3NpbmcgdXBkYXRlIGNsdWIgcmVxdWVzdCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIGNsdWJJZDogZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNsdWJJZCxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICB9KTtcblxuICAgIC8vIEhhbmRsZSBhdXRob3JpemF0aW9uIGVycm9ycyB3aXRoIHByb3BlciByZXNwb25zZSBmb3JtYXRcbiAgICBpZiAoaXNBdXRob3JpemF0aW9uRXJyb3IoZXJyb3IpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShjcmVhdGVBdXRob3JpemF0aW9uRXJyb3JSZXNwb25zZShlcnJvciwgcmVxdWVzdElkKSksXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBoYW5kbGVMYW1iZGFFcnJvcihlcnJvciwgcmVxdWVzdElkKTtcbiAgfVxufSJdfQ==