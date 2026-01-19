/**
 * Lambda Utilities - Phase 1.2
 *
 * Utilities for Lambda function responses, error handling, and common
 * Lambda patterns.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 */
import { APIGatewayProxyResult } from 'aws-lambda';
import { HttpStatusCode, ApiErrorType } from '../types/api';
/**
 * Create a generic API response
 *
 * @param statusCode - HTTP status code
 * @param body - Response body
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
export declare function createResponse(statusCode: number, body: any, origin?: string): APIGatewayProxyResult;
/**
 * Parse JSON from request body with error handling
 *
 * @param body - Request body string
 * @returns Parsed JSON object
 */
export declare function parseJSON<T>(body: string | null): T;
/**
 * Parse JSON from API Gateway event body
 *
 * @param event - API Gateway proxy event
 * @returns Parsed JSON object
 */
export declare function parseJsonBody<T>(event: {
    body: string | null;
}): T;
/**
 * Create a successful API response
 *
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
export declare function createSuccessResponse<T>(data: T, statusCode?: HttpStatusCode, origin?: string): APIGatewayProxyResult;
/**
 * Create an error API response
 *
 * @param error - Error type
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param requestId - Optional request ID
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
export declare function createErrorResponse(error: ApiErrorType | string, message: string, statusCode: HttpStatusCode, requestId?: string, origin?: string): APIGatewayProxyResult;
/**
 * Create a validation error response
 *
 * @param message - Validation error message
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
export declare function createValidationErrorResponse(message: string, requestId?: string): APIGatewayProxyResult;
/**
 * Create an unauthorized error response
 *
 * @param message - Error message (default: 'Unauthorized')
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
export declare function createUnauthorizedResponse(message?: string, requestId?: string): APIGatewayProxyResult;
/**
 * Create a forbidden error response
 *
 * @param message - Error message (default: 'Forbidden')
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
export declare function createForbiddenResponse(message?: string, requestId?: string): APIGatewayProxyResult;
/**
 * Create a not found error response
 *
 * @param message - Error message (default: 'Not found')
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
export declare function createNotFoundResponse(message?: string, requestId?: string): APIGatewayProxyResult;
/**
 * Create an internal server error response
 *
 * @param message - Error message (default: 'Internal server error')
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
export declare function createInternalErrorResponse(message?: string, requestId?: string): APIGatewayProxyResult;
/**
 * Handle Lambda function errors and convert to appropriate HTTP responses
 *
 * @param error - Error object
 * @param requestId - Request ID for logging
 * @returns API Gateway proxy result
 */
export declare function handleLambdaError(error: unknown, requestId?: string): APIGatewayProxyResult;
/**
 * Log structured information for CloudWatch
 *
 * @param level - Log level
 * @param message - Log message
 * @param context - Additional context
 */
export declare function logStructured(level: 'INFO' | 'WARN' | 'ERROR', message: string, context?: Record<string, any>): void;
