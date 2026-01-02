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
        if (!clubId || !rideId) {
            return (0, lambda_utils_1.createResponse)(400, {
                success: false,
                error: 'Club ID and Ride ID are required'
            });
        }
        const request = (0, lambda_utils_1.parseJSON)(event.body);
        // TODO: Verify user has permission to complete rides in this club
        // This would require implementing the authorization service
        // For now, we'll allow any authenticated user to complete rides
        // TODO: Initialize ride service with proper repository
        // const rideService = new RideService(rideRepository);
        // For now, return a placeholder response
        return (0, lambda_utils_1.createResponse)(200, {
            success: true,
            data: {
                rideId: rideId,
                status: 'completed',
                completedAt: new Date().toISOString(),
                completedBy: authContext.userId,
                completionNotes: request.completionNotes
            }
        });
    }
    catch (error) {
        console.error('Complete ride error:', error);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcGxldGUtcmlkZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbXBsZXRlLXJpZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0Esd0VBQWtGO0FBQ2xGLHVFQUFzRTtBQUsvRCxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQzFCLEtBQTJCLEVBQ0ssRUFBRTtJQUNsQyxJQUFJO1FBQ0YsbUJBQW1CO1FBQ25CLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBQzVDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBRTVDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDdEIsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFO2dCQUN6QixPQUFPLEVBQUUsS0FBSztnQkFDZCxLQUFLLEVBQUUsa0NBQWtDO2FBQzFDLENBQUMsQ0FBQztTQUNKO1FBRUQsTUFBTSxPQUFPLEdBQXdCLElBQUEsd0JBQVMsRUFBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFM0Qsa0VBQWtFO1FBQ2xFLDREQUE0RDtRQUM1RCxnRUFBZ0U7UUFFaEUsdURBQXVEO1FBQ3ZELHVEQUF1RDtRQUV2RCx5Q0FBeUM7UUFDekMsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFO1lBQ3pCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsSUFBSSxFQUFFO2dCQUNKLE1BQU0sRUFBRSxNQUFNO2dCQUNkLE1BQU0sRUFBRSxXQUFXO2dCQUNuQixXQUFXLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7Z0JBQ3JDLFdBQVcsRUFBRSxXQUFXLENBQUMsTUFBTTtnQkFDL0IsZUFBZSxFQUFFLE9BQU8sQ0FBQyxlQUFlO2FBQ3pDO1NBQ0YsQ0FBQyxDQUFDO0tBQ0o7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsc0JBQXNCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0MsSUFBSSxLQUFLLFlBQVksS0FBSyxFQUFFO1lBQzFCLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRTtnQkFDekIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO2FBQ3JCLENBQUMsQ0FBQztTQUNKO1FBQ0QsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFO1lBQ3pCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLHVCQUF1QjtTQUMvQixDQUFDLENBQUM7S0FDSjtBQUNILENBQUMsQ0FBQztBQWpEVyxRQUFBLE9BQU8sV0FpRGxCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgY3JlYXRlUmVzcG9uc2UsIHBhcnNlSlNPTiB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9sYW1iZGEtdXRpbHMnO1xuaW1wb3J0IHsgZ2V0QXV0aENvbnRleHQgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvYXV0aC9hdXRoLWNvbnRleHQnO1xuaW1wb3J0IHsgUmlkZVNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vcmlkZS9yaWRlLXNlcnZpY2UnO1xuaW1wb3J0IHsgQ29tcGxldGVSaWRlUmVxdWVzdCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9yaWRlJztcbmltcG9ydCB7IENsdWJDYXBhYmlsaXR5IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL2NsdWItYXV0aG9yaXphdGlvbic7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKFxuICBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnRcbik6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiA9PiB7XG4gIHRyeSB7XG4gICAgLy8gR2V0IGF1dGggY29udGV4dFxuICAgIGNvbnN0IGF1dGhDb250ZXh0ID0gYXdhaXQgZ2V0QXV0aENvbnRleHQoZXZlbnQpO1xuICAgIGNvbnN0IGNsdWJJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5jbHViSWQ7XG4gICAgY29uc3QgcmlkZUlkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LnJpZGVJZDtcbiAgICBcbiAgICBpZiAoIWNsdWJJZCB8fCAhcmlkZUlkKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNDAwLCB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogJ0NsdWIgSUQgYW5kIFJpZGUgSUQgYXJlIHJlcXVpcmVkJ1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IHJlcXVlc3Q6IENvbXBsZXRlUmlkZVJlcXVlc3QgPSBwYXJzZUpTT04oZXZlbnQuYm9keSk7XG5cbiAgICAvLyBUT0RPOiBWZXJpZnkgdXNlciBoYXMgcGVybWlzc2lvbiB0byBjb21wbGV0ZSByaWRlcyBpbiB0aGlzIGNsdWJcbiAgICAvLyBUaGlzIHdvdWxkIHJlcXVpcmUgaW1wbGVtZW50aW5nIHRoZSBhdXRob3JpemF0aW9uIHNlcnZpY2VcbiAgICAvLyBGb3Igbm93LCB3ZSdsbCBhbGxvdyBhbnkgYXV0aGVudGljYXRlZCB1c2VyIHRvIGNvbXBsZXRlIHJpZGVzXG5cbiAgICAvLyBUT0RPOiBJbml0aWFsaXplIHJpZGUgc2VydmljZSB3aXRoIHByb3BlciByZXBvc2l0b3J5XG4gICAgLy8gY29uc3QgcmlkZVNlcnZpY2UgPSBuZXcgUmlkZVNlcnZpY2UocmlkZVJlcG9zaXRvcnkpO1xuICAgIFxuICAgIC8vIEZvciBub3csIHJldHVybiBhIHBsYWNlaG9sZGVyIHJlc3BvbnNlXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDIwMCwge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgcmlkZUlkOiByaWRlSWQsXG4gICAgICAgIHN0YXR1czogJ2NvbXBsZXRlZCcsXG4gICAgICAgIGNvbXBsZXRlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICAgIGNvbXBsZXRlZEJ5OiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICAgIGNvbXBsZXRpb25Ob3RlczogcmVxdWVzdC5jb21wbGV0aW9uTm90ZXNcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdDb21wbGV0ZSByaWRlIGVycm9yOicsIGVycm9yKTtcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDQwMCwge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNTAwLCB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJ1xuICAgIH0pO1xuICB9XG59OyJdfQ==