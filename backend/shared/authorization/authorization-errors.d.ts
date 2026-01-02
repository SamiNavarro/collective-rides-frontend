/**
 * Authorization Errors - Phase 1.3
 *
 * Error definitions and handling for authorization operations.
 * Provides structured error types with appropriate HTTP status codes.
 *
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */
import { SystemCapability } from './types';
/**
 * Authorization error types
 */
export declare enum AuthorizationErrorType {
    INSUFFICIENT_PRIVILEGES = "INSUFFICIENT_PRIVILEGES",
    CAPABILITY_NOT_FOUND = "CAPABILITY_NOT_FOUND",
    AUTHORIZATION_SERVICE_ERROR = "AUTHORIZATION_SERVICE_ERROR",
    USER_DATA_UNAVAILABLE = "USER_DATA_UNAVAILABLE"
}
/**
 * Base authorization error class
 */
export declare class AuthorizationError extends Error {
    readonly errorType: AuthorizationErrorType;
    readonly statusCode: number;
    readonly capability?: SystemCapability;
    readonly userId?: string;
    readonly resource?: string;
    readonly cause?: Error;
    constructor(message: string, errorType: AuthorizationErrorType, statusCode?: number, options?: {
        capability?: SystemCapability;
        userId?: string;
        resource?: string;
        cause?: Error;
    });
}
/**
 * Insufficient privileges error
 */
export declare class InsufficientPrivilegesError extends AuthorizationError {
    constructor(capability: SystemCapability | string, userId?: string, resource?: string);
}
/**
 * Capability not found error
 */
export declare class CapabilityNotFoundError extends AuthorizationError {
    constructor(capability: string);
}
/**
 * Authorization service error
 */
export declare class AuthorizationServiceError extends AuthorizationError {
    constructor(message: string, cause?: Error);
}
/**
 * User data unavailable error
 */
export declare class UserDataUnavailableError extends AuthorizationError {
    constructor(userId: string, cause?: Error);
}
/**
 * Create authorization error response object
 */
export declare function createAuthorizationErrorResponse(error: AuthorizationError, requestId: string): {
    error: AuthorizationErrorType;
    message: string;
    details: {
        requiredCapability: SystemCapability | undefined;
        userId: string | undefined;
        resource: string | undefined;
    };
    timestamp: string;
    requestId: string;
};
/**
 * Check if error is an authorization error
 */
export declare function isAuthorizationError(error: unknown): error is AuthorizationError;
