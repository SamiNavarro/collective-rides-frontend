"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const dynamodb_ride_repository_1 = require("../../infrastructure/dynamodb-ride-repository");
const ride_service_1 = require("../../domain/ride/ride-service");
const ride_authorization_1 = require("../../domain/authorization/ride-authorization");
const ride_authorization_2 = require("../../../../shared/types/ride-authorization");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME;
const rideRepository = new dynamodb_ride_repository_1.DynamoDBRideRepository(dynamoClient, tableName);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVibGlzaC1yaWRlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHVibGlzaC1yaWRlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDhEQUEwRDtBQUMxRCx3RUFBa0Y7QUFDbEYsdUVBQXNFO0FBQ3RFLDRGQUF1RjtBQUN2RixpRUFBNkQ7QUFDN0Qsc0ZBQXlGO0FBQ3pGLG9GQUE2RTtBQUc3RSxNQUFNLFlBQVksR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDNUMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBb0IsQ0FBQztBQUNuRCxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUMzRSxNQUFNLFdBQVcsR0FBRyxJQUFJLDBCQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFN0MsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQTJCLEVBQWtDLEVBQUU7SUFDM0YsSUFBSTtRQUNGLG1CQUFtQjtRQUNuQixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUM1QyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUU1QyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ3RCLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSxrQ0FBa0MsRUFBRSxDQUFDLENBQUM7U0FDM0U7UUFFRCwwREFBMEQ7UUFDMUQsTUFBTSw2Q0FBd0IsQ0FBQyxxQkFBcUIsQ0FDbEQsbUNBQWMsQ0FBQyxzQkFBc0IsRUFDckMsV0FBVyxFQUNYLE1BQU0sRUFDTixNQUFNLENBQ1AsQ0FBQztRQUVGLGdDQUFnQztRQUNoQyxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFBLHdCQUFTLEVBQXFCLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBRTVFLGVBQWU7UUFDZixNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFaEYsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFO1lBQ3pCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsSUFBSSxFQUFFO2dCQUNKLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtnQkFDbkIsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO2dCQUNuQixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7Z0JBQ3ZCLFdBQVcsRUFBRSxXQUFXLENBQUMsTUFBTTtnQkFDL0IsV0FBVyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxXQUFXO2dCQUN0QyxjQUFjLEVBQUUsT0FBTyxDQUFDLGNBQWM7YUFDdkM7WUFDRCxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDcEMsQ0FBQyxDQUFDO0tBRUo7SUFBQyxPQUFPLEtBQVUsRUFBRTtRQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRTVDLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtZQUNwQixPQUFPLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsVUFBVSxFQUFFO2dCQUN0QyxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU87Z0JBQ3BCLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUzthQUMzQixDQUFDLENBQUM7U0FDSjtRQUVELE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSx1QkFBdUIsRUFBRSxDQUFDLENBQUM7S0FDaEU7QUFDSCxDQUFDLENBQUM7QUFsRFcsUUFBQSxPQUFPLFdBa0RsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcbmltcG9ydCB7IGNyZWF0ZVJlc3BvbnNlLCBwYXJzZUpTT04gfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IGdldEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGgvYXV0aC1jb250ZXh0JztcbmltcG9ydCB7IER5bmFtb0RCUmlkZVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1yaWRlLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgUmlkZVNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vcmlkZS9yaWRlLXNlcnZpY2UnO1xuaW1wb3J0IHsgUmlkZUF1dGhvcml6YXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2F1dGhvcml6YXRpb24vcmlkZS1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IFJpZGVDYXBhYmlsaXR5IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL3JpZGUtYXV0aG9yaXphdGlvbic7XG5pbXBvcnQgeyBQdWJsaXNoUmlkZVJlcXVlc3QgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvcmlkZSc7XG5cbmNvbnN0IGR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG5jb25zdCB0YWJsZU5hbWUgPSBwcm9jZXNzLmVudi5EWU5BTU9EQl9UQUJMRV9OQU1FITtcbmNvbnN0IHJpZGVSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCUmlkZVJlcG9zaXRvcnkoZHluYW1vQ2xpZW50LCB0YWJsZU5hbWUpO1xuY29uc3QgcmlkZVNlcnZpY2UgPSBuZXcgUmlkZVNlcnZpY2UocmlkZVJlcG9zaXRvcnkpO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICB0cnkge1xuICAgIC8vIEdldCBhdXRoIGNvbnRleHRcbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IGF3YWl0IGdldEF1dGhDb250ZXh0KGV2ZW50KTtcbiAgICBjb25zdCBjbHViSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8uY2x1YklkO1xuICAgIGNvbnN0IHJpZGVJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5yaWRlSWQ7XG4gICAgXG4gICAgaWYgKCFjbHViSWQgfHwgIXJpZGVJZCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDQwMCwgeyBlcnJvcjogJ0NsdWIgSUQgYW5kIFJpZGUgSUQgYXJlIHJlcXVpcmVkJyB9KTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBhdXRob3JpemF0aW9uIC0gb25seSBsZWFkZXJzaGlwIGNhbiBwdWJsaXNoIHJpZGVzXG4gICAgYXdhaXQgUmlkZUF1dGhvcml6YXRpb25TZXJ2aWNlLnJlcXVpcmVSaWRlQ2FwYWJpbGl0eShcbiAgICAgIFJpZGVDYXBhYmlsaXR5LlBVQkxJU0hfT0ZGSUNJQUxfUklERVMsXG4gICAgICBhdXRoQ29udGV4dCxcbiAgICAgIGNsdWJJZCxcbiAgICAgIHJpZGVJZFxuICAgICk7XG5cbiAgICAvLyBQYXJzZSByZXF1ZXN0IChvcHRpb25hbCBib2R5KVxuICAgIGNvbnN0IHJlcXVlc3QgPSBldmVudC5ib2R5ID8gcGFyc2VKU09OPFB1Ymxpc2hSaWRlUmVxdWVzdD4oZXZlbnQuYm9keSkgOiB7fTtcblxuICAgIC8vIFB1Ymxpc2ggcmlkZVxuICAgIGNvbnN0IHJpZGUgPSBhd2FpdCByaWRlU2VydmljZS5wdWJsaXNoUmlkZShyaWRlSWQsIGF1dGhDb250ZXh0LnVzZXJJZCwgcmVxdWVzdCk7XG5cbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoMjAwLCB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YToge1xuICAgICAgICByaWRlSWQ6IHJpZGUucmlkZUlkLFxuICAgICAgICBzdGF0dXM6IHJpZGUuc3RhdHVzLFxuICAgICAgICBhdWRpZW5jZTogcmlkZS5hdWRpZW5jZSxcbiAgICAgICAgcHVibGlzaGVkQnk6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgICAgcHVibGlzaGVkQXQ6IHJpZGUudG9KU09OKCkucHVibGlzaGVkQXQsXG4gICAgICAgIHB1Ymxpc2hNZXNzYWdlOiByZXF1ZXN0LnB1Ymxpc2hNZXNzYWdlXG4gICAgICB9LFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICB9KTtcblxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgY29uc29sZS5lcnJvcignUHVibGlzaCByaWRlIGVycm9yOicsIGVycm9yKTtcbiAgICBcbiAgICBpZiAoZXJyb3Iuc3RhdHVzQ29kZSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKGVycm9yLnN0YXR1c0NvZGUsIHsgXG4gICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICBlcnJvclR5cGU6IGVycm9yLmVycm9yVHlwZSBcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNTAwLCB7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9KTtcbiAgfVxufTsiXX0=