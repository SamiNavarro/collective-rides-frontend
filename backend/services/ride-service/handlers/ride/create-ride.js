"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const validation_1 = require("../../../../shared/utils/validation");
const dynamodb_ride_repository_1 = require("../../infrastructure/dynamodb-ride-repository");
const dynamodb_participation_repository_1 = require("../../infrastructure/dynamodb-participation-repository");
const dynamodb_membership_helper_1 = require("../../infrastructure/dynamodb-membership-helper");
const ride_service_1 = require("../../domain/ride/ride-service");
const participation_service_1 = require("../../domain/participation/participation-service");
const participation_1 = require("../../domain/participation/participation");
const ride_authorization_1 = require("../../domain/authorization/ride-authorization");
const ride_authorization_2 = require("../../../../shared/types/ride-authorization");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME;
const rideRepository = new dynamodb_ride_repository_1.DynamoDBRideRepository(dynamoClient, tableName);
const participationRepository = new dynamodb_participation_repository_1.DynamoDBParticipationRepository(dynamoClient, tableName);
const membershipHelper = new dynamodb_membership_helper_1.MembershipHelper(dynamoClient, tableName);
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
        // Populate club memberships for authorization
        const memberships = await membershipHelper.getUserMemberships(authContext.userId);
        authContext.clubMemberships = memberships;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3JlYXRlLXJpZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjcmVhdGUtcmlkZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw4REFBMEQ7QUFDMUQsd0VBQWtGO0FBQ2xGLHVFQUFzRTtBQUN0RSxvRUFBc0U7QUFDdEUsNEZBQXVGO0FBQ3ZGLDhHQUF5RztBQUN6RyxnR0FBbUY7QUFDbkYsaUVBQTZEO0FBQzdELDRGQUF3RjtBQUN4Riw0RUFBK0U7QUFDL0Usc0ZBQXlGO0FBQ3pGLG9GQUE2RTtBQUc3RSxNQUFNLFlBQVksR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDNUMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBb0IsQ0FBQztBQUNuRCxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUMzRSxNQUFNLHVCQUF1QixHQUFHLElBQUksbUVBQStCLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQzdGLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSw2Q0FBZ0IsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkUsTUFBTSxXQUFXLEdBQUcsSUFBSSwwQkFBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3BELE1BQU0sb0JBQW9CLEdBQUcsSUFBSSw0Q0FBb0IsQ0FBQyx1QkFBdUIsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUV4RixNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBMkIsRUFBa0MsRUFBRTtJQUMzRixPQUFPLENBQUMsR0FBRyxDQUFDLDZCQUE2QixDQUFDLENBQUMsQ0FBQyw0QkFBNEI7SUFDeEUsSUFBSTtRQUNGLG1CQUFtQjtRQUNuQixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUU1QyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1gsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLHFCQUFxQixFQUFFLENBQUMsQ0FBQztTQUM5RDtRQUVELDhDQUE4QztRQUM5QyxNQUFNLFdBQVcsR0FBRyxNQUFNLGdCQUFnQixDQUFDLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNsRixXQUFXLENBQUMsZUFBZSxHQUFHLFdBQVcsQ0FBQztRQUUxQyxrRUFBa0U7UUFDbEUsTUFBTSw2Q0FBd0IsQ0FBQyxxQkFBcUIsQ0FDbEQsbUNBQWMsQ0FBQyxxQkFBcUIsRUFDcEMsV0FBVyxFQUNYLE1BQU0sQ0FDUCxDQUFDO1FBRUYsNkJBQTZCO1FBQzdCLE1BQU0sT0FBTyxHQUFHLElBQUEsd0JBQVMsRUFBb0IsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pELElBQUEsNEJBQWUsRUFBQyxPQUFPLEVBQUU7WUFDdkIsT0FBTztZQUNQLGFBQWE7WUFDYixVQUFVO1lBQ1YsWUFBWTtZQUNaLGVBQWU7WUFDZixtQkFBbUI7WUFDbkIsY0FBYztTQUNmLENBQUMsQ0FBQztRQUVILHdDQUF3QztRQUN4QyxNQUFNLFVBQVUsR0FBRyw2Q0FBd0IsQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2hGLElBQUksT0FBTyxDQUFDLGtCQUFrQixJQUFJLENBQUMsVUFBVSxFQUFFO1lBQzdDLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRTtnQkFDekIsS0FBSyxFQUFFLHNEQUFzRDthQUM5RCxDQUFDLENBQUM7U0FDSjtRQUVELGNBQWM7UUFDZCxNQUFNLElBQUksR0FBRyxNQUFNLFdBQVcsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFL0UsZ0RBQWdEO1FBQ2hELE1BQU0sb0JBQW9CLEdBQUcsbUNBQW1CLENBQUMsYUFBYSxDQUM1RCxJQUFJLENBQUMsTUFBTSxFQUNYLE1BQU0sRUFDTixXQUFXLENBQUMsTUFBTSxDQUNuQixDQUFDO1FBQ0YsTUFBTSx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUUzRCxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUU7WUFDekIsT0FBTyxFQUFFLElBQUk7WUFDYixJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNuQixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDcEMsQ0FBQyxDQUFDO0tBRUo7SUFBQyxPQUFPLEtBQVUsRUFBRTtRQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRTNDLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtZQUNwQixPQUFPLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsVUFBVSxFQUFFO2dCQUN0QyxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU87Z0JBQ3BCLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUzthQUMzQixDQUFDLENBQUM7U0FDSjtRQUVELE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSx1QkFBdUIsRUFBRSxDQUFDLENBQUM7S0FDaEU7QUFDSCxDQUFDLENBQUM7QUF2RVcsUUFBQSxPQUFPLFdBdUVsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcbmltcG9ydCB7IGNyZWF0ZVJlc3BvbnNlLCBwYXJzZUpTT04gfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IGdldEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGgvYXV0aC1jb250ZXh0JztcbmltcG9ydCB7IHZhbGlkYXRlUmVxdWVzdCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy92YWxpZGF0aW9uJztcbmltcG9ydCB7IER5bmFtb0RCUmlkZVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1yaWRlLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJQYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLXBhcnRpY2lwYXRpb24tcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBNZW1iZXJzaGlwSGVscGVyIH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItbWVtYmVyc2hpcC1oZWxwZXInO1xuaW1wb3J0IHsgUmlkZVNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vcmlkZS9yaWRlLXNlcnZpY2UnO1xuaW1wb3J0IHsgUGFydGljaXBhdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vcGFydGljaXBhdGlvbi9wYXJ0aWNpcGF0aW9uLXNlcnZpY2UnO1xuaW1wb3J0IHsgUGFydGljaXBhdGlvbkVudGl0eSB9IGZyb20gJy4uLy4uL2RvbWFpbi9wYXJ0aWNpcGF0aW9uL3BhcnRpY2lwYXRpb24nO1xuaW1wb3J0IHsgUmlkZUF1dGhvcml6YXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2F1dGhvcml6YXRpb24vcmlkZS1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IFJpZGVDYXBhYmlsaXR5IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL3JpZGUtYXV0aG9yaXphdGlvbic7XG5pbXBvcnQgeyBDcmVhdGVSaWRlUmVxdWVzdCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9yaWRlJztcblxuY29uc3QgZHluYW1vQ2xpZW50ID0gbmV3IER5bmFtb0RCQ2xpZW50KHt9KTtcbmNvbnN0IHRhYmxlTmFtZSA9IHByb2Nlc3MuZW52LkRZTkFNT0RCX1RBQkxFX05BTUUhO1xuY29uc3QgcmlkZVJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJSaWRlUmVwb3NpdG9yeShkeW5hbW9DbGllbnQsIHRhYmxlTmFtZSk7XG5jb25zdCBwYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQlBhcnRpY2lwYXRpb25SZXBvc2l0b3J5KGR5bmFtb0NsaWVudCwgdGFibGVOYW1lKTtcbmNvbnN0IG1lbWJlcnNoaXBIZWxwZXIgPSBuZXcgTWVtYmVyc2hpcEhlbHBlcihkeW5hbW9DbGllbnQsIHRhYmxlTmFtZSk7XG5jb25zdCByaWRlU2VydmljZSA9IG5ldyBSaWRlU2VydmljZShyaWRlUmVwb3NpdG9yeSk7XG5jb25zdCBwYXJ0aWNpcGF0aW9uU2VydmljZSA9IG5ldyBQYXJ0aWNpcGF0aW9uU2VydmljZShwYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeSwgcmlkZVJlcG9zaXRvcnkpO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICBjb25zb2xlLmxvZygnQ3JlYXRlIHJpZGUgaGFuZGxlciBpbnZva2VkJyk7IC8vIEFkZGVkIGZvciByZWJ1aWxkIHRyaWdnZXJcbiAgdHJ5IHtcbiAgICAvLyBHZXQgYXV0aCBjb250ZXh0XG4gICAgY29uc3QgYXV0aENvbnRleHQgPSBhd2FpdCBnZXRBdXRoQ29udGV4dChldmVudCk7XG4gICAgY29uc3QgY2x1YklkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNsdWJJZDtcbiAgICBcbiAgICBpZiAoIWNsdWJJZCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDQwMCwgeyBlcnJvcjogJ0NsdWIgSUQgaXMgcmVxdWlyZWQnIH0pO1xuICAgIH1cblxuICAgIC8vIFBvcHVsYXRlIGNsdWIgbWVtYmVyc2hpcHMgZm9yIGF1dGhvcml6YXRpb25cbiAgICBjb25zdCBtZW1iZXJzaGlwcyA9IGF3YWl0IG1lbWJlcnNoaXBIZWxwZXIuZ2V0VXNlck1lbWJlcnNoaXBzKGF1dGhDb250ZXh0LnVzZXJJZCk7XG4gICAgYXV0aENvbnRleHQuY2x1Yk1lbWJlcnNoaXBzID0gbWVtYmVyc2hpcHM7XG5cbiAgICAvLyBDaGVjayBhdXRob3JpemF0aW9uIC0gYW55IGNsdWIgbWVtYmVyIGNhbiBjcmVhdGUgcmlkZSBwcm9wb3NhbHNcbiAgICBhd2FpdCBSaWRlQXV0aG9yaXphdGlvblNlcnZpY2UucmVxdWlyZVJpZGVDYXBhYmlsaXR5KFxuICAgICAgUmlkZUNhcGFiaWxpdHkuQ1JFQVRFX1JJREVfUFJPUE9TQUxTLFxuICAgICAgYXV0aENvbnRleHQsXG4gICAgICBjbHViSWRcbiAgICApO1xuXG4gICAgLy8gUGFyc2UgYW5kIHZhbGlkYXRlIHJlcXVlc3RcbiAgICBjb25zdCByZXF1ZXN0ID0gcGFyc2VKU09OPENyZWF0ZVJpZGVSZXF1ZXN0PihldmVudC5ib2R5KTtcbiAgICB2YWxpZGF0ZVJlcXVlc3QocmVxdWVzdCwgW1xuICAgICAgJ3RpdGxlJyxcbiAgICAgICdkZXNjcmlwdGlvbicsIFxuICAgICAgJ3JpZGVUeXBlJyxcbiAgICAgICdkaWZmaWN1bHR5JyxcbiAgICAgICdzdGFydERhdGVUaW1lJyxcbiAgICAgICdlc3RpbWF0ZWREdXJhdGlvbicsXG4gICAgICAnbWVldGluZ1BvaW50J1xuICAgIF0pO1xuXG4gICAgLy8gQ2hlY2sgaWYgdXNlciBjYW4gcHVibGlzaCBpbW1lZGlhdGVseVxuICAgIGNvbnN0IGNhblB1Ymxpc2ggPSBSaWRlQXV0aG9yaXphdGlvblNlcnZpY2UuY2FuUHVibGlzaFJpZGUoYXV0aENvbnRleHQsIGNsdWJJZCk7XG4gICAgaWYgKHJlcXVlc3QucHVibGlzaEltbWVkaWF0ZWx5ICYmICFjYW5QdWJsaXNoKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNDAzLCB7IFxuICAgICAgICBlcnJvcjogJ0luc3VmZmljaWVudCBwcml2aWxlZ2VzIHRvIHB1Ymxpc2ggcmlkZXMgaW1tZWRpYXRlbHknIFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIHJpZGVcbiAgICBjb25zdCByaWRlID0gYXdhaXQgcmlkZVNlcnZpY2UuY3JlYXRlUmlkZShyZXF1ZXN0LCBhdXRoQ29udGV4dC51c2VySWQsIGNsdWJJZCk7XG5cbiAgICAvLyBDcmVhdGUgY2FwdGFpbiBwYXJ0aWNpcGF0aW9uIGZvciByaWRlIGNyZWF0b3JcbiAgICBjb25zdCBjYXB0YWluUGFydGljaXBhdGlvbiA9IFBhcnRpY2lwYXRpb25FbnRpdHkuY3JlYXRlQ2FwdGFpbihcbiAgICAgIHJpZGUucmlkZUlkLFxuICAgICAgY2x1YklkLFxuICAgICAgYXV0aENvbnRleHQudXNlcklkXG4gICAgKTtcbiAgICBhd2FpdCBwYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeS5jcmVhdGUoY2FwdGFpblBhcnRpY2lwYXRpb24pO1xuXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDIwMSwge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHJpZGUudG9KU09OKCksXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgIH0pO1xuXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICBjb25zb2xlLmVycm9yKCdDcmVhdGUgcmlkZSBlcnJvcjonLCBlcnJvcik7XG4gICAgXG4gICAgaWYgKGVycm9yLnN0YXR1c0NvZGUpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZShlcnJvci5zdGF0dXNDb2RlLCB7IFxuICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgZXJyb3JUeXBlOiBlcnJvci5lcnJvclR5cGUgXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDUwMCwgeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSk7XG4gIH1cbn07Il19