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
export class InvitationNotFoundError extends Error {
  public readonly statusCode = 404;
  public readonly errorType = 'INVITATION_NOT_FOUND';
  public readonly invitationId?: string;

  constructor(invitationId?: string) {
    super('Invitation not found');
    this.name = 'InvitationNotFoundError';
    this.invitationId = invitationId;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvitationNotFoundError);
    }
  }
}

/**
 * Invitation expired error
 */
export class InvitationExpiredError extends Error {
  public readonly statusCode = 410;
  public readonly errorType = 'INVITATION_EXPIRED';
  public readonly invitationId: string;
  public readonly expiresAt: string;

  constructor(invitationId: string, expiresAt: string) {
    super('Invitation has expired');
    this.name = 'InvitationExpiredError';
    this.invitationId = invitationId;
    this.expiresAt = expiresAt;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvitationExpiredError);
    }
  }
}

/**
 * Invitation already processed error
 */
export class InvitationAlreadyProcessedError extends Error {
  public readonly statusCode = 409;
  public readonly errorType = 'INVITATION_ALREADY_PROCESSED';
  public readonly invitationId: string;
  public readonly status: string;

  constructor(invitationId: string, status: string) {
    super(`Invitation already processed with status: ${status}`);
    this.name = 'InvitationAlreadyProcessedError';
    this.invitationId = invitationId;
    this.status = status;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvitationAlreadyProcessedError);
    }
  }
}

/**
 * Invalid invitation token error
 */
export class InvalidInvitationTokenError extends Error {
  public readonly statusCode = 401;
  public readonly errorType = 'INVALID_INVITATION_TOKEN';
  public readonly token?: string;

  constructor(token?: string) {
    super('Invalid invitation token');
    this.name = 'InvalidInvitationTokenError';
    this.token = token;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidInvitationTokenError);
    }
  }
}

/**
 * User already invited error
 */
export class UserAlreadyInvitedError extends Error {
  public readonly statusCode = 409;
  public readonly errorType = 'USER_ALREADY_INVITED';
  public readonly clubId: string;
  public readonly email?: string;
  public readonly userId?: string;

  constructor(clubId: string, email?: string, userId?: string) {
    super('User already has a pending invitation to this club');
    this.name = 'UserAlreadyInvitedError';
    this.clubId = clubId;
    this.email = email;
    this.userId = userId;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, UserAlreadyInvitedError);
    }
  }
}

/**
 * Cannot invite existing member error
 */
export class CannotInviteExistingMemberError extends Error {
  public readonly statusCode = 409;
  public readonly errorType = 'CANNOT_INVITE_EXISTING_MEMBER';
  public readonly clubId: string;
  public readonly userId: string;

  constructor(clubId: string, userId: string) {
    super('Cannot invite user who is already a member of this club');
    this.name = 'CannotInviteExistingMemberError';
    this.clubId = clubId;
    this.userId = userId;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CannotInviteExistingMemberError);
    }
  }
}

/**
 * Invitation operation not allowed error
 */
export class InvitationOperationNotAllowedError extends Error {
  public readonly statusCode = 403;
  public readonly errorType = 'INVITATION_OPERATION_NOT_ALLOWED';
  public readonly operation: string;
  public readonly invitationId?: string;
  public readonly reason?: string;

  constructor(operation: string, invitationId?: string, reason?: string) {
    super(`Invitation operation not allowed: ${operation}${reason ? ` - ${reason}` : ''}`);
    this.name = 'InvitationOperationNotAllowedError';
    this.operation = operation;
    this.invitationId = invitationId;
    this.reason = reason;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvitationOperationNotAllowedError);
    }
  }
}

/**
 * Check if error is an invitation-specific error
 */
export function isInvitationError(error: unknown): error is InvitationNotFoundError | InvitationExpiredError | InvitationAlreadyProcessedError | InvalidInvitationTokenError | UserAlreadyInvitedError | CannotInviteExistingMemberError | InvitationOperationNotAllowedError {
  return error instanceof InvitationNotFoundError ||
         error instanceof InvitationExpiredError ||
         error instanceof InvitationAlreadyProcessedError ||
         error instanceof InvalidInvitationTokenError ||
         error instanceof UserAlreadyInvitedError ||
         error instanceof CannotInviteExistingMemberError ||
         error instanceof InvitationOperationNotAllowedError;
}

/**
 * Create error response for invitation errors
 */
export function createInvitationErrorResponse(error: Error, requestId: string) {
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