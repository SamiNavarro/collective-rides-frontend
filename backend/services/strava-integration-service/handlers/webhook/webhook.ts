import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { StravaWebhookEvent, StravaWebhookChallenge } from '../../../../shared/types/strava';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  
  if (method === 'GET') {
    // Handle subscription verification challenge
    return handleSubscriptionChallenge(event);
  } else if (method === 'POST') {
    // Handle webhook event
    return handleWebhookEvent(event);
  }
  
  return {
    statusCode: 405,
    body: JSON.stringify({
      success: false,
      error: 'Method not allowed'
    })
  };
};

async function handleSubscriptionChallenge(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const params = event.queryStringParameters;
  
  if (!params) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        success: false,
        error: 'Missing query parameters'
      })
    };
  }

  const mode = params['hub.mode'];
  const challenge = params['hub.challenge'];
  const verifyToken = params['hub.verify_token'];
  
  const expectedToken = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN;
  
  if (mode === 'subscribe' && verifyToken === expectedToken) {
    console.log('Strava webhook subscription verified');
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'hub.challenge': challenge
      })
    };
  }
  
  return {
    statusCode: 403,
    body: JSON.stringify({
      success: false,
      error: 'Forbidden'
    })
  };
}

async function handleWebhookEvent(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Verify webhook authenticity (implementation depends on Strava's verification method)
    if (!verifyWebhookSignature(event)) {
      return {
        statusCode: 403,
        body: JSON.stringify({
          success: false,
          error: 'Invalid webhook signature'
        })
      };
    }

    const webhookEvent: StravaWebhookEvent = JSON.parse(event.body || '{}');
    
    // Process webhook event asynchronously
    await processWebhookEvent(webhookEvent);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true
      })
    };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Webhook processing failed'
      })
    };
  }
}

function verifyWebhookSignature(event: APIGatewayProxyEvent): boolean {
  // Implementation depends on Strava's webhook verification mechanism
  // This is a placeholder that should be implemented based on Strava's documentation
  
  // For now, return true for development
  // In production, this should verify the webhook signature
  return true;
}

async function processWebhookEvent(webhookEvent: StravaWebhookEvent): Promise<void> {
  console.log('Processing Strava webhook event:', webhookEvent);
  
  // Only process activity events
  if (webhookEvent.object_type !== 'activity') {
    console.log('Ignoring non-activity webhook event');
    return;
  }
  
  // Handle different aspect types
  switch (webhookEvent.aspect_type) {
    case 'create':
      await handleActivityCreated(webhookEvent);
      break;
    case 'update':
      await handleActivityUpdated(webhookEvent);
      break;
    case 'delete':
      await handleActivityDeleted(webhookEvent);
      break;
    default:
      console.log(`Unhandled aspect type: ${webhookEvent.aspect_type}`);
  }
}

async function handleActivityCreated(webhookEvent: StravaWebhookEvent): Promise<void> {
  console.log(`Activity created: ${webhookEvent.object_id} by athlete ${webhookEvent.owner_id}`);
  
  // TODO: Implement activity ingestion and matching
  // 1. Fetch activity details from Strava API
  // 2. Store activity in our database
  // 3. Attempt to match with recent rides
  // 4. Update participation evidence if matched
}

async function handleActivityUpdated(webhookEvent: StravaWebhookEvent): Promise<void> {
  console.log(`Activity updated: ${webhookEvent.object_id}`);
  
  // TODO: Update stored activity data
  // Re-evaluate ride matching if relevant fields changed
}

async function handleActivityDeleted(webhookEvent: StravaWebhookEvent): Promise<void> {
  console.log(`Activity deleted: ${webhookEvent.object_id}`);
  
  // TODO: Remove activity from our database
  // Remove evidence links if this activity was used as evidence
}