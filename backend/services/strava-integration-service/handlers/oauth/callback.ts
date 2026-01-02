import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createResponse } from '../../../../shared/utils/lambda-utils';
import { getAuthContext } from '../../../../shared/auth/auth-context';
import { StravaCallbackRequest, StravaTokenResponse } from '../../../../shared/types/strava';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Get auth context
    const authContext = await getAuthContext(event);
    
    const code = event.queryStringParameters?.code;
    const state = event.queryStringParameters?.state;
    
    if (!code || !state) {
      return createResponse(400, {
        success: false,
        error: 'Missing code or state parameter'
      });
    }

    // Verify state parameter contains user ID
    const [stateId, userId] = state.split(':');
    if (userId !== authContext.userId) {
      return createResponse(400, {
        success: false,
        error: 'Invalid state parameter'
      });
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return createResponse(500, {
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

    const tokenData: StravaTokenResponse = await tokenResponse.json() as StravaTokenResponse;
    
    // TODO: Store integration using repository
    // For now, just return success with athlete info
    
    return createResponse(200, {
      success: true,
      data: {
        athleteId: tokenData.athlete.id.toString(),
        connectedAt: new Date().toISOString(),
        scopesGranted: ['read', 'activity:read']
      }
    });
  } catch (error) {
    console.error('Strava OAuth callback error:', error);
    return createResponse(400, {
      success: false,
      error: error instanceof Error ? error.message : 'OAuth callback failed'
    });
  }
};