"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const handler = async (event) => {
    try {
        // Get auth context
        const authContext = await (0, auth_context_1.getAuthContext)(event);
        const code = event.queryStringParameters?.code;
        const state = event.queryStringParameters?.state;
        if (!code || !state) {
            return (0, lambda_utils_1.createResponse)(400, {
                success: false,
                error: 'Missing code or state parameter'
            });
        }
        // Verify state parameter contains user ID
        const [stateId, userId] = state.split(':');
        if (userId !== authContext.userId) {
            return (0, lambda_utils_1.createResponse)(400, {
                success: false,
                error: 'Invalid state parameter'
            });
        }
        const clientId = process.env.STRAVA_CLIENT_ID;
        const clientSecret = process.env.STRAVA_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            return (0, lambda_utils_1.createResponse)(500, {
                success: false,
                error: 'Strava integration not configured'
            });
        }
        // Exchange code for access token
        const tokenResponse = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code'
            })
        });
        if (!tokenResponse.ok) {
            throw new Error(`Strava token exchange failed: ${tokenResponse.status}`);
        }
        const tokenData = await tokenResponse.json();
        // TODO: Store integration using repository
        // For now, just return success with athlete info
        return (0, lambda_utils_1.createResponse)(200, {
            success: true,
            data: {
                athleteId: tokenData.athlete.id.toString(),
                connectedAt: new Date().toISOString(),
                scopesGranted: ['read', 'activity:read']
            }
        });
    }
    catch (error) {
        console.error('Strava OAuth callback error:', error);
        return (0, lambda_utils_1.createResponse)(400, {
            success: false,
            error: error instanceof Error ? error.message : 'OAuth callback failed'
        });
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsbGJhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJjYWxsYmFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSx3RUFBdUU7QUFDdkUsdUVBQXNFO0FBRy9ELE1BQU0sT0FBTyxHQUFHLEtBQUssRUFDMUIsS0FBMkIsRUFDSyxFQUFFO0lBQ2xDLElBQUk7UUFDRixtQkFBbUI7UUFDbkIsTUFBTSxXQUFXLEdBQUcsTUFBTSxJQUFBLDZCQUFjLEVBQUMsS0FBSyxDQUFDLENBQUM7UUFFaEQsTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLHFCQUFxQixFQUFFLElBQUksQ0FBQztRQUMvQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMscUJBQXFCLEVBQUUsS0FBSyxDQUFDO1FBRWpELElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDbkIsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFO2dCQUN6QixPQUFPLEVBQUUsS0FBSztnQkFDZCxLQUFLLEVBQUUsaUNBQWlDO2FBQ3pDLENBQUMsQ0FBQztTQUNKO1FBRUQsMENBQTBDO1FBQzFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMzQyxJQUFJLE1BQU0sS0FBSyxXQUFXLENBQUMsTUFBTSxFQUFFO1lBQ2pDLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRTtnQkFDekIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLHlCQUF5QjthQUNqQyxDQUFDLENBQUM7U0FDSjtRQUVELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUM7UUFDOUMsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQztRQUV0RCxJQUFJLENBQUMsUUFBUSxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQzlCLE9BQU8sSUFBQSw2QkFBYyxFQUFDLEdBQUcsRUFBRTtnQkFDekIsT0FBTyxFQUFFLEtBQUs7Z0JBQ2QsS0FBSyxFQUFFLG1DQUFtQzthQUMzQyxDQUFDLENBQUM7U0FDSjtRQUVELGlDQUFpQztRQUNqQyxNQUFNLGFBQWEsR0FBRyxNQUFNLEtBQUssQ0FBQyxvQ0FBb0MsRUFBRTtZQUN0RSxNQUFNLEVBQUUsTUFBTTtZQUNkLE9BQU8sRUFBRTtnQkFDUCxjQUFjLEVBQUUsa0JBQWtCO2FBQ25DO1lBQ0QsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQ25CLFNBQVMsRUFBRSxRQUFRO2dCQUNuQixhQUFhLEVBQUUsWUFBWTtnQkFDM0IsSUFBSTtnQkFDSixVQUFVLEVBQUUsb0JBQW9CO2FBQ2pDLENBQUM7U0FDSCxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBRTtZQUNyQixNQUFNLElBQUksS0FBSyxDQUFDLGlDQUFpQyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztTQUMxRTtRQUVELE1BQU0sU0FBUyxHQUF3QixNQUFNLGFBQWEsQ0FBQyxJQUFJLEVBQXlCLENBQUM7UUFFekYsMkNBQTJDO1FBQzNDLGlEQUFpRDtRQUVqRCxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUU7WUFDekIsT0FBTyxFQUFFLElBQUk7WUFDYixJQUFJLEVBQUU7Z0JBQ0osU0FBUyxFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLFFBQVEsRUFBRTtnQkFDMUMsV0FBVyxFQUFFLElBQUksSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFFO2dCQUNyQyxhQUFhLEVBQUUsQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDO2FBQ3pDO1NBQ0YsQ0FBQyxDQUFDO0tBQ0o7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLE9BQU8sQ0FBQyxLQUFLLENBQUMsOEJBQThCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDckQsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFO1lBQ3pCLE9BQU8sRUFBRSxLQUFLO1lBQ2QsS0FBSyxFQUFFLEtBQUssWUFBWSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLHVCQUF1QjtTQUN4RSxDQUFDLENBQUM7S0FDSjtBQUNILENBQUMsQ0FBQztBQTFFVyxRQUFBLE9BQU8sV0EwRWxCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQVBJR2F0ZXdheVByb3h5RXZlbnQsIEFQSUdhdGV3YXlQcm94eVJlc3VsdCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgY3JlYXRlUmVzcG9uc2UgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdXRpbHMvbGFtYmRhLXV0aWxzJztcbmltcG9ydCB7IGdldEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL2F1dGgvYXV0aC1jb250ZXh0JztcbmltcG9ydCB7IFN0cmF2YUNhbGxiYWNrUmVxdWVzdCwgU3RyYXZhVG9rZW5SZXNwb25zZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9zdHJhdmEnO1xuXG5leHBvcnQgY29uc3QgaGFuZGxlciA9IGFzeW5jIChcbiAgZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50XG4pOiBQcm9taXNlPEFQSUdhdGV3YXlQcm94eVJlc3VsdD4gPT4ge1xuICB0cnkge1xuICAgIC8vIEdldCBhdXRoIGNvbnRleHRcbiAgICBjb25zdCBhdXRoQ29udGV4dCA9IGF3YWl0IGdldEF1dGhDb250ZXh0KGV2ZW50KTtcbiAgICBcbiAgICBjb25zdCBjb2RlID0gZXZlbnQucXVlcnlTdHJpbmdQYXJhbWV0ZXJzPy5jb2RlO1xuICAgIGNvbnN0IHN0YXRlID0gZXZlbnQucXVlcnlTdHJpbmdQYXJhbWV0ZXJzPy5zdGF0ZTtcbiAgICBcbiAgICBpZiAoIWNvZGUgfHwgIXN0YXRlKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNDAwLCB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogJ01pc3NpbmcgY29kZSBvciBzdGF0ZSBwYXJhbWV0ZXInXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBWZXJpZnkgc3RhdGUgcGFyYW1ldGVyIGNvbnRhaW5zIHVzZXIgSURcbiAgICBjb25zdCBbc3RhdGVJZCwgdXNlcklkXSA9IHN0YXRlLnNwbGl0KCc6Jyk7XG4gICAgaWYgKHVzZXJJZCAhPT0gYXV0aENvbnRleHQudXNlcklkKSB7XG4gICAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNDAwLCB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogJ0ludmFsaWQgc3RhdGUgcGFyYW1ldGVyJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgY2xpZW50SWQgPSBwcm9jZXNzLmVudi5TVFJBVkFfQ0xJRU5UX0lEO1xuICAgIGNvbnN0IGNsaWVudFNlY3JldCA9IHByb2Nlc3MuZW52LlNUUkFWQV9DTElFTlRfU0VDUkVUO1xuICAgIFxuICAgIGlmICghY2xpZW50SWQgfHwgIWNsaWVudFNlY3JldCkge1xuICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDUwMCwge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3I6ICdTdHJhdmEgaW50ZWdyYXRpb24gbm90IGNvbmZpZ3VyZWQnXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBFeGNoYW5nZSBjb2RlIGZvciBhY2Nlc3MgdG9rZW5cbiAgICBjb25zdCB0b2tlblJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vd3d3LnN0cmF2YS5jb20vb2F1dGgvdG9rZW4nLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgIGNsaWVudF9pZDogY2xpZW50SWQsXG4gICAgICAgIGNsaWVudF9zZWNyZXQ6IGNsaWVudFNlY3JldCxcbiAgICAgICAgY29kZSxcbiAgICAgICAgZ3JhbnRfdHlwZTogJ2F1dGhvcml6YXRpb25fY29kZSdcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICBpZiAoIXRva2VuUmVzcG9uc2Uub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgU3RyYXZhIHRva2VuIGV4Y2hhbmdlIGZhaWxlZDogJHt0b2tlblJlc3BvbnNlLnN0YXR1c31gKTtcbiAgICB9XG5cbiAgICBjb25zdCB0b2tlbkRhdGE6IFN0cmF2YVRva2VuUmVzcG9uc2UgPSBhd2FpdCB0b2tlblJlc3BvbnNlLmpzb24oKSBhcyBTdHJhdmFUb2tlblJlc3BvbnNlO1xuICAgIFxuICAgIC8vIFRPRE86IFN0b3JlIGludGVncmF0aW9uIHVzaW5nIHJlcG9zaXRvcnlcbiAgICAvLyBGb3Igbm93LCBqdXN0IHJldHVybiBzdWNjZXNzIHdpdGggYXRobGV0ZSBpbmZvXG4gICAgXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDIwMCwge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgYXRobGV0ZUlkOiB0b2tlbkRhdGEuYXRobGV0ZS5pZC50b1N0cmluZygpLFxuICAgICAgICBjb25uZWN0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgICBzY29wZXNHcmFudGVkOiBbJ3JlYWQnLCAnYWN0aXZpdHk6cmVhZCddXG4gICAgICB9XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignU3RyYXZhIE9BdXRoIGNhbGxiYWNrIGVycm9yOicsIGVycm9yKTtcbiAgICByZXR1cm4gY3JlYXRlUmVzcG9uc2UoNDAwLCB7XG4gICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgIGVycm9yOiBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6ICdPQXV0aCBjYWxsYmFjayBmYWlsZWQnXG4gICAgfSk7XG4gIH1cbn07Il19