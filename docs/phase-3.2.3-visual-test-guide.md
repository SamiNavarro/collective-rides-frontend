# Phase 3.2.3: Visual Testing Guide

## Quick Test: See Your Pending Application

### Step 1: Open Browser
Navigate to: `http://localhost:3000`

### Step 2: Login
- Click "Sign In" in the header
- Email: `testuser2@test.com`
- Password: `TestPassword123!`
- Click "Sign In"

### Step 3: Go to My Clubs
- Click "My Clubs" in the header navigation
- Or navigate directly to: `http://localhost:3000/my-clubs`

### Step 4: Verify Pending Application

You should see:

```
┌─────────────────────────────────────────────────────────┐
│ My Clubs                                                │
│ Manage your club memberships and stay connected with    │
│ your cycling community                                  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🕐 Pending Applications (1)                             │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Pastries.cc                                            │
│  Applied 1/18/2026                                      │
│  [🕐 Pending Approval]  [View Club →]                   │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 👥 Your Clubs (0)                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  No clubs joined yet                                    │
│  Your applications are being reviewed. Browse more      │
│  clubs while you wait!                                  │
│                                                         │
│  [Browse Clubs]                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### What to Look For

✅ **Pending Applications Section**
- Should show "Pending Applications (1)"
- Should have a clock icon (🕐)
- Should be styled with orange/amber colors

✅ **Pastries.cc Card**
- Club name: "Pastries.cc"
- Application date: Today's date
- Badge: "Pending Approval" with clock icon
- Button: "View Club" with arrow

✅ **Your Clubs Section**
- Should show "Your Clubs (0)"
- Should show empty state message
- Should mention "Your applications are being reviewed"
- Should have "Browse Clubs" button

### Step 5: Test Navigation

Click "View Club" button on Pastries.cc:
- Should navigate to club directory (club pages not implemented yet)
- Should show Pastries.cc in the list

Click "Browse Clubs" button:
- Should navigate to `/clubs/directory`
- Should show all clubs including Pastries.cc

### Step 6: Verify Directory Badge (Future)

In the directory (`/clubs/directory`):
- Find Pastries.cc card
- Should show "Pending" or "Applied" badge (not implemented yet)
- This is deferred to future iteration

## Troubleshooting

### Issue: No Pending Applications Section

**Possible Causes**:
1. Application wasn't created successfully
2. Auth context not fetching pending clubs
3. Browser cache issue

**Solutions**:
```bash
# 1. Check browser console for errors
# Open DevTools (F12) and look for red errors

# 2. Hard refresh the page
# Mac: Cmd + Shift + R
# Windows: Ctrl + Shift + R

# 3. Clear browser cache and reload
# Or use incognito/private window

# 4. Check backend response
# Open Network tab in DevTools
# Look for request to /v1/users/me/clubs?status=pending
# Should return array with Pastries.cc
```

### Issue: Application Shows as "Active" Instead of "Pending"

**Cause**: Application was already approved by admin

**Solution**: This is actually good! It means the application was processed. Check "Your Clubs" section instead of "Pending Applications".

### Issue: "Pending Applications" Section is Empty

**Possible Causes**:
1. Application was rejected
2. Application was approved (moved to active clubs)
3. Backend not returning pending status

**Solutions**:
```bash
# Check backend directly
# Get your auth token from browser DevTools:
# Application > Local Storage > auth_tokens

# Then test API:
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://s6ccfzfcwh.execute-api.us-east-2.amazonaws.com/development/v1/users/me/clubs?status=pending
```

## Expected API Response

When you load My Clubs page, you should see these network requests:

### Request 1: Get Current User
```
GET /v1/users/me
Status: 200 OK
```

### Request 2: Get Active Clubs
```
GET /v1/users/me/clubs?status=active
Status: 200 OK
Response: []  (empty array - no active clubs yet)
```

### Request 3: Get Pending Applications
```
GET /v1/users/me/clubs?status=pending
Status: 200 OK
Response: [
  {
    "clubId": "...",
    "clubName": "Pastries.cc",
    "clubSlug": "...",
    "clubLocation": "Eastern Suburbs",
    "membershipRole": "member",
    "membershipStatus": "pending",
    "joinedAt": "2026-01-18T..."
  }
]
```

## Browser Console Checks

Open DevTools Console (F12) and check for:

✅ **No Errors**
- Should not see any red error messages
- Should not see "undefined" or "null" errors

✅ **Auth Context Logs** (if enabled)
- "Authentication context created"
- "User profile loaded"
- "Fetching active clubs"
- "Fetching pending applications"

✅ **React Query Logs** (if enabled)
- "Query success: ['users', 'me', 'clubs']"
- "Query success: ['clubs', 'discovery']"

## Success Criteria

- ✅ Pending Applications section is visible
- ✅ Pastries.cc shows with "Pending Approval" badge
- ✅ Application date is displayed
- ✅ "View Club" button works
- ✅ Empty state message is clear
- ✅ No console errors
- ✅ Page loads quickly (< 2 seconds)
- ✅ Mobile responsive (test on narrow window)

## Next Steps After Verification

1. **If everything works**: Commit and push changes
2. **If issues found**: Debug using troubleshooting guide above
3. **After deployment**: Test in production with same steps

## Additional Testing

### Test with Different Accounts

Try logging in with different test users to verify:
- Users with no applications see appropriate empty state
- Users with active clubs see them in "Your Clubs" section
- Users with both active and pending see both sections

### Test Edge Cases

1. **Apply to another club**
   - Go to directory
   - Apply to another club
   - Verify "Pending Applications (2)" shows

2. **Refresh page**
   - Hard refresh (Cmd/Ctrl + Shift + R)
   - Verify pending applications persist

3. **Logout and login**
   - Logout
   - Login again
   - Verify pending applications still show

## Mobile Testing

Test on mobile viewport:
1. Open DevTools (F12)
2. Click device toolbar icon (or Cmd/Ctrl + Shift + M)
3. Select "iPhone 12 Pro" or similar
4. Verify:
   - Pending Applications section is readable
   - Badges are visible
   - Buttons are tappable
   - No horizontal scroll

## Performance Testing

Check page load performance:
1. Open DevTools > Network tab
2. Hard refresh page
3. Verify:
   - Page loads in < 2 seconds
   - API calls complete quickly
   - No failed requests
   - No unnecessary duplicate requests

## Accessibility Testing

Check accessibility:
1. Tab through page with keyboard
2. Verify:
   - All interactive elements are focusable
   - Focus indicators are visible
   - Screen reader text is appropriate
   - Color contrast is sufficient

## Final Checklist

Before marking as complete:

- [ ] Pending Applications section shows correctly
- [ ] Pastries.cc application is visible
- [ ] Badge styling is correct (orange/amber)
- [ ] Navigation works (View Club, Browse Clubs)
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Page loads quickly
- [ ] Keyboard navigation works
- [ ] Hard refresh preserves state
- [ ] Logout/login preserves state

## Documentation

After successful testing:
- ✅ Update progress tracker
- ✅ Create completion summary
- ✅ Document any issues found
- ✅ Commit changes with clear message
- ✅ Push to GitHub for deployment

---

**Ready to test?** Open `http://localhost:3000/my-clubs` and follow the steps above!
