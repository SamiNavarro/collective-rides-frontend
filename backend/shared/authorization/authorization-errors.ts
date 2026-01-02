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
export enum AuthorizationErrorType {
  INSUFFICIENT_PRIVILEGES = 'INSUFFICIENT_PRIVILEGES',
  CAPABILITY_NOT_FOUND = 'CAPABILITY_NOT_FOUND',
  AUTHORIZATION_SERVICE_ERROR = 'AUTHORIZATION_SERVICE_ERROR',
  USER_DATA_UNAVAILABLE = 'USER_DATA_UNAVAILABLE',
}

/**
 * Base authorization error class
 */
export class AuthorizationError extends Error {
  public readonly errorType: AuthorizationErrorType;
  public readonly statusCode: number;
  public readonly capability?: SystemCapability;
  public readonly userId?: string;
  public readonly resource?: string;
  public readonly cause?: Error;

  constructor(
    message: string,
    errorType: AuthorizationErrorType,
    statusCode: number = 403,
    options?: {
      capability?: SystemCapability;
      userId?: string;
      resource?: string;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'AuthorizationError';
    this.errorType = errorType;
    this.statusCode = statusCode;
    this.capability = options?.capability;
    this.userId = options?.userId;
    this.resource = options?.resource;
    
    if (options?.cause) {
      this.cause = options.cause;
    }
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthorizationError);
    }
  }
}

/**
 * Insufficient privileges error
 */
export class InsufficientPrivilegesError extends AuthorizationError {
  constructor(
    capability: SystemCapability | string,
    userId?: string,
    resource?: string
  ) {
    const message = `Insufficient privileges: ${capability} required`;
    super(message, AuthorizationErrorType.INSUFFICIENT_PRIVILEGES, 403, {
      capability: capability as SystemCapability,
      userId,
      resource,
    });
  }
}

/**
 * Capability not found error
 */
export class CapabilityNotFoundError extends AuthorizationError {
  constructor(capability: string) {
    const message = `Unknown capability: ${capability}`;
    super(message, AuthorizationErrorType.CAPABILITY_NOT_FOUND, 400, {
      capability: capability as SystemCapability,
    });
  }
}

/**
 * Authorization service error
 */
export class AuthorizationServiceError extends AuthorizationError {
  constructor(message: string, cause?: Error) {
    super(message, AuthorizationErrorType.AUTHORIZATION_SERVICE_ERROR, 500, {
      cause,
    });
  }
}

/**
 * User data unavailable error
 */
export class UserDataUnavailableError extends AuthorizationError {
  constructor(userId: string, cause?: Error) {
    const message = `User data unavailable for authorization: ${userId}`;
    super(message, AuthorizationErrorType.USER_DATA_UNAVAILABLE, 500, {
      userId,
      cause,
    });
  }
}

/**
 * Create authorization error response object
 */
export function createAuthorizationErrorResponse(error: AuthorizationError, requestId: string) {
  return {
    error: error.errorType,
    message: error.message,
    details: {
      requiredCapability: error.capability,
      userId: error.userId,
      resource: error.resource,
    },
    timestamp: new Date().toISOString(),
    requestId,
  };
}

/**
 * Check if error is an authorization error
 */
export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}