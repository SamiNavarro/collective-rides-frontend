# Phase 3.3.2 Step 1 Complete - CORS Fix Deployed

**Date**: February 1, 2026  
**Status**: ✅ DEPLOYED

## Issue Resolved

The `/join` endpoint was returning CORS errors when called from localhost:3000.

### Root Cause

The global CORS configuration in `backend/infrastructure/lib/api-gateway/rest-api.ts` had a wildcard pattern `'https://collective-rides-frontend-*.vercel.app'` which API Gateway doesn't support. This caused the CORS preflight (OPTIONS) request to fail.

### Solution

Removed the wildcard pattern from the CORS configuration:

**Before**:
```typescript
allowOrigins: [
  'http://localhost:3000', 
  'http://127.0.0.1:3000',
  'https://collective-rides-frontend.vercel.app',
  'https://collective-rides-frontend-*.vercel.app' // ❌ Not supported
]
```

**After**:
```typescript
allowOrigins: [
  'http://localhost:3000', 
  'http://127.0.0.1:3000',
  'https://collective-rides-frontend.vercel.app', // ✅ Explicit origin only
]
```

### Deployment

- **Command**: `npm run deploy` (full deployment, not hotswap)
- **Duration**: ~207 seconds
- **Changes**: Updated API Gateway CORS configuration
- **New IAM Permissions**: Added Lambda invoke permissions for `/join` endpoint

### Files Modified

1. `backend/infrastructure/lib/api-gateway/rest-api.ts` - Removed wildcard CORS pattern
2. `backend/infrastructure/lib/ride-service.ts` - Already had `/join` endpoint configured

### Next Steps

1. ✅ Test join functionality from localhost
2. Test leave functionality
3. Complete Step 2 testing checklist from spec
4. Move to Step 3 (polish and edge cases)

### Testing Instructions

1. Navigate to a ride detail page: http://localhost:3000/clubs/attaquercc/rides/[rideId]
2. Click "Join Ride" button
3. Verify no CORS errors in console
4. Verify ride join succeeds
5. Verify participant count updates
6. Verify CTA changes to "Leave Ride"

---

**Ready for user testing!**
