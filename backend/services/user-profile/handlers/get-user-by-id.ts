/**
 * Get User By ID Handler - Phase 1.2
 * 
 * Lambda handler for GET /users/{id} endpoint.
 * Requires SiteAdmin privileges as defined in the canonical specification.
 * 
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createEnhancedAuthContext } from '../../../shared/auth/auth-context';
import { createSuccessResponse, handleLambdaError, logStructured } from '../../../shared/utils/lambda-utils';
import { ValidationError } from '../../../shared/utils/errors';
import { DynamoDBUserRepository } from '../infrastructure/dynamodb-user-repository';
import { UserService } from '../domain/user-service';
import { 
  SystemCapability, 
  requireCapability,
  createAuthorizationErrorResponse,
  isAuthorizationError 
} from '../../../shared/authorization';

// Environment variables
const TABLE_NAME = process.env.TABLE_NAME!;

// Initialize repository and service
const userRepository = new DynamoDBUserRepository(TABLE_NAME);
const userService = new UserService(userRepository);

/**
 * Lambda handler for GET /users/{id}
 * 
 * @param event - API Gateway proxy event
 * @returns API Gateway proxy result
 */
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  
  logStructured('INFO', 'Processing get user by ID request', {
    requestId,
    httpMethod: event.httpMethod,
    path: event.path,
  });
  
  try {
    // Extract user ID from path parameters
    const userId = event.pathParameters?.id;
    
    if (!userId) {
      throw new ValidationError('User ID is required');
    }
    
    // Create enhanced authentication context with database-sourced role information
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);
    
    logStructured('INFO', 'Authentication context created', {
      requestId,
      requestingUserId: authContext.userId,
      targetUserId: userId,
      isAuthenticated: authContext.isAuthenticated,
      isSiteAdmin: authContext.isSiteAdmin,
    });
    
    // Check authorization using the new authorization service
    await requireCapability(SystemCapability.MANAGE_ALL_CLUBS, `user:${userId}`)(authContext);
    
    // Get user by ID (authorization already validated)
    const user = await userService.getUserById(userId, authContext);
    
    logStructured('INFO', 'User retrieved successfully', {
      requestId,
      requestingUserId: authContext.userId,
      targetUserId: userId,
      systemRole: user.systemRole,
    });
    
    return createSuccessResponse(user);
  } catch (error) {
    logStructured('ERROR', 'Error processing get user by ID request', {
      requestId,
      targetUserId: event.pathParameters?.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Handle authorization errors with proper response format
    if (isAuthorizationError(error)) {
      return {
        statusCode: error.statusCode,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify(createAuthorizationErrorResponse(error, requestId)),
      };
    }
    
    return handleLambdaError(error, requestId);
  }
}