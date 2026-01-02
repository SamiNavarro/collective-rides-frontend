"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lambda_utils_js_1 = require("../../../../shared/utils/lambda-utils.js");
const auth_context_js_1 = require("../../../../shared/auth/auth-context.js");
const dynamodb_ride_repository_js_1 = require("../../infrastructure/dynamodb-ride-repository.js");
const dynamodb_participation_repository_js_1 = require("../../infrastructure/dynamodb-participation-repository.js");
const participation_service_js_1 = require("../../domain/participation/participation-service.js");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const tableName = process.env.DYNAMODB_TABLE_NAME;
const rideRepository = new dynamodb_ride_repository_js_1.DynamoDBRideRepository(dynamoClient, tableName);
const participationRepository = new dynamodb_participation_repository_js_1.DynamoDBParticipationRepository(dynamoClient, tableName);
const participationService = new participation_service_js_1.ParticipationService(participationRepository, rideRepository);
const handler = async (event) => {
    try {
        // Get auth context
        const authContext = await (0, auth_context_js_1.getAuthContext)(event);
        // Parse query parameters
        const queryParams = event.queryStringParameters || {};
        const query = {
            status: queryParams.status,
            role: queryParams.role,
            limit: queryParams.limit ? parseInt(queryParams.limit) : 20,
            cursor: queryParams.cursor
        };
        // Validate limit
        if (query.limit && (query.limit < 1 || query.limit > 100)) {
            return (0, lambda_utils_js_1.createResponse)(400, { error: 'Limit must be between 1 and 100' });
        }
        // Get user's rides
        const result = await participationService.getUserRides(authContext.userId, query);
        return (0, lambda_utils_js_1.createResponse)(200, {
            success: true,
            data: result.rides,
            pagination: {
                limit: query.limit,
                nextCursor: result.nextCursor
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Get user rides error:', error);
        if (error.statusCode) {
            return (0, lambda_utils_js_1.createResponse)(error.statusCode, {
                error: error.message,
                errorType: error.errorType
            });
        }
        return (0, lambda_utils_js_1.createResponse)(500, { error: 'Internal server error' });
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2V0LXVzZXItcmlkZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJnZXQtdXNlci1yaWRlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSw4REFBMEQ7QUFDMUQsOEVBQTBFO0FBQzFFLDZFQUF5RTtBQUN6RSxrR0FBMEY7QUFDMUYsb0hBQTRHO0FBQzVHLGtHQUEyRjtBQUczRixNQUFNLFlBQVksR0FBRyxJQUFJLGdDQUFjLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDNUMsTUFBTSxTQUFTLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBb0IsQ0FBQztBQUNuRCxNQUFNLGNBQWMsR0FBRyxJQUFJLG9EQUFzQixDQUFDLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztBQUMzRSxNQUFNLHVCQUF1QixHQUFHLElBQUksc0VBQStCLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQzdGLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSwrQ0FBb0IsQ0FBQyx1QkFBdUIsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUV4RixNQUFNLE9BQU8sR0FBRyxLQUFLLEVBQUUsS0FBMkIsRUFBa0MsRUFBRTtJQUMzRixJQUFJO1FBQ0YsbUJBQW1CO1FBQ25CLE1BQU0sV0FBVyxHQUFHLE1BQU0sSUFBQSxnQ0FBYyxFQUFDLEtBQUssQ0FBQyxDQUFDO1FBRWhELHlCQUF5QjtRQUN6QixNQUFNLFdBQVcsR0FBRyxLQUFLLENBQUMscUJBQXFCLElBQUksRUFBRSxDQUFDO1FBQ3RELE1BQU0sS0FBSyxHQUF1QjtZQUNoQyxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQWE7WUFDakMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxJQUFnQjtZQUNsQyxLQUFLLEVBQUUsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUMzRCxNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07U0FDM0IsQ0FBQztRQUVGLGlCQUFpQjtRQUNqQixJQUFJLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxFQUFFO1lBQ3pELE9BQU8sSUFBQSxnQ0FBYyxFQUFDLEdBQUcsRUFBRSxFQUFFLEtBQUssRUFBRSxpQ0FBaUMsRUFBRSxDQUFDLENBQUM7U0FDMUU7UUFFRCxtQkFBbUI7UUFDbkIsTUFBTSxNQUFNLEdBQUcsTUFBTSxvQkFBb0IsQ0FBQyxZQUFZLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVsRixPQUFPLElBQUEsZ0NBQWMsRUFBQyxHQUFHLEVBQUU7WUFDekIsT0FBTyxFQUFFLElBQUk7WUFDYixJQUFJLEVBQUUsTUFBTSxDQUFDLEtBQUs7WUFDbEIsVUFBVSxFQUFFO2dCQUNWLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSztnQkFDbEIsVUFBVSxFQUFFLE1BQU0sQ0FBQyxVQUFVO2FBQzlCO1lBQ0QsU0FBUyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO1NBQ3BDLENBQUMsQ0FBQztLQUVKO0lBQUMsT0FBTyxLQUFVLEVBQUU7UUFDbkIsT0FBTyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUU5QyxJQUFJLEtBQUssQ0FBQyxVQUFVLEVBQUU7WUFDcEIsT0FBTyxJQUFBLGdDQUFjLEVBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRTtnQkFDdEMsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPO2dCQUNwQixTQUFTLEVBQUUsS0FBSyxDQUFDLFNBQVM7YUFDM0IsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxPQUFPLElBQUEsZ0NBQWMsRUFBQyxHQUFHLEVBQUUsRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsQ0FBQyxDQUFDO0tBQ2hFO0FBQ0gsQ0FBQyxDQUFDO0FBNUNXLFFBQUEsT0FBTyxXQTRDbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBEeW5hbW9EQkNsaWVudCB9IGZyb20gJ0Bhd3Mtc2RrL2NsaWVudC1keW5hbW9kYic7XG5pbXBvcnQgeyBjcmVhdGVSZXNwb25zZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9sYW1iZGEtdXRpbHMuanMnO1xuaW1wb3J0IHsgZ2V0QXV0aENvbnRleHQgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvYXV0aC9hdXRoLWNvbnRleHQuanMnO1xuaW1wb3J0IHsgRHluYW1vREJSaWRlUmVwb3NpdG9yeSB9IGZyb20gJy4uLy4uL2luZnJhc3RydWN0dXJlL2R5bmFtb2RiLXJpZGUtcmVwb3NpdG9yeS5qcyc7XG5pbXBvcnQgeyBEeW5hbW9EQlBhcnRpY2lwYXRpb25SZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vaW5mcmFzdHJ1Y3R1cmUvZHluYW1vZGItcGFydGljaXBhdGlvbi1yZXBvc2l0b3J5LmpzJztcbmltcG9ydCB7IFBhcnRpY2lwYXRpb25TZXJ2aWNlIH0gZnJvbSAnLi4vLi4vZG9tYWluL3BhcnRpY2lwYXRpb24vcGFydGljaXBhdGlvbi1zZXJ2aWNlLmpzJztcbmltcG9ydCB7IExpc3RVc2VyUmlkZXNRdWVyeSwgUmlkZVJvbGUgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvcGFydGljaXBhdGlvbi5qcyc7XG5cbmNvbnN0IGR5bmFtb0NsaWVudCA9IG5ldyBEeW5hbW9EQkNsaWVudCh7fSk7XG5jb25zdCB0YWJsZU5hbWUgPSBwcm9jZXNzLmVudi5EWU5BTU9EQl9UQUJMRV9OQU1FITtcbmNvbnN0IHJpZGVSZXBvc2l0b3J5ID0gbmV3IER5bmFtb0RCUmlkZVJlcG9zaXRvcnkoZHluYW1vQ2xpZW50LCB0YWJsZU5hbWUpO1xuY29uc3QgcGFydGljaXBhdGlvblJlcG9zaXRvcnkgPSBuZXcgRHluYW1vREJQYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeShkeW5hbW9DbGllbnQsIHRhYmxlTmFtZSk7XG5jb25zdCBwYXJ0aWNpcGF0aW9uU2VydmljZSA9IG5ldyBQYXJ0aWNpcGF0aW9uU2VydmljZShwYXJ0aWNpcGF0aW9uUmVwb3NpdG9yeSwgcmlkZVJlcG9zaXRvcnkpO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnQpOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICB0cnkge1xuICAgIC8vIEdldCBhdXRoIGNvbnRleHRcbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IGF3YWl0IGdldEF1dGhDb250ZXh0KGV2ZW50KTtcbiAgICBcbiAgICAvLyBQYXJzZSBxdWVyeSBwYXJhbWV0ZXJzXG4gICAgY29uc3QgcXVlcnlQYXJhbXMgPSBldmVudC5xdWVyeVN0cmluZ1BhcmFtZXRlcnMgfHwge307XG4gICAgY29uc3QgcXVlcnk6IExpc3RVc2VyUmlkZXNRdWVyeSA9IHtcbiAgICAgIHN0YXR1czogcXVlcnlQYXJhbXMuc3RhdHVzIGFzIGFueSxcbiAgICAgIHJvbGU6IHF1ZXJ5UGFyYW1zLnJvbGUgYXMgUmlkZVJvbGUsXG4gICAgICBsaW1pdDogcXVlcnlQYXJhbXMubGltaXQgPyBwYXJzZUludChxdWVyeVBhcmFtcy5saW1pdCkgOiAyMCxcbiAgICAgIGN1cnNvcjogcXVlcnlQYXJhbXMuY3Vyc29yXG4gICAgfTtcblxuICAgIC8vIFZhbGlkYXRlIGxpbWl0XG4gICAgaWYgKHF1ZXJ5LmxpbWl0ICYmIChxdWVyeS5saW1pdCA8IDEgfHwgcXVlcnkubGltaXQgPiAxMDApKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNDAwLCB7IGVycm9yOiAnTGltaXQgbXVzdCBiZSBiZXR3ZWVuIDEgYW5kIDEwMCcgfSk7XG4gICAgfVxuXG4gICAgLy8gR2V0IHVzZXIncyByaWRlc1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHBhcnRpY2lwYXRpb25TZXJ2aWNlLmdldFVzZXJSaWRlcyhhdXRoQ29udGV4dC51c2VySWQsIHF1ZXJ5KTtcblxuICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSgyMDAsIHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICBkYXRhOiByZXN1bHQucmlkZXMsXG4gICAgICBwYWdpbmF0aW9uOiB7XG4gICAgICAgIGxpbWl0OiBxdWVyeS5saW1pdCxcbiAgICAgICAgbmV4dEN1cnNvcjogcmVzdWx0Lm5leHRDdXJzb3JcbiAgICAgIH0sXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKVxuICAgIH0pO1xuXG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICBjb25zb2xlLmVycm9yKCdHZXQgdXNlciByaWRlcyBlcnJvcjonLCBlcnJvcik7XG4gICAgXG4gICAgaWYgKGVycm9yLnN0YXR1c0NvZGUpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZShlcnJvci5zdGF0dXNDb2RlLCB7IFxuICAgICAgICBlcnJvcjogZXJyb3IubWVzc2FnZSxcbiAgICAgICAgZXJyb3JUeXBlOiBlcnJvci5lcnJvclR5cGUgXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDUwMCwgeyBlcnJvcjogJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSk7XG4gIH1cbn07Il19