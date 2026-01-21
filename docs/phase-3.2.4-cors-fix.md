# Phase 3.2.4 - CORS Fix for Vercel Deployment

## Issue
When accessing the club detail page on Vercel (`https://collective-rides-frontend.vercel.app`), the GET club API call was being blocked by CORS:

```
Access to fetch at 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/clubs/attaquercc' 
from origin 'https://collective-rides-frontend.vercel.app' has been blocked by CORS policy: 
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:3000' that is not equal to the supplied origin.
```

## Root Cause
The Lambda handlers were not passing the `origin` parameter to the response utility functions (`createSuccessResponse`, `handleLambdaError`). This caused the CORS headers to default to `http://localhost:3000` instead of dynamically matching the request origin.

The `lambda-utils.ts` file already had logic to handle Vercel deployments:
```typescript
// Check for Vercel preview deployments (*.vercel.app)
else if (origin.endsWith('.vercel.app') && origin.startsWith('https://')) {
  allowOrigin = origin;
}
```

But the handlers weren't passing the origin, so this logic never executed.

## Solution

### 1. Updated `get-club.ts` Handler
Modified the handler to extract and pass the origin from the request headers:

```typescript
// Success response
const origin = event.headers?.origin || event.headers?.Origin;
return createSuccessResponse(club, 200, origin);

// Error response
const origin = event.headers?.origin || event.headers?.Origin;
return handleLambdaError(error, requestId, origin);
```

### 2. Updated API Gateway CORS Config (Preventive)
Also updated `rest-api.ts` to explicitly include Vercel in development environment CORS origins (though this is handled at the Lambda level):

```typescript
allowOrigins: props.environment === 'production' 
  ? [
      'https://sydneycycles.com',
      'https://collective-rides-frontend.vercel.app',
      'https://collectiverides.com'
    ]
  : [
      'http://localhost:3000', 
      'http://127.0.0.1:3000',
      'https://collective-rides-frontend.vercel.app',
      'https://collective-rides-frontend-*.vercel.app' // Preview deployments
    ]
```

## Deployment
Deployed to AWS using:
```bash
cd backend && npm run deploy
```

Deployment completed successfully in 167.09s.

## Testing
After deployment, the club detail page should work correctly on Vercel:
- Visit: `https://collective-rides-frontend.vercel.app/clubs/attaquercc`
- Expected: Club details load without CORS errors
- Expected: Club name, description, and metadata display correctly

## Files Modified
- `backend/services/club-service/handlers/get-club.ts` - Added origin parameter passing
- `backend/infrastructure/lib/api-gateway/rest-api.ts` - Updated CORS config (preventive)

## Impact
This fix applies to the GET club endpoint. Other endpoints may need similar updates if they encounter CORS issues on Vercel. The pattern to follow:

```typescript
const origin = event.headers?.origin || event.headers?.Origin;
return createSuccessResponse(data, statusCode, origin);
```

## Status
✅ **DEPLOYED** - Backend updated and deployed to AWS development environment

## Next Steps
- Test on Vercel to confirm CORS fix works
- Monitor for CORS issues on other endpoints
- Apply same pattern to other handlers if needed
