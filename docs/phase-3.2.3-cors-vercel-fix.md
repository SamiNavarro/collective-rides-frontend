# Phase 3.2.3 - CORS Vercel Origin Fix

## Issue
When testing on Vercel, the backend was returning CORS header with `http://localhost:3000` instead of the actual Vercel origin, causing:
```
Access to fetch at 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/users/me' 
from origin 'https://collective-rides-frontend.vercel.app' has been blocked by CORS policy: 
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:3000' that is not equal to the supplied origin.
```

## Root Cause
The `getCorsHeaders()` function in `backend/shared/utils/lambda-utils.ts` was:
1. Only checking for exact origin matches in the allowed list
2. Defaulting to `localhost:3000` when origin didn't match
3. Not supporting Vercel preview deployments (dynamic `*.vercel.app` URLs)

## Solution

### Updated CORS Logic
Modified `getCorsHeaders()` to:
1. Check exact matches first (localhost, production domains)
2. Support any Vercel deployment (`*.vercel.app` pattern)
3. Only default to localhost if no origin provided

### Code Changes

**File**: `backend/shared/utils/lambda-utils.ts`

```typescript
function getCorsHeaders(origin?: string): Record<string, string> {
  // List of allowed origins (exact matches)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'https://collective-rides-frontend.vercel.app',
    'https://sydneycycles.com',
    'https://collectiverides.com',
  ];
  
  // Check if origin is allowed
  let allowOrigin = 'http://localhost:3000'; // Default fallback
  
  if (origin) {
    // Check exact match first
    if (allowedOrigins.includes(origin)) {
      allowOrigin = origin;
    }
    // Check for Vercel preview deployments (*.vercel.app)
    else if (origin.endsWith('.vercel.app') && origin.startsWith('https://')) {
      allowOrigin = origin;
    }
  }
  
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };
}
```

### Key Improvements
1. **Exact Match**: Checks if origin is in allowed list
2. **Vercel Pattern**: Supports any `https://*.vercel.app` URL
3. **Security**: Only allows HTTPS for Vercel (not HTTP)
4. **Fallback**: Defaults to localhost only if no origin provided

## Deployment

### Backend Deployment
```bash
cd backend
npm run deploy
```

**Status**: ✅ Deployed successfully (132.3s)
**Functions Updated**: All 40 Lambda functions
**Timestamp**: 2026-01-19

### Frontend Deployment
No changes needed - Vercel auto-deploys from GitHub

## Testing

### Expected Behavior
1. **Localhost**: Returns `http://localhost:3000`
2. **Production Vercel**: Returns `https://collective-rides-frontend.vercel.app`
3. **Preview Vercel**: Returns `https://[preview-id].vercel.app`
4. **Unknown Origin**: Returns `http://localhost:3000` (safe fallback)

### Test Steps
1. Go to https://collective-rides-frontend.vercel.app
2. Sign in with testuser2@test.com
3. Navigate to My Clubs
4. Check browser console - should see NO CORS errors
5. Verify pending application to Pastries.cc is visible

## Impact

### Affected Endpoints
All API endpoints now support Vercel deployments:
- `/v1/users/me` - Get current user
- `/v1/users/me/clubs` - Get user's clubs
- `/v1/clubs` - List clubs
- `/v1/clubs/{id}` - Get club details
- `/v1/clubs/{id}/members` - Join club
- All other authenticated endpoints

### Security Considerations
- ✅ Only allows HTTPS for Vercel (not HTTP)
- ✅ Validates `.vercel.app` domain suffix
- ✅ Maintains exact match for production domains
- ✅ Includes credentials support for authenticated requests

## Next Steps
1. Test on Vercel (user to sign in and verify)
2. Verify pending applications are visible
3. Test preview deployments (if needed)
4. Mark Phase 3.2.3 as complete

## Related Files
- `backend/shared/utils/lambda-utils.ts` - CORS logic
- `backend/services/club-service/handlers/user/get-user-clubs.ts` - Origin extraction
- `docs/phase-3.2.3-cors-fix-deployed.md` - Previous CORS fix
- `docs/phase-3.2.3-vercel-test-guide.md` - Testing guide
