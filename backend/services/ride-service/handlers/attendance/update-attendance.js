"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const handler = async (event) => {
    try {
        // Get auth context
        const authContext = await (0, auth_context_1.getAuthContext)(event);
        const clubId = event.pathParameters?.clubId;
        const rideId = event.pathParameters?.rideId;
        const userId = event.pathParameters?.userId;
        if (!clubId || !rideId || !userId) {
            return (0, lambda_utils_1.createResponse)(400, {
                success: false,
                error: 'Club ID, Ride ID, and User ID are required'
            });
        }
        const request = (0, lambda_utils_1.parseJSON)(event.body);
        // TODO: Verify user has permission to manage attendance in this club
        // This would require implementing the authorization service
        // For now, we'll allow any authenticated user to update attendance
        // TODO: Initialize participation service with proper repositories
        // const participationService = new ParticipationService(participationRepository, rideRepository);
        // For now, return a placeholder response
        return (0, lambda_utils_1.createResponse)(200, {
            success: true,
            data: {
                participationId: `part_${rideId}_${userId}`,
                userId: userId,
                attendanceStatus: request.attendanceStatus,
                confirmedBy: authContext.userId,
                confirmedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Update attendance error:', error);
        if (error instanceof Error) {
            return (0, lambda_utils_1.createResponse)(400, {
                success: false,
                error: error.message
            });
        }
        return (0, lambda_utils_1.createResponse)(500, {
            success: false,
            error: 'Internal server error'
        });
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLWF0dGVuZGFuY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1cGRhdGUtYXR0ZW5kYW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSx3RUFBa0Y7QUFDbEYsdUVBQXNFO0FBSy9ELE1BQU0sT0FBTyxHQUFHLEtBQUssRUFDMUIsS0FBMkIsRUFDSyxFQUFFO0lBQ2xDLElBQUk7UUFDRixtQkFBbUI7UUFDbkIsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFBLDZCQUFjLEVBQUMsS0FBSyxDQUFDLENBQUM7UUFDaEQsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUM7UUFDNUMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUM7UUFDNUMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUM7UUFFNUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNqQyxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUU7Z0JBQ3pCLE9BQU8sRUFBRSxLQUFLO2dCQUNkLEtBQUssRUFBRSw0Q0FBNEM7YUFDcEQsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxNQUFNLE9BQU8sR0FBNEIsSUFBQSx3QkFBUyxFQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUUvRCxxRUFBcUU7UUFDckUsNERBQTREO1FBQzVELG1FQUFtRTtRQUVuRSxrRUFBa0U7UUFDbEUsa0dBQWtHO1FBRWxHLHlDQUF5QztRQUN6QyxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUU7WUFDekIsT0FBTyxFQUFFLElBQUk7WUFDYixJQUFJLEVBQUU7Z0JBQ0osZUFBZSxFQUFFLFFBQVEsTUFBTSxJQUFJLE1BQU0sRUFBRTtnQkFDM0MsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLGdCQUFnQjtnQkFDMUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxNQUFNO2dCQUMvQixXQUFXLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7YUFDdEM7U0FDRixDQUFDLENBQUM7S0FDSjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQywwQkFBMEIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNqRCxJQUFJLEtBQUssWUFBWSxLQUFLLEVBQUU7WUFDMUIsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFO2dCQUN6QixPQUFPLEVBQUUsS0FBSztnQkFDZCxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU87YUFDckIsQ0FBQyxDQUFDO1NBQ0o7UUFDRCxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUU7WUFDekIsT0FBTyxFQUFFLEtBQUs7WUFDZCxLQUFLLEVBQUUsdUJBQXVCO1NBQy9CLENBQUMsQ0FBQztLQUNKO0FBQ0gsQ0FBQyxDQUFDO0FBbERXLFFBQUEsT0FBTyxXQWtEbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBjcmVhdGVSZXNwb25zZSwgcGFyc2VKU09OIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBnZXRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBQYXJ0aWNpcGF0aW9uU2VydmljZSB9IGZyb20gJy4uLy4uL2RvbWFpbi9wYXJ0aWNpcGF0aW9uL3BhcnRpY2lwYXRpb24tc2VydmljZSc7XG5pbXBvcnQgeyBVcGRhdGVBdHRlbmRhbmNlUmVxdWVzdCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9wYXJ0aWNpcGF0aW9uJztcbmltcG9ydCB7IENsdWJDYXBhYmlsaXR5IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL2NsdWItYXV0aG9yaXphdGlvbic7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKFxuICBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnRcbik6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiA9PiB7XG4gIHRyeSB7XG4gICAgLy8gR2V0IGF1dGggY29udGV4dFxuICAgIGNvbnN0IGF1dGhDb250ZXh0ID0gYXdhaXQgZ2V0QXV0aENvbnRleHQoZXZlbnQpO1xuICAgIGNvbnN0IGNsdWJJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5jbHViSWQ7XG4gICAgY29uc3QgcmlkZUlkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LnJpZGVJZDtcbiAgICBjb25zdCB1c2VySWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8udXNlcklkO1xuICAgIFxuICAgIGlmICghY2x1YklkIHx8ICFyaWRlSWQgfHwgIXVzZXJJZCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDQwMCwge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6ICdDbHViIElELCBSaWRlIElELCBhbmQgVXNlciBJRCBhcmUgcmVxdWlyZWQnXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgY29uc3QgcmVxdWVzdDogVXBkYXRlQXR0ZW5kYW5jZVJlcXVlc3QgPSBwYXJzZUpTT04oZXZlbnQuYm9keSk7XG5cbiAgICAvLyBUT0RPOiBWZXJpZnkgdXNlciBoYXMgcGVybWlzc2lvbiB0byBtYW5hZ2UgYXR0ZW5kYW5jZSBpbiB0aGlzIGNsdWJcbiAgICAvLyBUaGlzIHdvdWxkIHJlcXVpcmUgaW1wbGVtZW50aW5nIHRoZSBhdXRob3JpemF0aW9uIHNlcnZpY2VcbiAgICAvLyBGb3Igbm93LCB3ZSdsbCBhbGxvdyBhbnkgYXV0aGVudGljYXRlZCB1c2VyIHRvIHVwZGF0ZSBhdHRlbmRhbmNlXG5cbiAgICAvLyBUT0RPOiBJbml0aWFsaXplIHBhcnRpY2lwYXRpb24gc2VydmljZSB3aXRoIHByb3BlciByZXBvc2l0b3JpZXNcbiAgICAvLyBjb25zdCBwYXJ0aWNpcGF0aW9uU2VydmljZSA9IG5ldyBQYXJ0aWNpcGF0aW9uU2VydmljZShwYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeSwgcmlkZVJlcG9zaXRvcnkpO1xuICAgIFxuICAgIC8vIEZvciBub3csIHJldHVybiBhIHBsYWNlaG9sZGVyIHJlc3BvbnNlXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDIwMCwge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgcGFydGljaXBhdGlvbklkOiBgcGFydF8ke3JpZGVJZH1fJHt1c2VySWR9YCxcbiAgICAgICAgdXNlcklkOiB1c2VySWQsXG4gICAgICAgIGF0dGVuZGFuY2VTdGF0dXM6IHJlcXVlc3QuYXR0ZW5kYW5jZVN0YXR1cyxcbiAgICAgICAgY29uZmlybWVkQnk6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgICAgY29uZmlybWVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgfVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1VwZGF0ZSBhdHRlbmRhbmNlIGVycm9yOicsIGVycm9yKTtcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDQwMCwge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNTAwLCB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJ1xuICAgIH0pO1xuICB9XG59OyJdfQ==