# Phase 3.3.3 Testing Guide

**Date:** February 2, 2026  
**Status:** Ready for Testing  
**Fixes Applied:** ✅ Publish endpoint, ✅ Membership verification

---

## Prerequisites

1. **Backend Running:**
   ```bash
   # Backend should already be deployed
   # API URL: https://your-api-gateway-url.amazonaws.com/prod
   ```

2. **Frontend Running:**
   ```bash
   npm run dev
   # Should be running on http://localhost:3000
   ```

3. **Test User:**
   - You should be signed in as an active member of Attaquer.cc
   - Club ID: `attaquercc`
   - Club URL: `http://localhost:3000/clubs/attaquercc`

---

## Test 1: Create Draft Ride

### Steps

1. **Navigate to Club:**
   ```
   http://localhost:3000/clubs/attaquercc
   ```

2. **Click "Create Ride" Button:**
   - Should be visible in the club header or empty state
   - Should navigate to: `http://localhost:3000/clubs/attaquercc/rides/new`

3. **Fill Out Form:**
   - **Title:** "Morning Coffee Ride"
   - **Start Date:** Tomorrow's date
   - **Start Time:** 07:00
   - **Meeting Point Name:** "Celsius Coffee"
   - **Meeting Point Address:** "Circular Quay, Sydney"
   - **Description:** (optional) "Easy social ride to start the day"
   - **Ride Type:** Training (pre-selected)
   - **Difficulty:** Intermediate (pre-selected)
   - **Duration:** 120 minutes (default)

4. **Click "Save as Draft":**
   - Should see loading spinner
   - Should navigate to ride detail page
   - URL format: `http://localhost:3000/clubs/attaquercc/rides/{rideId}`

### Expected Results

✅ Form validation works (try submitting empty form first)  
✅ Draft created successfully  
✅ Toast notification: "Draft Saved"  
✅ Navigate to ride detail page  
✅ Draft badge visible  
✅ Publish button visible (if you have leadership role)  

---

## Test 2: Publish Draft Ride

### Steps

1. **From Draft Ride Detail Page:**
   - Should see yellow "Draft" badge
   - Should see "Publish Ride" button (if leadership)

2. **Click "Publish Ride":**
   - Confirmation dialog should appear
   - Message: "This will make the ride visible to all club members..."

3. **Confirm Publish:**
   - Click "Publish Ride" in dialog
   - Should see loading state

### Expected Results

✅ Confirmation dialog appears  
✅ Publish request succeeds (no "Failed to fetch" error)  
✅ Toast notification: "Ride Published"  
✅ Badge changes from "Draft" to "Published"  
✅ Ride status updates on page  
✅ Join button becomes available  

### If This Fails

Check browser console for errors. The publish endpoint should now work correctly with `POST` method.

---

## Test 3: Membership Verification

### Test 3a: As Active Member

1. **Navigate to Create Ride:**
   ```
   http://localhost:3000/clubs/attaquercc/rides/new
   ```

2. **Expected:**
   - ✅ Form loads successfully
   - ✅ Can fill out and submit form
   - ✅ No error messages

### Test 3b: As Non-Member

1. **Sign out or use different account**
2. **Navigate to Create Ride:**
   ```
   http://localhost:3000/clubs/attaquercc/rides/new
   ```

3. **Expected:**
   - ✅ Error message: "You must be an active member of this club to create rides"
   - ✅ Form not visible

### Test 3c: Not Signed In

1. **Sign out**
2. **Navigate to Create Ride:**
   ```
   http://localhost:3000/clubs/attaquercc/rides/new
   ```

3. **Expected:**
   - ✅ Error message: "You must be signed in to create rides"
   - ✅ Form not visible

---

## Test 4: Create and Publish Immediately (Leadership Only)

### Steps

1. **Navigate to Create Ride:**
   ```
   http://localhost:3000/clubs/attaquercc/rides/new
   ```

2. **Fill Out Form:**
   - Same as Test 1
   - **Check "Publish immediately" checkbox** (if visible)

3. **Click "Publish Ride":**
   - Should see loading spinner
   - Should navigate to ride detail page

### Expected Results

✅ "Publish immediately" checkbox visible (leadership only)  
✅ Ride created with status: "published"  
✅ Toast notification: "Ride Published"  
✅ Navigate to ride detail page  
✅ Published badge visible (not draft)  
✅ Join button available immediately  

---

## Test 5: Form Validation

### Test Invalid Inputs

1. **Empty Form:**
   - Click "Save as Draft" without filling anything
   - Should see validation errors on required fields

2. **Past Date:**
   - Select yesterday's date
   - Should see error: "Start date must be in the future"

3. **Invalid Duration:**
   - Enter 0 or negative number
   - Should see validation error

4. **Title Too Long:**
   - Enter 101+ characters
   - Should see error: "Title must be 100 characters or less"

### Expected Results

✅ All required fields validated  
✅ Past dates rejected  
✅ Invalid values rejected  
✅ Error messages clear and helpful  
✅ Form doesn't submit with errors  

---

## Test 6: Navigation Flow

### Test Cancel Button

1. **Navigate to Create Ride**
2. **Fill out some fields**
3. **Click "Cancel"**

### Expected Results

✅ Navigate back to club detail page  
✅ No ride created  
✅ No error messages  

### Test Post-Create Navigation

1. **Create draft ride**
2. **Should navigate to ride detail page**
3. **URL should be:** `/clubs/{clubId}/rides/{rideId}`

### Expected Results

✅ Always navigate to ride detail page  
✅ Never stay on create page  
✅ Never navigate to rides list  

---

## Test 7: Mobile Responsiveness

### Steps

1. **Open DevTools**
2. **Toggle device toolbar** (Cmd+Shift+M on Mac)
3. **Select iPhone or Android device**
4. **Test create ride flow**

### Expected Results

✅ Form fields stack vertically  
✅ Buttons full width on mobile  
✅ Date/time pickers work on mobile  
✅ No horizontal scrolling  
✅ Text readable without zooming  

---

## Common Issues and Solutions

### Issue: "Failed to fetch" on Publish

**Cause:** HTTP method mismatch (should be fixed now)  
**Solution:** Verify `lib/api/api-client.ts` uses `POST` method  
**Check:** Browser console for actual error

### Issue: "You must be an active member" Error

**Cause:** Membership verification working correctly  
**Solution:** Ensure you're signed in and member of the club  
**Check:** Visit `/my-clubs` to see your memberships

### Issue: Publish Button Not Visible

**Cause:** User doesn't have leadership role  
**Solution:** This is expected behavior for regular members  
**Check:** Only owner, admin, ride_captain, ride_leader can publish

### Issue: Form Doesn't Submit

**Cause:** Validation errors  
**Solution:** Check all required fields are filled  
**Check:** Look for red error messages under fields

---

## Success Criteria

Phase 3.3.3 is fully working when:

1. ✅ Any active member can create draft rides
2. ✅ Draft rides save successfully
3. ✅ Navigation to ride detail page works
4. ✅ Leadership can publish draft rides
5. ✅ Publish endpoint works (no fetch errors)
6. ✅ Membership verification works correctly
7. ✅ Form validation prevents invalid data
8. ✅ Toast notifications appear
9. ✅ Mobile responsive (needs testing)

---

## Next Steps After Testing

1. **If all tests pass:**
   - Mark Phase 3.3.3 as complete
   - Update implementation summary
   - Move to Phase 3.3.4 (Edit/Cancel rides)

2. **If issues found:**
   - Document specific failures
   - Check browser console for errors
   - Review backend logs if needed
   - Apply fixes and retest

---

## Quick Test Commands

```bash
# Start frontend
npm run dev

# Check if backend is accessible
curl https://your-api-gateway-url.amazonaws.com/prod/health

# View browser console
# Chrome: Cmd+Option+J (Mac) or Ctrl+Shift+J (Windows)
# Firefox: Cmd+Option+K (Mac) or Ctrl+Shift+K (Windows)
```

---

## Test Data

**Test Club:**
- ID: `attaquercc`
- Name: Attaquer.cc
- URL: `http://localhost:3000/clubs/attaquercc`

**Test Ride Data:**
- Title: "Morning Coffee Ride"
- Date: Tomorrow
- Time: 07:00
- Meeting Point: "Celsius Coffee, Circular Quay"
- Type: Training
- Difficulty: Intermediate
- Duration: 120 minutes

---

**Happy Testing! 🚴‍♂️**
