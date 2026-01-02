/**
 * API Request/Response Types - Phase 1.2
 * 
 * Type definitions for API requests and responses as defined in the
 * canonical Phase 1.2 specification.
 * 
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 */

import { User, UpdateUserInput } from './user';

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  requestId?: string;
}

/**
 * GET /users/me response
 */
export interface GetCurrentUserResponse extends User {}

/**
 * GET /users/{id} response
 */
export interface GetUserByIdResponse extends User {}

/**
 * PUT /users/{id} request body
 */
export interface UpdateUserRequest extends UpdateUserInput {}

/**
 * PUT /users/{id} response
 */
export interface UpdateUserResponse extends User {}

/**
 * HTTP status codes used in the API
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * API error types
 */
export enum ApiErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}