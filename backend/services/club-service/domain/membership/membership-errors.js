"use strict";
/**
 * Membership-Specific Errors - Phase 2.2
 *
 * Error definitions specific to club membership operations.
 * Extends the base error types with membership-specific context.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMembershipErrorResponse = exports.isMembershipError = exports.MembershipOperationNotAllowedError = exports.InvalidMembershipStatusTransitionError = exports.CannotRemoveOwnerError = exports.InvalidRoleTransitionError = exports.MembershipLimitExceededError = exports.AlreadyMemberError = exports.MembershipNotFoundError = void 0;
/**
 * Membership not found error
 */
class MembershipNotFoundError extends Error {
    constructor(membershipId, clubId, userId) {
        super('Membership not found');
        this.statusCode = 404;
        this.errorType = 'MEMBERSHIP_NOT_FOUND';
        this.name = 'MembershipNotFoundError';
        this.membershipId = membershipId;
        this.clubId = clubId;
        this.userId = userId;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MembershipNotFoundError);
        }
    }
}
exports.MembershipNotFoundError = MembershipNotFoundError;
/**
 * Already member error
 */
class AlreadyMemberError extends Error {
    constructor(clubId, userId) {
        super('User is already a member of this club');
        this.statusCode = 409;
        this.errorType = 'ALREADY_MEMBER';
        this.name = 'AlreadyMemberError';
        this.clubId = clubId;
        this.userId = userId;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AlreadyMemberError);
        }
    }
}
exports.AlreadyMemberError = AlreadyMemberError;
/**
 * Membership limit exceeded error
 */
class MembershipLimitExceededError extends Error {
    constructor(clubId, currentCount, maxLimit) {
        super(`Club membership limit exceeded (${currentCount}/${maxLimit})`);
        this.statusCode = 409;
        this.errorType = 'MEMBERSHIP_LIMIT_EXCEEDED';
        this.name = 'MembershipLimitExceededError';
        this.clubId = clubId;
        this.currentCount = currentCount;
        this.maxLimit = maxLimit;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MembershipLimitExceededError);
        }
    }
}
exports.MembershipLimitExceededError = MembershipLimitExceededError;
/**
 * Invalid role transition error
 */
class InvalidRoleTransitionError extends Error {
    constructor(fromRole, toRole) {
        super(`Invalid role transition from ${fromRole} to ${toRole}`);
        this.statusCode = 400;
        this.errorType = 'INVALID_ROLE_TRANSITION';
        this.name = 'InvalidRoleTransitionError';
        this.fromRole = fromRole;
        this.toRole = toRole;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidRoleTransitionError);
        }
    }
}
exports.InvalidRoleTransitionError = InvalidRoleTransitionError;
/**
 * Cannot remove owner error
 */
class CannotRemoveOwnerError extends Error {
    constructor(clubId, userId) {
        super('Cannot remove club owner - ownership transfer required');
        this.statusCode = 400;
        this.errorType = 'CANNOT_REMOVE_OWNER';
        this.name = 'CannotRemoveOwnerError';
        this.clubId = clubId;
        this.userId = userId;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CannotRemoveOwnerError);
        }
    }
}
exports.CannotRemoveOwnerError = CannotRemoveOwnerError;
/**
 * Invalid membership status transition error
 */
class InvalidMembershipStatusTransitionError extends Error {
    constructor(fromStatus, toStatus) {
        super(`Invalid membership status transition from ${fromStatus} to ${toStatus}`);
        this.statusCode = 400;
        this.errorType = 'INVALID_MEMBERSHIP_STATUS_TRANSITION';
        this.name = 'InvalidMembershipStatusTransitionError';
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidMembershipStatusTransitionError);
        }
    }
}
exports.InvalidMembershipStatusTransitionError = InvalidMembershipStatusTransitionError;
/**
 * Membership operation not allowed error
 */
class MembershipOperationNotAllowedError extends Error {
    constructor(operation, membershipId, reason) {
        super(`Membership operation not allowed: ${operation}${reason ? ` - ${reason}` : ''}`);
        this.statusCode = 403;
        this.errorType = 'MEMBERSHIP_OPERATION_NOT_ALLOWED';
        this.name = 'MembershipOperationNotAllowedError';
        this.operation = operation;
        this.membershipId = membershipId;
        this.reason = reason;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, MembershipOperationNotAllowedError);
        }
    }
}
exports.MembershipOperationNotAllowedError = MembershipOperationNotAllowedError;
/**
 * Check if error is a membership-specific error
 */
function isMembershipError(error) {
    return error instanceof MembershipNotFoundError ||
        error instanceof AlreadyMemberError ||
        error instanceof MembershipLimitExceededError ||
        error instanceof InvalidRoleTransitionError ||
        error instanceof CannotRemoveOwnerError ||
        error instanceof InvalidMembershipStatusTransitionError ||
        error instanceof MembershipOperationNotAllowedError;
}
exports.isMembershipError = isMembershipError;
/**
 * Create error response for membership errors
 */
function createMembershipErrorResponse(error, requestId) {
    if (isMembershipError(error)) {
        return {
            error: error.errorType,
            message: error.message,
            details: {
                ...(error instanceof MembershipNotFoundError && {
                    membershipId: error.membershipId,
                    clubId: error.clubId,
                    userId: error.userId,
                }),
                ...(error instanceof AlreadyMemberError && {
                    clubId: error.clubId,
                    userId: error.userId,
                }),
                ...(error instanceof MembershipLimitExceededError && {
                    clubId: error.clubId,
                    currentCount: error.currentCount,
                    maxLimit: error.maxLimit,
                }),
                ...(error instanceof InvalidRoleTransitionError && {
                    fromRole: error.fromRole,
                    toRole: error.toRole,
                }),
                ...(error instanceof CannotRemoveOwnerError && {
                    clubId: error.clubId,
                    userId: error.userId,
                }),
                ...(error instanceof InvalidMembershipStatusTransitionError && {
                    fromStatus: error.fromStatus,
                    toStatus: error.toStatus,
                }),
                ...(error instanceof MembershipOperationNotAllowedError && {
                    operation: error.operation,
                    membershipId: error.membershipId,
                    reason: error.reason,
                }),
            },
            timestamp: new Date().toISOString(),
            requestId,
        };
    }
    // Fallback for non-membership errors
    return {
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId,
    };
}
exports.createMembershipErrorResponse = createMembershipErrorResponse;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVtYmVyc2hpcC1lcnJvcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtZW1iZXJzaGlwLWVycm9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUVIOztHQUVHO0FBQ0gsTUFBYSx1QkFBd0IsU0FBUSxLQUFLO0lBT2hELFlBQVksWUFBcUIsRUFBRSxNQUFlLEVBQUUsTUFBZTtRQUNqRSxLQUFLLENBQUMsc0JBQXNCLENBQUMsQ0FBQztRQVBoQixlQUFVLEdBQUcsR0FBRyxDQUFDO1FBQ2pCLGNBQVMsR0FBRyxzQkFBc0IsQ0FBQztRQU9qRCxJQUFJLENBQUMsSUFBSSxHQUFHLHlCQUF5QixDQUFDO1FBQ3RDLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBRXJCLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFO1lBQzNCLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztTQUN4RDtJQUNILENBQUM7Q0FDRjtBQWxCRCwwREFrQkM7QUFFRDs7R0FFRztBQUNILE1BQWEsa0JBQW1CLFNBQVEsS0FBSztJQU0zQyxZQUFZLE1BQWMsRUFBRSxNQUFjO1FBQ3hDLEtBQUssQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO1FBTmpDLGVBQVUsR0FBRyxHQUFHLENBQUM7UUFDakIsY0FBUyxHQUFHLGdCQUFnQixDQUFDO1FBTTNDLElBQUksQ0FBQyxJQUFJLEdBQUcsb0JBQW9CLENBQUM7UUFDakMsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDckIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFFckIsSUFBSSxLQUFLLENBQUMsaUJBQWlCLEVBQUU7WUFDM0IsS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksRUFBRSxr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S0FBSyxFQUFFLGdCQUFnQjtRQUN2QixPQUFPLEVBQUUsOEJBQThCO1FBQ3ZDLFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtRQUNuQyxTQUFTO0tBQ1YsQ0FBQztBQUNKLENBQUM7QUFsREQsc0VBa0RDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNZW1iZXJzaGlwLVNwZWNpZmljIEVycm9ycyAtIFBoYXNlIDIuMlxuICogXG4gKiBFcnJvciBkZWZpbml0aW9ucyBzcGVjaWZpYyB0byBjbHViIG1lbWJlcnNoaXAgb3BlcmF0aW9ucy5cbiAqIEV4dGVuZHMgdGhlIGJhc2UgZXJyb3IgdHlwZXMgd2l0aCBtZW1iZXJzaGlwLXNwZWNpZmljIGNvbnRleHQuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDIuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0yLjIuY2x1Yi1tZW1iZXJzaGlwLXJvbGVzLnYxLm1kXG4gKi9cblxuLyoqXG4gKiBNZW1iZXJzaGlwIG5vdCBmb3VuZCBlcnJvclxuICovXG5leHBvcnQgY2xhc3MgTWVtYmVyc2hpcE5vdEZvdW5kRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIHB1YmxpYyByZWFkb25seSBzdGF0dXNDb2RlID0gNDA0O1xuICBwdWJsaWMgcmVhZG9ubHkgZXJyb3JUeXBlID0gJ01FTUJFUlNISVBfTk9UX0ZPVU5EJztcbiAgcHVibGljIHJlYWRvbmx5IG1lbWJlcnNoaXBJZD86IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IGNsdWJJZD86IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJJZD86IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihtZW1iZXJzaGlwSWQ/OiBzdHJpbmcsIGNsdWJJZD86IHN0cmluZywgdXNlcklkPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoJ01lbWJlcnNoaXAgbm90IGZvdW5kJyk7XG4gICAgdGhpcy5uYW1lID0gJ01lbWJlcnNoaXBOb3RGb3VuZEVycm9yJztcbiAgICB0aGlzLm1lbWJlcnNoaXBJZCA9IG1lbWJlcnNoaXBJZDtcbiAgICB0aGlzLmNsdWJJZCA9IGNsdWJJZDtcbiAgICB0aGlzLnVzZXJJZCA9IHVzZXJJZDtcblxuICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgTWVtYmVyc2hpcE5vdEZvdW5kRXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFscmVhZHkgbWVtYmVyIGVycm9yXG4gKi9cbmV4cG9ydCBjbGFzcyBBbHJlYWR5TWVtYmVyRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIHB1YmxpYyByZWFkb25seSBzdGF0dXNDb2RlID0gNDA5O1xuICBwdWJsaWMgcmVhZG9ubHkgZXJyb3JUeXBlID0gJ0FMUkVBRFlfTUVNQkVSJztcbiAgcHVibGljIHJlYWRvbmx5IGNsdWJJZDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgdXNlcklkOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoY2x1YklkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKSB7XG4gICAgc3VwZXIoJ1VzZXIgaXMgYWxyZWFkeSBhIG1lbWJlciBvZiB0aGlzIGNsdWInKTtcbiAgICB0aGlzLm5hbWUgPSAnQWxyZWFkeU1lbWJlckVycm9yJztcbiAgICB0aGlzLmNsdWJJZCA9IGNsdWJJZDtcbiAgICB0aGlzLnVzZXJJZCA9IHVzZXJJZDtcblxuICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgQWxyZWFkeU1lbWJlckVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBNZW1iZXJzaGlwIGxpbWl0IGV4Y2VlZGVkIGVycm9yXG4gKi9cbmV4cG9ydCBjbGFzcyBNZW1iZXJzaGlwTGltaXRFeGNlZWRlZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBwdWJsaWMgcmVhZG9ubHkgc3RhdHVzQ29kZSA9IDQwOTtcbiAgcHVibGljIHJlYWRvbmx5IGVycm9yVHlwZSA9ICdNRU1CRVJTSElQX0xJTUlUX0VYQ0VFREVEJztcbiAgcHVibGljIHJlYWRvbmx5IGNsdWJJZDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgY3VycmVudENvdW50OiBudW1iZXI7XG4gIHB1YmxpYyByZWFkb25seSBtYXhMaW1pdDogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKGNsdWJJZDogc3RyaW5nLCBjdXJyZW50Q291bnQ6IG51bWJlciwgbWF4TGltaXQ6IG51bWJlcikge1xuICAgIHN1cGVyKGBDbHViIG1lbWJlcnNoaXAgbGltaXQgZXhjZWVkZWQgKCR7Y3VycmVudENvdW50fS8ke21heExpbWl0fSlgKTtcbiAgICB0aGlzLm5hbWUgPSAnTWVtYmVyc2hpcExpbWl0RXhjZWVkZWRFcnJvcic7XG4gICAgdGhpcy5jbHViSWQgPSBjbHViSWQ7XG4gICAgdGhpcy5jdXJyZW50Q291bnQgPSBjdXJyZW50Q291bnQ7XG4gICAgdGhpcy5tYXhMaW1pdCA9IG1heExpbWl0O1xuXG4gICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBNZW1iZXJzaGlwTGltaXRFeGNlZWRlZEVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbnZhbGlkIHJvbGUgdHJhbnNpdGlvbiBlcnJvclxuICovXG5leHBvcnQgY2xhc3MgSW52YWxpZFJvbGVUcmFuc2l0aW9uRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIHB1YmxpYyByZWFkb25seSBzdGF0dXNDb2RlID0gNDAwO1xuICBwdWJsaWMgcmVhZG9ubHkgZXJyb3JUeXBlID0gJ0lOVkFMSURfUk9MRV9UUkFOU0lUSU9OJztcbiAgcHVibGljIHJlYWRvbmx5IGZyb21Sb2xlOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSB0b1JvbGU6IHN0cmluZztcblxuICBjb25zdHJ1Y3Rvcihmcm9tUm9sZTogc3RyaW5nLCB0b1JvbGU6IHN0cmluZykge1xuICAgIHN1cGVyKGBJbnZhbGlkIHJvbGUgdHJhbnNpdGlvbiBmcm9tICR7ZnJvbVJvbGV9IHRvICR7dG9Sb2xlfWApO1xuICAgIHRoaXMubmFtZSA9ICdJbnZhbGlkUm9sZVRyYW5zaXRpb25FcnJvcic7XG4gICAgdGhpcy5mcm9tUm9sZSA9IGZyb21Sb2xlO1xuICAgIHRoaXMudG9Sb2xlID0gdG9Sb2xlO1xuXG4gICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBJbnZhbGlkUm9sZVRyYW5zaXRpb25FcnJvcik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ2Fubm90IHJlbW92ZSBvd25lciBlcnJvclxuICovXG5leHBvcnQgY2xhc3MgQ2Fubm90UmVtb3ZlT3duZXJFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgcHVibGljIHJlYWRvbmx5IHN0YXR1c0NvZGUgPSA0MDA7XG4gIHB1YmxpYyByZWFkb25seSBlcnJvclR5cGUgPSAnQ0FOTk9UX1JFTU9WRV9PV05FUic7XG4gIHB1YmxpYyByZWFkb25seSBjbHViSWQ6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJJZDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKGNsdWJJZDogc3RyaW5nLCB1c2VySWQ6IHN0cmluZykge1xuICAgIHN1cGVyKCdDYW5ub3QgcmVtb3ZlIGNsdWIgb3duZXIgLSBvd25lcnNoaXAgdHJhbnNmZXIgcmVxdWlyZWQnKTtcbiAgICB0aGlzLm5hbWUgPSAnQ2Fubm90UmVtb3ZlT3duZXJFcnJvcic7XG4gICAgdGhpcy5jbHViSWQgPSBjbHViSWQ7XG4gICAgdGhpcy51c2VySWQgPSB1c2VySWQ7XG5cbiAgICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIENhbm5vdFJlbW92ZU93bmVyRXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEludmFsaWQgbWVtYmVyc2hpcCBzdGF0dXMgdHJhbnNpdGlvbiBlcnJvclxuICovXG5leHBvcnQgY2xhc3MgSW52YWxpZE1lbWJlcnNoaXBTdGF0dXNUcmFuc2l0aW9uRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIHB1YmxpYyByZWFkb25seSBzdGF0dXNDb2RlID0gNDAwO1xuICBwdWJsaWMgcmVhZG9ubHkgZXJyb3JUeXBlID0gJ0lOVkFMSURfTUVNQkVSU0hJUF9TVEFUVVNfVFJBTlNJVElPTic7XG4gIHB1YmxpYyByZWFkb25seSBmcm9tU3RhdHVzOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSB0b1N0YXR1czogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKGZyb21TdGF0dXM6IHN0cmluZywgdG9TdGF0dXM6IHN0cmluZykge1xuICAgIHN1cGVyKGBJbnZhbGlkIG1lbWJlcnNoaXAgc3RhdHVzIHRyYW5zaXRpb24gZnJvbSAke2Zyb21TdGF0dXN9IHRvICR7dG9TdGF0dXN9YCk7XG4gICAgdGhpcy5uYW1lID0gJ0ludmFsaWRNZW1iZXJzaGlwU3RhdHVzVHJhbnNpdGlvbkVycm9yJztcbiAgICB0aGlzLmZyb21TdGF0dXMgPSBmcm9tU3RhdHVzO1xuICAgIHRoaXMudG9TdGF0dXMgPSB0b1N0YXR1cztcblxuICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgSW52YWxpZE1lbWJlcnNoaXBTdGF0dXNUcmFuc2l0aW9uRXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1lbWJlcnNoaXAgb3BlcmF0aW9uIG5vdCBhbGxvd2VkIGVycm9yXG4gKi9cbmV4cG9ydCBjbGFzcyBNZW1iZXJzaGlwT3BlcmF0aW9uTm90QWxsb3dlZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBwdWJsaWMgcmVhZG9ubHkgc3RhdHVzQ29kZSA9IDQwMztcbiAgcHVibGljIHJlYWRvbmx5IGVycm9yVHlwZSA9ICdNRU1CRVJTSElQX09QRVJBVElPTl9OT1RfQUxMT1dFRCc7XG4gIHB1YmxpYyByZWFkb25seSBvcGVyYXRpb246IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IG1lbWJlcnNoaXBJZD86IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IHJlYXNvbj86IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihvcGVyYXRpb246IHN0cmluZywgbWVtYmVyc2hpcElkPzogc3RyaW5nLCByZWFzb24/OiBzdHJpbmcpIHtcbiAgICBzdXBlcihgTWVtYmVyc2hpcCBvcGVyYXRpb24gbm90IGFsbG93ZWQ6ICR7b3BlcmF0aW9ufSR7cmVhc29uID8gYCAtICR7cmVhc29ufWAgOiAnJ31gKTtcbiAgICB0aGlzLm5hbWUgPSAnTWVtYmVyc2hpcE9wZXJhdGlvbk5vdEFsbG93ZWRFcnJvcic7XG4gICAgdGhpcy5vcGVyYXRpb24gPSBvcGVyYXRpb247XG4gICAgdGhpcy5tZW1iZXJzaGlwSWQgPSBtZW1iZXJzaGlwSWQ7XG4gICAgdGhpcy5yZWFzb24gPSByZWFzb247XG5cbiAgICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIE1lbWJlcnNoaXBPcGVyYXRpb25Ob3RBbGxvd2VkRXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIGlmIGVycm9yIGlzIGEgbWVtYmVyc2hpcC1zcGVjaWZpYyBlcnJvclxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNNZW1iZXJzaGlwRXJyb3IoZXJyb3I6IHVua25vd24pOiBlcnJvciBpcyBNZW1iZXJzaGlwTm90Rm91bmRFcnJvciB8IEFscmVhZHlNZW1iZXJFcnJvciB8IE1lbWJlcnNoaXBMaW1pdEV4Y2VlZGVkRXJyb3IgfCBJbnZhbGlkUm9sZVRyYW5zaXRpb25FcnJvciB8IENhbm5vdFJlbW92ZU93bmVyRXJyb3IgfCBJbnZhbGlkTWVtYmVyc2hpcFN0YXR1c1RyYW5zaXRpb25FcnJvciB8IE1lbWJlcnNoaXBPcGVyYXRpb25Ob3RBbGxvd2VkRXJyb3Ige1xuICByZXR1cm4gZXJyb3IgaW5zdGFuY2VvZiBNZW1iZXJzaGlwTm90Rm91bmRFcnJvciB8fFxuICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBBbHJlYWR5TWVtYmVyRXJyb3IgfHxcbiAgICAgICAgIGVycm9yIGluc3RhbmNlb2YgTWVtYmVyc2hpcExpbWl0RXhjZWVkZWRFcnJvciB8fFxuICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBJbnZhbGlkUm9sZVRyYW5zaXRpb25FcnJvciB8fFxuICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBDYW5ub3RSZW1vdmVPd25lckVycm9yIHx8XG4gICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEludmFsaWRNZW1iZXJzaGlwU3RhdHVzVHJhbnNpdGlvbkVycm9yIHx8XG4gICAgICAgICBlcnJvciBpbnN0YW5jZW9mIE1lbWJlcnNoaXBPcGVyYXRpb25Ob3RBbGxvd2VkRXJyb3I7XG59XG5cbi8qKlxuICogQ3JlYXRlIGVycm9yIHJlc3BvbnNlIGZvciBtZW1iZXJzaGlwIGVycm9yc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTWVtYmVyc2hpcEVycm9yUmVzcG9uc2UoZXJyb3I6IEVycm9yLCByZXF1ZXN0SWQ6IHN0cmluZykge1xuICBpZiAoaXNNZW1iZXJzaGlwRXJyb3IoZXJyb3IpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVycm9yOiBlcnJvci5lcnJvclR5cGUsXG4gICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxuICAgICAgZGV0YWlsczoge1xuICAgICAgICAuLi4oZXJyb3IgaW5zdGFuY2VvZiBNZW1iZXJzaGlwTm90Rm91bmRFcnJvciAmJiB7XG4gICAgICAgICAgbWVtYmVyc2hpcElkOiBlcnJvci5tZW1iZXJzaGlwSWQsXG4gICAgICAgICAgY2x1YklkOiBlcnJvci5jbHViSWQsXG4gICAgICAgICAgdXNlcklkOiBlcnJvci51c2VySWQsXG4gICAgICAgIH0pLFxuICAgICAgICAuLi4oZXJyb3IgaW5zdGFuY2VvZiBBbHJlYWR5TWVtYmVyRXJyb3IgJiYge1xuICAgICAgICAgIGNsdWJJZDogZXJyb3IuY2x1YklkLFxuICAgICAgICAgIHVzZXJJZDogZXJyb3IudXNlcklkLFxuICAgICAgICB9KSxcbiAgICAgICAgLi4uKGVycm9yIGluc3RhbmNlb2YgTWVtYmVyc2hpcExpbWl0RXhjZWVkZWRFcnJvciAmJiB7XG4gICAgICAgICAgY2x1YklkOiBlcnJvci5jbHViSWQsXG4gICAgICAgICAgY3VycmVudENvdW50OiBlcnJvci5jdXJyZW50Q291bnQsXG4gICAgICAgICAgbWF4TGltaXQ6IGVycm9yLm1heExpbWl0LFxuICAgICAgICB9KSxcbiAgICAgICAgLi4uKGVycm9yIGluc3RhbmNlb2YgSW52YWxpZFJvbGVUcmFuc2l0aW9uRXJyb3IgJiYge1xuICAgICAgICAgIGZyb21Sb2xlOiBlcnJvci5mcm9tUm9sZSxcbiAgICAgICAgICB0b1JvbGU6IGVycm9yLnRvUm9sZSxcbiAgICAgICAgfSksXG4gICAgICAgIC4uLihlcnJvciBpbnN0YW5jZW9mIENhbm5vdFJlbW92ZU93bmVyRXJyb3IgJiYge1xuICAgICAgICAgIGNsdWJJZDogZXJyb3IuY2x1YklkLFxuICAgICAgICAgIHVzZXJJZDogZXJyb3IudXNlcklkLFxuICAgICAgICB9KSxcbiAgICAgICAgLi4uKGVycm9yIGluc3RhbmNlb2YgSW52YWxpZE1lbWJlcnNoaXBTdGF0dXNUcmFuc2l0aW9uRXJyb3IgJiYge1xuICAgICAgICAgIGZyb21TdGF0dXM6IGVycm9yLmZyb21TdGF0dXMsXG4gICAgICAgICAgdG9TdGF0dXM6IGVycm9yLnRvU3RhdHVzLFxuICAgICAgICB9KSxcbiAgICAgICAgLi4uKGVycm9yIGluc3RhbmNlb2YgTWVtYmVyc2hpcE9wZXJhdGlvbk5vdEFsbG93ZWRFcnJvciAmJiB7XG4gICAgICAgICAgb3BlcmF0aW9uOiBlcnJvci5vcGVyYXRpb24sXG4gICAgICAgICAgbWVtYmVyc2hpcElkOiBlcnJvci5tZW1iZXJzaGlwSWQsXG4gICAgICAgICAgcmVhc29uOiBlcnJvci5yZWFzb24sXG4gICAgICAgIH0pLFxuICAgICAgfSxcbiAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgcmVxdWVzdElkLFxuICAgIH07XG4gIH1cblxuICAvLyBGYWxsYmFjayBmb3Igbm9uLW1lbWJlcnNoaXAgZXJyb3JzXG4gIHJldHVybiB7XG4gICAgZXJyb3I6ICdJTlRFUk5BTF9FUlJPUicsXG4gICAgbWVzc2FnZTogJ0FuIHVuZXhwZWN0ZWQgZXJyb3Igb2NjdXJyZWQnLFxuICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIHJlcXVlc3RJZCxcbiAgfTtcbn0iXX0=