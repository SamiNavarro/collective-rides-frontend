# Phase 3.3 Pre-Flight Checklist

**Date**: January 20, 2026  
**Status**: ✅ Ready for Takeoff

## Critical Backend Contract Verification

### Ride Detail Response ✅
**Endpoint**: `GET /v1/clubs/{clubId}/rides/{rideId}`

**Required Fields Verified**:
- ✅ `clubId` - For navigation back to club
- ✅ `status` - For CTA rules (completed/cancelled = no CTA)
- ✅ `currentParticipants` - For capacity display
- ✅ `maxParticipants` - For capacity checks (optional)
- ✅ `viewerParticipation` - For leave ride action (Phase 3.3 enhancement)

**Response Structure**:
```typescript
{
  success: true,
  data: {
    rideId: string;
    clubId: string;              // ✅ Navigation
    title: string;
    status: RideStatus;          // ✅ CTA rules
    currentParticipants: number; // ✅ Capacity display
    maxParticipants?: number;    // ✅ Capacity checks
    // ... all other ride fields
    participants: [...],
    waitlist: [...],
    viewerParticipation?: {      // ✅ Leave action
      participationId: string;
      role: RideRole;
      status: ParticipationStatus;
      joinedAt: string;
    }
  }
}
```

### Ride List Response ✅
**Endpoint**: `GET /v1/clubs/{clubId}/rides`

**Required Fields Verified**:
- ✅ `rideId` - For navigation
- ✅ `clubId` - For club context
- ✅ `title` - For card display
- ✅ `startDateTime` - For sorting/filtering
- ✅ `status` - For filtering (published only)
- ✅ `currentParticipants` - For card display
- ✅ `maxParticipants` - For capacity badge
- ✅ `route.distance` - For card display (optional)
- ✅ `route.difficulty` - For card display (optional)

## UI Logic Verification

### CTA Button Rules ✅
```typescript
const getCtaState = (ride, viewerParticipation) => {
  // Rule 1: Ride completed/cancelled = no CTA
  if (ride.status === 'completed' || ride.status === 'cancelled') {
    return 'disabled';
  }
  
  // Rule 2: Already joined = show Leave
  if (viewerParticipation?.status === 'confirmed') {
    return 'leave';
  }
  
  // Rule 3: On waitlist = show Waitlisted badge
  if (viewerParticipation?.status === 'waitlisted') {
    return 'waitlisted';
  }
  
  // Rule 4: Ride full = show Full badge
  if (ride.maxParticipants && ride.currentParticipants >= ride.maxParticipants) {
    return 'full';
  }
  
  // Rule 5: Default = show Join
  return 'join';
};
```

### Navigation Rules ✅
```typescript
// Ride card click → ride detail
<Link href={`/clubs/${ride.clubId}/rides/${ride.rideId}`}>

// Ride detail → back to club
<Link href={`/clubs/${ride.clubId}`}>

// Ride detail → back to rides list
<Link href="/rides">
```

### Empty State Rules ✅
```typescript
const getEmptyState = (memberships) => {
  // Rule 1: No active memberships
  if (memberships.filter(m => m.status === 'active').length === 0) {
    if (memberships.filter(m => m.status === 'pending').length > 0) {
      return 'pending-only'; // "Applications pending approval"
    }
    return 'no-clubs'; // "Browse clubs to see rides"
  }
  
  // Rule 2: Active memberships but no rides
  return 'no-rides'; // "No upcoming rides scheduled"
};
```

## Phase 3.3.1 Ready Checklist

### Backend ✅
- [x] Ride list endpoint supports query params (status, startDate, limit)
- [x] Response includes all required fields for ride cards
- [x] Pagination supported (cursor-based)

### Frontend ✅
- [x] `useMyClubs()` returns active memberships
- [x] Canonical ride card model defined
- [x] Empty state logic defined
- [x] Filter strategy defined (club, date, search)

### Design ✅
- [x] Ride card layout defined
- [x] Filter UI defined
- [x] Empty states defined
- [x] "My clubs only" indicator defined

## Phase 3.3.2 Ready Checklist

### Backend ✅
- [x] Ride detail endpoint returns `viewerParticipation`
- [x] Join endpoint exists (`POST /v1/clubs/{clubId}/rides/{rideId}/participants`)
- [x] Leave endpoint exists (`DELETE /v1/participations/{participationId}`)
- [x] Response includes all required fields for CTA logic

### Frontend ✅
- [x] CTA button rules defined
- [x] Join/leave mutation hooks pattern established (from clubs)
- [x] Error handling with toasts established
- [x] Navigation rules defined

### Design ✅
- [x] Ride detail layout defined
- [x] CTA button states defined
- [x] Participant list layout defined

## Phase 3.3.3 Ready Checklist

### Backend ✅
- [x] Create ride endpoint exists (`POST /v1/clubs/{clubId}/rides`)
- [x] Publish ride endpoint exists (`PUT /v1/clubs/{clubId}/rides/{rideId}/publish`)
- [x] Route template selection supported (optional)

### Frontend ✅
- [x] Form fields defined (title, time, meeting point)
- [x] Post-create navigation defined
- [x] Draft/publish workflow defined

### Design ✅
- [x] Form layout defined (lean, no wizard)
- [x] Draft/publish controls defined

## Risk Assessment

### Technical Risks: LOW ✅
- Backend contracts verified and enhanced
- Data models locked
- Navigation flows defined
- Error handling patterns established
- No new infrastructure needed

### Product Risks: LOW ✅
- Feature scope locked (no creep)
- MVP filters defined
- Empty states planned
- Mobile-first approach
- Phased rollout (3 sub-phases)

### Process Risks: LOW ✅
- Each phase independently shippable
- Clear success criteria
- Documentation complete
- Backend enhancement deployed

## Final Verification

### Before Starting Phase 3.3.1
- [ ] Deploy backend enhancement (viewerParticipation)
- [ ] Test ride list endpoint with real data
- [ ] Verify `useMyClubs()` returns active memberships
- [ ] Confirm ride cards have all required data

### Before Starting Phase 3.3.2
- [ ] Phase 3.3.1 complete and tested
- [ ] Verify `viewerParticipation` in ride detail response
- [ ] Test join endpoint returns `participationId`
- [ ] Confirm CTA logic works with all states

### Before Starting Phase 3.3.3
- [ ] Phase 3.3.2 complete and tested
- [ ] Verify create ride endpoint works
- [ ] Test publish ride endpoint
- [ ] Confirm post-create navigation works

## Success Metrics

**Phase 3.3 Complete When**:
- ✅ User can browse upcoming rides across their clubs
- ✅ User can open a ride detail page
- ✅ User can join/leave a ride and see state update everywhere
- ✅ Leaders can create + publish a ride
- ✅ Mobile UX is smooth, fast, and clear

## Estimated Timeline

- **Phase 3.3.1**: 2 days (January 21-22)
- **Phase 3.3.2**: 2 days (January 23-24)
- **Phase 3.3.3**: 2 days (January 25-26)
- **Total**: 6 days (~1 week)
- **Completion**: January 27, 2026

---

**Status**: ✅ **ALL SYSTEMS GO - Ready to Start Phase 3.3.1**

**Next Action**: Deploy backend enhancement, then start building `/rides` page.
