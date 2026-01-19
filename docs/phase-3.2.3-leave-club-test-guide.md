# Phase 3.2.3 - Leave Club Testing Guide

## What Was Fixed
Fixed the response unwrapping issue in React Query hooks that was preventing clubs from being removed from the "My Clubs" list after leaving.

## Changes Deployed
- ✅ Frontend: Fixed response unwrapping in `hooks/use-clubs.ts`
- ✅ Frontend: Enhanced logging in `app/my-clubs/page.tsx`
- ✅ Git: Committed and pushed to main branch
- ⏳ Vercel: Auto-deployment in progress

## Testing on Localhost

### Prerequisites
1. Development server running: `npm run dev`
2. Browser open to: `http://localhost:3000`
3. Logged in as: `testuser2@test.com` / `TestPassword123!`

### Test Steps

#### 1. Navigate to My Clubs
```
http://localhost:3000/my-clubs
```

**Expected**:
- Page loads without errors
- Shows list of clubs you're a member of
- Shows pending applications (if any)

#### 2. Open Browser Console
- Chrome/Edge: F12 or Cmd+Option+I (Mac)
- Firefox: F12 or Cmd+Option+K (Mac)
- Safari: Cmd+Option+C (Mac)

#### 3. Click "Leave Club"
Click the "Leave Club" button on any club card.

**Expected**:
- Custom dialog appears with club name
- Dialog shows: "Are you sure you want to leave {Club Name}?"
- Two buttons: "Cancel" and "Leave Club"

#### 4. Confirm Leave
Click "Leave Club" button in the dialog.

**Expected Console Output**:
```
🚪 Leaving club: {id: "pastriescc", name: "Pastries.cc"}
📊 Current clubs count: 2
✅ Leave club result: {success: true, message: "Successfully left the club", ...}
🔄 Mutation completed, React Query should invalidate queries now
🔄 Manually triggering refetch...
```

**Expected UI Behavior**:
- Dialog closes immediately
- Club card disappears from the list
- Club count decreases by 1
- No errors in console

#### 5. Refresh Page
Press Cmd+R (Mac) or F5 (Windows/Linux) to refresh.

**Expected**:
- Club is still gone from the list
- Page loads without errors
- Club count remains decreased

#### 6. Verify Backend
Check that the membership was actually removed:

```bash
# Get your ID token from browser console
localStorage.getItem("idToken")

# Test the API directly
node scripts/test-leave-club-localhost.js YOUR_TOKEN
```

**Expected**:
- API returns updated club list
- Left club is not in the response

## Testing on Vercel (Production)

### Wait for Deployment
1. Check Vercel dashboard: https://vercel.com/
2. Wait for deployment to complete (usually 1-2 minutes)
3. Look for "Deployment Complete" status

### Test Steps

#### 1. Clear Browser Cache
**Important**: Hard refresh to clear old JavaScript
- Chrome/Edge: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Firefox: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Safari: Cmd+Option+E, then Cmd+R

#### 2. Navigate to My Clubs
```
https://collective-rides-frontend.vercel.app/my-clubs
```

#### 3. Login
- Email: `testuser2@test.com`
- Password: `TestPassword123!`

#### 4. Follow Same Test Steps as Localhost
- Open browser console
- Click "Leave Club"
- Confirm in dialog
- Check console output
- Verify club disappears
- Refresh page
- Verify club is still gone

## Troubleshooting

### Issue: Club doesn't disappear after leaving

**Check**:
1. Browser console for errors
2. Network tab for API response
3. React Query DevTools (if installed)

**Possible causes**:
- API request failed (check Network tab)
- CORS error (check console)
- React Query not invalidating (check DevTools)

**Solution**:
```javascript
// In browser console, check the response
localStorage.getItem("idToken") // Get token
// Then check API directly in Network tab
```

### Issue: Console shows "Failed to leave club"

**Check**:
1. Network tab for API response
2. Response status code
3. Response body for error message

**Possible causes**:
- User is club owner (owners can't leave)
- User is not a member
- Backend error

**Solution**:
- Check user's role in the club
- Verify membership exists
- Check backend logs

### Issue: Page shows old data after refresh

**Check**:
1. Browser cache (hard refresh)
2. Service worker cache
3. React Query cache

**Solution**:
```bash
# Clear all caches
1. Hard refresh: Cmd+Shift+R
2. Clear site data: Chrome DevTools > Application > Clear Storage
3. Restart browser
```

### Issue: "t.map is not a function" error

**This means**:
- Response unwrapping is still wrong
- Old JavaScript is cached

**Solution**:
1. Hard refresh (Cmd+Shift+R)
2. Clear browser cache
3. Check that latest code is deployed
4. Verify `hooks/use-clubs.ts` has single unwrapping

## Success Criteria

✅ My Clubs page loads without errors
✅ Leave Club dialog appears and works
✅ Club disappears from list after leaving
✅ Console shows proper logging
✅ Page refresh shows club is still gone
✅ No JavaScript errors in console
✅ Works on both localhost and Vercel

## API Endpoints Tested

### GET /v1/users/me/clubs
**Purpose**: Get user's clubs with hydrated data

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "clubId": "pastriescc",
      "clubName": "Pastries.cc",
      "clubSlug": "pastriescc",
      "clubLocation": "Sydney",
      "membershipRole": "member",
      "membershipStatus": "active",
      "joinedAt": "2026-01-19T00:00:00Z",
      "memberCount": 150
    }
  ],
  "timestamp": "2026-01-19T08:00:00.000Z"
}
```

### DELETE /v1/clubs/{clubId}/members/me
**Purpose**: Leave a club

**Response Format**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Successfully left the club",
    "timestamp": "2026-01-19T08:00:00.000Z"
  },
  "timestamp": "2026-01-19T08:00:00.000Z"
}
```

## Next Steps After Testing

### If Tests Pass ✅
1. Mark Phase 3.2.3 as complete
2. Update completion summary
3. Move to next phase

### If Tests Fail ❌
1. Document the failure
2. Check browser console for errors
3. Check Network tab for API responses
4. Share console output and error messages
5. Debug and fix issues

## Quick Test Commands

### Localhost
```bash
# Start dev server
npm run dev

# Open browser
open http://localhost:3000/my-clubs

# Get auth token
# In browser console:
localStorage.getItem("idToken")

# Test API directly
node scripts/test-leave-club-localhost.js YOUR_TOKEN
```

### Vercel
```bash
# Open production site
open https://collective-rides-frontend.vercel.app/my-clubs

# Check deployment status
# Visit: https://vercel.com/
```

## Notes

- The fix only affects frontend code
- No backend deployment needed
- Vercel auto-deploys on git push
- Hard refresh required to clear old JavaScript
- Console logging helps debug issues
- React Query automatically refetches after mutation

Ready to test! 🚀
