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
 * Get CORS headers based on the request origin
 * Supports both localhost and Vercel deployments
 */
function getCorsHeaders(origin?: string): Record<string, string> {
  // List of allowed origins (exact matches)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://collective-rides-frontend.vercel.app',
    'https://sydneycycles.com',
    'https://collectiverides.com',
  ];
  
  // Check if origin is allowed
  let allowOrigin = 'http://localhost:3000'; // Default fallback
  
  if (origin) {
    // Check exact match first
    if (allowedOrigins.includes(origin)) {
      allowOrigin = origin;
    }
    // Check for Vercel preview deployments (*.vercel.app)
    else if (origin.endsWith('.vercel.app') && origin.startsWith('https://')) {
      allowOrigin = origin;
    }
  }
  
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };
}

/**
 * Create a generic API response
 * 
 * @param statusCode - HTTP status code
 * @param body - Response body
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
export function createResponse(
  statusCode: number,
  body: any,
  origin?: string
): APIGatewayProxyResult {
  return {
    statusCode,
    headers: getCorsHeaders(origin),
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
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: HttpStatusCode = HttpStatusCode.OK,
  origin?: string
): APIGatewayProxyResult {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  
  return {
    statusCode,
    headers: getCorsHeaders(origin),
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
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
export function createErrorResponse(
  error: ApiErrorType | string,
  message: string,
  statusCode: HttpStatusCode,
  requestId?: string,
  origin?: string
): APIGatewayProxyResult {
  const response: ErrorResponse = {
    error,
    message,
    timestamp: new Date().toISOString(),
    requestId,
  };
  
  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(response),
  };
}

/**
 * Create a validation error response
 * 
 * @param message - Validation error message
 * @param requestId - Optional request ID
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
export function createValidationErrorResponse(
  message: string,
  requestId?: string,
  origin?: string
): APIGatewayProxyResult {
  return createErrorResponse(
    ApiErrorType.VALIDATION_ERROR,
    message,
    HttpStatusCode.BAD_REQUEST,
    requestId,
    origin
  );
}

/**
 * Create an unauthorized error response
 * 
 * @param message - Error message (default: 'Unauthorized')
 * @param requestId - Optional request ID
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
export function createUnauthorizedResponse(
  message: string = 'Unauthorized',
  requestId?: string,
  origin?: string
): APIGatewayProxyResult {
  return createErrorResponse(
    ApiErrorType.UNAUTHORIZED,
    message,
    HttpStatusCode.UNAUTHORIZED,
    requestId,
    origin
  );
}

/**
 * Create a forbidden error response
 * 
 * @param message - Error message (default: 'Forbidden')
 * @param requestId - Optional request ID
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
export function createForbiddenResponse(
  message: string = 'Forbidden',
  requestId?: string,
  origin?: string
): APIGatewayProxyResult {
  return createErrorResponse(
    ApiErrorType.FORBIDDEN,
    message,
    HttpStatusCode.FORBIDDEN,
    requestId,
    origin
  );
}

/**
 * Create a not found error response
 * 
 * @param message - Error message (default: 'Not found')
 * @param requestId - Optional request ID
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
export function createNotFoundResponse(
  message: string = 'Not found',
  requestId?: string,
  origin?: string
): APIGatewayProxyResult {
  return createErrorResponse(
    ApiErrorType.NOT_FOUND,
    message,
    HttpStatusCode.NOT_FOUND,
    requestId,
    origin
  );
}

/**
 * Create an internal server error response
 * 
 * @param message - Error message (default: 'Internal server error')
 * @param requestId - Optional request ID
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
export function createInternalErrorResponse(
  message: string = 'Internal server error',
  requestId?: string,
  origin?: string
): APIGatewayProxyResult {
  return createErrorResponse(
    ApiErrorType.INTERNAL_ERROR,
    message,
    HttpStatusCode.INTERNAL_SERVER_ERROR,
    requestId,
    origin
  );
}

/**
 * Handle Lambda function errors and convert to appropriate HTTP responses
 * 
 * @param error - Error object
 * @param requestId - Request ID for logging
 * @param origin - Request origin for CORS
 * @returns API Gateway proxy result
 */
export function handleLambdaError(error: unknown, requestId?: string, origin?: string): APIGatewayProxyResult {
  console.error('Lambda error:', error, { requestId });
  
  if (error instanceof Error) {
    const message = error.message;
    
    // Map specific error messages to HTTP status codes
    if (message.includes('Authentication required') || message.includes('JWT')) {
      return createUnauthorizedResponse(message, requestId, origin);
    }
    
    if (message.includes('privileges required') || message.includes('Forbidden')) {
      return createForbiddenResponse(message, requestId, origin);
    }
    
    if (message.includes('not found') || message.includes('Not found')) {
      return createNotFoundResponse(message, requestId, origin);
    }
    
    if (message.includes('validation') || message.includes('Invalid')) {
      return createValidationErrorResponse(message, requestId, origin);
    }
  }
  
  // Default to internal server error
  return createInternalErrorResponse('An unexpected error occurred', requestId, origin);
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