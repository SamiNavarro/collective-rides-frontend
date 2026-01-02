import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createResponse, parseJsonBody } from '../../../../shared/utils/lambda-utils';
import { validateAuthContext } from '../../../../shared/auth/auth-context';
import { AuthorizationService } from '../../../../shared/authorization/authorization-service';
import { ClubCapability } from '../../../../shared/types/club-authorization';
import { RequestUploadUrlRequest, RouteFileError, FileValidationError } from '../../../../shared/types/route-file';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

const BUCKET_NAME = process.env.ROUTES_BUCKET_NAME!;
const TABLE_NAME = process.env.MAIN_TABLE_NAME!;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_CONTENT_TYPES = ['application/gpx+xml'];
const UPLOAD_URL_EXPIRY = 15 * 60; // 15 minutes

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

    // Parse request body
    const request = parseJsonBody<RequestUploadUrlRequest>(event);
    
    // Validate request
    validateUploadRequest(request);
    
    // Check authorization
    const authService = new AuthorizationService();
    const hasPermission = await authService.hasCapability(
      authContext.userId,
      clubId,
      ClubCapability.UPLOAD_ROUTE_FILES
    );
    
    if (!hasPermission) {
      throw new RouteFileError('Insufficient privileges to upload route files', 'INSUFFICIENT_PRIVILEGES', 403);
    }

    // Generate file metadata
    const fileId = uuidv4();
    const version = await getNextVersion(clubId, routeId);
    const fileKey = `gpx-files/${clubId}/${routeId}/v${version}.gpx`;
    
    // Create presigned URL for S3 upload
    const uploadUrl = await generatePresignedUploadUrl(fileKey, request);
    
    // Store file record in DynamoDB
    await storeFileRecord(clubId, routeId, version, fileId, request, authContext.userId);
    
    return createResponse(200, {
      success: true,
      data: {
        uploadUrl: uploadUrl.url,
        uploadFields: uploadUrl.fields,
        fileId,
        version,
        expiresAt: new Date(Date.now() + UPLOAD_URL_EXPIRY * 1000).toISOString(),
      },
    });
    
  } catch (error) {
    console.error('Error generating upload URL:', error);
    
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
      message: 'Failed to generate upload URL',
    });
  }
};

function validateUploadRequest(request: RequestUploadUrlRequest): void {
  if (!request.fileName || !request.fileName.trim()) {
    throw new FileValidationError('File name is required');
  }
  
  if (!request.contentType || !ALLOWED_CONTENT_TYPES.includes(request.contentType)) {
    throw new FileValidationError('Only GPX files are supported');
  }
  
  if (!request.fileSize || request.fileSize <= 0) {
    throw new FileValidationError('File size must be greater than 0');
  }
  
  if (request.fileSize > MAX_FILE_SIZE) {
    throw new FileValidationError('File size exceeds 10MB limit');
  }
  
  // Validate file extension
  const fileExtension = request.fileName.toLowerCase().split('.').pop();
  if (fileExtension !== 'gpx') {
    throw new FileValidationError('File must have .gpx extension');
  }
}

async function getNextVersion(clubId: string, routeId: string): Promise<number> {
  try {
    // Query existing files to determine next version
    const response = await dynamoClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `CLUB#${clubId}#ROUTE#${routeId}`,
        ':sk': 'FILE#',
      },
      ScanIndexForward: false, // Get latest version first
      Limit: 1,
    }));
    
    if (response.Items && response.Items.length > 0) {
      const latestFile = response.Items[0];
      const currentVersion = latestFile.version || 1;
      return currentVersion + 1;
    }
    
    return 1; // First version
  } catch (error) {
    console.error('Error getting next version:', error);
    return 1; // Default to version 1 if query fails
  }
}

async function generatePresignedUploadUrl(
  fileKey: string,
  request: RequestUploadUrlRequest
): Promise<{ url: string; fields: Record<string, string> }> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: request.contentType,
    ContentLength: request.fileSize,
    Metadata: {
      'original-filename': request.fileName,
      'uploaded-at': new Date().toISOString(),
    },
  });
  
  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: UPLOAD_URL_EXPIRY,
  });
  
  // For presigned POST, we need to create the form fields
  // This is a simplified version - in production, you might want to use createPresignedPost
  return {
    url: signedUrl,
    fields: {
      'Content-Type': request.contentType,
      'Content-Length': request.fileSize.toString(),
    },
  };
}

async function storeFileRecord(
  clubId: string,
  routeId: string,
  version: number,
  fileId: string,
  request: RequestUploadUrlRequest,
  userId: string
): Promise<void> {
  const now = new Date().toISOString();
  const fileKey = `gpx-files/${clubId}/${routeId}/v${version}.gpx`;
  
  const fileRecord = {
    PK: `CLUB#${clubId}#ROUTE#${routeId}`,
    SK: `FILE#${version}`,
    fileId,
    fileKey,
    fileName: request.fileName,
    contentType: request.contentType,
    fileSize: request.fileSize,
    checksum: createHash('sha256').update(fileId + now).digest('hex'), // Temporary checksum
    uploadedBy: userId,
    uploadedAt: now,
    uploadSource: 'web' as const,
    processingStatus: 'pending' as const,
    version,
    description: request.description,
  };
  
  await dynamoClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: fileRecord,
  }));
}