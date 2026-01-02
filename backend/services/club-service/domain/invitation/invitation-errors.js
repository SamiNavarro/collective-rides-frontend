"use strict";
/**
 * Invitation-Specific Errors - Phase 2.2
 *
 * Error definitions specific to club invitation operations.
 * Extends the base error types with invitation-specific context.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvitationErrorResponse = exports.isInvitationError = exports.InvitationOperationNotAllowedError = exports.CannotInviteExistingMemberError = exports.UserAlreadyInvitedError = exports.InvalidInvitationTokenError = exports.InvitationAlreadyProcessedError = exports.InvitationExpiredError = exports.InvitationNotFoundError = void 0;
/**
 * Invitation not found error
 */
class InvitationNotFoundError extends Error {
    constructor(invitationId) {
        super('Invitation not found');
        this.statusCode = 404;
        this.errorType = 'INVITATION_NOT_FOUND';
        this.name = 'InvitationNotFoundError';
        this.invitationId = invitationId;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvitationNotFoundError);
        }
    }
}
exports.InvitationNotFoundError = InvitationNotFoundError;
/**
 * Invitation expired error
 */
class InvitationExpiredError extends Error {
    constructor(invitationId, expiresAt) {
        super('Invitation has expired');
        this.statusCode = 410;
        this.errorType = 'INVITATION_EXPIRED';
        this.name = 'InvitationExpiredError';
        this.invitationId = invitationId;
        this.expiresAt = expiresAt;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvitationExpiredError);
        }
    }
}
exports.InvitationExpiredError = InvitationExpiredError;
/**
 * Invitation already processed error
 */
class InvitationAlreadyProcessedError extends Error {
    constructor(invitationId, status) {
        super(`Invitation already processed with status: ${status}`);
        this.statusCode = 409;
        this.errorType = 'INVITATION_ALREADY_PROCESSED';
        this.name = 'InvitationAlreadyProcessedError';
        this.invitationId = invitationId;
        this.status = status;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvitationAlreadyProcessedError);
        }
    }
}
exports.InvitationAlreadyProcessedError = InvitationAlreadyProcessedError;
/**
 * Invalid invitation token error
 */
class InvalidInvitationTokenError extends Error {
    constructor(token) {
        super('Invalid invitation token');
        this.statusCode = 401;
        this.errorType = 'INVALID_INVITATION_TOKEN';
        this.name = 'InvalidInvitationTokenError';
        this.token = token;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidInvitationTokenError);
        }
    }
}
exports.InvalidInvitationTokenError = InvalidInvitationTokenError;
/**
 * User already invited error
 */
class UserAlreadyInvitedError extends Error {
    constructor(clubId, email, userId) {
        super('User already has a pending invitation to this club');
        this.statusCode = 409;
        this.errorType = 'USER_ALREADY_INVITED';
        this.name = 'UserAlreadyInvitedError';
        this.clubId = clubId;
        this.email = email;
        this.userId = userId;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, UserAlreadyInvitedError);
        }
    }
}
exports.UserAlreadyInvitedError = UserAlreadyInvitedError;
/**
 * Cannot invite existing member error
 */
class CannotInviteExistingMemberError extends Error {
    constructor(clubId, userId) {
        super('Cannot invite user who is already a member of this club');
        this.statusCode = 409;
        this.errorType = 'CANNOT_INVITE_EXISTING_MEMBER';
        this.name = 'CannotInviteExistingMemberError';
        this.clubId = clubId;
        this.userId = userId;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, CannotInviteExistingMemberError);
        }
    }
}
exports.CannotInviteExistingMemberError = CannotInviteExistingMemberError;
/**
 * Invitation operation not allowed error
 */
class InvitationOperationNotAllowedError extends Error {
    constructor(operation, invitationId, reason) {
        super(`Invitation operation not allowed: ${operation}${reason ? ` - ${reason}` : ''}`);
        this.statusCode = 403;
        this.errorType = 'INVITATION_OPERATION_NOT_ALLOWED';
        this.name = 'InvitationOperationNotAllowedError';
        this.operation = operation;
        this.invitationId = invitationId;
        this.reason = reason;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvitationOperationNotAllowedError);
        }
    }
}
exports.InvitationOperationNotAllowedError = InvitationOperationNotAllowedError;
/**
 * Check if error is an invitation-specific error
 */
function isInvitationError(error) {
    return error instanceof InvitationNotFoundError ||
        error instanceof InvitationExpiredError ||
        error instanceof InvitationAlreadyProcessedError ||
        error instanceof InvalidInvitationTokenError ||
        error instanceof UserAlreadyInvitedError ||
        error instanceof CannotInviteExistingMemberError ||
        error instanceof InvitationOperationNotAllowedError;
}
exports.isInvitationError = isInvitationError;
/**
 * Create error response for invitation errors
 */
function createInvitationErrorResponse(error, requestId) {
    if (isInvitationError(error)) {
        return {
            error: error.errorType,
            message: error.message,
            details: {
                ...(error instanceof InvitationNotFoundError && {
                    invitationId: error.invitationId,
                }),
                ...(error instanceof InvitationExpiredError && {
                    invitationId: error.invitationId,
                    expiresAt: error.expiresAt,
                }),
                ...(error instanceof InvitationAlreadyProcessedError && {
                    invitationId: error.invitationId,
                    status: error.status,
                }),
                ...(error instanceof InvalidInvitationTokenError && {
                    token: error.token,
                }),
                ...(error instanceof UserAlreadyInvitedError && {
                    clubId: error.clubId,
                    email: error.email,
                    userId: error.userId,
                }),
                ...(error instanceof CannotInviteExistingMemberError && {
                    clubId: error.clubId,
                    userId: error.userId,
                }),
                ...(error instanceof InvitationOperationNotAllowedError && {
                    operation: error.operation,
                    invitationId: error.invitationId,
                    reason: error.reason,
                }),
            },
            timestamp: new Date().toISOString(),
            requestId,
        };
    }
    // Fallback for non-invitation errors
    return {
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId,
    };
}
exports.createInvitationErrorResponse = createInvitationErrorResponse;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52aXRhdGlvbi1lcnJvcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbnZpdGF0aW9uLWVycm9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUVIOztHQUVHO0FBQ0gsTUFBYSx1QkFBd0IsU0FBUSxLQUFLO0lBS2hELFlBQVksWUFBcUI7UUFDL0IsS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFMaEIsZUFBVSxHQUFHLEdBQUcsQ0FBQztRQUNqQixjQUFTLEdBQUcsc0JBQXNCLENBQUM7UUFLakQsSUFBSSxDQUFDLElBQUksR0FBRyx5QkFBeUIsQ0FBQztRQUN0QyxJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztRQUVqQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtZQUMzQixLQUFLLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLHVCQUF1QixDQUFDLENBQUM7U0FDeEQ7SUFDSCxDQUFDO0NBQ0Y7QUFkRCwwREFjQztBQUVEOztHQUVHO0FBQ0gsTUFBYSxzQkFBdUIsU0FBUSxLQUFLO0lBTS9DLFlBQVksWUFBb0IsRUFBRSxTQUFpQjtRQUNqRCxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQU5sQixlQUFVLEdBQUcsR0FBRyxDQUFDO1FBQ2pCLGNBQVMsR0FBRyxvQkFBb0IsQ0FBQztRQU0vQyxJQUFJLENBQUMsSUFBSSxHQUFHLHdCQUF3QixDQUFDO1FBQ3JDLElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBRTNCLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFO1lBQzNCLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztTQUN2RDtJQUNILENBQUM7Q0FDRjtBQWhCRCx3REFnQkM7QUFFRDs7R0FFRztBQUNILE1BQWEsK0JBQWdDLFNBQVEsS0FBSztJQU14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LE1BQU07aUJBQ3JCLENBQUM7Z0JBQ0YsR0FBRyxDQUFDLEtBQUssWUFBWSwyQkFBMkIsSUFBSTtvQkFDbEQsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLO2lCQUNuQixDQUFDO2dCQUNGLEdBQUcsQ0FBQyxLQUFLLFlBQVksdUJBQXVCLElBQUk7b0JBQzlDLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTTtvQkFDcEIsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLO29CQUNsQixNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU07aUJBQ3JCLENBQUM7Z0JBQ0YsR0FBRyxDQUFDLEtBQUssWUFBWSwrQkFBK0IsSUFBSTtvQkFDdEQsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNO29CQUNwQixNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU07aUJBQ3JCLENBQUM7Z0JBQ0YsR0FBRyxDQUFDLEtBQUssWUFBWSxrQ0FBa0MsSUFBSTtvQkFDekQsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO29CQUMxQixZQUFZLEVBQUUsS0FBSyxDQUFDLFlBQVk7b0JBQ2hDLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTTtpQkFDckIsQ0FBQzthQUNIO1lBQ0QsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1lBQ25DLFNBQVM7U0FDVixDQUFDO0tBQ0g7SUFFRCxxQ0FBcUM7SUFDckMsT0FBTztRQUNMLEtBQUssRUFBRSxnQkFBZ0I7UUFDdkIsT0FBTyxFQUFFLDhCQUE4QjtRQUN2QyxTQUFTLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7UUFDbkMsU0FBUztLQUNWLENBQUM7QUFDSixDQUFDO0FBL0NELHNFQStDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSW52aXRhdGlvbi1TcGVjaWZpYyBFcnJvcnMgLSBQaGFzZSAyLjJcbiAqIFxuICogRXJyb3IgZGVmaW5pdGlvbnMgc3BlY2lmaWMgdG8gY2x1YiBpbnZpdGF0aW9uIG9wZXJhdGlvbnMuXG4gKiBFeHRlbmRzIHRoZSBiYXNlIGVycm9yIHR5cGVzIHdpdGggaW52aXRhdGlvbi1zcGVjaWZpYyBjb250ZXh0LlxuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBQaGFzZSAyLjIgU3BlYzogLmtpcm8vc3BlY3MvcGhhc2UtMi4yLmNsdWItbWVtYmVyc2hpcC1yb2xlcy52MS5tZFxuICovXG5cbi8qKlxuICogSW52aXRhdGlvbiBub3QgZm91bmQgZXJyb3JcbiAqL1xuZXhwb3J0IGNsYXNzIEludml0YXRpb25Ob3RGb3VuZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBwdWJsaWMgcmVhZG9ubHkgc3RhdHVzQ29kZSA9IDQwNDtcbiAgcHVibGljIHJlYWRvbmx5IGVycm9yVHlwZSA9ICdJTlZJVEFUSU9OX05PVF9GT1VORCc7XG4gIHB1YmxpYyByZWFkb25seSBpbnZpdGF0aW9uSWQ/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoaW52aXRhdGlvbklkPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoJ0ludml0YXRpb24gbm90IGZvdW5kJyk7XG4gICAgdGhpcy5uYW1lID0gJ0ludml0YXRpb25Ob3RGb3VuZEVycm9yJztcbiAgICB0aGlzLmludml0YXRpb25JZCA9IGludml0YXRpb25JZDtcblxuICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgSW52aXRhdGlvbk5vdEZvdW5kRXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEludml0YXRpb24gZXhwaXJlZCBlcnJvclxuICovXG5leHBvcnQgY2xhc3MgSW52aXRhdGlvbkV4cGlyZWRFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgcHVibGljIHJlYWRvbmx5IHN0YXR1c0NvZGUgPSA0MTA7XG4gIHB1YmxpYyByZWFkb25seSBlcnJvclR5cGUgPSAnSU5WSVRBVElPTl9FWFBJUkVEJztcbiAgcHVibGljIHJlYWRvbmx5IGludml0YXRpb25JZDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgZXhwaXJlc0F0OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoaW52aXRhdGlvbklkOiBzdHJpbmcsIGV4cGlyZXNBdDogc3RyaW5nKSB7XG4gICAgc3VwZXIoJ0ludml0YXRpb24gaGFzIGV4cGlyZWQnKTtcbiAgICB0aGlzLm5hbWUgPSAnSW52aXRhdGlvbkV4cGlyZWRFcnJvcic7XG4gICAgdGhpcy5pbnZpdGF0aW9uSWQgPSBpbnZpdGF0aW9uSWQ7XG4gICAgdGhpcy5leHBpcmVzQXQgPSBleHBpcmVzQXQ7XG5cbiAgICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIEludml0YXRpb25FeHBpcmVkRXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEludml0YXRpb24gYWxyZWFkeSBwcm9jZXNzZWQgZXJyb3JcbiAqL1xuZXhwb3J0IGNsYXNzIEludml0YXRpb25BbHJlYWR5UHJvY2Vzc2VkRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIHB1YmxpYyByZWFkb25seSBzdGF0dXNDb2RlID0gNDA5O1xuICBwdWJsaWMgcmVhZG9ubHkgZXJyb3JUeXBlID0gJ0lOVklUQVRJT05fQUxSRUFEWV9QUk9DRVNTRUQnO1xuICBwdWJsaWMgcmVhZG9ubHkgaW52aXRhdGlvbklkOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSBzdGF0dXM6IHN0cmluZztcblxuICBjb25zdHJ1Y3RvcihpbnZpdGF0aW9uSWQ6IHN0cmluZywgc3RhdHVzOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgSW52aXRhdGlvbiBhbHJlYWR5IHByb2Nlc3NlZCB3aXRoIHN0YXR1czogJHtzdGF0dXN9YCk7XG4gICAgdGhpcy5uYW1lID0gJ0ludml0YXRpb25BbHJlYWR5UHJvY2Vzc2VkRXJyb3InO1xuICAgIHRoaXMuaW52aXRhdGlvbklkID0gaW52aXRhdGlvbklkO1xuICAgIHRoaXMuc3RhdHVzID0gc3RhdHVzO1xuXG4gICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBJbnZpdGF0aW9uQWxyZWFkeVByb2Nlc3NlZEVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbnZhbGlkIGludml0YXRpb24gdG9rZW4gZXJyb3JcbiAqL1xuZXhwb3J0IGNsYXNzIEludmFsaWRJbnZpdGF0aW9uVG9rZW5FcnJvciBleHRlbmRzIEVycm9yIHtcbiAgcHVibGljIHJlYWRvbmx5IHN0YXR1c0NvZGUgPSA0MDE7XG4gIHB1YmxpYyByZWFkb25seSBlcnJvclR5cGUgPSAnSU5WQUxJRF9JTlZJVEFUSU9OX1RPS0VOJztcbiAgcHVibGljIHJlYWRvbmx5IHRva2VuPzogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHRva2VuPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoJ0ludmFsaWQgaW52aXRhdGlvbiB0b2tlbicpO1xuICAgIHRoaXMubmFtZSA9ICdJbnZhbGlkSW52aXRhdGlvblRva2VuRXJyb3InO1xuICAgIHRoaXMudG9rZW4gPSB0b2tlbjtcblxuICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgSW52YWxpZEludml0YXRpb25Ub2tlbkVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VyIGFscmVhZHkgaW52aXRlZCBlcnJvclxuICovXG5leHBvcnQgY2xhc3MgVXNlckFscmVhZHlJbnZpdGVkRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIHB1YmxpYyByZWFkb25seSBzdGF0dXNDb2RlID0gNDA5O1xuICBwdWJsaWMgcmVhZG9ubHkgZXJyb3JUeXBlID0gJ1VTRVJfQUxSRUFEWV9JTlZJVEVEJztcbiAgcHVibGljIHJlYWRvbmx5IGNsdWJJZDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgZW1haWw/OiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSB1c2VySWQ/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoY2x1YklkOiBzdHJpbmcsIGVtYWlsPzogc3RyaW5nLCB1c2VySWQ/OiBzdHJpbmcpIHtcbiAgICBzdXBlcignVXNlciBhbHJlYWR5IGhhcyBhIHBlbmRpbmcgaW52aXRhdGlvbiB0byB0aGlzIGNsdWInKTtcbiAgICB0aGlzLm5hbWUgPSAnVXNlckFscmVhZHlJbnZpdGVkRXJyb3InO1xuICAgIHRoaXMuY2x1YklkID0gY2x1YklkO1xuICAgIHRoaXMuZW1haWwgPSBlbWFpbDtcbiAgICB0aGlzLnVzZXJJZCA9IHVzZXJJZDtcblxuICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgVXNlckFscmVhZHlJbnZpdGVkRXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENhbm5vdCBpbnZpdGUgZXhpc3RpbmcgbWVtYmVyIGVycm9yXG4gKi9cbmV4cG9ydCBjbGFzcyBDYW5ub3RJbnZpdGVFeGlzdGluZ01lbWJlckVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBwdWJsaWMgcmVhZG9ubHkgc3RhdHVzQ29kZSA9IDQwOTtcbiAgcHVibGljIHJlYWRvbmx5IGVycm9yVHlwZSA9ICdDQU5OT1RfSU5WSVRFX0VYSVNUSU5HX01FTUJFUic7XG4gIHB1YmxpYyByZWFkb25seSBjbHViSWQ6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IHVzZXJJZDogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKGNsdWJJZDogc3RyaW5nLCB1c2VySWQ6IHN0cmluZykge1xuICAgIHN1cGVyKCdDYW5ub3QgaW52aXRlIHVzZXIgd2hvIGlzIGFscmVhZHkgYSBtZW1iZXIgb2YgdGhpcyBjbHViJyk7XG4gICAgdGhpcy5uYW1lID0gJ0Nhbm5vdEludml0ZUV4aXN0aW5nTWVtYmVyRXJyb3InO1xuICAgIHRoaXMuY2x1YklkID0gY2x1YklkO1xuICAgIHRoaXMudXNlcklkID0gdXNlcklkO1xuXG4gICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBDYW5ub3RJbnZpdGVFeGlzdGluZ01lbWJlckVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBJbnZpdGF0aW9uIG9wZXJhdGlvbiBub3QgYWxsb3dlZCBlcnJvclxuICovXG5leHBvcnQgY2xhc3MgSW52aXRhdGlvbk9wZXJhdGlvbk5vdEFsbG93ZWRFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgcHVibGljIHJlYWRvbmx5IHN0YXR1c0NvZGUgPSA0MDM7XG4gIHB1YmxpYyByZWFkb25seSBlcnJvclR5cGUgPSAnSU5WSVRBVElPTl9PUEVSQVRJT05fTk9UX0FMTE9XRUQnO1xuICBwdWJsaWMgcmVhZG9ubHkgb3BlcmF0aW9uOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSBpbnZpdGF0aW9uSWQ/OiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSByZWFzb24/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Iob3BlcmF0aW9uOiBzdHJpbmcsIGludml0YXRpb25JZD86IHN0cmluZywgcmVhc29uPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoYEludml0YXRpb24gb3BlcmF0aW9uIG5vdCBhbGxvd2VkOiAke29wZXJhdGlvbn0ke3JlYXNvbiA/IGAgLSAke3JlYXNvbn1gIDogJyd9YCk7XG4gICAgdGhpcy5uYW1lID0gJ0ludml0YXRpb25PcGVyYXRpb25Ob3RBbGxvd2VkRXJyb3InO1xuICAgIHRoaXMub3BlcmF0aW9uID0gb3BlcmF0aW9uO1xuICAgIHRoaXMuaW52aXRhdGlvbklkID0gaW52aXRhdGlvbklkO1xuICAgIHRoaXMucmVhc29uID0gcmVhc29uO1xuXG4gICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBJbnZpdGF0aW9uT3BlcmF0aW9uTm90QWxsb3dlZEVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiBlcnJvciBpcyBhbiBpbnZpdGF0aW9uLXNwZWNpZmljIGVycm9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0ludml0YXRpb25FcnJvcihlcnJvcjogdW5rbm93bik6IGVycm9yIGlzIEludml0YXRpb25Ob3RGb3VuZEVycm9yIHwgSW52aXRhdGlvbkV4cGlyZWRFcnJvciB8IEludml0YXRpb25BbHJlYWR5UHJvY2Vzc2VkRXJyb3IgfCBJbnZhbGlkSW52aXRhdGlvblRva2VuRXJyb3IgfCBVc2VyQWxyZWFkeUludml0ZWRFcnJvciB8IENhbm5vdEludml0ZUV4aXN0aW5nTWVtYmVyRXJyb3IgfCBJbnZpdGF0aW9uT3BlcmF0aW9uTm90QWxsb3dlZEVycm9yIHtcbiAgcmV0dXJuIGVycm9yIGluc3RhbmNlb2YgSW52aXRhdGlvbk5vdEZvdW5kRXJyb3IgfHxcbiAgICAgICAgIGVycm9yIGluc3RhbmNlb2YgSW52aXRhdGlvbkV4cGlyZWRFcnJvciB8fFxuICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBJbnZpdGF0aW9uQWxyZWFkeVByb2Nlc3NlZEVycm9yIHx8XG4gICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEludmFsaWRJbnZpdGF0aW9uVG9rZW5FcnJvciB8fFxuICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBVc2VyQWxyZWFkeUludml0ZWRFcnJvciB8fFxuICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBDYW5ub3RJbnZpdGVFeGlzdGluZ01lbWJlckVycm9yIHx8XG4gICAgICAgICBlcnJvciBpbnN0YW5jZW9mIEludml0YXRpb25PcGVyYXRpb25Ob3RBbGxvd2VkRXJyb3I7XG59XG5cbi8qKlxuICogQ3JlYXRlIGVycm9yIHJlc3BvbnNlIGZvciBpbnZpdGF0aW9uIGVycm9yc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlSW52aXRhdGlvbkVycm9yUmVzcG9uc2UoZXJyb3I6IEVycm9yLCByZXF1ZXN0SWQ6IHN0cmluZykge1xuICBpZiAoaXNJbnZpdGF0aW9uRXJyb3IoZXJyb3IpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVycm9yOiBlcnJvci5lcnJvclR5cGUsXG4gICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxuICAgICAgZGV0YWlsczoge1xuICAgICAgICAuLi4oZXJyb3IgaW5zdGFuY2VvZiBJbnZpdGF0aW9uTm90Rm91bmRFcnJvciAmJiB7XG4gICAgICAgICAgaW52aXRhdGlvbklkOiBlcnJvci5pbnZpdGF0aW9uSWQsXG4gICAgICAgIH0pLFxuICAgICAgICAuLi4oZXJyb3IgaW5zdGFuY2VvZiBJbnZpdGF0aW9uRXhwaXJlZEVycm9yICYmIHtcbiAgICAgICAgICBpbnZpdGF0aW9uSWQ6IGVycm9yLmludml0YXRpb25JZCxcbiAgICAgICAgICBleHBpcmVzQXQ6IGVycm9yLmV4cGlyZXNBdCxcbiAgICAgICAgfSksXG4gICAgICAgIC4uLihlcnJvciBpbnN0YW5jZW9mIEludml0YXRpb25BbHJlYWR5UHJvY2Vzc2VkRXJyb3IgJiYge1xuICAgICAgICAgIGludml0YXRpb25JZDogZXJyb3IuaW52aXRhdGlvbklkLFxuICAgICAgICAgIHN0YXR1czogZXJyb3Iuc3RhdHVzLFxuICAgICAgICB9KSxcbiAgICAgICAgLi4uKGVycm9yIGluc3RhbmNlb2YgSW52YWxpZEludml0YXRpb25Ub2tlbkVycm9yICYmIHtcbiAgICAgICAgICB0b2tlbjogZXJyb3IudG9rZW4sXG4gICAgICAgIH0pLFxuICAgICAgICAuLi4oZXJyb3IgaW5zdGFuY2VvZiBVc2VyQWxyZWFkeUludml0ZWRFcnJvciAmJiB7XG4gICAgICAgICAgY2x1YklkOiBlcnJvci5jbHViSWQsXG4gICAgICAgICAgZW1haWw6IGVycm9yLmVtYWlsLFxuICAgICAgICAgIHVzZXJJZDogZXJyb3IudXNlcklkLFxuICAgICAgICB9KSxcbiAgICAgICAgLi4uKGVycm9yIGluc3RhbmNlb2YgQ2Fubm90SW52aXRlRXhpc3RpbmdNZW1iZXJFcnJvciAmJiB7XG4gICAgICAgICAgY2x1YklkOiBlcnJvci5jbHViSWQsXG4gICAgICAgICAgdXNlcklkOiBlcnJvci51c2VySWQsXG4gICAgICAgIH0pLFxuICAgICAgICAuLi4oZXJyb3IgaW5zdGFuY2VvZiBJbnZpdGF0aW9uT3BlcmF0aW9uTm90QWxsb3dlZEVycm9yICYmIHtcbiAgICAgICAgICBvcGVyYXRpb246IGVycm9yLm9wZXJhdGlvbixcbiAgICAgICAgICBpbnZpdGF0aW9uSWQ6IGVycm9yLmludml0YXRpb25JZCxcbiAgICAgICAgICByZWFzb246IGVycm9yLnJlYXNvbixcbiAgICAgICAgfSksXG4gICAgICB9LFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICByZXF1ZXN0SWQsXG4gICAgfTtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIGZvciBub24taW52aXRhdGlvbiBlcnJvcnNcbiAgcmV0dXJuIHtcbiAgICBlcnJvcjogJ0lOVEVSTkFMX0VSUk9SJyxcbiAgICBtZXNzYWdlOiAnQW4gdW5leHBlY3RlZCBlcnJvciBvY2N1cnJlZCcsXG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgcmVxdWVzdElkLFxuICB9O1xufSJdfQ==