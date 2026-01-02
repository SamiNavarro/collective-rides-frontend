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
        // TODO: Verify user has access to view rides in this club
        // This would require implementing the authorization service
        // For now, we'll allow any authenticated user to view ride summaries
        // TODO: Initialize ride service with proper repository
        // const rideService = new RideService(rideRepository);
        // For now, return a placeholder response
        const summary = {
            rideId: rideId,
            clubId: clubId,
            completedAt: new Date().toISOString(),
            participantsPlanned: 10,
            participantsAttended: 8,
            participantsNoShow: 2,
            participantsWithStrava: 6,
            participantsWithManualEvidence: 2,
            lastUpdatedAt: new Date().toISOString()
        };
        return (0, lambda_utils_1.createResponse)(200, {
            success: true,
            data: summary
        });
    }
    catch (error) {
        console.error('Get ride summary error:', error);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LXJpZGUtc3VtbWFyeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdldC1yaWRlLXN1bW1hcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0Esd0VBQXVFO0FBQ3ZFLHVFQUFzRTtBQUkvRCxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQzFCLEtBQTJCLEVBQ0ssRUFBRTtJQUNsQyxJQUFJO1FBQ0YsbUJBQW1CO1FBQ25CLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBQzVDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBRTVDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDdEIsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFO2dCQUN6QixPQUFPLEVBQUUsS0FBSztnQkFDZCxLQUFLLEVBQUUsa0NBQWtDO2FBQzFDLENBQUMsQ0FBQztTQUNKO1FBRUQsMERBQTBEO1FBQzFELDREQUE0RDtRQUM1RCxxRUFBcUU7UUFFckUsdURBQXVEO1FBQ3ZELHVEQUF1RDtRQUV2RCx5Q0FBeUM7UUFDekMsTUFBTSxPQUFPLEdBQUc7WUFDZCxNQUFNLEVBQUUsTUFBTTtZQUNkLE1BQU0sRUFBRSxNQUFNO1lBQ2QsV0FBVyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1lBQ3JDLG1CQUFtQixFQUFFLEVBQUU7WUFDdkIsb0JBQW9CLEVBQUUsQ0FBQztZQUN2QixrQkFBa0IsRUFBRSxDQUFDO1lBQ3JCLHNCQUFzQixFQUFFLENBQUM7WUFDekIsOEJBQThCLEVBQUUsQ0FBQztZQUNqQyxhQUFhLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDeEMsQ0FBQztRQUVGLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRTtZQUN6QixPQUFPLEVBQUUsSUFBSTtZQUNiLElBQUksRUFBRSxPQUFPO1NBQ2QsQ0FBQyxDQUFDO0tBQ0o7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMseUJBQXlCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDaEQsSUFBSSxLQUFLLFlBQVksS0FBSyxFQUFFO1lBQzFCLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRTtnQkFDekIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO2FBQ3JCLENBQUMsQ0FBQztTQUNKO1FBQ0QsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFO1lBQ3pCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLHVCQUF1QjtTQUMvQixDQUFDLENBQUM7S0FDSjtBQUNILENBQUMsQ0FBQztBQXJEVyxRQUFBLE9BQU8sV0FxRGxCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgY3JlYXRlUmVzcG9uc2UgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IGdldEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGgvYXV0aC1jb250ZXh0JztcbmltcG9ydCB7IFJpZGVTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL3JpZGUvcmlkZS1zZXJ2aWNlJztcbmltcG9ydCB7IENsdWJDYXBhYmlsaXR5IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL2NsdWItYXV0aG9yaXphdGlvbic7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKFxuICBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnRcbik6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiA9PiB7XG4gIHRyeSB7XG4gICAgLy8gR2V0IGF1dGggY29udGV4dFxuICAgIGNvbnN0IGF1dGhDb250ZXh0ID0gYXdhaXQgZ2V0QXV0aENvbnRleHQoZXZlbnQpO1xuICAgIGNvbnN0IGNsdWJJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5jbHViSWQ7XG4gICAgY29uc3QgcmlkZUlkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LnJpZGVJZDtcbiAgICBcbiAgICBpZiAoIWNsdWJJZCB8fCAhcmlkZUlkKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNDAwLCB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogJ0NsdWIgSUQgYW5kIFJpZGUgSUQgYXJlIHJlcXVpcmVkJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gVE9ETzogVmVyaWZ5IHVzZXIgaGFzIGFjY2VzcyB0byB2aWV3IHJpZGVzIGluIHRoaXMgY2x1YlxuICAgIC8vIFRoaXMgd291bGQgcmVxdWlyZSBpbXBsZW1lbnRpbmcgdGhlIGF1dGhvcml6YXRpb24gc2VydmljZVxuICAgIC8vIEZvciBub3csIHdlJ2xsIGFsbG93IGFueSBhdXRoZW50aWNhdGVkIHVzZXIgdG8gdmlldyByaWRlIHN1bW1hcmllc1xuXG4gICAgLy8gVE9ETzogSW5pdGlhbGl6ZSByaWRlIHNlcnZpY2Ugd2l0aCBwcm9wZXIgcmVwb3NpdG9yeVxuICAgIC8vIGNvbnN0IHJpZGVTZXJ2aWNlID0gbmV3IFJpZGVTZXJ2aWNlKHJpZGVSZXBvc2l0b3J5KTtcbiAgICBcbiAgICAvLyBGb3Igbm93LCByZXR1cm4gYSBwbGFjZWhvbGRlciByZXNwb25zZVxuICAgIGNvbnN0IHN1bW1hcnkgPSB7XG4gICAgICByaWRlSWQ6IHJpZGVJZCxcbiAgICAgIGNsdWJJZDogY2x1YklkLFxuICAgICAgY29tcGxldGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIHBhcnRpY2lwYW50c1BsYW5uZWQ6IDEwLFxuICAgICAgcGFydGljaXBhbnRzQXR0ZW5kZWQ6IDgsXG4gICAgICBwYXJ0aWNpcGFudHNOb1Nob3c6IDIsXG4gICAgICBwYXJ0aWNpcGFudHNXaXRoU3RyYXZhOiA2LFxuICAgICAgcGFydGljaXBhbnRzV2l0aE1hbnVhbEV2aWRlbmNlOiAyLFxuICAgICAgbGFzdFVwZGF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgfTtcblxuICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSgyMDAsIHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiBzdW1tYXJ5XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignR2V0IHJpZGUgc3VtbWFyeSBlcnJvcjonLCBlcnJvcik7XG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg0MDAsIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDUwMCwge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcidcbiAgICB9KTtcbiAgfVxufTsiXX0=