"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lambda_utils_js_1 = require("../../../../shared/utils/lambda-utils.js");
const auth_context_js_1 = require("../../../../shared/auth/auth-context.js");
const dynamodb_ride_repository_js_1 = require("../../infrastructure/dynamodb-ride-repository.js");
const ride_service_js_1 = require("../../domain/ride/ride-service.js");
const ride_authorization_js_1 = require("../../domain/authorization/ride-authorization.js");
const ride_authorization_js_2 = require("../../../../shared/types/ride-authorization.js");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME;
const rideRepository = new dynamodb_ride_repository_js_1.DynamoDBRideRepository(dynamoClient, tableName);
const rideService = new ride_service_js_1.RideService(rideRepository);
const handler = async (event) => {
    try {
        // Get auth context
        const authContext = await (0, auth_context_js_1.getAuthContext)(event);
        const clubId = event.pathParameters?.clubId;
        if (!clubId) {
            return (0, lambda_utils_js_1.createResponse)(400, { error: 'Club ID is required' });
        }
        // Check basic authorization - club membership required
        await ride_authorization_js_1.RideAuthorizationService.requireRideCapability(ride_authorization_js_2.RideCapability.VIEW_CLUB_RIDES, authContext, clubId);
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
            return (0, lambda_utils_js_1.createResponse)(400, { error: 'Limit must be between 1 and 100' });
        }
        // Check if user can view draft rides
        const canViewDrafts = ride_authorization_js_1.RideAuthorizationService.getUserRideCapabilities(authContext, clubId)
            .includes(ride_authorization_js_2.RideCapability.VIEW_DRAFT_RIDES);
        if (query.includeDrafts && !canViewDrafts) {
            return (0, lambda_utils_js_1.createResponse)(403, {
                error: 'Insufficient privileges to view draft rides'
            });
        }
        // Get rides
        const result = await rideService.listClubRides(clubId, query);
        // Filter rides based on visibility rules
        const visibleRides = result.rides.filter(ride => {
            const rideData = ride.toJSON();
            return ride_authorization_js_1.RideAuthorizationService.canViewRide(authContext, clubId, rideData.status, rideData.scope, rideData.createdBy, rideData.isPublic);
        });
        // Transform response
        const responseData = visibleRides.map(ride => {
            const rideData = ride.toJSON();
            return {
                rideId: rideData.rideId,
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
        return (0, lambda_utils_js_1.createResponse)(200, {
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
            return (0, lambda_utils_js_1.createResponse)(error.statusCode, {
                error: error.message,
                errorType: error.errorType
            });
        }
        return (0, lambda_utils_js_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1yaWRlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxpc3QtcmlkZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsOERBQTBEO0FBQzFELDhFQUEwRTtBQUMxRSw2RUFBeUU7QUFDekUsa0dBQTBGO0FBQzFGLHVFQUFnRTtBQUNoRSw0RkFBNEY7QUFDNUYsMEZBQWdGO0FBR2hGLE1BQU0sWUFBWSxHQUFHLElBQUksZ0NBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM1QyxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFvQixDQUFDO0FBQ25ELE1BQU0sY0FBYyxHQUFHLElBQUksb0RBQXNCLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQzNFLE1BQU0sV0FBVyxHQUFHLElBQUksNkJBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUU3QyxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBMkIsRUFBa0MsRUFBRTtJQUMzRixJQUFJO1FBQ0YsbUJBQW1CO1FBQ25CLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSxnQ0FBYyxFQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBRTVDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxPQUFPLElBQUEsZ0NBQWMsRUFBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO1NBQzlEO1FBRUQsdURBQXVEO1FBQ3ZELE1BQU0sZ0RBQXdCLENBQUMscUJBQXFCLENBQ2xELHNDQUFjLENBQUMsZUFBZSxFQUM5QixXQUFXLEVBQ1gsTUFBTSxDQUNQLENBQUM7UUFFRix5QkFBeUI7UUFDekIsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixJQUFJLEVBQUUsQ0FBQztRQUN0RCxNQUFNLEtBQUssR0FBbUI7WUFDNUIsS0FBSyxFQUFFLFdB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ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcbmltcG9ydCB7IGNyZWF0ZVJlc3BvbnNlIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscy5qcyc7XG5pbXBvcnQgeyBnZXRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dC5qcyc7XG5pbXBvcnQgeyBEeW5hbW9EQlJpZGVSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItcmlkZS1yZXBvc2l0b3J5LmpzJztcbmltcG9ydCB7IFJpZGVTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL3JpZGUvcmlkZS1zZXJ2aWNlLmpzJztcbmltcG9ydCB7IFJpZGVBdXRob3JpemF0aW9uU2VydmljZSB9IGZyb20gJy4uLy4uL2RvbWFpbi9hdXRob3JpemF0aW9uL3JpZGUtYXV0aG9yaXphdGlvbi5qcyc7XG5pbXBvcnQgeyBSaWRlQ2FwYWJpbGl0eSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9yaWRlLWF1dGhvcml6YXRpb24uanMnO1xuaW1wb3J0IHsgTGlzdFJpZGVzUXVlcnksIFJpZGVTdGF0dXMgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvcmlkZS5qcyc7XG5cbmNvbnN0IGR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG5jb25zdCB0YWJsZU5hbWUgPSBwcm9jZXNzLmVudi5EWU5BTU9EQl9UQUJMRV9OQU1FITtcbmNvbnN0IHJpZGVSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCUmlkZVJlcG9zaXRvcnkoZHluYW1vQ2xpZW50LCB0YWJsZU5hbWUpO1xuY29uc3QgcmlkZVNlcnZpY2UgPSBuZXcgUmlkZVNlcnZpY2UocmlkZVJlcG9zaXRvcnkpO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICB0cnkge1xuICAgIC8vIEdldCBhdXRoIGNvbnRleHRcbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IGF3YWl0IGdldEF1dGhDb250ZXh0KGV2ZW50KTtcbiAgICBjb25zdCBjbHViSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8uY2x1YklkO1xuICAgIFxuICAgIGlmICghY2x1YklkKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNDAwLCB7IGVycm9yOiAnQ2x1YiBJRCBpcyByZXF1aXJlZCcgfSk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgYmFzaWMgYXV0aG9yaXphdGlvbiAtIGNsdWIgbWVtYmVyc2hpcCByZXF1aXJlZFxuICAgIGF3YWl0IFJpZGVBdXRob3JpemF0aW9uU2VydmljZS5yZXF1aXJlUmlkZUNhcGFiaWxpdHkoXG4gICAgICBSaWRlQ2FwYWJpbGl0eS5WSUVXX0NMVUJfUklERVMsXG4gICAgICBhdXRoQ29udGV4dCxcbiAgICAgIGNsdWJJZFxuICAgICk7XG5cbiAgICAvLyBQYXJzZSBxdWVyeSBwYXJhbWV0ZXJzXG4gICAgY29uc3QgcXVlcnlQYXJhbXMgPSBldmVudC5xdWVyeVN0cmluZ1BhcmFtZXRlcnMgfHwge307XG4gICAgY29uc3QgcXVlcnk6IExpc3RSaWRlc1F1ZXJ5ID0ge1xuICAgICAgbGltaXQ6IHF1ZXJ5UGFyYW1zLmxpbWl0ID8gcGFyc2VJbnQocXVlcnlQYXJhbXMubGltaXQpIDogMjAsXG4gICAgICBjdXJzb3I6IHF1ZXJ5UGFyYW1zLmN1cnNvcixcbiAgICAgIHN0YXR1czogcXVlcnlQYXJhbXMuc3RhdHVzIGFzIFJpZGVTdGF0dXMsXG4gICAgICByaWRlVHlwZTogcXVlcnlQYXJhbXMucmlkZVR5cGUgYXMgYW55LFxuICAgICAgZGlmZmljdWx0eTogcXVlcnlQYXJhbXMuZGlmZmljdWx0eSBhcyBhbnksXG4gICAgICBzdGFydERhdGU6IHF1ZXJ5UGFyYW1zLnN0YXJ0RGF0ZSxcbiAgICAgIGVuZERhdGU6IHF1ZXJ5UGFyYW1zLmVuZERhdGUsXG4gICAgICBpbmNsdWRlRHJhZnRzOiBxdWVyeVBhcmFtcy5pbmNsdWRlRHJhZnRzID09PSAndHJ1ZSdcbiAgICB9O1xuXG4gICAgLy8gVmFsaWRhdGUgbGltaXRcbiAgICBpZiAocXVlcnkubGltaXQgJiYgKHF1ZXJ5LmxpbWl0IDwgMSB8fCBxdWVyeS5saW1pdCA+IDEwMCkpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg0MDAsIHsgZXJyb3I6ICdMaW1pdCBtdXN0IGJlIGJldHdlZW4gMSBhbmQgMTAwJyB9KTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiB1c2VyIGNhbiB2aWV3IGRyYWZ0IHJpZGVzXG4gICAgY29uc3QgY2FuVmlld0RyYWZ0cyA9IFJpZGVBdXRob3JpemF0aW9uU2VydmljZS5nZXRVc2VyUmlkZUNhcGFiaWxpdGllcyhhdXRoQ29udGV4dCwgY2x1YklkKVxuICAgICAgLmluY2x1ZGVzKFJpZGVDYXBhYmlsaXR5LlZJRVdfRFJBRlRfUklERVMpO1xuXG4gICAgaWYgKHF1ZXJ5LmluY2x1ZGVEcmFmdHMgJiYgIWNhblZpZXdEcmFmdHMpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg0MDMsIHsgXG4gICAgICAgIGVycm9yOiAnSW5zdWZmaWNpZW50IHByaXZpbGVnZXMgdG8gdmlldyBkcmFmdCByaWRlcycgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBHZXQgcmlkZXNcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByaWRlU2VydmljZS5saXN0Q2x1YlJpZGVzKGNsdWJJZCwgcXVlcnkpO1xuXG4gICAgLy8gRmlsdGVyIHJpZGVzIGJhc2VkIG9uIHZpc2liaWxpdHkgcnVsZXNcbiAgICBjb25zdCB2aXNpYmxlUmlkZXMgPSByZXN1bHQucmlkZXMuZmlsdGVyKHJpZGUgPT4ge1xuICAgICAgY29uc3QgcmlkZURhdGEgPSByaWRlLnRvSlNPTigpO1xuICAgICAgcmV0dXJuIFJpZGVBdXRob3JpemF0aW9uU2VydmljZS5jYW5WaWV3UmlkZShcbiAgICAgICAgYXV0aENvbnRleHQsXG4gICAgICAgIGNsdWJJZCxcbiAgICAgICAgcmlkZURhdGEuc3RhdHVzLFxuICAgICAgICByaWRlRGF0YS5zY29wZSxcbiAgICAgICAgcmlkZURhdGEuY3JlYXRlZEJ5LFxuICAgICAgICByaWRlRGF0YS5pc1B1YmxpY1xuICAgICAgKTtcbiAgICB9KTtcblxuICAgIC8vIFRyYW5zZm9ybSByZXNwb25zZVxuICAgIGNvbnN0IHJlc3BvbnNlRGF0YSA9IHZpc2libGVSaWRlcy5tYXAocmlkZSA9PiB7XG4gICAgICBjb25zdCByaWRlRGF0YSA9IHJpZGUudG9KU09OKCk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICByaWRlSWQ6IHJpZGVEYXRhLnJpZGVJZCxcbiAgICAgICAgdGl0bGU6IHJpZGVEYXRhLnRpdGxlLFxuICAgICAgICByaWRlVHlwZTogcmlkZURhdGEucmlkZVR5cGUsXG4gICAgICAgIGRpZmZpY3VsdHk6IHJpZGVEYXRhLmRpZmZpY3VsdHksXG4gICAgICAgIHN0YXR1czogcmlkZURhdGEuc3RhdHVzLFxuICAgICAgICBzY29wZTogcmlkZURhdGEuc2NvcGUsXG4gICAgICAgIGF1ZGllbmNlOiByaWRlRGF0YS5hdWRpZW5jZSxcbiAgICAgICAgc3RhcnREYXRlVGltZTogcmlkZURhdGEuc3RhcnREYXRlVGltZSxcbiAgICAgICAgZXN0aW1hdGVkRHVyYXRpb246IHJpZGVEYXRhLmVzdGltYXRlZER1cmF0aW9uLFxuICAgICAgICBtYXhQYXJ0aWNpcGFudHM6IHJpZGVEYXRhLm1heFBhcnRpY2lwYW50cyxcbiAgICAgICAgY3VycmVudFBhcnRpY2lwYW50czogcmlkZURhdGEuY3VycmVudFBhcnRpY2lwYW50cyxcbiAgICAgICAgbWVldGluZ1BvaW50OiB7XG4gICAgICAgICAgbmFtZTogcmlkZURhdGEubWVldGluZ1BvaW50Lm5hbWUsXG4gICAgICAgICAgYWRkcmVzczogcmlkZURhdGEubWVldGluZ1BvaW50LmFkZHJlc3NcbiAgICAgICAgfSxcbiAgICAgICAgcm91dGU6IHJpZGVEYXRhLnJvdXRlID8ge1xuICAgICAgICAgIG5hbWU6IHJpZGVEYXRhLnJvdXRlLm5hbWUsXG4gICAgICAgICAgdHlwZTogcmlkZURhdGEucm91dGUudHlwZSxcbiAgICAgICAgICBkaXN0YW5jZTogcmlkZURhdGEucm91dGUuZGlzdGFuY2UsXG4gICAgICAgICAgZGlmZmljdWx0eTogcmlkZURhdGEucm91dGUuZGlmZmljdWx0eVxuICAgICAgICB9IDogdW5kZWZpbmVkLFxuICAgICAgICBjcmVhdGVkQnk6IHJpZGVEYXRhLmNyZWF0ZWRCeSxcbiAgICAgICAgY3JlYXRlZEJ5TmFtZTogJ1Vua25vd24nLCAvLyBUT0RPOiBFbnJpY2ggd2l0aCB1c2VyIG5hbWVcbiAgICAgICAgcHVibGlzaGVkQnk6IHJpZGVEYXRhLnB1Ymxpc2hlZEJ5LFxuICAgICAgICBwdWJsaXNoZWRBdDogcmlkZURhdGEucHVibGlzaGVkQXRcbiAgICAgIH07XG4gICAgfSk7XG5cbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoMjAwLCB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YTogcmVzcG9uc2VEYXRhLFxuICAgICAgcGFnaW5hdGlvbjoge1xuICAgICAgICBsaW1pdDogcXVlcnkubGltaXQsXG4gICAgICAgIG5leHRDdXJzb3I6IHJlc3VsdC5uZXh0Q3Vyc29yXG4gICAgICB9LFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICB9KTtcblxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgY29uc29sZS5lcnJvcignTGlzdCByaWRlcyBlcnJvcjonLCBlcnJvcik7XG4gICAgXG4gICAgaWYgKGVycm9yLnN0YXR1c0NvZGUpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZShlcnJvci5zdGF0dXNDb2RlLCB7IFxuICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgZXJyb3JUeXBlOiBlcnJvci5lcnJvclR5cGUgXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDUwMCwgeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSk7XG4gIH1cbn07Il19