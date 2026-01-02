"use strict";
/**
 * Create Club Handler - Phase 2.1
 *
 * Lambda handler for POST /clubs endpoint.
 * Admin endpoint for creating new clubs (SiteAdmin only).
 *
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const auth_context_1 = require("../../../shared/auth/auth-context");
const lambda_utils_1 = require("../../../shared/utils/lambda-utils");
const lambda_utils_2 = require("../../../shared/utils/lambda-utils");
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
 * Lambda handler for POST /clubs
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing create club request', {
        requestId,
        httpMethod: event.httpMethod,
        path: event.path,
    });
    try {
        // Parse request body
        const createInput = (0, lambda_utils_2.parseJsonBody)(event);
        // Create enhanced authentication context
        const authContext = await (0, auth_context_1.createEnhancedAuthContext)(event.requestContext, userRepository);
        (0, lambda_utils_1.logStructured)('INFO', 'Authentication context created', {
            requestId,
            userId: authContext.userId,
            isAuthenticated: authContext.isAuthenticated,
            isSiteAdmin: authContext.isSiteAdmin,
        });
        // Check authorization - requires manage_all_clubs capability
        await (0, authorization_1.requireCapability)(authorization_1.SystemCapability.MANAGE_ALL_CLUBS)(authContext);
        (0, lambda_utils_1.logStructured)('INFO', 'Authorization successful', {
            requestId,
            userId: authContext.userId,
            capability: authorization_1.SystemCapability.MANAGE_ALL_CLUBS,
        });
        // Create club
        const club = await clubService.createClub(createInput);
        (0, lambda_utils_1.logStructured)('INFO', 'Club created successfully', {
            requestId,
            userId: authContext.userId,
            clubId: club.id,
            clubName: club.name,
        });
        // Format response with 201 status
        const response = {
            success: true,
            data: club,
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
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing create club request', {
            requestId,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLWNsdWIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcmVhdGUtY2x1Yi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUdILG9FQUE4RTtBQUM5RSxxRUFBNkc7QUFDN0cscUVBQW1FO0FBRW5FLHlHQUFvRztBQUNwRyx5RkFBb0Y7QUFDcEYseURBQXFEO0FBQ3JELGlFQUt1QztBQUV2Qyx3QkFBd0I7QUFDeEIsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFXLENBQUM7QUFFM0MsdUNBQXVDO0FBQ3ZDLE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RCxNQUFNLFdBQVcsR0FBRyxJQUFJLDBCQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFcEQ7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQTJCO0lBQ3ZELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO0lBRWpELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsZ0NBQWdDLEVBQUU7UUFDdEQsU0FBUztRQUNULFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtRQUM1QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7S0FDakIsQ0FBQyxDQUFDO0lBRUgsSUFBSTtRQUNGLHFCQUFxQjtRQUNyQixNQUFNLFdBQVcsR0FBRyxJQUFBLDRCQUFhLEVBQWtCLEtBQUssQ0FBQyxDQUFDO1FBRTFELHlDQUF5QztRQUN6QyxNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsd0NBQXlCLEVBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUUxRixJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLGdDQUFnQyxFQUFFO1lBQ3RELFNBQVM7WUFDVCxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07WUFDMUIsZUFBZSxFQUFFLFdBQVcsQ0FBQyxlQUFlO1lBQzVDLFdBQVcsRUFBRSxXQUFXLENBQUMsV0FBVztTQUNyQyxDQUFDLENBQUM7UUFFSCw2REFBNkQ7UUFDN0QsTUFBTSxJQUFBLGlDQUFpQixFQUFDLGdDQUFnQixDQUFDLGdCQUFnQixDQUFDLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFeEUsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSwwQkFBMEIsRUFBRTtZQUNoRCxTQUFTO1lBQ1QsTUFBTSxFQUFFLFdBQVcsQ0FBQyxNQUFNO1lBQzFCLFVBQVUsRUFBRSxnQ0FBZ0IsQ0FBQyxnQkFBZ0I7U0FDOUMsQ0FBQyxDQUFDO1FBRUgsY0FBYztRQUNkLE1BQU0sSUFBSSxHQUFHLE1BQU0sV0FBVyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUV2RCxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLDJCQUEyQixFQUFFO1lBQ2pELFNBQVM7WUFDVCxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07WUFDMUIsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFO1lBQ2YsUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJO1NBQ3BCLENBQUMsQ0FBQztRQUVILGtDQUFrQztRQUNsQyxNQUFNLFFBQVEsR0FBRztZQUNmLE9BQU8sRUFBRSxJQUFJO1lBQ2IsSUFBSSxFQUFFLElBQUk7WUFDVixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDcEMsQ0FBQztRQUVGLE9BQU87WUFDTCxVQUFVLEVBQUUsR0FBRztZQUNmLE9BQU8sRUFBRTtnQkFDUCxjQUFjLEVBQUUsa0JBQWtCO2dCQUNsQyw2QkFBNkIsRUFBRSxHQUFHO2FBQ25DO1lBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDO1NBQy9CLENBQUM7S0FDSDtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsSUFBQSw0QkFBYSxFQUFDLE9BQU8sRUFBRSxzQ0FBc0MsRUFBRTtZQUM3RCxTQUFTO1lBQ1QsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsMERBQTBEO1FBQzFELElBQUksSUFBQSxvQ0FBb0IsRUFBQyxLQUFLLENBQUMsRUFBRTtZQUMvQixPQUFPO2dCQUNMLFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtnQkFDNUIsT0FBTyxFQUFFO29CQUNQLGNBQWMsRUFBRSxrQkFBa0I7b0JBQ2xDLDZCQUE2QixFQUFFLEdBQUc7aUJBQ25DO2dCQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUEsZ0RBQWdDLEVBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2FBQ3pFLENBQUM7U0FDSDtRQUVELE9BQU8sSUFBQSxnQ0FBaUIsRUFBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDNUM7QUFDSCxDQUFDO0FBN0VELDBCQTZFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ3JlYXRlIENsdWIgSGFuZGxlciAtIFBoYXNlIDIuMVxuICogXG4gKiBMYW1iZGEgaGFuZGxlciBmb3IgUE9TVCAvY2x1YnMgZW5kcG9pbnQuXG4gKiBBZG1pbiBlbmRwb2ludCBmb3IgY3JlYXRpbmcgbmV3IGNsdWJzIChTaXRlQWRtaW4gb25seSkuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDIuMSBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0yLjEuY2x1Yi1zZXJ2aWNlLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBjcmVhdGVTdWNjZXNzUmVzcG9uc2UsIGhhbmRsZUxhbWJkYUVycm9yLCBsb2dTdHJ1Y3R1cmVkIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBwYXJzZUpzb25Cb2R5IH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBDcmVhdGVDbHViSW5wdXQgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdHlwZXMvY2x1Yic7XG5pbXBvcnQgeyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vdXNlci1wcm9maWxlL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLXVzZXItcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBEeW5hbW9EQkNsdWJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItY2x1Yi1yZXBvc2l0b3J5JztcbmltcG9ydCB7IENsdWJTZXJ2aWNlIH0gZnJvbSAnLi4vZG9tYWluL2NsdWItc2VydmljZSc7XG5pbXBvcnQgeyBcbiAgU3lzdGVtQ2FwYWJpbGl0eSwgXG4gIHJlcXVpcmVDYXBhYmlsaXR5LFxuICBjcmVhdGVBdXRob3JpemF0aW9uRXJyb3JSZXNwb25zZSxcbiAgaXNBdXRob3JpemF0aW9uRXJyb3IgXG59IGZyb20gJy4uLy4uLy4uL3NoYXJlZC9hdXRob3JpemF0aW9uJztcblxuLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXG5jb25zdCBUQUJMRV9OQU1FID0gcHJvY2Vzcy5lbnYuVEFCTEVfTkFNRSE7XG5cbi8vIEluaXRpYWxpemUgcmVwb3NpdG9yaWVzIGFuZCBzZXJ2aWNlc1xuY29uc3QgdXNlclJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJVc2VyUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IGNsdWJSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkoVEFCTEVfTkFNRSk7XG5jb25zdCBjbHViU2VydmljZSA9IG5ldyBDbHViU2VydmljZShjbHViUmVwb3NpdG9yeSk7XG5cbi8qKlxuICogTGFtYmRhIGhhbmRsZXIgZm9yIFBPU1QgL2NsdWJzXG4gKiBcbiAqIEBwYXJhbSBldmVudCAtIEFQSSBHYXRld2F5IHByb3h5IGV2ZW50XG4gKiBAcmV0dXJucyBBUEkgR2F0ZXdheSBwcm94eSByZXN1bHRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+IHtcbiAgY29uc3QgcmVxdWVzdElkID0gZXZlbnQucmVxdWVzdENvbnRleHQucmVxdWVzdElkO1xuICBcbiAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdQcm9jZXNzaW5nIGNyZWF0ZSBjbHViIHJlcXVlc3QnLCB7XG4gICAgcmVxdWVzdElkLFxuICAgIGh0dHBNZXRob2Q6IGV2ZW50Lmh0dHBNZXRob2QsXG4gICAgcGF0aDogZXZlbnQucGF0aCxcbiAgfSk7XG4gIFxuICB0cnkge1xuICAgIC8vIFBhcnNlIHJlcXVlc3QgYm9keVxuICAgIGNvbnN0IGNyZWF0ZUlucHV0ID0gcGFyc2VKc29uQm9keTxDcmVhdGVDbHViSW5wdXQ+KGV2ZW50KTtcblxuICAgIC8vIENyZWF0ZSBlbmhhbmNlZCBhdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gICAgY29uc3QgYXV0aENvbnRleHQgPSBhd2FpdCBjcmVhdGVFbmhhbmNlZEF1dGhDb250ZXh0KGV2ZW50LnJlcXVlc3RDb250ZXh0LCB1c2VyUmVwb3NpdG9yeSk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0F1dGhlbnRpY2F0aW9uIGNvbnRleHQgY3JlYXRlZCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgaXNBdXRoZW50aWNhdGVkOiBhdXRoQ29udGV4dC5pc0F1dGhlbnRpY2F0ZWQsXG4gICAgICBpc1NpdGVBZG1pbjogYXV0aENvbnRleHQuaXNTaXRlQWRtaW4sXG4gICAgfSk7XG5cbiAgICAvLyBDaGVjayBhdXRob3JpemF0aW9uIC0gcmVxdWlyZXMgbWFuYWdlX2FsbF9jbHVicyBjYXBhYmlsaXR5XG4gICAgYXdhaXQgcmVxdWlyZUNhcGFiaWxpdHkoU3lzdGVtQ2FwYWJpbGl0eS5NQU5BR0VfQUxMX0NMVUJTKShhdXRoQ29udGV4dCk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0F1dGhvcml6YXRpb24gc3VjY2Vzc2Z1bCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgY2FwYWJpbGl0eTogU3lzdGVtQ2FwYWJpbGl0eS5NQU5BR0VfQUxMX0NMVUJTLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGNsdWJcbiAgICBjb25zdCBjbHViID0gYXdhaXQgY2x1YlNlcnZpY2UuY3JlYXRlQ2x1YihjcmVhdGVJbnB1dCk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0NsdWIgY3JlYXRlZCBzdWNjZXNzZnVsbHknLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGNsdWJJZDogY2x1Yi5pZCxcbiAgICAgIGNsdWJOYW1lOiBjbHViLm5hbWUsXG4gICAgfSk7XG5cbiAgICAvLyBGb3JtYXQgcmVzcG9uc2Ugd2l0aCAyMDEgc3RhdHVzXG4gICAgY29uc3QgcmVzcG9uc2UgPSB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YTogY2x1YixcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3RhdHVzQ29kZTogMjAxLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKSxcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ1N0cnVjdHVyZWQoJ0VSUk9SJywgJ0Vycm9yIHByb2Nlc3NpbmcgY3JlYXRlIGNsdWIgcmVxdWVzdCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICB9KTtcblxuICAgIC8vIEhhbmRsZSBhdXRob3JpemF0aW9uIGVycm9ycyB3aXRoIHByb3BlciByZXNwb25zZSBmb3JtYXRcbiAgICBpZiAoaXNBdXRob3JpemF0aW9uRXJyb3IoZXJyb3IpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdGF0dXNDb2RlOiBlcnJvci5zdGF0dXNDb2RlLFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICAgICB9LFxuICAgICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShjcmVhdGVBdXRob3JpemF0aW9uRXJyb3JSZXNwb25zZShlcnJvciwgcmVxdWVzdElkKSksXG4gICAgICB9O1xuICAgIH1cblxuICAgIHJldHVybiBoYW5kbGVMYW1iZGFFcnJvcihlcnJvciwgcmVxdWVzdElkKTtcbiAgfVxufSJdfQ==