# CORS Vercel Production Fix

## Issue
The Vercel production deployment (`https://collective-rides-frontend.vercel.app`) was experiencing CORS errors when making API requests to the backend:

```
Access to fetch at 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/clubs/attaquercc/rides?status=published' 
from origin 'https://collective-rides-frontend.vercel.app' has been blocked by CORS policy: 
The 'Access-Control-Allow-Origin' header has a value 'http://localhost:3000' that is not equal to the supplied origin.
```

## Root Cause
The backend API Gateway CORS configuration was only allowing the Vercel URL in the `production` environment, but the backend is deployed to the `development` environment. The development environment was only configured to allow `localhost` origins.

## Solution
Updated `backend/infrastructure/lib/api-gateway/rest-api.ts` to include the Vercel production URL in the development environment's allowed origins:

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
      'https://collective-rides-frontend.vercel.app', // Added for development testing
    ],
```

## Deployment
Deployed the fix using:
```bash
cd backend
npm run deploy
```

## Verification
Tested the CORS preflight request:
```bash
curl -I -X OPTIONS 'https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/clubs/attaquercc/rides?status=published' \
  -H 'Origin: https://collective-rides-frontend.vercel.app' \
  -H 'Access-Control-Request-Method: GET'
```

Response confirms the fix:
```
access-control-allow-origin: https://collective-rides-frontend.vercel.app
access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS
access-control-allow-credentials: true
```

## Status
✅ **FIXED** - Vercel production site can now successfully make API requests to the backend.

## Date
February 5, 2026
