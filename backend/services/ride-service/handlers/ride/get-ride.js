"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const dynamodb_ride_repository_1 = require("../../infrastructure/dynamodb-ride-repository");
const dynamodb_participation_repository_1 = require("../../infrastructure/dynamodb-participation-repository");
const dynamodb_membership_helper_1 = require("../../infrastructure/dynamodb-membership-helper");
const ride_service_1 = require("../../domain/ride/ride-service");
const participation_service_1 = require("../../domain/participation/participation-service");
const ride_authorization_1 = require("../../domain/authorization/ride-authorization");
const participation_1 = require("../../../../shared/types/participation");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME;
const rideRepository = new dynamodb_ride_repository_1.DynamoDBRideRepository(dynamoClient, tableName);
const participationRepository = new dynamodb_participation_repository_1.DynamoDBParticipationRepository(dynamoClient, tableName);
const membershipHelper = new dynamodb_membership_helper_1.MembershipHelper(dynamoClient, tableName);
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
        // Populate club memberships for authorization
        const memberships = await membershipHelper.getUserMemberships(authContext.userId);
        authContext.clubMemberships = memberships;
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
        // Find viewer's participation (if any) - only if they're actively participating
        const viewerParticipationEntity = participants.find(p => p.userId === authContext.userId &&
            (p.status === participation_1.ParticipationStatus.CONFIRMED || p.status === participation_1.ParticipationStatus.WAITLISTED));
        const viewerParticipationData = viewerParticipationEntity?.toJSON();
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
                waitlist: waitlistData,
                // Viewer-specific participation context (Phase 3.3)
                viewerParticipation: viewerParticipationData ? {
                    participationId: viewerParticipationData.participationId,
                    role: viewerParticipationData.role,
                    status: viewerParticipationData.status,
                    joinedAt: viewerParticipationData.joinedAt
                } : undefined
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LXJpZGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnZXQtcmlkZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw4REFBMEQ7QUFDMUQsd0VBQXVFO0FBQ3ZFLHVFQUFzRTtBQUN0RSw0RkFBdUY7QUFDdkYsOEdBQXlHO0FBQ3pHLGdHQUFtRjtBQUNuRixpRUFBNkQ7QUFDN0QsNEZBQXdGO0FBQ3hGLHNGQUF5RjtBQUN6RiwwRUFBNkU7QUFFN0UsTUFBTSxZQUFZLEdBQUcsSUFBSSxnQ0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzVDLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW9CLENBQUM7QUFDbkQsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDM0UsTUFBTSx1QkFBdUIsR0FBRyxJQUFJLG1FQUErQixDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUM3RixNQUFNLGdCQUFnQixHQUFHLElBQUksNkNBQWdCLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ3ZFLE1BQU0sV0FBVyxHQUFHLElBQUksMEJBQVcsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNwRCxNQUFNLG9CQUFvQixHQUFHLElBQUksNENBQW9CLENBQUMsdUJBQXVCLEVBQUUsY0FBYyxDQUFDLENBQUM7QUFFeEYsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQTJCLEVBQWtDLEVBQUU7SUFDM0YsSUFBSTtRQUNGLG1CQUFtQjtRQUNuQixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUNoRCxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUM1QyxNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUU1QyxJQUFJLENBQUMsTUFBTSxJ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QUFDO1FBQ0osQ0FBQyxDQUFDLENBQUM7UUFFTCxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUU7WUFDekIsT0FBTyxFQUFFLElBQUk7WUFDYixJQUFJLEVBQUU7Z0JBQ0osR0FBRyxRQUFRO2dCQUNYLFlBQVksRUFBRSxnQkFBZ0I7Z0JBQzlCLFFBQVEsRUFBRSxZQUFZO2dCQUN0QixvREFBb0Q7Z0JBQ3BELG1CQUFtQixFQUFFLHVCQUF1QixDQUFDLENBQUMsQ0FBQztvQkFDN0MsZUFBZSxFQUFFLHVCQUF1QixDQUFDLGVBQWU7b0JBQ3hELElBQUksRUFBRSx1QkFBdUIsQ0FBQyxJQUFJO29CQUNsQyxNQUFNLEVBQUUsdUJBQXVCLENBQUMsTUFBTTtvQkFDdEMsUUFBUSxFQUFFLHVCQUF1QixDQUFDLFFBQVE7aUJBQzNDLENBQUMsQ0FBQyxDQUFDLFNBQVM7YUFDZDtZQUNELFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtTQUNwQyxDQUFDLENBQUM7S0FFSjtJQUFDLE9BQU8sS0FBVSxFQUFFO1FBQ25CLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEMsSUFBSSxLQUFLLENBQUMsVUFBVSxFQUFFO1lBQ3BCLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUU7Z0JBQ3RDLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTztnQkFDcEIsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO2FBQzNCLENBQUMsQ0FBQztTQUNKO1FBRUQsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxFQUFFLHVCQUF1QixFQUFFLENBQUMsQ0FBQztLQUNoRTtBQUNILENBQUMsQ0FBQztBQXBHVyxRQUFBLE9BQU8sV0FvR2xCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgRHluYW1vREJDbGllbnQgfSBmcm9tICdAYXdzLXNkay9jbGllbnQtZHluYW1vZGInO1xuaW1wb3J0IHsgY3JlYXRlUmVzcG9uc2UgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IGdldEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGgvYXV0aC1jb250ZXh0JztcbmltcG9ydCB7IER5bmFtb0RCUmlkZVJlcG9zaXRvcnkgfSBmcm9tICcuLi8uLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1yaWRlLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJQYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLXBhcnRpY2lwYXRpb24tcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBNZW1iZXJzaGlwSGVscGVyIH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItbWVtYmVyc2hpcC1oZWxwZXInO1xuaW1wb3J0IHsgUmlkZVNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vcmlkZS9yaWRlLXNlcnZpY2UnO1xuaW1wb3J0IHsgUGFydGljaXBhdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi9kb21haW4vcGFydGljaXBhdGlvbi9wYXJ0aWNpcGF0aW9uLXNlcnZpY2UnO1xuaW1wb3J0IHsgUmlkZUF1dGhvcml6YXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL2F1dGhvcml6YXRpb24vcmlkZS1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IFBhcnRpY2lwYXRpb25TdGF0dXMgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvcGFydGljaXBhdGlvbic7XG5cbmNvbnN0IGR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG5jb25zdCB0YWJsZU5hbWUgPSBwcm9jZXNzLmVudi5EWU5BTU9EQl9UQUJMRV9OQU1FITtcbmNvbnN0IHJpZGVSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCUmlkZVJlcG9zaXRvcnkoZHluYW1vQ2xpZW50LCB0YWJsZU5hbWUpO1xuY29uc3QgcGFydGljaXBhdGlvblJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJQYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeShkeW5hbW9DbGllbnQsIHRhYmxlTmFtZSk7XG5jb25zdCBtZW1iZXJzaGlwSGVscGVyID0gbmV3IE1lbWJlcnNoaXBIZWxwZXIoZHluYW1vQ2xpZW50LCB0YWJsZU5hbWUpO1xuY29uc3QgcmlkZVNlcnZpY2UgPSBuZXcgUmlkZVNlcnZpY2UocmlkZVJlcG9zaXRvcnkpO1xuY29uc3QgcGFydGljaXBhdGlvblNlcnZpY2UgPSBuZXcgUGFydGljaXBhdGlvblNlcnZpY2UocGFydGljaXBhdGlvblJlcG9zaXRvcnksIHJpZGVSZXBvc2l0b3J5KTtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+ID0+IHtcbiAgdHJ5IHtcbiAgICAvLyBHZXQgYXV0aCBjb250ZXh0XG4gICAgY29uc3QgYXV0aENvbnRleHQgPSBhd2FpdCBnZXRBdXRoQ29udGV4dChldmVudCk7XG4gICAgY29uc3QgY2x1YklkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNsdWJJZDtcbiAgICBjb25zdCByaWRlSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8ucmlkZUlkO1xuICAgIFxuICAgIGlmICghY2x1YklkIHx8ICFyaWRlSWQpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg0MDAsIHsgZXJyb3I6ICdDbHViIElEIGFuZCBSaWRlIElEIGFyZSByZXF1aXJlZCcgfSk7XG4gICAgfVxuXG4gICAgLy8gUG9wdWxhdGUgY2x1YiBtZW1iZXJzaGlwcyBmb3IgYXV0aG9yaXphdGlvblxuICAgIGNvbnN0IG1lbWJlcnNoaXBzID0gYXdhaXQgbWVtYmVyc2hpcEhlbHBlci5nZXRVc2VyTWVtYmVyc2hpcHMoYXV0aENvbnRleHQudXNlcklkKTtcbiAgICBhdXRoQ29udGV4dC5jbHViTWVtYmVyc2hpcHMgPSBtZW1iZXJzaGlwcztcblxuICAgIC8vIEdldCByaWRlXG4gICAgY29uc3QgcmlkZSA9IGF3YWl0IHJpZGVTZXJ2aWNlLmdldFJpZGUocmlkZUlkKTtcbiAgICBjb25zdCByaWRlRGF0YSA9IHJpZGUudG9KU09OKCk7XG5cbiAgICAvLyBDaGVjayBpZiB1c2VyIGNhbiB2aWV3IHRoaXMgcmlkZVxuICAgIGNvbnN0IGNhblZpZXcgPSBSaWRlQXV0aG9yaXphdGlvblNlcnZpY2UuY2FuVmlld1JpZGUoXG4gICAgICBhdXRoQ29udGV4dCxcbiAgICAgIGNsdWJJZCxcbiAgICAgIHJpZGVEYXRhLnN0YXR1cyxcbiAgICAgIHJpZGVEYXRhLnNjb3BlLFxuICAgICAgcmlkZURhdGEuY3JlYXRlZEJ5LFxuICAgICAgcmlkZURhdGEuaXNQdWJsaWNcbiAgICApO1xuXG4gICAgaWYgKCFjYW5WaWV3KSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNDAzLCB7IGVycm9yOiAnSW5zdWZmaWNpZW50IHByaXZpbGVnZXMgdG8gdmlldyB0aGlzIHJpZGUnIH0pO1xuICAgIH1cblxuICAgIC8vIEdldCBwYXJ0aWNpcGFudHNcbiAgICBjb25zdCBwYXJ0aWNpcGFudHMgPSBhd2FpdCBwYXJ0aWNpcGF0aW9uU2VydmljZS5nZXRSaWRlUGFydGljaXBhbnRzKHJpZGVJZCk7XG4gICAgXG4gICAgLy8gRmluZCB2aWV3ZXIncyBwYXJ0aWNpcGF0aW9uIChpZiBhbnkpIC0gb25seSBpZiB0aGV5J3JlIGFjdGl2ZWx5IHBhcnRpY2lwYXRpbmdcbiAgICBjb25zdCB2aWV3ZXJQYXJ0aWNpcGF0aW9uRW50aXR5ID0gcGFydGljaXBhbnRzLmZpbmQoXG4gICAgICBwID0+IHAudXNlcklkID09PSBhdXRoQ29udGV4dC51c2VySWQgJiYgXG4gICAgICAocC5zdGF0dXMgPT09IFBhcnRpY2lwYXRpb25TdGF0dXMuQ09ORklSTUVEIHx8IHAuc3RhdHVzID09PSBQYXJ0aWNpcGF0aW9uU3RhdHVzLldBSVRMSVNURUQpXG4gICAgKTtcbiAgICBjb25zdCB2aWV3ZXJQYXJ0aWNpcGF0aW9uRGF0YSA9IHZpZXdlclBhcnRpY2lwYXRpb25FbnRpdHk/LnRvSlNPTigpO1xuICAgIFxuICAgIC8vIFRyYW5zZm9ybSBwYXJ0aWNpcGFudHMgZGF0YVxuICAgIGNvbnN0IHBhcnRpY2lwYW50c0RhdGEgPSBwYXJ0aWNpcGFudHNcbiAgICAgIC5maWx0ZXIocCA9PiBwLnN0YXR1cyA9PT0gUGFydGljaXBhdGlvblN0YXR1cy5DT05GSVJNRUQpXG4gICAgICAubWFwKHAgPT4ge1xuICAgICAgICBjb25zdCBwRGF0YSA9IHAudG9KU09OKCk7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdXNlcklkOiBwRGF0YS51c2VySWQsXG4gICAgICAgICAgZGlzcGxheU5hbWU6ICdVbmtub3duJywgLy8gVE9ETzogRW5yaWNoIHdpdGggdXNlciBuYW1lXG4gICAgICAgICAgcm9sZTogcERhdGEucm9sZSxcbiAgICAgICAgICBzdGF0dXM6IHBEYXRhLnN0YXR1cyxcbiAgICAgICAgICBqb2luZWRBdDogcERhdGEuam9pbmVkQXRcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgLy8gR2V0IHdhaXRsaXN0XG4gICAgY29uc3Qgd2FpdGxpc3REYXRhID0gcGFydGljaXBhbnRzXG4gICAgICAuZmlsdGVyKHAgPT4gcC5zdGF0dXMgPT09IFBhcnRpY2lwYXRpb25TdGF0dXMuV0FJVExJU1RFRClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiAoYS53YWl0bGlzdFBvc2l0aW9uIHx8IDApIC0gKGIud2FpdGxpc3RQb3NpdGlvbiB8fCAwKSlcbiAgICAgIC5tYXAocCA9PiB7XG4gICAgICAgIGNvbnN0IHBEYXRhID0gcC50b0pTT04oKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB1c2VySWQ6IHBEYXRhLnVzZXJJZCxcbiAgICAgICAgICBkaXNwbGF5TmFtZTogJ1Vua25vd24nLCAvLyBUT0RPOiBFbnJpY2ggd2l0aCB1c2VyIG5hbWVcbiAgICAgICAgICBqb2luZWRXYWl0bGlzdEF0OiBwRGF0YS5qb2luZWRBdCxcbiAgICAgICAgICBwb3NpdGlvbjogcERhdGEud2FpdGxpc3RQb3NpdGlvblxuICAgICAgICB9O1xuICAgICAgfSk7XG5cbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoMjAwLCB7XG4gICAgICBzdWNjZXNzOiB0cnVlLFxuICAgICAgZGF0YToge1xuICAgICAgICAuLi5yaWRlRGF0YSxcbiAgICAgICAgcGFydGljaXBhbnRzOiBwYXJ0aWNpcGFudHNEYXRhLFxuICAgICAgICB3YWl0bGlzdDogd2FpdGxpc3REYXRhLFxuICAgICAgICAvLyBWaWV3ZXItc3BlY2lmaWMgcGFydGljaXBhdGlvbiBjb250ZXh0IChQaGFzZSAzLjMpXG4gICAgICAgIHZpZXdlclBhcnRpY2lwYXRpb246IHZpZXdlclBhcnRpY2lwYXRpb25EYXRhID8ge1xuICAgICAgICAgIHBhcnRpY2lwYXRpb25JZDogdmlld2VyUGFydGljaXBhdGlvbkRhdGEucGFydGljaXBhdGlvbklkLFxuICAgICAgICAgIHJvbGU6IHZpZXdlclBhcnRpY2lwYXRpb25EYXRhLnJvbGUsXG4gICAgICAgICAgc3RhdHVzOiB2aWV3ZXJQYXJ0aWNpcGF0aW9uRGF0YS5zdGF0dXMsXG4gICAgICAgICAgam9pbmVkQXQ6IHZpZXdlclBhcnRpY2lwYXRpb25EYXRhLmpvaW5lZEF0XG4gICAgICAgIH0gOiB1bmRlZmluZWRcbiAgICAgIH0sXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgIH0pO1xuXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICBjb25zb2xlLmVycm9yKCdHZXQgcmlkZSBlcnJvcjonLCBlcnJvcik7XG4gICAgXG4gICAgaWYgKGVycm9yLnN0YXR1c0NvZGUpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZShlcnJvci5zdGF0dXNDb2RlLCB7IFxuICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgZXJyb3JUeXBlOiBlcnJvci5lcnJvclR5cGUgXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDUwMCwgeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSk7XG4gIH1cbn07Il19