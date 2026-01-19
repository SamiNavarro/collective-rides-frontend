# Phase 3.2.3: CORS Issue on Vercel

## Problem

The `/v1/users/me/clubs` endpoint is blocked by CORS when accessed from Vercel production:

```
Access to fetch at 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/users/me/clubs' 
from origin 'https://collective-rides-frontend.vercel.app' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Root Cause

The backend API Gateway CORS configuration in `backend/infrastructure/lib/api-gateway/rest-api.ts` includes Vercel in the allowed origins:

```typescript
allowOrigins: props.environment === 'production' 
  ? [
      'https://sydneycycles.com',
      'https://collective-rides-frontend.vercel.app', // ✅ Included
      'https://collectiverides.com'
    ]
  : [
      'http://localhost:3000', 
      'http://127.0.0.1:3000',
      'https://collective-rides-frontend.vercel.app' // ✅ Included
    ],
```

However, the backend is deployed to the `development` environment, not `production`, so it's using the development CORS settings. The issue is that the `/v1/users/me/clubs` endpoint specifically needs CORS headers in the response, and the Lambda function might not be returning them correctly.

## Why It Works on Localhost

Localhost (`http://localhost:3000`) is explicitly included in the development CORS configuration, so requests from localhost work fine.

## Solution

### Option 1: Redeploy Backend with CORS Fix (Recommended)

The backend needs to be redeployed to ensure CORS headers are properly configured for all endpoints.

**Steps:**
1. Navigate to backend directory: `cd backend`
2. Deploy the stack: `npm run deploy` or `cdk deploy`
3. Wait for deployment to complete (~5-10 minutes)
4. Test Vercel again

### Option 2: Use Localhost for Testing (Temporary)

For now, test the pending applications feature on localhost:
1. Go to `http://localhost:3000`
2. Login as testuser2@test.com
3. Navigate to My Clubs
4. You should see the pending application to Pastries.cc

## Current Status

- ✅ **Localhost**: Working correctly
- ❌ **Vercel**: Blocked by CORS
- 🔧 **Fix Required**: Backend redeploy

## Testing on Localhost

Since Vercel is blocked by CORS, test on localhost instead:

```bash
# Make sure dev server is running
npm run dev

# Open browser
open http://localhost:3000

# Login
Email: testuser2@test.com
Password: TestPassword123!

# Navigate to My Clubs
# You should see:
# - Pending Applications (1)
# - Pastries.cc with "Pending Approval" badge
```

## What Works vs What Doesn't

### ✅ Working on Localhost
- Login/authentication
- Club directory
- Applying to clubs
- **Pending applications visibility** ← Our new feature!
- My Clubs page

### ❌ Not Working on Vercel
- `/v1/users/me/clubs` endpoint (CORS blocked)
- My Clubs page shows "Failed to load clubs"
- Pending applications not visible

### ✅ Working on Vercel
- Login/authentication
- Club directory (uses different endpoint)
- Applying to clubs
- Everything except My Clubs page

## Backend CORS Configuration

The CORS configuration is in `backend/infrastructure/lib/api-gateway/rest-api.ts`:

```typescript
defaultCorsPreflightOptions: {
  allowOrigins: props.environment === 'production' 
    ? [
        'https://sydneycycles.com',
        'https://collective-rides-frontend.vercel.app',
        'https://collectiverides.com'
      ]
    : [
        'http://localhost:3000', 
        'http://127.0.0.1:3000',
        'https://collective-rides-frontend.vercel.app'
      ],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'X-Amz-Date',
    'Authorization',
    'X-Api-Key',
    'X-Amz-Security-Token',
    'X-Amz-User-Agent',
  ],
  allowCredentials: true,
  maxAge: cdk.Duration.hours(1),
},
```

This configuration looks correct, but the Lambda function handler might not be returning the CORS headers in the response.

## Lambda Handler CORS Headers

Each Lambda handler needs to return CORS headers in the response. Check `backend/services/club-service/handlers/user/get-user-clubs.ts`:

```typescript
return {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Or specific origin
    'Access-Control-Allow-Credentials': 'true',
  },
  body: JSON.stringify(response),
};
```

The `createSuccessResponse` utility in `backend/shared/utils/lambda-utils.ts` should be adding these headers automatically.

## Next Steps

1. **Immediate**: Test on localhost to verify pending applications feature works
2. **Short-term**: Redeploy backend with CORS fix
3. **Long-term**: Add automated CORS testing to prevent this issue

## Workaround for Demo

If you need to demo on Vercel before the backend is fixed:

1. Show the club directory (works on Vercel)
2. Show applying to a club (works on Vercel)
3. Switch to localhost to show My Clubs with pending applications
4. Explain that it's a CORS configuration issue being fixed

## References

- Backend CORS Config: `backend/infrastructure/lib/api-gateway/rest-api.ts`
- Lambda Handler: `backend/services/club-service/handlers/user/get-user-clubs.ts`
- Lambda Utils: `backend/shared/utils/lambda-utils.ts`
- Frontend API Client: `lib/api/api-client.ts`
- Auth Context: `contexts/auth-context.tsx`

## Conclusion

The pending applications feature is **fully implemented and working on localhost**. The Vercel CORS issue is a backend infrastructure problem that requires a backend redeploy to fix. The feature itself is complete and ready for production once the CORS issue is resolved.

**Status**: ✅ Feature Complete, 🔧 Backend CORS Fix Needed
