# Phase 3.3.4 Testing Guide

**Date:** February 2, 2026  
**Status:** Ready for Testing  
**Phase:** Ride Management (Edit/Cancel)

---

## Overview

This guide provides step-by-step testing instructions for Phase 3.3.4 - Ride Management functionality. Test both edit and cancel flows, authorization rules, and edge cases.

---

## Prerequisites

### Test Environment
- Localhost running on `http://localhost:3000`
- Backend deployed and accessible
- Test user authenticated

### Test User Context
- **User:** Attaquer.cc member
- **Club:** Attaquer.cc (clubId: `attaquercc`)
- **Membership Role:** Check your role (member, ride_leader, ride_captain, admin, or owner)
- **Test Rides:** Need at least 2 rides:
  1. One you created (to test creator permissions)
  2. One created by someone else (to test leadership permissions)

### Setup Test Rides

If you need test rides, create them via the UI:
1. Navigate to `/clubs/attaquercc/rides/new`
2. Create a ride scheduled for tomorrow
3. Publish it
4. Note the ride ID from the URL

---

## Test Suite 1: Edit Ride - Happy Path

### Test 1.1: Edit Own Ride (Creator)

**Objective:** Verify ride creator can edit their own ride

**Steps:**
1. Navigate to a ride you created: `/clubs/attaquercc/rides/[rideId]`
2. Verify "Edit Ride" button is visible
3. Click "Edit Ride" button
4. Verify navigation to `/clubs/attaquercc/rides/[rideId]/edit`
5. Verify form is pre-populated with current values:
   - Title
   - Description
   - Ride type
   - Difficulty
   - Date and time
   - Duration
   - Max participants
   - Meeting point
   - Route details
6. Make changes:
   - Change title to "Updated Ride Title"
   - Change description
   - Change duration
7. Click "Save Changes"
8. Verify:
   - Navigation back to ride detail page
   - Toast notification: "Ride Updated - Your changes have been saved"
   - Updated values displayed on ride detail page

**Expected Result:** ✅ Edit successful, changes visible immediately

---

### Test 1.2: Edit Ride as Leadership

**Objective:** Verify club leadership can edit any ride

**Prerequisites:** You must have leadership role (ride_leader, ride_captain, admin, or owner)

**Steps:**
1. Navigate to a ride created by someone else: `/clubs/attaquercc/rides/[rideId]`
2. Verify "Edit Ride" button is visible
3. Click "Edit Ride" button
4. Verify form is pre-populated
5. Make changes to title
6. Click "Save Changes"
7. Verify changes saved successfully

**Expected Result:** ✅ Leadership can edit any club ride

---

### Test 1.3: Edit All Fields

**Objective:** Verify all fields can be edited

**Steps:**
1. Navigate to edit page for a ride you can edit
2. Change every field:
   - Title: "Comprehensive Edit Test"
   - Description: "Testing all field updates"
   - Ride Type: Change to different type
   - Difficulty: Change to different level
   - Date: Change to different date
   - Time: Change to different time
   - Duration: Change to 180 minutes
   - Max Participants: Change to 15
   - Meeting Point Name: "New Meeting Point"
   - Meeting Point Address: "123 New St"
   - Meeting Point Instructions: "New instructions"
   - Route Name: "New Route Name"
   - Route Distance: 75 km
3. Click "Save Changes"
4. Verify all changes saved correctly

**Expected Result:** ✅ All fields update successfully

---

## Test Suite 2: Edit Ride - Authorization

### Test 2.1: No Edit Button for Non-Members

**Objective:** Verify non-members cannot edit rides

**Steps:**
1. Log out
2. Navigate to a ride detail page (if accessible)
3. Verify "Edit Ride" button is NOT visible

**Expected Result:** ✅ Edit button hidden for non-authenticated users

---

### Test 2.2: No Edit Button for Regular Members

**Objective:** Verify regular members cannot edit rides they didn't create

**Prerequisites:** You must be a regular member (not leadership)

**Steps:**
1. Navigate to a ride created by someone else
2. Verify "Edit Ride" button is NOT visible

**Expected Result:** ✅ Edit button hidden for non-authorized members

---

### Test 2.3: Direct URL Access Blocked

**Objective:** Verify direct navigation to edit page is blocked for unauthorized users

**Steps:**
1. Find a ride you cannot edit (created by someone else, and you're not leadership)
2. Try to navigate directly to: `/clubs/attaquercc/rides/[rideId]/edit`
3. Verify error message: "You don't have permission to edit this ride"
4. Verify form is NOT displayed

**Expected Result:** ✅ Authorization enforced at page level

---

## Test Suite 3: Edit Ride - Time Restrictions

### Test 3.1: Cannot Edit After Start Time

**Objective:** Verify rides cannot be edited after start time

**Setup:** Need a ride that has already started (start time in the past)

**Steps:**
1. Navigate to a ride that has started
2. Verify "Edit Ride" button is NOT visible
3. Try direct URL access: `/clubs/attaquercc/rides/[rideId]/edit`
4. Verify error message or redirect

**Expected Result:** ✅ Cannot edit rides after start time

---

### Test 3.2: Cannot Edit Completed Rides

**Objective:** Verify completed rides cannot be edited

**Setup:** Need a ride with status "completed"

**Steps:**
1. Navigate to a completed ride
2. Verify "Edit Ride" button is NOT visible

**Expected Result:** ✅ Cannot edit completed rides

---

### Test 3.3: Cannot Edit Cancelled Rides

**Objective:** Verify cancelled rides cannot be edited

**Setup:** Need a ride with status "cancelled"

**Steps:**
1. Navigate to a cancelled ride
2. Verify "Edit Ride" button is NOT visible

**Expected Result:** ✅ Cannot edit cancelled rides

---

## Test Suite 4: Cancel Ride - Happy Path

### Test 4.1: Cancel Own Ride (Creator)

**Objective:** Verify ride creator can cancel their own ride

**Steps:**
1. Navigate to a ride you created: `/clubs/attaquercc/rides/[rideId]`
2. Verify "Cancel Ride" button is visible (red/destructive style)
3. Click "Cancel Ride" button
4. Verify confirmation dialog appears:
   - Title: "Cancel this ride?"
   - Description mentions ride will be cancelled and remain visible
   - Reason textarea (optional)
   - "Keep Ride" button
   - "Cancel Ride" button (red)
5. Enter cancellation reason: "Testing cancellation flow"
6. Click "Cancel Ride" button in dialog
7. Verify:
   - Dialog closes
   - Toast notification: "Ride Cancelled - Ride cancelled. Members will see the updated status."
   - Cancelled alert card appears (red border)
   - Cancelled badge visible
   - Cancellation reason displayed
   - "Edit Ride" button hidden
   - "Cancel Ride" button hidden
   - "Join Ride" / "Leave Ride" buttons hidden

**Expected Result:** ✅ Ride cancelled successfully, UI updates immediately

---

### Test 4.2: Cancel Without Reason

**Objective:** Verify cancellation works without reason (optional field)

**Steps:**
1. Navigate to a ride you can cancel
2. Click "Cancel Ride" button
3. Leave reason field empty
4. Click "Cancel Ride" in dialog
5. Verify cancellation succeeds
6. Verify cancelled alert shows but no reason text

**Expected Result:** ✅ Reason is optional, cancellation works without it

---

### Test 4.3: Cancel Ride as Leadership

**Objective:** Verify club leadership can cancel any ride

**Prerequisites:** You must have leadership role

**Steps:**
1. Navigate to a ride created by someone else
2. Verify "Cancel Ride" button is visible
3. Cancel the ride with reason: "Leadership cancellation test"
4. Verify cancellation succeeds

**Expected Result:** ✅ Leadership can cancel any club ride

---

## Test Suite 5: Cancel Ride - Authorization

### Test 5.1: No Cancel Button for Non-Members

**Objective:** Verify non-members cannot cancel rides

**Steps:**
1. Log out
2. Navigate to a ride detail page (if accessible)
3. Verify "Cancel Ride" button is NOT visible

**Expected Result:** ✅ Cancel button hidden for non-authenticated users

---

### Test 5.2: No Cancel Button for Regular Members

**Objective:** Verify regular members cannot cancel rides they didn't create

**Prerequisites:** You must be a regular member (not leadership)

**Steps:**
1. Navigate to a ride created by someone else
2. Verify "Cancel Ride" button is NOT visible

**Expected Result:** ✅ Cancel button hidden for non-authorized members

---

## Test Suite 6: Cancel Ride - Status Restrictions

### Test 6.1: Cannot Cancel Active Rides

**Objective:** Verify active rides cannot be cancelled

**Setup:** Need a ride with status "active"

**Steps:**
1. Navigate to an active ride
2. Verify "Cancel Ride" button is NOT visible

**Expected Result:** ✅ Cannot cancel active rides

---

### Test 6.2: Cannot Cancel Completed Rides

**Objective:** Verify completed rides cannot be cancelled

**Setup:** Need a ride with status "completed"

**Steps:**
1. Navigate to a completed ride
2. Verify "Cancel Ride" button is NOT visible

**Expected Result:** ✅ Cannot cancel completed rides

---

### Test 6.3: Cannot Cancel Already Cancelled Rides

**Objective:** Verify already cancelled rides cannot be cancelled again

**Steps:**
1. Navigate to a cancelled ride
2. Verify "Cancel Ride" button is NOT visible

**Expected Result:** ✅ Cannot cancel already cancelled rides

---

## Test Suite 7: Cancelled Ride Display

### Test 7.1: Cancelled Ride Visual Indicators

**Objective:** Verify cancelled rides display correctly

**Steps:**
1. Navigate to a cancelled ride
2. Verify visual indicators:
   - Red "Cancelled" badge on status
   - Cancelled alert card with red border
   - Cancellation reason displayed (if provided)
   - Cancelled date displayed
   - Original ride details still visible
3. Verify hidden elements:
   - "Edit Ride" button NOT visible
   - "Cancel Ride" button NOT visible
   - "Join Ride" button NOT visible
   - "Leave Ride" button NOT visible
4. Verify visible elements:
   - Ride title, description, details
   - Participant list (historical record)
   - Meeting point information
   - Route information

**Expected Result:** ✅ Cancelled rides display correctly with proper visual indicators

---

### Test 7.2: Cancelled Ride in Listings

**Objective:** Verify cancelled rides excluded from default listings

**Steps:**
1. Cancel a ride
2. Navigate to `/rides` page
3. Verify cancelled ride does NOT appear in default "Upcoming" list
4. Navigate to `/clubs/attaquercc` page
5. Verify cancelled ride does NOT appear in club's upcoming rides

**Expected Result:** ✅ Cancelled rides excluded from default listings

---

## Test Suite 8: Dialog Behavior

### Test 8.1: Cancel Dialog Closes on "Keep Ride"

**Objective:** Verify cancel dialog closes without action

**Steps:**
1. Navigate to a ride you can cancel
2. Click "Cancel Ride" button
3. Enter some text in reason field
4. Click "Keep Ride" button
5. Verify dialog closes
6. Verify ride is NOT cancelled

**Expected Result:** ✅ Dialog closes, no action taken

---

### Test 8.2: Cancel Reason Resets on Dialog Close

**Objective:** Verify cancel reason resets when dialog closes

**Steps:**
1. Navigate to a ride you can cancel
2. Click "Cancel Ride" button
3. Enter text in reason field: "Test reason"
4. Click "Keep Ride" to close dialog
5. Click "Cancel Ride" button again
6. Verify reason field is empty (reset)

**Expected Result:** ✅ Reason field resets on dialog close

---

## Test Suite 9: Form Validation

### Test 9.1: Edit Form Validation

**Objective:** Verify edit form validates required fields

**Steps:**
1. Navigate to edit page for a ride
2. Clear the title field
3. Try to submit
4. Verify validation error appears
5. Clear other required fields and verify validation

**Expected Result:** ✅ Form validation works same as create ride

---

## Test Suite 10: Error Handling

### Test 10.1: Network Error on Edit

**Objective:** Verify graceful handling of network errors

**Steps:**
1. Navigate to edit page
2. Disconnect from network (or use browser dev tools to simulate offline)
3. Make changes and try to save
4. Verify error toast appears
5. Verify form state preserved (changes not lost)

**Expected Result:** ✅ Error handled gracefully, form state preserved

---

### Test 10.2: Network Error on Cancel

**Objective:** Verify graceful handling of network errors

**Steps:**
1. Navigate to ride detail page
2. Disconnect from network
3. Try to cancel ride
4. Verify error toast appears
5. Verify dialog remains open
6. Verify reason text preserved

**Expected Result:** ✅ Error handled gracefully, dialog state preserved

---

## Test Suite 11: Mobile Responsiveness

### Test 11.1: Edit Page on Mobile

**Objective:** Verify edit page works on mobile devices

**Steps:**
1. Open browser dev tools
2. Switch to mobile device view (iPhone or Android)
3. Navigate to edit page
4. Verify:
   - Form fields are accessible
   - Buttons are tappable
   - Date/time inputs work
   - Form is scrollable
   - Submit button accessible

**Expected Result:** ✅ Edit page is mobile-friendly

---

### Test 11.2: Cancel Dialog on Mobile

**Objective:** Verify cancel dialog works on mobile

**Steps:**
1. Switch to mobile device view
2. Navigate to ride detail page
3. Click "Cancel Ride" button
4. Verify:
   - Dialog displays correctly
   - Reason textarea is accessible
   - Buttons are tappable
   - Dialog is scrollable if needed

**Expected Result:** ✅ Cancel dialog is mobile-friendly

---

## Test Suite 12: Edge Cases

### Test 12.1: Edit Ride with Participants

**Objective:** Verify editing works for rides with participants

**Setup:** Need a ride with at least one participant

**Steps:**
1. Navigate to a ride with participants
2. Edit the ride (change title)
3. Save changes
4. Verify:
   - Changes saved successfully
   - Participant list unchanged
   - Participant count unchanged

**Expected Result:** ✅ Editing preserves participant data

---

### Test 12.2: Cancel Ride with Participants

**Objective:** Verify cancelling works for rides with participants

**Setup:** Need a ride with at least one participant

**Steps:**
1. Navigate to a ride with participants
2. Cancel the ride
3. Verify:
   - Cancellation succeeds
   - Participant list still visible (historical record)
   - Participants cannot leave cancelled ride

**Expected Result:** ✅ Cancelling preserves participant data for history

---

### Test 12.3: Edit Draft Ride

**Objective:** Verify draft rides can be edited

**Setup:** Need a draft ride (not published)

**Steps:**
1. Navigate to a draft ride
2. Verify "Edit Ride" button is visible
3. Edit the ride
4. Save changes
5. Verify changes saved successfully

**Expected Result:** ✅ Draft rides can be edited

---

### Test 12.4: Cancel Draft Ride

**Objective:** Verify draft rides can be cancelled

**Setup:** Need a draft ride

**Steps:**
1. Navigate to a draft ride
2. Verify "Cancel Ride" button is visible
3. Cancel the ride
4. Verify cancellation succeeds

**Expected Result:** ✅ Draft rides can be cancelled

---

## Test Suite 13: Cache Invalidation

### Test 13.1: Edit Updates All Views

**Objective:** Verify edit invalidates cache correctly

**Steps:**
1. Open ride detail page in one tab
2. Open `/rides` page in another tab
3. Edit the ride from first tab
4. Refresh second tab
5. Verify updated ride appears in listings

**Expected Result:** ✅ Cache invalidated, changes visible everywhere

---

### Test 13.2: Cancel Updates All Views

**Objective:** Verify cancel invalidates cache correctly

**Steps:**
1. Open ride detail page in one tab
2. Open `/rides` page in another tab
3. Cancel the ride from first tab
4. Refresh second tab
5. Verify cancelled ride removed from default listings

**Expected Result:** ✅ Cache invalidated, cancelled ride excluded

---

## Test Suite 14: Toast Notifications

### Test 14.1: Edit Success Toast

**Objective:** Verify edit success toast appears

**Steps:**
1. Edit a ride successfully
2. Verify toast notification:
   - Title: "Ride Updated"
   - Description: "Your changes have been saved."
   - Style: Success (green)

**Expected Result:** ✅ Success toast appears

---

### Test 14.2: Edit Error Toast

**Objective:** Verify edit error toast appears

**Steps:**
1. Simulate edit error (disconnect network)
2. Try to edit ride
3. Verify toast notification:
   - Title: "Failed to Update Ride"
   - Description: Error message
   - Style: Destructive (red)

**Expected Result:** ✅ Error toast appears

---

### Test 14.3: Cancel Success Toast

**Objective:** Verify cancel success toast appears

**Steps:**
1. Cancel a ride successfully
2. Verify toast notification:
   - Title: "Ride Cancelled"
   - Description: "Ride cancelled. Members will see the updated status."
   - Style: Success (green)

**Expected Result:** ✅ Success toast appears with correct message (no false notification promises)

---

### Test 14.4: Cancel Error Toast

**Objective:** Verify cancel error toast appears

**Steps:**
1. Simulate cancel error (disconnect network)
2. Try to cancel ride
3. Verify toast notification:
   - Title: "Failed to Cancel Ride"
   - Description: Error message
   - Style: Destructive (red)

**Expected Result:** ✅ Error toast appears

---

## Test Suite 15: Integration Tests

### Test 15.1: Complete Ride Lifecycle

**Objective:** Test complete ride lifecycle from create to cancel

**Steps:**
1. Create a new ride (draft)
2. Edit the draft ride
3. Publish the ride
4. Edit the published ride
5. Cancel the ride
6. Verify cancelled state

**Expected Result:** ✅ Complete lifecycle works smoothly

---

### Test 15.2: Multiple Edits

**Objective:** Verify multiple edits work correctly

**Steps:**
1. Create a ride
2. Edit it (change title)
3. Edit it again (change description)
4. Edit it again (change date)
5. Verify all changes persisted

**Expected Result:** ✅ Multiple edits work correctly

---

## Quick Smoke Test

**For rapid verification after deployment:**

1. ✅ Edit own ride - changes save
2. ✅ Cancel own ride - status updates
3. ✅ Cancelled ride displays correctly
4. ✅ Cannot edit after start time
5. ✅ Cannot cancel completed ride
6. ✅ Toast notifications appear
7. ✅ Mobile responsive

**Time:** ~10 minutes

---

## Test Results Template

```markdown
## Phase 3.3.4 Test Results

**Date:** [Date]  
**Tester:** [Name]  
**Environment:** [localhost/production]

### Edit Ride Tests
- [ ] Test 1.1: Edit Own Ride - PASS/FAIL
- [ ] Test 1.2: Edit as Leadership - PASS/FAIL
- [ ] Test 1.3: Edit All Fields - PASS/FAIL

### Authorization Tests
- [ ] Test 2.1: No Edit for Non-Members - PASS/FAIL
- [ ] Test 2.2: No Edit for Regular Members - PASS/FAIL
- [ ] Test 2.3: Direct URL Blocked - PASS/FAIL

### Time Restriction Tests
- [ ] Test 3.1: Cannot Edit After Start - PASS/FAIL
- [ ] Test 3.2: Cannot Edit Completed - PASS/FAIL
- [ ] Test 3.3: Cannot Edit Cancelled - PASS/FAIL

### Cancel Ride Tests
- [ ] Test 4.1: Cancel Own Ride - PASS/FAIL
- [ ] Test 4.2: Cancel Without Reason - PASS/FAIL
- [ ] Test 4.3: Cancel as Leadership - PASS/FAIL

### Cancel Authorization Tests
- [ ] Test 5.1: No Cancel for Non-Members - PASS/FAIL
- [ ] Test 5.2: No Cancel for Regular Members - PASS/FAIL

### Cancel Status Tests
- [ ] Test 6.1: Cannot Cancel Active - PASS/FAIL
- [ ] Test 6.2: Cannot Cancel Completed - PASS/FAIL
- [ ] Test 6.3: Cannot Cancel Cancelled - PASS/FAIL

### Display Tests
- [ ] Test 7.1: Cancelled Visual Indicators - PASS/FAIL
- [ ] Test 7.2: Cancelled in Listings - PASS/FAIL

### Dialog Tests
- [ ] Test 8.1: Dialog Closes on Keep - PASS/FAIL
- [ ] Test 8.2: Reason Resets - PASS/FAIL

### Mobile Tests
- [ ] Test 11.1: Edit Page Mobile - PASS/FAIL
- [ ] Test 11.2: Cancel Dialog Mobile - PASS/FAIL

### Issues Found
[List any issues discovered]

### Notes
[Any additional observations]
```

---

## Common Issues & Solutions

### Issue: Edit button not visible
**Solution:** Check authorization - are you the creator or leadership?

### Issue: Cannot save changes
**Solution:** Check network connection, check browser console for errors

### Issue: Cancel dialog doesn't close
**Solution:** Check browser console for errors, verify dialog state management

### Issue: Cancelled ride still in listings
**Solution:** Refresh page, check filter settings, verify cache invalidation

### Issue: Toast notifications not appearing
**Solution:** Check toast provider is configured, check browser console

---

## Next Steps After Testing

1. Document all test results
2. Fix any issues found
3. Retest failed cases
4. Deploy to production
5. Monitor for errors
6. Gather user feedback

---

**Testing Complete** ✅  
**Ready for Production** ⏳

