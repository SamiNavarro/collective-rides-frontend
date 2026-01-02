"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const auth_context_1 = require("../../../../shared/auth/auth-context");
const id_generator_1 = require("../../../../shared/utils/id-generator");
const handler = async (event) => {
    try {
        // Get auth context
        const authContext = await (0, auth_context_1.getAuthContext)(event);
        const clientId = process.env.STRAVA_CLIENT_ID;
        const redirectUri = process.env.STRAVA_REDIRECT_URI;
        if (!clientId || !redirectUri) {
            return (0, lambda_utils_1.createResponse)(500, {
                success: false,
                error: 'Strava integration not configured'
            });
        }
        // Generate secure state parameter
        const state = (0, id_generator_1.generateId)('strava_state');
        // Store state in session/cache for verification (implementation depends on session management)
        // For now, we'll include the user ID in the state for verification
        const secureState = `${state}:${authContext.userId}`;
        const authUrl = new URL('https://www.strava.com/oauth/authorize');
        authUrl.searchParams.set('client_id', clientId);
        authUrl.searchParams.set('redirect_uri', redirectUri);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('scope', 'read,activity:read');
        authUrl.searchParams.set('state', secureState);
        const response = {
            authUrl: authUrl.toString(),
            state: secureState
        };
        return (0, lambda_utils_1.createResponse)(200, {
            success: true,
            data: response
        });
    }
    catch (error) {
        console.error('Strava connect error:', error);
        return (0, lambda_utils_1.createResponse)(500, {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate Strava connect URL'
        });
    }
};
exports.handler = handler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNvbm5lY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0Esd0VBQXVFO0FBQ3ZFLHVFQUFzRTtBQUV0RSx3RUFBbUU7QUFFNUQsTUFBTSxPQUFPLEdBQUcsS0FBSyxFQUMxQixLQUEyQixFQUNLLEVBQUU7SUFDbEMsSUFBSTtRQUNGLG1CQUFtQjtRQUNuQixNQUFNLFdBQVcsR0FBRyxNQUFNLElBQUEsNkJBQWMsRUFBQyxLQUFLLENBQUMsQ0FBQztRQUVoRCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDO1FBQzlDLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUM7UUFFcEQsSUFBSSxDQUFDLFFBQVEsSUFBSSxDQUFDLFdBQVcsRUFBRTtZQUM3QixPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUU7Z0JBQ3pCLE9BQU8sRUFBRSxLQUFLO2dCQUNkLEtBQUssRUFBRSxtQ0FBbUM7YUFDM0MsQ0FBQyxDQUFDO1NBQ0o7UUFFRCxrQ0FBa0M7UUFDbEMsTUFBTSxLQUFLLEdBQUcsSUFBQSx5QkFBVSxFQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRXpDLCtGQUErRjtRQUMvRixtRUFBbUU7UUFDbkUsTUFBTSxXQUFXLEdBQUcsR0FBRyxLQUFLLElBQUksV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBRXJELE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLHdDQUF3QyxDQUFDLENBQUM7UUFDbEUsT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ2hELE9BQU8sQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUN0RCxPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDbEQsT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDeEQsT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRS9DLE1BQU0sUUFBUSxHQUEwQjtZQUN0QyxPQUFPLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRTtZQUMzQixLQUFLLEVBQUUsV0FBVztTQUNuQixDQUFDO1FBRUYsT0FBTyxJQUFBLDZCQUFjLEVBQUMsR0FBRyxFQUFFO1lBQ3pCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsSUFBSSxFQUFFLFFBQVE7U0FDZixDQUFDLENBQUM7S0FDSjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsT0FBTyxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM5QyxPQUFPLElBQUEsNkJBQWMsRUFBQyxHQUFHLEVBQUU7WUFDekIsT0FBTyxFQUFFLEtBQUs7WUFDZCxLQUFLLEVBQUUsS0FBSyxZQUFZLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsdUNBQXVDO1NBQ3hGLENBQUMsQ0FBQztLQUNKO0FBQ0gsQ0FBQyxDQUFDO0FBL0NXLFFBQUEsT0FBTyxXQStDbEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCwgQVBJR2F0ZXdheVByb3h5UmVzdWx0IH0gZnJvbSAnYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBjcmVhdGVSZXNwb25zZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9sYW1iZGEtdXRpbHMnO1xuaW1wb3J0IHsgZ2V0QXV0aENvbnRleHQgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvYXV0aC9hdXRoLWNvbnRleHQnO1xuaW1wb3J0IHsgU3RyYXZhQ29ubmVjdFJlc3BvbnNlIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL3N0cmF2YSc7XG5pbXBvcnQgeyBnZW5lcmF0ZUlkIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2lkLWdlbmVyYXRvcic7XG5cbmV4cG9ydCBjb25zdCBoYW5kbGVyID0gYXN5bmMgKFxuICBldmVudDogQVBJR2F0ZXdheVByb3h5RXZlbnRcbik6IFByb21pc2U8QVBJR2F0ZXdheVByb3h5UmVzdWx0PiA9PiB7XG4gIHRyeSB7XG4gICAgLy8gR2V0IGF1dGggY29udGV4dFxuICAgIGNvbnN0IGF1dGhDb250ZXh0ID0gYXdhaXQgZ2V0QXV0aENvbnRleHQoZXZlbnQpO1xuICAgIFxuICAgIGNvbnN0IGNsaWVudElkID0gcHJvY2Vzcy5lbnYuU1RSQVZBX0NMSUVOVF9JRDtcbiAgICBjb25zdCByZWRpcmVjdFVyaSA9IHByb2Nlc3MuZW52LlNUUkFWQV9SRURJUkVDVF9VUkk7XG4gICAgXG4gICAgaWYgKCFjbGllbnRJZCB8fCAhcmVkaXJlY3RVcmkpIHtcbiAgICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg1MDAsIHtcbiAgICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAgIGVycm9yOiAnU3RyYXZhIGludGVncmF0aW9uIG5vdCBjb25maWd1cmVkJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gR2VuZXJhdGUgc2VjdXJlIHN0YXRlIHBhcmFtZXRlclxuICAgIGNvbnN0IHN0YXRlID0gZ2VuZXJhdGVJZCgnc3RyYXZhX3N0YXRlJyk7XG4gICAgXG4gICAgLy8gU3RvcmUgc3RhdGUgaW4gc2Vzc2lvbi9jYWNoZSBmb3IgdmVyaWZpY2F0aW9uIChpbXBsZW1lbnRhdGlvbiBkZXBlbmRzIG9uIHNlc3Npb24gbWFuYWdlbWVudClcbiAgICAvLyBGb3Igbm93LCB3ZSdsbCBpbmNsdWRlIHRoZSB1c2VyIElEIGluIHRoZSBzdGF0ZSBmb3IgdmVyaWZpY2F0aW9uXG4gICAgY29uc3Qgc2VjdXJlU3RhdGUgPSBgJHtzdGF0ZX06JHthdXRoQ29udGV4dC51c2VySWR9YDtcbiAgICBcbiAgICBjb25zdCBhdXRoVXJsID0gbmV3IFVSTCgnaHR0cHM6Ly93d3cuc3RyYXZhLmNvbS9vYXV0aC9hdXRob3JpemUnKTtcbiAgICBhdXRoVXJsLnNlYXJjaFBhcmFtcy5zZXQoJ2NsaWVudF9pZCcsIGNsaWVudElkKTtcbiAgICBhdXRoVXJsLnNlYXJjaFBhcmFtcy5zZXQoJ3JlZGlyZWN0X3VyaScsIHJlZGlyZWN0VXJpKTtcbiAgICBhdXRoVXJsLnNlYXJjaFBhcmFtcy5zZXQoJ3Jlc3BvbnNlX3R5cGUnLCAnY29kZScpO1xuICAgIGF1dGhVcmwuc2VhcmNoUGFyYW1zLnNldCgnc2NvcGUnLCAncmVhZCxhY3Rpdml0eTpyZWFkJyk7XG4gICAgYXV0aFVybC5zZWFyY2hQYXJhbXMuc2V0KCdzdGF0ZScsIHNlY3VyZVN0YXRlKTtcblxuICAgIGNvbnN0IHJlc3BvbnNlOiBTdHJhdmFDb25uZWN0UmVzcG9uc2UgPSB7XG4gICAgICBhdXRoVXJsOiBhdXRoVXJsLnRvU3RyaW5nKCksXG4gICAgICBzdGF0ZTogc2VjdXJlU3RhdGVcbiAgICB9O1xuXG4gICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlKDIwMCwge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIGRhdGE6IHJlc3BvbnNlXG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignU3RyYXZhIGNvbm5lY3QgZXJyb3I6JywgZXJyb3IpO1xuICAgIHJldHVybiBjcmVhdGVSZXNwb25zZSg1MDAsIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3I6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ0ZhaWxlZCB0byBnZW5lcmF0ZSBTdHJhdmEgY29ubmVjdCBVUkwnXG4gICAgfSk7XG4gIH1cbn07Il19