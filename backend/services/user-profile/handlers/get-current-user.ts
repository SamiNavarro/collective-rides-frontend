/**
 * Get Current User Handler - Phase 1.2
 * 
 * Lambda handler for GET /users/me endpoint.
 * Implements lazy user creation as defined in the canonical specification.
 * 
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createAuthContext } from '../../../shared/auth/auth-context';
import { createSuccessResponse, handleLambdaError, logStructured } from '../../../shared/utils/lambda-utils';
import { DynamoDBUserRepository } from '../infrastructure/dynamodb-user-repository';
import { UserService } from '../domain/user-service';

// Environment variables
const TABLE_NAME = process.env.TABLE_NAME!;

// Initialize repository and service
const userRepository = new DynamoDBUserRepository(TABLE_NAME);
const userService = new UserService(userRepository);

/**
 * Lambda handler for GET /users/me
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logStructured('INFO', 'Processing get current user request', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
  });
  
  try {
    // Create authentication context from API Gateway event
    const authContext = createAuthContext(event.requestContext);
    
    logStructured('INFO', 'Authentication context created', {
      requestId,
      userId: authContext.userId,
      isAuthenticated: authContext.isAuthenticated,
      isSiteAdmin: authContext.isSiteAdmin,
    });
    
    // Get current user (with lazy creation)
    const user = await userService.getCurrentUser(authContext);
    
    logStructured('INFO', 'Current user retrieved successfully', {
      requestId,
      userId: user.id,
      systemRole: user.systemRole,
    });
    
    return createSuccessResponse(user);
  } catch (error) {
    logStructured('ERROR', 'Error processing get current user request', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return handleLambdaError(error, requestId);
  }
}