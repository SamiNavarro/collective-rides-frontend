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
        const rideId = event.pathParameters?.rideId;
        if (!clubId || !rideId) {
            return (0, lambda_utils_1.createResponse)(400, { error: 'Club ID and Ride ID are required' });
        }
        // Populate club memberships for authorization
        const memberships = await membershipHelper.getUserMemberships(authContext.userId);
        authContext.clubMemberships = memberships;
        // Check authorization - only leadership can publish rides
        await ride_authorization_1.RideAuthorizationService.requireRideCapability(ride_authorization_2.RideCapability.PUBLISH_OFFICIAL_RIDES, authContext, clubId, rideId);
        // Parse request (optional body)
        const request = event.body ? (0, lambda_utils_1.parseJSON)(event.body) : {};
        // Publish ride
        const ride = await rideService.publishRide(rideId, authContext.userId, request);
        return (0, lambda_utils_1.createResponse)(200, {
            success: true,
            data: {
                rideId: ride.rideId,
                status: ride.status,
                audience: ride.audience,
                publishedBy: authContext.userId,
                publishedAt: ride.toJSON().publishedAt,
                publishMessage: request.publishMessage
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Publish ride error:', error);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGlzaC1yaWRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHVibGlzaC1yaWRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDhEQUEwRDtBQUMxRCx3RUFBa0Y7QUFDbEYsdUVBQXNFO0FBQ3RFLDRGQUF1RjtBQUN2RixnR0FBbUY7QUFDbkYsaUVBQTZEO0FBQzdELHNGQUF5RjtBQUN6RixvRkFBNkU7QUFHN0UsTUFBTSxZQUFZLEdBQUcsSUFBSSxnQ0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzVDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW9CLENBQUM7QUFDbkQsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDM0UsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLDZDQUFnQixDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN2RSxNQUFNLFdBQVcsR0FBRyxJQUFJLDBCQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFN0MsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQTJCLEVBQWtDLEVBQUU7SUFDM0YsSUFBSTtRQUNGLG1CQUFtQjtRQUNuQixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUM1QyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUU1QyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ3RCLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSxrQ0FBa0MsRUFBRSxDQUFDLENBQUM7U0FDM0U7UUFFRCw4Q0FBOEM7UUFDOUMsTUFBTSxXQUFXLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEYsV0FBVyxDQUFDLGVBQWUsR0FBRyxXQUFXLENBQUM7UUFFMUMsMERBQTBEO1FBQzFELE1BQU0sNkNBQXdCLENBQUMscUJBQXFCLENBQ2xELG1DQUFjLENBQUMsc0JBQXNCLEVBQ3JDLFdBQVcsRUFDWCxNQUFNLEVBQ04sTUFBTSxDQUNQLENBQUM7UUFFRixnQ0FBZ0M7UUFDaEMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBQSx3QkFBUyxFQUFxQixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUU1RSxlQUFlO1FBQ2YsTUFBTSxJQUFJLEdBQUcsTUFBTSxXQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRWhGLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRTtZQUN6QixPQUFPLEVBQUUsSUFBSTtZQUNiLElBQUksRUFBRTtnQkFDSixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07Z0JBQ25CLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtnQkFDbkIsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO2dCQUN2QixXQUFXLEVBQUUsV0FBVyxDQUFDLE1BQU07Z0JBQy9CLFdBQVcsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsV0FBVztnQkFDdEMsY0FBYyxFQUFFLE9BQU8sQ0FBQyxjQUFjO2FBQ3ZDO1lBQ0QsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3BDLENBQUMsQ0FBQztLQUVKO0lBQUMsT0FBTyxLQUFVLEVBQUU7UUFDbkIsT0FBTyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUU1QyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUU7WUFDcEIsT0FBTyxJQUFBLDZCQUFjLEVBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRTtnQkFDdEMsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO2dCQUNwQixTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7YUFDM0IsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDO0tBQ2hFO0FBQ0gsQ0FBQyxDQUFDO0FBdERXLFFBQUEsT0FBTyxXQXNEbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XG5pbXBvcnQgeyBjcmVhdGVSZXNwb25zZSwgcGFyc2VKU09OIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBnZXRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBEeW5hbW9EQlJpZGVSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItcmlkZS1yZXBvc2l0b3J5JztcbmltcG9ydCB7IE1lbWJlcnNoaXBIZWxwZXIgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1tZW1iZXJzaGlwLWhlbHBlcic7XG5pbXBvcnQgeyBSaWRlU2VydmljZSB9IGZyb20gJy4uLy4uL2RvbWFpbi9yaWRlL3JpZGUtc2VydmljZSc7XG5pbXBvcnQgeyBSaWRlQXV0aG9yaXphdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vYXV0aG9yaXphdGlvbi9yaWRlLWF1dGhvcml6YXRpb24nO1xuaW1wb3J0IHsgUmlkZUNhcGFiaWxpdHkgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvcmlkZS1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IFB1Ymxpc2hSaWRlUmVxdWVzdCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9yaWRlJztcblxuY29uc3QgZHluYW1vQ2xpZW50ID0gbmV3IER5bmFtb0RCQ2xpZW50KHt9KTtcbmNvbnN0IHRhYmxlTmFtZSA9IHByb2Nlc3MuZW52LkRZTkFNT0RCX1RBQkxFX05BTUUhO1xuY29uc3QgcmlkZVJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJSaWRlUmVwb3NpdG9yeShkeW5hbW9DbGllbnQsIHRhYmxlTmFtZSk7XG5jb25zdCBtZW1iZXJzaGlwSGVscGVyID0gbmV3IE1lbWJlcnNoaXBIZWxwZXIoZHluYW1vQ2xpZW50LCB0YWJsZU5hbWUpO1xuY29uc3QgcmlkZVNlcnZpY2UgPSBuZXcgUmlkZVNlcnZpY2UocmlkZVJlcG9zaXRvcnkpO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICB0cnkge1xuICAgIC8vIEdldCBhdXRoIGNvbnRleHRcbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IGF3YWl0IGdldEF1dGhDb250ZXh0KGV2ZW50KTtcbiAgICBjb25zdCBjbHViSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8uY2x1YklkO1xuICAgIGNvbnN0IHJpZGVJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5yaWRlSWQ7XG4gICAgXG4gICAgaWYgKCFjbHViSWQgfHwgIXJpZGVJZCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDQwMCwgeyBlcnJvcjogJ0NsdWIgSUQgYW5kIFJpZGUgSUQgYXJlIHJlcXVpcmVkJyB9KTtcbiAgICB9XG5cbiAgICAvLyBQb3B1bGF0ZSBjbHViIG1lbWJlcnNoaXBzIGZvciBhdXRob3JpemF0aW9uXG4gICAgY29uc3QgbWVtYmVyc2hpcHMgPSBhd2FpdCBtZW1iZXJzaGlwSGVscGVyLmdldFVzZXJNZW1iZXJzaGlwcyhhdXRoQ29udGV4dC51c2VySWQpO1xuICAgIGF1dGhDb250ZXh0LmNsdWJNZW1iZXJzaGlwcyA9IG1lbWJlcnNoaXBzO1xuXG4gICAgLy8gQ2hlY2sgYXV0aG9yaXphdGlvbiAtIG9ubHkgbGVhZGVyc2hpcCBjYW4gcHVibGlzaCByaWRlc1xuICAgIGF3YWl0IFJpZGVBdXRob3JpemF0aW9uU2VydmljZS5yZXF1aXJlUmlkZUNhcGFiaWxpdHkoXG4gICAgICBSaWRlQ2FwYWJpbGl0eS5QVUJMSVNIX09GRklDSUFMX1JJREVTLFxuICAgICAgYXV0aENvbnRleHQsXG4gICAgICBjbHViSWQsXG4gICAgICByaWRlSWRcbiAgICApO1xuXG4gICAgLy8gUGFyc2UgcmVxdWVzdCAob3B0aW9uYWwgYm9keSlcbiAgICBjb25zdCByZXF1ZXN0ID0gZXZlbnQuYm9keSA/IHBhcnNlSlNPTjxQdWJsaXNoUmlkZVJlcXVlc3Q+KGV2ZW50LmJvZHkpIDoge307XG5cbiAgICAvLyBQdWJsaXNoIHJpZGVcbiAgICBjb25zdCByaWRlID0gYXdhaXQgcmlkZVNlcnZpY2UucHVibGlzaFJpZGUocmlkZUlkLCBhdXRoQ29udGV4dC51c2VySWQsIHJlcXVlc3QpO1xuXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDIwMCwge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgcmlkZUlkOiByaWRlLnJpZGVJZCxcbiAgICAgICAgc3RhdHVzOiByaWRlLnN0YXR1cyxcbiAgICAgICAgYXVkaWVuY2U6IHJpZGUuYXVkaWVuY2UsXG4gICAgICAgIHB1Ymxpc2hlZEJ5OiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICAgIHB1Ymxpc2hlZEF0OiByaWRlLnRvSlNPTigpLnB1Ymxpc2hlZEF0LFxuICAgICAgICBwdWJsaXNoTWVzc2FnZTogcmVxdWVzdC5wdWJsaXNoTWVzc2FnZVxuICAgICAgfSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgfSk7XG5cbiAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1B1Ymxpc2ggcmlkZSBlcnJvcjonLCBlcnJvcik7XG4gICAgXG4gICAgaWYgKGVycm9yLnN0YXR1c0NvZGUpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZShlcnJvci5zdGF0dXNDb2RlLCB7IFxuICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgZXJyb3JUeXBlOiBlcnJvci5lcnJvclR5cGUgXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDUwMCwgeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSk7XG4gIH1cbn07Il19