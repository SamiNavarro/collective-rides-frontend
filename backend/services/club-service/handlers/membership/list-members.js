"use strict";
/**
 * List Club Members Handler - Phase 2.2
 *
 * Lambda handler for GET /v1/clubs/{id}/members endpoint.
 * Lists club members with role-based access control.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const membership_1 = require("../../../../shared/types/membership");
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
 * Lambda handler for GET /v1/clubs/{id}/members
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing list club members request', {
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
        // Parse query parameters
        const queryParams = event.queryStringParameters || {};
        // Parse limit
        let limit = membership_1.MEMBERSHIP_CONSTRAINTS.DEFAULT_LIST_LIMIT;
        if (queryParams.limit) {
            const parsedLimit = parseInt(queryParams.limit, 10);
            if (isNaN(parsedLimit) || parsedLimit < 1) {
                throw new errors_1.ValidationError('Limit must be a positive integer');
            }
            if (parsedLimit > membership_1.MEMBERSHIP_CONSTRAINTS.MAX_LIST_LIMIT) {
                throw new errors_1.ValidationError(`Limit cannot exceed ${membership_1.MEMBERSHIP_CONSTRAINTS.MAX_LIST_LIMIT}`);
            }
            limit = parsedLimit;
        }
        // Parse role filter
        let role;
        if (queryParams.role) {
            if (!Object.values(membership_1.ClubRole).includes(queryParams.role)) {
                throw new errors_1.ValidationError('Invalid role parameter');
            }
            role = queryParams.role;
        }
        // Parse status filter
        let status;
        if (queryParams.status) {
            if (!Object.values(membership_1.MembershipStatus).includes(queryParams.status)) {
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
            clubId,
            isAuthenticated: authContext.isAuthenticated,
        });
        // Check authorization - requires view_club_members capability
        await authService.requireClubCapability(authContext, clubId, club_authorization_1.ClubCapability.VIEW_CLUB_MEMBERS);
        (0, lambda_utils_1.logStructured)('INFO', 'Authorization successful', {
            requestId,
            userId: authContext.userId,
            clubId,
            capability: club_authorization_1.ClubCapability.VIEW_CLUB_MEMBERS,
        });
        // List club members
        const result = await membershipService.listClubMembers(clubId, {
            limit,
            role,
            status,
            cursor,
        }, authContext);
        (0, lambda_utils_1.logStructured)('INFO', 'Club members listed successfully', {
            requestId,
            userId: authContext.userId,
            clubId,
            resultCount: result.members.length,
            hasNextCursor: !!result.nextCursor,
        });
        // Format response
        const response = {
            success: true,
            data: result.members,
            pagination: {
                limit,
                nextCursor: result.nextCursor,
            },
            timestamp: new Date().toISOString(),
        };
        return (0, lambda_utils_1.createSuccessResponse)(response);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing list club members request', {
            requestId,
            clubId: event.pathParameters?.clubId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1tZW1iZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGlzdC1tZW1iZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBR0gsb0VBQXlHO0FBQ3pHLG9GQUE2RTtBQUM3RSx1RUFBaUY7QUFDakYsd0VBQWdIO0FBQ2hILDREQUFrRTtBQUNsRSw0R0FBdUc7QUFDdkcsNEZBQXVGO0FBQ3ZGLHdHQUFtRztBQUNuRyxtRkFBK0U7QUFDL0Usc0ZBQXlGO0FBQ3pGLGtHQUE4RjtBQUU5Rix3QkFBd0I7QUFDeEIsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFXLENBQUM7QUFFM0MsdUNBQXVDO0FBQ3ZDLE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RCxNQUFNLG9CQUFvQixHQUFHLElBQUksNkRBQTRCLENBQUMsVUFBVSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQzFGLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxzQ0FBaUIsQ0FBQyxvQkFBb0IsRUFBRSxjQUFjLEVBQUUsNENBQW9CLENBQUMsQ0FBQztBQUM1RyxNQUFNLFdBQVcsR0FBRyxJQUFJLDZDQUF3QixDQUFDLG9CQUFvQixFQUFFLDRDQUFvQixDQUFDLENBQUM7QUFFN0Y7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQTJCO0lBQ3ZELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO0lBRWpELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsc0NBQXNDLEVBQUU7UUFDNUQsU0FBUztRQUNULFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtRQUM1QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7S0FDakIsQ0FBQyxDQUFDO0lBRUgsSUFB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RSxrQ0FBa0MsRUFBRTtZQUN4RCxTQUFTO1lBQ1QsTUFBTSxFQUFFLFdBQVcsQ0FBQyxNQUFNO1lBQzFCLE1BQU07WUFDTixXQUFXLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNO1lBQ2xDLGFBQWEsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVU7U0FDbkMsQ0FBQyxDQUFDO1FBRUgsa0JBQWtCO1FBQ2xCLE1BQU0sUUFBUSxHQUFHO1lBQ2YsT0FBTyxFQUFFLElBQUk7WUFDYixJQUFJLEVBQUUsTUFBTSxDQUFDLE9BQU87WUFDcEIsVUFBVSxFQUFFO2dCQUNWLEtBQUs7Z0JBQ0wsVUFBVSxFQUFFLE1BQU0sQ0FBQyxVQUFVO2FBQzlCO1lBQ0QsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3BDLENBQUM7UUFFRixPQUFPLElBQUEsb0NBQXFCLEVBQUMsUUFBUSxDQUFDLENBQUM7S0FDeEM7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLElBQUEsNEJBQWEsRUFBQyxPQUFPLEVBQUUsNENBQTRDLEVBQUU7WUFDbkUsU0FBUztZQUNULE1BQU0sRUFBRSxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU07WUFDcEMsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLGdDQUFpQixFQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztLQUM1QztBQUNILENBQUM7QUEvR0QsMEJBK0dDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBMaXN0IENsdWIgTWVtYmVycyBIYW5kbGVyIC0gUGhhc2UgMi4yXG4gKiBcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBHRVQgL3YxL2NsdWJzL3tpZH0vbWVtYmVycyBlbmRwb2ludC5cbiAqIExpc3RzIGNsdWIgbWVtYmVycyB3aXRoIHJvbGUtYmFzZWQgYWNjZXNzIGNvbnRyb2wuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDIuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0yLjIuY2x1Yi1tZW1iZXJzaGlwLXJvbGVzLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgQ2x1YlJvbGUsIE1lbWJlcnNoaXBTdGF0dXMsIE1FTUJFUlNISVBfQ09OU1RSQUlOVFMgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvbWVtYmVyc2hpcCc7XG5pbXBvcnQgeyBDbHViQ2FwYWJpbGl0eSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9jbHViLWF1dGhvcml6YXRpb24nO1xuaW1wb3J0IHsgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBjcmVhdGVTdWNjZXNzUmVzcG9uc2UsIGhhbmRsZUxhbWJkYUVycm9yLCBsb2dTdHJ1Y3R1cmVkIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvZXJyb3JzJztcbmltcG9ydCB7IER5bmFtb0RCVXNlclJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi8uLi91c2VyLXByb2ZpbGUvaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItdXNlci1yZXBvc2l0b3J5JztcbmltcG9ydCB7IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1jbHViLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJNZW1iZXJzaGlwUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLW1lbWJlcnNoaXAtcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBNZW1iZXJzaGlwU2VydmljZSB9IGZyb20gJy4uLy4uL2RvbWFpbi9tZW1iZXJzaGlwL21lbWJlcnNoaXAtc2VydmljZSc7XG5pbXBvcnQgeyBDbHViQXV0aG9yaXphdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vYXV0aG9yaXphdGlvbi9jbHViLWF1dGhvcml6YXRpb24nO1xuaW1wb3J0IHsgYXV0aG9yaXphdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvYXV0aG9yaXphdGlvbi9hdXRob3JpemF0aW9uLXNlcnZpY2UnO1xuXG4vLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcbmNvbnN0IFRBQkxFX05BTUUgPSBwcm9jZXNzLmVudi5UQUJMRV9OQU1FITtcblxuLy8gSW5pdGlhbGl6ZSByZXBvc2l0b3JpZXMgYW5kIHNlcnZpY2VzXG5jb25zdCB1c2VyUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5KFRBQkxFX05BTUUpO1xuY29uc3QgY2x1YlJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJDbHViUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IG1lbWJlcnNoaXBSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCTWVtYmVyc2hpcFJlcG9zaXRvcnkoVEFCTEVfTkFNRSwgdXNlclJlcG9zaXRvcnkpO1xuY29uc3QgbWVtYmVyc2hpcFNlcnZpY2UgPSBuZXcgTWVtYmVyc2hpcFNlcnZpY2UobWVtYmVyc2hpcFJlcG9zaXRvcnksIGNsdWJSZXBvc2l0b3J5LCBhdXRob3JpemF0aW9uU2VydmljZSk7XG5jb25zdCBhdXRoU2VydmljZSA9IG5ldyBDbHViQXV0aG9yaXphdGlvblNlcnZpY2UobWVtYmVyc2hpcFJlcG9zaXRvcnksIGF1dGhvcml6YXRpb25TZXJ2aWNlKTtcblxuLyoqXG4gKiBMYW1iZGEgaGFuZGxlciBmb3IgR0VUIC92MS9jbHVicy97aWR9L21lbWJlcnNcbiAqIFxuICogQHBhcmFtIGV2ZW50IC0gQVBJIEdhdGV3YXkgcHJveHkgZXZlbnRcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xuICBjb25zdCByZXF1ZXN0SWQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5yZXF1ZXN0SWQ7XG4gIFxuICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1Byb2Nlc3NpbmcgbGlzdCBjbHViIG1lbWJlcnMgcmVxdWVzdCcsIHtcbiAgICByZXF1ZXN0SWQsXG4gICAgaHR0cE1ldGhvZDogZXZlbnQuaHR0cE1ldGhvZCxcbiAgICBwYXRoOiBldmVudC5wYXRoLFxuICB9KTtcbiAgXG4gIHRyeSB7XG4gICAgLy8gRXh0cmFjdCBjbHViIElEIGZyb20gcGF0aCBwYXJhbWV0ZXJzXG4gICAgY29uc3QgY2x1YklkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNsdWJJZDtcbiAgICBcbiAgICBpZiAoIWNsdWJJZCkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignQ2x1YiBJRCBpcyByZXF1aXJlZCcpO1xuICAgIH1cblxuICAgIC8vIFBhcnNlIHF1ZXJ5IHBhcmFtZXRlcnNcbiAgICBjb25zdCBxdWVyeVBhcmFtcyA9IGV2ZW50LnF1ZXJ5U3RyaW5nUGFyYW1ldGVycyB8fCB7fTtcbiAgICBcbiAgICAvLyBQYXJzZSBsaW1pdFxuICAgIGxldCBsaW1pdDogbnVtYmVyID0gTUVNQkVSU0hJUF9DT05TVFJBSU5UUy5ERUZBVUxUX0xJU1RfTElNSVQ7XG4gICAgaWYgKHF1ZXJ5UGFyYW1zLmxpbWl0KSB7XG4gICAgICBjb25zdCBwYXJzZWRMaW1pdCA9IHBhcnNlSW50KHF1ZXJ5UGFyYW1zLmxpbWl0LCAxMCk7XG4gICAgICBpZiAoaXNOYU4ocGFyc2VkTGltaXQpIHx8IHBhcnNlZExpbWl0IDwgMSkge1xuICAgICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdMaW1pdCBtdXN0IGJlIGEgcG9zaXRpdmUgaW50ZWdlcicpO1xuICAgICAgfVxuICAgICAgaWYgKHBhcnNlZExpbWl0ID4gTUVNQkVSU0hJUF9DT05TVFJBSU5UUy5NQVhfTElTVF9MSU1JVCkge1xuICAgICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKGBMaW1pdCBjYW5ub3QgZXhjZWVkICR7TUVNQkVSU0hJUF9DT05TVFJBSU5UUy5NQVhfTElTVF9MSU1JVH1gKTtcbiAgICAgIH1cbiAgICAgIGxpbWl0ID0gcGFyc2VkTGltaXQ7XG4gICAgfVxuICAgIFxuICAgIC8vIFBhcnNlIHJvbGUgZmlsdGVyXG4gICAgbGV0IHJvbGU6IENsdWJSb2xlIHwgdW5kZWZpbmVkO1xuICAgIGlmIChxdWVyeVBhcmFtcy5yb2xlKSB7XG4gICAgICBpZiAoIU9iamVjdC52YWx1ZXMoQ2x1YlJvbGUpLmluY2x1ZGVzKHF1ZXJ5UGFyYW1zLnJvbGUgYXMgQ2x1YlJvbGUpKSB7XG4gICAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0ludmFsaWQgcm9sZSBwYXJhbWV0ZXInKTtcbiAgICAgIH1cbiAgICAgIHJvbGUgPSBxdWVyeVBhcmFtcy5yb2xlIGFzIENsdWJSb2xlO1xuICAgIH1cbiAgICBcbiAgICAvLyBQYXJzZSBzdGF0dXMgZmlsdGVyXG4gICAgbGV0IHN0YXR1czogTWVtYmVyc2hpcFN0YXR1cyB8IHVuZGVmaW5lZDtcbiAgICBpZiAocXVlcnlQYXJhbXMuc3RhdHVzKSB7XG4gICAgICBpZiAoIU9iamVjdC52YWx1ZXMoTWVtYmVyc2hpcFN0YXR1cykuaW5jbHVkZXMocXVlcnlQYXJhbXMuc3RhdHVzIGFzIE1lbWJlcnNoaXBTdGF0dXMpKSB7XG4gICAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0ludmFsaWQgc3RhdHVzIHBhcmFtZXRlcicpO1xuICAgICAgfVxuICAgICAgc3RhdHVzID0gcXVlcnlQYXJhbXMuc3RhdHVzIGFzIE1lbWJlcnNoaXBTdGF0dXM7XG4gICAgfVxuICAgIFxuICAgIC8vIFBhcnNlIGN1cnNvclxuICAgIGNvbnN0IGN1cnNvciA9IHF1ZXJ5UGFyYW1zLmN1cnNvciB8fCB1bmRlZmluZWQ7XG5cbiAgICAvLyBDcmVhdGUgZW5oYW5jZWQgYXV0aGVudGljYXRpb24gY29udGV4dFxuICAgIGNvbnN0IGF1dGhDb250ZXh0ID0gYXdhaXQgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dChldmVudC5yZXF1ZXN0Q29udGV4dCwgdXNlclJlcG9zaXRvcnkpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdBdXRoZW50aWNhdGlvbiBjb250ZXh0IGNyZWF0ZWQnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGNsdWJJZCxcbiAgICAgIGlzQXV0aGVudGljYXRlZDogYXV0aENvbnRleHQuaXNBdXRoZW50aWNhdGVkLFxuICAgIH0pO1xuXG4gICAgLy8gQ2hlY2sgYXV0aG9yaXphdGlvbiAtIHJlcXVpcmVzIHZpZXdfY2x1Yl9tZW1iZXJzIGNhcGFiaWxpdHlcbiAgICBhd2FpdCBhdXRoU2VydmljZS5yZXF1aXJlQ2x1YkNhcGFiaWxpdHkoYXV0aENvbnRleHQsIGNsdWJJZCwgQ2x1YkNhcGFiaWxpdHkuVklFV19DTFVCX01FTUJFUlMpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdBdXRob3JpemF0aW9uIHN1Y2Nlc3NmdWwnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGNsdWJJZCxcbiAgICAgIGNhcGFiaWxpdHk6IENsdWJDYXBhYmlsaXR5LlZJRVdfQ0xVQl9NRU1CRVJTLFxuICAgIH0pO1xuXG4gICAgLy8gTGlzdCBjbHViIG1lbWJlcnNcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBtZW1iZXJzaGlwU2VydmljZS5saXN0Q2x1Yk1lbWJlcnMoY2x1YklkLCB7XG4gICAgICBsaW1pdCxcbiAgICAgIHJvbGUsXG4gICAgICBzdGF0dXMsXG4gICAgICBjdXJzb3IsXG4gICAgfSwgYXV0aENvbnRleHQpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdDbHViIG1lbWJlcnMgbGlzdGVkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgY2x1YklkLFxuICAgICAgcmVzdWx0Q291bnQ6IHJlc3VsdC5tZW1iZXJzLmxlbmd0aCxcbiAgICAgIGhhc05leHRDdXJzb3I6ICEhcmVzdWx0Lm5leHRDdXJzb3IsXG4gICAgfSk7XG5cbiAgICAvLyBGb3JtYXQgcmVzcG9uc2VcbiAgICBjb25zdCByZXNwb25zZSA9IHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiByZXN1bHQubWVtYmVycyxcbiAgICAgIHBhZ2luYXRpb246IHtcbiAgICAgICAgbGltaXQsXG4gICAgICAgIG5leHRDdXJzb3I6IHJlc3VsdC5uZXh0Q3Vyc29yLFxuICAgICAgfSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICByZXR1cm4gY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdFcnJvciBwcm9jZXNzaW5nIGxpc3QgY2x1YiBtZW1iZXJzIHJlcXVlc3QnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICBjbHViSWQ6IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5jbHViSWQsXG4gICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gaGFuZGxlTGFtYmRhRXJyb3IoZXJyb3IsIHJlcXVlc3RJZCk7XG4gIH1cbn0iXX0=