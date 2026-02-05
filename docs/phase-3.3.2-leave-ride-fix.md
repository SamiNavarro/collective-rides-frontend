# Phase 3.3.2 - Leave Ride Fix

## Issue
After leaving a ride, the UI still showed "Leave Ride" button and attempting to leave again resulted in a 400 Bad Request error. The button state was not updating correctly after a successful leave operation.

## Root Cause
The `get-ride.ts` handler was returning `viewerParticipation` for ALL participation records, including those with status `WITHDRAWN` or `REMOVED`. This caused the frontend to think the user was still participating even after they had left.

**Bug in `get-ride.ts` (line 58-59):**
```typescript
// Find viewer's participation (if any)
const viewerParticipationEntity = participants.find(p => p.userId === authContext.userId);
```

This found the participation record regardless of status, so even after leaving (status = `WITHDRAWN`), the frontend received `viewerParticipation` data.

## Solution

### 1. Fixed `get-ride.ts` - Filter by Active Status
Updated the viewer participation lookup to only return participation if the user is actively participating (status is `CONFIRMED` or `WAITLISTED`):

```typescript
// Find viewer's participation (if any) - only if they're actively participating
const viewerParticipationEntity = participants.find(
  p => p.userId === authContext.userId && 
  (p.status === ParticipationStatus.CONFIRMED || p.status === ParticipationStatus.WAITLISTED)
);
```

### 2. Fixed `participation-service.ts` - Prevent Double Leave
Added a check to prevent users from leaving when they're already withdrawn:

```typescript
// Check if already withdrawn or removed
if (participation.status === ParticipationStatus.WITHDRAWN || 
    participation.status === ParticipationStatus.REMOVED) {
  throw new ParticipationNotFoundError(`${rideId}:${userId}`);
}
```

Also fixed the ride count update logic to use the status BEFORE withdrawing:

```typescript
// Store the current status before withdrawing
const previousStatus = participation.status;

participation.withdraw();
await this.participationRepository.update(participation);

// Update ride counts based on previous status
if (previousStatus === ParticipationStatus.CONFIRMED) {
  ride.decrementParticipants();
  // ...
}
```

### 3. Improved Error Handling in `leave-ride.ts`
Added specific error handling for the "not participating" case:

```typescript
if (error.errorType === 'PARTICIPATION_NOT_FOUND') {
  return createResponse(404, { 
    error: 'You are not participating in this ride',
    errorType: error.errorType 
  });
}
```

## Expected Behavior After Fix

### Join → Leave → Check State Cycle:

1. **Initial State**: User not participating
   - `viewerParticipation`: `undefined`
   - Button shows: "Join Ride"

2. **After Joining**: User successfully joins
   - `viewerParticipation`: `{ participationId, role, status: 'confirmed', joinedAt }`
   - Button shows: "Leave Ride"
   - Participant count increments

3. **After Leaving**: User successfully leaves
   - `viewerParticipation`: `undefined` (filtered out because status is now 'withdrawn')
   - Button shows: "Join Ride"
   - Participant count decrements
   - Success toast: "Left Ride"

4. **Try to Leave Again**: Should fail gracefully
   - Returns 404: "You are not participating in this ride"
   - No UI change (already showing "Join Ride")

5. **Rejoin**: User can join again
   - Creates new participation record
   - `viewerParticipation`: `{ participationId, role, status: 'confirmed', joinedAt }`
   - Button shows: "Leave Ride"

## Frontend Behavior

The frontend's optimistic update in `use-rides.ts` works correctly:

1. **On Leave Click**: Immediately updates UI to remove `viewerParticipation`
2. **On Success**: Invalidates query to refetch actual state from server
3. **On Error**: Rolls back to previous state

With the backend fix, the refetched state will now correctly show `viewerParticipation` as `undefined`, so the UI stays consistent.

## Testing

### Manual Testing in Browser:
1. Navigate to a ride detail page: `/clubs/attaquercc/rides/[rideId]`
2. Click "Join Ride" - should see success toast and button changes to "Leave Ride"
3. Click "Leave Ride" - should see success toast and button changes to "Join Ride"
4. Refresh page - button should still show "Join Ride" (not "Leave Ride")
5. Click "Join Ride" again - should work and show "Leave Ride"

### What to Check:
- ✅ Button state updates immediately (optimistic update)
- ✅ Button state persists after page refresh
- ✅ Participant count updates correctly
- ✅ Can rejoin after leaving
- ✅ No console errors
- ✅ Toast notifications appear for both join and leave

## Files Changed

### Backend:
- `backend/services/ride-service/handlers/ride/get-ride.ts` - Filter viewerParticipation by active status
- `backend/services/ride-service/handlers/participation/leave-ride.ts` - Better error handling
- `backend/services/ride-service/domain/participation/participation-service.ts` - Prevent double leave, fix count logic

### Frontend:
- No changes needed (optimistic updates already working correctly)

## Deployment

Backend changes deployed to development environment:
```bash
cd backend
npm run build
npx cdk deploy
```

Deployment completed successfully at: 2026-02-01

## Status
✅ **FIXED** - Leave ride functionality now works correctly with proper state management.
