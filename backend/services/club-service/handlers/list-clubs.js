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
const dynamodb_membership_repository_1 = require("../infrastructure/dynamodb-membership-repository");
const dynamodb_user_repository_1 = require("../../user-profile/infrastructure/dynamodb-user-repository");
const club_service_1 = require("../domain/club-service");
// Environment variables
const TABLE_NAME = process.env.TABLE_NAME;
// Initialize repositories and services
const clubRepository = new dynamodb_club_repository_1.DynamoDBClubRepository(TABLE_NAME);
const userRepository = new dynamodb_user_repository_1.DynamoDBUserRepository(TABLE_NAME);
const membershipRepository = new dynamodb_membership_repository_1.DynamoDBMembershipRepository(TABLE_NAME, userRepository);
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
        // Enrich clubs with member counts
        const enrichedClubs = await Promise.all(result.clubs.map(async (club) => {
            const memberCount = await membershipRepository.getClubMemberCount(club.id);
            return {
                ...club,
                memberCount,
            };
        }));
        (0, lambda_utils_1.logStructured)('INFO', 'Clubs listed successfully', {
            requestId,
            count: enrichedClubs.length,
            hasNextCursor: !!result.nextCursor,
        });
        // Return enriched clubs array
        return (0, lambda_utils_1.createSuccessResponse)(enrichedClubs, undefined, origin);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1jbHVicy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxpc3QtY2x1YnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7QUFHSCxxRUFBNkc7QUFDN0cseURBQStEO0FBQy9ELHFEQUEwRTtBQUMxRSx5RkFBb0Y7QUFDcEYscUdBQWdHO0FBQ2hHLHlHQUFvRztBQUNwRyx5REFBcUQ7QUFFckQsd0JBQXdCO0FBQ3hCLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVyxDQUFDO0FBRTNDLHVDQUF1QztBQUN2QyxNQUFNLGNBQWMsR0FBRyxJQUFJLGlEQUFzQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlELE1BQU0sY0FBYyxHQUFHLElBQUksaURBQXNCLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDOUQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLDZEQUE0QixDQUFDLFVBQVUsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUMxRixNQUFNLFdBQVcsR0FBRyxJQUFJLDBCQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFcEQ7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQTJCO0lBQ3ZELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO0lBQ2pELE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO0lBRTVELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsK0JBQStCLEVBQUU7UUFDckQsU0FBUztRQUNULFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtRQUM1QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7UUFDaEIsV0FBVyxFQUFFLEtBQUssQ0FBQyxxQkFBcUI7UUFDeEMsTUFBTTtLQUNQLENBQUMsQ0FBQztJQUVILElBQUk7UUFDRix5QkFBeUI7UUFDekIsTUFBTSxX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aUJBQVUsQ0FBQyxTQUFTLENBQUM7UUFDOUIsS0FBSyxVQUFVO1lBQ2IsT0FBTyxpQkFBVSxDQUFDLFFBQVEsQ0FBQztRQUM3QjtZQUNFLE1BQU0sSUFBSSx3QkFBZSxDQUFDLG1CQUFtQixXQUFXLCtDQUErQyxDQUFDLENBQUM7S0FDNUc7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBMaXN0IENsdWJzIEhhbmRsZXIgLSBQaGFzZSAyLjFcbiAqIFxuICogTGFtYmRhIGhhbmRsZXIgZm9yIEdFVCAvY2x1YnMgZW5kcG9pbnQuXG4gKiBQdWJsaWMgZW5kcG9pbnQgZm9yIGNsdWIgZGlzY292ZXJ5IHdpdGggcGFnaW5hdGlvbiBhbmQgZmlsdGVyaW5nLlxuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBQaGFzZSAyLjEgU3BlYzogLmtpcm8vc3BlY3MvcGhhc2UtMi4xLmNsdWItc2VydmljZS52MS5tZFxuICovXG5cbmltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IGNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSwgaGFuZGxlTGFtYmRhRXJyb3IsIGxvZ1N0cnVjdHVyZWQgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscy9lcnJvcnMnO1xuaW1wb3J0IHsgQ2x1YlN0YXR1cywgQ0xVQl9DT05TVFJBSU5UUyB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC90eXBlcy9jbHViJztcbmltcG9ydCB7IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkgfSBmcm9tICcuLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1jbHViLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgRHluYW1vREJNZW1iZXJzaGlwUmVwb3NpdG9yeSB9IGZyb20gJy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLW1lbWJlcnNoaXAtcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBEeW5hbW9EQlVzZXJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vdXNlci1wcm9maWxlL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLXVzZXItcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBDbHViU2VydmljZSB9IGZyb20gJy4uL2RvbWFpbi9jbHViLXNlcnZpY2UnO1xuXG4vLyBFbnZpcm9ubWVudCB2YXJpYWJsZXNcbmNvbnN0IFRBQkxFX05BTUUgPSBwcm9jZXNzLmVudi5UQUJMRV9OQU1FITtcblxuLy8gSW5pdGlhbGl6ZSByZXBvc2l0b3JpZXMgYW5kIHNlcnZpY2VzXG5jb25zdCBjbHViUmVwb3NpdG9yeSA9IG5ldyBEeW5hbW9EQkNsdWJSZXBvc2l0b3J5KFRBQkxFX05BTUUpO1xuY29uc3QgdXNlclJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJVc2VyUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IG1lbWJlcnNoaXBSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCTWVtYmVyc2hpcFJlcG9zaXRvcnkoVEFCTEVfTkFNRSwgdXNlclJlcG9zaXRvcnkpO1xuY29uc3QgY2x1YlNlcnZpY2UgPSBuZXcgQ2x1YlNlcnZpY2UoY2x1YlJlcG9zaXRvcnkpO1xuXG4vKipcbiAqIExhbWJkYSBoYW5kbGVyIGZvciBHRVQgL2NsdWJzXG4gKiBcbiAqIEBwYXJhbSBldmVudCAtIEFQSSBHYXRld2F5IHByb3h5IGV2ZW50XG4gKiBAcmV0dXJucyBBUEkgR2F0ZXdheSBwcm94eSByZXN1bHRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+IHtcbiAgY29uc3QgcmVxdWVzdElkID0gZXZlbnQucmVxdWVzdENvbnRleHQucmVxdWVzdElkO1xuICBjb25zdCBvcmlnaW4gPSBldmVudC5oZWFkZXJzLm9yaWdpbiB8fCBldmVudC5oZWFkZXJzLk9yaWdpbjtcbiAgXG4gIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnUHJvY2Vzc2luZyBsaXN0IGNsdWJzIHJlcXVlc3QnLCB7XG4gICAgcmVxdWVzdElkLFxuICAgIGh0dHBNZXRob2Q6IGV2ZW50Lmh0dHBNZXRob2QsXG4gICAgcGF0aDogZXZlbnQucGF0aCxcbiAgICBxdWVyeVBhcmFtczogZXZlbnQucXVlcnlTdHJpbmdQYXJhbWV0ZXJzLFxuICAgIG9yaWdpbixcbiAgfSk7XG4gIFxuICB0cnkge1xuICAgIC8vIFBhcnNlIHF1ZXJ5IHBhcmFtZXRlcnNcbiAgICBjb25zdCBxdWVyeVBhcmFtcyA9IGV2ZW50LnF1ZXJ5U3RyaW5nUGFyYW1ldGVycyB8fCB7fTtcbiAgICBjb25zdCBsaW1pdCA9IHBhcnNlTGltaXQocXVlcnlQYXJhbXMubGltaXQpO1xuICAgIGNvbnN0IGN1cnNvciA9IHF1ZXJ5UGFyYW1zLmN1cnNvcjtcbiAgICBjb25zdCBzdGF0dXMgPSBwYXJzZVN0YXR1cyhxdWVyeVBhcmFtcy5zdGF0dXMpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdQYXJzZWQgcXVlcnkgcGFyYW1ldGVycycsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIGxpbWl0LFxuICAgICAgc3RhdHVzLFxuICAgICAgaGFzQ3Vyc29yOiAhIWN1cnNvcixcbiAgICB9KTtcblxuICAgIC8vIExpc3QgY2x1YnNcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBjbHViU2VydmljZS5saXN0Q2x1YnMoe1xuICAgICAgbGltaXQsXG4gICAgICBjdXJzb3IsXG4gICAgICBzdGF0dXMsXG4gICAgfSk7XG5cbiAgICAvLyBFbnJpY2ggY2x1YnMgd2l0aCBtZW1iZXIgY291bnRzXG4gICAgY29uc3QgZW5yaWNoZWRDbHVicyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgcmVzdWx0LmNsdWJzLm1hcChhc3luYyAoY2x1YikgPT4ge1xuICAgICAgICBjb25zdCBtZW1iZXJDb3VudCA9IGF3YWl0IG1lbWJlcnNoaXBSZXBvc2l0b3J5LmdldENsdWJNZW1iZXJDb3VudChjbHViLmlkKTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAuLi5jbHViLFxuICAgICAgICAgIG1lbWJlckNvdW50LFxuICAgICAgICB9O1xuICAgICAgfSlcbiAgICApO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdDbHVicyBsaXN0ZWQgc3VjY2Vzc2Z1bGx5Jywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgY291bnQ6IGVucmljaGVkQ2x1YnMubGVuZ3RoLFxuICAgICAgaGFzTmV4dEN1cnNvcjogISFyZXN1bHQubmV4dEN1cnNvcixcbiAgICB9KTtcblxuICAgIC8vIFJldHVybiBlbnJpY2hlZCBjbHVicyBhcnJheVxuICAgIHJldHVybiBjcmVhdGVTdWNjZXNzUmVzcG9uc2UoZW5yaWNoZWRDbHVicywgdW5kZWZpbmVkLCBvcmlnaW4pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGxvZ1N0cnVjdHVyZWQoJ0VSUk9SJywgJ0Vycm9yIHByb2Nlc3NpbmcgbGlzdCBjbHVicyByZXF1ZXN0Jywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGhhbmRsZUxhbWJkYUVycm9yKGVycm9yLCByZXF1ZXN0SWQsIG9yaWdpbik7XG4gIH1cbn1cblxuLyoqXG4gKiBQYXJzZSBhbmQgdmFsaWRhdGUgbGltaXQgcGFyYW1ldGVyXG4gKi9cbmZ1bmN0aW9uIHBhcnNlTGltaXQobGltaXRQYXJhbT86IHN0cmluZyB8IG51bGwpOiBudW1iZXIge1xuICBpZiAoIWxpbWl0UGFyYW0pIHtcbiAgICByZXR1cm4gQ0xVQl9DT05TVFJBSU5UUy5ERUZBVUxUX0xJU1RfTElNSVQ7XG4gIH1cblxuICBjb25zdCBsaW1pdCA9IHBhcnNlSW50KGxpbWl0UGFyYW0sIDEwKTtcbiAgXG4gIGlmIChpc05hTihsaW1pdCkgfHwgbGltaXQgPCAxKSB7XG4gICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignTGltaXQgbXVzdCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICB9XG5cbiAgaWYgKGxpbWl0ID4gQ0xVQl9DT05TVFJBSU5UUy5NQVhfTElTVF9MSU1JVCkge1xuICAgIHJldHVybiBDTFVCX0NPTlNUUkFJTlRTLk1BWF9MSVNUX0xJTUlUO1xuICB9XG5cbiAgcmV0dXJuIGxpbWl0O1xufVxuXG4vKipcbiAqIFBhcnNlIGFuZCB2YWxpZGF0ZSBzdGF0dXMgcGFyYW1ldGVyXG4gKi9cbmZ1bmN0aW9uIHBhcnNlU3RhdHVzKHN0YXR1c1BhcmFtPzogc3RyaW5nIHwgbnVsbCk6IENsdWJTdGF0dXMgfCB1bmRlZmluZWQge1xuICBpZiAoIXN0YXR1c1BhcmFtKSB7XG4gICAgcmV0dXJuIENsdWJTdGF0dXMuQUNUSVZFOyAvLyBEZWZhdWx0IHRvIGFjdGl2ZSBjbHVic1xuICB9XG5cbiAgY29uc3Qgc3RhdHVzID0gc3RhdHVzUGFyYW0udG9Mb3dlckNhc2UoKTtcbiAgXG4gIC8vIE1hcCBzdHJpbmcgdG8gZW51bVxuICBzd2l0Y2ggKHN0YXR1cykge1xuICAgIGNhc2UgJ2FjdGl2ZSc6XG4gICAgICByZXR1cm4gQ2x1YlN0YXR1cy5BQ1RJVkU7XG4gICAgY2FzZSAnc3VzcGVuZGVkJzpcbiAgICAgIHJldHVybiBDbHViU3RhdHVzLlNVU1BFTkRFRDtcbiAgICBjYXNlICdhcmNoaXZlZCc6XG4gICAgICByZXR1cm4gQ2x1YlN0YXR1cy5BUkNISVZFRDtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcihgSW52YWxpZCBzdGF0dXM6ICR7c3RhdHVzUGFyYW19LiBNdXN0IGJlIG9uZSBvZjogYWN0aXZlLCBzdXNwZW5kZWQsIGFyY2hpdmVkYCk7XG4gIH1cbn0iXX0=