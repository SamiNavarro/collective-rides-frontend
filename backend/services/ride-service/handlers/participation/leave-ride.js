"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const dynamodb_ride_repository_1 = require("../../infrastructure/dynamodb-ride-repository");
const dynamodb_participation_repository_1 = require("../../infrastructure/dynamodb-participation-repository");
const participation_service_1 = require("../../domain/participation/participation-service");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME;
const rideRepository = new dynamodb_ride_repository_1.DynamoDBRideRepository(dynamoClient, tableName);
const participationRepository = new dynamodb_participation_repository_1.DynamoDBParticipationRepository(dynamoClient, tableName);
const participationService = new participation_service_1.ParticipationService(participationRepository, rideRepository);
const handler = async (event) => {
    try {
        // Get auth context
        const authContext = await (0, auth_context_1.getAuthContext)(event);
        const clubId = event.pathParameters?.clubId;
        const rideId = event.pathParameters?.rideId;
        if (!clubId || !rideId) {
            return (0, lambda_utils_1.createResponse)(400, { error: 'Club ID and Ride ID are required' });
        }
        // Leave ride (user can always leave their own participation)
        await participationService.leaveRide(rideId, authContext.userId);
        return (0, lambda_utils_1.createResponse)(200, {
            success: true,
            message: 'Successfully left the ride',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Leave ride error:', error);
        // Handle specific error cases
        if (error.errorType === 'PARTICIPATION_NOT_FOUND') {
            return (0, lambda_utils_1.createResponse)(404, {
                error: 'You are not participating in this ride',
                errorType: error.errorType
            });
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVhdmUtcmlkZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxlYXZlLXJpZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsOERBQTBEO0FBQzFELHdFQUF1RTtBQUN2RSx1RUFBc0U7QUFDdEUsNEZBQXVGO0FBQ3ZGLDhHQUF5RztBQUN6Ryw0RkFBd0Y7QUFFeEYsTUFBTSxZQUFZLEdBQUcsSUFBSSxnQ0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzVDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW9CLENBQUM7QUFDbkQsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDM0UsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLG1FQUErQixDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUM3RixNQUFNLG9CQUFvQixHQUFHLElBQUksNENBQW9CLENBQUMsdUJBQXVCLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFFeEYsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQTJCLEVBQWtDLEVBQUU7SUFDM0YsSUFBSTtRQUNGLG1CQUFtQjtRQUNuQixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUM1QyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUU1QyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ3RCLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSxrQ0FBa0MsRUFBRSxDQUFDLENBQUM7U0FDM0U7UUFFRCw2REFBNkQ7UUFDN0QsTUFBTSxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVqRSxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUU7WUFDekIsT0FBTyxFQUFFLElBQUk7WUFDYixPQUFPLEVBQUUsNEJBQTRCO1lBQ3JDLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUNwQyxDQUFDLENBQUM7S0FFSjtJQUFDLE9BQU8sS0FBVSxFQUFFO1FBQ25CLE9BQU8sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFMUMsOEJBQThCO1FBQzlCLElBQUksS0FBSyxDQUFDLFNBQVMsS0FBSyx5QkFBeUIsRUFBRTtZQUNqRCxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUU7Z0JBQ3pCLEtBQUssRUFBRSx3Q0FBd0M7Z0JBQy9DLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUzthQUMzQixDQUFDLENBQUM7U0FDSjtRQUVELElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtZQUNwQixPQUFPLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsVUFBVSxFQUFFO2dCQUN0QyxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU87Z0JBQ3BCLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUzthQUMzQixDQUFDLENBQUM7U0FDSjtRQUVELE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSx1QkFBdUIsRUFBRSxDQUFDLENBQUM7S0FDaEU7QUFDSCxDQUFDLENBQUM7QUF4Q1csUUFBQSxPQUFPLFdBd0NsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcbmltcG9ydCB7IGNyZWF0ZVJlc3BvbnNlIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBnZXRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBEeW5hbW9EQlJpZGVSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItcmlkZS1yZXBvc2l0b3J5JztcbmltcG9ydCB7IER5bmFtb0RCUGFydGljaXBhdGlvblJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1wYXJ0aWNpcGF0aW9uLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgUGFydGljaXBhdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vcGFydGljaXBhdGlvbi9wYXJ0aWNpcGF0aW9uLXNlcnZpY2UnO1xuXG5jb25zdCBkeW5hbW9DbGllbnQgPSBuZXcgRHluYW1vREJDbGllbnQoe30pO1xuY29uc3QgdGFibGVOYW1lID0gcHJvY2Vzcy5lbnYuRFlOQU1PREJfVEFCTEVfTkFNRSE7XG5jb25zdCByaWRlUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQlJpZGVSZXBvc2l0b3J5KGR5bmFtb0NsaWVudCwgdGFibGVOYW1lKTtcbmNvbnN0IHBhcnRpY2lwYXRpb25SZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCUGFydGljaXBhdGlvblJlcG9zaXRvcnkoZHluYW1vQ2xpZW50LCB0YWJsZU5hbWUpO1xuY29uc3QgcGFydGljaXBhdGlvblNlcnZpY2UgPSBuZXcgUGFydGljaXBhdGlvblNlcnZpY2UocGFydGljaXBhdGlvblJlcG9zaXRvcnksIHJpZGVSZXBvc2l0b3J5KTtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+ID0+IHtcbiAgdHJ5IHtcbiAgICAvLyBHZXQgYXV0aCBjb250ZXh0XG4gICAgY29uc3QgYXV0aENvbnRleHQgPSBhd2FpdCBnZXRBdXRoQ29udGV4dChldmVudCk7XG4gICAgY29uc3QgY2x1YklkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNsdWJJZDtcbiAgICBjb25zdCByaWRlSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8ucmlkZUlkO1xuICAgIFxuICAgIGlmICghY2x1YklkIHx8ICFyaWRlSWQpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg0MDAsIHsgZXJyb3I6ICdDbHViIElEIGFuZCBSaWRlIElEIGFyZSByZXF1aXJlZCcgfSk7XG4gICAgfVxuXG4gICAgLy8gTGVhdmUgcmlkZSAodXNlciBjYW4gYWx3YXlzIGxlYXZlIHRoZWlyIG93biBwYXJ0aWNpcGF0aW9uKVxuICAgIGF3YWl0IHBhcnRpY2lwYXRpb25TZXJ2aWNlLmxlYXZlUmlkZShyaWRlSWQsIGF1dGhDb250ZXh0LnVzZXJJZCk7XG5cbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoMjAwLCB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgbWVzc2FnZTogJ1N1Y2Nlc3NmdWxseSBsZWZ0IHRoZSByaWRlJyxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgfSk7XG5cbiAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0xlYXZlIHJpZGUgZXJyb3I6JywgZXJyb3IpO1xuICAgIFxuICAgIC8vIEhhbmRsZSBzcGVjaWZpYyBlcnJvciBjYXNlc1xuICAgIGlmIChlcnJvci5lcnJvclR5cGUgPT09ICdQQVJUSUNJUEFUSU9OX05PVF9GT1VORCcpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg0MDQsIHsgXG4gICAgICAgIGVycm9yOiAnWW91IGFyZSBub3QgcGFydGljaXBhdGluZyBpbiB0aGlzIHJpZGUnLFxuICAgICAgICBlcnJvclR5cGU6IGVycm9yLmVycm9yVHlwZSBcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBpZiAoZXJyb3Iuc3RhdHVzQ29kZSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKGVycm9yLnN0YXR1c0NvZGUsIHsgXG4gICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICBlcnJvclR5cGU6IGVycm9yLmVycm9yVHlwZSBcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNTAwLCB7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9KTtcbiAgfVxufTsiXX0=