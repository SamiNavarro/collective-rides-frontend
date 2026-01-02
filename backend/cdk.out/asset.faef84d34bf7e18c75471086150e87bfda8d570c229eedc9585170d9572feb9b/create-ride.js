"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lambda_utils_js_1 = require("../../../../shared/utils/lambda-utils.js");
const auth_context_js_1 = require("../../../../shared/auth/auth-context.js");
const validation_js_1 = require("../../../../shared/utils/validation.js");
const dynamodb_ride_repository_js_1 = require("../../infrastructure/dynamodb-ride-repository.js");
const dynamodb_participation_repository_js_1 = require("../../infrastructure/dynamodb-participation-repository.js");
const ride_service_js_1 = require("../../domain/ride/ride-service.js");
const participation_service_js_1 = require("../../domain/participation/participation-service.js");
const participation_js_1 = require("../../domain/participation/participation.js");
const ride_authorization_js_1 = require("../../domain/authorization/ride-authorization.js");
const ride_authorization_js_2 = require("../../../../shared/types/ride-authorization.js");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME;
const rideRepository = new dynamodb_ride_repository_js_1.DynamoDBRideRepository(dynamoClient, tableName);
const participationRepository = new dynamodb_participation_repository_js_1.DynamoDBParticipationRepository(dynamoClient, tableName);
const rideService = new ride_service_js_1.RideService(rideRepository);
const participationService = new participation_service_js_1.ParticipationService(participationRepository, rideRepository);
const handler = async (event) => {
    try {
        // Get auth context
        const authContext = await (0, auth_context_js_1.getAuthContext)(event);
        const clubId = event.pathParameters?.clubId;
        if (!clubId) {
            return (0, lambda_utils_js_1.createResponse)(400, { error: 'Club ID is required' });
        }
        // Check authorization - any club member can create ride proposals
        await ride_authorization_js_1.RideAuthorizationService.requireRideCapability(ride_authorization_js_2.RideCapability.CREATE_RIDE_PROPOSALS, authContext, clubId);
        // Parse and validate request
        const request = (0, lambda_utils_js_1.parseJSON)(event.body);
        (0, validation_js_1.validateRequest)(request, [
            'title',
            'description',
            'rideType',
            'difficulty',
            'startDateTime',
            'estimatedDuration',
            'meetingPoint'
        ]);
        // Check if user can publish immediately
        const canPublish = ride_authorization_js_1.RideAuthorizationService.canPublishRide(authContext, clubId);
        if (request.publishImmediately && !canPublish) {
            return (0, lambda_utils_js_1.createResponse)(403, {
                error: 'Insufficient privileges to publish rides immediately'
            });
        }
        // Create ride
        const ride = await rideService.createRide(request, authContext.userId, clubId);
        // Create captain participation for ride creator
        const captainParticipation = participation_js_1.ParticipationEntity.createCaptain(ride.rideId, clubId, authContext.userId);
        await participationRepository.create(captainParticipation);
        return (0, lambda_utils_js_1.createResponse)(201, {
            success: true,
            data: ride.toJSON(),
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Create ride error:', error);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLXJpZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcmVhdGUtcmlkZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw4REFBMEQ7QUFDMUQsOEVBQXFGO0FBQ3JGLDZFQUF5RTtBQUN6RSwwRUFBeUU7QUFDekUsa0dBQTBGO0FBQzFGLG9IQUE0RztBQUM1Ryx1RUFBZ0U7QUFDaEUsa0dBQTJGO0FBQzNGLGtGQUFrRjtBQUNsRiw0RkFBNEY7QUFDNUYsMEZBQWdGO0FBR2hGLE1BQU0sWUFBWSxHQUFHLElBQUksZ0NBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM1QyxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFvQixDQUFDO0FBQ25ELE1BQU0sY0FBYyxHQUFHLElBQUksb0RBQXNCLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQzNFLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxzRUFBK0IsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDN0YsTUFBTSxXQUFXLEdBQUcsSUFBSSw2QkFBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3BELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSwrQ0FBb0IsQ0FBQyx1QkFBdUIsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUV4RixNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBMkIsRUFBa0MsRUFBRTtJQUMzRixJQUFJO1FBQ0YsbUJBQW1CO1FBQ25CLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSxnQ0FBYyxFQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBRTVDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxPQUFPLElBQUEsZ0NBQWMsRUFBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO1NBQzlEO1FBRUQsa0VBQWtFO1FBQ2xFLE1BQU0sZ0RBQXdCLENBQUMscUJBQXFCLENBQ2xELHNDQUFjLENBQUMscUJBQXFCLEVBQ3BDLFdBQVcsRUFDWCxNQUFNLENBQ1AsQ0FBQztRQUVGLDZCQUE2QjtRQUM3QixNQUFNLE9BQU8sR0FBRyxJQUFBLDJCQUFTLEVBQW9CLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6RCxJQUFBLCtCQUFlLEVBQUMsT0FBTyxFQUFFO1lBQ3ZCLE9BQU87WUFDUCxhQUFhO1lBQ2IsVUFBVTtZQUNWLFlBQVk7WUFDWixlQUFlO1lBQ2YsbUJBQW1CO1lBQ25CLGNBQWM7U0FDZixDQUFDLENBQUM7UUFFSCx3Q0FBd0M7UUFDeEMsTUFBTSxVQUFVLEdBQUcsZ0RBQXdCLENBQUMsY0FBYyxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNoRixJQUFJLE9BQU8sQ0FBQyxrQkFBa0IsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUM3QyxPQUFPLElBQUEsZ0NBQWMsRUFBQyxHQUFHLEVBQUU7Z0JBQ3pCLEtBQUssRUFBRSxzREFBc0Q7YUFDOUQsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxjQUFjO1FBQ2QsTUFBTSxJQUFJLEdBQUcsTUFBTSxXQUFXLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxXQUFXLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRS9FLGdEQUFnRDtRQUNoRCxNQUFNLG9CQUFvQixHQUFHLHNDQUFtQixDQUFDLGFBQWEsQ0FDNUQsSUFBSSxDQUFDLE1BQU0sRUFDWCxNQUFNLEVBQ04sV0FBVyxDQUFDLE1BQU0sQ0FDbkIsQ0FBQztRQUNGLE1BQU0sdUJBQXVCLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFFM0QsT0FBTyxJQUFBLGdDQUFjLEVBQUMsR0FBRyxFQUFFO1lBQ3pCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDbkIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3BDLENBQUMsQ0FBQztLQUVKO0lBQUMsT0FBTyxLQUFVLEVBQUU7UUFDbkIsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUUzQyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUU7WUFDcEIsT0FBTyxJQUFBLGdDQUFjLEVBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRTtnQkFDdEMsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO2dCQUNwQixTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7YUFDM0IsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxPQUFPLElBQUEsZ0NBQWMsRUFBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDO0tBQ2hFO0FBQ0gsQ0FBQyxDQUFDO0FBbEVXLFFBQUEsT0FBTyxXQWtFbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XG5pbXBvcnQgeyBjcmVhdGVSZXNwb25zZSwgcGFyc2VKU09OIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscy5qcyc7XG5pbXBvcnQgeyBnZXRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dC5qcyc7XG5pbXBvcnQgeyB2YWxpZGF0ZVJlcXVlc3QgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvdmFsaWRhdGlvbi5qcyc7XG5pbXBvcnQgeyBEeW5hbW9EQlJpZGVSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItcmlkZS1yZXBvc2l0b3J5LmpzJztcbmltcG9ydCB7IER5bmFtb0RCUGFydGljaXBhdGlvblJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1wYXJ0aWNpcGF0aW9uLXJlcG9zaXRvcnkuanMnO1xuaW1wb3J0IHsgUmlkZVNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vcmlkZS9yaWRlLXNlcnZpY2UuanMnO1xuaW1wb3J0IHsgUGFydGljaXBhdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vcGFydGljaXBhdGlvbi9wYXJ0aWNpcGF0aW9uLXNlcnZpY2UuanMnO1xuaW1wb3J0IHsgUGFydGljaXBhdGlvbkVudGl0eSB9IGZyb20gJy4uLy4uL2RvbWFpbi9wYXJ0aWNpcGF0aW9uL3BhcnRpY2lwYXRpb24uanMnO1xuaW1wb3J0IHsgUmlkZUF1dGhvcml6YXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2F1dGhvcml6YXRpb24vcmlkZS1hdXRob3JpemF0aW9uLmpzJztcbmltcG9ydCB7IFJpZGVDYXBhYmlsaXR5IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL3JpZGUtYXV0aG9yaXphdGlvbi5qcyc7XG5pbXBvcnQgeyBDcmVhdGVSaWRlUmVxdWVzdCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9yaWRlLmpzJztcblxuY29uc3QgZHluYW1vQ2xpZW50ID0gbmV3IER5bmFtb0RCQ2xpZW50KHt9KTtcbmNvbnN0IHRhYmxlTmFtZSA9IHByb2Nlc3MuZW52LkRZTkFNT0RCX1RBQkxFX05BTUUhO1xuY29uc3QgcmlkZVJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJSaWRlUmVwb3NpdG9yeShkeW5hbW9DbGllbnQsIHRhYmxlTmFtZSk7XG5jb25zdCBwYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQlBhcnRpY2lwYXRpb25SZXBvc2l0b3J5KGR5bmFtb0NsaWVudCwgdGFibGVOYW1lKTtcbmNvbnN0IHJpZGVTZXJ2aWNlID0gbmV3IFJpZGVTZXJ2aWNlKHJpZGVSZXBvc2l0b3J5KTtcbmNvbnN0IHBhcnRpY2lwYXRpb25TZXJ2aWNlID0gbmV3IFBhcnRpY2lwYXRpb25TZXJ2aWNlKHBhcnRpY2lwYXRpb25SZXBvc2l0b3J5LCByaWRlUmVwb3NpdG9yeSk7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCk6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiA9PiB7XG4gIHRyeSB7XG4gICAgLy8gR2V0IGF1dGggY29udGV4dFxuICAgIGNvbnN0IGF1dGhDb250ZXh0ID0gYXdhaXQgZ2V0QXV0aENvbnRleHQoZXZlbnQpO1xuICAgIGNvbnN0IGNsdWJJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5jbHViSWQ7XG4gICAgXG4gICAgaWYgKCFjbHViSWQpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg0MDAsIHsgZXJyb3I6ICdDbHViIElEIGlzIHJlcXVpcmVkJyB9KTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBhdXRob3JpemF0aW9uIC0gYW55IGNsdWIgbWVtYmVyIGNhbiBjcmVhdGUgcmlkZSBwcm9wb3NhbHNcbiAgICBhd2FpdCBSaWRlQXV0aG9yaXphdGlvblNlcnZpY2UucmVxdWlyZVJpZGVDYXBhYmlsaXR5KFxuICAgICAgUmlkZUNhcGFiaWxpdHkuQ1JFQVRFX1JJREVfUFJPUE9TQUxTLFxuICAgICAgYXV0aENvbnRleHQsXG4gICAgICBjbHViSWRcbiAgICApO1xuXG4gICAgLy8gUGFyc2UgYW5kIHZhbGlkYXRlIHJlcXVlc3RcbiAgICBjb25zdCByZXF1ZXN0ID0gcGFyc2VKU09OPENyZWF0ZVJpZGVSZXF1ZXN0PihldmVudC5ib2R5KTtcbiAgICB2YWxpZGF0ZVJlcXVlc3QocmVxdWVzdCwgW1xuICAgICAgJ3RpdGxlJyxcbiAgICAgICdkZXNjcmlwdGlvbicsIFxuICAgICAgJ3JpZGVUeXBlJyxcbiAgICAgICdkaWZmaWN1bHR5JyxcbiAgICAgICdzdGFydERhdGVUaW1lJyxcbiAgICAgICdlc3RpbWF0ZWREdXJhdGlvbicsXG4gICAgICAnbWVldGluZ1BvaW50J1xuICAgIF0pO1xuXG4gICAgLy8gQ2hlY2sgaWYgdXNlciBjYW4gcHVibGlzaCBpbW1lZGlhdGVseVxuICAgIGNvbnN0IGNhblB1Ymxpc2ggPSBSaWRlQXV0aG9yaXphdGlvblNlcnZpY2UuY2FuUHVibGlzaFJpZGUoYXV0aENvbnRleHQsIGNsdWJJZCk7XG4gICAgaWYgKHJlcXVlc3QucHVibGlzaEltbWVkaWF0ZWx5ICYmICFjYW5QdWJsaXNoKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNDAzLCB7IFxuICAgICAgICBlcnJvcjogJ0luc3VmZmljaWVudCBwcml2aWxlZ2VzIHRvIHB1Ymxpc2ggcmlkZXMgaW1tZWRpYXRlbHknIFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHJpZGVcbiAgICBjb25zdCByaWRlID0gYXdhaXQgcmlkZVNlcnZpY2UuY3JlYXRlUmlkZShyZXF1ZXN0LCBhdXRoQ29udGV4dC51c2VySWQsIGNsdWJJZCk7XG5cbiAgICAvLyBDcmVhdGUgY2FwdGFpbiBwYXJ0aWNpcGF0aW9uIGZvciByaWRlIGNyZWF0b3JcbiAgICBjb25zdCBjYXB0YWluUGFydGljaXBhdGlvbiA9IFBhcnRpY2lwYXRpb25FbnRpdHkuY3JlYXRlQ2FwdGFpbihcbiAgICAgIHJpZGUucmlkZUlkLFxuICAgICAgY2x1YklkLFxuICAgICAgYXV0aENvbnRleHQudXNlcklkXG4gICAgKTtcbiAgICBhd2FpdCBwYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeS5jcmVhdGUoY2FwdGFpblBhcnRpY2lwYXRpb24pO1xuXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDIwMSwge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHJpZGUudG9KU09OKCksXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgIH0pO1xuXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICBjb25zb2xlLmVycm9yKCdDcmVhdGUgcmlkZSBlcnJvcjonLCBlcnJvcik7XG4gICAgXG4gICAgaWYgKGVycm9yLnN0YXR1c0NvZGUpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZShlcnJvci5zdGF0dXNDb2RlLCB7IFxuICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgZXJyb3JUeXBlOiBlcnJvci5lcnJvclR5cGUgXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDUwMCwgeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSk7XG4gIH1cbn07Il19