"use strict";
/**
 * Get Club Handler - Phase 2.1
 *
 * Lambda handler for GET /clubs/{id} endpoint.
 * Public endpoint for retrieving club details by ID.
 *
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lambda_utils_1 = require("../../../shared/utils/lambda-utils");
const errors_1 = require("../../../shared/utils/errors");
const dynamodb_club_repository_1 = require("../infrastructure/dynamodb-club-repository");
const club_service_1 = require("../domain/club-service");
// Environment variables
const TABLE_NAME = process.env.TABLE_NAME;
// Initialize repository and service
const clubRepository = new dynamodb_club_repository_1.DynamoDBClubRepository(TABLE_NAME);
const clubService = new club_service_1.ClubService(clubRepository);
/**
 * Lambda handler for GET /clubs/{id}
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing get club request', {
        requestId,
        httpMethod: event.httpMethod,
        path: event.path,
    });
    try {
        // Extract club ID from path parameters
        const clubId = event.pathParameters?.clubId;
        if (!clubId) {
            throw new errors_1.ValidationError('Club ID is required');
        }
        (0, lambda_utils_1.logStructured)('INFO', 'Extracted club ID', {
            requestId,
            clubId,
        });
        // Get club by ID
        const club = await clubService.getClubById(clubId);
        (0, lambda_utils_1.logStructured)('INFO', 'Club retrieved successfully', {
            requestId,
            clubId,
            clubName: club.name,
            status: club.status,
        });
        // Format response
        const response = {
            success: true,
            data: club,
            timestamp: new Date().toISOString(),
        };
        return (0, lambda_utils_1.createSuccessResponse)(response);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing get club request', {
            requestId,
            clubId: event.pathParameters?.clubId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId);
    }
}
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LWNsdWIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnZXQtY2x1Yi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUdILHFFQUE2RztBQUM3Ryx5REFBK0Q7QUFDL0QseUZBQW9GO0FBQ3BGLHlEQUFxRDtBQUVyRCx3QkFBd0I7QUFDeEIsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFXLENBQUM7QUFFM0Msb0NBQW9DO0FBQ3BDLE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsTUFBTSxXQUFXLEdBQUcsSUFBSSwwQkFBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRXBEOzs7OztHQUtHO0FBQ0ksS0FBSyxVQUFVLE9BQU8sQ0FBQyxLQUEyQjtJQUN2RCxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQztJQUVqRCxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLDZCQUE2QixFQUFFO1FBQ25ELFNBQVM7UUFDVCxVQUFVLEVBQUUsS0FBSyxDQUFDLFVBQVU7UUFDNUIsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJO0tBQ2pCLENBQUMsQ0FBQztJQUVILElBQUk7UUFDRix1Q0FBdUM7UUFDdkMsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFBRSxNQUFNLENBQUM7UUFFNUMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNYLE1BQU0sSUFBSSx3QkFBZSxDQUFDLHFCQUFxQixDQUFDLENBQUM7U0FDbEQ7UUFFRCxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLG1CQUFtQixFQUFFO1lBQ3pDLFNBQVM7WUFDVCxNQUFNO1NBQ1AsQ0FBQyxDQUFDO1FBRUgsaUJBQWlCO1FBQ2pCLE1BQU0sSUFBSSxHQUFHLE1BQU0sV0FBVyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVuRCxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLDZCQUE2QixFQUFFO1lBQ25ELFNBQVM7WUFDVCxNQUFNO1lBQ04sUUFBUSxFQUFFLElBQUksQ0FBQyxJQUFJO1lBQ25CLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtTQUNwQixDQUFDLENBQUM7UUFFSCxrQkFBa0I7UUFDbEIsTUFBTSxRQUFRLEdBQUc7WUFDZixPQUFPLEVBQUUsSUFBSTtZQUNiLElBQUksRUFBRSxJQUFJO1lBQ1YsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3BDLENBQUM7UUFFRixPQUFPLElBQUEsb0NBQXFCLEVBQUMsUUFBUSxDQUFDLENBQUM7S0FDeEM7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLElBQUEsNEJBQWEsRUFBQyxPQUFPLEVBQUUsbUNBQW1DLEVBQUU7WUFDMUQsU0FBUztZQUNULE1BQU0sRUFBRSxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU07WUFDcEMsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLGVBQWU7U0FDaEUsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLGdDQUFpQixFQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztLQUM1QztBQUNILENBQUM7QUFqREQsMEJBaURDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBHZXQgQ2x1YiBIYW5kbGVyIC0gUGhhc2UgMi4xXG4gKiBcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBHRVQgL2NsdWJzL3tpZH0gZW5kcG9pbnQuXG4gKiBQdWJsaWMgZW5kcG9pbnQgZm9yIHJldHJpZXZpbmcgY2x1YiBkZXRhaWxzIGJ5IElELlxuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBQaGFzZSAyLjEgU3BlYzogLmtpcm8vc3BlY3MvcGhhc2UtMi4xLmNsdWItc2VydmljZS52MS5tZFxuICovXG5cbmltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IGNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSwgaGFuZGxlTGFtYmRhRXJyb3IsIGxvZ1N0cnVjdHVyZWQgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscy9lcnJvcnMnO1xuaW1wb3J0IHsgRHluYW1vREJDbHViUmVwb3NpdG9yeSB9IGZyb20gJy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLWNsdWItcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBDbHViU2VydmljZSB9IGZyb20gJy4uL2RvbWFpbi9jbHViLXNlcnZpY2UnO1xuXG4vLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcbmNvbnN0IFRBQkxFX05BTUUgPSBwcm9jZXNzLmVudi5UQUJMRV9OQU1FITtcblxuLy8gSW5pdGlhbGl6ZSByZXBvc2l0b3J5IGFuZCBzZXJ2aWNlXG5jb25zdCBjbHViUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQkNsdWJSZXBvc2l0b3J5KFRBQkxFX05BTUUpO1xuY29uc3QgY2x1YlNlcnZpY2UgPSBuZXcgQ2x1YlNlcnZpY2UoY2x1YlJlcG9zaXRvcnkpO1xuXG4vKipcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBHRVQgL2NsdWJzL3tpZH1cbiAqIFxuICogQHBhcmFtIGV2ZW50IC0gQVBJIEdhdGV3YXkgcHJveHkgZXZlbnRcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xuICBjb25zdCByZXF1ZXN0SWQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5yZXF1ZXN0SWQ7XG4gIFxuICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1Byb2Nlc3NpbmcgZ2V0IGNsdWIgcmVxdWVzdCcsIHtcbiAgICByZXF1ZXN0SWQsXG4gICAgaHR0cE1ldGhvZDogZXZlbnQuaHR0cE1ldGhvZCxcbiAgICBwYXRoOiBldmVudC5wYXRoLFxuICB9KTtcbiAgXG4gIHRyeSB7XG4gICAgLy8gRXh0cmFjdCBjbHViIElEIGZyb20gcGF0aCBwYXJhbWV0ZXJzXG4gICAgY29uc3QgY2x1YklkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNsdWJJZDtcbiAgICBcbiAgICBpZiAoIWNsdWJJZCkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignQ2x1YiBJRCBpcyByZXF1aXJlZCcpO1xuICAgIH1cblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnRXh0cmFjdGVkIGNsdWIgSUQnLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICBjbHViSWQsXG4gICAgfSk7XG5cbiAgICAvLyBHZXQgY2x1YiBieSBJRFxuICAgIGNvbnN0IGNsdWIgPSBhd2FpdCBjbHViU2VydmljZS5nZXRDbHViQnlJZChjbHViSWQpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdDbHViIHJldHJpZXZlZCBzdWNjZXNzZnVsbHknLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICBjbHViSWQsXG4gICAgICBjbHViTmFtZTogY2x1Yi5uYW1lLFxuICAgICAgc3RhdHVzOiBjbHViLnN0YXR1cyxcbiAgICB9KTtcblxuICAgIC8vIEZvcm1hdCByZXNwb25zZVxuICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IGNsdWIsXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIGNyZWF0ZVN1Y2Nlc3NSZXNwb25zZShyZXNwb25zZSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgbG9nU3RydWN0dXJlZCgnRVJST1InLCAnRXJyb3IgcHJvY2Vzc2luZyBnZXQgY2x1YiByZXF1ZXN0Jywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgY2x1YklkOiBldmVudC5wYXRoUGFyYW1ldGVycz8uY2x1YklkLFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGhhbmRsZUxhbWJkYUVycm9yKGVycm9yLCByZXF1ZXN0SWQpO1xuICB9XG59Il19