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
export class MembershipNotFoundError extends Error {
  public readonly statusCode = 404;
  public readonly errorType = 'MEMBERSHIP_NOT_FOUND';
  public readonly membershipId?: string;
  public readonly clubId?: string;
  public readonly userId?: string;

  constructor(membershipId?: string, clubId?: string, userId?: string) {
    super('Membership not found');
    this.name = 'MembershipNotFoundError';
    this.membershipId = membershipId;
    this.clubId = clubId;
    this.userId = userId;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MembershipNotFoundError);
    }
  }
}

/**
 * Already member error
 */
export class AlreadyMemberError extends Error {
  public readonly statusCode = 409;
  public readonly errorType = 'ALREADY_MEMBER';
  public readonly clubId: string;
  public readonly userId: string;

  constructor(clubId: string, userId: string) {
    super('User is already a member of this club');
    this.name = 'AlreadyMemberError';
    this.clubId = clubId;
    this.userId = userId;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AlreadyMemberError);
    }
  }
}

/**
 * Membership limit exceeded error
 */
export class MembershipLimitExceededError extends Error {
  public readonly statusCode = 409;
  public readonly errorType = 'MEMBERSHIP_LIMIT_EXCEEDED';
  public readonly clubId: string;
  public readonly currentCount: number;
  public readonly maxLimit: number;

  constructor(clubId: string, currentCount: number, maxLimit: number) {
    super(`Club membership limit exceeded (${currentCount}/${maxLimit})`);
    this.name = 'MembershipLimitExceededError';
    this.clubId = clubId;
    this.currentCount = currentCount;
    this.maxLimit = maxLimit;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MembershipLimitExceededError);
    }
  }
}

/**
 * Invalid role transition error
 */
export class InvalidRoleTransitionError extends Error {
  public readonly statusCode = 400;
  public readonly errorType = 'INVALID_ROLE_TRANSITION';
  public readonly fromRole: string;
  public readonly toRole: string;

  constructor(fromRole: string, toRole: string) {
    super(`Invalid role transition from ${fromRole} to ${toRole}`);
    this.name = 'InvalidRoleTransitionError';
    this.fromRole = fromRole;
    this.toRole = toRole;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidRoleTransitionError);
    }
  }
}

/**
 * Cannot remove owner error
 */
export class CannotRemoveOwnerError extends Error {
  public readonly statusCode = 400;
  public readonly errorType = 'CANNOT_REMOVE_OWNER';
  public readonly clubId: string;
  public readonly userId: string;

  constructor(clubId: string, userId: string) {
    super('Cannot remove club owner - ownership transfer required');
    this.name = 'CannotRemoveOwnerError';
    this.clubId = clubId;
    this.userId = userId;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CannotRemoveOwnerError);
    }
  }
}

/**
 * Invalid membership status transition error
 */
export class InvalidMembershipStatusTransitionError extends Error {
  public readonly statusCode = 400;
  public readonly errorType = 'INVALID_MEMBERSHIP_STATUS_TRANSITION';
  public readonly fromStatus: string;
  public readonly toStatus: string;

  constructor(fromStatus: string, toStatus: string) {
    super(`Invalid membership status transition from ${fromStatus} to ${toStatus}`);
    this.name = 'InvalidMembershipStatusTransitionError';
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidMembershipStatusTransitionError);
    }
  }
}

/**
 * Membership operation not allowed error
 */
export class MembershipOperationNotAllowedError extends Error {
  public readonly statusCode = 403;
  public readonly errorType = 'MEMBERSHIP_OPERATION_NOT_ALLOWED';
  public readonly operation: string;
  public readonly membershipId?: string;
  public readonly reason?: string;

  constructor(operation: string, membershipId?: string, reason?: string) {
    super(`Membership operation not allowed: ${operation}${reason ? ` - ${reason}` : ''}`);
    this.name = 'MembershipOperationNotAllowedError';
    this.operation = operation;
    this.membershipId = membershipId;
    this.reason = reason;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MembershipOperationNotAllowedError);
    }
  }
}

/**
 * Check if error is a membership-specific error
 */
export function isMembershipError(error: unknown): error is MembershipNotFoundError | AlreadyMemberError | MembershipLimitExceededError | InvalidRoleTransitionError | CannotRemoveOwnerError | InvalidMembershipStatusTransitionError | MembershipOperationNotAllowedError {
  return error instanceof MembershipNotFoundError ||
         error instanceof AlreadyMemberError ||
         error instanceof MembershipLimitExceededError ||
         error instanceof InvalidRoleTransitionError ||
         error instanceof CannotRemoveOwnerError ||
         error instanceof InvalidMembershipStatusTransitionError ||
         error instanceof MembershipOperationNotAllowedError;
}

/**
 * Create error response for membership errors
 */
export function createMembershipErrorResponse(error: Error, requestId: string) {
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