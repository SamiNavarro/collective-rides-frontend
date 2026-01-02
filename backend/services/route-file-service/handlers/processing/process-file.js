"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const route_file_1 = require("../../../../shared/types/route-file");
const xml2js_1 = require("xml2js");
const util_1 = require("util");
const s3Client = new client_s3_1.S3Client({ region: process.env.AWS_REGION });
const dynamoClient = lib_dynamodb_1.DynamoDBDocumentClient.from(new client_dynamodb_1.DynamoDBClient({ region: process.env.AWS_REGION }));
const BUCKET_NAME = process.env.ROUTES_BUCKET_NAME;
const TABLE_NAME = process.env.MAIN_TABLE_NAME;
const parseXml = (0, util_1.promisify)(xml2js_1.parseString);
const handler = async (event) => {
    try {
        // Handle different event types
        if ('Records' in event && event.Records[0].eventSource === 'aws:s3') {
            // S3 event - automatic processing
            return await handleS3Event(event);
        }
        else {
            // API Gateway event - manual confirmation
            return await handleApiEvent(event);
        }
    }
    catch (error) {
        console.error('Error processing file:', error);
        if ('httpMethod' in event) {
            // Return API response for API Gateway events
            if (error instanceof route_file_1.RouteFileError) {
                return (0, lambda_utils_1.createResponse)(error.statusCode, {
                    success: false,
                    error: error.code,
                    message: error.message,
                });
            }
            return (0, lambda_utils_1.createResponse)(500, {
                success: false,
                error: 'INTERNAL_ERROR',
                message: 'Failed to process file',
            });
        }
        // For S3 events, just log the error
        throw error;
    }
};
exports.handler = handler;
async function handleApiEvent(event) {
    // Handle both confirm upload and status check
    const method = event.httpMethod;
    const pathSegments = event.path.split('/');
    if (method === 'POST' && pathSegments.includes('confirm')) {
        return await handleConfirmUpload(event);
    }
    else if (method === 'GET' && pathSegments.includes('status')) {
        return await handleStatusCheck(event);
    }
    throw new route_file_1.RouteFileError('Invalid endpoint', 'INVALID_ENDPOINT', 404);
}
async function handleConfirmUpload(event) {
    // Validate authentication
    const authContext = (0, auth_context_1.validateAuthContext)(event);
    // Extract path parameters
    const clubId = event.pathParameters?.clubId;
    const routeId = event.pathParameters?.routeId;
    const version = event.pathParameters?.version;
    if (!clubId || !routeId || !version) {
        throw new route_file_1.RouteFileError('Missing required path parameters', 'MISSING_PARAMETERS', 400);
    }
    // Parse request body
    const request = (0, lambda_utils_1.parseJsonBody)(event);
    if (!request.uploadCompleted) {
        throw new route_file_1.RouteFileError('Upload not completed', 'UPLOAD_NOT_COMPLETED', 400);
    }
    // Update file status to processing
    await updateFileStatus(clubId, routeId, parseInt(version), 'processing');
    // Start background processing
    await processGpxFile(clubId, routeId, parseInt(version));
    return (0, lambda_utils_1.createResponse)(200, {
        success: true,
        data: {
            fileId: request.fileId,
            version: parseInt(version),
            processingStatus: 'processing',
            estimatedProcessingTime: '2-3 minutes',
        },
    });
}
async function handleStatusCheck(event) {
    // Validate authentication
    const authContext = (0, auth_context_1.validateAuthContext)(event);
    // Extract path parameters
    const clubId = event.pathParameters?.clubId;
    const routeId = event.pathParameters?.routeId;
    const version = event.pathParameters?.version;
    if (!clubId || !routeId || !version) {
        throw new route_file_1.RouteFileError('Missing required path parameters', 'MISSING_PARAMETERS', 400);
    }
    // Get file status from DynamoDB
    const fileRecord = await getFileRecord(clubId, routeId, parseInt(version));
    if (!fileRecord) {
        throw new route_file_1.RouteFileError('File not found', 'FILE_NOT_FOUND', 404);
    }
    return (0, lambda_utils_1.createResponse)(200, {
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
async function handleS3Event(event) {
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
async function processGpxFile(clubId, routeId, version) {
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
    }
    catch (error) {
        console.error(`Error processing GPX file ${clubId}/${routeId}/v${version}:`, error);
        // Update status to failed
        await updateFileStatus(clubId, routeId, version, 'failed', error instanceof Error ? error.message : 'Unknown processing error');
        throw new route_file_1.FileProcessingError('Failed to process GPX file', error);
    }
}
async function downloadFileFromS3(fileKey) {
    const command = new client_s3_1.GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
    });
    const response = await s3Client.send(command);
    if (!response.Body) {
        throw new route_file_1.FileProcessingError('File content is empty');
    }
    return await response.Body.transformToString();
}
async function parseGpxContent(gpxContent) {
    try {
        const result = await parseXml(gpxContent);
        if (!result.gpx) {
            throw new route_file_1.FileProcessingError('Invalid GPX format: missing gpx root element');
        }
        return result.gpx;
    }
    catch (error) {
        throw new route_file_1.FileProcessingError('Failed to parse GPX content', error);
    }
}
function extractBasicMetadata(gpxData) {
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
                        totalDistance += calculateDistance(parseFloat(prev.lat), parseFloat(prev.lon), parseFloat(curr.lat), parseFloat(curr.lon));
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
async function generateBasicAnalytics(gpxData, clubId, routeId, version) {
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
function extractElevationProfile(gpxData) {
    const points = [];
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
                            const segmentDistance = calculateDistance(parseFloat(prevPoint.lat), parseFloat(prevPoint.lon), parseFloat(point.lat), parseFloat(point.lon));
                            totalDistance += segmentDistance;
                            // Calculate elevation change
                            const elevationChange = elevation - prevElevation;
                            if (elevationChange > 0) {
                                totalGain += elevationChange;
                            }
                            else {
                                totalLoss += Math.abs(elevationChange);
                            }
                            // Calculate grade
                            const grade = segmentDistance > 0 ? (elevationChange / segmentDistance) * 100 : 0;
                            points.push({
                                distance: totalDistance,
                                elevation,
                                grade,
                            });
                        }
                        else {
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
function downsamplePoints(points, maxPoints) {
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
function calculateDifficultyScore(gpxData) {
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
function calculatePerformanceMetrics(gpxData) {
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
async function storeElevationProfileInS3(profileKey, elevationProfile) {
    const command = new client_s3_1.PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: profileKey,
        Body: JSON.stringify(elevationProfile),
        ContentType: 'application/json',
    });
    await s3Client.send(command);
}
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
async function updateFileStatus(clubId, routeId, version, status, error) {
    const updateExpression = error
        ? 'SET processingStatus = :status, processingError = :error'
        : 'SET processingStatus = :status';
    const expressionAttributeValues = error
        ? { ':status': status, ':error': error }
        : { ':status': status };
    await dynamoClient.send(new lib_dynamodb_1.UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: `CLUB#${clubId}#ROUTE#${routeId}`,
            SK: `FILE#${version}`,
        },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
    }));
}
async function updateFileWithMetadata(clubId, routeId, version, metadata) {
    await dynamoClient.send(new lib_dynamodb_1.UpdateCommand({
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
async function storeAnalytics(clubId, routeId, version, analytics) {
    await dynamoClient.send(new lib_dynamodb_1.PutCommand({
        TableName: TABLE_NAME,
        Item: {
            PK: `CLUB#${clubId}#ROUTE#${routeId}`,
            SK: `ANALYTICS#${version}`,
            ...analytics,
        },
    }));
}
async function getFileRecord(clubId, routeId, version) {
    const response = await dynamoClient.send(new lib_dynamodb_1.GetCommand({
        TableName: TABLE_NAME,
        Key: {
            PK: `CLUB#${clubId}#ROUTE#${routeId}`,
            SK: `FILE#${version}`,
        },
    }));
    return response.Item;
}
function getProgressFromStatus(status) {
    switch (status) {
        case 'pending': return 0;
        case 'processing': return 50;
        case 'completed': return 100;
        case 'failed': return 0;
        default: return 0;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvY2Vzcy1maWxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicHJvY2Vzcy1maWxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLGtEQUFrRjtBQUNsRiw4REFBMEQ7QUFDMUQsd0RBQXNHO0FBQ3RHLHdFQUFzRjtBQUN0Rix1RUFBMkU7QUFDM0Usb0VBQWdIO0FBQ2hILG1DQUFxQztBQUNyQywrQkFBaUM7QUFFakMsTUFBTSxRQUFRLEdBQUcsSUFBSSxvQkFBUSxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztBQUNsRSxNQUFNLFlBQVksR0FBRyxxQ0FBc0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxnQ0FBYyxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBRXpHLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQW1CLENBQUM7QUFDcEQsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFnQixDQUFDO0FBRWhELE1BQU0sUUFBUSxHQUFHLElBQUEsZ0JBQVMsRUFBQyxvQkFBVyxDQUFDLENBQUM7QUFFakMsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQXFDLEVBQXlDLEVBQUU7SUFDNUcsSUFBSTtRQUNGLCtCQUErQjtRQUMvQixJQUFJLFNBQVMsSUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEtBQUssUUFBUSxFQUFFO1lBQ25FLGtDQUFrQztZQUNsQyxPQUFPLE1BQU0sYUFBYSxDQUFDLEtBQWdCLENBQUMsQ0FBQztTQUM5QzthQUFNO1lBQ0wsMENBQTBDO1lBQzFDLE9BQU8sTUFBTSxjQUFjLENBQUMsS0FBNkIsQ0FBQyxDQUFDO1NBQzVEO0tBQ0Y7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLE9BQU8s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O0lBRWQsTUFBTSxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUkseUJBQVUsQ0FBQztRQUNyQyxTQUFTLEVBQUUsVUFBVTtRQUNyQixJQUFJLEVBQUU7WUFDSixFQUFFLEVBQUUsUUFBUSxNQUFNLFVBQVUsT0FBTyxFQUFFO1lBQ3JDLEVBQUUsRUFBRSxhQUFhLE9BQU8sRUFBRTtZQUMxQixHQUFHLFNBQVM7U0FDYjtLQUNGLENBQUMsQ0FBQyxDQUFDO0FBQ04sQ0FBQztBQUVELEtBQUssVUFBVSxhQUFhLENBQUMsTUFBYyxFQUFFLE9BQWUsRUFBRSxPQUFlO0lBQzNFLE1BQU0sUUFBUSxHQUFHLE1BQU0sWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLHlCQUFVLENBQUM7UUFDdEQsU0FBUyxFQUFFLFVBQVU7UUFDckIsR0FBRyxFQUFFO1lBQ0gsRUFBRSxFQUFFLFFBQVEsTUFBTSxVQUFVLE9BQU8sRUFBRTtZQUNyQyxFQUFFLEVBQUUsUUFBUSxPQUFPLEVBQUU7U0FDdEI7S0FDRixDQUFDLENBQUMsQ0FBQztJQUVKLE9BQU8sUUFBUSxDQUFDLElBQUksQ0FBQztBQUN2QixDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxNQUFjO0lBQzNDLFFBQVEsTUFBTSxFQUFFO1FBQ2QsS0FBSyxTQUFTLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN6QixLQUFLLFlBQVksQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzdCLEtBQUssV0FBVyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUM7UUFDN0IsS0FBSyxRQUFRLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUN4QixPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUNuQjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0LCBTM0V2ZW50IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBTM0NsaWVudCwgR2V0T2JqZWN0Q29tbWFuZCwgUHV0T2JqZWN0Q29tbWFuZCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1zMyc7XG5pbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XG5pbXBvcnQgeyBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LCBVcGRhdGVDb21tYW5kLCBHZXRDb21tYW5kLCBQdXRDb21tYW5kIH0gZnJvbSAnQGF3cy1zZGsvbGliLWR5bmFtb2RiJztcbmltcG9ydCB7IGNyZWF0ZVJlc3BvbnNlLCBwYXJzZUpzb25Cb2R5IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyB2YWxpZGF0ZUF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGgvYXV0aC1jb250ZXh0JztcbmltcG9ydCB7IENvbmZpcm1VcGxvYWRSZXF1ZXN0LCBSb3V0ZUZpbGVFcnJvciwgRmlsZVByb2Nlc3NpbmdFcnJvciB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9yb3V0ZS1maWxlJztcbmltcG9ydCB7IHBhcnNlU3RyaW5nIH0gZnJvbSAneG1sMmpzJztcbmltcG9ydCB7IHByb21pc2lmeSB9IGZyb20gJ3V0aWwnO1xuXG5jb25zdCBzM0NsaWVudCA9IG5ldyBTM0NsaWVudCh7IHJlZ2lvbjogcHJvY2Vzcy5lbnYuQVdTX1JFR0lPTiB9KTtcbmNvbnN0IGR5bmFtb0NsaWVudCA9IER5bmFtb0RCRG9jdW1lbnRDbGllbnQuZnJvbShuZXcgRHluYW1vREJDbGllbnQoeyByZWdpb246IHByb2Nlc3MuZW52LkFXU19SRUdJT04gfSkpO1xuXG5jb25zdCBCVUNLRVRfTkFNRSA9IHByb2Nlc3MuZW52LlJPVVRFU19CVUNLRVRfTkFNRSE7XG5jb25zdCBUQUJMRV9OQU1FID0gcHJvY2Vzcy5lbnYuTUFJTl9UQUJMRV9OQU1FITtcblxuY29uc3QgcGFyc2VYbWwgPSBwcm9taXNpZnkocGFyc2VTdHJpbmcpO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQgfCBTM0V2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQgfCB2b2lkPiA9PiB7XG4gIHRyeSB7XG4gICAgLy8gSGFuZGxlIGRpZmZlcmVudCBldmVudCB0eXBlc1xuICAgIGlmICgnUmVjb3JkcycgaW4gZXZlbnQgJiYgZXZlbnQuUmVjb3Jkc1swXS5ldmVudFNvdXJjZSA9PT0gJ2F3czpzMycpIHtcbiAgICAgIC8vIFMzIGV2ZW50IC0gYXV0b21hdGljIHByb2Nlc3NpbmdcbiAgICAgIHJldHVybiBhd2FpdCBoYW5kbGVTM0V2ZW50KGV2ZW50IGFzIFMzRXZlbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBBUEkgR2F0ZXdheSBldmVudCAtIG1hbnVhbCBjb25maXJtYXRpb25cbiAgICAgIHJldHVybiBhd2FpdCBoYW5kbGVBcGlFdmVudChldmVudCBhcyBBUElHYXRld2F5UHJveHlFdmVudCk7XG4gICAgfVxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgZmlsZTonLCBlcnJvcik7XG4gICAgXG4gICAgaWYgKCdodHRwTWV0aG9kJyBpbiBldmVudCkge1xuICAgICAgLy8gUmV0dXJuIEFQSSByZXNwb25zZSBmb3IgQVBJIEdhdGV3YXkgZXZlbnRzXG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBSb3V0ZUZpbGVFcnJvcikge1xuICAgICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoZXJyb3Iuc3RhdHVzQ29kZSwge1xuICAgICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICAgIGVycm9yOiBlcnJvci5jb2RlLFxuICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNTAwLCB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogJ0lOVEVSTkFMX0VSUk9SJyxcbiAgICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBwcm9jZXNzIGZpbGUnLFxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIEZvciBTMyBldmVudHMsIGp1c3QgbG9nIHRoZSBlcnJvclxuICAgIHRocm93IGVycm9yO1xuICB9XG59O1xuXG5hc3luYyBmdW5jdGlvbiBoYW5kbGVBcGlFdmVudChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4ge1xuICAvLyBIYW5kbGUgYm90aCBjb25maXJtIHVwbG9hZCBhbmQgc3RhdHVzIGNoZWNrXG4gIGNvbnN0IG1ldGhvZCA9IGV2ZW50Lmh0dHBNZXRob2Q7XG4gIGNvbnN0IHBhdGhTZWdtZW50cyA9IGV2ZW50LnBhdGguc3BsaXQoJy8nKTtcbiAgXG4gIGlmIChtZXRob2QgPT09ICdQT1NUJyAmJiBwYXRoU2VnbWVudHMuaW5jbHVkZXMoJ2NvbmZpcm0nKSkge1xuICAgIHJldHVybiBhd2FpdCBoYW5kbGVDb25maXJtVXBsb2FkKGV2ZW50KTtcbiAgfSBlbHNlIGlmIChtZXRob2QgPT09ICdHRVQnICYmIHBhdGhTZWdtZW50cy5pbmNsdWRlcygnc3RhdHVzJykpIHtcbiAgICByZXR1cm4gYXdhaXQgaGFuZGxlU3RhdHVzQ2hlY2soZXZlbnQpO1xuICB9XG4gIFxuICB0aHJvdyBuZXcgUm91dGVGaWxlRXJyb3IoJ0ludmFsaWQgZW5kcG9pbnQnLCAnSU5WQUxJRF9FTkRQT0lOVCcsIDQwNCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZUNvbmZpcm1VcGxvYWQoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+IHtcbiAgLy8gVmFsaWRhdGUgYXV0aGVudGljYXRpb25cbiAgY29uc3QgYXV0aENvbnRleHQgPSB2YWxpZGF0ZUF1dGhDb250ZXh0KGV2ZW50KTtcbiAgXG4gIC8vIEV4dHJhY3QgcGF0aCBwYXJhbWV0ZXJzXG4gIGNvbnN0IGNsdWJJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5jbHViSWQ7XG4gIGNvbnN0IHJvdXRlSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8ucm91dGVJZDtcbiAgY29uc3QgdmVyc2lvbiA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy52ZXJzaW9uO1xuICBcbiAgaWYgKCFjbHViSWQgfHwgIXJvdXRlSWQgfHwgIXZlcnNpb24pIHtcbiAgICB0aHJvdyBuZXcgUm91dGVGaWxlRXJyb3IoJ01pc3NpbmcgcmVxdWlyZWQgcGF0aCBwYXJhbWV0ZXJzJywgJ01JU1NJTkdfUEFSQU1FVEVSUycsIDQwMCk7XG4gIH1cblxuICAvLyBQYXJzZSByZXF1ZXN0IGJvZHlcbiAgY29uc3QgcmVxdWVzdCA9IHBhcnNlSnNvbkJvZHk8Q29uZmlybVVwbG9hZFJlcXVlc3Q+KGV2ZW50KTtcbiAgXG4gIGlmICghcmVxdWVzdC51cGxvYWRDb21wbGV0ZWQpIHtcbiAgICB0aHJvdyBuZXcgUm91dGVGaWxlRXJyb3IoJ1VwbG9hZCBub3QgY29tcGxldGVkJywgJ1VQTE9BRF9OT1RfQ09NUExFVEVEJywgNDAwKTtcbiAgfVxuICBcbiAgLy8gVXBkYXRlIGZpbGUgc3RhdHVzIHRvIHByb2Nlc3NpbmdcbiAgYXdhaXQgdXBkYXRlRmlsZVN0YXR1cyhjbHViSWQsIHJvdXRlSWQsIHBhcnNlSW50KHZlcnNpb24pLCAncHJvY2Vzc2luZycpO1xuICBcbiAgLy8gU3RhcnQgYmFja2dyb3VuZCBwcm9jZXNzaW5nXG4gIGF3YWl0IHByb2Nlc3NHcHhGaWxlKGNsdWJJZCwgcm91dGVJZCwgcGFyc2VJbnQodmVyc2lvbikpO1xuICBcbiAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDIwMCwge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgZGF0YToge1xuICAgICAgZmlsZUlkOiByZXF1ZXN0LmZpbGVJZCxcbiAgICAgIHZlcnNpb246IHBhcnNlSW50KHZlcnNpb24pLFxuICAgICAgcHJvY2Vzc2luZ1N0YXR1czogJ3Byb2Nlc3NpbmcnLFxuICAgICAgZXN0aW1hdGVkUHJvY2Vzc2luZ1RpbWU6ICcyLTMgbWludXRlcycsXG4gICAgfSxcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZVN0YXR1c0NoZWNrKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCk6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiB7XG4gIC8vIFZhbGlkYXRlIGF1dGhlbnRpY2F0aW9uXG4gIGNvbnN0IGF1dGhDb250ZXh0ID0gdmFsaWRhdGVBdXRoQ29udGV4dChldmVudCk7XG4gIFxuICAvLyBFeHRyYWN0IHBhdGggcGFyYW1ldGVyc1xuICBjb25zdCBjbHViSWQgPSBldmVudC5wYXRoUGFyYW1ldGVycz8uY2x1YklkO1xuICBjb25zdCByb3V0ZUlkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LnJvdXRlSWQ7XG4gIGNvbnN0IHZlcnNpb24gPSBldmVudC5wYXRoUGFyYW1ldGVycz8udmVyc2lvbjtcbiAgXG4gIGlmICghY2x1YklkIHx8ICFyb3V0ZUlkIHx8ICF2ZXJzaW9uKSB7XG4gICAgdGhyb3cgbmV3IFJvdXRlRmlsZUVycm9yKCdNaXNzaW5nIHJlcXVpcmVkIHBhdGggcGFyYW1ldGVycycsICdNSVNTSU5HX1BBUkFNRVRFUlMnLCA0MDApO1xuICB9XG5cbiAgLy8gR2V0IGZpbGUgc3RhdHVzIGZyb20gRHluYW1vREJcbiAgY29uc3QgZmlsZVJlY29yZCA9IGF3YWl0IGdldEZpbGVSZWNvcmQoY2x1YklkLCByb3V0ZUlkLCBwYXJzZUludCh2ZXJzaW9uKSk7XG4gIFxuICBpZiAoIWZpbGVSZWNvcmQpIHtcbiAgICB0aHJvdyBuZXcgUm91dGVGaWxlRXJyb3IoJ0ZpbGUgbm90IGZvdW5kJywgJ0ZJTEVfTk9UX0ZPVU5EJywgNDA0KTtcbiAgfVxuICBcbiAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDIwMCwge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgZGF0YToge1xuICAgICAgc3RhdHVzOiBmaWxlUmVjb3JkLnByb2Nlc3NpbmdTdGF0dXMsXG4gICAgICBwcm9ncmVzczogZ2V0UHJvZ3Jlc3NGcm9tU3RhdHVzKGZpbGVSZWNvcmQucHJvY2Vzc2luZ1N0YXR1cyksXG4gICAgICBhbmFseXRpY3M6IHtcbiAgICAgICAgZWxldmF0aW9uUHJvZmlsZTogZmlsZVJlY29yZC5wcm9jZXNzaW5nU3RhdHVzID09PSAnY29tcGxldGVkJyxcbiAgICAgICAgYmFzaWNNZXRyaWNzOiBmaWxlUmVjb3JkLnByb2Nlc3NpbmdTdGF0dXMgPT09ICdjb21wbGV0ZWQnLFxuICAgICAgfSxcbiAgICAgIGVycm9yczogZmlsZVJlY29yZC5wcm9jZXNzaW5nRXJyb3IgPyBbZmlsZVJlY29yZC5wcm9jZXNzaW5nRXJyb3JdIDogW10sXG4gICAgfSxcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGhhbmRsZVMzRXZlbnQoZXZlbnQ6IFMzRXZlbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgZm9yIChjb25zdCByZWNvcmQgb2YgZXZlbnQuUmVjb3Jkcykge1xuICAgIGNvbnN0IGJ1Y2tldE5hbWUgPSByZWNvcmQuczMuYnVja2V0Lm5hbWU7XG4gICAgY29uc3Qgb2JqZWN0S2V5ID0gcmVjb3JkLnMzLm9iamVjdC5rZXk7XG4gICAgXG4gICAgLy8gUGFyc2Ugb2JqZWN0IGtleSB0byBleHRyYWN0IGNsdWIsIHJvdXRlLCBhbmQgdmVyc2lvblxuICAgIGNvbnN0IGtleVBhcnRzID0gb2JqZWN0S2V5LnNwbGl0KCcvJyk7XG4gICAgaWYgKGtleVBhcnRzLmxlbmd0aCA+PSA0ICYmIGtleVBhcnRzWzBdID09PSAnZ3B4LWZpbGVzJykge1xuICAgICAgY29uc3QgY2x1YklkID0ga2V5UGFydHNbMV07XG4gICAgICBjb25zdCByb3V0ZUlkID0ga2V5UGFydHNbMl07XG4gICAgICBjb25zdCB2ZXJzaW9uTWF0Y2ggPSBrZXlQYXJ0c1szXS5tYXRjaCgvdihcXGQrKVxcLmdweCQvKTtcbiAgICAgIFxuICAgICAgaWYgKHZlcnNpb25NYXRjaCkge1xuICAgICAgICBjb25zdCB2ZXJzaW9uID0gcGFyc2VJbnQodmVyc2lvbk1hdGNoWzFdKTtcbiAgICAgICAgYXdhaXQgcHJvY2Vzc0dweEZpbGUoY2x1YklkLCByb3V0ZUlkLCB2ZXJzaW9uKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gcHJvY2Vzc0dweEZpbGUoY2x1YklkOiBzdHJpbmcsIHJvdXRlSWQ6IHN0cmluZywgdmVyc2lvbjogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gIHRyeSB7XG4gICAgY29uc29sZS5sb2coYFByb2Nlc3NpbmcgR1BYIGZpbGU6ICR7Y2x1YklkfS8ke3JvdXRlSWR9L3Yke3ZlcnNpb259YCk7XG4gICAgXG4gICAgLy8gVXBkYXRlIHN0YXR1cyB0byBwcm9jZXNzaW5nXG4gICAgYXdhaXQgdXBkYXRlRmlsZVN0YXR1cyhjbHViSWQsIHJvdXRlSWQsIHZlcnNpb24sICdwcm9jZXNzaW5nJyk7XG4gICAgXG4gICAgLy8gRG93bmxvYWQgZmlsZSBmcm9tIFMzXG4gICAgY29uc3QgZmlsZUtleSA9IGBncHgtZmlsZXMvJHtjbHViSWR9LyR7cm91dGVJZH0vdiR7dmVyc2lvbn0uZ3B4YDtcbiAgICBjb25zdCBncHhDb250ZW50ID0gYXdhaXQgZG93bmxvYWRGaWxlRnJvbVMzKGZpbGVLZXkpO1xuICAgIFxuICAgIC8vIFBhcnNlIEdQWCBjb250ZW50XG4gICAgY29uc3QgZ3B4RGF0YSA9IGF3YWl0IHBhcnNlR3B4Q29udGVudChncHhDb250ZW50KTtcbiAgICBcbiAgICAvLyBFeHRyYWN0IGJhc2ljIG1ldGFkYXRhXG4gICAgY29uc3QgbWV0YWRhdGEgPSBleHRyYWN0QmFzaWNNZXRhZGF0YShncHhEYXRhKTtcbiAgICBcbiAgICAvLyBHZW5lcmF0ZSBiYXNpYyBhbmFseXRpY3NcbiAgICBjb25zdCBhbmFseXRpY3MgPSBhd2FpdCBnZW5lcmF0ZUJhc2ljQW5hbHl0aWNzKGdweERhdGEsIGNsdWJJZCwgcm91dGVJZCwgdmVyc2lvbik7XG4gICAgXG4gICAgLy8gVXBkYXRlIGZpbGUgcmVjb3JkIHdpdGggbWV0YWRhdGFcbiAgICBhd2FpdCB1cGRhdGVGaWxlV2l0aE1ldGFkYXRhKGNsdWJJZCwgcm91dGVJZCwgdmVyc2lvbiwgbWV0YWRhdGEpO1xuICAgIFxuICAgIC8vIFN0b3JlIGFuYWx5dGljc1xuICAgIGF3YWl0IHN0b3JlQW5hbHl0aWNzKGNsdWJJZCwgcm91dGVJZCwgdmVyc2lvbiwgYW5hbHl0aWNzKTtcbiAgICBcbiAgICAvLyBVcGRhdGUgc3RhdHVzIHRvIGNvbXBsZXRlZFxuICAgIGF3YWl0IHVwZGF0ZUZpbGVTdGF0dXMoY2x1YklkLCByb3V0ZUlkLCB2ZXJzaW9uLCAnY29tcGxldGVkJyk7XG4gICAgXG4gICAgY29uc29sZS5sb2coYFN1Y2Nlc3NmdWxseSBwcm9jZXNzZWQgR1BYIGZpbGU6ICR7Y2x1YklkfS8ke3JvdXRlSWR9L3Yke3ZlcnNpb259YCk7XG4gICAgXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihgRXJyb3IgcHJvY2Vzc2luZyBHUFggZmlsZSAke2NsdWJJZH0vJHtyb3V0ZUlkfS92JHt2ZXJzaW9ufTpgLCBlcnJvcik7XG4gICAgXG4gICAgLy8gVXBkYXRlIHN0YXR1cyB0byBmYWlsZWRcbiAgICBhd2FpdCB1cGRhdGVGaWxlU3RhdHVzKFxuICAgICAgY2x1YklkLCBcbiAgICAgIHJvdXRlSWQsIFxuICAgICAgdmVyc2lvbiwgXG4gICAgICAnZmFpbGVkJywgXG4gICAgICBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdVbmtub3duIHByb2Nlc3NpbmcgZXJyb3InXG4gICAgKTtcbiAgICBcbiAgICB0aHJvdyBuZXcgRmlsZVByb2Nlc3NpbmdFcnJvcignRmFpbGVkIHRvIHByb2Nlc3MgR1BYIGZpbGUnLCBlcnJvciBhcyBFcnJvcik7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZG93bmxvYWRGaWxlRnJvbVMzKGZpbGVLZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGNvbW1hbmQgPSBuZXcgR2V0T2JqZWN0Q29tbWFuZCh7XG4gICAgQnVja2V0OiBCVUNLRVRfTkFNRSxcbiAgICBLZXk6IGZpbGVLZXksXG4gIH0pO1xuICBcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBzM0NsaWVudC5zZW5kKGNvbW1hbmQpO1xuICBcbiAgaWYgKCFyZXNwb25zZS5Cb2R5KSB7XG4gICAgdGhyb3cgbmV3IEZpbGVQcm9jZXNzaW5nRXJyb3IoJ0ZpbGUgY29udGVudCBpcyBlbXB0eScpO1xuICB9XG4gIFxuICByZXR1cm4gYXdhaXQgcmVzcG9uc2UuQm9keS50cmFuc2Zvcm1Ub1N0cmluZygpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBwYXJzZUdweENvbnRlbnQoZ3B4Q29udGVudDogc3RyaW5nKTogUHJvbWlzZTxhbnk+IHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBwYXJzZVhtbChncHhDb250ZW50KSBhcyBhbnk7XG4gICAgXG4gICAgaWYgKCFyZXN1bHQuZ3B4KSB7XG4gICAgICB0aHJvdyBuZXcgRmlsZVByb2Nlc3NpbmdFcnJvcignSW52YWxpZCBHUFggZm9ybWF0OiBtaXNzaW5nIGdweCByb290IGVsZW1lbnQnKTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIHJlc3VsdC5ncHg7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IEZpbGVQcm9jZXNzaW5nRXJyb3IoJ0ZhaWxlZCB0byBwYXJzZSBHUFggY29udGVudCcsIGVycm9yIGFzIEVycm9yKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleHRyYWN0QmFzaWNNZXRhZGF0YShncHhEYXRhOiBhbnkpOiBhbnkge1xuICBjb25zdCB0cmFja3MgPSBBcnJheS5pc0FycmF5KGdweERhdGEudHJrKSA/IGdweERhdGEudHJrIDogW2dweERhdGEudHJrXS5maWx0ZXIoQm9vbGVhbik7XG4gIGNvbnN0IHdheXBvaW50cyA9IEFycmF5LmlzQXJyYXkoZ3B4RGF0YS53cHQpID8gZ3B4RGF0YS53cHQgOiBbZ3B4RGF0YS53cHRdLmZpbHRlcihCb29sZWFuKTtcbiAgXG4gIGxldCB0b3RhbERpc3RhbmNlID0gMDtcbiAgbGV0IHRvdGFsRWxldmF0aW9uR2FpbiA9IDA7XG4gIGxldCB0cmFja1BvaW50cyA9IDA7XG4gIGxldCBib3VuZHMgPSB7XG4gICAgbm9ydGg6IC05MCxcbiAgICBzb3V0aDogOTAsXG4gICAgZWFzdDogLTE4MCxcbiAgICB3ZXN0OiAxODAsXG4gIH07XG4gIFxuICAvLyBQcm9jZXNzIHRyYWNrc1xuICBmb3IgKGNvbnN0IHRyYWNrIG9mIHRyYWNrcykge1xuICAgIGlmICh0cmFjay50cmtzZWcpIHtcbiAgICAgIGNvbnN0IHNlZ21lbnRzID0gQXJyYXkuaXNBcnJheSh0cmFjay50cmtzZWcpID8gdHJhY2sudHJrc2VnIDogW3RyYWNrLnRya3NlZ107XG4gICAgICBcbiAgICAgIGZvciAoY29uc3Qgc2VnbWVudCBvZiBzZWdtZW50cykge1xuICAgICAgICBpZiAoc2VnbWVudC50cmtwdCkge1xuICAgICAgICAgIGNvbnN0IHBvaW50cyA9IEFycmF5LmlzQXJyYXkoc2VnbWVudC50cmtwdCkgPyBzZWdtZW50LnRya3B0IDogW3NlZ21lbnQudHJrcHRdO1xuICAgICAgICAgIHRyYWNrUG9pbnRzICs9IHBvaW50cy5sZW5ndGg7XG4gICAgICAgICAgXG4gICAgICAgICAgLy8gQ2FsY3VsYXRlIGRpc3RhbmNlIGFuZCBlbGV2YXRpb25cbiAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBvaW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgcHJldiA9IHBvaW50c1tpIC0gMV07XG4gICAgICAgICAgICBjb25zdCBjdXJyID0gcG9pbnRzW2ldO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICAvLyBVcGRhdGUgYm91bmRzXG4gICAgICAgICAgICBjb25zdCBsYXQgPSBwYXJzZUZsb2F0KGN1cnIubGF0KTtcbiAgICAgICAgICAgIGNvbnN0IGxvbiA9IHBhcnNlRmxvYXQoY3Vyci5sb24pO1xuICAgICAgICAgICAgYm91bmRzLm5vcnRoID0gTWF0aC5tYXgoYm91bmRzLm5vcnRoLCBsYXQpO1xuICAgICAgICAgICAgYm91bmRzLnNvdXRoID0gTWF0aC5taW4oYm91bmRzLnNvdXRoLCBsYXQpO1xuICAgICAgICAgICAgYm91bmRzLmVhc3QgPSBNYXRoLm1heChib3VuZHMuZWFzdCwgbG9uKTtcbiAgICAgICAgICAgIGJvdW5kcy53ZXN0ID0gTWF0aC5taW4oYm91bmRzLndlc3QsIGxvbik7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBkaXN0YW5jZSAoc2ltcGxpZmllZCBIYXZlcnNpbmUpXG4gICAgICAgICAgICB0b3RhbERpc3RhbmNlICs9IGNhbGN1bGF0ZURpc3RhbmNlKFxuICAgICAgICAgICAgICBwYXJzZUZsb2F0KHByZXYubGF0KSwgcGFyc2VGbG9hdChwcmV2LmxvbiksXG4gICAgICAgICAgICAgIHBhcnNlRmxvYXQoY3Vyci5sYXQpLCBwYXJzZUZsb2F0KGN1cnIubG9uKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGVsZXZhdGlvbiBnYWluXG4gICAgICAgICAgICBpZiAocHJldi5lbGUgJiYgY3Vyci5lbGUpIHtcbiAgICAgICAgICAgICAgY29uc3QgZWxldkRpZmYgPSBwYXJzZUZsb2F0KGN1cnIuZWxlKSAtIHBhcnNlRmxvYXQocHJldi5lbGUpO1xuICAgICAgICAgICAgICBpZiAoZWxldkRpZmYgPiAwKSB7XG4gICAgICAgICAgICAgICAgdG90YWxFbGV2YXRpb25HYWluICs9IGVsZXZEaWZmO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICByZXR1cm4ge1xuICAgIHRvdGFsRGlzdGFuY2U6IE1hdGgucm91bmQodG90YWxEaXN0YW5jZSksXG4gICAgdG90YWxFbGV2YXRpb25HYWluOiBNYXRoLnJvdW5kKHRvdGFsRWxldmF0aW9uR2FpbiksXG4gICAgd2F5cG9pbnRzOiB3YXlwb2ludHMubGVuZ3RoLFxuICAgIHRyYWNrUG9pbnRzLFxuICAgIGJvdW5kcyxcbiAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVCYXNpY0FuYWx5dGljcyhncHhEYXRhOiBhbnksIGNsdWJJZDogc3RyaW5nLCByb3V0ZUlkOiBzdHJpbmcsIHZlcnNpb246IG51bWJlcik6IFByb21pc2U8YW55PiB7XG4gIC8vIEV4dHJhY3QgZWxldmF0aW9uIHByb2ZpbGUgKHNpbXBsaWZpZWQgdG8gbWF4IDIwMCBwb2ludHMpXG4gIGNvbnN0IGVsZXZhdGlvblByb2ZpbGUgPSBleHRyYWN0RWxldmF0aW9uUHJvZmlsZShncHhEYXRhKTtcbiAgXG4gIC8vIENhbGN1bGF0ZSBiYXNpYyBkaWZmaWN1bHR5IHNjb3JlXG4gIGNvbnN0IGRpZmZpY3VsdHlTY29yZSA9IGNhbGN1bGF0ZURpZmZpY3VsdHlTY29yZShncHhEYXRhKTtcbiAgXG4gIC8vIENhbGN1bGF0ZSBwZXJmb3JtYW5jZSBtZXRyaWNzXG4gIGNvbnN0IHBlcmZvcm1hbmNlTWV0cmljcyA9IGNhbGN1bGF0ZVBlcmZvcm1hbmNlTWV0cmljcyhncHhEYXRhKTtcbiAgXG4gIC8vIFN0b3JlIGVsZXZhdGlvbiBwcm9maWxlIGluIFMzXG4gIGNvbnN0IHByb2ZpbGVLZXkgPSBgcHJvY2Vzc2VkL2VsZXZhdGlvbi1wcm9maWxlcy8ke2NsdWJJZH0tJHtyb3V0ZUlkfS12JHt2ZXJzaW9ufS5qc29uYDtcbiAgYXdhaXQgc3RvcmVFbGV2YXRpb25Qcm9maWxlSW5TMyhwcm9maWxlS2V5LCBlbGV2YXRpb25Qcm9maWxlKTtcbiAgXG4gIHJldHVybiB7XG4gICAgZWxldmF0aW9uU3VtbWFyeToge1xuICAgICAgdG90YWxHYWluOiBlbGV2YXRpb25Qcm9maWxlLnRvdGFsR2FpbixcbiAgICAgIHRvdGFsTG9zczogZWxldmF0aW9uUHJvZmlsZS50b3RhbExvc3MsXG4gICAgICBtYXhFbGV2YXRpb246IGVsZXZhdGlvblByb2ZpbGUubWF4RWxldmF0aW9uLFxuICAgICAgbWluRWxldmF0aW9uOiBlbGV2YXRpb25Qcm9maWxlLm1pbkVsZXZhdGlvbixcbiAgICAgIHBvaW50Q291bnQ6IGVsZXZhdGlvblByb2ZpbGUucG9pbnRzLmxlbmd0aCxcbiAgICB9LFxuICAgIGVsZXZhdGlvblByb2ZpbGVLZXk6IHByb2ZpbGVLZXksXG4gICAgZGlmZmljdWx0eVNjb3JlLFxuICAgIHBlcmZvcm1hbmNlTWV0cmljcyxcbiAgICBhbmFseXplZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgZGF0YVZlcnNpb246ICcxLjAnLFxuICB9O1xufVxuXG5mdW5jdGlvbiBleHRyYWN0RWxldmF0aW9uUHJvZmlsZShncHhEYXRhOiBhbnkpOiBhbnkge1xuICBjb25zdCBwb2ludHM6IEFycmF5PHsgZGlzdGFuY2U6IG51bWJlcjsgZWxldmF0aW9uOiBudW1iZXI7IGdyYWRlOiBudW1iZXIgfT4gPSBbXTtcbiAgbGV0IHRvdGFsRGlzdGFuY2UgPSAwO1xuICBsZXQgdG90YWxHYWluID0gMDtcbiAgbGV0IHRvdGFsTG9zcyA9IDA7XG4gIGxldCBtYXhFbGV2YXRpb24gPSAtSW5maW5pdHk7XG4gIGxldCBtaW5FbGV2YXRpb24gPSBJbmZpbml0eTtcbiAgXG4gIGNvbnN0IHRyYWNrcyA9IEFycmF5LmlzQXJyYXkoZ3B4RGF0YS50cmspID8gZ3B4RGF0YS50cmsgOiBbZ3B4RGF0YS50cmtdLmZpbHRlcihCb29sZWFuKTtcbiAgXG4gIGZvciAoY29uc3QgdHJhY2sgb2YgdHJhY2tzKSB7XG4gICAgaWYgKHRyYWNrLnRya3NlZykge1xuICAgICAgY29uc3Qgc2VnbWVudHMgPSBBcnJheS5pc0FycmF5KHRyYWNrLnRya3NlZykgPyB0cmFjay50cmtzZWcgOiBbdHJhY2sudHJrc2VnXTtcbiAgICAgIFxuICAgICAgZm9yIChjb25zdCBzZWdtZW50IG9mIHNlZ21lbnRzKSB7XG4gICAgICAgIGlmIChzZWdtZW50LnRya3B0KSB7XG4gICAgICAgICAgY29uc3QgdHJhY2tQb2ludHMgPSBBcnJheS5pc0FycmF5KHNlZ21lbnQudHJrcHQpID8gc2VnbWVudC50cmtwdCA6IFtzZWdtZW50LnRya3B0XTtcbiAgICAgICAgICBcbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRyYWNrUG9pbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBwb2ludCA9IHRyYWNrUG9pbnRzW2ldO1xuICAgICAgICAgICAgY29uc3QgZWxldmF0aW9uID0gcGFyc2VGbG9hdChwb2ludC5lbGUpIHx8IDA7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIG1heEVsZXZhdGlvbiA9IE1hdGgubWF4KG1heEVsZXZhdGlvbiwgZWxldmF0aW9uKTtcbiAgICAgICAgICAgIG1pbkVsZXZhdGlvbiA9IE1hdGgubWluKG1pbkVsZXZhdGlvbiwgZWxldmF0aW9uKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHByZXZQb2ludCA9IHRyYWNrUG9pbnRzW2kgLSAxXTtcbiAgICAgICAgICAgICAgY29uc3QgcHJldkVsZXZhdGlvbiA9IHBhcnNlRmxvYXQocHJldlBvaW50LmVsZSkgfHwgMDtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIC8vIENhbGN1bGF0ZSBkaXN0YW5jZVxuICAgICAgICAgICAgICBjb25zdCBzZWdtZW50RGlzdGFuY2UgPSBjYWxjdWxhdGVEaXN0YW5jZShcbiAgICAgICAgICAgICAgICBwYXJzZUZsb2F0KHByZXZQb2ludC5sYXQpLCBwYXJzZUZsb2F0KHByZXZQb2ludC5sb24pLFxuICAgICAgICAgICAgICAgIHBhcnNlRmxvYXQocG9pbnQubGF0KSwgcGFyc2VGbG9hdChwb2ludC5sb24pXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIHRvdGFsRGlzdGFuY2UgKz0gc2VnbWVudERpc3RhbmNlO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgLy8gQ2FsY3VsYXRlIGVsZXZhdGlvbiBjaGFuZ2VcbiAgICAgICAgICAgICAgY29uc3QgZWxldmF0aW9uQ2hhbmdlID0gZWxldmF0aW9uIC0gcHJldkVsZXZhdGlvbjtcbiAgICAgICAgICAgICAgaWYgKGVsZXZhdGlvbkNoYW5nZSA+IDApIHtcbiAgICAgICAgICAgICAgICB0b3RhbEdhaW4gKz0gZWxldmF0aW9uQ2hhbmdlO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRvdGFsTG9zcyArPSBNYXRoLmFicyhlbGV2YXRpb25DaGFuZ2UpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAvLyBDYWxjdWxhdGUgZ3JhZGVcbiAgICAgICAgICAgICAgY29uc3QgZ3JhZGUgPSBzZWdtZW50RGlzdGFuY2UgPiAwID8gKGVsZXZhdGlvbkNoYW5nZSAvIHNlZ21lbnREaXN0YW5jZSkgKiAxMDAgOiAwO1xuICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgcG9pbnRzLnB1c2goe1xuICAgICAgICAgICAgICAgIGRpc3RhbmNlOiB0b3RhbERpc3RhbmNlLFxuICAgICAgICAgICAgICAgIGVsZXZhdGlvbixcbiAgICAgICAgICAgICAgICBncmFkZSxcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBwb2ludHMucHVzaCh7XG4gICAgICAgICAgICAgICAgZGlzdGFuY2U6IDAsXG4gICAgICAgICAgICAgICAgZWxldmF0aW9uLFxuICAgICAgICAgICAgICAgIGdyYWRlOiAwLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIC8vIERvd25zYW1wbGUgdG8gbWF4IDIwMCBwb2ludHNcbiAgY29uc3QgZG93bnNhbXBsZWRQb2ludHMgPSBkb3duc2FtcGxlUG9pbnRzKHBvaW50cywgMjAwKTtcbiAgXG4gIHJldHVybiB7XG4gICAgcG9pbnRzOiBkb3duc2FtcGxlZFBvaW50cyxcbiAgICB0b3RhbEdhaW4sXG4gICAgdG90YWxMb3NzLFxuICAgIG1heEVsZXZhdGlvbjogbWF4RWxldmF0aW9uID09PSAtSW5maW5pdHkgPyAwIDogbWF4RWxldmF0aW9uLFxuICAgIG1pbkVsZXZhdGlvbjogbWluRWxldmF0aW9uID09PSBJbmZpbml0eSA/IDAgOiBtaW5FbGV2YXRpb24sXG4gIH07XG59XG5cbmZ1bmN0aW9uIGRvd25zYW1wbGVQb2ludHMocG9pbnRzOiBhbnlbXSwgbWF4UG9pbnRzOiBudW1iZXIpOiBhbnlbXSB7XG4gIGlmIChwb2ludHMubGVuZ3RoIDw9IG1heFBvaW50cykge1xuICAgIHJldHVybiBwb2ludHM7XG4gIH1cbiAgXG4gIGNvbnN0IHN0ZXAgPSBNYXRoLmZsb29yKHBvaW50cy5sZW5ndGggLyBtYXhQb2ludHMpO1xuICBjb25zdCBkb3duc2FtcGxlZCA9IFtdO1xuICBcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyBpICs9IHN0ZXApIHtcbiAgICBkb3duc2FtcGxlZC5wdXNoKHBvaW50c1tpXSk7XG4gIH1cbiAgXG4gIC8vIEFsd2F5cyBpbmNsdWRlIHRoZSBsYXN0IHBvaW50XG4gIGlmIChkb3duc2FtcGxlZFtkb3duc2FtcGxlZC5sZW5ndGggLSAxXSAhPT0gcG9pbnRzW3BvaW50cy5sZW5ndGggLSAxXSkge1xuICAgIGRvd25zYW1wbGVkLnB1c2gocG9pbnRzW3BvaW50cy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgXG4gIHJldHVybiBkb3duc2FtcGxlZDtcbn1cblxuZnVuY3Rpb24gY2FsY3VsYXRlRGlmZmljdWx0eVNjb3JlKGdweERhdGE6IGFueSk6IGFueSB7XG4gIC8vIFNpbXBsaWZpZWQgZGlmZmljdWx0eSBjYWxjdWxhdGlvbiBiYXNlZCBvbiBkaXN0YW5jZSBhbmQgZWxldmF0aW9uXG4gIGNvbnN0IG1ldGFkYXRhID0gZXh0cmFjdEJhc2ljTWV0YWRhdGEoZ3B4RGF0YSk7XG4gIFxuICAvLyBEaXN0YW5jZSBkaWZmaWN1bHR5ICgxLTEwIHNjYWxlKVxuICBjb25zdCBkaXN0YW5jZURpZmZpY3VsdHkgPSBNYXRoLm1pbigxMCwgTWF0aC5tYXgoMSwgbWV0YWRhdGEudG90YWxEaXN0YW5jZSAvIDEwMDAwKSk7IC8vIDEwMGttID0gMTBcbiAgXG4gIC8vIEVsZXZhdGlvbiBkaWZmaWN1bHR5ICgxLTEwIHNjYWxlKVxuICBjb25zdCBlbGV2YXRpb25EaWZmaWN1bHR5ID0gTWF0aC5taW4oMTAsIE1hdGgubWF4KDEsIG1ldGFkYXRhLnRvdGFsRWxldmF0aW9uR2FpbiAvIDEwMDApKTsgLy8gMTAwMG0gPSAxMFxuICBcbiAgLy8gT3ZlcmFsbCBkaWZmaWN1bHR5ICh3ZWlnaHRlZCBhdmVyYWdlKVxuICBjb25zdCBvdmVyYWxsID0gKGRpc3RhbmNlRGlmZmljdWx0eSAqIDAuNiArIGVsZXZhdGlvbkRpZmZpY3VsdHkgKiAwLjQpO1xuICBcbiAgcmV0dXJuIHtcbiAgICBvdmVyYWxsOiBNYXRoLnJvdW5kKG92ZXJhbGwgKiAxMCkgLyAxMCxcbiAgICBlbGV2YXRpb246IE1hdGgucm91bmQoZWxldmF0aW9uRGlmZmljdWx0eSAqIDEwKSAvIDEwLFxuICAgIGRpc3RhbmNlOiBNYXRoLnJvdW5kKGRpc3RhbmNlRGlmZmljdWx0eSAqIDEwKSAvIDEwLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVQZXJmb3JtYW5jZU1ldHJpY3MoZ3B4RGF0YTogYW55KTogYW55IHtcbiAgY29uc3QgbWV0YWRhdGEgPSBleHRyYWN0QmFzaWNNZXRhZGF0YShncHhEYXRhKTtcbiAgXG4gIC8vIFNpbXBsaWZpZWQgdGltZSBlc3RpbWF0ZXMgYmFzZWQgb24gZGlzdGFuY2UgYW5kIGVsZXZhdGlvblxuICBjb25zdCBiYXNlVGltZSA9IG1ldGFkYXRhLnRvdGFsRGlzdGFuY2UgLyAyMDAwMCAqIDYwOyAvLyAyMGttL2ggYmFzZSBzcGVlZCBpbiBtaW51dGVzXG4gIGNvbnN0IGVsZXZhdGlvblRpbWUgPSBtZXRhZGF0YS50b3RhbEVsZXZhdGlvbkdhaW4gLyAxMDAgKiAxMDsgLy8gMTAgbWludXRlcyBwZXIgMTAwbSBlbGV2YXRpb25cbiAgXG4gIHJldHVybiB7XG4gICAgZXN0aW1hdGVkVGltZToge1xuICAgICAgcmVjcmVhdGlvbmFsOiBNYXRoLnJvdW5kKGJhc2VUaW1lICogMS41ICsgZWxldmF0aW9uVGltZSAqIDEuNSksXG4gICAgICBtb2RlcmF0ZTogTWF0aC5yb3VuZChiYXNlVGltZSAqIDEuMiArIGVsZXZhdGlvblRpbWUgKiAxLjIpLFxuICAgIH0sXG4gIH07XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN0b3JlRWxldmF0aW9uUHJvZmlsZUluUzMocHJvZmlsZUtleTogc3RyaW5nLCBlbGV2YXRpb25Qcm9maWxlOiBhbnkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgY29tbWFuZCA9IG5ldyBQdXRPYmplY3RDb21tYW5kKHtcbiAgICBCdWNrZXQ6IEJVQ0tFVF9OQU1FLFxuICAgIEtleTogcHJvZmlsZUtleSxcbiAgICBCb2R5OiBKU09OLnN0cmluZ2lmeShlbGV2YXRpb25Qcm9maWxlKSxcbiAgICBDb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICB9KTtcbiAgXG4gIGF3YWl0IHMzQ2xpZW50LnNlbmQoY29tbWFuZCk7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZURpc3RhbmNlKGxhdDE6IG51bWJlciwgbG9uMTogbnVtYmVyLCBsYXQyOiBudW1iZXIsIGxvbjI6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IFIgPSA2MzcxMDAwOyAvLyBFYXJ0aCdzIHJhZGl1cyBpbiBtZXRlcnNcbiAgY29uc3QgZExhdCA9IChsYXQyIC0gbGF0MSkgKiBNYXRoLlBJIC8gMTgwO1xuICBjb25zdCBkTG9uID0gKGxvbjIgLSBsb24xKSAqIE1hdGguUEkgLyAxODA7XG4gIGNvbnN0IGEgPSBNYXRoLnNpbihkTGF0IC8gMikgKiBNYXRoLnNpbihkTGF0IC8gMikgK1xuICAgIE1hdGguY29zKGxhdDEgKiBNYXRoLlBJIC8gMTgwKSAqIE1hdGguY29zKGxhdDIgKiBNYXRoLlBJIC8gMTgwKSAqXG4gICAgTWF0aC5zaW4oZExvbiAvIDIpICogTWF0aC5zaW4oZExvbiAvIDIpO1xuICBjb25zdCBjID0gMiAqIE1hdGguYXRhbjIoTWF0aC5zcXJ0KGEpLCBNYXRoLnNxcnQoMSAtIGEpKTtcbiAgcmV0dXJuIFIgKiBjO1xufVxuXG5hc3luYyBmdW5jdGlvbiB1cGRhdGVGaWxlU3RhdHVzKFxuICBjbHViSWQ6IHN0cmluZyxcbiAgcm91dGVJZDogc3RyaW5nLFxuICB2ZXJzaW9uOiBudW1iZXIsXG4gIHN0YXR1czogc3RyaW5nLFxuICBlcnJvcj86IHN0cmluZ1xuKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHVwZGF0ZUV4cHJlc3Npb24gPSBlcnJvclxuICAgID8gJ1NFVCBwcm9jZXNzaW5nU3RhdHVzID0gOnN0YXR1cywgcHJvY2Vzc2luZ0Vycm9yID0gOmVycm9yJ1xuICAgIDogJ1NFVCBwcm9jZXNzaW5nU3RhdHVzID0gOnN0YXR1cyc7XG4gIFxuICBjb25zdCBleHByZXNzaW9uQXR0cmlidXRlVmFsdWVzID0gZXJyb3JcbiAgICA/IHsgJzpzdGF0dXMnOiBzdGF0dXMsICc6ZXJyb3InOiBlcnJvciB9XG4gICAgOiB7ICc6c3RhdHVzJzogc3RhdHVzIH07XG4gIFxuICBhd2FpdCBkeW5hbW9DbGllbnQuc2VuZChuZXcgVXBkYXRlQ29tbWFuZCh7XG4gICAgVGFibGVOYW1lOiBUQUJMRV9OQU1FLFxuICAgIEtleToge1xuICAgICAgUEs6IGBDTFVCIyR7Y2x1YklkfSNST1VURSMke3JvdXRlSWR9YCxcbiAgICAgIFNLOiBgRklMRSMke3ZlcnNpb259YCxcbiAgICB9LFxuICAgIFVwZGF0ZUV4cHJlc3Npb246IHVwZGF0ZUV4cHJlc3Npb24sXG4gICAgRXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlczogZXhwcmVzc2lvbkF0dHJpYnV0ZVZhbHVlcyxcbiAgfSkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiB1cGRhdGVGaWxlV2l0aE1ldGFkYXRhKFxuICBjbHViSWQ6IHN0cmluZyxcbiAgcm91dGVJZDogc3RyaW5nLFxuICB2ZXJzaW9uOiBudW1iZXIsXG4gIG1ldGFkYXRhOiBhbnlcbik6IFByb21pc2U8dm9pZD4ge1xuICBhd2FpdCBkeW5hbW9DbGllbnQuc2VuZChuZXcgVXBkYXRlQ29tbWFuZCh7XG4gICAgVGFibGVOYW1lOiBUQUJMRV9OQU1FLFxuICAgIEtleToge1xuICAgICAgUEs6IGBDTFVCIyR7Y2x1YklkfSNST1VURSMke3JvdXRlSWR9YCxcbiAgICAgIFNLOiBgRklMRSMke3ZlcnNpb259YCxcbiAgICB9LFxuICAgIFVwZGF0ZUV4cHJlc3Npb246ICdTRVQgbWV0YWRhdGEgPSA6bWV0YWRhdGEnLFxuICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcbiAgICAgICc6bWV0YWRhdGEnOiBtZXRhZGF0YSxcbiAgICB9LFxuICB9KSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN0b3JlQW5hbHl0aWNzKFxuICBjbHViSWQ6IHN0cmluZyxcbiAgcm91dGVJZDogc3RyaW5nLFxuICB2ZXJzaW9uOiBudW1iZXIsXG4gIGFuYWx5dGljczogYW55XG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgYXdhaXQgZHluYW1vQ2xpZW50LnNlbmQobmV3IFB1dENvbW1hbmQoe1xuICAgIFRhYmxlTmFtZTogVEFCTEVfTkFNRSxcbiAgICBJdGVtOiB7XG4gICAgICBQSzogYENMVUIjJHtjbHViSWR9I1JPVVRFIyR7cm91dGVJZH1gLFxuICAgICAgU0s6IGBBTkFMWVRJQ1MjJHt2ZXJzaW9ufWAsXG4gICAgICAuLi5hbmFseXRpY3MsXG4gICAgfSxcbiAgfSkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRGaWxlUmVjb3JkKGNsdWJJZDogc3RyaW5nLCByb3V0ZUlkOiBzdHJpbmcsIHZlcnNpb246IG51bWJlcik6IFByb21pc2U8YW55PiB7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZHluYW1vQ2xpZW50LnNlbmQobmV3IEdldENvbW1hbmQoe1xuICAgIFRhYmxlTmFtZTogVEFCTEVfTkFNRSxcbiAgICBLZXk6IHtcbiAgICAgIFBLOiBgQ0xVQiMke2NsdWJJZH0jUk9VVEUjJHtyb3V0ZUlkfWAsXG4gICAgICBTSzogYEZJTEUjJHt2ZXJzaW9ufWAsXG4gICAgfSxcbiAgfSkpO1xuICBcbiAgcmV0dXJuIHJlc3BvbnNlLkl0ZW07XG59XG5cbmZ1bmN0aW9uIGdldFByb2dyZXNzRnJvbVN0YXR1cyhzdGF0dXM6IHN0cmluZyk6IG51bWJlciB7XG4gIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgY2FzZSAncGVuZGluZyc6IHJldHVybiAwO1xuICAgIGNhc2UgJ3Byb2Nlc3NpbmcnOiByZXR1cm4gNTA7XG4gICAgY2FzZSAnY29tcGxldGVkJzogcmV0dXJuIDEwMDtcbiAgICBjYXNlICdmYWlsZWQnOiByZXR1cm4gMDtcbiAgICBkZWZhdWx0OiByZXR1cm4gMDtcbiAgfVxufSJdfQ==