"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const dynamodb_ride_repository_1 = require("../../infrastructure/dynamodb-ride-repository");
const dynamodb_membership_helper_1 = require("../../infrastructure/dynamodb-membership-helper");
const ride_service_1 = require("../../domain/ride/ride-service");
const ride_authorization_1 = require("../../domain/authorization/ride-authorization");
const ride_authorization_2 = require("../../../../shared/types/ride-authorization");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME;
const rideRepository = new dynamodb_ride_repository_1.DynamoDBRideRepository(dynamoClient, tableName);
const membershipHelper = new dynamodb_membership_helper_1.MembershipHelper(dynamoClient, tableName);
const rideService = new ride_service_1.RideService(rideRepository);
const handler = async (event) => {
    console.log('Cancel ride handler invoked');
    try {
        // Get auth context
        const authContext = await (0, auth_context_1.getAuthContext)(event);
        const clubId = event.pathParameters?.clubId;
        const rideId = event.pathParameters?.rideId;
        if (!clubId) {
            return (0, lambda_utils_1.createResponse)(400, { error: 'Club ID is required' });
        }
        if (!rideId) {
            return (0, lambda_utils_1.createResponse)(400, { error: 'Ride ID is required' });
        }
        // Populate club memberships for authorization
        const memberships = await membershipHelper.getUserMemberships(authContext.userId);
        authContext.clubMemberships = memberships;
        // Get existing ride
        const ride = await rideService.getRide(rideId);
        // Check authorization - must be ride creator or have CANCEL_RIDES capability
        try {
            await ride_authorization_1.RideAuthorizationService.requireRideCapability(ride_authorization_2.RideCapability.CANCEL_RIDES, authContext, clubId, rideId, ride.toJSON().createdBy);
        }
        catch (error) {
            return (0, lambda_utils_1.createResponse)(403, {
                error: 'Insufficient privileges to cancel this ride'
            });
        }
        // Parse request (reason is optional)
        const request = (0, lambda_utils_1.parseJSON)(event.body || '{}');
        // Cancel ride
        const cancelledRide = await rideService.cancelRide(rideId, request);
        return (0, lambda_utils_1.createResponse)(200, {
            success: true,
            data: cancelledRide.toJSON(),
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Cancel ride error:', error);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FuY2VsLXJpZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjYW5jZWwtcmlkZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw4REFBMEQ7QUFDMUQsd0VBQWtGO0FBQ2xGLHVFQUFzRTtBQUN0RSw0RkFBdUY7QUFDdkYsZ0dBQW1GO0FBQ25GLGlFQUE2RDtBQUM3RCxzRkFBeUY7QUFDekYsb0ZBQTZFO0FBRzdFLE1BQU0sWUFBWSxHQUFHLElBQUksZ0NBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM1QyxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFvQixDQUFDO0FBQ25ELE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQzNFLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSw2Q0FBZ0IsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkUsTUFBTSxXQUFXLEdBQUcsSUFBSSwwQkFBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRTdDLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUEyQixFQUFrQyxFQUFFO0lBQzNGLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQUMzQyxJQUFJO1FBQ0YsbUJBQW1CO1FBQ25CLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBQzVDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBRTVDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO1NBQzlEO1FBRUQsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSxxQkFBcUIsRUFBRSxDQUFDLENBQUM7U0FDOUQ7UUFFRCw4Q0FBOEM7UUFDOUMsTUFBTSxXQUFXLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEYsV0FBVyxDQUFDLGVBQWUsR0FBRyxXQUFXLENBQUM7UUFFMUMsb0JBQW9CO1FBQ3BCLE1BQU0sSUFBSSxHQUFHLE1BQU0sV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUvQyw2RUFBNkU7UUFDN0UsSUFBSTtZQUNGLE1BQU0sNkNBQXdCLENBQUMscUJBQXFCLENBQ2xELG1DQUFjLENBQUMsWUFBWSxFQUMzQixXQUFXLEVBQ1gsTUFBTSxFQUNOLE1BQU0sRUFDTixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsU0FBUyxDQUN4QixDQUFDO1NBQ0g7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNkLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRTtnQkFDekIsS0FBSyxFQUFFLDZDQUE2QzthQUNyRCxDQUFDLENBQUM7U0FDSjtRQUVELHFDQUFxQztRQUNyQyxNQUFNLE9BQU8sR0FBRyxJQUFBLHdCQUFTLEVBQW9CLEtBQUssQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLENBQUM7UUFFakUsY0FBYztRQUNkLE1BQU0sYUFBYSxHQUFHLE1BQU0sV0FBVyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFcEUsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFO1lBQ3pCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsSUFBSSxFQUFFLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDNUIsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3BDLENBQUMsQ0FBQztLQUVKO0lBQUMsT0FBTyxLQUFVLEVBQUU7UUFDbkIsT0FBTyxDQUFDLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUUzQyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUU7WUFDcEIsT0FBTyxJQUFBLDZCQUFjLEVBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRTtnQkFDdEMsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO2dCQUNwQixTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7YUFDM0IsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDO0tBQ2hFO0FBQ0gsQ0FBQyxDQUFDO0FBOURXLFFBQUEsT0FBTyxXQThEbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XG5pbXBvcnQgeyBjcmVhdGVSZXNwb25zZSwgcGFyc2VKU09OIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBnZXRBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRoL2F1dGgtY29udGV4dCc7XG5pbXBvcnQgeyBEeW5hbW9EQlJpZGVSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItcmlkZS1yZXBvc2l0b3J5JztcbmltcG9ydCB7IE1lbWJlcnNoaXBIZWxwZXIgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1tZW1iZXJzaGlwLWhlbHBlcic7XG5pbXBvcnQgeyBSaWRlU2VydmljZSB9IGZyb20gJy4uLy4uL2RvbWFpbi9yaWRlL3JpZGUtc2VydmljZSc7XG5pbXBvcnQgeyBSaWRlQXV0aG9yaXphdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vYXV0aG9yaXphdGlvbi9yaWRlLWF1dGhvcml6YXRpb24nO1xuaW1wb3J0IHsgUmlkZUNhcGFiaWxpdHkgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvcmlkZS1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IENhbmNlbFJpZGVSZXF1ZXN0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL3JpZGUnO1xuXG5jb25zdCBkeW5hbW9DbGllbnQgPSBuZXcgRHluYW1vREJDbGllbnQoe30pO1xuY29uc3QgdGFibGVOYW1lID0gcHJvY2Vzcy5lbnYuRFlOQU1PREJfVEFCTEVfTkFNRSE7XG5jb25zdCByaWRlUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQlJpZGVSZXBvc2l0b3J5KGR5bmFtb0NsaWVudCwgdGFibGVOYW1lKTtcbmNvbnN0IG1lbWJlcnNoaXBIZWxwZXIgPSBuZXcgTWVtYmVyc2hpcEhlbHBlcihkeW5hbW9DbGllbnQsIHRhYmxlTmFtZSk7XG5jb25zdCByaWRlU2VydmljZSA9IG5ldyBSaWRlU2VydmljZShyaWRlUmVwb3NpdG9yeSk7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCk6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiA9PiB7XG4gIGNvbnNvbGUubG9nKCdDYW5jZWwgcmlkZSBoYW5kbGVyIGludm9rZWQnKTtcbiAgdHJ5IHtcbiAgICAvLyBHZXQgYXV0aCBjb250ZXh0XG4gICAgY29uc3QgYXV0aENvbnRleHQgPSBhd2FpdCBnZXRBdXRoQ29udGV4dChldmVudCk7XG4gICAgY29uc3QgY2x1YklkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNsdWJJZDtcbiAgICBjb25zdCByaWRlSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8ucmlkZUlkO1xuICAgIFxuICAgIGlmICghY2x1YklkKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNDAwLCB7IGVycm9yOiAnQ2x1YiBJRCBpcyByZXF1aXJlZCcgfSk7XG4gICAgfVxuICAgIFxuICAgIGlmICghcmlkZUlkKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNDAwLCB7IGVycm9yOiAnUmlkZSBJRCBpcyByZXF1aXJlZCcgfSk7XG4gICAgfVxuXG4gICAgLy8gUG9wdWxhdGUgY2x1YiBtZW1iZXJzaGlwcyBmb3IgYXV0aG9yaXphdGlvblxuICAgIGNvbnN0IG1lbWJlcnNoaXBzID0gYXdhaXQgbWVtYmVyc2hpcEhlbHBlci5nZXRVc2VyTWVtYmVyc2hpcHMoYXV0aENvbnRleHQudXNlcklkKTtcbiAgICBhdXRoQ29udGV4dC5jbHViTWVtYmVyc2hpcHMgPSBtZW1iZXJzaGlwcztcblxuICAgIC8vIEdldCBleGlzdGluZyByaWRlXG4gICAgY29uc3QgcmlkZSA9IGF3YWl0IHJpZGVTZXJ2aWNlLmdldFJpZGUocmlkZUlkKTtcbiAgICBcbiAgICAvLyBDaGVjayBhdXRob3JpemF0aW9uIC0gbXVzdCBiZSByaWRlIGNyZWF0b3Igb3IgaGF2ZSBDQU5DRUxfUklERVMgY2FwYWJpbGl0eVxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBSaWRlQXV0aG9yaXphdGlvblNlcnZpY2UucmVxdWlyZVJpZGVDYXBhYmlsaXR5KFxuICAgICAgICBSaWRlQ2FwYWJpbGl0eS5DQU5DRUxfUklERVMsXG4gICAgICAgIGF1dGhDb250ZXh0LFxuICAgICAgICBjbHViSWQsXG4gICAgICAgIHJpZGVJZCxcbiAgICAgICAgcmlkZS50b0pTT04oKS5jcmVhdGVkQnlcbiAgICAgICk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg0MDMsIHsgXG4gICAgICAgIGVycm9yOiAnSW5zdWZmaWNpZW50IHByaXZpbGVnZXMgdG8gY2FuY2VsIHRoaXMgcmlkZScgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBQYXJzZSByZXF1ZXN0IChyZWFzb24gaXMgb3B0aW9uYWwpXG4gICAgY29uc3QgcmVxdWVzdCA9IHBhcnNlSlNPTjxDYW5jZWxSaWRlUmVxdWVzdD4oZXZlbnQuYm9keSB8fCAne30nKTtcblxuICAgIC8vIENhbmNlbCByaWRlXG4gICAgY29uc3QgY2FuY2VsbGVkUmlkZSA9IGF3YWl0IHJpZGVTZXJ2aWNlLmNhbmNlbFJpZGUocmlkZUlkLCByZXF1ZXN0KTtcblxuICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSgyMDAsIHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiBjYW5jZWxsZWRSaWRlLnRvSlNPTigpLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICB9KTtcblxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgY29uc29sZS5lcnJvcignQ2FuY2VsIHJpZGUgZXJyb3I6JywgZXJyb3IpO1xuICAgIFxuICAgIGlmIChlcnJvci5zdGF0dXNDb2RlKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoZXJyb3Iuc3RhdHVzQ29kZSwgeyBcbiAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgIGVycm9yVHlwZTogZXJyb3IuZXJyb3JUeXBlIFxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg1MDAsIHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0pO1xuICB9XG59O1xuIl19