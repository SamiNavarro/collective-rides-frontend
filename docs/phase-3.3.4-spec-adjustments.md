# Phase 3.3.4 Spec Adjustments

**Date:** February 2, 2026  
**Status:** ✅ Complete - Ready for Implementation

---

## Summary

Applied 4 critical adjustments to Phase 3.3.4 spec based on user review. These tighten ambiguity and prevent scope creep without changing core functionality.

---

## Adjustment 1: Removed Participant Notification Claims ✅

**Problem:** Spec mentioned "participants will be notified" but notifications are Phase 3.1 feature.

**Changes Made:**

1. **User Story AC-2.11:** Added explicit note that notifications deferred to Phase 3.1
2. **Cancel Dialog Description:** Changed from "notify all participants" to "mark it as cancelled. Members will see the updated status"
3. **Toast Message:** Changed from "Participants will be notified" to "Members will see the updated status"
4. **Backend Business Rules:** Changed "Participants notified (Phase 3.1+ feature)" to "Participant notifications deferred to Phase 3.1"
5. **Type Definition:** Removed `notifyParticipants` field from `CancelRideRequest` interface
6. **API Example:** Added comment that backend may accept field but notifications not implemented

**Result:** UI is honest about what it does. No false promises.

---

## Adjustment 2: Clarified Update Semantics ✅

**Problem:** Backend supports partial updates, but form is full-form. Ambiguity about what gets sent.

**Solution:** Added "Update Semantics" section with clear contract:

**UI Behavior:**
- Form submits full normalized payload (all fields from form state)
- Empty optional fields sent as `undefined` (not included in request)
- Backend treats request as partial update (only updates provided fields)
- UI does not rely on partial update behavior - always sends complete form state

**Why This Works:**
- Simpler form logic (no field-level dirty tracking)
- Avoids "field cleared because user left it empty" bugs
- Backend handles partial update semantics transparently
- Form pre-population ensures all fields have values

**Result:** Clear contract prevents implementation confusion.

---

## Adjustment 3: Removed Optimistic Locking Claim ✅

**Problem:** Spec claimed "backend handles with optimistic locking" but this isn't implemented in Phase 2.3.

**Changes Made:**

1. **Concurrent Edits Error Handling:** Changed from "Backend handles with optimistic locking" to "Backend may return 409 Conflict if ride was modified"
2. **Added Note:** "Optimistic locking not implemented in Phase 2.3 - handle 409 generically"

**Result:** No phantom requirements. Handle 409 errors generically without assuming versioning exists.

---

## Adjustment 4: Clarified Cancelled Ride Listing Behavior ✅

**Problem:** Ambiguity about whether cancelled rides appear in default "Upcoming" list.

**Decision:** Cancelled rides excluded from default view to prevent clutter.

**Changes Made:**

1. **User Story AC-3.1:** Changed from "show in ride listings with badge" to "excluded from default 'Upcoming' list"
2. **User Story AC-3.2:** Changed from "show cancellation reason" to "visible when filter includes cancelled status"
3. **Added Section:** "Cancelled Ride Listing Behavior" with implementation example

**Default Behavior:**
- Default ride listings show only `published` rides (upcoming)
- Cancelled rides excluded from default view
- Prevents clutter and user confusion

**Filtered View:**
- User can explicitly filter to include cancelled rides
- Cancelled rides appear with prominent "Cancelled" badge
- Useful for historical reference and record-keeping

**Result:** Clear product decision prevents UI confusion.

---

## Additional Implementation Notes Added ✅

Added "Implementation Notes" section covering:

### Timezone Handling
- Backend stores UTC timestamps (ISO 8601 format)
- Frontend compares using `new Date()` which handles local timezone
- Comparison is timezone-safe

### API Client DELETE with Body
- Verify `apiClient.delete()` forwards request config correctly
- Axios syntax: `axios.delete(url, { data: { reason } })`
- Test cancel request includes reason in backend logs

### Dialog State Management
- Cancel reason state scoped inside dialog component
- State resets when dialog closes
- Prevents stale reason text on re-open

**Result:** Implementation gotchas documented upfront.

---

## What Stayed the Same

✅ Core scope: edit + cancel only  
✅ Authorization rules  
✅ Business rules (no edit after start, cancel is final)  
✅ Component reuse strategy (RideForm with mode prop)  
✅ UI placements (edit/cancel buttons on ride detail)  
✅ Cache invalidation strategy  
✅ Time estimate (5-6 hours)  

---

## Spec Status

**Before Adjustments:** Strong but had 4 ambiguities  
**After Adjustments:** Production-ready, no ambiguity  
**Ready for Implementation:** ✅ Yes  

---

## Files Modified

- `.kiro/specs/phase-3.3.4-ride-management.v1.md` - All adjustments applied

---

## Next Steps

1. ✅ Spec adjustments complete
2. 🔄 Ready for implementation
3. ⏳ Estimated: 5-6 hours
4. ⏳ Testing and verification

---

**Adjustments Complete** ✅  
**Spec Quality:** Production-ready  
**Implementation Risk:** Low (backend exists, UI additions only)
