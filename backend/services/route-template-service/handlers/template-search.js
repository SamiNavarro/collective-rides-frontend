"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const lambda_utils_1 = require("../../../shared/utils/lambda-utils");
const auth_context_1 = require("../../../shared/auth/auth-context");
const authorization_service_1 = require("../../../shared/authorization/authorization-service");
const club_authorization_1 = require("../../../shared/types/club-authorization");
const route_template_1 = require("../../../shared/types/route-template");
const dynamoClient = lib_dynamodb_1.DynamoDBDocumentClient.from(new client_dynamodb_1.DynamoDBClient({ region: process.env.AWS_REGION }));
const TABLE_NAME = process.env.MAIN_TABLE_NAME;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const handler = async (event) => {
    try {
        // Validate authentication
        const authContext = (0, auth_context_1.validateAuthContext)(event);
        // Extract path parameters
        const clubId = event.pathParameters?.clubId;
        if (!clubId) {
            throw new route_template_1.RouteTemplateError('Missing club ID', 'MISSING_CLUB_ID', 400);
        }
        // Check authorization - club members can search templates
        const authService = new authorization_service_1.AuthorizationService();
        const hasPermission = await authService.hasCapability(authContext.userId, clubId, club_authorization_1.ClubCapability.VIEW_CLUB_TEMPLATES);
        if (!hasPermission) {
            throw new route_template_1.RouteTemplateError('Insufficient privileges to view templates', 'INSUFFICIENT_PRIVILEGES', 403);
        }
        // Parse query parameters
        const query = parseSearchQuery(event.queryStringParameters || {});
        // Search templates
        const results = await searchTemplates(clubId, query);
        return (0, lambda_utils_1.createResponse)(200, {
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
    }
    catch (error) {
        console.error('Error searching templates:', error);
        if (error instanceof route_template_1.RouteTemplateError) {
            return (0, lambda_utils_1.createResponse)(error.statusCode, {
                success: false,
                error: error.code,
                message: error.message,
            });
        }
        return (0, lambda_utils_1.createResponse)(500, {
            success: false,
            error: 'INTERNAL_ERROR',
            message: 'Failed to search templates',
        });
    }
};
exports.handler = handler;
function parseSearchQuery(queryParams) {
    const limit = Math.min(parseInt(queryParams.limit || DEFAULT_LIMIT.toString()), MAX_LIMIT);
    return {
        query: queryParams.query,
        difficulty: queryParams.difficulty,
        terrain: queryParams.terrain,
        category: queryParams.category,
        limit,
        cursor: queryParams.cursor,
    };
}
async function searchTemplates(clubId, query) {
    // Build DynamoDB query
    const queryParams = {
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
        }
        catch (error) {
            throw new route_template_1.RouteTemplateError('Invalid cursor', 'INVALID_CURSOR', 400);
        }
    }
    // Add filters
    const filterExpressions = [];
    const filterValues = { ...queryParams.ExpressionAttributeValues };
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
    const response = await dynamoClient.send(new lib_dynamodb_1.QueryCommand(queryParams));
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
    let nextCursor;
    if (response.LastEvaluatedKey) {
        nextCursor = Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString('base64');
    }
    return {
        templates,
        nextCursor,
        hasMore: !!response.LastEvaluatedKey,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVtcGxhdGUtc2VhcmNoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsidGVtcGxhdGUtc2VhcmNoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLDhEQUEwRDtBQUMxRCx3REFBNkU7QUFDN0UscUVBQW9FO0FBQ3BFLG9FQUF3RTtBQUN4RSwrRkFBMkY7QUFDM0YsaUZBQTBFO0FBQzFFLHlFQUFnRztBQUVoRyxNQUFNLFlBQVksR0FBRyxxQ0FBc0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxnQ0FBYyxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBRXpHLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZUFBZ0IsQ0FBQztBQUNoRCxNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUM7QUFDekIsTUFBTSxTQUFTLEdBQUcsR0FBRyxDQUFDO0FBRWYsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUFFLEtBQTJCLEVBQWtDLEVBQUU7SUFDM0YsSUFBSTtRQUNGLDBCQUEwQjtRQUMxQixNQUFNLFdBQVcsR0FBRyxJQUFBLGtDQUFtQixFQUFDLEtBQUssQ0FBQyxDQUFDO1FBRS9DLDBCQUEwQjtRQUMxQixNQUFNLE1BQU0sR0FBRyxLQUFLLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQztRQUU1QyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ1gsTUFBTSxJQUFJLG1DQUFrQixDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ3pFO1FBRUQsMERBQTBEO1FBQzFELE1BQU0sV0FBVyxHQUFHLElBQUksNENBQW9CLEVBQUUsQ0FBQztRQUMvQyxNQUFNLGFBQWEsR0FBRyxNQUFNLFdBQVcsQ0FBQyxhQUFhLENBQ25ELFdBQVcsQ0FBQyxNQUFNLEVBQ2xCLE1BQU0sRUFDTixtQ0FBYyxDQUFDLG1CQUFtQixDQUNuQyxDQUFDO1FBRUYsSUFBSSxDQUFD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QUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDcEQsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO1FBQzNCLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTtRQUMvQixXQUFXLEVBQUUsSUFBSSxDQUFDLFdBQVc7UUFDN0IsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO1FBQzNCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTztRQUNyQixRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7UUFDdkIsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQztRQUNoQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFO1FBQ3JCLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztRQUN6QixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7S0FDMUIsQ0FBQyxDQUFDLENBQUM7SUFFSix1QkFBdUI7SUFDdkIsSUFBSSxVQUE4QixDQUFDO0lBQ25DLElBQUksUUFBUSxDQUFDLGdCQUFnQixFQUFFO1FBQzdCLFVBQVUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDeEY7SUFFRCxPQUFPO1FBQ0wsU0FBUztRQUNULFVBQVU7UUFDVixPQUFPLEVBQUUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0I7S0FDckMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XG5pbXBvcnQgeyBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LCBRdWVyeUNvbW1hbmQgfSBmcm9tICdAYXdzLXNkay9saWItZHluYW1vZGInO1xuaW1wb3J0IHsgY3JlYXRlUmVzcG9uc2UgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IHZhbGlkYXRlQXV0aENvbnRleHQgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvYXV0aC9hdXRoLWNvbnRleHQnO1xuaW1wb3J0IHsgQXV0aG9yaXphdGlvblNlcnZpY2UgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvYXV0aG9yaXphdGlvbi9hdXRob3JpemF0aW9uLXNlcnZpY2UnO1xuaW1wb3J0IHsgQ2x1YkNhcGFiaWxpdHkgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdHlwZXMvY2x1Yi1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IFNlYXJjaFRlbXBsYXRlc1F1ZXJ5LCBSb3V0ZVRlbXBsYXRlRXJyb3IgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdHlwZXMvcm91dGUtdGVtcGxhdGUnO1xuXG5jb25zdCBkeW5hbW9DbGllbnQgPSBEeW5hbW9EQkRvY3VtZW50Q2xpZW50LmZyb20obmV3IER5bmFtb0RCQ2xpZW50KHsgcmVnaW9uOiBwcm9jZXNzLmVudi5BV1NfUkVHSU9OIH0pKTtcblxuY29uc3QgVEFCTEVfTkFNRSA9IHByb2Nlc3MuZW52Lk1BSU5fVEFCTEVfTkFNRSE7XG5jb25zdCBERUZBVUxUX0xJTUlUID0gMjA7XG5jb25zdCBNQVhfTElNSVQgPSAxMDA7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCk6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiA9PiB7XG4gIHRyeSB7XG4gICAgLy8gVmFsaWRhdGUgYXV0aGVudGljYXRpb25cbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IHZhbGlkYXRlQXV0aENvbnRleHQoZXZlbnQpO1xuICAgIFxuICAgIC8vIEV4dHJhY3QgcGF0aCBwYXJhbWV0ZXJzXG4gICAgY29uc3QgY2x1YklkID0gZXZlbnQucGF0aFBhcmFtZXRlcnM/LmNsdWJJZDtcbiAgICBcbiAgICBpZiAoIWNsdWJJZCkge1xuICAgICAgdGhyb3cgbmV3IFJvdXRlVGVtcGxhdGVFcnJvcignTWlzc2luZyBjbHViIElEJywgJ01JU1NJTkdfQ0xVQl9JRCcsIDQwMCk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgYXV0aG9yaXphdGlvbiAtIGNsdWIgbWVtYmVycyBjYW4gc2VhcmNoIHRlbXBsYXRlc1xuICAgIGNvbnN0IGF1dGhTZXJ2aWNlID0gbmV3IEF1dGhvcml6YXRpb25TZXJ2aWNlKCk7XG4gICAgY29uc3QgaGFzUGVybWlzc2lvbiA9IGF3YWl0IGF1dGhTZXJ2aWNlLmhhc0NhcGFiaWxpdHkoXG4gICAgICBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBjbHViSWQsXG4gICAgICBDbHViQ2FwYWJpbGl0eS5WSUVXX0NMVUJfVEVNUExBVEVTXG4gICAgKTtcbiAgICBcbiAgICBpZiAoIWhhc1Blcm1pc3Npb24pIHtcbiAgICAgIHRocm93IG5ldyBSb3V0ZVRlbXBsYXRlRXJyb3IoJ0luc3VmZmljaWVudCBwcml2aWxlZ2VzIHRvIHZpZXcgdGVtcGxhdGVzJywgJ0lOU1VGRklDSUVOVF9QUklWSUxFR0VTJywgNDAzKTtcbiAgICB9XG5cbiAgICAvLyBQYXJzZSBxdWVyeSBwYXJhbWV0ZXJzXG4gICAgY29uc3QgcXVlcnkgPSBwYXJzZVNlYXJjaFF1ZXJ5KGV2ZW50LnF1ZXJ5U3RyaW5nUGFyYW1ldGVycyB8fCB7fSk7XG4gICAgXG4gICAgLy8gU2VhcmNoIHRlbXBsYXRlc1xuICAgIGNvbnN0IHJlc3VsdHMgPSBhd2FpdCBzZWFyY2hUZW1wbGF0ZXMoY2x1YklkLCBxdWVyeSk7XG4gICAgXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDIwMCwge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgdGVtcGxhdGVzOiByZXN1bHRzLnRlbXBsYXRlcyxcbiAgICAgICAgcGFnaW5hdGlvbjoge1xuICAgICAgICAgIGxpbWl0OiBxdWVyeS5saW1pdCxcbiAgICAgICAgICBuZXh0Q3Vyc29yOiByZXN1bHRzLm5leHRDdXJzb3IsXG4gICAgICAgICAgaGFzTW9yZTogcmVzdWx0cy5oYXNNb3JlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgICBcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzZWFyY2hpbmcgdGVtcGxhdGVzOicsIGVycm9yKTtcbiAgICBcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBSb3V0ZVRlbXBsYXRlRXJyb3IpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZShlcnJvci5zdGF0dXNDb2RlLCB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogZXJyb3IuY29kZSxcbiAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNTAwLCB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiAnSU5URVJOQUxfRVJST1InLFxuICAgICAgbWVzc2FnZTogJ0ZhaWxlZCB0byBzZWFyY2ggdGVtcGxhdGVzJyxcbiAgICB9KTtcbiAgfVxufTtcblxuZnVuY3Rpb24gcGFyc2VTZWFyY2hRdWVyeShxdWVyeVBhcmFtczogUmVjb3JkPHN0cmluZywgc3RyaW5nIHwgdW5kZWZpbmVkPik6IFNlYXJjaFRlbXBsYXRlc1F1ZXJ5IHtcbiAgY29uc3QgbGltaXQgPSBNYXRoLm1pbihcbiAgICBwYXJzZUludChxdWVyeVBhcmFtcy5saW1pdCB8fCBERUZBVUxUX0xJTUlULnRvU3RyaW5nKCkpLFxuICAgIE1BWF9MSU1JVFxuICApO1xuICBcbiAgcmV0dXJuIHtcbiAgICBxdWVyeTogcXVlcnlQYXJhbXMucXVlcnksXG4gICAgZGlmZmljdWx0eTogcXVlcnlQYXJhbXMuZGlmZmljdWx0eSBhcyBhbnksXG4gICAgdGVycmFpbjogcXVlcnlQYXJhbXMudGVycmFpbiBhcyBhbnksXG4gICAgY2F0ZWdvcnk6IHF1ZXJ5UGFyYW1zLmNhdGVnb3J5IGFzIGFueSxcbiAgICBsaW1pdCxcbiAgICBjdXJzb3I6IHF1ZXJ5UGFyYW1zLmN1cnNvcixcbiAgfTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc2VhcmNoVGVtcGxhdGVzKGNsdWJJZDogc3RyaW5nLCBxdWVyeTogU2VhcmNoVGVtcGxhdGVzUXVlcnkpOiBQcm9taXNlPHtcbiAgdGVtcGxhdGVzOiBhbnlbXTtcbiAgbmV4dEN1cnNvcj86IHN0cmluZztcbiAgaGFzTW9yZTogYm9vbGVhbjtcbn0+IHtcbiAgLy8gQnVpbGQgRHluYW1vREIgcXVlcnlcbiAgY29uc3QgcXVlcnlQYXJhbXM6IGFueSA9IHtcbiAgICBUYWJsZU5hbWU6IFRBQkxFX05BTUUsXG4gICAgS2V5Q29uZGl0aW9uRXhwcmVzc2lvbjogJ1BLID0gOnBrJyxcbiAgICBFeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzOiB7XG4gICAgICAnOnBrJzogYENMVUIjJHtjbHViSWR9I1RFTVBMQVRFU2AsXG4gICAgfSxcbiAgICBMaW1pdDogcXVlcnkubGltaXQsXG4gIH07XG4gIFxuICAvLyBBZGQgY3Vyc29yIGZvciBwYWdpbmF0aW9uXG4gIGlmIChxdWVyeS5jdXJzb3IpIHtcbiAgICB0cnkge1xuICAgICAgcXVlcnlQYXJhbXMuRXhjbHVzaXZlU3RhcnRLZXkgPSBKU09OLnBhcnNlKEJ1ZmZlci5mcm9tKHF1ZXJ5LmN1cnNvciwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCkpO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICB0aHJvdyBuZXcgUm91dGVUZW1wbGF0ZUVycm9yKCdJbnZhbGlkIGN1cnNvcicsICdJTlZBTElEX0NVUlNPUicsIDQwMCk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBBZGQgZmlsdGVyc1xuICBjb25zdCBmaWx0ZXJFeHByZXNzaW9uczogc3RyaW5nW10gPSBbXTtcbiAgY29uc3QgZmlsdGVyVmFsdWVzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+ID0geyAuLi5xdWVyeVBhcmFtcy5FeHByZXNzaW9uQXR0cmlidXRlVmFsdWVzIH07XG4gIFxuICBpZiAocXVlcnkuZGlmZmljdWx0eSkge1xuICAgIGZpbHRlckV4cHJlc3Npb25zLnB1c2goJ2RpZmZpY3VsdHkgPSA6ZGlmZmljdWx0eScpO1xuICAgIGZpbHRlclZhbHVlc1snOmRpZmZpY3VsdHknXSA9IHF1ZXJ5LmRpZmZpY3VsdHk7XG4gIH1cbiAgXG4gIGlmIChxdWVyeS50ZXJyYWluKSB7XG4gICAgZmlsdGVyRXhwcmVzc2lvbnMucHVzaCgndGVycmFpbiA9IDp0ZXJyYWluJyk7XG4gICAgZmlsdGVyVmFsdWVzWyc6dGVycmFpbiddID0gcXVlcnkudGVycmFpbjtcbiAgfVxuICBcbiAgaWYgKHF1ZXJ5LmNhdGVnb3J5KSB7XG4gICAgZmlsdGVyRXhwcmVzc2lvbnMucHVzaCgnY2F0ZWdvcnkgPSA6Y2F0ZWdvcnknKTtcbiAgICBmaWx0ZXJWYWx1ZXNbJzpjYXRlZ29yeSddID0gcXVlcnkuY2F0ZWdvcnk7XG4gIH1cbiAgXG4gIGlmIChxdWVyeS5xdWVyeSkge1xuICAgIC8vIFNpbXBsZSB0ZXh0IHNlYXJjaCBpbiB0ZW1wbGF0ZSBuYW1lIGFuZCBkZXNjcmlwdGlvblxuICAgIGZpbHRlckV4cHJlc3Npb25zLnB1c2goJyhjb250YWlucyh0ZW1wbGF0ZU5hbWUsIDpzZWFyY2hRdWVyeSkgT1IgY29udGFpbnMoZGVzY3JpcHRpb24sIDpzZWFyY2hRdWVyeSkpJyk7XG4gICAgZmlsdGVyVmFsdWVzWyc6c2VhcmNoUXVlcnknXSA9IHF1ZXJ5LnF1ZXJ5O1xuICB9XG4gIFxuICBpZiAoZmlsdGVyRXhwcmVzc2lvbnMubGVuZ3RoID4gMCkge1xuICAgIHF1ZXJ5UGFyYW1zLkZpbHRlckV4cHJlc3Npb24gPSBmaWx0ZXJFeHByZXNzaW9ucy5qb2luKCcgQU5EICcpO1xuICAgIHF1ZXJ5UGFyYW1zLkV4cHJlc3Npb25BdHRyaWJ1dGVWYWx1ZXMgPSBmaWx0ZXJWYWx1ZXM7XG4gIH1cbiAgXG4gIC8vIEV4ZWN1dGUgcXVlcnlcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBkeW5hbW9DbGllbnQuc2VuZChuZXcgUXVlcnlDb21tYW5kKHF1ZXJ5UGFyYW1zKSk7XG4gIFxuICAvLyBQcm9jZXNzIHJlc3VsdHNcbiAgY29uc3QgdGVtcGxhdGVzID0gKHJlc3BvbnNlLkl0ZW1zIHx8IFtdKS5tYXAoaXRlbSA9PiAoe1xuICAgIHRlbXBsYXRlSWQ6IGl0ZW0udGVtcGxhdGVJZCxcbiAgICB0ZW1wbGF0ZU5hbWU6IGl0ZW0udGVtcGxhdGVOYW1lLFxuICAgIGRlc2NyaXB0aW9uOiBpdGVtLmRlc2NyaXB0aW9uLFxuICAgIGRpZmZpY3VsdHk6IGl0ZW0uZGlmZmljdWx0eSxcbiAgICB0ZXJyYWluOiBpdGVtLnRlcnJhaW4sXG4gICAgY2F0ZWdvcnk6IGl0ZW0uY2F0ZWdvcnksXG4gICAgdXNhZ2VDb3VudDogaXRlbS51c2FnZUNvdW50IHx8IDAsXG4gICAgdGFnczogaXRlbS50YWdzIHx8IFtdLFxuICAgIGNyZWF0ZWRBdDogaXRlbS5jcmVhdGVkQXQsXG4gICAgY3JlYXRlZEJ5OiBpdGVtLmNyZWF0ZWRCeSxcbiAgfSkpO1xuICBcbiAgLy8gR2VuZXJhdGUgbmV4dCBjdXJzb3JcbiAgbGV0IG5leHRDdXJzb3I6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgaWYgKHJlc3BvbnNlLkxhc3RFdmFsdWF0ZWRLZXkpIHtcbiAgICBuZXh0Q3Vyc29yID0gQnVmZmVyLmZyb20oSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UuTGFzdEV2YWx1YXRlZEtleSkpLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgfVxuICBcbiAgcmV0dXJuIHtcbiAgICB0ZW1wbGF0ZXMsXG4gICAgbmV4dEN1cnNvcixcbiAgICBoYXNNb3JlOiAhIXJlc3BvbnNlLkxhc3RFdmFsdWF0ZWRLZXksXG4gIH07XG59Il19