# Phase 3.2.3 - CORS Error Handler Fix

## Issue

The leave club functionality was failing on Vercel with a CORS error:

```
Access to fetch at 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/clubs/club_mjejtvrx_p7ywgx/members/me' 
from origin 'https://collective-rides-frontend.vercel.app' has been blocked by CORS policy: 
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:3000' that is not equal to the supplied origin.
```

## Root Cause

The `handleLambdaError()` function in `backend/shared/utils/lambda-utils.ts` was not accepting an `origin` parameter. When errors occurred, it would call error response functions without passing the origin, causing them to default to `localhost:3000`.

## Solution

### 1. Updated Error Response Functions

Added `origin` parameter to all error response functions:

- `createValidationErrorResponse(message, requestId, origin)`
- `createUnauthorizedResponse(message, requestId, origin)`
- `createForbiddenResponse(message, requestId, origin)`
- `createNotFoundResponse(message, requestId, origin)`
- `createInternalErrorResponse(message, requestId, origin)`
- `handleLambdaError(error, requestId, origin)`

### 2. Updated Handlers

Updated all club-service handlers to extract origin and pass it to error handlers:

**Files Updated:**
- `backend/services/club-service/handlers/membership/leave-club.ts`
- `backend/services/club-service/handlers/membership/join-club.ts`
- `backend/services/club-service/handlers/user/get-user-clubs.ts`
- `backend/services/club-service/handlers/list-clubs.ts`

**Pattern:**
```typescript
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const requestId = event.requestContext.requestId;
  const origin = event.headers.origin || event.headers.Origin; // Extract origin
  
  try {
    // ... handler logic ...
    return createSuccessResponse(data, statusCode, origin); // Pass origin
  } catch (error) {
    return handleLambdaError(error, requestId, origin); // Pass origin to error handler
  }
}
```

### 3. Fixed Join Club Response

The join-club handler was manually constructing the response instead of using `createSuccessResponse()`. Updated to use the utility function for consistent CORS handling:

```typescript
// Before
return {
  statusCode: membership.status === 'active' ? 201 : 202,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  },
  body: JSON.stringify(response),
};

// After
return createSuccessResponse(response.data, membership.status === 'active' ? 201 : 202, origin);
```

## Testing

### Backend Deployment

```bash
cd backend
npm run deploy
```

Deployment completed successfully in ~135 seconds.

### Test Script

Created `scripts/test-cors-fix-vercel.js` to verify CORS headers:

```bash
# Get token from Vercel app (browser console: localStorage.getItem("accessToken"))
TOKEN="your-token" node scripts/test-cors-fix-vercel.js
```

The script tests:
1. GET /v1/users/me/clubs with Vercel origin
2. DELETE /v1/clubs/{id}/members/me with Vercel origin
3. Verifies `Access-Control-Allow-Origin` header matches Vercel origin

## Expected Behavior

After this fix:

1. **Success responses** return correct origin (already working)
2. **Error responses** now also return correct origin (fixed)
3. Leave club works on Vercel without CORS errors
4. All API calls from Vercel receive proper CORS headers

## Verification Steps

1. Go to https://collective-rides-frontend.vercel.app
2. Login with testuser2@test.com / TestPassword123!
3. Navigate to "My Clubs"
4. Click "Leave Club" on any club
5. Verify:
   - No CORS errors in console
   - Club disappears from list
   - Success message appears

## Files Changed

### Backend
- `backend/shared/utils/lambda-utils.ts` - Added origin parameter to all error functions
- `backend/services/club-service/handlers/membership/leave-club.ts` - Pass origin to error handler
- `backend/services/club-service/handlers/membership/join-club.ts` - Use createSuccessResponse, pass origin
- `backend/services/club-service/handlers/user/get-user-clubs.ts` - Pass origin to error handler
- `backend/services/club-service/handlers/list-clubs.ts` - Pass origin to error handler

### Testing
- `scripts/test-cors-fix-vercel.js` - New test script for CORS verification

## Status

✅ Backend deployed
✅ CORS fix implemented
⏳ Awaiting Vercel testing with real user token

## Next Steps

1. Test on Vercel with user token
2. Verify leave club works without CORS errors
3. If successful, mark Phase 3.2.3 as complete
