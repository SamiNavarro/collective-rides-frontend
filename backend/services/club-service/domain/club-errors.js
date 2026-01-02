"use strict";
/**
 * Club-Specific Errors - Phase 2.1
 *
 * Error definitions specific to club operations.
 * Extends the base error types with club-specific context.
 *
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClubErrorResponse = exports.isClubError = exports.ClubOperationNotAllowedError = exports.ClubValidationError = exports.ClubStatusTransitionError = exports.InvalidClubStatusError = exports.ClubNameConflictError = exports.ClubNotFoundError = void 0;
/**
 * Club not found error
 */
class ClubNotFoundError extends Error {
    constructor(clubId) {
        super('Club not found');
        this.statusCode = 404;
        this.errorType = 'NOT_FOUND';
        this.name = 'ClubNotFoundError';
        this.clubId = clubId;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ClubNotFoundError);
        }
    }
}
exports.ClubNotFoundError = ClubNotFoundError;
/**
 * Club name conflict error
 */
class ClubNameConflictError extends Error {
    constructor(clubName) {
        super('Club name already exists');
        this.statusCode = 409;
        this.errorType = 'CONFLICT';
        this.name = 'ClubNameConflictError';
        this.clubName = clubName;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ClubNameConflictError);
        }
    }
}
exports.ClubNameConflictError = ClubNameConflictError;
/**
 * Invalid club status error
 */
class InvalidClubStatusError extends Error {
    constructor(status) {
        super(`Invalid club status: ${status}`);
        this.statusCode = 400;
        this.errorType = 'VALIDATION_ERROR';
        this.name = 'InvalidClubStatusError';
        this.status = status;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, InvalidClubStatusError);
        }
    }
}
exports.InvalidClubStatusError = InvalidClubStatusError;
/**
 * Club status transition error
 */
class ClubStatusTransitionError extends Error {
    constructor(fromStatus, toStatus) {
        super(`Cannot transition club status from ${fromStatus} to ${toStatus}`);
        this.statusCode = 400;
        this.errorType = 'VALIDATION_ERROR';
        this.name = 'ClubStatusTransitionError';
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ClubStatusTransitionError);
        }
    }
}
exports.ClubStatusTransitionError = ClubStatusTransitionError;
/**
 * Club validation error
 */
class ClubValidationError extends Error {
    constructor(message, field) {
        super(message);
        this.statusCode = 400;
        this.errorType = 'VALIDATION_ERROR';
        this.name = 'ClubValidationError';
        this.field = field;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ClubValidationError);
        }
    }
}
exports.ClubValidationError = ClubValidationError;
/**
 * Club operation not allowed error
 */
class ClubOperationNotAllowedError extends Error {
    constructor(operation, clubId) {
        super(`Operation not allowed: ${operation}`);
        this.statusCode = 403;
        this.errorType = 'FORBIDDEN';
        this.name = 'ClubOperationNotAllowedError';
        this.operation = operation;
        this.clubId = clubId;
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ClubOperationNotAllowedError);
        }
    }
}
exports.ClubOperationNotAllowedError = ClubOperationNotAllowedError;
/**
 * Check if error is a club-specific error
 */
function isClubError(error) {
    return error instanceof ClubNotFoundError ||
        error instanceof ClubNameConflictError ||
        error instanceof InvalidClubStatusError ||
        error instanceof ClubStatusTransitionError ||
        error instanceof ClubValidationError ||
        error instanceof ClubOperationNotAllowedError;
}
exports.isClubError = isClubError;
/**
 * Create error response for club errors
 */
function createClubErrorResponse(error, requestId) {
    if (isClubError(error)) {
        return {
            error: error.errorType,
            message: error.message,
            details: {
                ...(error instanceof ClubNotFoundError && error.clubId && { clubId: error.clubId }),
                ...(error instanceof ClubNameConflictError && { clubName: error.clubName }),
                ...(error instanceof InvalidClubStatusError && { status: error.status }),
                ...(error instanceof ClubStatusTransitionError && {
                    fromStatus: error.fromStatus,
                    toStatus: error.toStatus
                }),
                ...(error instanceof ClubValidationError && error.field && { field: error.field }),
                ...(error instanceof ClubOperationNotAllowedError && {
                    operation: error.operation,
                    ...(error.clubId && { clubId: error.clubId })
                }),
            },
            timestamp: new Date().toISOString(),
            requestId,
        };
    }
    // Fallback for non-club errors
    return {
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId,
    };
}
exports.createClubErrorResponse = createClubErrorResponse;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2x1Yi1lcnJvcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjbHViLWVycm9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7O0dBUUc7OztBQUVIOztHQUVHO0FBQ0gsTUFBYSxpQkFBa0IsU0FBUSxLQUFLO0lBSzFDLFlBQVksTUFBZTtRQUN6QixLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztRQUxWLGVBQVUsR0FBRyxHQUFHLENBQUM7UUFDakIsY0FBUyxHQUFHLFdBQVcsQ0FBQztRQUt0QyxJQUFJLENBQUMsSUFBSSxHQUFHLG1CQUFtQixDQUFDO1FBQ2hDLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBRXJCLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFO1lBQzNCLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztTQUNsRDtJQUNILENBQUM7Q0FDRjtBQWRELDhDQWNDO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLHFCQUFzQixTQUFRLEtBQUs7SUFLOUMsWUFBWSxRQUFnQjtRQUMxQixLQUFLLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUxwQixlQUFVLEdBQUcsR0FBRyxDQUFDO1FBQ2pCLGNBQVMsR0FBRyxVQUFVLENBQUM7UUFLckMsSUFBSSxDQUFDLElBQUksR0FBRyx1QkFBdUIsQ0FBQztRQUNwQyxJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQztRQUV6QixJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtZQUMzQixLQUFLLENBQUMsaUJBQWlCLENBQUMsSUFBSSxFQUFFLHFCQUFxQixDQUFDLENBQUM7U0FDdEQ7SUFDSCxDQUFDO0NBQ0Y7QUFkRCxzREFjQztBQUVEOztHQUVHO0FBQ0gsTUFBYSxzQkFBdUIsU0FBUSxLQUFLO0lBSy9DLFlBQVksTUFBYztRQUN4QixLQUFLLENBQUMsd0JBQXdCLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFMMUIsZUFBVSxH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QUFDLE1BQU0sSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7Z0JBQ25GLEdBQUcsQ0FBQyxLQUFLLFlBQVkscUJBQXFCLElBQUksRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUMzRSxHQUFHLENBQUMsS0FBSyxZQUFZLHNCQUFzQixJQUFJLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDeEUsR0FBRyxDQUFDLEtBQUssWUFBWSx5QkFBeUIsSUFBSTtvQkFDaEQsVUFBVSxFQUFFLEtBQUssQ0FBQyxVQUFVO29CQUM1QixRQUFRLEVBQUUsS0FBSyxDQUFDLFFBQVE7aUJBQ3pCLENBQUM7Z0JBQ0YsR0FBRyxDQUFDLEtBQUssWUFBWSxtQkFBbUIsSUFBSSxLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztnQkFDbEYsR0FBRyxDQUFDLEtBQUssWUFBWSw0QkFBNEIsSUFBSTtvQkFDbkQsU0FBUyxFQUFFLEtBQUssQ0FBQyxTQUFTO29CQUMxQixHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7aUJBQzlDLENBQUM7YUFDSDtZQUNELFNBQVMsRUFBRSxJQUFJLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBRTtZQUNuQyxTQUFTO1NBQ1YsQ0FBQztLQUNIO0lBRUQsK0JBQStCO0lBQy9CLE9BQU87UUFDTCxLQUFLLEVBQUUsZ0JBQWdCO1FBQ3ZCLE9BQU8sRUFBRSw4QkFBOEI7UUFDdkMsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1FBQ25DLFNBQVM7S0FDVixDQUFDO0FBQ0osQ0FBQztBQS9CRCwwREErQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENsdWItU3BlY2lmaWMgRXJyb3JzIC0gUGhhc2UgMi4xXG4gKiBcbiAqIEVycm9yIGRlZmluaXRpb25zIHNwZWNpZmljIHRvIGNsdWIgb3BlcmF0aW9ucy5cbiAqIEV4dGVuZHMgdGhlIGJhc2UgZXJyb3IgdHlwZXMgd2l0aCBjbHViLXNwZWNpZmljIGNvbnRleHQuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDIuMSBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0yLjEuY2x1Yi1zZXJ2aWNlLnYxLm1kXG4gKi9cblxuLyoqXG4gKiBDbHViIG5vdCBmb3VuZCBlcnJvclxuICovXG5leHBvcnQgY2xhc3MgQ2x1Yk5vdEZvdW5kRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIHB1YmxpYyByZWFkb25seSBzdGF0dXNDb2RlID0gNDA0O1xuICBwdWJsaWMgcmVhZG9ubHkgZXJyb3JUeXBlID0gJ05PVF9GT1VORCc7XG4gIHB1YmxpYyByZWFkb25seSBjbHViSWQ/OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoY2x1YklkPzogc3RyaW5nKSB7XG4gICAgc3VwZXIoJ0NsdWIgbm90IGZvdW5kJyk7XG4gICAgdGhpcy5uYW1lID0gJ0NsdWJOb3RGb3VuZEVycm9yJztcbiAgICB0aGlzLmNsdWJJZCA9IGNsdWJJZDtcblxuICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgQ2x1Yk5vdEZvdW5kRXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENsdWIgbmFtZSBjb25mbGljdCBlcnJvclxuICovXG5leHBvcnQgY2xhc3MgQ2x1Yk5hbWVDb25mbGljdEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBwdWJsaWMgcmVhZG9ubHkgc3RhdHVzQ29kZSA9IDQwOTtcbiAgcHVibGljIHJlYWRvbmx5IGVycm9yVHlwZSA9ICdDT05GTElDVCc7XG4gIHB1YmxpYyByZWFkb25seSBjbHViTmFtZTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKGNsdWJOYW1lOiBzdHJpbmcpIHtcbiAgICBzdXBlcignQ2x1YiBuYW1lIGFscmVhZHkgZXhpc3RzJyk7XG4gICAgdGhpcy5uYW1lID0gJ0NsdWJOYW1lQ29uZmxpY3RFcnJvcic7XG4gICAgdGhpcy5jbHViTmFtZSA9IGNsdWJOYW1lO1xuXG4gICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBDbHViTmFtZUNvbmZsaWN0RXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEludmFsaWQgY2x1YiBzdGF0dXMgZXJyb3JcbiAqL1xuZXhwb3J0IGNsYXNzIEludmFsaWRDbHViU3RhdHVzRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIHB1YmxpYyByZWFkb25seSBzdGF0dXNDb2RlID0gNDAwO1xuICBwdWJsaWMgcmVhZG9ubHkgZXJyb3JUeXBlID0gJ1ZBTElEQVRJT05fRVJST1InO1xuICBwdWJsaWMgcmVhZG9ubHkgc3RhdHVzOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc3RhdHVzOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgSW52YWxpZCBjbHViIHN0YXR1czogJHtzdGF0dXN9YCk7XG4gICAgdGhpcy5uYW1lID0gJ0ludmFsaWRDbHViU3RhdHVzRXJyb3InO1xuICAgIHRoaXMuc3RhdHVzID0gc3RhdHVzO1xuXG4gICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBJbnZhbGlkQ2x1YlN0YXR1c0Vycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDbHViIHN0YXR1cyB0cmFuc2l0aW9uIGVycm9yXG4gKi9cbmV4cG9ydCBjbGFzcyBDbHViU3RhdHVzVHJhbnNpdGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBwdWJsaWMgcmVhZG9ubHkgc3RhdHVzQ29kZSA9IDQwMDtcbiAgcHVibGljIHJlYWRvbmx5IGVycm9yVHlwZSA9ICdWQUxJREFUSU9OX0VSUk9SJztcbiAgcHVibGljIHJlYWRvbmx5IGZyb21TdGF0dXM6IHN0cmluZztcbiAgcHVibGljIHJlYWRvbmx5IHRvU3RhdHVzOiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IoZnJvbVN0YXR1czogc3RyaW5nLCB0b1N0YXR1czogc3RyaW5nKSB7XG4gICAgc3VwZXIoYENhbm5vdCB0cmFuc2l0aW9uIGNsdWIgc3RhdHVzIGZyb20gJHtmcm9tU3RhdHVzfSB0byAke3RvU3RhdHVzfWApO1xuICAgIHRoaXMubmFtZSA9ICdDbHViU3RhdHVzVHJhbnNpdGlvbkVycm9yJztcbiAgICB0aGlzLmZyb21TdGF0dXMgPSBmcm9tU3RhdHVzO1xuICAgIHRoaXMudG9TdGF0dXMgPSB0b1N0YXR1cztcblxuICAgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgQ2x1YlN0YXR1c1RyYW5zaXRpb25FcnJvcik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ2x1YiB2YWxpZGF0aW9uIGVycm9yXG4gKi9cbmV4cG9ydCBjbGFzcyBDbHViVmFsaWRhdGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBwdWJsaWMgcmVhZG9ubHkgc3RhdHVzQ29kZSA9IDQwMDtcbiAgcHVibGljIHJlYWRvbmx5IGVycm9yVHlwZSA9ICdWQUxJREFUSU9OX0VSUk9SJztcbiAgcHVibGljIHJlYWRvbmx5IGZpZWxkPzogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZywgZmllbGQ/OiBzdHJpbmcpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSAnQ2x1YlZhbGlkYXRpb25FcnJvcic7XG4gICAgdGhpcy5maWVsZCA9IGZpZWxkO1xuXG4gICAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG4gICAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBDbHViVmFsaWRhdGlvbkVycm9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDbHViIG9wZXJhdGlvbiBub3QgYWxsb3dlZCBlcnJvclxuICovXG5leHBvcnQgY2xhc3MgQ2x1Yk9wZXJhdGlvbk5vdEFsbG93ZWRFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgcHVibGljIHJlYWRvbmx5IHN0YXR1c0NvZGUgPSA0MDM7XG4gIHB1YmxpYyByZWFkb25seSBlcnJvclR5cGUgPSAnRk9SQklEREVOJztcbiAgcHVibGljIHJlYWRvbmx5IG9wZXJhdGlvbjogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgY2x1YklkPzogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKG9wZXJhdGlvbjogc3RyaW5nLCBjbHViSWQ/OiBzdHJpbmcpIHtcbiAgICBzdXBlcihgT3BlcmF0aW9uIG5vdCBhbGxvd2VkOiAke29wZXJhdGlvbn1gKTtcbiAgICB0aGlzLm5hbWUgPSAnQ2x1Yk9wZXJhdGlvbk5vdEFsbG93ZWRFcnJvcic7XG4gICAgdGhpcy5vcGVyYXRpb24gPSBvcGVyYXRpb247XG4gICAgdGhpcy5jbHViSWQgPSBjbHViSWQ7XG5cbiAgICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcbiAgICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIENsdWJPcGVyYXRpb25Ob3RBbGxvd2VkRXJyb3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENoZWNrIGlmIGVycm9yIGlzIGEgY2x1Yi1zcGVjaWZpYyBlcnJvclxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNDbHViRXJyb3IoZXJyb3I6IHVua25vd24pOiBlcnJvciBpcyBDbHViTm90Rm91bmRFcnJvciB8IENsdWJOYW1lQ29uZmxpY3RFcnJvciB8IEludmFsaWRDbHViU3RhdHVzRXJyb3IgfCBDbHViU3RhdHVzVHJhbnNpdGlvbkVycm9yIHwgQ2x1YlZhbGlkYXRpb25FcnJvciB8IENsdWJPcGVyYXRpb25Ob3RBbGxvd2VkRXJyb3Ige1xuICByZXR1cm4gZXJyb3IgaW5zdGFuY2VvZiBDbHViTm90Rm91bmRFcnJvciB8fFxuICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBDbHViTmFtZUNvbmZsaWN0RXJyb3IgfHxcbiAgICAgICAgIGVycm9yIGluc3RhbmNlb2YgSW52YWxpZENsdWJTdGF0dXNFcnJvciB8fFxuICAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBDbHViU3RhdHVzVHJhbnNpdGlvbkVycm9yIHx8XG4gICAgICAgICBlcnJvciBpbnN0YW5jZW9mIENsdWJWYWxpZGF0aW9uRXJyb3IgfHxcbiAgICAgICAgIGVycm9yIGluc3RhbmNlb2YgQ2x1Yk9wZXJhdGlvbk5vdEFsbG93ZWRFcnJvcjtcbn1cblxuLyoqXG4gKiBDcmVhdGUgZXJyb3IgcmVzcG9uc2UgZm9yIGNsdWIgZXJyb3JzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDbHViRXJyb3JSZXNwb25zZShlcnJvcjogRXJyb3IsIHJlcXVlc3RJZDogc3RyaW5nKSB7XG4gIGlmIChpc0NsdWJFcnJvcihlcnJvcikpIHtcbiAgICByZXR1cm4ge1xuICAgICAgZXJyb3I6IGVycm9yLmVycm9yVHlwZSxcbiAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICBkZXRhaWxzOiB7XG4gICAgICAgIC4uLihlcnJvciBpbnN0YW5jZW9mIENsdWJOb3RGb3VuZEVycm9yICYmIGVycm9yLmNsdWJJZCAmJiB7IGNsdWJJZDogZXJyb3IuY2x1YklkIH0pLFxuICAgICAgICAuLi4oZXJyb3IgaW5zdGFuY2VvZiBDbHViTmFtZUNvbmZsaWN0RXJyb3IgJiYgeyBjbHViTmFtZTogZXJyb3IuY2x1Yk5hbWUgfSksXG4gICAgICAgIC4uLihlcnJvciBpbnN0YW5jZW9mIEludmFsaWRDbHViU3RhdHVzRXJyb3IgJiYgeyBzdGF0dXM6IGVycm9yLnN0YXR1cyB9KSxcbiAgICAgICAgLi4uKGVycm9yIGluc3RhbmNlb2YgQ2x1YlN0YXR1c1RyYW5zaXRpb25FcnJvciAmJiB7IFxuICAgICAgICAgIGZyb21TdGF0dXM6IGVycm9yLmZyb21TdGF0dXMsIFxuICAgICAgICAgIHRvU3RhdHVzOiBlcnJvci50b1N0YXR1cyBcbiAgICAgICAgfSksXG4gICAgICAgIC4uLihlcnJvciBpbnN0YW5jZW9mIENsdWJWYWxpZGF0aW9uRXJyb3IgJiYgZXJyb3IuZmllbGQgJiYgeyBmaWVsZDogZXJyb3IuZmllbGQgfSksXG4gICAgICAgIC4uLihlcnJvciBpbnN0YW5jZW9mIENsdWJPcGVyYXRpb25Ob3RBbGxvd2VkRXJyb3IgJiYgeyBcbiAgICAgICAgICBvcGVyYXRpb246IGVycm9yLm9wZXJhdGlvbixcbiAgICAgICAgICAuLi4oZXJyb3IuY2x1YklkICYmIHsgY2x1YklkOiBlcnJvci5jbHViSWQgfSlcbiAgICAgICAgfSksXG4gICAgICB9LFxuICAgICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgICByZXF1ZXN0SWQsXG4gICAgfTtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIGZvciBub24tY2x1YiBlcnJvcnNcbiAgcmV0dXJuIHtcbiAgICBlcnJvcjogJ0lOVEVSTkFMX0VSUk9SJyxcbiAgICBtZXNzYWdlOiAnQW4gdW5leHBlY3RlZCBlcnJvciBvY2N1cnJlZCcsXG4gICAgdGltZXN0YW1wOiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgcmVxdWVzdElkLFxuICB9O1xufSJdfQ==