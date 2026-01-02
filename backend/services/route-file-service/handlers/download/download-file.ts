import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { createResponse } from '../../../../shared/utils/lambda-utils';
import { validateAuthContext } from '../../../../shared/auth/auth-context';
import { AuthorizationService } from '../../../../shared/authorization/authorization-service';
import { ClubCapability } from '../../../../shared/types/club-authorization';
import { RouteFileError } from '../../../../shared/types/route-file';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

const BUCKET_NAME = process.env.ROUTES_BUCKET_NAME!;
const TABLE_NAME = process.env.MAIN_TABLE_NAME!;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN!;
const DOWNLOAD_URL_EXPIRY = 15 * 60; // 15 minutes

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Validate authentication
    const authContext = validateAuthContext(event);
    
    // Extract path parameters
    const clubId = event.pathParameters?.clubId;
    const routeId = event.pathParameters?.routeId;
    const version = event.pathParameters?.version;
    
    if (!clubId || !routeId || !version) {
      throw new RouteFileError('Missing required path parameters', 'MISSING_PARAMETERS', 400);
    }

    // Check authorization - club members can download files
    const authService = new AuthorizationService();
    const hasPermission = await authService.hasCapability(
      authContext.userId,
      clubId,
      ClubCapability.DOWNLOAD_ROUTE_FILES
    );
    
    if (!hasPermission) {
      throw new RouteFileError('Insufficient privileges to download route files', 'INSUFFICIENT_PRIVILEGES', 403);
    }

    // Get file record from DynamoDB
    const fileRecord = await getFileRecord(clubId, routeId, parseInt(version));
    
    if (!fileRecord) {
      throw new RouteFileError('File not found', 'FILE_NOT_FOUND', 404);
    }
    
    if (fileRecord.processingStatus !== 'completed') {
      throw new RouteFileError('File is not ready for download', 'FILE_NOT_READY', 400);
    }

    // Verify file exists in S3
    await verifyFileExists(fileRecord.fileKey);
    
    // Generate signed download URL
    const downloadUrl = await generateSignedDownloadUrl(fileRecord.fileKey);
    
    return createResponse(200, {
      success: true,
      data: {
        downloadUrl,
        expiresAt: new Date(Date.now() + DOWNLOAD_URL_EXPIRY * 1000).toISOString(),
        fileName: fileRecord.fileName,
        fileSize: fileRecord.fileSize,
      },
    });
    
  } catch (error) {
    console.error('Error generating download URL:', error);
    
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
      message: 'Failed to generate download URL',
    });
  }
};

async function getFileRecord(clubId: string, routeId: string, version: number): Promise<any> {
  const response = await dynamoClient.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `CLUB#${clubId}#ROUTE#${routeId}`,
      SK: `FILE#${version}`,
    },
  }));
  
  return response.Item;
}

async function verifyFileExists(fileKey: string): Promise<void> {
  try {
    await s3Client.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    }));
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      throw new RouteFileError('File not found in storage', 'FILE_NOT_FOUND_IN_STORAGE', 404);
    }
    throw error;
  }
}

async function generateSignedDownloadUrl(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });
  
  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: DOWNLOAD_URL_EXPIRY,
  });
  
  // If CloudFront is configured, replace S3 URL with CloudFront URL
  if (CLOUDFRONT_DOMAIN) {
    const s3UrlPattern = new RegExp(`https://${BUCKET_NAME}\\.s3\\.[^/]+\\.amazonaws\\.com/`);
    return signedUrl.replace(s3UrlPattern, `https://${CLOUDFRONT_DOMAIN}/`);
  }
  
  return signedUrl;
}