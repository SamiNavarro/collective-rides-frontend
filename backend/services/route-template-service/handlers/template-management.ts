import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { createResponse, parseJsonBody } from '../../../shared/utils/lambda-utils';
import { validateAuthContext } from '../../../shared/auth/auth-context';
import { AuthorizationService } from '../../../shared/authorization/authorization-service';
import { ClubCapability } from '../../../shared/types/club-authorization';
import { CreateTemplateRequest, RouteTemplateError, TemplateValidationError } from '../../../shared/types/route-template';
import { v4 as uuidv4 } from 'uuid';

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

const TABLE_NAME = process.env.MAIN_TABLE_NAME!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const method = event.httpMethod;
    
    switch (method) {
      case 'POST':
        return await handleCreateTemplate(event);
      case 'GET':
        return await handleGetTemplate(event);
      case 'PUT':
        return await handleUpdateTemplate(event);
      case 'DELETE':
        return await handleDeleteTemplate(event);
      default:
        throw new RouteTemplateError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
    }
    
  } catch (error) {
    console.error('Error in template management:', error);
    
    if (error instanceof RouteTemplateError) {
      return createResponse(error.statusCode, {
        success: false,
        error: error.code,
        message: error.message,
      });
    }
    
    return createResponse(500, {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to process template request',
    });
  }
};

async function handleCreateTemplate(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Validate authentication
  const authContext = validateAuthContext(event);
  
  // Extract path parameters
  const clubId = event.pathParameters?.clubId;
  
  if (!clubId) {
    throw new RouteTemplateError('Missing club ID', 'MISSING_CLUB_ID', 400);
  }

  // Check authorization - only leaders/captains can create templates
  const authService = new AuthorizationService();
  const hasPermission = await authService.hasCapability(
    authContext.userId,
    clubId,
    ClubCapability.CREATE_ROUTE_TEMPLATES
  );
  
  if (!hasPermission) {
    throw new RouteTemplateError('Insufficient privileges to create route templates', 'INSUFFICIENT_PRIVILEGES', 403);
  }

  // Parse and validate request
  const request = parseJsonBody<CreateTemplateRequest>(event);
  validateCreateTemplateRequest(request);
  
  // Verify source route exists and user has access
  await verifySourceRouteAccess(clubId, request.sourceRouteId, authContext.userId);
  
  // Create template
  const templateId = uuidv4();
  const now = new Date().toISOString();
  
  const template = {
    PK: `CLUB#${clubId}#TEMPLATES`,
    SK: `TEMPLATE#${templateId}`,
    templateId,
    templateName: request.templateName,
    description: request.description,
    tags: request.tags,
    sourceRouteId: request.sourceRouteId,
    routeVersion: 1, // Default to version 1 for MVP
    category: request.category,
    difficulty: request.difficulty,
    terrain: request.terrain,
    usageCount: 0,
    visibility: request.visibility,
    allowDownload: request.allowDownload,
    createdBy: authContext.userId,
    createdAt: now,
    updatedAt: now,
  };
  
  await dynamoClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: template,
  }));
  
  return createResponse(201, {
    success: true,
    data: {
      templateId,
      templateName: request.templateName,
      createdAt: now,
      visibility: request.visibility,
      usageCount: 0,
    },
  });
}

async function handleGetTemplate(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Validate authentication
  const authContext = validateAuthContext(event);
  
  // Extract path parameters
  const clubId = event.pathParameters?.clubId;
  const templateId = event.pathParameters?.templateId;
  
  if (!clubId || !templateId) {
    throw new RouteTemplateError('Missing required path parameters', 'MISSING_PARAMETERS', 400);
  }

  // Check authorization - club members can view templates
  const authService = new AuthorizationService();
  const hasPermission = await authService.hasCapability(
    authContext.userId,
    clubId,
    ClubCapability.VIEW_CLUB_TEMPLATES
  );
  
  if (!hasPermission) {
    throw new RouteTemplateError('Insufficient privileges to view templates', 'INSUFFICIENT_PRIVILEGES', 403);
  }

  // Get template
  const template = await getTemplate(clubId, templateId);
  
  if (!template) {
    throw new RouteTemplateError('Template not found', 'TEMPLATE_NOT_FOUND', 404);
  }
  
  return createResponse(200, {
    success: true,
    data: template,
  });
}

async function handleUpdateTemplate(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // MVP: Template updates deferred
  throw new RouteTemplateError('Template updates not implemented in MVP', 'NOT_IMPLEMENTED', 501);
}

async function handleDeleteTemplate(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // MVP: Template deletion deferred
  throw new RouteTemplateError('Template deletion not implemented in MVP', 'NOT_IMPLEMENTED', 501);
}

function validateCreateTemplateRequest(request: CreateTemplateRequest): void {
  if (!request.sourceRouteId || !request.sourceRouteId.trim()) {
    throw new TemplateValidationError('Source route ID is required');
  }
  
  if (!request.templateName || !request.templateName.trim()) {
    throw new TemplateValidationError('Template name is required');
  }
  
  if (request.templateName.length > 100) {
    throw new TemplateValidationError('Template name must be 100 characters or less');
  }
  
  if (!request.description || !request.description.trim()) {
    throw new TemplateValidationError('Description is required');
  }
  
  if (request.description.length > 1000) {
    throw new TemplateValidationError('Description must be 1000 characters or less');
  }
  
  if (!Array.isArray(request.tags)) {
    throw new TemplateValidationError('Tags must be an array');
  }
  
  if (request.tags.length > 10) {
    throw new TemplateValidationError('Maximum 10 tags allowed');
  }
  
  const validCategories = ['training', 'recreational', 'competitive', 'touring'];
  if (!validCategories.includes(request.category)) {
    throw new TemplateValidationError('Invalid category');
  }
  
  const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
  if (!validDifficulties.includes(request.difficulty)) {
    throw new TemplateValidationError('Invalid difficulty');
  }
  
  const validTerrains = ['road', 'gravel', 'mountain', 'mixed'];
  if (!validTerrains.includes(request.terrain)) {
    throw new TemplateValidationError('Invalid terrain');
  }
  
  const validVisibilities = ['private', 'club'];
  if (!validVisibilities.includes(request.visibility)) {
    throw new TemplateValidationError('Invalid visibility (MVP supports private and club only)');
  }
  
  if (typeof request.allowDownload !== 'boolean') {
    throw new TemplateValidationError('allowDownload must be a boolean');
  }
}

async function verifySourceRouteAccess(clubId: string, routeId: string, userId: string): Promise<void> {
  // Check if the source route exists and user has access
  const response = await dynamoClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `CLUB#${clubId}`,
      SK: `RIDE#${routeId}`,
    },
  }));
  
  if (!response.Item) {
    throw new TemplateValidationError('Source route not found');
  }
  
  // Additional access checks could be added here
  // For MVP, we assume if user can create templates, they can access club routes
}

async function getTemplate(clubId: string, templateId: string): Promise<any> {
  const response = await dynamoClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `CLUB#${clubId}#TEMPLATES`,
      SK: `TEMPLATE#${templateId}`,
    },
  }));
  
  return response.Item;
}