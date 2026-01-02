"use strict";
/**
 * Error Utilities - Phase 1.2
 *
 * Standardized error types and handling utilities.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getErrorType = exports.getErrorStatusCode = exports.getErrorMessage = exports.isAppError = exports.InternalError = exports.ConflictError = exports.ValidationError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.AppError = void 0;
/**
 * Base application error class
 */
class AppError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
exports.AppError = AppError;
/**
 * Authentication error (401)
 */
class AuthenticationError extends AppError {
    constructor(message = 'Authentication required') {
        super(message);
        this.statusCode = 401;
        this.errorType = 'UNAUTHORIZED';
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Authorization error (403)
 */
class AuthorizationError extends AppError {
    constructor(message = 'Insufficient privileges') {
        super(message);
        this.statusCode = 403;
        this.errorType = 'FORBIDDEN';
    }
}
exports.AuthorizationError = AuthorizationError;
/**
 * Not found error (404)
 */
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message);
        this.statusCode = 404;
        this.errorType = 'NOT_FOUND';
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Validation error (400)
 */
class ValidationError extends AppError {
    constructor(message) {
        super(message);
        this.statusCode = 400;
        this.errorType = 'VALIDATION_ERROR';
    }
}
exports.ValidationError = ValidationError;
/**
 * Conflict error (409)
 */
class ConflictError extends AppError {
    constructor(message = 'Resource conflict') {
        super(message);
        this.statusCode = 409;
        this.errorType = 'CONFLICT';
    }
}
exports.ConflictError = ConflictError;
/**
 * Internal server error (500)
 */
class InternalError extends AppError {
    constructor(message = 'Internal server error') {
        super(message);
        this.statusCode = 500;
        this.errorType = 'INTERNAL_ERROR';
    }
}
exports.InternalError = InternalError;
/**
 * Check if error is an application error
 *
 * @param error - Error to check
 * @returns True if it's an AppError
 */
function isAppError(error) {
    return error instanceof AppError;
}
exports.isAppError = isAppError;
/**
 * Get error message from unknown error
 *
 * @param error - Unknown error
 * @returns Error message string
 */
function getErrorMessage(error) {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return 'Unknown error occurred';
}
exports.getErrorMessage = getErrorMessage;
/**
 * Get HTTP status code from error
 *
 * @param error - Error object
 * @returns HTTP status code
 */
function getErrorStatusCode(error) {
    if (isAppError(error)) {
        return error.statusCode;
    }
    return 500; // Default to internal server error
}
exports.getErrorStatusCode = getErrorStatusCode;
/**
 * Get error type from error
 *
 * @param error - Error object
 * @returns Error type string
 */
function getErrorType(error) {
    if (isAppError(error)) {
        return error.errorType;
    }
    return 'INTERNAL_ERROR';
}
exports.getErrorType = getErrorType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXJyb3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZXJyb3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7OztHQU9HOzs7QUFFSDs7R0FFRztBQUNILE1BQXNCLFFBQVMsU0FBUSxLQUFLO0lBSTFDLFlBQVksT0FBZTtRQUN6QixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDZixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDO0lBQ3BDLENBQUM7Q0FDRjtBQVJELDRCQVFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLG1CQUFvQixTQUFRLFFBQVE7SUFJL0MsWUFBWSxVQUFrQix5QkFBeUI7UUFDckQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBSlIsZUFBVSxHQUFHLEdBQUcsQ0FBQztRQUNqQixjQUFTLEdBQUcsY0FBYyxDQUFDO0lBSXBDLENBQUM7Q0FDRjtBQVBELGtEQU9DO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLGtCQUFtQixTQUFRLFFBQVE7SUFJOUMsWUFBWSxVQUFrQix5QkFBeUI7UUFDckQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBSlIsZUFBVSxHQUFHLEdBQUcsQ0FBQztRQUNqQixjQUFTLEdBQUcsV0FBVyxDQUFDO0lBSWpDLENBQUM7Q0FDRjtBQVBELGdEQU9DO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLGFBQWMsU0FBUSxRQUFRO0lBSXpDLFlBQVksVUFBa0Isb0JBQW9CO1FBQ2hELEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUpSLGVBQVUsR0FBRyxHQUFHLENBQUM7UUFDakIsY0FBUyxHQUFHLFdBQVcsQ0FBQztJQUlqQyxDQUFDO0NBQ0Y7QUFQRCxzQ0FPQztBQUVEOztHQUVHO0FBQ0gsTUFBYSxlQUFnQixTQUFRLFFBQVE7SUFJM0MsWUFBWSxPQUFlO1FBQ3pCLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUpSLGVBQVUsR0FBRyxHQUFHLENBQUM7UUFDakIsY0FBUyxHQUFHLGtCQUFrQixDQUFDO0lBSXhDLENBQUM7Q0FDRjtBQVBELDBDQU9DO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLGFBQWMsU0FBUSxRQUFRO0lBSXpDLFlBQVksVUFBa0IsbUJBQW1CO1FBQy9DLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUpSLGVBQVUsR0FBRyxHQUFHLENBQUM7UUFDakIsY0FBUyxHQUFHLFVBQVUsQ0FBQztJQUloQyxDQUFDO0NBQ0Y7QUFQRCxzQ0FPQztBQUVEOztHQUVHO0FBQ0gsTUFBYSxhQUFjLFNBQVEsUUFBUTtJQUl6QyxZQUFZLFVBQWtCLHVCQUF1QjtRQUNuRCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFKUixlQUFVLEdBQUcsR0FBRyxDQUFDO1FBQ2pCLGNBQVMsR0FBRyxnQkFBZ0IsQ0FBQztJQUl0QyxDQUFDO0NBQ0Y7QUFQRCxzQ0FPQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsVUFBVSxDQUFDLEtBQWM7SUFDdkMsT0FBTyxLQUFLLFlBQVksUUFBUSxDQUFDO0FBQ25DLENBQUM7QUFGRCxnQ0FFQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsZUFBZSxDQUFDLEtBQWM7SUFDNUMsSUFBSSxLQUFLLFlBQVksS0FBSyxFQUFFO1FBQzFCLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQztLQUN0QjtJQUVELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1FBQzdCLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxPQUFPLHdCQUF3QixDQUFDO0FBQ2xDLENBQUM7QUFWRCwwQ0FVQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0Isa0JBQWtCLENBQUMsS0FBYztJQUMvQyxJQUFJLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNyQixPQUFPLEtBQUssQ0FBQyxVQUFVLENBQUM7S0FDekI7SUFFRCxPQUFPLEdBQUcsQ0FBQyxDQUFDLG1DQUFtQztBQUNqRCxDQUFDO0FBTkQsZ0RBTUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLFlBQVksQ0FBQyxLQUFjO0lBQ3pDLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3JCLE9BQU8sS0FBSyxDQUFDLFNBQVMsQ0FBQztLQUN4QjtJQUVELE9BQU8sZ0JBQWdCLENBQUM7QUFDMUIsQ0FBQztBQU5ELG9DQU1DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBFcnJvciBVdGlsaXRpZXMgLSBQaGFzZSAxLjJcbiAqIFxuICogU3RhbmRhcmRpemVkIGVycm9yIHR5cGVzIGFuZCBoYW5kbGluZyB1dGlsaXRpZXMuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDEuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0xLjIudXNlci1wcm9maWxlLnYxLm1kXG4gKi9cblxuLyoqXG4gKiBCYXNlIGFwcGxpY2F0aW9uIGVycm9yIGNsYXNzXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBBcHBFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgYWJzdHJhY3QgcmVhZG9ubHkgc3RhdHVzQ29kZTogbnVtYmVyO1xuICBhYnN0cmFjdCByZWFkb25seSBlcnJvclR5cGU6IHN0cmluZztcbiAgXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9IHRoaXMuY29uc3RydWN0b3IubmFtZTtcbiAgfVxufVxuXG4vKipcbiAqIEF1dGhlbnRpY2F0aW9uIGVycm9yICg0MDEpXG4gKi9cbmV4cG9ydCBjbGFzcyBBdXRoZW50aWNhdGlvbkVycm9yIGV4dGVuZHMgQXBwRXJyb3Ige1xuICByZWFkb25seSBzdGF0dXNDb2RlID0gNDAxO1xuICByZWFkb25seSBlcnJvclR5cGUgPSAnVU5BVVRIT1JJWkVEJztcbiAgXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZyA9ICdBdXRoZW50aWNhdGlvbiByZXF1aXJlZCcpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgfVxufVxuXG4vKipcbiAqIEF1dGhvcml6YXRpb24gZXJyb3IgKDQwMylcbiAqL1xuZXhwb3J0IGNsYXNzIEF1dGhvcml6YXRpb25FcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgcmVhZG9ubHkgc3RhdHVzQ29kZSA9IDQwMztcbiAgcmVhZG9ubHkgZXJyb3JUeXBlID0gJ0ZPUkJJRERFTic7XG4gIFxuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcgPSAnSW5zdWZmaWNpZW50IHByaXZpbGVnZXMnKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBOb3QgZm91bmQgZXJyb3IgKDQwNClcbiAqL1xuZXhwb3J0IGNsYXNzIE5vdEZvdW5kRXJyb3IgZXh0ZW5kcyBBcHBFcnJvciB7XG4gIHJlYWRvbmx5IHN0YXR1c0NvZGUgPSA0MDQ7XG4gIHJlYWRvbmx5IGVycm9yVHlwZSA9ICdOT1RfRk9VTkQnO1xuICBcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nID0gJ1Jlc291cmNlIG5vdCBmb3VuZCcpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRpb24gZXJyb3IgKDQwMClcbiAqL1xuZXhwb3J0IGNsYXNzIFZhbGlkYXRpb25FcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgcmVhZG9ubHkgc3RhdHVzQ29kZSA9IDQwMDtcbiAgcmVhZG9ubHkgZXJyb3JUeXBlID0gJ1ZBTElEQVRJT05fRVJST1InO1xuICBcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb25mbGljdCBlcnJvciAoNDA5KVxuICovXG5leHBvcnQgY2xhc3MgQ29uZmxpY3RFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgcmVhZG9ubHkgc3RhdHVzQ29kZSA9IDQwOTtcbiAgcmVhZG9ubHkgZXJyb3JUeXBlID0gJ0NPTkZMSUNUJztcbiAgXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZyA9ICdSZXNvdXJjZSBjb25mbGljdCcpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgfVxufVxuXG4vKipcbiAqIEludGVybmFsIHNlcnZlciBlcnJvciAoNTAwKVxuICovXG5leHBvcnQgY2xhc3MgSW50ZXJuYWxFcnJvciBleHRlbmRzIEFwcEVycm9yIHtcbiAgcmVhZG9ubHkgc3RhdHVzQ29kZSA9IDUwMDtcbiAgcmVhZG9ubHkgZXJyb3JUeXBlID0gJ0lOVEVSTkFMX0VSUk9SJztcbiAgXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZyA9ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiBlcnJvciBpcyBhbiBhcHBsaWNhdGlvbiBlcnJvclxuICogXG4gKiBAcGFyYW0gZXJyb3IgLSBFcnJvciB0byBjaGVja1xuICogQHJldHVybnMgVHJ1ZSBpZiBpdCdzIGFuIEFwcEVycm9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0FwcEVycm9yKGVycm9yOiB1bmtub3duKTogZXJyb3IgaXMgQXBwRXJyb3Ige1xuICByZXR1cm4gZXJyb3IgaW5zdGFuY2VvZiBBcHBFcnJvcjtcbn1cblxuLyoqXG4gKiBHZXQgZXJyb3IgbWVzc2FnZSBmcm9tIHVua25vd24gZXJyb3JcbiAqIFxuICogQHBhcmFtIGVycm9yIC0gVW5rbm93biBlcnJvclxuICogQHJldHVybnMgRXJyb3IgbWVzc2FnZSBzdHJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEVycm9yTWVzc2FnZShlcnJvcjogdW5rbm93bik6IHN0cmluZyB7XG4gIGlmIChlcnJvciBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgcmV0dXJuIGVycm9yLm1lc3NhZ2U7XG4gIH1cbiAgXG4gIGlmICh0eXBlb2YgZXJyb3IgPT09ICdzdHJpbmcnKSB7XG4gICAgcmV0dXJuIGVycm9yO1xuICB9XG4gIFxuICByZXR1cm4gJ1Vua25vd24gZXJyb3Igb2NjdXJyZWQnO1xufVxuXG4vKipcbiAqIEdldCBIVFRQIHN0YXR1cyBjb2RlIGZyb20gZXJyb3JcbiAqIFxuICogQHBhcmFtIGVycm9yIC0gRXJyb3Igb2JqZWN0XG4gKiBAcmV0dXJucyBIVFRQIHN0YXR1cyBjb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRFcnJvclN0YXR1c0NvZGUoZXJyb3I6IHVua25vd24pOiBudW1iZXIge1xuICBpZiAoaXNBcHBFcnJvcihlcnJvcikpIHtcbiAgICByZXR1cm4gZXJyb3Iuc3RhdHVzQ29kZTtcbiAgfVxuICBcbiAgcmV0dXJuIDUwMDsgLy8gRGVmYXVsdCB0byBpbnRlcm5hbCBzZXJ2ZXIgZXJyb3Jcbn1cblxuLyoqXG4gKiBHZXQgZXJyb3IgdHlwZSBmcm9tIGVycm9yXG4gKiBcbiAqIEBwYXJhbSBlcnJvciAtIEVycm9yIG9iamVjdFxuICogQHJldHVybnMgRXJyb3IgdHlwZSBzdHJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEVycm9yVHlwZShlcnJvcjogdW5rbm93bik6IHN0cmluZyB7XG4gIGlmIChpc0FwcEVycm9yKGVycm9yKSkge1xuICAgIHJldHVybiBlcnJvci5lcnJvclR5cGU7XG4gIH1cbiAgXG4gIHJldHVybiAnSU5URVJOQUxfRVJST1InO1xufSJdfQ==