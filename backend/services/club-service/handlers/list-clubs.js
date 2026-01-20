"use strict";
/**
 * List Clubs Handler - Phase 2.1
 *
 * Lambda handler for GET /clubs endpoint.
 * Public endpoint for club discovery with pagination and filtering.
 *
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lambda_utils_1 = require("../../../shared/utils/lambda-utils");
const errors_1 = require("../../../shared/utils/errors");
const club_1 = require("../../../shared/types/club");
const dynamodb_club_repository_1 = require("../infrastructure/dynamodb-club-repository");
const club_service_1 = require("../domain/club-service");
// Environment variables
const TABLE_NAME = process.env.TABLE_NAME;
// Initialize repository and service
const clubRepository = new dynamodb_club_repository_1.DynamoDBClubRepository(TABLE_NAME);
const clubService = new club_service_1.ClubService(clubRepository);
/**
 * Lambda handler for GET /clubs
 *
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
async function handler(event) {
    const requestId = event.requestContext.requestId;
    const origin = event.headers.origin || event.headers.Origin;
    (0, lambda_utils_1.logStructured)('INFO', 'Processing list clubs request', {
        requestId,
        httpMethod: event.httpMethod,
        path: event.path,
        queryParams: event.queryStringParameters,
        origin,
    });
    try {
        // Parse query parameters
        const queryParams = event.queryStringParameters || {};
        const limit = parseLimit(queryParams.limit);
        const cursor = queryParams.cursor;
        const status = parseStatus(queryParams.status);
        (0, lambda_utils_1.logStructured)('INFO', 'Parsed query parameters', {
            requestId,
            limit,
            status,
            hasCursor: !!cursor,
        });
        // List clubs
        const result = await clubService.listClubs({
            limit,
            cursor,
            status,
        });
        (0, lambda_utils_1.logStructured)('INFO', 'Clubs listed successfully', {
            requestId,
            count: result.clubs.length,
            hasNextCursor: !!result.nextCursor,
        });
        // Return clubs array directly (createSuccessResponse will wrap it)
        return (0, lambda_utils_1.createSuccessResponse)(result.clubs, undefined, origin);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing list clubs request', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId, origin);
    }
}
exports.handler = handler;
/**
 * Parse and validate limit parameter
 */
function parseLimit(limitParam) {
    if (!limitParam) {
        return club_1.CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT;
    }
    const limit = parseInt(limitParam, 10);
    if (isNaN(limit) || limit < 1) {
        throw new errors_1.ValidationError('Limit must be a positive number');
    }
    if (limit > club_1.CLUB_CONSTRAINTS.MAX_LIST_LIMIT) {
        return club_1.CLUB_CONSTRAINTS.MAX_LIST_LIMIT;
    }
    return limit;
}
/**
 * Parse and validate status parameter
 */
function parseStatus(statusParam) {
    if (!statusParam) {
        return club_1.ClubStatus.ACTIVE; // Default to active clubs
    }
    const status = statusParam.toLowerCase();
    // Map string to enum
    switch (status) {
        case 'active':
            return club_1.ClubStatus.ACTIVE;
        case 'suspended':
            return club_1.ClubStatus.SUSPENDED;
        case 'archived':
            return club_1.ClubStatus.ARCHIVED;
        default:
            throw new errors_1.ValidationError(`Invalid status: ${statusParam}. Must be one of: active, suspended, archived`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1jbHVicy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxpc3QtY2x1YnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7QUFHSCxxRUFBNkc7QUFDN0cseURBQStEO0FBQy9ELHFEQUEwRTtBQUMxRSx5RkFBb0Y7QUFDcEYseURBQXFEO0FBRXJELHdCQUF3QjtBQUN4QixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVcsQ0FBQztBQUUzQyxvQ0FBb0M7QUFDcEMsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RCxNQUFNLFdBQVcsR0FBRyxJQUFJLDBCQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFcEQ7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQTJCO0lBQ3ZELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO0lBQ2pELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBRTVELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsK0JBQStCLEVBQUU7UUFDckQsU0FBUztRQUNULFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtRQUM1QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7UUFDaEIsV0FBVyxFQUFFLEtBQUssQ0FBQyxxQkFBcUI7UUFDeEMsTUFBTTtLQUNQLENBQUMsQ0FBQztJQUVILElBQUk7UUFDRix5QkFBeUI7UUFDekIsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixJQUFJLEVBQUUsQ0FBQztRQUN0RCxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzVDLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUM7UUFDbEMsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUvQyxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLHlCQUF5QixFQUFFO1lBQy9DLFNBQVM7WUFDVCxLQUFLO1lBQ0wsTUFBTTtZQUNOLFNBQVMsRUFBRSxDQUFDLENBQUMsTUFBTTtTQUNwQixDQUFDLENBQUM7UUFFSCxhQUFhO1FBQ2IsTUFBTSxNQUFNLEdBQUcsTUFBTSxXQUFXLENBQUMsU0FBUyxDQUFDO1lBQ3pDLEtBQUs7WUFDTCxNQUFNO1lBQ04sTUFBTTtTQUNQLENBQUMsQ0FBQztRQUVILElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsMkJBQTJCLEVBQUU7WUFDakQsU0FBUztZQUNULEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU07WUFDMUIsYUFBYSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsVUFBVTtTQUNuQyxDQUFDLENBQUM7UUFFSCxtRUFBbUU7UUFDbkUsT0FBTyxJQUFBLG9DQUFxQixFQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQy9EO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxJQUFBLDRCQUFhLEVBQUMsT0FBTyxFQUFFLHFDQUFxQyxFQUFFO1lBQzVELFNBQVM7WUFDVCxLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZTtTQUNoRSxDQUFDLENBQUM7UUFFSCxPQUFPLElBQUEsZ0NBQWlCLEVBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztLQUNwRDtBQUNILENBQUM7QUFqREQsMEJBaURDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLFVBQVUsQ0FBQyxVQUEwQjtJQUM1QyxJQUFJLENBQUMsVUFBVSxFQUFFO1FBQ2YsT0FBTyx1QkFBZ0IsQ0FBQyxrQkFBa0IsQ0FBQztLQUM1QztJQUVELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFFdkMsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTtRQUM3QixNQUFNLElBQUksd0JBQWUsQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO0tBQzlEO0lBRUQsSUFBSSxLQUFLLEdBQUcsdUJBQWdCLENBQUMsY0FBYyxFQUFFO1FBQzNDLE9BQU8sdUJBQWdCLENBQUMsY0FBYyxDQUFDO0tBQ3hDO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLFdBQVcsQ0FBQyxXQUEyQjtJQUM5QyxJQUFJLENBQUMsV0FBVyxFQUFFO1FBQ2hCLE9BQU8saUJBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQywwQkFBMEI7S0FDckQ7SUFFRCxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsV0FBVyxFQUFFLENBQUM7SUFFekMscUJBQXFCO0lBQ3JCLFFBQVEsTUFBTSxFQUFFO1FBQ2QsS0FBSyxRQUFRO1lBQ1gsT0FBTyxpQkFBVSxDQUFDLE1BQU0sQ0FBQztRQUMzQixLQUFLLFdBQVc7WUFDZCxPQUFPLGlCQUFVLENBQUMsU0FBUyxDQUFDO1FBQzlCLEtBQUssVUFBVTtZQUNiLE9BQU8saUJBQVUsQ0FBQyxRQUFRLENBQUM7UUFDN0I7WUFDRSxNQUFNLElBQUksd0JBQWUsQ0FBQyxtQkFBbUIsV0FBVywrQ0FBK0MsQ0FBQyxDQUFDO0tBQzVHO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTGlzdCBDbHVicyBIYW5kbGVyIC0gUGhhc2UgMi4xXG4gKiBcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBHRVQgL2NsdWJzIGVuZHBvaW50LlxuICogUHVibGljIGVuZHBvaW50IGZvciBjbHViIGRpc2NvdmVyeSB3aXRoIHBhZ2luYXRpb24gYW5kIGZpbHRlcmluZy5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMi4xIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTIuMS5jbHViLXNlcnZpY2UudjEubWRcbiAqL1xuXG5pbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBjcmVhdGVTdWNjZXNzUmVzcG9uc2UsIGhhbmRsZUxhbWJkYUVycm9yLCBsb2dTdHJ1Y3R1cmVkIH0gZnJvbSAnLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMvZXJyb3JzJztcbmltcG9ydCB7IENsdWJTdGF0dXMsIENMVUJfQ09OU1RSQUlOVFMgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdHlwZXMvY2x1Yic7XG5pbXBvcnQgeyBEeW5hbW9EQkNsdWJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItY2x1Yi1yZXBvc2l0b3J5JztcbmltcG9ydCB7IENsdWJTZXJ2aWNlIH0gZnJvbSAnLi4vZG9tYWluL2NsdWItc2VydmljZSc7XG5cbi8vIEVudmlyb25tZW50IHZhcmlhYmxlc1xuY29uc3QgVEFCTEVfTkFNRSA9IHByb2Nlc3MuZW52LlRBQkxFX05BTUUhO1xuXG4vLyBJbml0aWFsaXplIHJlcG9zaXRvcnkgYW5kIHNlcnZpY2VcbmNvbnN0IGNsdWJSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkoVEFCTEVfTkFNRSk7XG5jb25zdCBjbHViU2VydmljZSA9IG5ldyBDbHViU2VydmljZShjbHViUmVwb3NpdG9yeSk7XG5cbi8qKlxuICogTGFtYmRhIGhhbmRsZXIgZm9yIEdFVCAvY2x1YnNcbiAqIFxuICogQHBhcmFtIGV2ZW50IC0gQVBJIEdhdGV3YXkgcHJveHkgZXZlbnRcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xuICBjb25zdCByZXF1ZXN0SWQgPSBldmVudC5yZXF1ZXN0Q29udGV4dC5yZXF1ZXN0SWQ7XG4gIGNvbnN0IG9yaWdpbiA9IGV2ZW50LmhlYWRlcnMub3JpZ2luIHx8IGV2ZW50LmhlYWRlcnMuT3JpZ2luO1xuICBcbiAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdQcm9jZXNzaW5nIGxpc3QgY2x1YnMgcmVxdWVzdCcsIHtcbiAgICByZXF1ZXN0SWQsXG4gICAgaHR0cE1ldGhvZDogZXZlbnQuaHR0cE1ldGhvZCxcbiAgICBwYXRoOiBldmVudC5wYXRoLFxuICAgIHF1ZXJ5UGFyYW1zOiBldmVudC5xdWVyeVN0cmluZ1BhcmFtZXRlcnMsXG4gICAgb3JpZ2luLFxuICB9KTtcbiAgXG4gIHRyeSB7XG4gICAgLy8gUGFyc2UgcXVlcnkgcGFyYW1ldGVyc1xuICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZXZlbnQucXVlcnlTdHJpbmdQYXJhbWV0ZXJzIHx8IHt9O1xuICAgIGNvbnN0IGxpbWl0ID0gcGFyc2VMaW1pdChxdWVyeVBhcmFtcy5saW1pdCk7XG4gICAgY29uc3QgY3Vyc29yID0gcXVlcnlQYXJhbXMuY3Vyc29yO1xuICAgIGNvbnN0IHN0YXR1cyA9IHBhcnNlU3RhdHVzKHF1ZXJ5UGFyYW1zLnN0YXR1cyk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1BhcnNlZCBxdWVyeSBwYXJhbWV0ZXJzJywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgbGltaXQsXG4gICAgICBzdGF0dXMsXG4gICAgICBoYXNDdXJzb3I6ICEhY3Vyc29yLFxuICAgIH0pO1xuXG4gICAgLy8gTGlzdCBjbHVic1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNsdWJTZXJ2aWNlLmxpc3RDbHVicyh7XG4gICAgICBsaW1pdCxcbiAgICAgIGN1cnNvcixcbiAgICAgIHN0YXR1cyxcbiAgICB9KTtcblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnQ2x1YnMgbGlzdGVkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIGNvdW50OiByZXN1bHQuY2x1YnMubGVuZ3RoLFxuICAgICAgaGFzTmV4dEN1cnNvcjogISFyZXN1bHQubmV4dEN1cnNvcixcbiAgICB9KTtcblxuICAgIC8vIFJldHVybiBjbHVicyBhcnJheSBkaXJlY3RseSAoY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlIHdpbGwgd3JhcCBpdClcbiAgICByZXR1cm4gY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHJlc3VsdC5jbHVicywgdW5kZWZpbmVkLCBvcmlnaW4pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ1N0cnVjdHVyZWQoJ0VSUk9SJywgJ0Vycm9yIHByb2Nlc3NpbmcgbGlzdCBjbHVicyByZXF1ZXN0Jywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGhhbmRsZUxhbWJkYUVycm9yKGVycm9yLCByZXF1ZXN0SWQsIG9yaWdpbik7XG4gIH1cbn1cblxuLyoqXG4gKiBQYXJzZSBhbmQgdmFsaWRhdGUgbGltaXQgcGFyYW1ldGVyXG4gKi9cbmZ1bmN0aW9uIHBhcnNlTGltaXQobGltaXRQYXJhbT86IHN0cmluZyB8IG51bGwpOiBudW1iZXIge1xuICBpZiAoIWxpbWl0UGFyYW0pIHtcbiAgICByZXR1cm4gQ0xVQl9DT05TVFJBSU5UUy5ERUZBVUxUX0xJU1RfTElNSVQ7XG4gIH1cblxuICBjb25zdCBsaW1pdCA9IHBhcnNlSW50KGxpbWl0UGFyYW0sIDEwKTtcbiAgXG4gIGlmIChpc05hTihsaW1pdCkgfHwgbGltaXQgPCAxKSB7XG4gICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignTGltaXQgbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB9XG5cbiAgaWYgKGxpbWl0ID4gQ0xVQl9DT05TVFJBSU5UUy5NQVhfTElTVF9MSU1JVCkge1xuICAgIHJldHVybiBDTFVCX0NPTlNUUkFJTlRTLk1BWF9MSVNUX0xJTUlUO1xuICB9XG5cbiAgcmV0dXJuIGxpbWl0O1xufVxuXG4vKipcbiAqIFBhcnNlIGFuZCB2YWxpZGF0ZSBzdGF0dXMgcGFyYW1ldGVyXG4gKi9cbmZ1bmN0aW9uIHBhcnNlU3RhdHVzKHN0YXR1c1BhcmFtPzogc3RyaW5nIHwgbnVsbCk6IENsdWJTdGF0dXMgfCB1bmRlZmluZWQge1xuICBpZiAoIXN0YXR1c1BhcmFtKSB7XG4gICAgcmV0dXJuIENsdWJTdGF0dXMuQUNUSVZFOyAvLyBEZWZhdWx0IHRvIGFjdGl2ZSBjbHVic1xuICB9XG5cbiAgY29uc3Qgc3RhdHVzID0gc3RhdHVzUGFyYW0udG9Mb3dlckNhc2UoKTtcbiAgXG4gIC8vIE1hcCBzdHJpbmcgdG8gZW51bVxuICBzd2l0Y2ggKHN0YXR1cykge1xuICAgIGNhc2UgJ2FjdGl2ZSc6XG4gICAgICByZXR1cm4gQ2x1YlN0YXR1cy5BQ1RJVkU7XG4gICAgY2FzZSAnc3VzcGVuZGVkJzpcbiAgICAgIHJldHVybiBDbHViU3RhdHVzLlNVU1BFTkRFRDtcbiAgICBjYXNlICdhcmNoaXZlZCc6XG4gICAgICByZXR1cm4gQ2x1YlN0YXR1cy5BUkNISVZFRDtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcihgSW52YWxpZCBzdGF0dXM6ICR7c3RhdHVzUGFyYW19LiBNdXN0IGJlIG9uZSBvZjogYWN0aXZlLCBzdXNwZW5kZWQsIGFyY2hpdmVkYCk7XG4gIH1cbn0iXX0=