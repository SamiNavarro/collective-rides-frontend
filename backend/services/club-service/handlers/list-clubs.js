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
    (0, lambda_utils_1.logStructured)('INFO', 'Processing list clubs request', {
        requestId,
        httpMethod: event.httpMethod,
        path: event.path,
        queryParams: event.queryStringParameters,
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
        // Format response
        const response = {
            success: true,
            data: result.clubs,
            pagination: {
                limit,
                ...(result.nextCursor && { nextCursor: result.nextCursor }),
            },
            timestamp: new Date().toISOString(),
        };
        (0, lambda_utils_1.logStructured)('INFO', 'Clubs listed successfully', {
            requestId,
            count: result.clubs.length,
            hasNextCursor: !!result.nextCursor,
        });
        return (0, lambda_utils_1.createSuccessResponse)(response);
    }
    catch (error) {
        (0, lambda_utils_1.logStructured)('ERROR', 'Error processing list clubs request', {
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return (0, lambda_utils_1.handleLambdaError)(error, requestId);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGlzdC1jbHVicy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImxpc3QtY2x1YnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7QUFHSCxxRUFBNkc7QUFDN0cseURBQStEO0FBQy9ELHFEQUEwRTtBQUMxRSx5RkFBb0Y7QUFDcEYseURBQXFEO0FBRXJELHdCQUF3QjtBQUN4QixNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVcsQ0FBQztBQUUzQyxvQ0FBb0M7QUFDcEMsTUFBTSxjQUFjLEdBQUcsSUFBSSxpREFBc0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUM5RCxNQUFNLFdBQVcsR0FBRyxJQUFJLDBCQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7QUFFcEQ7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsT0FBTyxDQUFDLEtBQTJCO0lBQ3ZELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO0lBRWpELElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUsK0JBQStCLEVBQUU7UUFDckQsU0FBUztRQUNULFVBQVUsRUFBRSxLQUFLLENBQUMsVUFBVTtRQUM1QixJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUk7UUFDaEIsV0FBVyxFQUFFLEtBQUssQ0FBQyxxQkFBcUI7S0FDekMsQ0FBQyxDQUFDO0lBRUgsSUFBSTtRQUNGLHlCQUF5QjtRQUN6QixNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMscUJBQXFCLElBQUksRUFBRSxDQUFDO1FBQ3RELE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDNUMsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQztRQUNsQyxNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRS9DLElBQUEsNEJBQWEsRUFBQyxNQUFNLEVBQUUseUJBQXlCLEVBQUU7WUFDL0MsU0FBUztZQUNULEtBQUs7WUFDTCxNQUFNO1lBQ04sU0FBUyxFQUFFLENBQUMsQ0FBQyxNQUFNO1NBQ3BCLENBQUMsQ0FBQztRQUVILGFBQWE7UUFDYixNQUFNLE1BQU0sR0FBRyxNQUFNLFdBQVcsQ0FBQyxTQUFTLENBQUM7WUFDekMsS0FBSztZQUNMLE1BQU07WUFDTixNQUFNO1NBQ1AsQ0FBQyxDQUFDO1FBRUgsa0JBQWtCO1FBQ2xCLE1BQU0sUUFBUSxHQUFHO1lBQ2YsT0FBTyxFQUFFLElBQUk7WUFDYixJQUFJLEVBQUUsTUFBTSxDQUFDLEtBQUs7WUFDbEIsVUFBVSxFQUFFO2dCQUNWLEtBQUs7Z0JBQ0wsR0FBRyxDQUFDLE1BQU0sQ0FBQyxVQUFVLElBQUksRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVUsRUFBRSxDQUFDO2FBQzVEO1lBQ0QsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3BDLENBQUM7UUFFRixJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLDJCQUEyQixFQUFFO1lBQ2pELFNBQVM7WUFDVCxLQUFLLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNO1lBQzFCLGFBQWEsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLFVBQVU7U0FDbkMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxJQUFBLG9DQUFxQixFQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ3hDO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxJQUFBLDRCQUFhLEVBQUMsT0FBTyxFQUFFLHFDQUFxQyxFQUFFO1lBQzVELFNBQVM7WUFDVCxLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsZUFBZTtTQUNoRSxDQUFDLENBQUM7UUFFSCxPQUFPLElBQUEsZ0NBQWlCLEVBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQzVDO0FBQ0gsQ0FBQztBQXpERCwwQkF5REM7QUFFRDs7R0FFRztBQUNILFNBQVMsVUFBVSxDQUFDLFVBQTBCO0lBQzVDLElBQUksQ0FBQyxVQUFVLEVBQUU7UUFDZixPQUFPLHVCQUFnQixDQUFDLGtCQUFrQixDQUFDO0tBQzVDO0lBRUQsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUV2QyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFO1FBQzdCLE1BQU0sSUFBSSx3QkFBZSxDQUFDLGlDQUFpQyxDQUFDLENBQUM7S0FDOUQ7SUFFRCxJQUFJLEtBQUssR0FBRyx1QkFBZ0IsQ0FBQyxjQUFjLEVBQUU7UUFDM0MsT0FBTyx1QkFBZ0IsQ0FBQyxjQUFjLENBQUM7S0FDeEM7SUFFRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsV0FBVyxDQUFDLFdBQTJCO0lBQzlDLElBQUksQ0FBQyxXQUFXLEVBQUU7UUFDaEIsT0FBTyxpQkFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLDBCQUEwQjtLQUNyRDtJQUVELE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxXQUFXLEVBQUUsQ0FBQztJQUV6QyxxQkFBcUI7SUFDckIsUUFBUSxNQUFNLEVBQUU7UUFDZCxLQUFLLFFBQVE7WUFDWCxPQUFPLGlCQUFVLENBQUMsTUFBTSxDQUFDO1FBQzNCLEtBQUssV0FBVztZQUNkLE9BQU8saUJBQVUsQ0FBQyxTQUFTLENBQUM7UUFDOUIsS0FBSyxVQUFVO1lBQ2IsT0FBTyxpQkFBVSxDQUFDLFFBQVEsQ0FBQztRQUM3QjtZQUNFLE1BQU0sSUFBSSx3QkFBZSxDQUFDLG1CQUFtQixXQUFXLCtDQUErQyxDQUFDLENBQUM7S0FDNUc7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBMaXN0IENsdWJzIEhhbmRsZXIgLSBQaGFzZSAyLjFcbiAqIFxuICogTGFtYmRhIGhhbmRsZXIgZm9yIEdFVCAvY2x1YnMgZW5kcG9pbnQuXG4gKiBQdWJsaWMgZW5kcG9pbnQgZm9yIGNsdWIgZGlzY292ZXJ5IHdpdGggcGFnaW5hdGlvbiBhbmQgZmlsdGVyaW5nLlxuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBQaGFzZSAyLjEgU3BlYzogLmtpcm8vc3BlY3MvcGhhc2UtMi4xLmNsdWItc2VydmljZS52MS5tZFxuICovXG5cbmltcG9ydCB7IEFQSUdhdGV3YXlQcm94eUV2ZW50LCBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IGNyZWF0ZVN1Y2Nlc3NSZXNwb25zZSwgaGFuZGxlTGFtYmRhRXJyb3IsIGxvZ1N0cnVjdHVyZWQgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscy9lcnJvcnMnO1xuaW1wb3J0IHsgQ2x1YlN0YXR1cywgQ0xVQl9DT05TVFJBSU5UUyB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC90eXBlcy9jbHViJztcbmltcG9ydCB7IER5bmFtb0RCQ2x1YlJlcG9zaXRvcnkgfSBmcm9tICcuLi9pbmZyYXN0cnVjdHVyZS9keW5hbW9kYi1jbHViLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgQ2x1YlNlcnZpY2UgfSBmcm9tICcuLi9kb21haW4vY2x1Yi1zZXJ2aWNlJztcblxuLy8gRW52aXJvbm1lbnQgdmFyaWFibGVzXG5jb25zdCBUQUJMRV9OQU1FID0gcHJvY2Vzcy5lbnYuVEFCTEVfTkFNRSE7XG5cbi8vIEluaXRpYWxpemUgcmVwb3NpdG9yeSBhbmQgc2VydmljZVxuY29uc3QgY2x1YlJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJDbHViUmVwb3NpdG9yeShUQUJMRV9OQU1FKTtcbmNvbnN0IGNsdWJTZXJ2aWNlID0gbmV3IENsdWJTZXJ2aWNlKGNsdWJSZXBvc2l0b3J5KTtcblxuLyoqXG4gKiBMYW1iZGEgaGFuZGxlciBmb3IgR0VUIC9jbHVic1xuICogXG4gKiBAcGFyYW0gZXZlbnQgLSBBUEkgR2F0ZXdheSBwcm94eSBldmVudFxuICogQHJldHVybnMgQVBJIEdhdGV3YXkgcHJveHkgcmVzdWx0XG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCk6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiB7XG4gIGNvbnN0IHJlcXVlc3RJZCA9IGV2ZW50LnJlcXVlc3RDb250ZXh0LnJlcXVlc3RJZDtcbiAgXG4gIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnUHJvY2Vzc2luZyBsaXN0IGNsdWJzIHJlcXVlc3QnLCB7XG4gICAgcmVxdWVzdElkLFxuICAgIGh0dHBNZXRob2Q6IGV2ZW50Lmh0dHBNZXRob2QsXG4gICAgcGF0aDogZXZlbnQucGF0aCxcbiAgICBxdWVyeVBhcmFtczogZXZlbnQucXVlcnlTdHJpbmdQYXJhbWV0ZXJzLFxuICB9KTtcbiAgXG4gIHRyeSB7XG4gICAgLy8gUGFyc2UgcXVlcnkgcGFyYW1ldGVyc1xuICAgIGNvbnN0IHF1ZXJ5UGFyYW1zID0gZXZlbnQucXVlcnlTdHJpbmdQYXJhbWV0ZXJzIHx8IHt9O1xuICAgIGNvbnN0IGxpbWl0ID0gcGFyc2VMaW1pdChxdWVyeVBhcmFtcy5saW1pdCk7XG4gICAgY29uc3QgY3Vyc29yID0gcXVlcnlQYXJhbXMuY3Vyc29yO1xuICAgIGNvbnN0IHN0YXR1cyA9IHBhcnNlU3RhdHVzKHF1ZXJ5UGFyYW1zLnN0YXR1cyk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1BhcnNlZCBxdWVyeSBwYXJhbWV0ZXJzJywge1xuICAgICAgcmVxdWVzdElkLFxuICAgICAgbGltaXQsXG4gICAgICBzdGF0dXMsXG4gICAgICBoYXNDdXJzb3I6ICEhY3Vyc29yLFxuICAgIH0pO1xuXG4gICAgLy8gTGlzdCBjbHVic1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IGNsdWJTZXJ2aWNlLmxpc3RDbHVicyh7XG4gICAgICBsaW1pdCxcbiAgICAgIGN1cnNvcixcbiAgICAgIHN0YXR1cyxcbiAgICB9KTtcblxuICAgIC8vIEZvcm1hdCByZXNwb25zZVxuICAgIGNvbnN0IHJlc3BvbnNlID0ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHJlc3VsdC5jbHVicyxcbiAgICAgIHBhZ2luYXRpb246IHtcbiAgICAgICAgbGltaXQsXG4gICAgICAgIC4uLihyZXN1bHQubmV4dEN1cnNvciAmJiB7IG5leHRDdXJzb3I6IHJlc3VsdC5uZXh0Q3Vyc29yIH0pLFxuICAgICAgfSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0NsdWJzIGxpc3RlZCBzdWNjZXNzZnVsbHknLCB7XG4gICAgICByZXF1ZXN0SWQsXG4gICAgICBjb3VudDogcmVzdWx0LmNsdWJzLmxlbmd0aCxcbiAgICAgIGhhc05leHRDdXJzb3I6ICEhcmVzdWx0Lm5leHRDdXJzb3IsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlKHJlc3BvbnNlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdFUlJPUicsICdFcnJvciBwcm9jZXNzaW5nIGxpc3QgY2x1YnMgcmVxdWVzdCcsIHtcbiAgICAgIHJlcXVlc3RJZCxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIGVycm9yJyxcbiAgICB9KTtcblxuICAgIHJldHVybiBoYW5kbGVMYW1iZGFFcnJvcihlcnJvciwgcmVxdWVzdElkKTtcbiAgfVxufVxuXG4vKipcbiAqIFBhcnNlIGFuZCB2YWxpZGF0ZSBsaW1pdCBwYXJhbWV0ZXJcbiAqL1xuZnVuY3Rpb24gcGFyc2VMaW1pdChsaW1pdFBhcmFtPzogc3RyaW5nIHwgbnVsbCk6IG51bWJlciB7XG4gIGlmICghbGltaXRQYXJhbSkge1xuICAgIHJldHVybiBDTFVCX0NPTlNUUkFJTlRTLkRFRkFVTFRfTElTVF9MSU1JVDtcbiAgfVxuXG4gIGNvbnN0IGxpbWl0ID0gcGFyc2VJbnQobGltaXRQYXJhbSwgMTApO1xuICBcbiAgaWYgKGlzTmFOKGxpbWl0KSB8fCBsaW1pdCA8IDEpIHtcbiAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdMaW1pdCBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIH1cblxuICBpZiAobGltaXQgPiBDTFVCX0NPTlNUUkFJTlRTLk1BWF9MSVNUX0xJTUlUKSB7XG4gICAgcmV0dXJuIENMVUJfQ09OU1RSQUlOVFMuTUFYX0xJU1RfTElNSVQ7XG4gIH1cblxuICByZXR1cm4gbGltaXQ7XG59XG5cbi8qKlxuICogUGFyc2UgYW5kIHZhbGlkYXRlIHN0YXR1cyBwYXJhbWV0ZXJcbiAqL1xuZnVuY3Rpb24gcGFyc2VTdGF0dXMoc3RhdHVzUGFyYW0/OiBzdHJpbmcgfCBudWxsKTogQ2x1YlN0YXR1cyB8IHVuZGVmaW5lZCB7XG4gIGlmICghc3RhdHVzUGFyYW0pIHtcbiAgICByZXR1cm4gQ2x1YlN0YXR1cy5BQ1RJVkU7IC8vIERlZmF1bHQgdG8gYWN0aXZlIGNsdWJzXG4gIH1cblxuICBjb25zdCBzdGF0dXMgPSBzdGF0dXNQYXJhbS50b0xvd2VyQ2FzZSgpO1xuICBcbiAgLy8gTWFwIHN0cmluZyB0byBlbnVtXG4gIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgY2FzZSAnYWN0aXZlJzpcbiAgICAgIHJldHVybiBDbHViU3RhdHVzLkFDVElWRTtcbiAgICBjYXNlICdzdXNwZW5kZWQnOlxuICAgICAgcmV0dXJuIENsdWJTdGF0dXMuU1VTUEVOREVEO1xuICAgIGNhc2UgJ2FyY2hpdmVkJzpcbiAgICAgIHJldHVybiBDbHViU3RhdHVzLkFSQ0hJVkVEO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKGBJbnZhbGlkIHN0YXR1czogJHtzdGF0dXNQYXJhbX0uIE11c3QgYmUgb25lIG9mOiBhY3RpdmUsIHN1c3BlbmRlZCwgYXJjaGl2ZWRgKTtcbiAgfVxufSJdfQ==