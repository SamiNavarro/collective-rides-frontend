/**
 * Error Utilities - Phase 1.2
 * 
 * Standardized error types and handling utilities.
 * 
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 */

/**
 * Base application error class
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorType: string;
  
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  readonly errorType = 'UNAUTHORIZED';
  
  constructor(message: string = 'Authentication required') {
    super(message);
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  readonly statusCode = 403;
  readonly errorType = 'FORBIDDEN';
  
  constructor(message: string = 'Insufficient privileges') {
    super(message);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorType = 'NOT_FOUND';
  
  constructor(message: string = 'Resource not found') {
    super(message);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly errorType = 'VALIDATION_ERROR';
  
  constructor(message: string) {
    super(message);
  }
}

/**
 * Conflict error (409)
 */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly errorType = 'CONFLICT';
  
  constructor(message: string = 'Resource conflict') {
    super(message);
  }
}

/**
 * Internal server error (500)
 */
export class InternalError extends AppError {
  readonly statusCode = 500;
  readonly errorType = 'INTERNAL_ERROR';
  
  constructor(message: string = 'Internal server error') {
    super(message);
  }
}

/**
 * Check if error is an application error
 * 
 * @param error - Error to check
 * @returns True if it's an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Get error message from unknown error
 * 
 * @param error - Unknown error
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'Unknown error occurred';
}

/**
 * Get HTTP status code from error
 * 
 * @param error - Error object
 * @returns HTTP status code
 */
export function getErrorStatusCode(error: unknown): number {
  if (isAppError(error)) {
    return error.statusCode;
  }
  
  return 500; // Default to internal server error
}

/**
 * Get error type from error
 * 
 * @param error - Error object
 * @returns Error type string
 */
export function getErrorType(error: unknown): string {
  if (isAppError(error)) {
    return error.errorType;
  }
  
  return 'INTERNAL_ERROR';
}