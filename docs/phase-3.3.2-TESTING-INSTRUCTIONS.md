# Phase 3.3.2: Testing Instructions - IMPORTANT

**Date:** February 1, 2026  
**Status:** Ready for Testing

---

## IMPORTANT: Why testuser2 Shows "You're participating"

**testuser2@test.com is the CAPTAIN of all 11 rides** because they created them. This is correct behavior!

- ✅ Captains are automatically participating in their rides
- ✅ Captains CANNOT leave rides (by design - prevents orphaned rides)
- ✅ The "Leave Ride" button should be disabled or hidden for captains

## Solution: Use admin@test.com for Testing

**admin@test.com** has 6 rides available for join/leave testing:

### Test Account
```
Email: admin@test.com
Password: TestPassword123!
```

### Available Rides for Testing

1. **Test Ride**
   - URL: http://localhost:3000/clubs/attaquercc/rides/ride_mknktv3l_b3a68f59a5d4
   - Participants: 1 / 15

2. **Morning Coffee Ride** (Jan 22)
   - URL: http://localhost:3000/clubs/attaquercc/rides/ride_mknku7on_1f326e791a0c
   - Participants: 1 / 15

3. **Morning Coffee Ride** (Jan 23)
   - URL: http://localhost:3000/clubs/attaquercc/rides/ride_mkp37d8s_e4dec5e7500e
   - Participants: 1 / 15

4. **Morning Coffee Ride** (Jan 23)
   - URL: http://localhost:3000/clubs/attaquercc/rides/ride_mkp3f57z_86381cd304fa
   - Participants: 1 / 15

5. **Weekend Training Ride**
   - URL: http://localhost:3000/clubs/attaquercc/rides/ride_mkp3f630_40023b188a27
   - Participants: 1 / 20

6. **Advanced Hill Climb Challenge**
   - URL: http://localhost:3000/clubs/attaquercc/rides/ride_mkp3f6vy_09d8bbe42e0c
   - Participants: 1 / 12

---

## Testing Steps

### 1. Login as admin@test.com

```
1. Go to http://localhost:3000
2. Click "Sign In"
3. Enter: admin@test.com / TestPassword123!
```

### 2. Test Join Flow

```
1. Navigate to any ride from the list above
2. Click "Join Ride" button
3. ✅ Verify: Count increments (e.g., 1 → 2)
4. ✅ Verify: Button changes to "Leave Ride"
5. ✅ Verify: Your name appears in participant list
6. ✅ Verify: Toast notification appears
```

### 3. Test Leave Flow

```
1. Click "Leave Ride" button
2. Confirm in the dialog
3. ✅ Verify: Count decrements (e.g., 2 → 1)
4. ✅ Verify: Button changes to "Join Ride"
5. ✅ Verify: Your name disappears from participant list
6. ✅ Verify: Toast notification appears
```

### 4. Test Rejoin Flow

```
1. Click "Join Ride" button again
2. ✅ Verify: Count increments (e.g., 1 → 2)
3. ✅ Verify: Button changes to "Leave Ride"
4. ✅ Verify: No "already participating" error
5. ✅ Verify: Your name reappears in participant list
```

### 5. Verify Counts Match

```
1. Check the participant count in the ride card
2. Count the actual participants in the list
3. ✅ Verify: Numbers match exactly
```

---

## Understanding the Data

### User Participation Status

**testuser2@test.com:**
- Participating in: 11 rides (as CAPTAIN)
- Available for testing: 0 rides
- Role: Ride creator/captain

**admin@test.com:**
- Participating in: 5 rides
- Available for testing: 6 rides
- Role: Regular member

### Why Captains Can't Leave

From the spec and backend logic:
```typescript
// Cannot remove captain without transferring role
if (participation.role === RideRole.CAPTAIN) {
  throw new CannotRemoveCaptainError();
}
```

This is intentional to prevent:
- Orphaned rides with no captain
- Rides losing their organizer
- Confusion about ride ownership

---

## Quick Test Script

Run this to find rides for any user:

```bash
node backend/scripts/find-rides-for-testing.js admin@test.com
```

Or check a user's current participations:

```bash
node backend/scripts/check-user-participations.js admin@test.com
```

---

## Expected Results

### For admin@test.com (Regular Member)
- ✅ Can join rides they're not participating in
- ✅ Can leave rides they've joined
- ✅ Can rejoin after leaving
- ✅ Counts update correctly

### For testuser2@test.com (Captain)
- ✅ Shows "You're participating" (correct - they're the captain)
- ✅ Cannot leave (correct - captains can't abandon rides)
- ✅ Should see disabled "Leave Ride" button or captain badge

---

## Troubleshooting

### "You're participating" for testuser2
**This is correct!** testuser2 is the captain of all rides. Use admin@test.com instead.

### No rides available for testing
Create new rides or use a different test user.

### Counts don't match
Run the fix script:
```bash
node backend/scripts/fix-participant-counts.js
```

---

## Success Criteria

Phase 3.3.2 is working when:

1. ✅ admin@test.com can join available rides
2. ✅ admin@test.com can leave rides they've joined
3. ✅ admin@test.com can rejoin after leaving
4. ✅ Participant counts are accurate
5. ✅ testuser2@test.com correctly shows as captain (cannot leave)
6. ✅ UI updates optimistically
7. ✅ No console errors

---

## Next Steps

Once testing with admin@test.com is complete:
1. Document any issues found
2. Test with additional users if needed
3. Proceed to Phase 3.3.3 (Create Ride)
