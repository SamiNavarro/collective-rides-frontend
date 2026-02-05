# Phase 3.4 Club Administration - Testing Guide

**Date**: February 3, 2026  
**Purpose**: Manual testing checklist for Phase 3.4 features

---

## Prerequisites

### Test Users
You'll need test users with different roles:
- **Owner** - Full access to all features
- **Admin** - Full access to all features
- **Ride Captain** - Access to Members and Draft Rides tabs
- **Ride Leader** - Access to Members and Draft Rides tabs
- **Member** - No access to management features

### Test Club Setup
1. Create a test club or use existing club
2. Add test users with different roles
3. Create some draft rides
4. Have some pending join requests (for request_to_join clubs)

---

## Test Scenarios

### 1. Club Settings Page

#### Test 1.1: Owner Access ✅
**Steps**:
1. Log in as club owner
2. Navigate to club detail page
3. Click "Settings" button
4. Verify settings page loads

**Expected**:
- Settings button is visible
- Settings page loads successfully
- Form pre-populates with current club data
- All fields are editable

#### Test 1.2: Admin Access ✅
**Steps**:
1. Log in as club admin
2. Navigate to club detail page
3. Click "Settings" button
4. Verify settings page loads

**Expected**:
- Settings button is visible
- Settings page loads successfully
- Can edit all fields

#### Test 1.3: Captain/Leader/Member Access ❌
**Steps**:
1. Log in as captain/leader/member
2. Navigate to club detail page
3. Verify "Settings" button is NOT visible
4. Try to access `/clubs/{clubId}/settings` directly

**Expected**:
- Settings button is hidden
- Direct URL access shows 403 error page
- "Back to Club" button works

#### Test 1.4: Form Validation
**Steps**:
1. Log in as owner/admin
2. Go to settings page
3. Clear the club name field
4. Try to save

**Expected**:
- Save button is disabled or shows error
- Validation message appears
- Form doesn't submit

#### Test 1.5: Character Counters
**Steps**:
1. Type in description field
2. Watch character counter

**Expected**:
- Counter updates in real-time
- Shows "X / 500 characters"
- Turns red when approaching limit

#### Test 1.6: Save Changes
**Steps**:
1. Edit club name
2. Edit description
3. Change membership approval type
4. Click "Save Changes"

**Expected**:
- Success toast appears
- Form updates with new values
- Changes persist after page refresh

---

### 2. Management Hub Access

#### Test 2.1: Owner/Admin Access ✅
**Steps**:
1. Log in as owner/admin
2. Navigate to club detail page
3. Click "Manage Club" button

**Expected**:
- Manage button is visible
- Badge count shows pending items
- Management hub loads with all tabs
- Requests tab is visible (if request_to_join club)

#### Test 2.2: Captain/Leader Access ✅
**Steps**:
1. Log in as captain/leader
2. Navigate to club detail page
3. Click "Manage Club" button

**Expected**:
- Manage button is visible
- Badge count shows draft rides only
- Management hub loads
- Requests tab is NOT visible
- Members and Draft Rides tabs are visible

#### Test 2.3: Member Access ❌
**Steps**:
1. Log in as member
2. Navigate to club detail page
3. Verify "Manage Club" button is NOT visible
4. Try to access `/clubs/{clubId}/manage` directly

**Expected**:
- Manage button is hidden
- Direct URL access shows 403 error page

#### Test 2.4: Badge Counts
**Steps**:
1. Log in as owner/admin
2. Note badge count on Manage button
3. Approve a join request
4. Check badge count again

**Expected**:
- Badge count decreases by 1
- Updates automatically without page refresh

#### Test 2.5: Tab Navigation
**Steps**:
1. Open management hub
2. Click different tabs
3. Check URL

**Expected**:
- URL updates with `?tab=members`, `?tab=requests`, etc.
- Tab state persists on page refresh
- Back button works correctly

---

### 3. Members Tab

#### Test 3.1: Member List
**Steps**:
1. Open Members tab
2. Verify member list loads

**Expected**:
- All active members are shown
- Each member shows: name, email, role, joined date
- Members are sorted by role (owner first)

#### Test 3.2: Search Members
**Steps**:
1. Type in search box
2. Verify filtering works

**Expected**:
- List filters in real-time
- Matches name or email
- Shows "No members found" if no matches

#### Test 3.3: Filter by Role
**Steps**:
1. Select "Admin" from role filter
2. Verify only admins are shown
3. Select "All Roles"
4. Verify all members are shown

**Expected**:
- Filter works correctly
- Can combine with search
- "All Roles" shows everyone

#### Test 3.4: Promote Member
**Steps**:
1. Find a member with role "member"
2. Click role dropdown
3. Select "Ride Leader"
4. Confirm change

**Expected**:
- Success toast appears
- Member's role updates immediately
- Badge updates in UI

#### Test 3.5: Demote Member
**Steps**:
1. Find a member with role "admin"
2. Click role dropdown
3. Select "member"
4. Confirm change

**Expected**:
- Success toast appears
- Member's role updates immediately

#### Test 3.6: Role Hierarchy
**Steps**:
1. Log in as admin
2. Try to change owner's role

**Expected**:
- Owner's role dropdown is disabled OR
- Change fails with error message
- Can't demote higher-ranked members

#### Test 3.7: Remove Member
**Steps**:
1. Click "Remove" on a member
2. Confirmation dialog appears
3. Optionally add reason
4. Confirm removal

**Expected**:
- Confirmation dialog shows
- Success toast appears
- Member disappears from list
- Member count updates

#### Test 3.8: Last Owner Protection
**Steps**:
1. Try to remove the last owner

**Expected**:
- Remove button is disabled OR
- Error message appears
- Cannot remove last owner

---

### 4. Requests Tab

#### Test 4.1: Pending Requests List
**Steps**:
1. Open Requests tab (owner/admin only)
2. Verify pending requests load

**Expected**:
- All pending requests are shown
- Each shows: user name, email, requested date
- Sorted by request date (newest first)

#### Test 4.2: Approve Request (No Message)
**Steps**:
1. Click "Approve" on a request
2. Leave message field empty
3. Confirm approval

**Expected**:
- Success toast appears
- Request disappears from list
- Badge count decreases
- User becomes active member

#### Test 4.3: Approve Request (With Message)
**Steps**:
1. Click "Approve" on a request
2. Enter welcome message
3. Confirm approval

**Expected**:
- Success toast appears
- Request disappears from list
- User receives welcome message (future: email)

#### Test 4.4: Reject Request (No Reason)
**Steps**:
1. Click "Reject" on a request
2. Leave reason field empty
3. Confirm rejection

**Expected**:
- Success toast appears
- Request disappears from list
- Badge count decreases

#### Test 4.5: Reject Request (With Reason)
**Steps**:
1. Click "Reject" on a request
2. Enter rejection reason
3. Confirm rejection

**Expected**:
- Success toast appears
- Request disappears from list
- User can see rejection reason (future)

#### Test 4.6: Empty State
**Steps**:
1. Approve/reject all requests
2. Verify empty state shows

**Expected**:
- "No pending requests" message
- Helpful text about what will appear here

#### Test 4.7: Conditional Visibility
**Steps**:
1. Test with request_to_join club
2. Test with open club

**Expected**:
- Requests tab visible for request_to_join clubs
- Requests tab hidden for open clubs

---

### 5. Draft Rides Tab

#### Test 5.1: Draft Rides List
**Steps**:
1. Open Draft Rides tab
2. Verify draft rides load

**Expected**:
- All draft rides are shown
- Each shows: title, date, creator, description
- Sorted by creation date (newest first)

#### Test 5.2: Publish Draft Ride
**Steps**:
1. Click "Publish" on a draft ride
2. Confirm action

**Expected**:
- Success toast appears
- Ride disappears from draft list
- Ride appears in published rides
- Badge count decreases

#### Test 5.3: Reject Draft Ride (No Reason)
**Steps**:
1. Click "Reject" on a draft ride
2. Leave reason field empty
3. Confirm rejection

**Expected**:
- Success toast appears
- Ride disappears from list
- Badge count decreases

#### Test 5.4: Reject Draft Ride (With Reason)
**Steps**:
1. Click "Reject" on a draft ride
2. Enter rejection reason
3. Confirm rejection

**Expected**:
- Success toast appears
- Ride disappears from list
- Creator can see rejection reason

#### Test 5.5: View Ride Details
**Steps**:
1. Click external link icon on a draft ride
2. Verify ride detail page opens

**Expected**:
- Opens in new tab
- Shows full ride details
- Can navigate back to management hub

#### Test 5.6: Empty State
**Steps**:
1. Publish/reject all draft rides
2. Verify empty state shows

**Expected**:
- "No draft rides pending" message
- Helpful text about what will appear here

---

### 6. Mobile Responsiveness

#### Test 6.1: Settings Page Mobile
**Steps**:
1. Open settings page on mobile device
2. Test form interaction

**Expected**:
- Form fields are full width
- Buttons are touch-friendly
- Character counters are visible
- Save button is accessible

#### Test 6.2: Management Hub Mobile
**Steps**:
1. Open management hub on mobile
2. Test tab navigation

**Expected**:
- Tabs stack or scroll horizontally
- Tab content is readable
- Badge counts are visible

#### Test 6.3: Members Tab Mobile
**Steps**:
1. Open Members tab on mobile
2. Test member cards

**Expected**:
- Member cards stack vertically
- Search and filter work
- Dropdowns are touch-friendly
- Actions are accessible

#### Test 6.4: Requests Tab Mobile
**Steps**:
1. Open Requests tab on mobile
2. Test request cards

**Expected**:
- Request cards stack vertically
- Approve/reject buttons work
- Dialogs are mobile-friendly

#### Test 6.5: Draft Rides Tab Mobile
**Steps**:
1. Open Draft Rides tab on mobile
2. Test ride cards

**Expected**:
- Ride cards stack vertically
- Publish/reject buttons work
- Details are readable

---

### 7. Error Handling

#### Test 7.1: Network Error
**Steps**:
1. Disconnect network
2. Try to save settings
3. Try to approve request

**Expected**:
- Error toast appears
- User-friendly error message
- Can retry after reconnecting

#### Test 7.2: Authorization Error
**Steps**:
1. Log in as member
2. Try to access management URL directly

**Expected**:
- 403 error page shows
- Clear error message
- "Back to Club" button works

#### Test 7.3: Validation Error
**Steps**:
1. Try to save settings with invalid data
2. Try to remove last owner

**Expected**:
- Validation error shows
- Clear error message
- Form doesn't submit

---

### 8. Performance

#### Test 8.1: Loading States
**Steps**:
1. Open management hub
2. Watch for loading indicators

**Expected**:
- Loading spinner shows while fetching
- Smooth transition to content
- No layout shift

#### Test 8.2: Cache Invalidation
**Steps**:
1. Approve a request
2. Check if badge count updates
3. Navigate away and back

**Expected**:
- Badge count updates immediately
- Data stays fresh
- No stale data shown

#### Test 8.3: Optimistic Updates
**Steps**:
1. Change member role
2. Watch UI update

**Expected**:
- UI updates immediately
- Reverts if error occurs
- Smooth user experience

---

## Test Results Template

```markdown
## Test Results - Phase 3.4

**Date**: [Date]  
**Tester**: [Name]  
**Environment**: [localhost/production]

### Settings Page
- [ ] Owner access works
- [ ] Admin access works
- [ ] Captain/Leader/Member blocked
- [ ] Form validation works
- [ ] Character counters work
- [ ] Save changes works

### Management Hub
- [ ] Owner/Admin access works
- [ ] Captain/Leader access works
- [ ] Member blocked
- [ ] Badge counts accurate
- [ ] Tab navigation works

### Members Tab
- [ ] Member list loads
- [ ] Search works
- [ ] Filter works
- [ ] Promote member works
- [ ] Demote member works
- [ ] Remove member works
- [ ] Last owner protected

### Requests Tab
- [ ] Requests list loads
- [ ] Approve works
- [ ] Reject works
- [ ] Empty state shows
- [ ] Conditional visibility works

### Draft Rides Tab
- [ ] Draft rides load
- [ ] Publish works
- [ ] Reject works
- [ ] View details works
- [ ] Empty state shows

### Mobile
- [ ] Settings page responsive
- [ ] Management hub responsive
- [ ] All tabs work on mobile

### Errors
- [ ] Network errors handled
- [ ] Authorization errors handled
- [ ] Validation errors handled

### Performance
- [ ] Loading states work
- [ ] Cache invalidation works
- [ ] Optimistic updates work

**Overall Status**: [PASS/FAIL]  
**Issues Found**: [List any issues]  
**Notes**: [Additional observations]
```

---

## Common Issues & Solutions

### Issue: Badge count not updating
**Solution**: Check React Query cache invalidation in mutation hooks

### Issue: 403 error for authorized user
**Solution**: Verify user membership status is 'active'

### Issue: Form not submitting
**Solution**: Check validation rules and required fields

### Issue: Tabs not switching
**Solution**: Check URL state sync and tab value matching

### Issue: Mobile layout broken
**Solution**: Check responsive classes and breakpoints

---

## Next Steps After Testing

1. **Document Issues** - Create tickets for any bugs found
2. **Fix Critical Issues** - Address blocking issues immediately
3. **Deploy to Production** - Use `./scripts/deploy-frontend.sh`
4. **Monitor** - Watch for errors in production
5. **Gather Feedback** - Get input from real club operators

---

**Testing Status**: Ready for manual testing  
**Estimated Testing Time**: 2-3 hours for complete coverage
