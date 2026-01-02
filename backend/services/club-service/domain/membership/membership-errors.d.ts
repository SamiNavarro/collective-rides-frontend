/**
 * Membership-Specific Errors - Phase 2.2
 *
 * Error definitions specific to club membership operations.
 * Extends the base error types with membership-specific context.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
/**
 * Membership not found error
 */
export declare class MembershipNotFoundError extends Error {
    readonly statusCode = 404;
    readonly errorType = "MEMBERSHIP_NOT_FOUND";
    readonly membershipId?: string;
    readonly clubId?: string;
    readonly userId?: string;
    constructor(membershipId?: string, clubId?: string, userId?: string);
}
/**
 * Already member error
 */
export declare class AlreadyMemberError extends Error {
    readonly statusCode = 409;
    readonly errorType = "ALREADY_MEMBER";
    readonly clubId: string;
    readonly userId: string;
    constructor(clubId: string, userId: string);
}
/**
 * Membership limit exceeded error
 */
export declare class MembershipLimitExceededError extends Error {
    readonly statusCode = 409;
    readonly errorType = "MEMBERSHIP_LIMIT_EXCEEDED";
    readonly clubId: string;
    readonly currentCount: number;
    readonly maxLimit: number;
    constructor(clubId: string, currentCount: number, maxLimit: number);
}
/**
 * Invalid role transition error
 */
export declare class InvalidRoleTransitionError extends Error {
    readonly statusCode = 400;
    readonly errorType = "INVALID_ROLE_TRANSITION";
    readonly fromRole: string;
    readonly toRole: string;
    constructor(fromRole: string, toRole: string);
}
/**
 * Cannot remove owner error
 */
export declare class CannotRemoveOwnerError extends Error {
    readonly statusCode = 400;
    readonly errorType = "CANNOT_REMOVE_OWNER";
    readonly clubId: string;
    readonly userId: string;
    constructor(clubId: string, userId: string);
}
/**
 * Invalid membership status transition error
 */
export declare class InvalidMembershipStatusTransitionError extends Error {
    readonly statusCode = 400;
    readonly errorType = "INVALID_MEMBERSHIP_STATUS_TRANSITION";
    readonly fromStatus: string;
    readonly toStatus: string;
    constructor(fromStatus: string, toStatus: string);
}
/**
 * Membership operation not allowed error
 */
export declare class MembershipOperationNotAllowedError extends Error {
    readonly statusCode = 403;
    readonly errorType = "MEMBERSHIP_OPERATION_NOT_ALLOWED";
    readonly operation: string;
    readonly membershipId?: string;
    readonly reason?: string;
    constructor(operation: string, membershipId?: string, reason?: string);
}
/**
 * Check if error is a membership-specific error
 */
export declare function isMembershipError(error: unknown): error is MembershipNotFoundError | AlreadyMemberError | MembershipLimitExceededError | InvalidRoleTransitionError | CannotRemoveOwnerError | InvalidMembershipStatusTransitionError | MembershipOperationNotAllowedError;
/**
 * Create error response for membership errors
 */
export declare function createMembershipErrorResponse(error: Error, requestId: string): {
    error: string;
    message: string;
    details: {
        operation?: string | undefined;
        membershipId?: string | undefined;
        reason?: string | undefined;
        fromStatus?: string | undefined;
        toStatus?: string | undefined;
        clubId?: string | undefined;
        userId?: string | undefined;
        fromRole?: string | undefined;
        toRole?: string | undefined;
        currentCount?: number | undefined;
        maxLimit?: number | undefined;
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
