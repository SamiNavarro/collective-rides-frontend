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
export class ClubNotFoundError extends Error {
  public readonly statusCode = 404;
  public readonly errorType = 'NOT_FOUND';
  public readonly clubId?: string;

  constructor(clubId?: string) {
    super('Club not found');
    this.name = 'ClubNotFoundError';
    this.clubId = clubId;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ClubNotFoundError);
    }
  }
}

/**
 * Club name conflict error
 */
export class ClubNameConflictError extends Error {
  public readonly statusCode = 409;
  public readonly errorType = 'CONFLICT';
  public readonly clubName: string;

  constructor(clubName: string) {
    super('Club name already exists');
    this.name = 'ClubNameConflictError';
    this.clubName = clubName;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ClubNameConflictError);
    }
  }
}

/**
 * Invalid club status error
 */
export class InvalidClubStatusError extends Error {
  public readonly statusCode = 400;
  public readonly errorType = 'VALIDATION_ERROR';
  public readonly status: string;

  constructor(status: string) {
    super(`Invalid club status: ${status}`);
    this.name = 'InvalidClubStatusError';
    this.status = status;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidClubStatusError);
    }
  }
}

/**
 * Club status transition error
 */
export class ClubStatusTransitionError extends Error {
  public readonly statusCode = 400;
  public readonly errorType = 'VALIDATION_ERROR';
  public readonly fromStatus: string;
  public readonly toStatus: string;

  constructor(fromStatus: string, toStatus: string) {
    super(`Cannot transition club status from ${fromStatus} to ${toStatus}`);
    this.name = 'ClubStatusTransitionError';
    this.fromStatus = fromStatus;
    this.toStatus = toStatus;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ClubStatusTransitionError);
    }
  }
}

/**
 * Club validation error
 */
export class ClubValidationError extends Error {
  public readonly statusCode = 400;
  public readonly errorType = 'VALIDATION_ERROR';
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ClubValidationError';
    this.field = field;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ClubValidationError);
    }
  }
}

/**
 * Club operation not allowed error
 */
export class ClubOperationNotAllowedError extends Error {
  public readonly statusCode = 403;
  public readonly errorType = 'FORBIDDEN';
  public readonly operation: string;
  public readonly clubId?: string;

  constructor(operation: string, clubId?: string) {
    super(`Operation not allowed: ${operation}`);
    this.name = 'ClubOperationNotAllowedError';
    this.operation = operation;
    this.clubId = clubId;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ClubOperationNotAllowedError);
    }
  }
}

/**
 * Check if error is a club-specific error
 */
export function isClubError(error: unknown): error is ClubNotFoundError | ClubNameConflictError | InvalidClubStatusError | ClubStatusTransitionError | ClubValidationError | ClubOperationNotAllowedError {
  return error instanceof ClubNotFoundError ||
         error instanceof ClubNameConflictError ||
         error instanceof InvalidClubStatusError ||
         error instanceof ClubStatusTransitionError ||
         error instanceof ClubValidationError ||
         error instanceof ClubOperationNotAllowedError;
}

/**
 * Create error response for club errors
 */
export function createClubErrorResponse(error: Error, requestId: string) {
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