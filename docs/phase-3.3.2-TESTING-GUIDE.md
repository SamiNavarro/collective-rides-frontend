# Phase 3.3.2: Testing Guide - Participant Count Fix

**Date:** February 1, 2026  
**Status:** Ready for Testing

## What Was Fixed

The participant count mismatch issue has been resolved:
- ✅ Backend logic fixed to properly handle WITHDRAWN participations
- ✅ Database counts recalculated for all rides
- ✅ Rejoin functionality now works correctly

## Testing Instructions

### 1. Refresh Your Browser

**Important:** Clear any cached data and refresh the page to see updated counts.

```
1. Open your browser's developer tools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
```

Or simply:
```
- Chrome/Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
```

### 2. Verify Counts Match

Navigate to the rides page and check that:
- The participant count in the ride card matches the number of participants shown in the detail page
- Example: If it says "2 / 20 riders", the participant list should show exactly 2 people

### 3. Test Join/Leave Cycle

Use a fresh test account for best results:

**Test Account:**
- Email: `testuser2@test.com`
- Password: `TestPassword123!`

**Test Steps:**

1. **Join a Ride**
   - Navigate to http://localhost:3000/rides
   - Click on any ride with available capacity
   - Click "Join Ride" button
   - ✅ Verify: Count increments (e.g., 1 → 2)
   - ✅ Verify: Button changes to "Leave Ride"
   - ✅ Verify: Your name appears in participant list

2. **Leave the Ride**
   - Click "Leave Ride" button
   - Confirm in the dialog
   - ✅ Verify: Count decrements (e.g., 2 → 1)
   - ✅ Verify: Button changes to "Join Ride"
   - ✅ Verify: Your name disappears from participant list

3. **Rejoin the Ride**
   - Click "Join Ride" button again
   - ✅ Verify: Count increments again (e.g., 1 → 2)
   - ✅ Verify: Button changes to "Leave Ride"
   - ✅ Verify: Your name reappears in participant list
   - ✅ Verify: No errors about "already participating"

### 4. Check Multiple Rides

Test with different rides to ensure consistency:
- Rides with 0 participants
- Rides with multiple participants
- Rides near capacity

### 5. Verify in Ride List

After joining/leaving:
- Go back to /rides page
- ✅ Verify: The ride card shows updated participation status
- ✅ Verify: "You're participating" badge appears/disappears correctly

## Expected Results

### Before Fix
- ❌ Count showed "2 / 20" but only 1 participant in list
- ❌ Rejoining after leaving showed "already participating" error
- ❌ Counts didn't match between list and detail pages

### After Fix
- ✅ Count matches actual participants (e.g., "1 / 20" with 1 in list)
- ✅ Can rejoin after leaving without errors
- ✅ Counts are consistent across all pages
- ✅ Optimistic updates provide instant feedback

## Troubleshooting

### If Counts Still Don't Match

1. **Hard refresh the browser** (Ctrl+Shift+R / Cmd+Shift+R)
2. **Clear localStorage:**
   ```javascript
   // In browser console:
   localStorage.clear();
   location.reload();
   ```
3. **Check if you're using an old account with stale data:**
   - Try with testuser2@test.com instead
   - Old accounts may have WITHDRAWN participations that don't affect counts but might cause confusion

### If "Already Participating" Error Appears

This should not happen anymore, but if it does:
1. Check the browser console for errors
2. Verify you're testing with the latest backend deployment
3. Try with a different ride

### If Button Doesn't Change

1. Check browser console for errors
2. Verify the API response includes `viewerParticipation` field
3. Hard refresh the page

## Database Verification (Optional)

If you want to verify the database directly:

```bash
# Run the verification script
node backend/scripts/fix-participant-counts.js

# Should show:
# Total rides: 11
# Fixed: 0
# Already correct: 11
```

## Success Criteria

Phase 3.3.2 is working correctly when:

1. ✅ All participant counts match actual participants
2. ✅ Join → Leave → Rejoin cycle works smoothly
3. ✅ No "already participating" errors
4. ✅ Counts update immediately with optimistic updates
5. ✅ Counts are consistent across list and detail pages
6. ✅ No console errors during join/leave operations

## Next Steps

Once testing is complete:
1. Document any issues found
2. Proceed with Phase 3.3.3 (Create Ride) if all tests pass
3. Consider adding automated tests for join/leave functionality

## Files Modified

- `backend/services/ride-service/domain/participation/participation-service.ts`
- `backend/services/ride-service/handlers/ride/get-ride.ts`
- `backend/scripts/fix-participant-counts.js`
- `backend/scripts/fix-participant-counts-complete.js`

## Support

If you encounter issues:
1. Check browser console for errors
2. Check network tab for API responses
3. Verify backend deployment is latest
4. Try with fresh test account
