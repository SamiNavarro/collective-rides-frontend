/**
 * Club-Specific Errors - Phase 2.1
 *
 * Error definitions specific to club operations.
 * Extends the base error types with club-specific context.
 *
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 */
/**
 * Club not found error
 */
export declare class ClubNotFoundError extends Error {
    readonly statusCode = 404;
    readonly errorType = "NOT_FOUND";
    readonly clubId?: string;
    constructor(clubId?: string);
}
/**
 * Club name conflict error
 */
export declare class ClubNameConflictError extends Error {
    readonly statusCode = 409;
    readonly errorType = "CONFLICT";
    readonly clubName: string;
    constructor(clubName: string);
}
/**
 * Invalid club status error
 */
export declare class InvalidClubStatusError extends Error {
    readonly statusCode = 400;
    readonly errorType = "VALIDATION_ERROR";
    readonly status: string;
    constructor(status: string);
}
/**
 * Club status transition error
 */
export declare class ClubStatusTransitionError extends Error {
    readonly statusCode = 400;
    readonly errorType = "VALIDATION_ERROR";
    readonly fromStatus: string;
    readonly toStatus: string;
    constructor(fromStatus: string, toStatus: string);
}
/**
 * Club validation error
 */
export declare class ClubValidationError extends Error {
    readonly statusCode = 400;
    readonly errorType = "VALIDATION_ERROR";
    readonly field?: string;
    constructor(message: string, field?: string);
}
/**
 * Club operation not allowed error
 */
export declare class ClubOperationNotAllowedError extends Error {
    readonly statusCode = 403;
    readonly errorType = "FORBIDDEN";
    readonly operation: string;
    readonly clubId?: string;
    constructor(operation: string, clubId?: string);
}
/**
 * Check if error is a club-specific error
 */
export declare function isClubError(error: unknown): error is ClubNotFoundError | ClubNameConflictError | InvalidClubStatusError | ClubStatusTransitionError | ClubValidationError | ClubOperationNotAllowedError;
/**
 * Create error response for club errors
 */
export declare function createClubErrorResponse(error: Error, requestId: string): {
    error: string;
    message: string;
    details: {
        clubId?: string | undefined;
        operation?: string | undefined;
        field?: string | undefined;
        fromStatus?: string | undefined;
        toStatus?: string | undefined;
        status?: string | undefined;
        clubName?: string | undefined;
    };
    timestamp: string;
    requestId: string;
} | {
    error: string;
    message: string;
    timestamp: string;
    requestId: string;
    details?: undefined;
};
