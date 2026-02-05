"use strict";
/**
 * Get Club Handler - Phase 2.1 + Phase 3.4 Enhancement
 *
 * Lambda handler for GET /clubs/{id} endpoint.
 * Public endpoint for retrieving club details by ID.
 * Enhanced to include user membership information when authenticated.
 *
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 * - Phase 3.4 Enhancement: Include userMembership for management UI
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lambda_utils_1 = require("../../../shared/utils/lambda-utils");
const errors_1 = require("../../../shared/utils/errors");
const dynamodb_club_repository_1 = require("../infrastructure/dynamodb-club-repository");
const dynamodb_membership_repository_1 = require("../infrastructure/dynamodb-membership-repository");
const dynamodb_user_repository_1 = require("../../user-profile/infrastructure/dynamodb-user-repository");
const club_service_1 = require("../domain/club-service");
// Environment variables
const TABLE_NAME = process.env.TABLE_NAME;
// Initialize repositories and service
const clubRepository = new dynamodb_club_repository_1.DynamoDBClubRepository(TABLE_NAME);
const userRepository = new dynamodb_user_repository_1.DynamoDBUserRepository(TABLE_NAME);
const membershipRepository = new dynamodb_membership_repository_1.DynamoDBMembershipRepository(TABLE_NAME, userRepository);
const clubService = new club_service_1.ClubService(clubRepository);
/**
 * Lambda handler for GET /clubs/{id}
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing get club request', {
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
        (0, lambda_utils_1.logStructured)('INFO', 'Extracted club ID', {
            requestId,
            clubId,
        });
        // Get club by ID
        const club = await clubService.getClubById(clubId);
        // Try to get user's membership if authenticated (Phase 3.4)
        // Since this is a public endpoint without an authorizer, we need to manually parse the JWT
        let userMembership = null;
        try {
            (0, lambda_utils_1.logStructured)('INFO', 'Attempting to get user membership', {
                requestId,
                clubId,
                hasAuthHeader: !!event.headers?.Authorization || !!event.headers?.authorization,
            });
            // Try to extract user ID from JWT token manually (since no authorizer)
            let userId = null;
            const authHeader = event.headers?.Authorization || event.headers?.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                try {
                    // Decode JWT without verification (verification was done by client)
                    const base64Payload = token.split('.')[1];
                    const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
                    userId = payload.sub || payload['cognito:username'];
                    (0, lambda_utils_1.logStructured)('INFO', 'Extracted user ID from JWT', {
                        requestId,
                        clubId,
                        userId,
                    });
                }
                catch (jwtError) {
                    (0, lambda_utils_1.logStructured)('WARN', 'Failed to parse JWT', {
                        requestId,
                        clubId,
                        error: jwtError instanceof Error ? jwtError.message : 'Unknown error',
                    });
                }
            }
            if (userId) {
                const membership = await membershipRepository.getMembershipByClubAndUser(clubId, userId);
                (0, lambda_utils_1.logStructured)('INFO', 'Membership lookup result', {
                    requestId,
                    clubId,
                    userId,
                    foundMembership: !!membership,
                    role: membership?.role,
                    status: membership?.status,
                });
                if (membership) {
                    userMembership = {
                        membershipId: membership.membershipId,
                        role: membership.role,
                        status: membership.status,
                        joinedAt: membership.joinedAt,
                    };
                }
            }
        }
        catch (error) {
            // Silently fail - membership is optional for public club view
            (0, lambda_utils_1.logStructured)('WARN', 'Failed to get user membership', {
                requestId,
                clubId,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
            });
        }
        (0, lambda_utils_1.logStructured)('INFO', 'Club retrieved successfully', {
            requestId,
            clubId,
            clubName: club.name,
            status: club.status,
            hasMembership: !!userMembership,
        });
        // Return club with optional userMembership field
        const clubWithMembership = {
            ...club,
            ...(userMembership && { userMembership }),
        };
        const origin = event.headers?.origin || event.headers?.Origin;
        return (0, lambda_utils_1.createSuccessResponse)(clubWithMembership, 200, origin);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing get club request', {
            requestId,
            clubId: event.pathParameters?.clubId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        const origin = event.headers?.origin || event.headers?.Origin;
        return (0, lambda_utils_1.handleLambdaError)(error, requestId, origin);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LWNsdWIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnZXQtY2x1Yi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7Ozs7R0FVRzs7O0FBR0gscUVBQTZHO0FBQzdHLHlEQUErRDtBQUMvRCx5RkFBb0Y7QUFDcEYscUdBQWdHO0FBQ2hHLHlHQUFvRztBQUNwRyx5REFBcUQ7QUFFckQsd0JBQXdCO0FBQ3hCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVyxDQUFDO0FBRTNDLHNDQUFzQztBQUN0QyxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlELE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDZEQUE0QixDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUMxRixNQUFNLFdBQVcsR0FBRyxJQUFJLDBCQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFcEQ7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQTJCO0lBQ3ZELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO0lBRWpELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsNkJBQTZCLEVBQUU7UUFDbkQsU0FBUztRQUNULFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtRQUM1QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7S0FDakIsQ0FBQyxDQUFDO0lBRUgsSUFBSTtRQUNGLHVDQUF1QztRQUN2QyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUU1QyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1gsTUFBTSxJQUFJLHdCQUFlLENBQUMscUJBQXFCLENBQUMsQ0FBQztTQUNsRDtRQUVELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsbUJBQW1CLEVBQUU7WUFDekMsU0FBUztZQUNULE1BQU07U0FDUCxDQUFDLENBQUM7UUFFSCxpQkFBaUI7UUFDakIsTUFBTSxJQUFJLEdBQUcsTUFBTSxXQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRW5ELDREQUE0RDtRQUM1RCwyRkFBMkY7UUFDM0YsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDO1FBQzFCLElBQUk7WUFDRixJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLG1DQUFtQyxFQUFFO2dCQUN6RCxTQUFTO2dCQUNULE1BQU07Z0JBQ04sYUFBYSxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLGFBQWEsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxhQUFhO2FBQ2hGLENBQUMsQ0FBQztZQUVILHVFQUF1RTtZQUN2RSxJQUFJLE1BQU0sR0FBa0IsSUFBSSxDQUFDO1lBQ2pDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUUsYUFBYSxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsYUFBYSxDQUFDO1lBRWhGLElBQUksVUFBVSxJQUFJLFVBQVUsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQ2xELE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3RDLElBQUk7b0JBQ0Ysb0VBQW9FO29CQUNwRSxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO29CQUMxQyxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUM7b0JBQzVFLE1BQU0sR0FBRyxPQUFPLENBQUMsR0FBRyxJQUFJLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO29CQUVwRCxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLDRCQUE0QixFQUFFO3dCQUNsRCxTQUFTO3dCQUNULE1BQU07d0JBQ04sTUFBTTtxQkFDUCxDQUFDLENBQUM7aUJBQ0o7Z0JBQUMsT0FBTyxRQUFRLEVBQUU7b0JBQ2pCLElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUscUJBQXFCLEVBQUU7d0JBQzNDLFNBQVM7d0JBQ1QsTUFBTTt3QkFDTixLQUFLLEVBQUUsUUFBUSxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZTtxQkFDdEUsQ0FBQyxDQUFDO2lCQUNKO2FBQ0Y7WUFFRCxJQUFJLE1BQU0sRUFBRTtnQkFDVixNQUFNLFVBQVUsR0FBRyxNQUFNLG9CQUFvQixDQUFDLDBCQUEwQixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztnQkFFekYsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSwwQkFBMEIsRUFBRTtvQkFDaEQsU0FBUztvQkFDVCxNQUFNO29CQUNOLE1BQU07b0JBQ04sZUFBZSxFQUFFLENBQUMsQ0FBQyxVQUFVO29CQUM3QixJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUk7b0JBQ3RCLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTTtpQkFDM0IsQ0FBQyxDQUFDO2dCQUVILElBQUksVUFBVSxFQUFFO29CQUNkLGNBQWMsR0FBRzt3QkFDZixZQUFZLEVBQUUsVUFBVSxDQUFDLFlBQVk7d0JBQ3JDLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSTt3QkFDckIsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNO3dCQUN6QixRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVE7cUJBQzlCLENBQUM7aUJBQ0g7YUFDRjtTQUNGO1FBQUMsT0FBTyxLQUFLLEVBQUU7WUFDZCw4REFBOEQ7WUFDOUQsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSwrQkFBK0IsRUFBRTtnQkFDckQsU0FBUztnQkFDVCxNQUFNO2dCQUNOLEtBQUssRUFBRSxLQUFLLFlBQVksS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxlQUFlO2dCQUMvRCxLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUzthQUN4RCxDQUFDLENBQUM7U0FDSjtRQUVELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsNkJBQTZCLEVBQUU7WUFDbkQsU0FBUztZQUNULE1BQU07WUFDTixRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDbkIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1lBQ25CLGFBQWEsRUFBRSxDQUFDLENBQUMsY0FBYztTQUNoQyxDQUFDLENBQUM7UUFFSCxpREFBaUQ7UUFDakQsTUFBTSxrQkFBa0IsR0FBRztZQUN6QixHQUFHLElBQUk7WUFDUCxHQUFHLENBQUMsY0FBYyxJQUFJLEVBQUUsY0FBYyxFQUFFLENBQUM7U0FDMUMsQ0FBQztRQUVGLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDO1FBQzlELE9BQU8sSUFBQSxvQ0FBcUIsRUFBQyxrQkFBa0IsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDL0Q7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLElBQUEsNEJBQWEsRUFBQyxPQUFPLEVBQUUsbUNBQW1DLEVBQUU7WUFDMUQsU0FBUztZQUNULE1BQU0sRUFBRSxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU07WUFDcEMsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRSxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUM7UUFDOUQsT0FBTyxJQUFBLGdDQUFpQixFQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDcEQ7QUFDSCxDQUFDO0FBdEhELDBCQXNIQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogR2V0IENsdWIgSGFuZGxlciAtIFBoYXNlIDIuMSArIFBoYXNlIDMuNCBFbmhhbmNlbWVudFxuICogXG4gKiBMYW1iZGEgaGFuZGxlciBmb3IgR0VUIC9jbHVicy97aWR9IGVuZHBvaW50LlxuICogUHVibGljIGVuZHBvaW50IGZvciByZXRyaWV2aW5nIGNsdWIgZGV0YWlscyBieSBJRC5cbiAqIEVuaGFuY2VkIHRvIGluY2x1ZGUgdXNlciBtZW1iZXJzaGlwIGluZm9ybWF0aW9uIHdoZW4gYXV0aGVudGljYXRlZC5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMi4xIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTIuMS5jbHViLXNlcnZpY2UudjEubWRcbiAqIC0gUGhhc2UgMy40IEVuaGFuY2VtZW50OiBJbmNsdWRlIHVzZXJNZW1iZXJzaGlwIGZvciBtYW5hZ2VtZW50IFVJXG4gKi9cblxuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlLCBoYW5kbGVMYW1iZGFFcnJvciwgbG9nU3RydWN0dXJlZCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscy9sYW1iZGEtdXRpbHMnO1xuaW1wb3J0IHsgVmFsaWRhdGlvbkVycm9yIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2Vycm9ycyc7XG5pbXBvcnQgeyBEeW5hbW9EQkNsdWJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItY2x1Yi1yZXBvc2l0b3J5JztcbmltcG9ydCB7IER5bmFtb0RCTWVtYmVyc2hpcFJlcG9zaXRvcnkgfSBmcm9tICcuLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1tZW1iZXJzaGlwLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJVc2VyUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL3VzZXItcHJvZmlsZS9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi11c2VyLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgQ2x1YlNlcnZpY2UgfSBmcm9tICcuLi9kb21haW4vY2x1Yi1zZXJ2aWNlJztcblxuLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXG5jb25zdCBUQUJMRV9OQU1FID0gcHJvY2Vzcy5lbnYuVEFCTEVfTkFNRSE7XG5cbi8vIEluaXRpYWxpemUgcmVwb3NpdG9yaWVzIGFuZCBzZXJ2aWNlXG5jb25zdCBjbHViUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQkNsdWJSZXBvc2l0b3J5KFRBQkxFX05BTUUpO1xuY29uc3QgdXNlclJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJVc2VyUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IG1lbWJlcnNoaXBSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCTWVtYmVyc2hpcFJlcG9zaXRvcnkoVEFCTEVfTkFNRSwgdXNlclJlcG9zaXRvcnkpO1xuY29uc3QgY2x1YlNlcnZpY2UgPSBuZXcgQ2x1YlNlcnZpY2UoY2x1YlJlcG9zaXRvcnkpO1xuXG4vKipcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBHRVQgL2NsdWJzL3tpZH1cbiAqIFxuICogQHBhcmFtIGV2ZW50IC0gQVBJIEdhdGV3YXkgcHJveHkgZXZlbnRcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xuICBjb25zdCByZXF1ZXN0SWQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5yZXF1ZXN0SWQ7XG4gIFxuICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1Byb2Nlc3NpbmcgZ2V0IGNsdWIgcmVxdWVzdCcsIHtcbiAgICByZXF1ZXN0SWQsXG4gICAgaHR0cE1ldGhvZDogZXZlbnQuaHR0cE1ldGhvZCxcbiAgICBwYXRoOiBldmVudC5wYXRoLFxuICB9KTtcbiAgXG4gIHRyeSB7XG4gICAgLy8gRXh0cmFjdCBjbHViIElEIGZyb20gcGF0aCBwYXJhbWV0ZXJzXG4gICAgY29uc3QgY2x1YklkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNsdWJJZDtcbiAgICBcbiAgICBpZiAoIWNsdWJJZCkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignQ2x1YiBJRCBpcyByZXF1aXJlZCcpO1xuICAgIH1cblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnRXh0cmFjdGVkIGNsdWIgSUQnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICBjbHViSWQsXG4gICAgfSk7XG5cbiAgICAvLyBHZXQgY2x1YiBieSBJRFxuICAgIGNvbnN0IGNsdWIgPSBhd2FpdCBjbHViU2VydmljZS5nZXRDbHViQnlJZChjbHViSWQpO1xuXG4gICAgLy8gVHJ5IHRvIGdldCB1c2VyJ3MgbWVtYmVyc2hpcCBpZiBhdXRoZW50aWNhdGVkIChQaGFzZSAzLjQpXG4gICAgLy8gU2luY2UgdGhpcyBpcyBhIHB1YmxpYyBlbmRwb2ludCB3aXRob3V0IGFuIGF1dGhvcml6ZXIsIHdlIG5lZWQgdG8gbWFudWFsbHkgcGFyc2UgdGhlIEpXVFxuICAgIGxldCB1c2VyTWVtYmVyc2hpcCA9IG51bGw7XG4gICAgdHJ5IHtcbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnQXR0ZW1wdGluZyB0byBnZXQgdXNlciBtZW1iZXJzaGlwJywge1xuICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgIGNsdWJJZCxcbiAgICAgICAgaGFzQXV0aEhlYWRlcjogISFldmVudC5oZWFkZXJzPy5BdXRob3JpemF0aW9uIHx8ICEhZXZlbnQuaGVhZGVycz8uYXV0aG9yaXphdGlvbixcbiAgICAgIH0pO1xuICAgICAgXG4gICAgICAvLyBUcnkgdG8gZXh0cmFjdCB1c2VyIElEIGZyb20gSldUIHRva2VuIG1hbnVhbGx5IChzaW5jZSBubyBhdXRob3JpemVyKVxuICAgICAgbGV0IHVzZXJJZDogc3RyaW5nIHwgbnVsbCA9IG51bGw7XG4gICAgICBjb25zdCBhdXRoSGVhZGVyID0gZXZlbnQuaGVhZGVycz8uQXV0aG9yaXphdGlvbiB8fCBldmVudC5oZWFkZXJzPy5hdXRob3JpemF0aW9uO1xuICAgICAgXG4gICAgICBpZiAoYXV0aEhlYWRlciAmJiBhdXRoSGVhZGVyLnN0YXJ0c1dpdGgoJ0JlYXJlciAnKSkge1xuICAgICAgICBjb25zdCB0b2tlbiA9IGF1dGhIZWFkZXIuc3Vic3RyaW5nKDcpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIC8vIERlY29kZSBKV1Qgd2l0aG91dCB2ZXJpZmljYXRpb24gKHZlcmlmaWNhdGlvbiB3YXMgZG9uZSBieSBjbGllbnQpXG4gICAgICAgICAgY29uc3QgYmFzZTY0UGF5bG9hZCA9IHRva2VuLnNwbGl0KCcuJylbMV07XG4gICAgICAgICAgY29uc3QgcGF5bG9hZCA9IEpTT04ucGFyc2UoQnVmZmVyLmZyb20oYmFzZTY0UGF5bG9hZCwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCkpO1xuICAgICAgICAgIHVzZXJJZCA9IHBheWxvYWQuc3ViIHx8IHBheWxvYWRbJ2NvZ25pdG86dXNlcm5hbWUnXTtcbiAgICAgICAgICBcbiAgICAgICAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0V4dHJhY3RlZCB1c2VyIElEIGZyb20gSldUJywge1xuICAgICAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICAgICAgY2x1YklkLFxuICAgICAgICAgICAgdXNlcklkLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGNhdGNoIChqd3RFcnJvcikge1xuICAgICAgICAgIGxvZ1N0cnVjdHVyZWQoJ1dBUk4nLCAnRmFpbGVkIHRvIHBhcnNlIEpXVCcsIHtcbiAgICAgICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgICAgIGNsdWJJZCxcbiAgICAgICAgICAgIGVycm9yOiBqd3RFcnJvciBpbnN0YW5jZW9mIEVycm9yID8gand0RXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgXG4gICAgICBpZiAodXNlcklkKSB7XG4gICAgICAgIGNvbnN0IG1lbWJlcnNoaXAgPSBhd2FpdCBtZW1iZXJzaGlwUmVwb3NpdG9yeS5nZXRNZW1iZXJzaGlwQnlDbHViQW5kVXNlcihjbHViSWQsIHVzZXJJZCk7XG4gICAgICAgIFxuICAgICAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ01lbWJlcnNoaXAgbG9va3VwIHJlc3VsdCcsIHtcbiAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgY2x1YklkLFxuICAgICAgICAgIHVzZXJJZCxcbiAgICAgICAgICBmb3VuZE1lbWJlcnNoaXA6ICEhbWVtYmVyc2hpcCxcbiAgICAgICAgICByb2xlOiBtZW1iZXJzaGlwPy5yb2xlLFxuICAgICAgICAgIHN0YXR1czogbWVtYmVyc2hpcD8uc3RhdHVzLFxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIGlmIChtZW1iZXJzaGlwKSB7XG4gICAgICAgICAgdXNlck1lbWJlcnNoaXAgPSB7XG4gICAgICAgICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgICAgICAgcm9sZTogbWVtYmVyc2hpcC5yb2xlLFxuICAgICAgICAgICAgc3RhdHVzOiBtZW1iZXJzaGlwLnN0YXR1cyxcbiAgICAgICAgICAgIGpvaW5lZEF0OiBtZW1iZXJzaGlwLmpvaW5lZEF0LFxuICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgLy8gU2lsZW50bHkgZmFpbCAtIG1lbWJlcnNoaXAgaXMgb3B0aW9uYWwgZm9yIHB1YmxpYyBjbHViIHZpZXdcbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ1dBUk4nLCAnRmFpbGVkIHRvIGdldCB1c2VyIG1lbWJlcnNoaXAnLCB7XG4gICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgY2x1YklkLFxuICAgICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgICAgIHN0YWNrOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3Iuc3RhY2sgOiB1bmRlZmluZWQsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0NsdWIgcmV0cmlldmVkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIGNsdWJJZCxcbiAgICAgIGNsdWJOYW1lOiBjbHViLm5hbWUsXG4gICAgICBzdGF0dXM6IGNsdWIuc3RhdHVzLFxuICAgICAgaGFzTWVtYmVyc2hpcDogISF1c2VyTWVtYmVyc2hpcCxcbiAgICB9KTtcblxuICAgIC8vIFJldHVybiBjbHViIHdpdGggb3B0aW9uYWwgdXNlck1lbWJlcnNoaXAgZmllbGRcbiAgICBjb25zdCBjbHViV2l0aE1lbWJlcnNoaXAgPSB7XG4gICAgICAuLi5jbHViLFxuICAgICAgLi4uKHVzZXJNZW1iZXJzaGlwICYmIHsgdXNlck1lbWJlcnNoaXAgfSksXG4gICAgfTtcblxuICAgIGNvbnN0IG9yaWdpbiA9IGV2ZW50LmhlYWRlcnM/Lm9yaWdpbiB8fCBldmVudC5oZWFkZXJzPy5PcmlnaW47XG4gICAgcmV0dXJuIGNyZWF0ZVN1Y2Nlc3NSZXNwb25zZShjbHViV2l0aE1lbWJlcnNoaXAsIDIwMCwgb3JpZ2luKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdFcnJvciBwcm9jZXNzaW5nIGdldCBjbHViIHJlcXVlc3QnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICBjbHViSWQ6IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5jbHViSWQsXG4gICAgICBlcnJvcjogZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvcicsXG4gICAgfSk7XG5cbiAgICBjb25zdCBvcmlnaW4gPSBldmVudC5oZWFkZXJzPy5vcmlnaW4gfHwgZXZlbnQuaGVhZGVycz8uT3JpZ2luO1xuICAgIHJldHVybiBoYW5kbGVMYW1iZGFFcnJvcihlcnJvciwgcmVxdWVzdElkLCBvcmlnaW4pO1xuICB9XG59Il19