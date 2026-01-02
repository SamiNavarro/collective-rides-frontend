"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const id_generator_1 = require("../../../../shared/utils/id-generator");
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
        // TODO: Verify user has permission to manage evidence in this club
        // This would require implementing the authorization service
        // For now, we'll allow any authenticated user to link evidence
        // TODO: Initialize participation service with proper repositories
        // const participationService = new ParticipationService(participationRepository, rideRepository);
        // Generate a unique evidence ID for the manual evidence
        const evidenceId = (0, id_generator_1.generateId)('evidence');
        // For now, return a placeholder response
        return (0, lambda_utils_1.createResponse)(200, {
            success: true,
            data: {
                participationId: `part_${rideId}_${userId}`,
                userId: userId,
                attendanceStatus: 'attended',
                evidence: {
                    type: 'manual',
                    refId: evidenceId,
                    matchType: 'manual',
                    linkedAt: new Date().toISOString()
                },
                confirmedBy: authContext.userId,
                confirmedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Link manual evidence error:', error);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGluay1tYW51YWwtZXZpZGVuY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJsaW5rLW1hbnVhbC1ldmlkZW5jZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSx3RUFBa0Y7QUFDbEYsdUVBQXNFO0FBSXRFLHdFQUFtRTtBQUU1RCxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQzFCLEtBQTJCLEVBQ0ssRUFBRTtJQUNsQyxJQUFJO1FBQ0YsbUJBQW1CO1FBQ25CLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBQzVDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBQzVDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBRTVDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDakMsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFO2dCQUN6QixPQUFPLEVBQUUsS0FBSztnQkFDZCxLQUFLLEVBQUUsNENBQTRDO2FBQ3BELENBQUMsQ0FBQztTQUNKO1FBRUQsTUFBTSxPQUFPLEdBQThCLElBQUEsd0JBQVMsRUFBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFakUsbUVBQW1FO1FBQ25FLDREQUE0RDtRQUM1RCwrREFBK0Q7UUFFL0Qsa0VBQWtFO1FBQ2xFLGtHQUFrRztRQUVsRyx3REFBd0Q7UUFDeEQsTUFBTSxVQUFVLEdBQUcsSUFBQSx5QkFBVSxFQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRTFDLHlDQUF5QztRQUN6QyxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUU7WUFDekIsT0FBTyxFQUFFLElBQUk7WUFDYixJQUFJLEVBQUU7Z0JBQ0osZUFBZSxFQUFFLFFBQVEsTUFBTSxJQUFJLE1BQU0sRUFBRTtnQkFDM0MsTUFBTSxFQUFFLE1BQU07Z0JBQ2QsZ0JBQWdCLEVBQUUsVUFBVTtnQkFDNUIsUUFBUSxFQUFFO29CQUNSLElBQUksRUFBRSxRQUFRO29CQUNkLEtBQUssRUFBRSxVQUFVO29CQUNqQixTQUFTLEVBQUUsUUFBUTtvQkFDbkIsUUFBUSxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2lCQUNuQztnQkFDRCxXQUFXLEVBQUUsV0FBVyxDQUFDLE1BQU07Z0JBQy9CLFdBQVcsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTthQUN0QztTQUNGLENBQUMsQ0FBQztLQUNKO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxPQUFPLENBQUMsS0FBSyxDQUFDLDZCQUE2QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3BELElBQUksS0FBSyxZQUFZLEtBQUssRUFBRTtZQUMxQixPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUU7Z0JBQ3pCLE9BQU8sRUFBRSxLQUFLO2dCQUNkLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTzthQUNyQixDQUFDLENBQUM7U0FDSjtRQUNELE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRTtZQUN6QixPQUFPLEVBQUUsS0FBSztZQUNkLEtBQUssRUFBRSx1QkFBdUI7U0FDL0IsQ0FBQyxDQUFDO0tBQ0o7QUFDSCxDQUFDLENBQUM7QUEzRFcsUUFBQSxPQUFPLFdBMkRsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IGNyZWF0ZVJlc3BvbnNlLCBwYXJzZUpTT04gfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IGdldEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGgvYXV0aC1jb250ZXh0JztcbmltcG9ydCB7IFBhcnRpY2lwYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL3BhcnRpY2lwYXRpb24vcGFydGljaXBhdGlvbi1zZXJ2aWNlJztcbmltcG9ydCB7IExpbmtNYW51YWxFdmlkZW5jZVJlcXVlc3QgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvcGFydGljaXBhdGlvbic7XG5pbXBvcnQgeyBDbHViQ2FwYWJpbGl0eSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9jbHViLWF1dGhvcml6YXRpb24nO1xuaW1wb3J0IHsgZ2VuZXJhdGVJZCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9pZC1nZW5lcmF0b3InO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChcbiAgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50XG4pOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICB0cnkge1xuICAgIC8vIEdldCBhdXRoIGNvbnRleHRcbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IGF3YWl0IGdldEF1dGhDb250ZXh0KGV2ZW50KTtcbiAgICBjb25zdCBjbHViSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8uY2x1YklkO1xuICAgIGNvbnN0IHJpZGVJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5yaWRlSWQ7XG4gICAgY29uc3QgdXNlcklkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LnVzZXJJZDtcbiAgICBcbiAgICBpZiAoIWNsdWJJZCB8fCAhcmlkZUlkIHx8ICF1c2VySWQpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg0MDAsIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiAnQ2x1YiBJRCwgUmlkZSBJRCwgYW5kIFVzZXIgSUQgYXJlIHJlcXVpcmVkJ1xuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IHJlcXVlc3Q6IExpbmtNYW51YWxFdmlkZW5jZVJlcXVlc3QgPSBwYXJzZUpTT04oZXZlbnQuYm9keSk7XG5cbiAgICAvLyBUT0RPOiBWZXJpZnkgdXNlciBoYXMgcGVybWlzc2lvbiB0byBtYW5hZ2UgZXZpZGVuY2UgaW4gdGhpcyBjbHViXG4gICAgLy8gVGhpcyB3b3VsZCByZXF1aXJlIGltcGxlbWVudGluZyB0aGUgYXV0aG9yaXphdGlvbiBzZXJ2aWNlXG4gICAgLy8gRm9yIG5vdywgd2UnbGwgYWxsb3cgYW55IGF1dGhlbnRpY2F0ZWQgdXNlciB0byBsaW5rIGV2aWRlbmNlXG5cbiAgICAvLyBUT0RPOiBJbml0aWFsaXplIHBhcnRpY2lwYXRpb24gc2VydmljZSB3aXRoIHByb3BlciByZXBvc2l0b3JpZXNcbiAgICAvLyBjb25zdCBwYXJ0aWNpcGF0aW9uU2VydmljZSA9IG5ldyBQYXJ0aWNpcGF0aW9uU2VydmljZShwYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeSwgcmlkZVJlcG9zaXRvcnkpO1xuICAgIFxuICAgIC8vIEdlbmVyYXRlIGEgdW5pcXVlIGV2aWRlbmNlIElEIGZvciB0aGUgbWFudWFsIGV2aWRlbmNlXG4gICAgY29uc3QgZXZpZGVuY2VJZCA9IGdlbmVyYXRlSWQoJ2V2aWRlbmNlJyk7XG4gICAgXG4gICAgLy8gRm9yIG5vdywgcmV0dXJuIGEgcGxhY2Vob2xkZXIgcmVzcG9uc2VcbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoMjAwLCB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YToge1xuICAgICAgICBwYXJ0aWNpcGF0aW9uSWQ6IGBwYXJ0XyR7cmlkZUlkfV8ke3VzZXJJZH1gLFxuICAgICAgICB1c2VySWQ6IHVzZXJJZCxcbiAgICAgICAgYXR0ZW5kYW5jZVN0YXR1czogJ2F0dGVuZGVkJyxcbiAgICAgICAgZXZpZGVuY2U6IHtcbiAgICAgICAgICB0eXBlOiAnbWFudWFsJyxcbiAgICAgICAgICByZWZJZDogZXZpZGVuY2VJZCxcbiAgICAgICAgICBtYXRjaFR5cGU6ICdtYW51YWwnLFxuICAgICAgICAgIGxpbmtlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlybWVkQnk6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgICAgY29uZmlybWVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgICAgfVxuICAgIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0xpbmsgbWFudWFsIGV2aWRlbmNlIGVycm9yOicsIGVycm9yKTtcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDQwMCwge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2VcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNTAwLCB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJ1xuICAgIH0pO1xuICB9XG59OyJdfQ==