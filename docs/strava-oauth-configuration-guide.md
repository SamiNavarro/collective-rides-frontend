# Strava OAuth Configuration Guide

## Overview

This guide provides step-by-step instructions for configuring the Strava Developer Application with the correct OAuth settings for the Collective Rides application.

**Last Updated**: January 2, 2026  
**Version**: 1.0  
**Status**: Ready for Configuration

## Prerequisites

- ✅ Frontend deployed to Vercel
- ✅ Backend deployed to AWS with Strava integration
- ✅ Strava developer account created
- ✅ Production URLs available

## Strava Developer Application Setup

### Step 1: Access Strava Developer Console

1. **Navigate to**: [https://developers.strava.com/](https://developers.strava.com/)
2. **Sign in** with your Strava account
3. **Click**: "Create & Manage Your App"

### Step 2: Create New Application

1. **Click**: "Create New App" or "My API Application"
2. **Fill in Application Details**:

#### Application Information
```
Application Name: Collective Rides
Category: Cycling
Club: [Leave blank or select your cycling club]
Website: https://collective-rides-frontend.vercel.app
Description: Sydney cycling platform for club management, ride organization, and community building. Connect your Strava activities to automatically track ride participation and build evidence for club rides.
```

#### Application Icon
- Upload a logo/icon for your application (optional)
- Recommended size: 512x512 pixels
- Format: PNG or JPG

### Step 3: Configure OAuth Settings

#### Authorization Callback Domain
```
collective-rides-frontend.vercel.app
```

#### Authorization Callback URL
```
https://collective-rides-frontend.vercel.app/auth/strava/callback
```

**Important Notes**:
- ⚠️ **No trailing slash** in the callback URL
- ⚠️ **Must use HTTPS** (not HTTP)
- ⚠️ **Domain must match** your Vercel deployment exactly

### Step 4: Webhook Configuration

#### Webhook Endpoint URL
```
https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/integrations/strava/webhook
```

#### Webhook Verification
1. **Verify Token**: Create a secure random string (e.g., `strava_webhook_verify_2026`)
2. **Store Token**: Add to backend environment variables
3. **Test Endpoint**: Strava will send a verification challenge

## Backend Configuration

### Environment Variables Required

Add these to your backend deployment (AWS Systems Manager Parameter Store or environment variables):

```bash
# Strava OAuth Configuration
STRAVA_CLIENT_ID=[from-strava-developer-console]
STRAVA_CLIENT_SECRET=[from-strava-developer-console]
STRAVA_REDIRECT_URI=https://collective-rides-frontend.vercel.app/auth/strava/callback
STRAVA_WEBHOOK_VERIFY_TOKEN=[your-secure-random-token]
```

### API Endpoints Verification

Your backend provides these endpoints for Strava integration:

#### OAuth Flow Endpoints
| Endpoint | Method | Purpose | URL |
|----------|--------|---------|-----|
| **Connect** | GET | Initiate OAuth flow | `https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/integrations/strava/connect` |
| **Callback** | GET | Handle OAuth callback | `https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/integrations/strava/callback` |

#### Webhook Endpoints
| Endpoint | Method | Purpose | URL |
|----------|--------|---------|-----|
| **Webhook** | GET | Subscription verification | `https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/integrations/strava/webhook` |
| **Webhook** | POST | Activity events | `https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/integrations/strava/webhook` |

## Frontend Configuration

### Environment Variables Required

Add to Vercel environment variables:

```bash
# Strava Integration
NEXT_PUBLIC_STRAVA_CLIENT_ID=[from-strava-developer-console]
```

### OAuth Flow Implementation

The frontend needs to implement the OAuth flow. Here's the basic structure:

#### 1. Initiate OAuth Flow
```typescript
// Example: /auth/strava/connect
const initiateStravaAuth = () => {
  const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
  const redirectUri = 'https://collective-rides-frontend.vercel.app/auth/strava/callback';
  const scope = 'read,activity:read';
  const state = `${Date.now()}:${userId}`; // Include user ID for security
  
  const authUrl = `https://www.strava.com/oauth/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `approval_prompt=force&` +
    `scope=${scope}&` +
    `state=${state}`;
  
  window.location.href = authUrl;
};
```

#### 2. Handle OAuth Callback
```typescript
// Example: /auth/strava/callback page
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function StravaCallback() {
  const router = useRouter();
  
  useEffect(() => {
    const { code, state, error } = router.query;
    
    if (error) {
      // Handle OAuth error
      console.error('Strava OAuth error:', error);
      router.push('/settings?error=strava_auth_failed');
      return;
    }
    
    if (code && state) {
      // Send to backend for token exchange
      handleTokenExchange(code as string, state as string);
    }
  }, [router.query]);
  
  const handleTokenExchange = async (code: string, state: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/integrations/strava/callback?code=${code}&state=${state}`,
        {
          headers: {
            'Authorization': `Bearer ${userToken}`,
          },
        }
      );
      
      if (response.ok) {
        router.push('/settings?success=strava_connected');
      } else {
        router.push('/settings?error=strava_connection_failed');
      }
    } catch (error) {
      console.error('Token exchange error:', error);
      router.push('/settings?error=strava_connection_failed');
    }
  };
  
  return <div>Connecting to Strava...</div>;
}
```

## Testing the Configuration

### 1. Test Webhook Endpoint

```bash
# Test webhook verification (should return 403 with wrong token)
curl -X GET "https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/integrations/strava/webhook?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=wrong_token"

# Expected response: {"success":false,"error":"Forbidden"}
```

### 2. Test OAuth Flow

1. **Navigate to**: Your frontend application
2. **Click**: "Connect to Strava" button
3. **Verify**: Redirected to Strava authorization page
4. **Authorize**: Grant permissions to your application
5. **Verify**: Redirected back to your callback URL
6. **Check**: Backend receives and processes the authorization code

### 3. Validate Webhook Subscription

After configuring in Strava Developer Console:
1. **Strava sends**: GET request to webhook endpoint with verification challenge
2. **Backend responds**: With the challenge value if verification token matches
3. **Strava confirms**: Webhook subscription is active

## Security Considerations

### OAuth Security
- **State Parameter**: Always include user ID in state for CSRF protection
- **HTTPS Only**: Never use HTTP for OAuth callbacks
- **Token Storage**: Store access tokens securely (encrypted in database)
- **Scope Limitation**: Only request necessary permissions

### Webhook Security
- **Verification Token**: Use a strong, random verification token
- **Signature Validation**: Implement webhook signature verification (if provided by Strava)
- **Rate Limiting**: Implement rate limiting on webhook endpoint
- **Error Handling**: Graceful error handling for malformed requests

### Environment Variables
- **Client Secret**: Never expose client secret in frontend code
- **Secure Storage**: Use AWS Systems Manager Parameter Store for secrets
- **Environment Separation**: Different credentials for dev/staging/production

## Troubleshooting

### Common Issues

#### 1. OAuth Callback Errors
**Problem**: "redirect_uri_mismatch" error
**Solution**: 
- Verify callback URL exactly matches Strava configuration
- Check for trailing slashes, HTTP vs HTTPS
- Ensure domain matches your Vercel deployment

#### 2. Webhook Verification Fails
**Problem**: Webhook subscription fails verification
**Solution**:
- Check webhook endpoint is accessible
- Verify verification token matches
- Check backend logs for errors

#### 3. CORS Errors
**Problem**: Frontend can't call backend OAuth endpoints
**Solution**:
- Verify Vercel URL is in backend CORS configuration
- Check API Gateway CORS settings
- Ensure preflight requests are handled

#### 4. Token Exchange Fails
**Problem**: Authorization code exchange fails
**Solution**:
- Verify client ID and secret are correct
- Check authorization code hasn't expired
- Validate state parameter matches

### Debug Commands

```bash
# Test API Gateway health
curl https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/health

# Test webhook endpoint accessibility
curl -I https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/integrations/strava/webhook

# Check CORS headers
curl -H "Origin: https://collective-rides-frontend.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization" \
     -X OPTIONS \
     https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/integrations/strava/connect
```

## Configuration Checklist

### Strava Developer Console
- [ ] Application created with correct name and description
- [ ] Website URL set to Vercel deployment
- [ ] Authorization callback domain configured
- [ ] Authorization callback URL configured (no trailing slash)
- [ ] Webhook endpoint URL configured
- [ ] Webhook verification token set

### Backend Configuration
- [ ] STRAVA_CLIENT_ID environment variable set
- [ ] STRAVA_CLIENT_SECRET environment variable set
- [ ] STRAVA_REDIRECT_URI environment variable set
- [ ] STRAVA_WEBHOOK_VERIFY_TOKEN environment variable set
- [ ] API endpoints accessible and responding
- [ ] CORS configured for frontend domain

### Frontend Configuration
- [ ] NEXT_PUBLIC_STRAVA_CLIENT_ID environment variable set
- [ ] OAuth initiation flow implemented
- [ ] Callback page created and functional
- [ ] Error handling implemented
- [ ] User feedback for connection status

### Testing
- [ ] Webhook endpoint responds to verification
- [ ] OAuth flow redirects correctly
- [ ] Token exchange completes successfully
- [ ] Error scenarios handled gracefully
- [ ] User experience is smooth and intuitive

## Next Steps

After successful configuration:

1. **Implement Frontend OAuth Flow**: Create the Strava connection UI
2. **Test End-to-End Flow**: Complete OAuth flow from frontend to backend
3. **Implement Activity Matching**: Connect Strava activities to ride participation
4. **Set Up Monitoring**: Monitor OAuth success rates and webhook events
5. **User Documentation**: Create user guide for connecting Strava accounts

## Support Resources

### Strava Developer Documentation
- [Strava API Documentation](https://developers.strava.com/docs/)
- [OAuth 2.0 Flow](https://developers.strava.com/docs/authentication/)
- [Webhook Events](https://developers.strava.com/docs/webhooks/)

### Internal Documentation
- [Backend Strava Integration Guide](../backend/docs/phase-2.5-strava-integration-guide.md)
- [Frontend Deployment Guide](./frontend-deployment-guide.md)
- [API Gateway Configuration](../backend/infrastructure/lib/api-gateway/rest-api.ts)

---

**Document Version**: 1.0  
**Last Updated**: January 2, 2026  
**Next Review**: February 2, 2026  
**Maintained By**: Development Team