"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const dynamodb_ride_repository_1 = require("../../infrastructure/dynamodb-ride-repository");
const dynamodb_membership_helper_1 = require("../../infrastructure/dynamodb-membership-helper");
const ride_service_1 = require("../../domain/ride/ride-service");
const ride_authorization_1 = require("../../domain/authorization/ride-authorization");
const ride_authorization_2 = require("../../../../shared/types/ride-authorization");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME;
const rideRepository = new dynamodb_ride_repository_1.DynamoDBRideRepository(dynamoClient, tableName);
const membershipHelper = new dynamodb_membership_helper_1.MembershipHelper(dynamoClient, tableName);
const rideService = new ride_service_1.RideService(rideRepository);
const handler = async (event) => {
    try {
        // Get auth context
        const authContext = await (0, auth_context_1.getAuthContext)(event);
        const clubId = event.pathParameters?.clubId;
        if (!clubId) {
            return (0, lambda_utils_1.createResponse)(400, { error: 'Club ID is required' });
        }
        // Populate club memberships for authorization
        const memberships = await membershipHelper.getUserMemberships(authContext.userId);
        authContext.clubMemberships = memberships;
        // Check basic authorization - club membership required
        await ride_authorization_1.RideAuthorizationService.requireRideCapability(ride_authorization_2.RideCapability.VIEW_CLUB_RIDES, authContext, clubId);
        // Parse query parameters
        const queryParams = event.queryStringParameters || {};
        const query = {
            limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
            cursor: queryParams.cursor,
            status: queryParams.status,
            rideType: queryParams.rideType,
            difficulty: queryParams.difficulty,
            startDate: queryParams.startDate,
            endDate: queryParams.endDate,
            includeDrafts: queryParams.includeDrafts === 'true'
        };
        // Validate limit
        if (query.limit && (query.limit < 1 || query.limit > 100)) {
            return (0, lambda_utils_1.createResponse)(400, { error: 'Limit must be between 1 and 100' });
        }
        // Check if user can view draft rides
        const canViewDrafts = ride_authorization_1.RideAuthorizationService.getUserRideCapabilities(authContext, clubId)
            .includes(ride_authorization_2.RideCapability.VIEW_DRAFT_RIDES);
        if (query.includeDrafts && !canViewDrafts) {
            return (0, lambda_utils_1.createResponse)(403, {
                error: 'Insufficient privileges to view draft rides'
            });
        }
        // Get rides
        const result = await rideService.listClubRides(clubId, query);
        // Filter rides based on visibility rules
        const visibleRides = result.rides.filter(ride => {
            const rideData = ride.toJSON();
            return ride_authorization_1.RideAuthorizationService.canViewRide(authContext, clubId, rideData.status, rideData.scope, rideData.createdBy, rideData.isPublic);
        });
        // Transform response
        const responseData = visibleRides.map(ride => {
            const rideData = ride.toJSON();
            return {
                rideId: rideData.rideId,
                clubId: clubId,
                title: rideData.title,
                rideType: rideData.rideType,
                difficulty: rideData.difficulty,
                status: rideData.status,
                scope: rideData.scope,
                audience: rideData.audience,
                startDateTime: rideData.startDateTime,
                estimatedDuration: rideData.estimatedDuration,
                maxParticipants: rideData.maxParticipants,
                currentParticipants: rideData.currentParticipants,
                meetingPoint: {
                    name: rideData.meetingPoint.name,
                    address: rideData.meetingPoint.address
                },
                route: rideData.route ? {
                    name: rideData.route.name,
                    type: rideData.route.type,
                    distance: rideData.route.distance,
                    difficulty: rideData.route.difficulty
                } : undefined,
                createdBy: rideData.createdBy,
                createdByName: 'Unknown',
                publishedBy: rideData.publishedBy,
                publishedAt: rideData.publishedAt
            };
        });
        return (0, lambda_utils_1.createResponse)(200, {
            success: true,
            data: responseData,
            pagination: {
                limit: query.limit,
                nextCursor: result.nextCursor
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('List rides error:', error);
        if (error.statusCode) {
            return (0, lambda_utils_1.createResponse)(error.statusCode, {
                error: error.message,
                errorType: error.errorType
            });
        }
        return (0, lambda_utils_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1yaWRlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxpc3QtcmlkZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsOERBQTBEO0FBQzFELHdFQUF1RTtBQUN2RSx1RUFBc0U7QUFDdEUsNEZBQXVGO0FBQ3ZGLGdHQUFtRjtBQUNuRixpRUFBNkQ7QUFDN0Qsc0ZBQXlGO0FBQ3pGLG9GQUE2RTtBQUc3RSxNQUFNLFlBQVksR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDNUMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBb0IsQ0FBQztBQUNuRCxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUMzRSxNQUFNLGdCQUFnQixHQUFHLElBQUksNkNBQWdCLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3ZFLE1BQU0sV0FBVyxHQUFHLElBQUksMEJBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUU3QyxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBMkIsRUFBa0MsRUFBRTtJQUMzRixJQUFJO1FBQ0YsbUJBQW1CO1FBQ25CLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBRTVDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO1NBQzlEO1FBRUQsOENBQThDO1FBQzlDLE1BQU0sV0FBVyxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQ2xGLFdBQVcsQ0FBQyxlQUFlLEdBQUcsV0FBVyxDQUFD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QVUsRUFBRTtnQkFDdEMsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO2dCQUNwQixTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7YUFDM0IsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDO0tBQ2hFO0FBQ0gsQ0FBQyxDQUFDO0FBeEhXLFFBQUEsT0FBTyxXQXdIbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XG5pbXBvcnQgeyBjcmVhdGVSZXNwb25zZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9sYW1iZGEtdXRpbHMnO1xuaW1wb3J0IHsgZ2V0QXV0aENvbnRleHQgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvYXV0aC9hdXRoLWNvbnRleHQnO1xuaW1wb3J0IHsgRHluYW1vREJSaWRlUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLXJpZGUtcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBNZW1iZXJzaGlwSGVscGVyIH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItbWVtYmVyc2hpcC1oZWxwZXInO1xuaW1wb3J0IHsgUmlkZVNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vcmlkZS9yaWRlLXNlcnZpY2UnO1xuaW1wb3J0IHsgUmlkZUF1dGhvcml6YXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2F1dGhvcml6YXRpb24vcmlkZS1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IFJpZGVDYXBhYmlsaXR5IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL3JpZGUtYXV0aG9yaXphdGlvbic7XG5pbXBvcnQgeyBMaXN0UmlkZXNRdWVyeSwgUmlkZVN0YXR1cyB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9yaWRlJztcblxuY29uc3QgZHluYW1vQ2xpZW50ID0gbmV3IER5bmFtb0RCQ2xpZW50KHt9KTtcbmNvbnN0IHRhYmxlTmFtZSA9IHByb2Nlc3MuZW52LkRZTkFNT0RCX1RBQkxFX05BTUUhO1xuY29uc3QgcmlkZVJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJSaWRlUmVwb3NpdG9yeShkeW5hbW9DbGllbnQsIHRhYmxlTmFtZSk7XG5jb25zdCBtZW1iZXJzaGlwSGVscGVyID0gbmV3IE1lbWJlcnNoaXBIZWxwZXIoZHluYW1vQ2xpZW50LCB0YWJsZU5hbWUpO1xuY29uc3QgcmlkZVNlcnZpY2UgPSBuZXcgUmlkZVNlcnZpY2UocmlkZVJlcG9zaXRvcnkpO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICB0cnkge1xuICAgIC8vIEdldCBhdXRoIGNvbnRleHRcbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IGF3YWl0IGdldEF1dGhDb250ZXh0KGV2ZW50KTtcbiAgICBjb25zdCBjbHViSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8uY2x1YklkO1xuICAgIFxuICAgIGlmICghY2x1YklkKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNDAwLCB7IGVycm9yOiAnQ2x1YiBJRCBpcyByZXF1aXJlZCcgfSk7XG4gICAgfVxuXG4gICAgLy8gUG9wdWxhdGUgY2x1YiBtZW1iZXJzaGlwcyBmb3IgYXV0aG9yaXphdGlvblxuICAgIGNvbnN0IG1lbWJlcnNoaXBzID0gYXdhaXQgbWVtYmVyc2hpcEhlbHBlci5nZXRVc2VyTWVtYmVyc2hpcHMoYXV0aENvbnRleHQudXNlcklkKTtcbiAgICBhdXRoQ29udGV4dC5jbHViTWVtYmVyc2hpcHMgPSBtZW1iZXJzaGlwcztcblxuICAgIC8vIENoZWNrIGJhc2ljIGF1dGhvcml6YXRpb24gLSBjbHViIG1lbWJlcnNoaXAgcmVxdWlyZWRcbiAgICBhd2FpdCBSaWRlQXV0aG9yaXphdGlvblNlcnZpY2UucmVxdWlyZVJpZGVDYXBhYmlsaXR5KFxuICAgICAgUmlkZUNhcGFiaWxpdHkuVklFV19DTFVCX1JJREVTLFxuICAgICAgYXV0aENvbnRleHQsXG4gICAgICBjbHViSWRcbiAgICApO1xuXG4gICAgLy8gUGFyc2UgcXVlcnkgcGFyYW1ldGVyc1xuICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZXZlbnQucXVlcnlTdHJpbmdQYXJhbWV0ZXJzIHx8IHt9O1xuICAgIGNvbnN0IHF1ZXJ5OiBMaXN0UmlkZXNRdWVyeSA9IHtcbiAgICAgIGxpbWl0OiBxdWVyeVBhcmFtcy5saW1pdCA/IHBhcnNlSW50KHF1ZXJ5UGFyYW1zLmxpbWl0KSA6IDIwLFxuICAgICAgY3Vyc29yOiBxdWVyeVBhcmFtcy5jdXJzb3IsXG4gICAgICBzdGF0dXM6IHF1ZXJ5UGFyYW1zLnN0YXR1cyBhcyBSaWRlU3RhdHVzLFxuICAgICAgcmlkZVR5cGU6IHF1ZXJ5UGFyYW1zLnJpZGVUeXBlIGFzIGFueSxcbiAgICAgIGRpZmZpY3VsdHk6IHF1ZXJ5UGFyYW1zLmRpZmZpY3VsdHkgYXMgYW55LFxuICAgICAgc3RhcnREYXRlOiBxdWVyeVBhcmFtcy5zdGFydERhdGUsXG4gICAgICBlbmREYXRlOiBxdWVyeVBhcmFtcy5lbmREYXRlLFxuICAgICAgaW5jbHVkZURyYWZ0czogcXVlcnlQYXJhbXMuaW5jbHVkZURyYWZ0cyA9PT0gJ3RydWUnXG4gICAgfTtcblxuICAgIC8vIFZhbGlkYXRlIGxpbWl0XG4gICAgaWYgKHF1ZXJ5LmxpbWl0ICYmIChxdWVyeS5saW1pdCA8IDEgfHwgcXVlcnkubGltaXQgPiAxMDApKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNDAwLCB7IGVycm9yOiAnTGltaXQgbXVzdCBiZSBiZXR3ZWVuIDEgYW5kIDEwMCcgfSk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgdXNlciBjYW4gdmlldyBkcmFmdCByaWRlc1xuICAgIGNvbnN0IGNhblZpZXdEcmFmdHMgPSBSaWRlQXV0aG9yaXphdGlvblNlcnZpY2UuZ2V0VXNlclJpZGVDYXBhYmlsaXRpZXMoYXV0aENvbnRleHQsIGNsdWJJZClcbiAgICAgIC5pbmNsdWRlcyhSaWRlQ2FwYWJpbGl0eS5WSUVXX0RSQUZUX1JJREVTKTtcblxuICAgIGlmIChxdWVyeS5pbmNsdWRlRHJhZnRzICYmICFjYW5WaWV3RHJhZnRzKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNDAzLCB7IFxuICAgICAgICBlcnJvcjogJ0luc3VmZmljaWVudCBwcml2aWxlZ2VzIHRvIHZpZXcgZHJhZnQgcmlkZXMnIFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gR2V0IHJpZGVzXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmlkZVNlcnZpY2UubGlzdENsdWJSaWRlcyhjbHViSWQsIHF1ZXJ5KTtcblxuICAgIC8vIEZpbHRlciByaWRlcyBiYXNlZCBvbiB2aXNpYmlsaXR5IHJ1bGVzXG4gICAgY29uc3QgdmlzaWJsZVJpZGVzID0gcmVzdWx0LnJpZGVzLmZpbHRlcihyaWRlID0+IHtcbiAgICAgIGNvbnN0IHJpZGVEYXRhID0gcmlkZS50b0pTT04oKTtcbiAgICAgIHJldHVybiBSaWRlQXV0aG9yaXphdGlvblNlcnZpY2UuY2FuVmlld1JpZGUoXG4gICAgICAgIGF1dGhDb250ZXh0LFxuICAgICAgICBjbHViSWQsXG4gICAgICAgIHJpZGVEYXRhLnN0YXR1cyxcbiAgICAgICAgcmlkZURhdGEuc2NvcGUsXG4gICAgICAgIHJpZGVEYXRhLmNyZWF0ZWRCeSxcbiAgICAgICAgcmlkZURhdGEuaXNQdWJsaWNcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICAvLyBUcmFuc2Zvcm0gcmVzcG9uc2VcbiAgICBjb25zdCByZXNwb25zZURhdGEgPSB2aXNpYmxlUmlkZXMubWFwKHJpZGUgPT4ge1xuICAgICAgY29uc3QgcmlkZURhdGEgPSByaWRlLnRvSlNPTigpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcmlkZUlkOiByaWRlRGF0YS5yaWRlSWQsXG4gICAgICAgIGNsdWJJZDogY2x1YklkLCAvLyBJbmNsdWRlIGNsdWJJZCBmb3IgZnJvbnRlbmQgcm91dGluZ1xuICAgICAgICB0aXRsZTogcmlkZURhdGEudGl0bGUsXG4gICAgICAgIHJpZGVUeXBlOiByaWRlRGF0YS5yaWRlVHlwZSxcbiAgICAgICAgZGlmZmljdWx0eTogcmlkZURhdGEuZGlmZmljdWx0eSxcbiAgICAgICAgc3RhdHVzOiByaWRlRGF0YS5zdGF0dXMsXG4gICAgICAgIHNjb3BlOiByaWRlRGF0YS5zY29wZSxcbiAgICAgICAgYXVkaWVuY2U6IHJpZGVEYXRhLmF1ZGllbmNlLFxuICAgICAgICBzdGFydERhdGVUaW1lOiByaWRlRGF0YS5zdGFydERhdGVUaW1lLFxuICAgICAgICBlc3RpbWF0ZWREdXJhdGlvbjogcmlkZURhdGEuZXN0aW1hdGVkRHVyYXRpb24sXG4gICAgICAgIG1heFBhcnRpY2lwYW50czogcmlkZURhdGEubWF4UGFydGljaXBhbnRzLFxuICAgICAgICBjdXJyZW50UGFydGljaXBhbnRzOiByaWRlRGF0YS5jdXJyZW50UGFydGljaXBhbnRzLFxuICAgICAgICBtZWV0aW5nUG9pbnQ6IHtcbiAgICAgICAgICBuYW1lOiByaWRlRGF0YS5tZWV0aW5nUG9pbnQubmFtZSxcbiAgICAgICAgICBhZGRyZXNzOiByaWRlRGF0YS5tZWV0aW5nUG9pbnQuYWRkcmVzc1xuICAgICAgICB9LFxuICAgICAgICByb3V0ZTogcmlkZURhdGEucm91dGUgPyB7XG4gICAgICAgICAgbmFtZTogcmlkZURhdGEucm91dGUubmFtZSxcbiAgICAgICAgICB0eXBlOiByaWRlRGF0YS5yb3V0ZS50eXBlLFxuICAgICAgICAgIGRpc3RhbmNlOiByaWRlRGF0YS5yb3V0ZS5kaXN0YW5jZSxcbiAgICAgICAgICBkaWZmaWN1bHR5OiByaWRlRGF0YS5yb3V0ZS5kaWZmaWN1bHR5XG4gICAgICAgIH0gOiB1bmRlZmluZWQsXG4gICAgICAgIGNyZWF0ZWRCeTogcmlkZURhdGEuY3JlYXRlZEJ5LFxuICAgICAgICBjcmVhdGVkQnlOYW1lOiAnVW5rbm93bicsIC8vIFRPRE86IEVucmljaCB3aXRoIHVzZXIgbmFtZVxuICAgICAgICBwdWJsaXNoZWRCeTogcmlkZURhdGEucHVibGlzaGVkQnksXG4gICAgICAgIHB1Ymxpc2hlZEF0OiByaWRlRGF0YS5wdWJsaXNoZWRBdFxuICAgICAgfTtcbiAgICB9KTtcblxuICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSgyMDAsIHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiByZXNwb25zZURhdGEsXG4gICAgICBwYWdpbmF0aW9uOiB7XG4gICAgICAgIGxpbWl0OiBxdWVyeS5saW1pdCxcbiAgICAgICAgbmV4dEN1cnNvcjogcmVzdWx0Lm5leHRDdXJzb3JcbiAgICAgIH0sXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgIH0pO1xuXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICBjb25zb2xlLmVycm9yKCdMaXN0IHJpZGVzIGVycm9yOicsIGVycm9yKTtcbiAgICBcbiAgICBpZiAoZXJyb3Iuc3RhdHVzQ29kZSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKGVycm9yLnN0YXR1c0NvZGUsIHsgXG4gICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICBlcnJvclR5cGU6IGVycm9yLmVycm9yVHlwZSBcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNTAwLCB7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9KTtcbiAgfVxufTsiXX0=