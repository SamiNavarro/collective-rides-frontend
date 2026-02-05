# CORS Fix for Create Ride Endpoint

**Date**: February 6, 2026  
**Issue**: CORS error when creating rides from Vercel production  
**Status**: ✅ Fixed and Deployed

## Problem

When trying to create a ride from the Vercel production site (`https://collective-rides-frontend.vercel.app`), the request was blocked by CORS policy:

```
Access to fetch at 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/clubs/attaquercc/rides' 
from origin 'https://collective-rides-frontend.vercel.app' has been blocked by CORS policy: 
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:3000' that is not equal to the supplied origin.
```

## Root Cause

The `create-ride.ts` Lambda handler was not extracting the `origin` header from the API Gateway event and passing it to the `createResponse()` utility function. This meant all responses defaulted to allowing only `http://localhost:3000`.

## Solution

Updated `backend/services/ride-service/handlers/ride/create-ride.ts` to:

1. Extract the origin header at the start of the handler:
```typescript
const origin = event.headers?.origin || event.headers?.Origin;
```

2. Pass the origin to all `createResponse()` calls:
```typescript
return createResponse(201, { success: true, data: ride.toJSON() }, origin);
return createResponse(400, { error: 'Club ID is required' }, origin);
return createResponse(403, { error: 'Insufficient privileges' }, origin);
return createResponse(500, { error: 'Internal server error' }, origin);
```

## Files Changed

- `backend/services/ride-service/handlers/ride/create-ride.ts`

## Deployment

Deployed to AWS using CDK:
```bash
cd backend
npm run cdk deploy -- --require-approval never
```

**Deployment Log**: `backend/deploy-create-ride-cors-fix.log`

## Verification

The create ride endpoint now properly returns CORS headers that match the requesting origin, allowing both:
- `http://localhost:3000` (development)
- `https://collective-rides-frontend.vercel.app` (production)

## Related Issues

This is the same CORS issue we fixed previously for:
- `list-rides.ts` handler (GET requests)

## Pattern for Future Handlers

All Lambda handlers should follow this pattern:

```typescript
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // Extract origin at the start
  const origin = event.headers?.origin || event.headers?.Origin;
  
  try {
    // ... handler logic ...
    
    // Pass origin to all responses
    return createResponse(200, { data }, origin);
  } catch (error) {
    return createResponse(500, { error: 'Internal server error' }, origin);
  }
};
```

## Next Steps

If other endpoints experience CORS issues, apply the same fix:
1. Extract origin header
2. Pass it to all `createResponse()` calls
