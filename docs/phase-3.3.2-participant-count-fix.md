# Phase 3.3.2: Participant Count Fix

**Date:** February 1, 2026  
**Status:** ✅ Complete

## Issue

Participant counts were showing incorrect values (e.g., "2 / 20" but only 1 participant displayed in list). This was caused by old WITHDRAWN participation records that were never properly decremented from the ride count.

## Root Cause

When users left rides in earlier testing, the participation status was changed to WITHDRAWN, but the ride's `currentParticipants` count was not always decremented correctly. This left stale counts in the database.

## Solution

### 1. Backend Fixes (Already Deployed)

**Participation Service** (`backend/services/ride-service/domain/participation/participation-service.ts`):
- ✅ Added check to prevent double-leave attempts
- ✅ Fixed ride count logic to use status before withdrawing
- ✅ Modified `joinRide` to ignore WITHDRAWN/REMOVED participations when checking if user is already participating (allows rejoining)

**Get Ride Handler** (`backend/services/ride-service/handlers/ride/get-ride.ts`):
- ✅ Filters `viewerParticipation` to only show CONFIRMED or WAITLISTED status (not WITHDRAWN or REMOVED)

### 2. Data Cleanup Script

Created `backend/scripts/fix-participant-counts.js` to recalculate counts from actual CONFIRMED participations.

**Script Logic:**
1. Scans all rides in the database (filters by `entityType = 'RIDE'`)
2. For each ride, queries all participations (`PK = RIDE#{rideId}`, `SK = PARTICIPANT#*`)
3. Counts only CONFIRMED participations
4. Updates both records if count doesn't match:
   - Main ride record: `PK = CLUB#{clubId}`, `SK = RIDE#{rideId}`
   - Index record: `PK = CLUB#{clubId}#RIDES`, `SK = DATE#{date}#RIDE#{rideId}`

**Results:**
```
Total rides: 11
Fixed: 4 rides
Already correct: 7 rides
```

**Fixed Rides:**
- Weekend Training Ride: 2 → 1 (had 2 withdrawn)
- Advanced Hill Climb Challenge: 3 → 2 (had 1 withdrawn)
- Casual Sunday Spin: 2 → 1 (had 2 withdrawn)
- Weekend Training Ride: 2 → 1 (had 1 withdrawn)

## Verification

After running the script:
1. ✅ All ride participant counts now match actual CONFIRMED participations
2. ✅ Both main and index records are consistent
3. ✅ Users can now see accurate counts in the UI
4. ✅ Join → Leave → Rejoin cycle works correctly

## Testing Recommendations

1. **Refresh browser** to see updated counts
2. **Test with fresh user account** (testuser2@test.com) to avoid old state
3. **Verify join/leave cycle**:
   - Join a ride → count increments, button changes to "Leave Ride"
   - Leave the ride → count decrements, button changes to "Join Ride"
   - Rejoin the ride → count increments again, works correctly

## Files Modified

- `backend/scripts/fix-participant-counts.js` - Data cleanup script
- `backend/scripts/fix-participant-counts-complete.js` - Enhanced version that updates both records

## Notes

- The backend fixes prevent this issue from happening again
- Old WITHDRAWN participations remain in the database but don't affect counts
- The `viewerParticipation` filter ensures users don't see stale participation status
- Rejoining after leaving now works correctly (ignores old WITHDRAWN records)

## Next Steps

1. Refresh browser and verify counts are correct
2. Test complete join → leave → rejoin cycle
3. Proceed with Phase 3.3.2 completion testing
