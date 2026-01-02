/**
 * Invitation-Specific Errors - Phase 2.2
 *
 * Error definitions specific to club invitation operations.
 * Extends the base error types with invitation-specific context.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
/**
 * Invitation not found error
 */
export declare class InvitationNotFoundError extends Error {
    readonly statusCode = 404;
    readonly errorType = "INVITATION_NOT_FOUND";
    readonly invitationId?: string;
    constructor(invitationId?: string);
}
/**
 * Invitation expired error
 */
export declare class InvitationExpiredError extends Error {
    readonly statusCode = 410;
    readonly errorType = "INVITATION_EXPIRED";
    readonly invitationId: string;
    readonly expiresAt: string;
    constructor(invitationId: string, expiresAt: string);
}
/**
 * Invitation already processed error
 */
export declare class InvitationAlreadyProcessedError extends Error {
    readonly statusCode = 409;
    readonly errorType = "INVITATION_ALREADY_PROCESSED";
    readonly invitationId: string;
    readonly status: string;
    constructor(invitationId: string, status: string);
}
/**
 * Invalid invitation token error
 */
export declare class InvalidInvitationTokenError extends Error {
    readonly statusCode = 401;
    readonly errorType = "INVALID_INVITATION_TOKEN";
    readonly token?: string;
    constructor(token?: string);
}
/**
 * User already invited error
 */
export declare class UserAlreadyInvitedError extends Error {
    readonly statusCode = 409;
    readonly errorType = "USER_ALREADY_INVITED";
    readonly clubId: string;
    readonly email?: string;
    readonly userId?: string;
    constructor(clubId: string, email?: string, userId?: string);
}
/**
 * Cannot invite existing member error
 */
export declare class CannotInviteExistingMemberError extends Error {
    readonly statusCode = 409;
    readonly errorType = "CANNOT_INVITE_EXISTING_MEMBER";
    readonly clubId: string;
    readonly userId: string;
    constructor(clubId: string, userId: string);
}
/**
 * Invitation operation not allowed error
 */
export declare class InvitationOperationNotAllowedError extends Error {
    readonly statusCode = 403;
    readonly errorType = "INVITATION_OPERATION_NOT_ALLOWED";
    readonly operation: string;
    readonly invitationId?: string;
    readonly reason?: string;
    constructor(operation: string, invitationId?: string, reason?: string);
}
/**
 * Check if error is an invitation-specific error
 */
export declare function isInvitationError(error: unknown): error is InvitationNotFoundError | InvitationExpiredError | InvitationAlreadyProcessedError | InvalidInvitationTokenError | UserAlreadyInvitedError | CannotInviteExistingMemberError | InvitationOperationNotAllowedError;
/**
 * Create error response for invitation errors
 */
export declare function createInvitationErrorResponse(error: Error, requestId: string): {
    error: string;
    message: string;
    details: {
        operation?: string | undefined;
        invitationId?: string | undefined;
        reason?: string | undefined;
        clubId?: string | undefined;
        userId?: string | undefined;
        email?: string | undefined;
        token?: string | undefined;
        status?: string | undefined;
        expiresAt?: string | undefined;
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
