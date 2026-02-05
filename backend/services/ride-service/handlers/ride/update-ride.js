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
    console.log('Update ride handler invoked');
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
        // Check authorization - must be ride creator or have MANAGE_RIDES capability
        try {
            await ride_authorization_1.RideAuthorizationService.requireRideCapability(ride_authorization_2.RideCapability.MANAGE_RIDES, authContext, clubId, rideId, ride.toJSON().createdBy);
        }
        catch (error) {
            return (0, lambda_utils_1.createResponse)(403, {
                error: 'Insufficient privileges to edit this ride'
            });
        }
        // Parse request
        const request = (0, lambda_utils_1.parseJSON)(event.body);
        // Update ride
        const updatedRide = await rideService.updateRide(rideId, request);
        return (0, lambda_utils_1.createResponse)(200, {
            success: true,
            data: updatedRide.toJSON(),
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Update ride error:', error);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXBkYXRlLXJpZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ1cGRhdGUtcmlkZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw4REFBMEQ7QUFDMUQsd0VBQWtGO0FBQ2xGLHVFQUFzRTtBQUN0RSw0RkFBdUY7QUFDdkYsZ0dBQW1GO0FBQ25GLGlFQUE2RDtBQUM3RCxzRkFBeUY7QUFDekYsb0ZBQTZFO0FBRzdFLE1BQU0sWUFBWSxHQUFHLElBQUksZ0NBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM1QyxNQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFvQixDQUFDO0FBQ25ELE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQzNFLE1BQU0sZ0JBQWdCLEdBQUcsSUFBSSw2Q0FBZ0IsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDdkUsTUFBTSxXQUFXLEdBQUcsSUFBSSwwQkFBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRTdDLE1BQU0sT0FBTyxHQUFHLEtBQUssRUFBRSxLQUEyQixFQUFrQyxFQUFFO0lBQzNGLE9BQU8sQ0FBQyxHQUFHLENBQUMsNkJBQTZCLENBQUMsQ0FBQztJQUMzQyxJQUFJO1FBQ0YsbUJBQW1CO1FBQ25CLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBQzVDLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBRTVDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDWCxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO1NBQzlEO1FBRUQsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSxxQkFBcUIsRUFBRSxDQUFDLENBQUM7U0FDOUQ7UUFFRCw4Q0FBOEM7UUFDOUMsTUFBTSxXQUFXLEdBQUcsTUFBTSxnQkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDbEYsV0FBVyxDQUFDLGVBQWUsR0FBRyxXQUFXLENBQUM7UUFFMUMsb0JBQW9CO1FBQ3BCLE1BQU0sSUFBSSxHQUFHLE1BQU0sV0FBVyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUvQyw2RUFBNkU7UUFDN0UsSUFBSTtZQUNGLE1BQU0sNkNBQXdCLENBQUMscUJBQXFCLENBQ2xELG1DQUFjLENBQUMsWUFBWSxFQUMzQixXQUFXLEVBQ1gsTUFBTSxFQUNOLE1BQU0sRUFDTixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsU0FBUyxDQUN4QixDQUFDO1NBQ0g7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNkLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRTtnQkFDekIsS0FBSyxFQUFFLDJDQUEyQzthQUNuRCxDQUFDLENBQUM7U0FDSjtRQUVELGdCQUFnQjtRQUNoQixNQUFNLE9BQU8sR0FBRyxJQUFBLHdCQUFTLEVBQW9CLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV6RCxjQUFjO1FBQ2QsTUFBTSxXQUFXLEdBQUcsTUFBTSxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQztRQUVsRSxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUU7WUFDekIsT0FBTyxFQUFFLElBQUk7WUFDYixJQUFJLEVBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRTtZQUMxQixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDcEMsQ0FBQyxDQUFDO0tBRUo7SUFBQyxPQUFPLEtBQVUsRUFBRTtRQUNuQixPQUFPLENBQUMsS0FBSyxDQUFDLG9CQUFvQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRTNDLElBQUksS0FBSyxDQUFDLFVBQVUsRUFBRTtZQUNwQixPQUFPLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsVUFBVSxFQUFFO2dCQUN0QyxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU87Z0JBQ3BCLFNBQVMsRUFBRSxLQUFLLENBQUMsU0FBUzthQUMzQixDQUFDLENBQUM7U0FDSjtRQUVELE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSx1QkFBdUIsRUFBRSxDQUFDLENBQUM7S0FDaEU7QUFDSCxDQUFDLENBQUM7QUE5RFcsUUFBQSxPQUFPLFdBOERsQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IER5bmFtb0RCQ2xpZW50IH0gZnJvbSAnQGF3cy1zZGsvY2xpZW50LWR5bmFtb2RiJztcbmltcG9ydCB7IGNyZWF0ZVJlc3BvbnNlLCBwYXJzZUpTT04gfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IGdldEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGgvYXV0aC1jb250ZXh0JztcbmltcG9ydCB7IER5bmFtb0RCUmlkZVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1yaWRlLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgTWVtYmVyc2hpcEhlbHBlciB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLW1lbWJlcnNoaXAtaGVscGVyJztcbmltcG9ydCB7IFJpZGVTZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL3JpZGUvcmlkZS1zZXJ2aWNlJztcbmltcG9ydCB7IFJpZGVBdXRob3JpemF0aW9uU2VydmljZSB9IGZyb20gJy4uLy4uL2RvbWFpbi9hdXRob3JpemF0aW9uL3JpZGUtYXV0aG9yaXphdGlvbic7XG5pbXBvcnQgeyBSaWRlQ2FwYWJpbGl0eSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9yaWRlLWF1dGhvcml6YXRpb24nO1xuaW1wb3J0IHsgVXBkYXRlUmlkZVJlcXVlc3QgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvcmlkZSc7XG5cbmNvbnN0IGR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG5jb25zdCB0YWJsZU5hbWUgPSBwcm9jZXNzLmVudi5EWU5BTU9EQl9UQUJMRV9OQU1FITtcbmNvbnN0IHJpZGVSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCUmlkZVJlcG9zaXRvcnkoZHluYW1vQ2xpZW50LCB0YWJsZU5hbWUpO1xuY29uc3QgbWVtYmVyc2hpcEhlbHBlciA9IG5ldyBNZW1iZXJzaGlwSGVscGVyKGR5bmFtb0NsaWVudCwgdGFibGVOYW1lKTtcbmNvbnN0IHJpZGVTZXJ2aWNlID0gbmV3IFJpZGVTZXJ2aWNlKHJpZGVSZXBvc2l0b3J5KTtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+ID0+IHtcbiAgY29uc29sZS5sb2coJ1VwZGF0ZSByaWRlIGhhbmRsZXIgaW52b2tlZCcpO1xuICB0cnkge1xuICAgIC8vIEdldCBhdXRoIGNvbnRleHRcbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IGF3YWl0IGdldEF1dGhDb250ZXh0KGV2ZW50KTtcbiAgICBjb25zdCBjbHViSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8uY2x1YklkO1xuICAgIGNvbnN0IHJpZGVJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5yaWRlSWQ7XG4gICAgXG4gICAgaWYgKCFjbHViSWQpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg0MDAsIHsgZXJyb3I6ICdDbHViIElEIGlzIHJlcXVpcmVkJyB9KTtcbiAgICB9XG4gICAgXG4gICAgaWYgKCFyaWRlSWQpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg0MDAsIHsgZXJyb3I6ICdSaWRlIElEIGlzIHJlcXVpcmVkJyB9KTtcbiAgICB9XG5cbiAgICAvLyBQb3B1bGF0ZSBjbHViIG1lbWJlcnNoaXBzIGZvciBhdXRob3JpemF0aW9uXG4gICAgY29uc3QgbWVtYmVyc2hpcHMgPSBhd2FpdCBtZW1iZXJzaGlwSGVscGVyLmdldFVzZXJNZW1iZXJzaGlwcyhhdXRoQ29udGV4dC51c2VySWQpO1xuICAgIGF1dGhDb250ZXh0LmNsdWJNZW1iZXJzaGlwcyA9IG1lbWJlcnNoaXBzO1xuXG4gICAgLy8gR2V0IGV4aXN0aW5nIHJpZGVcbiAgICBjb25zdCByaWRlID0gYXdhaXQgcmlkZVNlcnZpY2UuZ2V0UmlkZShyaWRlSWQpO1xuICAgIFxuICAgIC8vIENoZWNrIGF1dGhvcml6YXRpb24gLSBtdXN0IGJlIHJpZGUgY3JlYXRvciBvciBoYXZlIE1BTkFHRV9SSURFUyBjYXBhYmlsaXR5XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IFJpZGVBdXRob3JpemF0aW9uU2VydmljZS5yZXF1aXJlUmlkZUNhcGFiaWxpdHkoXG4gICAgICAgIFJpZGVDYXBhYmlsaXR5Lk1BTkFHRV9SSURFUyxcbiAgICAgICAgYXV0aENvbnRleHQsXG4gICAgICAgIGNsdWJJZCxcbiAgICAgICAgcmlkZUlkLFxuICAgICAgICByaWRlLnRvSlNPTigpLmNyZWF0ZWRCeVxuICAgICAgKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDQwMywgeyBcbiAgICAgICAgZXJyb3I6ICdJbnN1ZmZpY2llbnQgcHJpdmlsZWdlcyB0byBlZGl0IHRoaXMgcmlkZScgXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBQYXJzZSByZXF1ZXN0XG4gICAgY29uc3QgcmVxdWVzdCA9IHBhcnNlSlNPTjxVcGRhdGVSaWRlUmVxdWVzdD4oZXZlbnQuYm9keSk7XG5cbiAgICAvLyBVcGRhdGUgcmlkZVxuICAgIGNvbnN0IHVwZGF0ZWRSaWRlID0gYXdhaXQgcmlkZVNlcnZpY2UudXBkYXRlUmlkZShyaWRlSWQsIHJlcXVlc3QpO1xuXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDIwMCwge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHVwZGF0ZWRSaWRlLnRvSlNPTigpLFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKClcbiAgICB9KTtcblxuICB9IGNhdGNoIChlcnJvcjogYW55KSB7XG4gICAgY29uc29sZS5lcnJvcignVXBkYXRlIHJpZGUgZXJyb3I6JywgZXJyb3IpO1xuICAgIFxuICAgIGlmIChlcnJvci5zdGF0dXNDb2RlKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoZXJyb3Iuc3RhdHVzQ29kZSwgeyBcbiAgICAgICAgZXJyb3I6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgIGVycm9yVHlwZTogZXJyb3IuZXJyb3JUeXBlIFxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg1MDAsIHsgZXJyb3I6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0pO1xuICB9XG59O1xuIl19