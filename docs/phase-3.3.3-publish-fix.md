# Phase 3.3.3 - Publish Ride Fix

**Date:** February 2, 2026  
**Status:** ✅ Complete

## Issues Fixed

### 1. Publish Endpoint HTTP Method Mismatch

**Problem:**
- Frontend API client was using `PUT` method for publish endpoint
- Backend API Gateway was configured with `POST` method
- This caused "Failed to fetch" error when clicking publish button

**Root Cause:**
```typescript
// Frontend (WRONG)
publish: (clubId: string, rideId: string) => apiClient.put(`/v1/clubs/${clubId}/rides/${rideId}/publish`, {})

// Backend API Gateway (CORRECT)
publishResource.addMethod('POST', new LambdaIntegration(publishRideHandler), {
  authorizer,
  authorizationType: AuthorizationType.COGNITO
});
```

**Fix:**
Changed frontend API client to use `POST` method:
```typescript
// lib/api/api-client.ts
publish: (clubId: string, rideId: string) => apiClient.post(`/v1/clubs/${clubId}/rides/${rideId}/publish`, {})
```

**Files Modified:**
- `lib/api/api-client.ts`

---

### 2. Missing User Membership Data in Create Ride Page

**Problem:**
- Create ride page couldn't verify if user is an active member
- `useClub` hook doesn't return `userMembership` data (by design - it's a public endpoint)
- Temporary workaround only checked if user was signed in

**Root Cause:**
The backend `GET /clubs/{clubId}` endpoint is public and doesn't include user-specific membership data. The frontend was trying to access `club.userMembership` which doesn't exist.

**Fix:**
Use `useMyClubs` hook to get user's membership data and cross-reference with the club:

```typescript
// app/clubs/[clubId]/rides/new/page.tsx
const { data: myClubs, isLoading: myClubsLoading } = useMyClubs()

// Find user's membership in this club
const membership = myClubs?.find(c => c.clubId === clubId)
const isActiveMember = membership?.membershipStatus === 'active'

// Check if user can publish rides (leadership roles)
const canPublish = isActiveMember && 
  ['owner', 'admin', 'ride_captain', 'ride_leader'].includes(membership?.membershipRole || '')
```

**Benefits:**
- Proper membership verification
- Accurate role-based permissions for publish capability
- No need to modify backend (uses existing hydrated endpoint)
- Consistent with Phase 3.1 architecture

**Files Modified:**
- `app/clubs/[clubId]/rides/new/page.tsx`

---

## Testing Instructions

### Test Publish Workflow

1. **Create Draft Ride:**
   ```
   Navigate to: http://localhost:3000/clubs/attaquercc/rides/new
   Fill in form and click "Save as Draft"
   ```

2. **Verify Draft Created:**
   - Should navigate to ride detail page
   - Should show "Draft" badge
   - Should show "Publish Ride" button (if you have leadership role)

3. **Publish Ride:**
   - Click "Publish Ride" button
   - Confirm in dialog
   - Should see success toast: "Ride Published"
   - Badge should change from "Draft" to "Published"
   - Ride should now be visible in rides list

### Test Membership Verification

1. **As Active Member:**
   ```
   Navigate to: http://localhost:3000/clubs/attaquercc/rides/new
   Should see create ride form
   ```

2. **As Non-Member:**
   ```
   Sign out or use different account
   Navigate to: http://localhost:3000/clubs/attaquercc/rides/new
   Should see error: "You must be an active member of this club to create rides"
   ```

3. **Not Signed In:**
   ```
   Sign out
   Navigate to: http://localhost:3000/clubs/attaquercc/rides/new
   Should see error: "You must be signed in to create rides"
   ```

---

## Implementation Summary

### Changes Made

1. **API Client Fix:**
   - Changed publish endpoint from `PUT` to `POST`
   - Matches backend API Gateway configuration

2. **Membership Verification:**
   - Added `useMyClubs` hook to create ride page
   - Cross-reference club membership from hydrated data
   - Proper active member check
   - Accurate role-based publish permissions

### Architecture Notes

**Why not add userMembership to club detail endpoint?**
- The `GET /clubs/{clubId}` endpoint is intentionally public
- Adding user-specific data would require authentication
- Would break public club discovery functionality
- Current approach (hydrated clubs endpoint) is cleaner separation of concerns

**Data Flow:**
```
Public Club Data:     GET /v1/clubs/{clubId}
User Memberships:     GET /v1/users/me/clubs (hydrated)
Cross-Reference:      Frontend combines both sources
```

---

## Next Steps

1. ✅ Test complete create → publish → join workflow
2. ✅ Verify membership checks work correctly
3. ✅ Test with different user roles (member vs leadership)
4. 🔄 Mobile responsiveness testing
5. 🔄 Update implementation summary document

---

## Related Files

**Frontend:**
- `lib/api/api-client.ts` - API client with publish endpoint
- `app/clubs/[clubId]/rides/new/page.tsx` - Create ride page with membership check
- `hooks/use-rides.ts` - usePublishRide mutation hook
- `hooks/use-clubs.ts` - useMyClubs hook for membership data

**Backend:**
- `backend/infrastructure/lib/ride-service.ts` - API Gateway route configuration
- `backend/services/ride-service/handlers/ride/publish-ride.ts` - Publish handler
- `backend/services/club-service/handlers/user/get-user-clubs.ts` - Hydrated clubs endpoint

---

## Compliance

- ✅ Phase 3.3.3 Spec: `.kiro/specs/phase-3.3.3-create-ride.md`
- ✅ Draft-first model: Any member can create drafts
- ✅ Leadership publishing: Only leadership can publish
- ✅ Membership verification: Proper active member checks
