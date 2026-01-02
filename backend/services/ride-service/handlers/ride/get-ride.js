"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const dynamodb_ride_repository_1 = require("../../infrastructure/dynamodb-ride-repository");
const dynamodb_participation_repository_1 = require("../../infrastructure/dynamodb-participation-repository");
const ride_service_1 = require("../../domain/ride/ride-service");
const participation_service_1 = require("../../domain/participation/participation-service");
const ride_authorization_1 = require("../../domain/authorization/ride-authorization");
const participation_1 = require("../../../../shared/types/participation");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME;
const rideRepository = new dynamodb_ride_repository_1.DynamoDBRideRepository(dynamoClient, tableName);
const participationRepository = new dynamodb_participation_repository_1.DynamoDBParticipationRepository(dynamoClient, tableName);
const rideService = new ride_service_1.RideService(rideRepository);
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
        // Get ride
        const ride = await rideService.getRide(rideId);
        const rideData = ride.toJSON();
        // Check if user can view this ride
        const canView = ride_authorization_1.RideAuthorizationService.canViewRide(authContext, clubId, rideData.status, rideData.scope, rideData.createdBy, rideData.isPublic);
        if (!canView) {
            return (0, lambda_utils_1.createResponse)(403, { error: 'Insufficient privileges to view this ride' });
        }
        // Get participants
        const participants = await participationService.getRideParticipants(rideId);
        // Transform participants data
        const participantsData = participants
            .filter(p => p.status === participation_1.ParticipationStatus.CONFIRMED)
            .map(p => {
            const pData = p.toJSON();
            return {
                userId: pData.userId,
                displayName: 'Unknown',
                role: pData.role,
                status: pData.status,
                joinedAt: pData.joinedAt
            };
        });
        // Get waitlist
        const waitlistData = participants
            .filter(p => p.status === participation_1.ParticipationStatus.WAITLISTED)
            .sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0))
            .map(p => {
            const pData = p.toJSON();
            return {
                userId: pData.userId,
                displayName: 'Unknown',
                joinedWaitlistAt: pData.joinedAt,
                position: pData.waitlistPosition
            };
        });
        return (0, lambda_utils_1.createResponse)(200, {
            success: true,
            data: {
                ...rideData,
                participants: participantsData,
                waitlist: waitlistData
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Get ride error:', error);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LXJpZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnZXQtcmlkZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw4REFBMEQ7QUFDMUQsd0VBQXVFO0FBQ3ZFLHVFQUFzRTtBQUN0RSw0RkFBdUY7QUFDdkYsOEdBQXlHO0FBQ3pHLGlFQUE2RDtBQUM3RCw0RkFBd0Y7QUFDeEYsc0ZBQXlGO0FBQ3pGLDBFQUE2RTtBQUU3RSxNQUFNLFlBQVksR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDNUMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBb0IsQ0FBQztBQUNuRCxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUMzRSxNQUFNLHVCQUF1QixHQUFHLElBQUksbUVBQStCLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQzdGLE1BQU0sV0FBVyxHQUFHLElBQUksMEJBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNwRCxNQUFNLG9CQUFvQixHQUFHLElBQUksNENBQW9CLENBQUMsdUJBQXVCLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFFeEYsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQTJCLEVBQWtDLEVBQUU7SUFDM0YsSUFBSTtRQUNGLG1CQUFtQjtRQUNuQixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUM1QyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUU1QyxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ3RCLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSxrQ0FBa0Ms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LE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSx1QkFBdUIsRUFBRSxDQUFDLENBQUM7S0FDaEU7QUFDSCxDQUFDLENBQUM7QUFsRlcsUUFBQSxPQUFPLFdBa0ZsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcbmltcG9ydCB7IGNyZWF0ZVJlc3BvbnNlIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBnZXRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBEeW5hbW9EQlJpZGVSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItcmlkZS1yZXBvc2l0b3J5JztcbmltcG9ydCB7IER5bmFtb0RCUGFydGljaXBhdGlvblJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1wYXJ0aWNpcGF0aW9uLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgUmlkZVNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vcmlkZS9yaWRlLXNlcnZpY2UnO1xuaW1wb3J0IHsgUGFydGljaXBhdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vcGFydGljaXBhdGlvbi9wYXJ0aWNpcGF0aW9uLXNlcnZpY2UnO1xuaW1wb3J0IHsgUmlkZUF1dGhvcml6YXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2F1dGhvcml6YXRpb24vcmlkZS1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IFBhcnRpY2lwYXRpb25TdGF0dXMgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvcGFydGljaXBhdGlvbic7XG5cbmNvbnN0IGR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG5jb25zdCB0YWJsZU5hbWUgPSBwcm9jZXNzLmVudi5EWU5BTU9EQl9UQUJMRV9OQU1FITtcbmNvbnN0IHJpZGVSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCUmlkZVJlcG9zaXRvcnkoZHluYW1vQ2xpZW50LCB0YWJsZU5hbWUpO1xuY29uc3QgcGFydGljaXBhdGlvblJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJQYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeShkeW5hbW9DbGllbnQsIHRhYmxlTmFtZSk7XG5jb25zdCByaWRlU2VydmljZSA9IG5ldyBSaWRlU2VydmljZShyaWRlUmVwb3NpdG9yeSk7XG5jb25zdCBwYXJ0aWNpcGF0aW9uU2VydmljZSA9IG5ldyBQYXJ0aWNpcGF0aW9uU2VydmljZShwYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeSwgcmlkZVJlcG9zaXRvcnkpO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICB0cnkge1xuICAgIC8vIEdldCBhdXRoIGNvbnRleHRcbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IGF3YWl0IGdldEF1dGhDb250ZXh0KGV2ZW50KTtcbiAgICBjb25zdCBjbHViSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8uY2x1YklkO1xuICAgIGNvbnN0IHJpZGVJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5yaWRlSWQ7XG4gICAgXG4gICAgaWYgKCFjbHViSWQgfHwgIXJpZGVJZCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDQwMCwgeyBlcnJvcjogJ0NsdWIgSUQgYW5kIFJpZGUgSUQgYXJlIHJlcXVpcmVkJyB9KTtcbiAgICB9XG5cbiAgICAvLyBHZXQgcmlkZVxuICAgIGNvbnN0IHJpZGUgPSBhd2FpdCByaWRlU2VydmljZS5nZXRSaWRlKHJpZGVJZCk7XG4gICAgY29uc3QgcmlkZURhdGEgPSByaWRlLnRvSlNPTigpO1xuXG4gICAgLy8gQ2hlY2sgaWYgdXNlciBjYW4gdmlldyB0aGlzIHJpZGVcbiAgICBjb25zdCBjYW5WaWV3ID0gUmlkZUF1dGhvcml6YXRpb25TZXJ2aWNlLmNhblZpZXdSaWRlKFxuICAgICAgYXV0aENvbnRleHQsXG4gICAgICBjbHViSWQsXG4gICAgICByaWRlRGF0YS5zdGF0dXMsXG4gICAgICByaWRlRGF0YS5zY29wZSxcbiAgICAgIHJpZGVEYXRhLmNyZWF0ZWRCeSxcbiAgICAgIHJpZGVEYXRhLmlzUHVibGljXG4gICAgKTtcblxuICAgIGlmICghY2FuVmlldykge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDQwMywgeyBlcnJvcjogJ0luc3VmZmljaWVudCBwcml2aWxlZ2VzIHRvIHZpZXcgdGhpcyByaWRlJyB9KTtcbiAgICB9XG5cbiAgICAvLyBHZXQgcGFydGljaXBhbnRzXG4gICAgY29uc3QgcGFydGljaXBhbnRzID0gYXdhaXQgcGFydGljaXBhdGlvblNlcnZpY2UuZ2V0UmlkZVBhcnRpY2lwYW50cyhyaWRlSWQpO1xuICAgIFxuICAgIC8vIFRyYW5zZm9ybSBwYXJ0aWNpcGFudHMgZGF0YVxuICAgIGNvbnN0IHBhcnRpY2lwYW50c0RhdGEgPSBwYXJ0aWNpcGFudHNcbiAgICAgIC5maWx0ZXIocCA9PiBwLnN0YXR1cyA9PT0gUGFydGljaXBhdGlvblN0YXR1cy5DT05GSVJNRUQpXG4gICAgICAubWFwKHAgPT4ge1xuICAgICAgICBjb25zdCBwRGF0YSA9IHAudG9KU09OKCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdXNlcklkOiBwRGF0YS51c2VySWQsXG4gICAgICAgICAgZGlzcGxheU5hbWU6ICdVbmtub3duJywgLy8gVE9ETzogRW5yaWNoIHdpdGggdXNlciBuYW1lXG4gICAgICAgICAgcm9sZTogcERhdGEucm9sZSxcbiAgICAgICAgICBzdGF0dXM6IHBEYXRhLnN0YXR1cyxcbiAgICAgICAgICBqb2luZWRBdDogcERhdGEuam9pbmVkQXRcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgLy8gR2V0IHdhaXRsaXN0XG4gICAgY29uc3Qgd2FpdGxpc3REYXRhID0gcGFydGljaXBhbnRzXG4gICAgICAuZmlsdGVyKHAgPT4gcC5zdGF0dXMgPT09IFBhcnRpY2lwYXRpb25TdGF0dXMuV0FJVExJU1RFRClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiAoYS53YWl0bGlzdFBvc2l0aW9uIHx8IDApIC0gKGIud2FpdGxpc3RQb3NpdGlvbiB8fCAwKSlcbiAgICAgIC5tYXAocCA9PiB7XG4gICAgICAgIGNvbnN0IHBEYXRhID0gcC50b0pTT04oKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1c2VySWQ6IHBEYXRhLnVzZXJJZCxcbiAgICAgICAgICBkaXNwbGF5TmFtZTogJ1Vua25vd24nLCAvLyBUT0RPOiBFbnJpY2ggd2l0aCB1c2VyIG5hbWVcbiAgICAgICAgICBqb2luZWRXYWl0bGlzdEF0OiBwRGF0YS5qb2luZWRBdCxcbiAgICAgICAgICBwb3NpdGlvbjogcERhdGEud2FpdGxpc3RQb3NpdGlvblxuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoMjAwLCB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YToge1xuICAgICAgICAuLi5yaWRlRGF0YSxcbiAgICAgICAgcGFydGljaXBhbnRzOiBwYXJ0aWNpcGFudHNEYXRhLFxuICAgICAgICB3YWl0bGlzdDogd2FpdGxpc3REYXRhXG4gICAgICB9LFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICB9KTtcblxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgY29uc29sZS5lcnJvcignR2V0IHJpZGUgZXJyb3I6JywgZXJyb3IpO1xuICAgIFxuICAgIGlmIChlcnJvci5zdGF0dXNDb2RlKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoZXJyb3Iuc3RhdHVzQ29kZSwgeyBcbiAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgIGVycm9yVHlwZTogZXJyb3IuZXJyb3JUeXBlIFxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg1MDAsIHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0pO1xuICB9XG59OyJdfQ==