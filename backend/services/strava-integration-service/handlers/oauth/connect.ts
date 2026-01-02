import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse } from '../../../../shared/utils/lambda-utils';
import { getAuthContext } from '../../../../shared/auth/auth-context';
import { StravaConnectResponse } from '../../../../shared/types/strava';
import { generateId } from '../../../../shared/utils/id-generator';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get auth context
    const authContext = await getAuthContext(event);
    
    const clientId = process.env.STRAVA_CLIENT_ID;
    const redirectUri = process.env.STRAVA_REDIRECT_URI;
    
    if (!clientId || !redirectUri) {
      return createResponse(500, {
        success: false,
        error: 'Strava integration not configured'
      });
    }

    // Generate secure state parameter
    const state = generateId('strava_state');
    
    // Store state in session/cache for verification (implementation depends on session management)
    // For now, we'll include the user ID in the state for verification
    const secureState = `${state}:${authContext.userId}`;
    
    const authUrl = new URL('https://www.strava.com/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'read,activity:read');
    authUrl.searchParams.set('state', secureState);

    const response: StravaConnectResponse = {
      authUrl: authUrl.toString(),
      state: secureState
    };

    return createResponse(200, {
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Strava connect error:', error);
    return createResponse(500, {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate Strava connect URL'
    });
  }
};