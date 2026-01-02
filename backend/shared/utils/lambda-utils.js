"use strict";
/**
 * Lambda Utilities - Phase 1.2
 *
 * Utilities for Lambda function responses, error handling, and common
 * Lambda patterns.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logStructured = exports.handleLambdaError = exports.createInternalErrorResponse = exports.createNotFoundResponse = exports.createForbiddenResponse = exports.createUnauthorizedResponse = exports.createValidationErrorResponse = exports.createErrorResponse = exports.createSuccessResponse = exports.parseJsonBody = exports.parseJSON = exports.createResponse = void 0;
const api_1 = require("../types/api");
/**
 * Create a generic API response
 *
 * @param statusCode - HTTP status code
 * @param body - Response body
 * @returns API Gateway proxy result
 */
function createResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        },
        body: JSON.stringify(body),
    };
}
exports.createResponse = createResponse;
/**
 * Parse JSON from request body with error handling
 *
 * @param body - Request body string
 * @returns Parsed JSON object
 */
function parseJSON(body) {
    if (!body) {
        throw new Error('Request body is required');
    }
    try {
        return JSON.parse(body);
    }
    catch (error) {
        throw new Error('Invalid JSON in request body');
    }
}
exports.parseJSON = parseJSON;
/**
 * Parse JSON from API Gateway event body
 *
 * @param event - API Gateway proxy event
 * @returns Parsed JSON object
 */
function parseJsonBody(event) {
    return parseJSON(event.body);
}
exports.parseJsonBody = parseJsonBody;
/**
 * Create a successful API response
 *
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 * @returns API Gateway proxy result
 */
function createSuccessResponse(data, statusCode = api_1.HttpStatusCode.OK) {
    const response = {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        },
        body: JSON.stringify(response),
    };
}
exports.createSuccessResponse = createSuccessResponse;
/**
 * Create an error API response
 *
 * @param error - Error type
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
function createErrorResponse(error, message, statusCode, requestId) {
    const response = {
        error,
        message,
        timestamp: new Date().toISOString(),
        requestId,
    };
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        },
        body: JSON.stringify(response),
    };
}
exports.createErrorResponse = createErrorResponse;
/**
 * Create a validation error response
 *
 * @param message - Validation error message
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
function createValidationErrorResponse(message, requestId) {
    return createErrorResponse(api_1.ApiErrorType.VALIDATION_ERROR, message, api_1.HttpStatusCode.BAD_REQUEST, requestId);
}
exports.createValidationErrorResponse = createValidationErrorResponse;
/**
 * Create an unauthorized error response
 *
 * @param message - Error message (default: 'Unauthorized')
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
function createUnauthorizedResponse(message = 'Unauthorized', requestId) {
    return createErrorResponse(api_1.ApiErrorType.UNAUTHORIZED, message, api_1.HttpStatusCode.UNAUTHORIZED, requestId);
}
exports.createUnauthorizedResponse = createUnauthorizedResponse;
/**
 * Create a forbidden error response
 *
 * @param message - Error message (default: 'Forbidden')
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
function createForbiddenResponse(message = 'Forbidden', requestId) {
    return createErrorResponse(api_1.ApiErrorType.FORBIDDEN, message, api_1.HttpStatusCode.FORBIDDEN, requestId);
}
exports.createForbiddenResponse = createForbiddenResponse;
/**
 * Create a not found error response
 *
 * @param message - Error message (default: 'Not found')
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
function createNotFoundResponse(message = 'Not found', requestId) {
    return createErrorResponse(api_1.ApiErrorType.NOT_FOUND, message, api_1.HttpStatusCode.NOT_FOUND, requestId);
}
exports.createNotFoundResponse = createNotFoundResponse;
/**
 * Create an internal server error response
 *
 * @param message - Error message (default: 'Internal server error')
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
function createInternalErrorResponse(message = 'Internal server error', requestId) {
    return createErrorResponse(api_1.ApiErrorType.INTERNAL_ERROR, message, api_1.HttpStatusCode.INTERNAL_SERVER_ERROR, requestId);
}
exports.createInternalErrorResponse = createInternalErrorResponse;
/**
 * Handle Lambda function errors and convert to appropriate HTTP responses
 *
 * @param error - Error object
 * @param requestId - Request ID for logging
 * @returns API Gateway proxy result
 */
function handleLambdaError(error, requestId) {
    console.error('Lambda error:', error, { requestId });
    if (error instanceof Error) {
        const message = error.message;
        // Map specific error messages to HTTP status codes
        if (message.includes('Authentication required') || message.includes('JWT')) {
            return createUnauthorizedResponse(message, requestId);
        }
        if (message.includes('privileges required') || message.includes('Forbidden')) {
            return createForbiddenResponse(message, requestId);
        }
        if (message.includes('not found') || message.includes('Not found')) {
            return createNotFoundResponse(message, requestId);
        }
        if (message.includes('validation') || message.includes('Invalid')) {
            return createValidationErrorResponse(message, requestId);
        }
    }
    // Default to internal server error
    return createInternalErrorResponse('An unexpected error occurred', requestId);
}
exports.handleLambdaError = handleLambdaError;
/**
 * Log structured information for CloudWatch
 *
 * @param level - Log level
 * @param message - Log message
 * @param context - Additional context
 */
function logStructured(level, message, context = {}) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...context,
    };
    console.log(JSON.stringify(logEntry));
}
exports.logStructured = logStructured;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBR0gsc0NBQXdGO0FBRXhGOzs7Ozs7R0FNRztBQUNILFNBQWdCLGNBQWMsQ0FDNUIsVUFBa0IsRUFDbEIsSUFBUztJQUVULE9BQU87UUFDTCxVQUFVO1FBQ1YsT0FBTyxFQUFFO1lBQ1AsY0FBYyxFQUFFLGtCQUFrQjtZQUNsQyw2QkFBNkIsRUFBRSxHQUFHO1lBQ2xDLDhCQUE4QixFQUFFLHNFQUFzRTtZQUN0Ryw4QkFBOEIsRUFBRSw2QkFBNkI7U0FDOUQ7UUFDRCxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7S0FDM0IsQ0FBQztBQUNKLENBQUM7QUFkRCx3Q0FjQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsU0FBUyxDQUFJLElBQW1CO0lBQzlDLElBQUksQ0FBQyxJQUFJLEVBQUU7UUFDVCxNQUFNLElBQUksS0FBSyxDQUFDLDBCQUEwQixDQUFDLENBQUM7S0FDN0M7SUFFRCxJQUFJO1FBQ0YsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBTSxDQUFDO0tBQzlCO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxNQUFNLElBQUksS0FBSyxDQUFDLDhCQUE4QixDQUFDLENBQUM7S0FDakQ7QUFDSCxDQUFDO0FBVkQsOEJBVUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLGFBQWEsQ0FBSSxLQUE4QjtJQUM3RCxPQUFPLFNBQVMsQ0FBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbEMsQ0FBQztBQUZELHNDQUVDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IscUJBQXFCLENBQ25DLElBQU8sRUFDUCxhQUE2QixvQkFBYyxDQUFDLEVBQUU7SUFFOUMsTUFBTSxRQUFRLEdBQW1CO1FBQy9CLE9BQU8sRUFBRSxJQUFJO1FBQ2IsSUFBSTtRQUNKLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtLQUNwQyxDQUFDO0lBRUYsT0FBTztRQUNMLFVBQVU7UUFDVixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsa0JBQWtCO1lBQ2xDLDZCQUE2QixFQUFFLEdBQUc7WUFDbEMsOEJBQThCLEVBQUUsc0VBQXNFO1lBQ3RHLDhCQUE4QixFQUFFLDZCQUE2QjtTQUM5RDtRQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztLQUMvQixDQUFDO0FBQ0osQ0FBQztBQXBCRCxzREFvQkM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILFNBQWdCLG1CQUFtQixDQUNqQyxLQUE0QixFQUM1QixPQUFlLEVBQ2YsVUFBMEIsRUFDMUIsU0FBa0I7SUFFbEIsTUFBTSxRQUFRLEdBQWtCO1FBQzlCLEtBQUs7UUFDTCxPQUFPO1FBQ1AsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1FBQ25DLFNBQVM7S0FDVixDQUFDO0lBRUYsT0FBTztRQUNMLFVBQVU7UUFDVixPQUFPLEVBQUU7WUFDUCxjQUFjLEVBQUUsa0JBQWtCO1lBQ2xDLDZCQUE2QixFQUFFLEdBQUc7WUFDbEMsOEJBQThCLEVBQUUsc0VBQXNFO1lBQ3RHLDhCQUE4QixFQUFFLDZCQUE2QjtTQUM5RDtRQUNELElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztLQUMvQixDQUFDO0FBQ0osQ0FBQztBQXZCRCxrREF1QkM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQiw2QkFBNkIsQ0FDM0MsT0FBZSxFQUNmLFNBQWtCO0lBRWxCLE9BQU8sbUJBQW1CLENBQ3hCLGtCQUFZLENBQUMsZ0JBQWdCLEVBQzdCLE9BQU8sRUFDUCxvQkFBYyxDQUFDLFdBQVcsRUFDMUIsU0FBUyxDQUNWLENBQUM7QUFDSixDQUFDO0FBVkQsc0VBVUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQiwwQkFBMEIsQ0FDeEMsVUFBa0IsY0FBYyxFQUNoQyxTQUFrQjtJQUVsQixPQUFPLG1CQUFtQixDQUN4QixrQkFBWSxDQUFDLFlBQVksRUFDekIsT0FBTyxFQUNQLG9CQUFjLENBQUMsWUFBWSxFQUMzQixTQUFTLENBQ1YsQ0FBQztBQUNKLENBQUM7QUFWRCxnRUFVQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQWdCLHVCQUF1QixDQUNyQyxVQUFrQixXQUFXLEVBQzdCLFNBQWtCO0lBRWxCLE9BQU8sbUJBQW1CLENBQ3hCLGtCQUFZLENBQUMsU0FBUyxFQUN0QixPQUFPLEVBQ1Asb0JBQWMsQ0FBQyxTQUFTLEVBQ3hCLFNBQVMsQ0FDVixDQUFDO0FBQ0osQ0FBQztBQVZELDBEQVVDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBZ0Isc0JBQXNCLENBQ3BDLFVBQWtCLFdBQVcsRUFDN0IsU0FBa0I7SUFFbEIsT0FBTyxtQkFBbUIsQ0FDeEIsa0JBQVksQ0FBQyxTQUFTLEVBQ3RCLE9BQU8sRUFDUCxvQkFBYyxDQUFDLFNBQVMsRUFDeEIsU0FBUyxDQUNWLENBQUM7QUFDSixDQUFDO0FBVkQsd0RBVUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQiwyQkFBMkIsQ0FDekMsVUFBa0IsdUJBQXVCLEVBQ3pDLFNBQWtCO0lBRWxCLE9BQU8sbUJBQW1CLENBQ3hCLGtCQUFZLENBQUMsY0FBYyxFQUMzQixPQUFPLEVBQ1Asb0JBQWMsQ0FBQyxxQkFBcUIsRUFDcEMsU0FBUyxDQUNWLENBQUM7QUFDSixDQUFDO0FBVkQsa0VBVUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxLQUFjLEVBQUUsU0FBa0I7SUFDbEUsT0FBTyxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsS0FBSyxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUVyRCxJQUFJLEtBQUssWUFBWSxLQUFLLEVBQUU7UUFDMUIsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztRQUU5QixtREFBbUQ7UUFDbkQsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLHlCQUF5QixDQUFDLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUMxRSxPQUFPLDBCQUEwQixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztTQUN2RDtRQUVELElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDNUUsT0FBTyx1QkFBdUIsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDcEQ7UUFFRCxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUNsRSxPQUFPLHNCQUFzQixDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQztTQUNuRDtRQUVELElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQ2pFLE9BQU8sNkJBQTZCLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1NBQzFEO0tBQ0Y7SUFFRCxtQ0FBbUM7SUFDbkMsT0FBTywyQkFBMkIsQ0FBQyw4QkFBOEIsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNoRixDQUFDO0FBMUJELDhDQTBCQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQWdCLGFBQWEsQ0FDM0IsS0FBZ0MsRUFDaEMsT0FBZSxFQUNmLFVBQStCLEVBQUU7SUFFakMsTUFBTSxRQUFRLEdBQUc7UUFDZixTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7UUFDbkMsS0FBSztRQUNMLE9BQU87UUFDUCxHQUFHLE9BQU87S0FDWCxDQUFDO0lBRUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7QUFDeEMsQ0FBQztBQWJELHNDQWFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBMYW1iZGEgVXRpbGl0aWVzIC0gUGhhc2UgMS4yXG4gKiBcbiAqIFV0aWxpdGllcyBmb3IgTGFtYmRhIGZ1bmN0aW9uIHJlc3BvbnNlcywgZXJyb3IgaGFuZGxpbmcsIGFuZCBjb21tb25cbiAqIExhbWJkYSBwYXR0ZXJucy5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMS4yIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTEuMi51c2VyLXByb2ZpbGUudjEubWRcbiAqL1xuXG5pbXBvcnQgeyBBUElHYXRld2F5UHJveHlSZXN1bHQgfSBmcm9tICdhd3MtbGFtYmRhJztcbmltcG9ydCB7IEFwaVJlc3BvbnNlLCBFcnJvclJlc3BvbnNlLCBIdHRwU3RhdHVzQ29kZSwgQXBpRXJyb3JUeXBlIH0gZnJvbSAnLi4vdHlwZXMvYXBpJztcblxuLyoqXG4gKiBDcmVhdGUgYSBnZW5lcmljIEFQSSByZXNwb25zZVxuICogXG4gKiBAcGFyYW0gc3RhdHVzQ29kZSAtIEhUVFAgc3RhdHVzIGNvZGVcbiAqIEBwYXJhbSBib2R5IC0gUmVzcG9uc2UgYm9keVxuICogQHJldHVybnMgQVBJIEdhdGV3YXkgcHJveHkgcmVzdWx0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSZXNwb25zZShcbiAgc3RhdHVzQ29kZTogbnVtYmVyLFxuICBib2R5OiBhbnlcbik6IEFQSUdhdGV3YXlQcm94eVJlc3VsdCB7XG4gIHJldHVybiB7XG4gICAgc3RhdHVzQ29kZSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU9yaWdpbic6ICcqJyxcbiAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZSxYLUFtei1EYXRlLEF1dGhvcml6YXRpb24sWC1BcGktS2V5LFgtQW16LVNlY3VyaXR5LVRva2VuJyxcbiAgICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogJ0dFVCxQT1NULFBVVCxERUxFVEUsT1BUSU9OUycsXG4gICAgfSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShib2R5KSxcbiAgfTtcbn1cblxuLyoqXG4gKiBQYXJzZSBKU09OIGZyb20gcmVxdWVzdCBib2R5IHdpdGggZXJyb3IgaGFuZGxpbmdcbiAqIFxuICogQHBhcmFtIGJvZHkgLSBSZXF1ZXN0IGJvZHkgc3RyaW5nXG4gKiBAcmV0dXJucyBQYXJzZWQgSlNPTiBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSlNPTjxUPihib2R5OiBzdHJpbmcgfCBudWxsKTogVCB7XG4gIGlmICghYm9keSkge1xuICAgIHRocm93IG5ldyBFcnJvcignUmVxdWVzdCBib2R5IGlzIHJlcXVpcmVkJyk7XG4gIH1cbiAgXG4gIHRyeSB7XG4gICAgcmV0dXJuIEpTT04ucGFyc2UoYm9keSkgYXMgVDtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgSlNPTiBpbiByZXF1ZXN0IGJvZHknKTtcbiAgfVxufVxuXG4vKipcbiAqIFBhcnNlIEpTT04gZnJvbSBBUEkgR2F0ZXdheSBldmVudCBib2R5XG4gKiBcbiAqIEBwYXJhbSBldmVudCAtIEFQSSBHYXRld2F5IHByb3h5IGV2ZW50XG4gKiBAcmV0dXJucyBQYXJzZWQgSlNPTiBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlSnNvbkJvZHk8VD4oZXZlbnQ6IHsgYm9keTogc3RyaW5nIHwgbnVsbCB9KTogVCB7XG4gIHJldHVybiBwYXJzZUpTT048VD4oZXZlbnQuYm9keSk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgc3VjY2Vzc2Z1bCBBUEkgcmVzcG9uc2VcbiAqIFxuICogQHBhcmFtIGRhdGEgLSBSZXNwb25zZSBkYXRhXG4gKiBAcGFyYW0gc3RhdHVzQ29kZSAtIEhUVFAgc3RhdHVzIGNvZGUgKGRlZmF1bHQ6IDIwMClcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlPFQ+KFxuICBkYXRhOiBULFxuICBzdGF0dXNDb2RlOiBIdHRwU3RhdHVzQ29kZSA9IEh0dHBTdGF0dXNDb2RlLk9LXG4pOiBBUElHYXRld2F5UHJveHlSZXN1bHQge1xuICBjb25zdCByZXNwb25zZTogQXBpUmVzcG9uc2U8VD4gPSB7XG4gICAgc3VjY2VzczogdHJ1ZSxcbiAgICBkYXRhLFxuICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICB9O1xuICBcbiAgcmV0dXJuIHtcbiAgICBzdGF0dXNDb2RlLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiAnQ29udGVudC1UeXBlLFgtQW16LURhdGUsQXV0aG9yaXphdGlvbixYLUFwaS1LZXksWC1BbXotU2VjdXJpdHktVG9rZW4nLFxuICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnOiAnR0VULFBPU1QsUFVULERFTEVURSxPUFRJT05TJyxcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW4gZXJyb3IgQVBJIHJlc3BvbnNlXG4gKiBcbiAqIEBwYXJhbSBlcnJvciAtIEVycm9yIHR5cGVcbiAqIEBwYXJhbSBtZXNzYWdlIC0gRXJyb3IgbWVzc2FnZVxuICogQHBhcmFtIHN0YXR1c0NvZGUgLSBIVFRQIHN0YXR1cyBjb2RlXG4gKiBAcGFyYW0gcmVxdWVzdElkIC0gT3B0aW9uYWwgcmVxdWVzdCBJRFxuICogQHJldHVybnMgQVBJIEdhdGV3YXkgcHJveHkgcmVzdWx0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvclJlc3BvbnNlKFxuICBlcnJvcjogQXBpRXJyb3JUeXBlIHwgc3RyaW5nLFxuICBtZXNzYWdlOiBzdHJpbmcsXG4gIHN0YXR1c0NvZGU6IEh0dHBTdGF0dXNDb2RlLFxuICByZXF1ZXN0SWQ/OiBzdHJpbmdcbik6IEFQSUdhdGV3YXlQcm94eVJlc3VsdCB7XG4gIGNvbnN0IHJlc3BvbnNlOiBFcnJvclJlc3BvbnNlID0ge1xuICAgIGVycm9yLFxuICAgIG1lc3NhZ2UsXG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgcmVxdWVzdElkLFxuICB9O1xuICBcbiAgcmV0dXJuIHtcbiAgICBzdGF0dXNDb2RlLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogJyonLFxuICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUhlYWRlcnMnOiAnQ29udGVudC1UeXBlLFgtQW16LURhdGUsQXV0aG9yaXphdGlvbixYLUFwaS1LZXksWC1BbXotU2VjdXJpdHktVG9rZW4nLFxuICAgICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LU1ldGhvZHMnOiAnR0VULFBPU1QsUFVULERFTEVURSxPUFRJT05TJyxcbiAgICB9LFxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlKSxcbiAgfTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSB2YWxpZGF0aW9uIGVycm9yIHJlc3BvbnNlXG4gKiBcbiAqIEBwYXJhbSBtZXNzYWdlIC0gVmFsaWRhdGlvbiBlcnJvciBtZXNzYWdlXG4gKiBAcGFyYW0gcmVxdWVzdElkIC0gT3B0aW9uYWwgcmVxdWVzdCBJRFxuICogQHJldHVybnMgQVBJIEdhdGV3YXkgcHJveHkgcmVzdWx0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVWYWxpZGF0aW9uRXJyb3JSZXNwb25zZShcbiAgbWVzc2FnZTogc3RyaW5nLFxuICByZXF1ZXN0SWQ/OiBzdHJpbmdcbik6IEFQSUdhdGV3YXlQcm94eVJlc3VsdCB7XG4gIHJldHVybiBjcmVhdGVFcnJvclJlc3BvbnNlKFxuICAgIEFwaUVycm9yVHlwZS5WQUxJREFUSU9OX0VSUk9SLFxuICAgIG1lc3NhZ2UsXG4gICAgSHR0cFN0YXR1c0NvZGUuQkFEX1JFUVVFU1QsXG4gICAgcmVxdWVzdElkXG4gICk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuIHVuYXV0aG9yaXplZCBlcnJvciByZXNwb25zZVxuICogXG4gKiBAcGFyYW0gbWVzc2FnZSAtIEVycm9yIG1lc3NhZ2UgKGRlZmF1bHQ6ICdVbmF1dGhvcml6ZWQnKVxuICogQHBhcmFtIHJlcXVlc3RJZCAtIE9wdGlvbmFsIHJlcXVlc3QgSURcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVW5hdXRob3JpemVkUmVzcG9uc2UoXG4gIG1lc3NhZ2U6IHN0cmluZyA9ICdVbmF1dGhvcml6ZWQnLFxuICByZXF1ZXN0SWQ/OiBzdHJpbmdcbik6IEFQSUdhdGV3YXlQcm94eVJlc3VsdCB7XG4gIHJldHVybiBjcmVhdGVFcnJvclJlc3BvbnNlKFxuICAgIEFwaUVycm9yVHlwZS5VTkFVVEhPUklaRUQsXG4gICAgbWVzc2FnZSxcbiAgICBIdHRwU3RhdHVzQ29kZS5VTkFVVEhPUklaRUQsXG4gICAgcmVxdWVzdElkXG4gICk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZm9yYmlkZGVuIGVycm9yIHJlc3BvbnNlXG4gKiBcbiAqIEBwYXJhbSBtZXNzYWdlIC0gRXJyb3IgbWVzc2FnZSAoZGVmYXVsdDogJ0ZvcmJpZGRlbicpXG4gKiBAcGFyYW0gcmVxdWVzdElkIC0gT3B0aW9uYWwgcmVxdWVzdCBJRFxuICogQHJldHVybnMgQVBJIEdhdGV3YXkgcHJveHkgcmVzdWx0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVGb3JiaWRkZW5SZXNwb25zZShcbiAgbWVzc2FnZTogc3RyaW5nID0gJ0ZvcmJpZGRlbicsXG4gIHJlcXVlc3RJZD86IHN0cmluZ1xuKTogQVBJR2F0ZXdheVByb3h5UmVzdWx0IHtcbiAgcmV0dXJuIGNyZWF0ZUVycm9yUmVzcG9uc2UoXG4gICAgQXBpRXJyb3JUeXBlLkZPUkJJRERFTixcbiAgICBtZXNzYWdlLFxuICAgIEh0dHBTdGF0dXNDb2RlLkZPUkJJRERFTixcbiAgICByZXF1ZXN0SWRcbiAgKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBub3QgZm91bmQgZXJyb3IgcmVzcG9uc2VcbiAqIFxuICogQHBhcmFtIG1lc3NhZ2UgLSBFcnJvciBtZXNzYWdlIChkZWZhdWx0OiAnTm90IGZvdW5kJylcbiAqIEBwYXJhbSByZXF1ZXN0SWQgLSBPcHRpb25hbCByZXF1ZXN0IElEXG4gKiBAcmV0dXJucyBBUEkgR2F0ZXdheSBwcm94eSByZXN1bHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vdEZvdW5kUmVzcG9uc2UoXG4gIG1lc3NhZ2U6IHN0cmluZyA9ICdOb3QgZm91bmQnLFxuICByZXF1ZXN0SWQ/OiBzdHJpbmdcbik6IEFQSUdhdGV3YXlQcm94eVJlc3VsdCB7XG4gIHJldHVybiBjcmVhdGVFcnJvclJlc3BvbnNlKFxuICAgIEFwaUVycm9yVHlwZS5OT1RfRk9VTkQsXG4gICAgbWVzc2FnZSxcbiAgICBIdHRwU3RhdHVzQ29kZS5OT1RfRk9VTkQsXG4gICAgcmVxdWVzdElkXG4gICk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuIGludGVybmFsIHNlcnZlciBlcnJvciByZXNwb25zZVxuICogXG4gKiBAcGFyYW0gbWVzc2FnZSAtIEVycm9yIG1lc3NhZ2UgKGRlZmF1bHQ6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InKVxuICogQHBhcmFtIHJlcXVlc3RJZCAtIE9wdGlvbmFsIHJlcXVlc3QgSURcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSW50ZXJuYWxFcnJvclJlc3BvbnNlKFxuICBtZXNzYWdlOiBzdHJpbmcgPSAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyxcbiAgcmVxdWVzdElkPzogc3RyaW5nXG4pOiBBUElHYXRld2F5UHJveHlSZXN1bHQge1xuICByZXR1cm4gY3JlYXRlRXJyb3JSZXNwb25zZShcbiAgICBBcGlFcnJvclR5cGUuSU5URVJOQUxfRVJST1IsXG4gICAgbWVzc2FnZSxcbiAgICBIdHRwU3RhdHVzQ29kZS5JTlRFUk5BTF9TRVJWRVJfRVJST1IsXG4gICAgcmVxdWVzdElkXG4gICk7XG59XG5cbi8qKlxuICogSGFuZGxlIExhbWJkYSBmdW5jdGlvbiBlcnJvcnMgYW5kIGNvbnZlcnQgdG8gYXBwcm9wcmlhdGUgSFRUUCByZXNwb25zZXNcbiAqIFxuICogQHBhcmFtIGVycm9yIC0gRXJyb3Igb2JqZWN0XG4gKiBAcGFyYW0gcmVxdWVzdElkIC0gUmVxdWVzdCBJRCBmb3IgbG9nZ2luZ1xuICogQHJldHVybnMgQVBJIEdhdGV3YXkgcHJveHkgcmVzdWx0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVMYW1iZGFFcnJvcihlcnJvcjogdW5rbm93biwgcmVxdWVzdElkPzogc3RyaW5nKTogQVBJR2F0ZXdheVByb3h5UmVzdWx0IHtcbiAgY29uc29sZS5lcnJvcignTGFtYmRhIGVycm9yOicsIGVycm9yLCB7IHJlcXVlc3RJZCB9KTtcbiAgXG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U7XG4gICAgXG4gICAgLy8gTWFwIHNwZWNpZmljIGVycm9yIG1lc3NhZ2VzIHRvIEhUVFAgc3RhdHVzIGNvZGVzXG4gICAgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJ0F1dGhlbnRpY2F0aW9uIHJlcXVpcmVkJykgfHwgbWVzc2FnZS5pbmNsdWRlcygnSldUJykpIHtcbiAgICAgIHJldHVybiBjcmVhdGVVbmF1dGhvcml6ZWRSZXNwb25zZShtZXNzYWdlLCByZXF1ZXN0SWQpO1xuICAgIH1cbiAgICBcbiAgICBpZiAobWVzc2FnZS5pbmNsdWRlcygncHJpdmlsZWdlcyByZXF1aXJlZCcpIHx8IG1lc3NhZ2UuaW5jbHVkZXMoJ0ZvcmJpZGRlbicpKSB7XG4gICAgICByZXR1cm4gY3JlYXRlRm9yYmlkZGVuUmVzcG9uc2UobWVzc2FnZSwgcmVxdWVzdElkKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJ25vdCBmb3VuZCcpIHx8IG1lc3NhZ2UuaW5jbHVkZXMoJ05vdCBmb3VuZCcpKSB7XG4gICAgICByZXR1cm4gY3JlYXRlTm90Rm91bmRSZXNwb25zZShtZXNzYWdlLCByZXF1ZXN0SWQpO1xuICAgIH1cbiAgICBcbiAgICBpZiAobWVzc2FnZS5pbmNsdWRlcygndmFsaWRhdGlvbicpIHx8IG1lc3NhZ2UuaW5jbHVkZXMoJ0ludmFsaWQnKSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVZhbGlkYXRpb25FcnJvclJlc3BvbnNlKG1lc3NhZ2UsIHJlcXVlc3RJZCk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBEZWZhdWx0IHRvIGludGVybmFsIHNlcnZlciBlcnJvclxuICByZXR1cm4gY3JlYXRlSW50ZXJuYWxFcnJvclJlc3BvbnNlKCdBbiB1bmV4cGVjdGVkIGVycm9yIG9jY3VycmVkJywgcmVxdWVzdElkKTtcbn1cblxuLyoqXG4gKiBMb2cgc3RydWN0dXJlZCBpbmZvcm1hdGlvbiBmb3IgQ2xvdWRXYXRjaFxuICogXG4gKiBAcGFyYW0gbGV2ZWwgLSBMb2cgbGV2ZWxcbiAqIEBwYXJhbSBtZXNzYWdlIC0gTG9nIG1lc3NhZ2VcbiAqIEBwYXJhbSBjb250ZXh0IC0gQWRkaXRpb25hbCBjb250ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2dTdHJ1Y3R1cmVkKFxuICBsZXZlbDogJ0lORk8nIHwgJ1dBUk4nIHwgJ0VSUk9SJyxcbiAgbWVzc2FnZTogc3RyaW5nLFxuICBjb250ZXh0OiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0ge31cbik6IHZvaWQge1xuICBjb25zdCBsb2dFbnRyeSA9IHtcbiAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICBsZXZlbCxcbiAgICBtZXNzYWdlLFxuICAgIC4uLmNvbnRleHQsXG4gIH07XG4gIFxuICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShsb2dFbnRyeSkpO1xufSJdfQ==