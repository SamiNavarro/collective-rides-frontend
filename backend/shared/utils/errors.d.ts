/**
 * Error Utilities - Phase 1.2
 *
 * Standardized error types and handling utilities.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 */
/**
 * Base application error class
 */
export declare abstract class AppError extends Error {
    abstract readonly statusCode: number;
    abstract readonly errorType: string;
    constructor(message: string);
}
/**
 * Authentication error (401)
 */
export declare class AuthenticationError extends AppError {
    readonly statusCode = 401;
    readonly errorType = "UNAUTHORIZED";
    constructor(message?: string);
}
/**
 * Authorization error (403)
 */
export declare class AuthorizationError extends AppError {
    readonly statusCode = 403;
    readonly errorType = "FORBIDDEN";
    constructor(message?: string);
}
/**
 * Not found error (404)
 */
export declare class NotFoundError extends AppError {
    readonly statusCode = 404;
    readonly errorType = "NOT_FOUND";
    constructor(message?: string);
}
/**
 * Validation error (400)
 */
export declare class ValidationError extends AppError {
    readonly statusCode = 400;
    readonly errorType = "VALIDATION_ERROR";
    constructor(message: string);
}
/**
 * Conflict error (409)
 */
export declare class ConflictError extends AppError {
    readonly statusCode = 409;
    readonly errorType = "CONFLICT";
    constructor(message?: string);
}
/**
 * Internal server error (500)
 */
export declare class InternalError extends AppError {
    readonly statusCode = 500;
    readonly errorType = "INTERNAL_ERROR";
    constructor(message?: string);
}
/**
 * Check if error is an application error
 *
 * @param error - Error to check
 * @returns True if it's an AppError
 */
export declare function isAppError(error: unknown): error is AppError;
/**
 * Get error message from unknown error
 *
 * @param error - Unknown error
 * @returns Error message string
 */
export declare function getErrorMessage(error: unknown): string;
/**
 * Get HTTP status code from error
 *
 * @param error - Error object
 * @returns HTTP status code
 */
export declare function getErrorStatusCode(error: unknown): number;
/**
 * Get error type from error
 *
 * @param error - Error object
 * @returns Error type string
 */
export declare function getErrorType(error: unknown): string;
