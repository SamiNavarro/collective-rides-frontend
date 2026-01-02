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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGVhdmUtcmlkZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxlYXZlLXJpZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsOERBQTBEO0FBQzFELHdFQUF1RTtBQUN2RSx1RUFBc0U7QUFDdEUsNEZBQXVGO0FBQ3ZGLDhHQUF5RztBQUN6Ryw0RkFBd0Y7QUFFeEYsTUFBTSxZQUFZLEdBQUcsSUFBSSxnQ0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzVDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW9CLENBQUM7QUFDbkQsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDM0UsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLG1FQUErQixDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUM3RixNQUFNLG9CQUFvQixHQUFHLElBQUksNENBQW9CLENBQUMsdUJBQXVCLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFFeEYsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQTJCLEVBQWtDLEVBQUU7SUFDM0YsSUFBSTtRQUNGLG1CQUFtQjtRQUNuQixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUM1QyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUU1QyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ3RCLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSxrQ0FBa0MsRUFBRSxDQUFDLENBQUM7U0FDM0U7UUFFRCw2REFBNkQ7UUFDN0QsTUFBTSxvQkFBb0IsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVqRSxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUU7WUFDekIsT0FBTyxFQUFFLElBQUk7WUFDYixPQUFPLEVBQUUsNEJBQTRCO1lBQ3JDLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUNwQyxDQUFDLENBQUM7S0FFSjtJQUFDLE9BQU8sS0FBVSxFQUFFO1FBQ25CLE9BQU8sQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFMUMsSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFO1lBQ3BCLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUU7Z0JBQ3RDLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTztnQkFDcEIsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO2FBQzNCLENBQUMsQ0FBQztTQUNKO1FBRUQsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixFQUFFLENBQUMsQ0FBQztLQUNoRTtBQUNILENBQUMsQ0FBQztBQWhDVyxRQUFBLE9BQU8sV0FnQ2xCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgRHluYW1vREJDbGllbnQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInO1xuaW1wb3J0IHsgY3JlYXRlUmVzcG9uc2UgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IGdldEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGgvYXV0aC1jb250ZXh0JztcbmltcG9ydCB7IER5bmFtb0RCUmlkZVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1yaWRlLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJQYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLXBhcnRpY2lwYXRpb24tcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBQYXJ0aWNpcGF0aW9uU2VydmljZSB9IGZyb20gJy4uLy4uL2RvbWFpbi9wYXJ0aWNpcGF0aW9uL3BhcnRpY2lwYXRpb24tc2VydmljZSc7XG5cbmNvbnN0IGR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG5jb25zdCB0YWJsZU5hbWUgPSBwcm9jZXNzLmVudi5EWU5BTU9EQl9UQUJMRV9OQU1FITtcbmNvbnN0IHJpZGVSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCUmlkZVJlcG9zaXRvcnkoZHluYW1vQ2xpZW50LCB0YWJsZU5hbWUpO1xuY29uc3QgcGFydGljaXBhdGlvblJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJQYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeShkeW5hbW9DbGllbnQsIHRhYmxlTmFtZSk7XG5jb25zdCBwYXJ0aWNpcGF0aW9uU2VydmljZSA9IG5ldyBQYXJ0aWNpcGF0aW9uU2VydmljZShwYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeSwgcmlkZVJlcG9zaXRvcnkpO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICB0cnkge1xuICAgIC8vIEdldCBhdXRoIGNvbnRleHRcbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IGF3YWl0IGdldEF1dGhDb250ZXh0KGV2ZW50KTtcbiAgICBjb25zdCBjbHViSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8uY2x1YklkO1xuICAgIGNvbnN0IHJpZGVJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5yaWRlSWQ7XG4gICAgXG4gICAgaWYgKCFjbHViSWQgfHwgIXJpZGVJZCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDQwMCwgeyBlcnJvcjogJ0NsdWIgSUQgYW5kIFJpZGUgSUQgYXJlIHJlcXVpcmVkJyB9KTtcbiAgICB9XG5cbiAgICAvLyBMZWF2ZSByaWRlICh1c2VyIGNhbiBhbHdheXMgbGVhdmUgdGhlaXIgb3duIHBhcnRpY2lwYXRpb24pXG4gICAgYXdhaXQgcGFydGljaXBhdGlvblNlcnZpY2UubGVhdmVSaWRlKHJpZGVJZCwgYXV0aENvbnRleHQudXNlcklkKTtcblxuICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSgyMDAsIHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBtZXNzYWdlOiAnU3VjY2Vzc2Z1bGx5IGxlZnQgdGhlIHJpZGUnLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICB9KTtcblxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgY29uc29sZS5lcnJvcignTGVhdmUgcmlkZSBlcnJvcjonLCBlcnJvcik7XG4gICAgXG4gICAgaWYgKGVycm9yLnN0YXR1c0NvZGUpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZShlcnJvci5zdGF0dXNDb2RlLCB7IFxuICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgZXJyb3JUeXBlOiBlcnJvci5lcnJvclR5cGUgXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDUwMCwgeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSk7XG4gIH1cbn07Il19