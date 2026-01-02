import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createResponse } from '../../../shared/utils/lambda-utils';
import { validateAuthContext } from '../../../shared/auth/auth-context';
import { AuthorizationService } from '../../../shared/authorization/authorization-service';
import { ClubCapability } from '../../../shared/types/club-authorization';
import { SearchTemplatesQuery, RouteTemplateError } from '../../../shared/types/route-template';

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

const TABLE_NAME = process.env.MAIN_TABLE_NAME!;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate authentication
    const authContext = validateAuthContext(event);
    
    // Extract path parameters
    const clubId = event.pathParameters?.clubId;
    
    if (!clubId) {
      throw new RouteTemplateError('Missing club ID', 'MISSING_CLUB_ID', 400);
    }

    // Check authorization - club members can search templates
    const authService = new AuthorizationService();
    const hasPermission = await authService.hasCapability(
      authContext.userId,
      clubId,
      ClubCapability.VIEW_CLUB_TEMPLATES
    );
    
    if (!hasPermission) {
      throw new RouteTemplateError('Insufficient privileges to view templates', 'INSUFFICIENT_PRIVILEGES', 403);
    }

    // Parse query parameters
    const query = parseSearchQuery(event.queryStringParameters || {});
    
    // Search templates
    const results = await searchTemplates(clubId, query);
    
    return createResponse(200, {
      success: true,
      data: {
        templates: results.templates,
        pagination: {
          limit: query.limit,
          nextCursor: results.nextCursor,
          hasMore: results.hasMore,
        },
      },
    });
    
  } catch (error) {
    console.error('Error searching templates:', error);
    
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
      message: 'Failed to search templates',
    });
  }
};

function parseSearchQuery(queryParams: Record<string, string | undefined>): SearchTemplatesQuery {
  const limit = Math.min(
    parseInt(queryParams.limit || DEFAULT_LIMIT.toString()),
    MAX_LIMIT
  );
  
  return {
    query: queryParams.query,
    difficulty: queryParams.difficulty as any,
    terrain: queryParams.terrain as any,
    category: queryParams.category as any,
    limit,
    cursor: queryParams.cursor,
  };
}

async function searchTemplates(clubId: string, query: SearchTemplatesQuery): Promise<{
  templates: any[];
  nextCursor?: string;
  hasMore: boolean;
}> {
  // Build DynamoDB query
  const queryParams: any = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: {
      ':pk': `CLUB#${clubId}#TEMPLATES`,
    },
    Limit: query.limit,
  };
  
  // Add cursor for pagination
  if (query.cursor) {
    try {
      queryParams.ExclusiveStartKey = JSON.parse(Buffer.from(query.cursor, 'base64').toString());
    } catch (error) {
      throw new RouteTemplateError('Invalid cursor', 'INVALID_CURSOR', 400);
    }
  }
  
  // Add filters
  const filterExpressions: string[] = [];
  const filterValues: Record<string, any> = { ...queryParams.ExpressionAttributeValues };
  
  if (query.difficulty) {
    filterExpressions.push('difficulty = :difficulty');
    filterValues[':difficulty'] = query.difficulty;
  }
  
  if (query.terrain) {
    filterExpressions.push('terrain = :terrain');
    filterValues[':terrain'] = query.terrain;
  }
  
  if (query.category) {
    filterExpressions.push('category = :category');
    filterValues[':category'] = query.category;
  }
  
  if (query.query) {
    // Simple text search in template name and description
    filterExpressions.push('(contains(templateName, :searchQuery) OR contains(description, :searchQuery))');
    filterValues[':searchQuery'] = query.query;
  }
  
  if (filterExpressions.length > 0) {
    queryParams.FilterExpression = filterExpressions.join(' AND ');
    queryParams.ExpressionAttributeValues = filterValues;
  }
  
  // Execute query
  const response = await dynamoClient.send(new QueryCommand(queryParams));
  
  // Process results
  const templates = (response.Items || []).map(item => ({
    templateId: item.templateId,
    templateName: item.templateName,
    description: item.description,
    difficulty: item.difficulty,
    terrain: item.terrain,
    category: item.category,
    usageCount: item.usageCount || 0,
    tags: item.tags || [],
    createdAt: item.createdAt,
    createdBy: item.createdBy,
  }));
  
  // Generate next cursor
  let nextCursor: string | undefined;
  if (response.LastEvaluatedKey) {
    nextCursor = Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString('base64');
  }
  
  return {
    templates,
    nextCursor,
    hasMore: !!response.LastEvaluatedKey,
  };
}