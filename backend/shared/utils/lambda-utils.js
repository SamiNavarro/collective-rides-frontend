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
 * Get CORS headers based on the request origin
 * Supports both localhost and Vercel deployments
 */
function getCorsHeaders(origin) {
    // List of allowed origins (exact matches)
    const allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'https://collective-rides-frontend.vercel.app',
        'https://sydneycycles.com',
        'https://collectiverides.com',
    ];
    // Check if origin is allowed
    let allowOrigin = 'http://localhost:3000'; // Default fallback
    if (origin) {
        // Check exact match first
        if (allowedOrigins.includes(origin)) {
            allowOrigin = origin;
        }
        // Check for Vercel preview deployments (*.vercel.app)
        else if (origin.endsWith('.vercel.app') && origin.startsWith('https://')) {
            allowOrigin = origin;
        }
    }
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    };
}
/**
 * Create a generic API response
 *
 * @param statusCode - HTTP status code
 * @param body - Response body
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
function createResponse(statusCode, body, origin) {
    return {
        statusCode,
        headers: getCorsHeaders(origin),
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
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
function createSuccessResponse(data, statusCode = api_1.HttpStatusCode.OK, origin) {
    const response = {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };
    return {
        statusCode,
        headers: getCorsHeaders(origin),
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
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
function createErrorResponse(error, message, statusCode, requestId, origin) {
    const response = {
        error,
        message,
        timestamp: new Date().toISOString(),
        requestId,
    };
    return {
        statusCode,
        headers: getCorsHeaders(origin),
        body: JSON.stringify(response),
    };
}
exports.createErrorResponse = createErrorResponse;
/**
 * Create a validation error response
 *
 * @param message - Validation error message
 * @param requestId - Optional request ID
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
function createValidationErrorResponse(message, requestId, origin) {
    return createErrorResponse(api_1.ApiErrorType.VALIDATION_ERROR, message, api_1.HttpStatusCode.BAD_REQUEST, requestId, origin);
}
exports.createValidationErrorResponse = createValidationErrorResponse;
/**
 * Create an unauthorized error response
 *
 * @param message - Error message (default: 'Unauthorized')
 * @param requestId - Optional request ID
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
function createUnauthorizedResponse(message = 'Unauthorized', requestId, origin) {
    return createErrorResponse(api_1.ApiErrorType.UNAUTHORIZED, message, api_1.HttpStatusCode.UNAUTHORIZED, requestId, origin);
}
exports.createUnauthorizedResponse = createUnauthorizedResponse;
/**
 * Create a forbidden error response
 *
 * @param message - Error message (default: 'Forbidden')
 * @param requestId - Optional request ID
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
function createForbiddenResponse(message = 'Forbidden', requestId, origin) {
    return createErrorResponse(api_1.ApiErrorType.FORBIDDEN, message, api_1.HttpStatusCode.FORBIDDEN, requestId, origin);
}
exports.createForbiddenResponse = createForbiddenResponse;
/**
 * Create a not found error response
 *
 * @param message - Error message (default: 'Not found')
 * @param requestId - Optional request ID
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
function createNotFoundResponse(message = 'Not found', requestId, origin) {
    return createErrorResponse(api_1.ApiErrorType.NOT_FOUND, message, api_1.HttpStatusCode.NOT_FOUND, requestId, origin);
}
exports.createNotFoundResponse = createNotFoundResponse;
/**
 * Create an internal server error response
 *
 * @param message - Error message (default: 'Internal server error')
 * @param requestId - Optional request ID
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
function createInternalErrorResponse(message = 'Internal server error', requestId, origin) {
    return createErrorResponse(api_1.ApiErrorType.INTERNAL_ERROR, message, api_1.HttpStatusCode.INTERNAL_SERVER_ERROR, requestId, origin);
}
exports.createInternalErrorResponse = createInternalErrorResponse;
/**
 * Handle Lambda function errors and convert to appropriate HTTP responses
 *
 * @param error - Error object
 * @param requestId - Request ID for logging
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
function handleLambdaError(error, requestId, origin) {
    console.error('Lambda error:', error, { requestId });
    if (error instanceof Error) {
        const message = error.message;
        // Map specific error messages to HTTP status codes
        if (message.includes('Authentication required') || message.includes('JWT')) {
            return createUnauthorizedResponse(message, requestId, origin);
        }
        if (message.includes('privileges required') || message.includes('Forbidden')) {
            return createForbiddenResponse(message, requestId, origin);
        }
        if (message.includes('not found') || message.includes('Not found')) {
            return createNotFoundResponse(message, requestId, origin);
        }
        if (message.includes('validation') || message.includes('Invalid')) {
            return createValidationErrorResponse(message, requestId, origin);
        }
    }
    // Default to internal server error
    return createInternalErrorResponse('An unexpected error occurred', requestId, origin);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibGFtYmRhLXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibGFtYmRhLXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBR0gsc0NBQXdGO0FBRXhGOzs7R0FHRztBQUNILFNBQVMsY0FBYyxDQUFDLE1BQWU7SUFDckMsMENBQTBDO0lBQzFDLE1BQU0sY0FBYyxHQUFHO1FBQ3JCLHVCQUF1QjtRQUN2Qix1QkFBdUI7UUFDdkIsOENBQThDO1FBQzlDLDBCQUEwQjtRQUMxQiw2QkFBNkI7S0FDOUIsQ0FBQztJQUVGLDZCQUE2QjtJQUM3QixJQUFJLFdBQVcsR0FBRyx1QkFBdUIsQ0FBQyxDQUFDLG1CQUFtQjtJQUU5RCxJQUFJLE1BQU0sRUFBRTtRQUNWLDBCQUEwQjtRQUMxQixJQUFJLGNBQWMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDbkMsV0FBVyxHQUFHLE1BQU0sQ0FBQztTQUN0QjtRQUNELHNEQUFzRDthQUNqRCxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUksTUFBTSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUN4RSxXQUFXLEdBQUcsTUFBTSxDQUFDO1NBQ3RCO0tBQ0Y7SUFFRCxPQUFPO1FBQ0wsY0FBYyxFQUFFLGtCQUFrQjtRQUNsQyw2QkFBNkIsRUFBRSxXQUFXO1FBQzFDLGtDQUFrQyxFQUFFLE1BQU07UUFDMUMsOEJBQThCLEVBQUUsdUZBQXVGO1FBQ3ZILDhCQUE4QixFQUFFLDZCQUE2QjtLQUM5RCxDQUFDO0FBQ0osQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxTQUFnQixjQUFjLENBQzVCLFVBQWtCLEVBQ2xCLElBQVMsRUFDVCxNQUFlO0lBRWYsT0FBTztRQUNMLFVBQVU7UUFDVixPQUFPLEVBQUUsY0FBYyxDQUFDLE1BQU0sQ0FBQztRQUMvQixJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUM7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QUFDO1NBQzNEO1FBRUQsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDakUsT0FBTyw2QkFBNkIsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1NBQ2xFO0tBQ0Y7SUFFRCxtQ0FBbUM7SUFDbkMsT0FBTywyQkFBMkIsQ0FBQyw4QkFBOEIsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDeEYsQ0FBQztBQTFCRCw4Q0EwQkM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQixhQUFhLENBQzNCLEtBQWdDLEVBQ2hDLE9BQWUsRUFDZixVQUErQixFQUFFO0lBRWpDLE1BQU0sUUFBUSxHQUFHO1FBQ2YsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1FBQ25DLEtBQUs7UUFDTCxPQUFPO1FBQ1AsR0FBRyxPQUFPO0tBQ1gsQ0FBQztJQUVGLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLENBQUM7QUFiRCxzQ0FhQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTGFtYmRhIFV0aWxpdGllcyAtIFBoYXNlIDEuMlxuICogXG4gKiBVdGlsaXRpZXMgZm9yIExhbWJkYSBmdW5jdGlvbiByZXNwb25zZXMsIGVycm9yIGhhbmRsaW5nLCBhbmQgY29tbW9uXG4gKiBMYW1iZGEgcGF0dGVybnMuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDEuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0xLjIudXNlci1wcm9maWxlLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBBcGlSZXNwb25zZSwgRXJyb3JSZXNwb25zZSwgSHR0cFN0YXR1c0NvZGUsIEFwaUVycm9yVHlwZSB9IGZyb20gJy4uL3R5cGVzL2FwaSc7XG5cbi8qKlxuICogR2V0IENPUlMgaGVhZGVycyBiYXNlZCBvbiB0aGUgcmVxdWVzdCBvcmlnaW5cbiAqIFN1cHBvcnRzIGJvdGggbG9jYWxob3N0IGFuZCBWZXJjZWwgZGVwbG95bWVudHNcbiAqL1xuZnVuY3Rpb24gZ2V0Q29yc0hlYWRlcnMob3JpZ2luPzogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgc3RyaW5nPiB7XG4gIC8vIExpc3Qgb2YgYWxsb3dlZCBvcmlnaW5zIChleGFjdCBtYXRjaGVzKVxuICBjb25zdCBhbGxvd2VkT3JpZ2lucyA9IFtcbiAgICAnaHR0cDovL2xvY2FsaG9zdDozMDAwJyxcbiAgICAnaHR0cDovLzEyNy4wLjAuMTozMDAwJyxcbiAgICAnaHR0cHM6Ly9jb2xsZWN0aXZlLXJpZGVzLWZyb250ZW5kLnZlcmNlbC5hcHAnLFxuICAgICdodHRwczovL3N5ZG5leWN5Y2xlcy5jb20nLFxuICAgICdodHRwczovL2NvbGxlY3RpdmVyaWRlcy5jb20nLFxuICBdO1xuICBcbiAgLy8gQ2hlY2sgaWYgb3JpZ2luIGlzIGFsbG93ZWRcbiAgbGV0IGFsbG93T3JpZ2luID0gJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCc7IC8vIERlZmF1bHQgZmFsbGJhY2tcbiAgXG4gIGlmIChvcmlnaW4pIHtcbiAgICAvLyBDaGVjayBleGFjdCBtYXRjaCBmaXJzdFxuICAgIGlmIChhbGxvd2VkT3JpZ2lucy5pbmNsdWRlcyhvcmlnaW4pKSB7XG4gICAgICBhbGxvd09yaWdpbiA9IG9yaWdpbjtcbiAgICB9XG4gICAgLy8gQ2hlY2sgZm9yIFZlcmNlbCBwcmV2aWV3IGRlcGxveW1lbnRzICgqLnZlcmNlbC5hcHApXG4gICAgZWxzZSBpZiAob3JpZ2luLmVuZHNXaXRoKCcudmVyY2VsLmFwcCcpICYmIG9yaWdpbi5zdGFydHNXaXRoKCdodHRwczovLycpKSB7XG4gICAgICBhbGxvd09yaWdpbiA9IG9yaWdpbjtcbiAgICB9XG4gIH1cbiAgXG4gIHJldHVybiB7XG4gICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAnQWNjZXNzLUNvbnRyb2wtQWxsb3ctT3JpZ2luJzogYWxsb3dPcmlnaW4sXG4gICAgJ0FjY2Vzcy1Db250cm9sLUFsbG93LUNyZWRlbnRpYWxzJzogJ3RydWUnLFxuICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1IZWFkZXJzJzogJ0NvbnRlbnQtVHlwZSxYLUFtei1EYXRlLEF1dGhvcml6YXRpb24sWC1BcGktS2V5LFgtQW16LVNlY3VyaXR5LVRva2VuLFgtQW16LVVzZXItQWdlbnQnLFxuICAgICdBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzJzogJ0dFVCxQT1NULFBVVCxERUxFVEUsT1BUSU9OUycsXG4gIH07XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZ2VuZXJpYyBBUEkgcmVzcG9uc2VcbiAqIFxuICogQHBhcmFtIHN0YXR1c0NvZGUgLSBIVFRQIHN0YXR1cyBjb2RlXG4gKiBAcGFyYW0gYm9keSAtIFJlc3BvbnNlIGJvZHlcbiAqIEBwYXJhbSBvcmlnaW4gLSBSZXF1ZXN0IG9yaWdpbiBmb3IgQ09SU1xuICogQHJldHVybnMgQVBJIEdhdGV3YXkgcHJveHkgcmVzdWx0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSZXNwb25zZShcbiAgc3RhdHVzQ29kZTogbnVtYmVyLFxuICBib2R5OiBhbnksXG4gIG9yaWdpbj86IHN0cmluZ1xuKTogQVBJR2F0ZXdheVByb3h5UmVzdWx0IHtcbiAgcmV0dXJuIHtcbiAgICBzdGF0dXNDb2RlLFxuICAgIGhlYWRlcnM6IGdldENvcnNIZWFkZXJzKG9yaWdpbiksXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoYm9keSksXG4gIH07XG59XG5cbi8qKlxuICogUGFyc2UgSlNPTiBmcm9tIHJlcXVlc3QgYm9keSB3aXRoIGVycm9yIGhhbmRsaW5nXG4gKiBcbiAqIEBwYXJhbSBib2R5IC0gUmVxdWVzdCBib2R5IHN0cmluZ1xuICogQHJldHVybnMgUGFyc2VkIEpTT04gb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUpTT048VD4oYm9keTogc3RyaW5nIHwgbnVsbCk6IFQge1xuICBpZiAoIWJvZHkpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlcXVlc3QgYm9keSBpcyByZXF1aXJlZCcpO1xuICB9XG4gIFxuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKGJvZHkpIGFzIFQ7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIEpTT04gaW4gcmVxdWVzdCBib2R5Jyk7XG4gIH1cbn1cblxuLyoqXG4gKiBQYXJzZSBKU09OIGZyb20gQVBJIEdhdGV3YXkgZXZlbnQgYm9keVxuICogXG4gKiBAcGFyYW0gZXZlbnQgLSBBUEkgR2F0ZXdheSBwcm94eSBldmVudFxuICogQHJldHVybnMgUGFyc2VkIEpTT04gb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUpzb25Cb2R5PFQ+KGV2ZW50OiB7IGJvZHk6IHN0cmluZyB8IG51bGwgfSk6IFQge1xuICByZXR1cm4gcGFyc2VKU09OPFQ+KGV2ZW50LmJvZHkpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIHN1Y2Nlc3NmdWwgQVBJIHJlc3BvbnNlXG4gKiBcbiAqIEBwYXJhbSBkYXRhIC0gUmVzcG9uc2UgZGF0YVxuICogQHBhcmFtIHN0YXR1c0NvZGUgLSBIVFRQIHN0YXR1cyBjb2RlIChkZWZhdWx0OiAyMDApXG4gKiBAcGFyYW0gb3JpZ2luIC0gUmVxdWVzdCBvcmlnaW4gZm9yIENPUlNcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3VjY2Vzc1Jlc3BvbnNlPFQ+KFxuICBkYXRhOiBULFxuICBzdGF0dXNDb2RlOiBIdHRwU3RhdHVzQ29kZSA9IEh0dHBTdGF0dXNDb2RlLk9LLFxuICBvcmlnaW4/OiBzdHJpbmdcbik6IEFQSUdhdGV3YXlQcm94eVJlc3VsdCB7XG4gIGNvbnN0IHJlc3BvbnNlOiBBcGlSZXNwb25zZTxUPiA9IHtcbiAgICBzdWNjZXNzOiB0cnVlLFxuICAgIGRhdGEsXG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gIH07XG4gIFxuICByZXR1cm4ge1xuICAgIHN0YXR1c0NvZGUsXG4gICAgaGVhZGVyczogZ2V0Q29yc0hlYWRlcnMob3JpZ2luKSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXNwb25zZSksXG4gIH07XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuIGVycm9yIEFQSSByZXNwb25zZVxuICogXG4gKiBAcGFyYW0gZXJyb3IgLSBFcnJvciB0eXBlXG4gKiBAcGFyYW0gbWVzc2FnZSAtIEVycm9yIG1lc3NhZ2VcbiAqIEBwYXJhbSBzdGF0dXNDb2RlIC0gSFRUUCBzdGF0dXMgY29kZVxuICogQHBhcmFtIHJlcXVlc3RJZCAtIE9wdGlvbmFsIHJlcXVlc3QgSURcbiAqIEBwYXJhbSBvcmlnaW4gLSBSZXF1ZXN0IG9yaWdpbiBmb3IgQ09SU1xuICogQHJldHVybnMgQVBJIEdhdGV3YXkgcHJveHkgcmVzdWx0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvclJlc3BvbnNlKFxuICBlcnJvcjogQXBpRXJyb3JUeXBlIHwgc3RyaW5nLFxuICBtZXNzYWdlOiBzdHJpbmcsXG4gIHN0YXR1c0NvZGU6IEh0dHBTdGF0dXNDb2RlLFxuICByZXF1ZXN0SWQ/OiBzdHJpbmcsXG4gIG9yaWdpbj86IHN0cmluZ1xuKTogQVBJR2F0ZXdheVByb3h5UmVzdWx0IHtcbiAgY29uc3QgcmVzcG9uc2U6IEVycm9yUmVzcG9uc2UgPSB7XG4gICAgZXJyb3IsXG4gICAgbWVzc2FnZSxcbiAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICByZXF1ZXN0SWQsXG4gIH07XG4gIFxuICByZXR1cm4ge1xuICAgIHN0YXR1c0NvZGUsXG4gICAgaGVhZGVyczogZ2V0Q29yc0hlYWRlcnMob3JpZ2luKSxcbiAgICBib2R5OiBKU09OLnN0cmluZ2lmeShyZXNwb25zZSksXG4gIH07XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgdmFsaWRhdGlvbiBlcnJvciByZXNwb25zZVxuICogXG4gKiBAcGFyYW0gbWVzc2FnZSAtIFZhbGlkYXRpb24gZXJyb3IgbWVzc2FnZVxuICogQHBhcmFtIHJlcXVlc3RJZCAtIE9wdGlvbmFsIHJlcXVlc3QgSURcbiAqIEBwYXJhbSBvcmlnaW4gLSBSZXF1ZXN0IG9yaWdpbiBmb3IgQ09SU1xuICogQHJldHVybnMgQVBJIEdhdGV3YXkgcHJveHkgcmVzdWx0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVWYWxpZGF0aW9uRXJyb3JSZXNwb25zZShcbiAgbWVzc2FnZTogc3RyaW5nLFxuICByZXF1ZXN0SWQ/OiBzdHJpbmcsXG4gIG9yaWdpbj86IHN0cmluZ1xuKTogQVBJR2F0ZXdheVByb3h5UmVzdWx0IHtcbiAgcmV0dXJuIGNyZWF0ZUVycm9yUmVzcG9uc2UoXG4gICAgQXBpRXJyb3JUeXBlLlZBTElEQVRJT05fRVJST1IsXG4gICAgbWVzc2FnZSxcbiAgICBIdHRwU3RhdHVzQ29kZS5CQURfUkVRVUVTVCxcbiAgICByZXF1ZXN0SWQsXG4gICAgb3JpZ2luXG4gICk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuIHVuYXV0aG9yaXplZCBlcnJvciByZXNwb25zZVxuICogXG4gKiBAcGFyYW0gbWVzc2FnZSAtIEVycm9yIG1lc3NhZ2UgKGRlZmF1bHQ6ICdVbmF1dGhvcml6ZWQnKVxuICogQHBhcmFtIHJlcXVlc3RJZCAtIE9wdGlvbmFsIHJlcXVlc3QgSURcbiAqIEBwYXJhbSBvcmlnaW4gLSBSZXF1ZXN0IG9yaWdpbiBmb3IgQ09SU1xuICogQHJldHVybnMgQVBJIEdhdGV3YXkgcHJveHkgcmVzdWx0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVVbmF1dGhvcml6ZWRSZXNwb25zZShcbiAgbWVzc2FnZTogc3RyaW5nID0gJ1VuYXV0aG9yaXplZCcsXG4gIHJlcXVlc3RJZD86IHN0cmluZyxcbiAgb3JpZ2luPzogc3RyaW5nXG4pOiBBUElHYXRld2F5UHJveHlSZXN1bHQge1xuICByZXR1cm4gY3JlYXRlRXJyb3JSZXNwb25zZShcbiAgICBBcGlFcnJvclR5cGUuVU5BVVRIT1JJWkVELFxuICAgIG1lc3NhZ2UsXG4gICAgSHR0cFN0YXR1c0NvZGUuVU5BVVRIT1JJWkVELFxuICAgIHJlcXVlc3RJZCxcbiAgICBvcmlnaW5cbiAgKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBmb3JiaWRkZW4gZXJyb3IgcmVzcG9uc2VcbiAqIFxuICogQHBhcmFtIG1lc3NhZ2UgLSBFcnJvciBtZXNzYWdlIChkZWZhdWx0OiAnRm9yYmlkZGVuJylcbiAqIEBwYXJhbSByZXF1ZXN0SWQgLSBPcHRpb25hbCByZXF1ZXN0IElEXG4gKiBAcGFyYW0gb3JpZ2luIC0gUmVxdWVzdCBvcmlnaW4gZm9yIENPUlNcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRm9yYmlkZGVuUmVzcG9uc2UoXG4gIG1lc3NhZ2U6IHN0cmluZyA9ICdGb3JiaWRkZW4nLFxuICByZXF1ZXN0SWQ/OiBzdHJpbmcsXG4gIG9yaWdpbj86IHN0cmluZ1xuKTogQVBJR2F0ZXdheVByb3h5UmVzdWx0IHtcbiAgcmV0dXJuIGNyZWF0ZUVycm9yUmVzcG9uc2UoXG4gICAgQXBpRXJyb3JUeXBlLkZPUkJJRERFTixcbiAgICBtZXNzYWdlLFxuICAgIEh0dHBTdGF0dXNDb2RlLkZPUkJJRERFTixcbiAgICByZXF1ZXN0SWQsXG4gICAgb3JpZ2luXG4gICk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbm90IGZvdW5kIGVycm9yIHJlc3BvbnNlXG4gKiBcbiAqIEBwYXJhbSBtZXNzYWdlIC0gRXJyb3IgbWVzc2FnZSAoZGVmYXVsdDogJ05vdCBmb3VuZCcpXG4gKiBAcGFyYW0gcmVxdWVzdElkIC0gT3B0aW9uYWwgcmVxdWVzdCBJRFxuICogQHBhcmFtIG9yaWdpbiAtIFJlcXVlc3Qgb3JpZ2luIGZvciBDT1JTXG4gKiBAcmV0dXJucyBBUEkgR2F0ZXdheSBwcm94eSByZXN1bHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vdEZvdW5kUmVzcG9uc2UoXG4gIG1lc3NhZ2U6IHN0cmluZyA9ICdOb3QgZm91bmQnLFxuICByZXF1ZXN0SWQ/OiBzdHJpbmcsXG4gIG9yaWdpbj86IHN0cmluZ1xuKTogQVBJR2F0ZXdheVByb3h5UmVzdWx0IHtcbiAgcmV0dXJuIGNyZWF0ZUVycm9yUmVzcG9uc2UoXG4gICAgQXBpRXJyb3JUeXBlLk5PVF9GT1VORCxcbiAgICBtZXNzYWdlLFxuICAgIEh0dHBTdGF0dXNDb2RlLk5PVF9GT1VORCxcbiAgICByZXF1ZXN0SWQsXG4gICAgb3JpZ2luXG4gICk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuIGludGVybmFsIHNlcnZlciBlcnJvciByZXNwb25zZVxuICogXG4gKiBAcGFyYW0gbWVzc2FnZSAtIEVycm9yIG1lc3NhZ2UgKGRlZmF1bHQ6ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InKVxuICogQHBhcmFtIHJlcXVlc3RJZCAtIE9wdGlvbmFsIHJlcXVlc3QgSURcbiAqIEBwYXJhbSBvcmlnaW4gLSBSZXF1ZXN0IG9yaWdpbiBmb3IgQ09SU1xuICogQHJldHVybnMgQVBJIEdhdGV3YXkgcHJveHkgcmVzdWx0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVJbnRlcm5hbEVycm9yUmVzcG9uc2UoXG4gIG1lc3NhZ2U6IHN0cmluZyA9ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InLFxuICByZXF1ZXN0SWQ/OiBzdHJpbmcsXG4gIG9yaWdpbj86IHN0cmluZ1xuKTogQVBJR2F0ZXdheVByb3h5UmVzdWx0IHtcbiAgcmV0dXJuIGNyZWF0ZUVycm9yUmVzcG9uc2UoXG4gICAgQXBpRXJyb3JUeXBlLklOVEVSTkFMX0VSUk9SLFxuICAgIG1lc3NhZ2UsXG4gICAgSHR0cFN0YXR1c0NvZGUuSU5URVJOQUxfU0VSVkVSX0VSUk9SLFxuICAgIHJlcXVlc3RJZCxcbiAgICBvcmlnaW5cbiAgKTtcbn1cblxuLyoqXG4gKiBIYW5kbGUgTGFtYmRhIGZ1bmN0aW9uIGVycm9ycyBhbmQgY29udmVydCB0byBhcHByb3ByaWF0ZSBIVFRQIHJlc3BvbnNlc1xuICogXG4gKiBAcGFyYW0gZXJyb3IgLSBFcnJvciBvYmplY3RcbiAqIEBwYXJhbSByZXF1ZXN0SWQgLSBSZXF1ZXN0IElEIGZvciBsb2dnaW5nXG4gKiBAcGFyYW0gb3JpZ2luIC0gUmVxdWVzdCBvcmlnaW4gZm9yIENPUlNcbiAqIEByZXR1cm5zIEFQSSBHYXRld2F5IHByb3h5IHJlc3VsdFxuICovXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlTGFtYmRhRXJyb3IoZXJyb3I6IHVua25vd24sIHJlcXVlc3RJZD86IHN0cmluZywgb3JpZ2luPzogc3RyaW5nKTogQVBJR2F0ZXdheVByb3h5UmVzdWx0IHtcbiAgY29uc29sZS5lcnJvcignTGFtYmRhIGVycm9yOicsIGVycm9yLCB7IHJlcXVlc3RJZCB9KTtcbiAgXG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgY29uc3QgbWVzc2FnZSA9IGVycm9yLm1lc3NhZ2U7XG4gICAgXG4gICAgLy8gTWFwIHNwZWNpZmljIGVycm9yIG1lc3NhZ2VzIHRvIEhUVFAgc3RhdHVzIGNvZGVzXG4gICAgaWYgKG1lc3NhZ2UuaW5jbHVkZXMoJ0F1dGhlbnRpY2F0aW9uIHJlcXVpcmVkJykgfHwgbWVzc2FnZS5pbmNsdWRlcygnSldUJykpIHtcbiAgICAgIHJldHVybiBjcmVhdGVVbmF1dGhvcml6ZWRSZXNwb25zZShtZXNzYWdlLCByZXF1ZXN0SWQsIG9yaWdpbik7XG4gICAgfVxuICAgIFxuICAgIGlmIChtZXNzYWdlLmluY2x1ZGVzKCdwcml2aWxlZ2VzIHJlcXVpcmVkJykgfHwgbWVzc2FnZS5pbmNsdWRlcygnRm9yYmlkZGVuJykpIHtcbiAgICAgIHJldHVybiBjcmVhdGVGb3JiaWRkZW5SZXNwb25zZShtZXNzYWdlLCByZXF1ZXN0SWQsIG9yaWdpbik7XG4gICAgfVxuICAgIFxuICAgIGlmIChtZXNzYWdlLmluY2x1ZGVzKCdub3QgZm91bmQnKSB8fCBtZXNzYWdlLmluY2x1ZGVzKCdOb3QgZm91bmQnKSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZU5vdEZvdW5kUmVzcG9uc2UobWVzc2FnZSwgcmVxdWVzdElkLCBvcmlnaW4pO1xuICAgIH1cbiAgICBcbiAgICBpZiAobWVzc2FnZS5pbmNsdWRlcygndmFsaWRhdGlvbicpIHx8IG1lc3NhZ2UuaW5jbHVkZXMoJ0ludmFsaWQnKSkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVZhbGlkYXRpb25FcnJvclJlc3BvbnNlKG1lc3NhZ2UsIHJlcXVlc3RJZCwgb3JpZ2luKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIERlZmF1bHQgdG8gaW50ZXJuYWwgc2VydmVyIGVycm9yXG4gIHJldHVybiBjcmVhdGVJbnRlcm5hbEVycm9yUmVzcG9uc2UoJ0FuIHVuZXhwZWN0ZWQgZXJyb3Igb2NjdXJyZWQnLCByZXF1ZXN0SWQsIG9yaWdpbik7XG59XG5cbi8qKlxuICogTG9nIHN0cnVjdHVyZWQgaW5mb3JtYXRpb24gZm9yIENsb3VkV2F0Y2hcbiAqIFxuICogQHBhcmFtIGxldmVsIC0gTG9nIGxldmVsXG4gKiBAcGFyYW0gbWVzc2FnZSAtIExvZyBtZXNzYWdlXG4gKiBAcGFyYW0gY29udGV4dCAtIEFkZGl0aW9uYWwgY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9nU3RydWN0dXJlZChcbiAgbGV2ZWw6ICdJTkZPJyB8ICdXQVJOJyB8ICdFUlJPUicsXG4gIG1lc3NhZ2U6IHN0cmluZyxcbiAgY29udGV4dDogUmVjb3JkPHN0cmluZywgYW55PiA9IHt9XG4pOiB2b2lkIHtcbiAgY29uc3QgbG9nRW50cnkgPSB7XG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgbGV2ZWwsXG4gICAgbWVzc2FnZSxcbiAgICAuLi5jb250ZXh0LFxuICB9O1xuICBcbiAgY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkobG9nRW50cnkpKTtcbn0iXX0=