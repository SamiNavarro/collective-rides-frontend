"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const validation_1 = require("../../../../shared/utils/validation");
const dynamodb_ride_repository_1 = require("../../infrastructure/dynamodb-ride-repository");
const dynamodb_participation_repository_1 = require("../../infrastructure/dynamodb-participation-repository");
const ride_service_1 = require("../../domain/ride/ride-service");
const participation_service_1 = require("../../domain/participation/participation-service");
const participation_1 = require("../../domain/participation/participation");
const ride_authorization_1 = require("../../domain/authorization/ride-authorization");
const ride_authorization_2 = require("../../../../shared/types/ride-authorization");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME;
const rideRepository = new dynamodb_ride_repository_1.DynamoDBRideRepository(dynamoClient, tableName);
const participationRepository = new dynamodb_participation_repository_1.DynamoDBParticipationRepository(dynamoClient, tableName);
const rideService = new ride_service_1.RideService(rideRepository);
const participationService = new participation_service_1.ParticipationService(participationRepository, rideRepository);
const handler = async (event) => {
    console.log('Create ride handler invoked'); // Added for rebuild trigger
    try {
        // Get auth context
        const authContext = await (0, auth_context_1.getAuthContext)(event);
        const clubId = event.pathParameters?.clubId;
        if (!clubId) {
            return (0, lambda_utils_1.createResponse)(400, { error: 'Club ID is required' });
        }
        // Check authorization - any club member can create ride proposals
        await ride_authorization_1.RideAuthorizationService.requireRideCapability(ride_authorization_2.RideCapability.CREATE_RIDE_PROPOSALS, authContext, clubId);
        // Parse and validate request
        const request = (0, lambda_utils_1.parseJSON)(event.body);
        (0, validation_1.validateRequest)(request, [
            'title',
            'description',
            'rideType',
            'difficulty',
            'startDateTime',
            'estimatedDuration',
            'meetingPoint'
        ]);
        // Check if user can publish immediately
        const canPublish = ride_authorization_1.RideAuthorizationService.canPublishRide(authContext, clubId);
        if (request.publishImmediately && !canPublish) {
            return (0, lambda_utils_1.createResponse)(403, {
                error: 'Insufficient privileges to publish rides immediately'
            });
        }
        // Create ride
        const ride = await rideService.createRide(request, authContext.userId, clubId);
        // Create captain participation for ride creator
        const captainParticipation = participation_1.ParticipationEntity.createCaptain(ride.rideId, clubId, authContext.userId);
        await participationRepository.create(captainParticipation);
        return (0, lambda_utils_1.createResponse)(201, {
            success: true,
            data: ride.toJSON(),
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Create ride error:', error);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLXJpZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcmVhdGUtcmlkZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw4REFBMEQ7QUFDMUQsd0VBQWtGO0FBQ2xGLHVFQUFzRTtBQUN0RSxvRUFBc0U7QUFDdEUsNEZBQXVGO0FBQ3ZGLDhHQUF5RztBQUN6RyxpRUFBNkQ7QUFDN0QsNEZBQXdGO0FBQ3hGLDRFQUErRTtBQUMvRSxzRkFBeUY7QUFDekYsb0ZBQTZFO0FBRzdFLE1BQU0sWUFBWSxHQUFHLElBQUksZ0NBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM1QyxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFvQixDQUFDO0FBQ25ELE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQzNFLE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxtRUFBK0IsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDN0YsTUFBTSxXQUFXLEdBQUcsSUFBSSwwQkFBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3BELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSw0Q0FBb0IsQ0FBQyx1QkFBdUIsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUV4RixNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBMkIsRUFBa0MsRUFBRTtJQUMzRixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUMsQ0FBQyw0QkFBNEI7SUFDeEUsSUFBSTtRQUNGLG1CQUFtQjtRQUNuQixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUU1QyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1gsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLHFCQUFxQixFQUFFLENBQUMsQ0FBQztTQUM5RDtRQUVELGtFQUFrRTtRQUNsRSxNQUFNLDZDQUF3QixDQUFDLHFCQUFxQixDQUNsRCxtQ0FBYyxDQUFDLHFCQUFxQixFQUNwQyxXQUFXLEVBQ1gsTUFBTSxDQUNQLENBQUM7UUFFRiw2QkFBNkI7UUFDN0IsTUFBTSxPQUFPLEdBQUcsSUFBQSx3QkFBUyxFQUFvQixLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDekQsSUFBQSw0QkFBZSxFQUFDLE9BQU8sRUFBRTtZQUN2QixPQUFPO1lBQ1AsYUFBYTtZQUNiLFVBQVU7WUFDVixZQUFZO1lBQ1osZUFBZTtZQUNmLG1CQUFtQjtZQUNuQixjQUFjO1NBQ2YsQ0FBQyxDQUFDO1FBRUgsd0NBQXdDO1FBQ3hDLE1BQU0sVUFBVSxHQUFHLDZDQUF3QixDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDaEYsSUFBSSxPQUFPLENBQUMsa0JBQWtCLElBQUksQ0FBQyxVQUFVLEVBQUU7WUFDN0MsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFO2dCQUN6QixLQUFLLEVBQUUsc0RBQXNEO2FBQzlELENBQUMsQ0FBQztTQUNKO1FBRUQsY0FBYztRQUNkLE1BQU0sSUFBSSxHQUFHLE1BQU0sV0FBVyxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztRQUUvRSxnREFBZ0Q7UUFDaEQsTUFBTSxvQkFBb0IsR0FBRyxtQ0FBbUIsQ0FBQyxhQUFhLENBQzVELElBQUksQ0FBQyxNQUFNLEVBQ1gsTUFBTSxFQUNOLFdBQVcsQ0FBQyxNQUFNLENBQ25CLENBQUM7UUFDRixNQUFNLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBRTNELE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRTtZQUN6QixPQUFPLEVBQUUsSUFBSTtZQUNiLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ25CLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUNwQyxDQUFDLENBQUM7S0FFSjtJQUFDLE9BQU8sS0FBVSxFQUFFO1FBQ25CLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFM0MsSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFO1lBQ3BCLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUU7Z0JBQ3RDLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTztnQkFDcEIsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO2FBQzNCLENBQUMsQ0FBQztTQUNKO1FBRUQsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixFQUFFLENBQUMsQ0FBQztLQUNoRTtBQUNILENBQUMsQ0FBQztBQW5FVyxRQUFBLE9BQU8sV0FtRWxCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgRHluYW1vREJDbGllbnQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInO1xuaW1wb3J0IHsgY3JlYXRlUmVzcG9uc2UsIHBhcnNlSlNPTiB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9sYW1iZGEtdXRpbHMnO1xuaW1wb3J0IHsgZ2V0QXV0aENvbnRleHQgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvYXV0aC9hdXRoLWNvbnRleHQnO1xuaW1wb3J0IHsgdmFsaWRhdGVSZXF1ZXN0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL3ZhbGlkYXRpb24nO1xuaW1wb3J0IHsgRHluYW1vREJSaWRlUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLXJpZGUtcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBEeW5hbW9EQlBhcnRpY2lwYXRpb25SZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItcGFydGljaXBhdGlvbi1yZXBvc2l0b3J5JztcbmltcG9ydCB7IFJpZGVTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL3JpZGUvcmlkZS1zZXJ2aWNlJztcbmltcG9ydCB7IFBhcnRpY2lwYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL3BhcnRpY2lwYXRpb24vcGFydGljaXBhdGlvbi1zZXJ2aWNlJztcbmltcG9ydCB7IFBhcnRpY2lwYXRpb25FbnRpdHkgfSBmcm9tICcuLi8uLi9kb21haW4vcGFydGljaXBhdGlvbi9wYXJ0aWNpcGF0aW9uJztcbmltcG9ydCB7IFJpZGVBdXRob3JpemF0aW9uU2VydmljZSB9IGZyb20gJy4uLy4uL2RvbWFpbi9hdXRob3JpemF0aW9uL3JpZGUtYXV0aG9yaXphdGlvbic7XG5pbXBvcnQgeyBSaWRlQ2FwYWJpbGl0eSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9yaWRlLWF1dGhvcml6YXRpb24nO1xuaW1wb3J0IHsgQ3JlYXRlUmlkZVJlcXVlc3QgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvcmlkZSc7XG5cbmNvbnN0IGR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG5jb25zdCB0YWJsZU5hbWUgPSBwcm9jZXNzLmVudi5EWU5BTU9EQl9UQUJMRV9OQU1FITtcbmNvbnN0IHJpZGVSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCUmlkZVJlcG9zaXRvcnkoZHluYW1vQ2xpZW50LCB0YWJsZU5hbWUpO1xuY29uc3QgcGFydGljaXBhdGlvblJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJQYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeShkeW5hbW9DbGllbnQsIHRhYmxlTmFtZSk7XG5jb25zdCByaWRlU2VydmljZSA9IG5ldyBSaWRlU2VydmljZShyaWRlUmVwb3NpdG9yeSk7XG5jb25zdCBwYXJ0aWNpcGF0aW9uU2VydmljZSA9IG5ldyBQYXJ0aWNpcGF0aW9uU2VydmljZShwYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeSwgcmlkZVJlcG9zaXRvcnkpO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICBjb25zb2xlLmxvZygnQ3JlYXRlIHJpZGUgaGFuZGxlciBpbnZva2VkJyk7IC8vIEFkZGVkIGZvciByZWJ1aWxkIHRyaWdnZXJcbiAgdHJ5IHtcbiAgICAvLyBHZXQgYXV0aCBjb250ZXh0XG4gICAgY29uc3QgYXV0aENvbnRleHQgPSBhd2FpdCBnZXRBdXRoQ29udGV4dChldmVudCk7XG4gICAgY29uc3QgY2x1YklkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNsdWJJZDtcbiAgICBcbiAgICBpZiAoIWNsdWJJZCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDQwMCwgeyBlcnJvcjogJ0NsdWIgSUQgaXMgcmVxdWlyZWQnIH0pO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGF1dGhvcml6YXRpb24gLSBhbnkgY2x1YiBtZW1iZXIgY2FuIGNyZWF0ZSByaWRlIHByb3Bvc2Fsc1xuICAgIGF3YWl0IFJpZGVBdXRob3JpemF0aW9uU2VydmljZS5yZXF1aXJlUmlkZUNhcGFiaWxpdHkoXG4gICAgICBSaWRlQ2FwYWJpbGl0eS5DUkVBVEVfUklERV9QUk9QT1NBTFMsXG4gICAgICBhdXRoQ29udGV4dCxcbiAgICAgIGNsdWJJZFxuICAgICk7XG5cbiAgICAvLyBQYXJzZSBhbmQgdmFsaWRhdGUgcmVxdWVzdFxuICAgIGNvbnN0IHJlcXVlc3QgPSBwYXJzZUpTT048Q3JlYXRlUmlkZVJlcXVlc3Q+KGV2ZW50LmJvZHkpO1xuICAgIHZhbGlkYXRlUmVxdWVzdChyZXF1ZXN0LCBbXG4gICAgICAndGl0bGUnLFxuICAgICAgJ2Rlc2NyaXB0aW9uJywgXG4gICAgICAncmlkZVR5cGUnLFxuICAgICAgJ2RpZmZpY3VsdHknLFxuICAgICAgJ3N0YXJ0RGF0ZVRpbWUnLFxuICAgICAgJ2VzdGltYXRlZER1cmF0aW9uJyxcbiAgICAgICdtZWV0aW5nUG9pbnQnXG4gICAgXSk7XG5cbiAgICAvLyBDaGVjayBpZiB1c2VyIGNhbiBwdWJsaXNoIGltbWVkaWF0ZWx5XG4gICAgY29uc3QgY2FuUHVibGlzaCA9IFJpZGVBdXRob3JpemF0aW9uU2VydmljZS5jYW5QdWJsaXNoUmlkZShhdXRoQ29udGV4dCwgY2x1YklkKTtcbiAgICBpZiAocmVxdWVzdC5wdWJsaXNoSW1tZWRpYXRlbHkgJiYgIWNhblB1Ymxpc2gpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg0MDMsIHsgXG4gICAgICAgIGVycm9yOiAnSW5zdWZmaWNpZW50IHByaXZpbGVnZXMgdG8gcHVibGlzaCByaWRlcyBpbW1lZGlhdGVseScgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgcmlkZVxuICAgIGNvbnN0IHJpZGUgPSBhd2FpdCByaWRlU2VydmljZS5jcmVhdGVSaWRlKHJlcXVlc3QsIGF1dGhDb250ZXh0LnVzZXJJZCwgY2x1YklkKTtcblxuICAgIC8vIENyZWF0ZSBjYXB0YWluIHBhcnRpY2lwYXRpb24gZm9yIHJpZGUgY3JlYXRvclxuICAgIGNvbnN0IGNhcHRhaW5QYXJ0aWNpcGF0aW9uID0gUGFydGljaXBhdGlvbkVudGl0eS5jcmVhdGVDYXB0YWluKFxuICAgICAgcmlkZS5yaWRlSWQsXG4gICAgICBjbHViSWQsXG4gICAgICBhdXRoQ29udGV4dC51c2VySWRcbiAgICApO1xuICAgIGF3YWl0IHBhcnRpY2lwYXRpb25SZXBvc2l0b3J5LmNyZWF0ZShjYXB0YWluUGFydGljaXBhdGlvbik7XG5cbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoMjAxLCB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YTogcmlkZS50b0pTT04oKSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgfSk7XG5cbiAgfSBjYXRjaCAoZXJyb3I6IGFueSkge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0NyZWF0ZSByaWRlIGVycm9yOicsIGVycm9yKTtcbiAgICBcbiAgICBpZiAoZXJyb3Iuc3RhdHVzQ29kZSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKGVycm9yLnN0YXR1c0NvZGUsIHsgXG4gICAgICAgIGVycm9yOiBlcnJvci5tZXNzYWdlLFxuICAgICAgICBlcnJvclR5cGU6IGVycm9yLmVycm9yVHlwZSBcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNTAwLCB7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9KTtcbiAgfVxufTsiXX0=