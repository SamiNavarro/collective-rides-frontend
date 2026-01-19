# Phase 3.2: Club Pages & Real Discovery - Progress Tracker

**Spec**: `.kiro/specs/phase-3.2.club-pages-and-discovery.v1.md`  
**Started**: January 18, 2026  
**Status**: In Progress

## Implementation Order

Following the spec's recommended order: 3.2.2 → 3.2.1 → 3.2.3

### ✅ Phase 3.2.2: Real Club Directory Integration (COMPLETE)

**Goal**: Replace mock data with real backend integration

**Completed**:
- ✅ API client discovery method
- ✅ React Query discovery hook
- ✅ Directory page real data integration
- ✅ Loading, error, and empty states
- ✅ Client-side filtering (search, area, pace, beginner-friendly)
- ✅ Data merging with mock enhancements
- ✅ Automated tests (12/12 passing)
- ✅ Documentation

**Files**:
- `lib/api/api-client.ts` - Added discovery method
- `hooks/use-clubs-discovery.ts` - New discovery hook
- `app/clubs/directory/page.tsx` - Real data integration
- `scripts/test-phase-3.2.2-directory.js` - Test script
- `docs/phase-3.2.2-directory-integration.md` - Documentation

**Deferred to Phase 3.3**:
- Pagination UI (backend supports it, UI doesn't show "Load More" yet)
- Backend filter support (search and area are client-side for now)

**Moved to Phase 3.2.3**:
- Membership state badges (better fit with join flow polish)

**Status**: ✅ Ready for Phase 3.2.3

---

### 🔄 Phase 3.2.3: Polish Club Join Flow (NEXT)

**Goal**: Improve clarity for "Applied" vs "Member" states

**Tasks**:
- [ ] Add membership state badges to directory cards
  - "Applied" badge (orange)
  - "Member" badge (green)
  - "Pending Approval" badge
- [ ] Show application status in multiple contexts:
  - `/clubs/directory` - Badge on club card
  - `/my-clubs` - Status in list
  - `/clubs/[clubId]` - Banner on club page
- [ ] Improve application modal UX
  - Clean, focused form
  - "Why do you want to join?" message field
  - Clear submission feedback
- [ ] Implement optimistic UI updates
  - Show "Pending" immediately on apply
  - Rollback on error
  - Invalidate related queries on success
- [ ] Add clear error messages
  - User-friendly error handling
  - Specific messages for common errors
- [ ] Test complete join flow
- [ ] Mobile optimization

**Dependencies**:
- ✅ Phase 3.2.2 complete (real data integration)
- ✅ `/my-clubs` page exists (Phase 3.1)
- ✅ Auth context has membership helpers

**Estimated Duration**: 2-3 days

---

### ⏳ Phase 3.2.1: Individual Club Pages (AFTER 3.2.3)

**Goal**: Create club home pages with upcoming rides

**Tasks**:
- [ ] Create `/clubs/[clubId]` page structure
- [ ] Implement public section (no auth required)
  - Club header (name, area, description)
  - Pace + focus tags
  - Member count (privacy-aware)
  - Join/leave button
- [ ] Implement member section (auth + membership required)
  - Next 5 upcoming rides
  - Ride detail links
  - "Create ride" button (captain+ only)
- [ ] Add `useClubRides` hook for upcoming rides
- [ ] Add member count display (privacy-aware)
  - Public clubs: Exact count ("42 members")
  - Private clubs: Approximate ("10+ members")
- [ ] Mobile optimization
- [ ] Test authorization logic

**API Endpoints**:
- ✅ `GET /v1/clubs/{clubId}` - Exists
- 🔧 `GET /v1/rides/club/{clubId}?status=upcoming&limit=5` - Add query params

**Estimated Duration**: 3-4 days

---

## Overall Progress

**Phase 3.2 Breakdown**:
- ✅ 3.2.2: Directory Integration (Complete)
- 🔄 3.2.3: Join Flow Polish (Next)
- ⏳ 3.2.1: Club Pages (After 3.2.3)

**Timeline**:
- Week 1: ✅ 3.2.2 Complete (1 day)
- Week 2: 🔄 3.2.3 In Progress (2-3 days)
- Week 2-3: ⏳ 3.2.1 Pending (3-4 days)
- Week 3-4: Testing & Polish

**Estimated Completion**: End of Week 3

---

## Key Decisions Made

### 1. Implementation Order: 3.2.2 First
**Rationale**: Directory integration is the quickest win and provides immediate value. Users can see real clubs right away.

### 2. Client-Side Filtering
**Decision**: Implement search and area filters client-side  
**Rationale**: Backend doesn't support these filters yet, and client-side is fast enough for <100 clubs  
**Future**: Phase 3.3 will add backend filter support

### 3. Mock Enhancements
**Decision**: Merge backend data with mock enhancements for rich UI  
**Rationale**: Backend Club model lacks fields like pace, rideTypes, etc.  
**Future**: Phase 3.3 will extend Club model with these fields

### 4. Membership Badges Moved to 3.2.3
**Decision**: Move membership state badges from 3.2.2 to 3.2.3  
**Rationale**: Better fit with join flow polish, requires auth context integration  
**Impact**: 3.2.2 focused purely on data integration

### 5. Pagination Deferred to 3.3
**Decision**: Backend supports pagination, but UI doesn't show "Load More" yet  
**Rationale**: Not critical for MVP, can be added later  
**Impact**: Directory limited to first 50 clubs (sufficient for now)

---

## Success Metrics

### Phase 3.2.2 (Complete)
- ✅ Directory shows real clubs from backend
- ✅ Loading states work correctly
- ✅ Error handling is user-friendly
- ✅ Filters work (search, area, pace, beginner-friendly)
- ✅ No console errors
- ✅ All automated tests pass (12/12)

### Phase 3.2.3 (In Progress)
- [ ] Membership states visible in all contexts
- [ ] Application flow is smooth
- [ ] Optimistic updates work correctly
- [ ] Error messages are clear and helpful

### Phase 3.2.1 (Pending)
- [ ] Club pages load correctly
- [ ] Public/member sections show appropriately
- [ ] Upcoming rides display for members
- [ ] Authorization works correctly

---

## Next Actions

1. **Immediate**: Start Phase 3.2.3 (Join Flow Polish)
   - Add membership state badges to directory
   - Integrate with auth context
   - Test application flow

2. **After 3.2.3**: Start Phase 3.2.1 (Club Pages)
   - Create `/clubs/[clubId]` page
   - Implement public/member sections
   - Add upcoming rides display

3. **After 3.2.1**: Testing & Polish
   - E2E testing
   - Performance optimization
   - Accessibility audit
   - Bug fixes

---

## Notes

- Phase 3.2.2 completed in 1 day (faster than estimated)
- Implementation order (3.2.2 first) was the right choice
- Mock enhancements provide good development experience
- Client-side filtering is sufficient for now
- Ready to proceed with Phase 3.2.3

**Status**: ✅ Phase 3.2.2 Complete, 🔄 Phase 3.2.3 Next
