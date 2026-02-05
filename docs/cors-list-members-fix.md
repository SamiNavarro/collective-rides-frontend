# CORS Fix for List Members Endpoint

**Date**: February 6, 2026  
**Status**: ✅ Deployed

## Issue

The `/v1/clubs/{clubId}/members` endpoint was returning CORS errors when accessed from Vercel production:

```
Access-Control-Allow-Origin: http://localhost:3000
```

Instead of allowing the Vercel production origin (`https://collective-rides-frontend.vercel.app`).

## Root Cause

The `list-members.ts` Lambda handler wasn't extracting the origin header from the API Gateway event and passing it to the response utility functions (`createSuccessResponse()` and `handleLambdaError()`).

## Solution

Updated `backend/services/club-service/handlers/membership/list-members.ts`:

1. **Extract origin header** at the start of the handler:
   ```typescript
   const origin = event.headers?.origin || event.headers?.Origin;
   ```

2. **Pass origin to success response** (line ~127):
   ```typescript
   return createSuccessResponse(response, HttpStatusCode.OK, origin);
   ```

3. **Pass origin to error handler** (line ~136):
   ```typescript
   return handleLambdaError(error, requestId, origin);
   ```

4. **Add HttpStatusCode import**:
   ```typescript
   import { HttpStatusCode } from '../../../../shared/types/api';
   ```

## Deployment

Deployed to AWS using:
```bash
cd backend
npm run cdk deploy -- --require-approval never
```

Deployment completed successfully at 12:52 AM.

## Testing

Test on Vercel production by:
1. Log in as alice.admin@example.com (password: TestPassword123!)
2. Navigate to Attaquer CC club page
3. Click "Manage Club" button
4. View the "Members" tab - should load without CORS errors

## Related Files

- `backend/services/club-service/handlers/membership/list-members.ts` - Fixed handler
- `backend/shared/utils/lambda-utils.ts` - Response utility functions
- `backend/deploy-list-members-cors-fix.log` - Deployment log
