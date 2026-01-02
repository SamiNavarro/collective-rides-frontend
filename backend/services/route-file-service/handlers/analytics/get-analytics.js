"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const authorization_service_1 = require("../../../../shared/authorization/authorization-service");
const club_authorization_1 = require("../../../../shared/types/club-authorization");
const route_file_1 = require("../../../../shared/types/route-file");
const dynamoClient = lib_dynamodb_1.DynamoDBDocumentClient.from(new client_dynamodb_1.DynamoDBClient({ region: process.env.AWS_REGION }));
const TABLE_NAME = process.env.MAIN_TABLE_NAME;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;
const handler = async (event) => {
    try {
        // Validate authentication
        const authContext = (0, auth_context_1.validateAuthContext)(event);
        // Extract path parameters
        const clubId = event.pathParameters?.clubId;
        const routeId = event.pathParameters?.routeId;
        if (!clubId || !routeId) {
            throw new route_file_1.RouteFileError('Missing required path parameters', 'MISSING_PARAMETERS', 400);
        }
        // Check authorization - club members can view analytics
        const authService = new authorization_service_1.AuthorizationService();
        const hasPermission = await authService.hasCapability(authContext.userId, clubId, club_authorization_1.ClubCapability.VIEW_ROUTE_ANALYTICS);
        if (!hasPermission) {
            throw new route_file_1.RouteFileError('Insufficient privileges to view route analytics', 'INSUFFICIENT_PRIVILEGES', 403);
        }
        // Get the latest analytics for this route
        const analytics = await getLatestAnalytics(clubId, routeId);
        if (!analytics) {
            throw new route_file_1.RouteFileError('Analytics not found', 'ANALYTICS_NOT_FOUND', 404);
        }
        // Generate CloudFront URL for elevation profile
        const elevationProfileUrl = generateCloudFrontUrl(analytics.elevationProfileKey);
        return (0, lambda_utils_1.createResponse)(200, {
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
    }
    catch (error) {
        console.error('Error getting route analytics:', error);
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
            message: 'Failed to get route analytics',
        });
    }
};
exports.handler = handler;
async function getLatestAnalytics(clubId, routeId) {
    // Query for analytics records, sorted by version (descending)
    const response = await dynamoClient.send(new lib_dynamodb_1.QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': `CLUB#${clubId}#ROUTE#${routeId}`,
            ':sk': 'ANALYTICS#',
        },
        ScanIndexForward: false,
        Limit: 1,
    }));
    return response.Items && response.Items.length > 0 ? response.Items[0] : null;
}
function generateCloudFrontUrl(s3Key) {
    if (CLOUDFRONT_DOMAIN) {
        return `https://${CLOUDFRONT_DOMAIN}/${s3Key}`;
    }
    // Fallback to direct S3 URL (not recommended for production)
    return `https://${process.env.ROUTES_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LWFuYWx5dGljcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdldC1hbmFseXRpY3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsOERBQTBEO0FBQzFELHdEQUE2RTtBQUM3RSx3RUFBdUU7QUFDdkUsdUVBQTJFO0FBQzNFLGtHQUE4RjtBQUM5RixvRkFBNkU7QUFDN0Usb0VBQXFFO0FBRXJFLE1BQU0sWUFBWSxHQUFHLHFDQUFzQixDQUFDLElBQUksQ0FBQyxJQUFJLGdDQUFjLENBQUMsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFFekcsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFnQixDQUFDO0FBQ2hELE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBa0IsQ0FBQztBQUVsRCxNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBMkIsRUFBa0MsRUFBRTtJQUMzRixJQUFJO1FBQ0YsMEJBQTBCO1FBQzFCLE1BQU0sV0FBVyxHQUFHLElBQUEsa0NBQW1CLEVBQUMsS0FBSyxDQUFDLENBQUM7UUFFL0MsMEJBQTBCO1FBQzFCLE1BQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsTUFBTSxDQUFDO1FBQzVDLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsT0FBTyxDQUFDO1FBRTlDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDdkIsTUFBTSxJQUFJLDJCQUFjLENBQUMsa0NBQWtDLEVBQUUsb0JBQW9CLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDekY7UUFFRCx3REFBd0Q7UUFDeEQsTUFBTSxXQUFXLEdBQUcsSUFBSSw0Q0FBb0IsRUFBRSxDQUFDO1FBQy9DLE1BQU0sYUFBYSxHQUFHLE1BQU0sV0FBVyxDQUFDLGFBQWEsQ0FDbkQsV0FBVyxDQUFDLE1BQU0sRUFD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eHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XG5pbXBvcnQgeyBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LCBRdWVyeUNvbW1hbmQgfSBmcm9tICdAYXdzLXNkay9saWItZHluYW1vZGInO1xuaW1wb3J0IHsgY3JlYXRlUmVzcG9uc2UgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IHZhbGlkYXRlQXV0aENvbnRleHQgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvYXV0aC9hdXRoLWNvbnRleHQnO1xuaW1wb3J0IHsgQXV0aG9yaXphdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvYXV0aG9yaXphdGlvbi9hdXRob3JpemF0aW9uLXNlcnZpY2UnO1xuaW1wb3J0IHsgQ2x1YkNhcGFiaWxpdHkgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvY2x1Yi1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IFJvdXRlRmlsZUVycm9yIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL3JvdXRlLWZpbGUnO1xuXG5jb25zdCBkeW5hbW9DbGllbnQgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20obmV3IER5bmFtb0RCQ2xpZW50KHsgcmVnaW9uOiBwcm9jZXNzLmVudi5BV1NfUkVHSU9OIH0pKTtcblxuY29uc3QgVEFCTEVfTkFNRSA9IHByb2Nlc3MuZW52Lk1BSU5fVEFCTEVfTkFNRSE7XG5jb25zdCBDTE9VREZST05UX0RPTUFJTiA9IHByb2Nlc3MuZW52LkNMT1VERlJPTlRfRE9NQUlOITtcblxuZXhwb3J0IGNvbnN0IGhhbmRsZXIgPSBhc3luYyAoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogUHJvbWlzZTxBUElHYXRld2F5UHJveHlSZXN1bHQ+ID0+IHtcbiAgdHJ5IHtcbiAgICAvLyBWYWxpZGF0ZSBhdXRoZW50aWNhdGlvblxuICAgIGNvbnN0IGF1dGhDb250ZXh0ID0gdmFsaWRhdGVBdXRoQ29udGV4dChldmVudCk7XG5cbiAgICAvLyBFeHRyYWN0IHBhdGggcGFyYW1ldGVyc1xuICAgIGNvbnN0IGNsdWJJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5jbHViSWQ7XG4gICAgY29uc3Qgcm91dGVJZCA9IGV2ZW50LnBhdGhQYXJhbWV0ZXJzPy5yb3V0ZUlkO1xuXG4gICAgaWYgKCFjbHViSWQgfHwgIXJvdXRlSWQpIHtcbiAgICAgIHRocm93IG5ldyBSb3V0ZUZpbGVFcnJvcignTWlzc2luZyByZXF1aXJlZCBwYXRoIHBhcmFtZXRlcnMnLCAnTUlTU0lOR19QQVJBTUVURVJTJywgNDAwKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBhdXRob3JpemF0aW9uIC0gY2x1YiBtZW1iZXJzIGNhbiB2aWV3IGFuYWx5dGljc1xuICAgIGNvbnN0IGF1dGhTZXJ2aWNlID0gbmV3IEF1dGhvcml6YXRpb25TZXJ2aWNlKCk7XG4gICAgY29uc3QgaGFzUGVybWlzc2lvbiA9IGF3YWl0IGF1dGhTZXJ2aWNlLmhhc0NhcGFiaWxpdHkoXG4gICAgICBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBjbHViSWQsXG4gICAgICBDbHViQ2FwYWJpbGl0eS5WSUVXX1JPVVRFX0FOQUxZVElDU1xuICAgICk7XG5cbiAgICBpZiAoIWhhc1Blcm1pc3Npb24pIHtcbiAgICAgIHRocm93IG5ldyBSb3V0ZUZpbGVFcnJvcignSW5zdWZmaWNpZW50IHByaXZpbGVnZXMgdG8gdmlldyByb3V0ZSBhbmFseXRpY3MnLCAnSU5TVUZGSUNJRU5UX1BSSVZJTEVHRVMnLCA0MDMpO1xuICAgIH1cblxuICAgIC8vIEdldCB0aGUgbGF0ZXN0IGFuYWx5dGljcyBmb3IgdGhpcyByb3V0ZVxuICAgIGNvbnN0IGFuYWx5dGljcyA9IGF3YWl0IGdldExhdGVzdEFuYWx5dGljcyhjbHViSWQsIHJvdXRlSWQpO1xuXG4gICAgaWYgKCFhbmFseXRpY3MpIHtcbiAgICAgIHRocm93IG5ldyBSb3V0ZUZpbGVFcnJvcignQW5hbHl0aWNzIG5vdCBmb3VuZCcsICdBTkFMWVRJQ1NfTk9UX0ZPVU5EJywgNDA0KTtcbiAgICB9XG5cbiAgICAvLyBHZW5lcmF0ZSBDbG91ZEZyb250IFVSTCBmb3IgZWxldmF0aW9uIHByb2ZpbGVcbiAgICBjb25zdCBlbGV2YXRpb25Qcm9maWxlVXJsID0gZ2VuZXJhdGVDbG91ZEZyb250VXJsKGFuYWx5dGljcy5lbGV2YXRpb25Qcm9maWxlS2V5KTtcblxuICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSgyMDAsIHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIGVsZXZhdGlvblN1bW1hcnk6IGFuYWx5dGljcy5lbGV2YXRpb25TdW1tYXJ5LFxuICAgICAgICBlbGV2YXRpb25Qcm9maWxlVXJsLFxuICAgICAgICBkaWZmaWN1bHR5U2NvcmU6IGFuYWx5dGljcy5kaWZmaWN1bHR5U2NvcmUsXG4gICAgICAgIHBlcmZvcm1hbmNlTWV0cmljczogYW5hbHl0aWNzLnBlcmZvcm1hbmNlTWV0cmljcyxcbiAgICAgICAgYW5hbHl6ZWRBdDogYW5hbHl0aWNzLmFuYWx5emVkQXQsXG4gICAgICAgIGRhdGFWZXJzaW9uOiBhbmFseXRpY3MuZGF0YVZlcnNpb24sXG4gICAgICB9LFxuICAgIH0pO1xuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgZ2V0dGluZyByb3V0ZSBhbmFseXRpY3M6JywgZXJyb3IpO1xuXG4gICAgaWYgKGVycm9yIGluc3RhbmNlb2YgUm91dGVGaWxlRXJyb3IpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZShlcnJvci5zdGF0dXNDb2RlLCB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IuY29kZSxcbiAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg1MDAsIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6ICdJTlRFUk5BTF9FUlJPUicsXG4gICAgICBtZXNzYWdlOiAnRmFpbGVkIHRvIGdldCByb3V0ZSBhbmFseXRpY3MnLFxuICAgIH0pO1xuICB9XG59O1xuXG5hc3luYyBmdW5jdGlvbiBnZXRMYXRlc3RBbmFseXRpY3MoY2x1YklkOiBzdHJpbmcsIHJvdXRlSWQ6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gIC8vIFF1ZXJ5IGZvciBhbmFseXRpY3MgcmVjb3Jkcywgc29ydGVkIGJ5IHZlcnNpb24gKGRlc2NlbmRpbmcpXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZHluYW1vQ2xpZW50LnNlbmQobmV3IFF1ZXJ5Q29tbWFuZCh7XG4gICAgVGFibGVOYW1lOiBUQUJMRV9OQU1FLFxuICAgIEtleUNvbmRpdGlvbkV4cHJlc3Npb246ICdQSyA9IDpwayBBTkQgYmVnaW5zX3dpdGgoU0ssIDpzayknLFxuICAgIEV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXM6IHtcbiAgICAgICc6cGsnOiBgQ0xVQiMke2NsdWJJZH0jUk9VVEUjJHtyb3V0ZUlkfWAsXG4gICAgICAnOnNrJzogJ0FOQUxZVElDUyMnLFxuICAgIH0sXG4gICAgU2NhbkluZGV4Rm9yd2FyZDogZmFsc2UsIC8vIEdldCBsYXRlc3QgdmVyc2lvbiBmaXJzdFxuICAgIExpbWl0OiAxLFxuICB9KSk7XG5cbiAgcmV0dXJuIHJlc3BvbnNlLkl0ZW1zICYmIHJlc3BvbnNlLkl0ZW1zLmxlbmd0aCA+IDAgPyByZXNwb25zZS5JdGVtc1swXSA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQ2xvdWRGcm9udFVybChzM0tleTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKENMT1VERlJPTlRfRE9NQUlOKSB7XG4gICAgcmV0dXJuIGBodHRwczovLyR7Q0xPVURGUk9OVF9ET01BSU59LyR7czNLZXl9YDtcbiAgfVxuXG4gIC8vIEZhbGxiYWNrIHRvIGRpcmVjdCBTMyBVUkwgKG5vdCByZWNvbW1lbmRlZCBmb3IgcHJvZHVjdGlvbilcbiAgcmV0dXJuIGBodHRwczovLyR7cHJvY2Vzcy5lbnYuUk9VVEVTX0JVQ0tFVF9OQU1FfS5zMy4ke3Byb2Nlc3MuZW52LkFXU19SRUdJT059LmFtYXpvbmF3cy5jb20vJHtzM0tleX1gO1xufSJdfQ==