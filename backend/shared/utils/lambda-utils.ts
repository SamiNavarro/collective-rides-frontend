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
import { ApiResponse, ErrorResponse, HttpStatusCode, ApiErrorType } from '../types/api';

/**
 * Create a generic API response
 * 
 * @param statusCode - HTTP status code
 * @param body - Response body
 * @returns API Gateway proxy result
 */
export function createResponse(
  statusCode: number,
  body: any
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

/**
 * Parse JSON from request body with error handling
 * 
 * @param body - Request body string
 * @returns Parsed JSON object
 */
export function parseJSON<T>(body: string | null): T {
  if (!body) {
    throw new Error('Request body is required');
  }
  
  try {
    return JSON.parse(body) as T;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Parse JSON from API Gateway event body
 * 
 * @param event - API Gateway proxy event
 * @returns Parsed JSON object
 */
export function parseJsonBody<T>(event: { body: string | null }): T {
  return parseJSON<T>(event.body);
}

/**
 * Create a successful API response
 * 
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 * @returns API Gateway proxy result
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: HttpStatusCode = HttpStatusCode.OK
): APIGatewayProxyResult {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(response),
  };
}

/**
 * Create an error API response
 * 
 * @param error - Error type
 * @param message - Error message
 * @param statusCode - HTTP status code
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
export function createErrorResponse(
  error: ApiErrorType | string,
  message: string,
  statusCode: HttpStatusCode,
  requestId?: string
): APIGatewayProxyResult {
  const response: ErrorResponse = {
    error,
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };
  
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(response),
  };
}

/**
 * Create a validation error response
 * 
 * @param message - Validation error message
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
export function createValidationErrorResponse(
  message: string,
  requestId?: string
): APIGatewayProxyResult {
  return createErrorResponse(
    ApiErrorType.VALIDATION_ERROR,
    message,
    HttpStatusCode.BAD_REQUEST,
    requestId
  );
}

/**
 * Create an unauthorized error response
 * 
 * @param message - Error message (default: 'Unauthorized')
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
export function createUnauthorizedResponse(
  message: string = 'Unauthorized',
  requestId?: string
): APIGatewayProxyResult {
  return createErrorResponse(
    ApiErrorType.UNAUTHORIZED,
    message,
    HttpStatusCode.UNAUTHORIZED,
    requestId
  );
}

/**
 * Create a forbidden error response
 * 
 * @param message - Error message (default: 'Forbidden')
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
export function createForbiddenResponse(
  message: string = 'Forbidden',
  requestId?: string
): APIGatewayProxyResult {
  return createErrorResponse(
    ApiErrorType.FORBIDDEN,
    message,
    HttpStatusCode.FORBIDDEN,
    requestId
  );
}

/**
 * Create a not found error response
 * 
 * @param message - Error message (default: 'Not found')
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
export function createNotFoundResponse(
  message: string = 'Not found',
  requestId?: string
): APIGatewayProxyResult {
  return createErrorResponse(
    ApiErrorType.NOT_FOUND,
    message,
    HttpStatusCode.NOT_FOUND,
    requestId
  );
}

/**
 * Create an internal server error response
 * 
 * @param message - Error message (default: 'Internal server error')
 * @param requestId - Optional request ID
 * @returns API Gateway proxy result
 */
export function createInternalErrorResponse(
  message: string = 'Internal server error',
  requestId?: string
): APIGatewayProxyResult {
  return createErrorResponse(
    ApiErrorType.INTERNAL_ERROR,
    message,
    HttpStatusCode.INTERNAL_SERVER_ERROR,
    requestId
  );
}

/**
 * Handle Lambda function errors and convert to appropriate HTTP responses
 * 
 * @param error - Error object
 * @param requestId - Request ID for logging
 * @returns API Gateway proxy result
 */
export function handleLambdaError(error: unknown, requestId?: string): APIGatewayProxyResult {
  console.error('Lambda error:', error, { requestId });
  
  if (error instanceof Error) {
    const message = error.message;
    
    // Map specific error messages to HTTP status codes
    if (message.includes('Authentication required') || message.includes('JWT')) {
      return createUnauthorizedResponse(message, requestId);
    }
    
    if (message.includes('privileges required') || message.includes('Forbidden')) {
      return createForbiddenResponse(message, requestId);
    }
    
    if (message.includes('not found') || message.includes('Not found')) {
      return createNotFoundResponse(message, requestId);
    }
    
    if (message.includes('validation') || message.includes('Invalid')) {
      return createValidationErrorResponse(message, requestId);
    }
  }
  
  // Default to internal server error
  return createInternalErrorResponse('An unexpected error occurred', requestId);
}

/**
 * Log structured information for CloudWatch
 * 
 * @param level - Log level
 * @param message - Log message
 * @param context - Additional context
 */
export function logStructured(
  level: 'INFO' | 'WARN' | 'ERROR',
  message: string,
  context: Record<string, any> = {}
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
  
  console.log(JSON.stringify(logEntry));
}