import { APIGatewayProxyEvent, APIGatewayProxyResult, S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { createResponse, parseJsonBody } from '../../../../shared/utils/lambda-utils';
import { validateAuthContext } from '../../../../shared/auth/auth-context';
import { ConfirmUploadRequest, RouteFileError, FileProcessingError } from '../../../../shared/types/route-file';
import { parseString } from 'xml2js';
import { promisify } from 'util';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const dynamoClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.AWS_REGION }));

const BUCKET_NAME = process.env.ROUTES_BUCKET_NAME!;
const TABLE_NAME = process.env.MAIN_TABLE_NAME!;

const parseXml = promisify(parseString);

export const handler = async (event: APIGatewayProxyEvent | S3Event): Promise<APIGatewayProxyResult | void> => {
  try {
    // Handle different event types
    if ('Records' in event && event.Records[0].eventSource === 'aws:s3') {
      // S3 event - automatic processing
      return await handleS3Event(event as S3Event);
    } else {
      // API Gateway event - manual confirmation
      return await handleApiEvent(event as APIGatewayProxyEvent);
    }
  } catch (error) {
    console.error('Error processing file:', error);
    
    if ('httpMethod' in event) {
      // Return API response for API Gateway events
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
        message: 'Failed to process file',
      });
    }
    
    // For S3 events, just log the error
    throw error;
  }
};

async function handleApiEvent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Handle both confirm upload and status check
  const method = event.httpMethod;
  const pathSegments = event.path.split('/');
  
  if (method === 'POST' && pathSegments.includes('confirm')) {
    return await handleConfirmUpload(event);
  } else if (method === 'GET' && pathSegments.includes('status')) {
    return await handleStatusCheck(event);
  }
  
  throw new RouteFileError('Invalid endpoint', 'INVALID_ENDPOINT', 404);
}

async function handleConfirmUpload(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Validate authentication
  const authContext = validateAuthContext(event);
  
  // Extract path parameters
  const clubId = event.pathParameters?.clubId;
  const routeId = event.pathParameters?.routeId;
  const version = event.pathParameters?.version;
  
  if (!clubId || !routeId || !version) {
    throw new RouteFileError('Missing required path parameters', 'MISSING_PARAMETERS', 400);
  }

  // Parse request body
  const request = parseJsonBody<ConfirmUploadRequest>(event);
  
  if (!request.uploadCompleted) {
    throw new RouteFileError('Upload not completed', 'UPLOAD_NOT_COMPLETED', 400);
  }
  
  // Update file status to processing
  await updateFileStatus(clubId, routeId, parseInt(version), 'processing');
  
  // Start background processing
  await processGpxFile(clubId, routeId, parseInt(version));
  
  return createResponse(200, {
    success: true,
    data: {
      fileId: request.fileId,
      version: parseInt(version),
      processingStatus: 'processing',
      estimatedProcessingTime: '2-3 minutes',
    },
  });
}

async function handleStatusCheck(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  // Validate authentication
  const authContext = validateAuthContext(event);
  
  // Extract path parameters
  const clubId = event.pathParameters?.clubId;
  const routeId = event.pathParameters?.routeId;
  const version = event.pathParameters?.version;
  
  if (!clubId || !routeId || !version) {
    throw new RouteFileError('Missing required path parameters', 'MISSING_PARAMETERS', 400);
  }

  // Get file status from DynamoDB
  const fileRecord = await getFileRecord(clubId, routeId, parseInt(version));
  
  if (!fileRecord) {
    throw new RouteFileError('File not found', 'FILE_NOT_FOUND', 404);
  }
  
  return createResponse(200, {
    success: true,
    data: {
      status: fileRecord.processingStatus,
      progress: getProgressFromStatus(fileRecord.processingStatus),
      analytics: {
        elevationProfile: fileRecord.processingStatus === 'completed',
        basicMetrics: fileRecord.processingStatus === 'completed',
      },
      errors: fileRecord.processingError ? [fileRecord.processingError] : [],
    },
  });
}

async function handleS3Event(event: S3Event): Promise<void> {
  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const objectKey = record.s3.object.key;
    
    // Parse object key to extract club, route, and version
    const keyParts = objectKey.split('/');
    if (keyParts.length >= 4 && keyParts[0] === 'gpx-files') {
      const clubId = keyParts[1];
      const routeId = keyParts[2];
      const versionMatch = keyParts[3].match(/v(\d+)\.gpx$/);
      
      if (versionMatch) {
        const version = parseInt(versionMatch[1]);
        await processGpxFile(clubId, routeId, version);
      }
    }
  }
}

async function processGpxFile(clubId: string, routeId: string, version: number): Promise<void> {
  try {
    console.log(`Processing GPX file: ${clubId}/${routeId}/v${version}`);
    
    // Update status to processing
    await updateFileStatus(clubId, routeId, version, 'processing');
    
    // Download file from S3
    const fileKey = `gpx-files/${clubId}/${routeId}/v${version}.gpx`;
    const gpxContent = await downloadFileFromS3(fileKey);
    
    // Parse GPX content
    const gpxData = await parseGpxContent(gpxContent);
    
    // Extract basic metadata
    const metadata = extractBasicMetadata(gpxData);
    
    // Generate basic analytics
    const analytics = await generateBasicAnalytics(gpxData, clubId, routeId, version);
    
    // Update file record with metadata
    await updateFileWithMetadata(clubId, routeId, version, metadata);
    
    // Store analytics
    await storeAnalytics(clubId, routeId, version, analytics);
    
    // Update status to completed
    await updateFileStatus(clubId, routeId, version, 'completed');
    
    console.log(`Successfully processed GPX file: ${clubId}/${routeId}/v${version}`);
    
  } catch (error) {
    console.error(`Error processing GPX file ${clubId}/${routeId}/v${version}:`, error);
    
    // Update status to failed
    await updateFileStatus(
      clubId, 
      routeId, 
      version, 
      'failed', 
      error instanceof Error ? error.message : 'Unknown processing error'
    );
    
    throw new FileProcessingError('Failed to process GPX file', error as Error);
  }
}

async function downloadFileFromS3(fileKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });
  
  const response = await s3Client.send(command);
  
  if (!response.Body) {
    throw new FileProcessingError('File content is empty');
  }
  
  return await response.Body.transformToString();
}

async function parseGpxContent(gpxContent: string): Promise<any> {
  try {
    const result = await parseXml(gpxContent) as any;
    
    if (!result.gpx) {
      throw new FileProcessingError('Invalid GPX format: missing gpx root element');
    }
    
    return result.gpx;
  } catch (error) {
    throw new FileProcessingError('Failed to parse GPX content', error as Error);
  }
}

function extractBasicMetadata(gpxData: any): any {
  const tracks = Array.isArray(gpxData.trk) ? gpxData.trk : [gpxData.trk].filter(Boolean);
  const waypoints = Array.isArray(gpxData.wpt) ? gpxData.wpt : [gpxData.wpt].filter(Boolean);
  
  let totalDistance = 0;
  let totalElevationGain = 0;
  let trackPoints = 0;
  let bounds = {
    north: -90,
    south: 90,
    east: -180,
    west: 180,
  };
  
  // Process tracks
  for (const track of tracks) {
    if (track.trkseg) {
      const segments = Array.isArray(track.trkseg) ? track.trkseg : [track.trkseg];
      
      for (const segment of segments) {
        if (segment.trkpt) {
          const points = Array.isArray(segment.trkpt) ? segment.trkpt : [segment.trkpt];
          trackPoints += points.length;
          
          // Calculate distance and elevation
          for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1];
            const curr = points[i];
            
            // Update bounds
            const lat = parseFloat(curr.lat);
            const lon = parseFloat(curr.lon);
            bounds.north = Math.max(bounds.north, lat);
            bounds.south = Math.min(bounds.south, lat);
            bounds.east = Math.max(bounds.east, lon);
            bounds.west = Math.min(bounds.west, lon);
            
            // Calculate distance (simplified Haversine)
            totalDistance += calculateDistance(
              parseFloat(prev.lat), parseFloat(prev.lon),
              parseFloat(curr.lat), parseFloat(curr.lon)
            );
            
            // Calculate elevation gain
            if (prev.ele && curr.ele) {
              const elevDiff = parseFloat(curr.ele) - parseFloat(prev.ele);
              if (elevDiff > 0) {
                totalElevationGain += elevDiff;
              }
            }
          }
        }
      }
    }
  }
  
  return {
    totalDistance: Math.round(totalDistance),
    totalElevationGain: Math.round(totalElevationGain),
    waypoints: waypoints.length,
    trackPoints,
    bounds,
  };
}

async function generateBasicAnalytics(gpxData: any, clubId: string, routeId: string, version: number): Promise<any> {
  // Extract elevation profile (simplified to max 200 points)
  const elevationProfile = extractElevationProfile(gpxData);
  
  // Calculate basic difficulty score
  const difficultyScore = calculateDifficultyScore(gpxData);
  
  // Calculate performance metrics
  const performanceMetrics = calculatePerformanceMetrics(gpxData);
  
  // Store elevation profile in S3
  const profileKey = `processed/elevation-profiles/${clubId}-${routeId}-v${version}.json`;
  await storeElevationProfileInS3(profileKey, elevationProfile);
  
  return {
    elevationSummary: {
      totalGain: elevationProfile.totalGain,
      totalLoss: elevationProfile.totalLoss,
      maxElevation: elevationProfile.maxElevation,
      minElevation: elevationProfile.minElevation,
      pointCount: elevationProfile.points.length,
    },
    elevationProfileKey: profileKey,
    difficultyScore,
    performanceMetrics,
    analyzedAt: new Date().toISOString(),
    dataVersion: '1.0',
  };
}

function extractElevationProfile(gpxData: any): any {
  const points: Array<{ distance: number; elevation: number; grade: number }> = [];
  let totalDistance = 0;
  let totalGain = 0;
  let totalLoss = 0;
  let maxElevation = -Infinity;
  let minElevation = Infinity;
  
  const tracks = Array.isArray(gpxData.trk) ? gpxData.trk : [gpxData.trk].filter(Boolean);
  
  for (const track of tracks) {
    if (track.trkseg) {
      const segments = Array.isArray(track.trkseg) ? track.trkseg : [track.trkseg];
      
      for (const segment of segments) {
        if (segment.trkpt) {
          const trackPoints = Array.isArray(segment.trkpt) ? segment.trkpt : [segment.trkpt];
          
          for (let i = 0; i < trackPoints.length; i++) {
            const point = trackPoints[i];
            const elevation = parseFloat(point.ele) || 0;
            
            maxElevation = Math.max(maxElevation, elevation);
            minElevation = Math.min(minElevation, elevation);
            
            if (i > 0) {
              const prevPoint = trackPoints[i - 1];
              const prevElevation = parseFloat(prevPoint.ele) || 0;
              
              // Calculate distance
              const segmentDistance = calculateDistance(
                parseFloat(prevPoint.lat), parseFloat(prevPoint.lon),
                parseFloat(point.lat), parseFloat(point.lon)
              );
              totalDistance += segmentDistance;
              
              // Calculate elevation change
              const elevationChange = elevation - prevElevation;
              if (elevationChange > 0) {
                totalGain += elevationChange;
              } else {
                totalLoss += Math.abs(elevationChange);
              }
              
              // Calculate grade
              const grade = segmentDistance > 0 ? (elevationChange / segmentDistance) * 100 : 0;
              
              points.push({
                distance: totalDistance,
                elevation,
                grade,
              });
            } else {
              points.push({
                distance: 0,
                elevation,
                grade: 0,
              });
            }
          }
        }
      }
    }
  }
  
  // Downsample to max 200 points
  const downsampledPoints = downsamplePoints(points, 200);
  
  return {
    points: downsampledPoints,
    totalGain,
    totalLoss,
    maxElevation: maxElevation === -Infinity ? 0 : maxElevation,
    minElevation: minElevation === Infinity ? 0 : minElevation,
  };
}

function downsamplePoints(points: any[], maxPoints: number): any[] {
  if (points.length <= maxPoints) {
    return points;
  }
  
  const step = Math.floor(points.length / maxPoints);
  const downsampled = [];
  
  for (let i = 0; i < points.length; i += step) {
    downsampled.push(points[i]);
  }
  
  // Always include the last point
  if (downsampled[downsampled.length - 1] !== points[points.length - 1]) {
    downsampled.push(points[points.length - 1]);
  }
  
  return downsampled;
}

function calculateDifficultyScore(gpxData: any): any {
  // Simplified difficulty calculation based on distance and elevation
  const metadata = extractBasicMetadata(gpxData);
  
  // Distance difficulty (1-10 scale)
  const distanceDifficulty = Math.min(10, Math.max(1, metadata.totalDistance / 10000)); // 100km = 10
  
  // Elevation difficulty (1-10 scale)
  const elevationDifficulty = Math.min(10, Math.max(1, metadata.totalElevationGain / 1000)); // 1000m = 10
  
  // Overall difficulty (weighted average)
  const overall = (distanceDifficulty * 0.6 + elevationDifficulty * 0.4);
  
  return {
    overall: Math.round(overall * 10) / 10,
    elevation: Math.round(elevationDifficulty * 10) / 10,
    distance: Math.round(distanceDifficulty * 10) / 10,
  };
}

function calculatePerformanceMetrics(gpxData: any): any {
  const metadata = extractBasicMetadata(gpxData);
  
  // Simplified time estimates based on distance and elevation
  const baseTime = metadata.totalDistance / 20000 * 60; // 20km/h base speed in minutes
  const elevationTime = metadata.totalElevationGain / 100 * 10; // 10 minutes per 100m elevation
  
  return {
    estimatedTime: {
      recreational: Math.round(baseTime * 1.5 + elevationTime * 1.5),
      moderate: Math.round(baseTime * 1.2 + elevationTime * 1.2),
    },
  };
}

async function storeElevationProfileInS3(profileKey: string, elevationProfile: any): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: profileKey,
    Body: JSON.stringify(elevationProfile),
    ContentType: 'application/json',
  });
  
  await s3Client.send(command);
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function updateFileStatus(
  clubId: string,
  routeId: string,
  version: number,
  status: string,
  error?: string
): Promise<void> {
  const updateExpression = error
    ? 'SET processingStatus = :status, processingError = :error'
    : 'SET processingStatus = :status';
  
  const expressionAttributeValues = error
    ? { ':status': status, ':error': error }
    : { ':status': status };
  
  await dynamoClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `CLUB#${clubId}#ROUTE#${routeId}`,
      SK: `FILE#${version}`,
    },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  }));
}

async function updateFileWithMetadata(
  clubId: string,
  routeId: string,
  version: number,
  metadata: any
): Promise<void> {
  await dynamoClient.send(new UpdateCommand({
    TableName: TABLE_NAME,
    Key: {
      PK: `CLUB#${clubId}#ROUTE#${routeId}`,
      SK: `FILE#${version}`,
    },
    UpdateExpression: 'SET metadata = :metadata',
    ExpressionAttributeValues: {
      ':metadata': metadata,
    },
  }));
}

async function storeAnalytics(
  clubId: string,
  routeId: string,
  version: number,
  analytics: any
): Promise<void> {
  await dynamoClient.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `CLUB#${clubId}#ROUTE#${routeId}`,
      SK: `ANALYTICS#${version}`,
      ...analytics,
    },
  }));
}

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

function getProgressFromStatus(status: string): number {
  switch (status) {
    case 'pending': return 0;
    case 'processing': return 50;
    case 'completed': return 100;
    case 'failed': return 0;
    default: return 0;
  }
}