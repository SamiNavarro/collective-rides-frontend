import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createResponse } from '../../../../shared/utils/lambda-utils';
import { validateAuthContext } from '../../../../shared/auth/auth-context';
import { AuthorizationService } from '../../../../shared/authorization/authorization-service';
import { ClubCapability } from '../../../../shared/types/club-authorization';
import { RouteFileError } from '../../../../shared/types/route-file';

const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

const TABLE_NAME = process.env.MAIN_TABLE_NAME!;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate authentication
    const authContext = validateAuthContext(event);

    // Extract path parameters
    const clubId = event.pathParameters?.clubId;
    const routeId = event.pathParameters?.routeId;

    if (!clubId || !routeId) {
      throw new RouteFileError('Missing required path parameters', 'MISSING_PARAMETERS', 400);
    }

    // Check authorization - club members can view analytics
    const authService = new AuthorizationService();
    const hasPermission = await authService.hasCapability(
      authContext.userId,
      clubId,
      ClubCapability.VIEW_ROUTE_ANALYTICS
    );

    if (!hasPermission) {
      throw new RouteFileError('Insufficient privileges to view route analytics', 'INSUFFICIENT_PRIVILEGES', 403);
    }

    // Get the latest analytics for this route
    const analytics = await getLatestAnalytics(clubId, routeId);

    if (!analytics) {
      throw new RouteFileError('Analytics not found', 'ANALYTICS_NOT_FOUND', 404);
    }

    // Generate CloudFront URL for elevation profile
    const elevationProfileUrl = generateCloudFrontUrl(analytics.elevationProfileKey);

    return createResponse(200, {
      success: true,
      data: {
        elevationSummary: analytics.elevationSummary,
        elevationProfileUrl,
        difficultyScore: analytics.difficultyScore,
        performanceMetrics: analytics.performanceMetrics,
        analyzedAt: analytics.analyzedAt,
        dataVersion: analytics.dataVersion,
      },
    });

  } catch (error) {
    console.error('Error getting route analytics:', error);

    if (error instanceof RouteFileError) {
      return createResponse(error.statusCode, {
        success: false,
        error: error.code,
        message: error.message,
      });
    }

    return createResponse(500, {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to get route analytics',
    });
  }
};

async function getLatestAnalytics(clubId: string, routeId: string): Promise<any> {
  // Query for analytics records, sorted by version (descending)
  const response = await dynamoClient.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `CLUB#${clubId}#ROUTE#${routeId}`,
      ':sk': 'ANALYTICS#',
    },
    ScanIndexForward: false, // Get latest version first
    Limit: 1,
  }));

  return response.Items && response.Items.length > 0 ? response.Items[0] : null;
}

function generateCloudFrontUrl(s3Key: string): string {
  if (CLOUDFRONT_DOMAIN) {
    return `https://${CLOUDFRONT_DOMAIN}/${s3Key}`;
  }

  // Fallback to direct S3 URL (not recommended for production)
  return `https://${process.env.ROUTES_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
}