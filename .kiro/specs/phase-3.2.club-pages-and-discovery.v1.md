# Phase 3.2: Club Pages & Real Discovery - Specification v1

## Overview

Phase 3.2 transforms clubs from "something you join" into "living spaces you engage with" by connecting clubs to actual rides. This phase completes the core user journey: discover → join → engage.

**Duration**: 3-4 weeks  
**Dependencies**: Phase 3.1 (✅ Complete)  
**Risk Level**: Low - Leverages existing backend  
**Success Metric**: Users can find clubs, join them, and see what rides are happening

## Strategic Direction

### Core Value Proposition
> "Users can find clubs, join them, and see what rides are happening."

Everything else is noise until this works perfectly.

### What Changed from Initial Proposal
**Removed** (deferred to Phase 3.3+ or Phase 4):
- ❌ Activity feeds (social product territory)
- ❌ Member directory UI (privacy complexity)
- ❌ Announcements & pinned posts (premature)
- ❌ Enhanced /my-clubs dashboard (duplication risk)
- ❌ Notifications (infrastructure complexity)

**Why**: These are solutions looking for problems we haven't validated yet. Focus on core ride coordination value first.

### Page Architecture (Locked)

```
/clubs/directory     → Discovery (public + auth, real backend data)
/my-clubs           → Launcher (auth only, simple list)
/clubs/[clubId]     → Dashboard (public + member sections, upcoming rides)
```

**Pattern**:
- `/my-clubs` = Simple launcher (no duplication)
- `/clubs/[clubId]` = Rich dashboard (all club content)

This prevents feature duplication and maintains clear separation of concerns.

## Phase 3.2 Breakdown

### Phase 3.2.1: Individual Club Pages

**Goal**: Let users view club details and upcoming rides

#### Public Section (No Auth Required)
- Club header (name, area, description)
- Pace + focus tags (e.g., "Fast", "Road Racing")
- Member count:
  - Public clubs: Exact count ("42 members")
  - Private clubs: Approximate ("10+ members")
- Join/leave button (context-aware)

#### Member Section (Auth + Active Membership)
- Next 5 upcoming rides
- Ride detail links (navigate to ride page)
- "Create ride" button (captain+ only)

#### Technical Specifications

**Route**: `/clubs/[clubId]`

**API Endpoints**:
```typescript
// Club details
GET /v1/clubs/{clubId}
Response: {
  success: boolean;
  data: Club;
}

// Upcoming rides (NEW: add query params)
GET /v1/rides/club/{clubId}?status=upcoming&limit=5
Response: {
  success: boolean;
  data: Ride[];
}
```

**Authorization Logic**:
```typescript
// Public data - no auth required
- Club name, description, location
- Member count (privacy-aware)
- Meeting times and contact info

// Member-only data - requires active membership
- Upcoming rides list
- Create ride button (captain+)
- Future: member directory, announcements
```

**Component Structure**:
```typescript
app/clubs/[clubId]/page.tsx
├── ClubHeader (public)
├── ClubInfo (public)
├── MembershipActions (public/member)
└── UpcomingRides (member-only)
```

---

### Phase 3.2.2: Real Club Directory Integration

**Goal**: Replace mock data with real backend integration

#### Deliverables
- Connect to `GET /v1/clubs/discovery`
- Working search + filters (area, pace, beginner-friendly)
- Pagination or infinite scroll
- Membership state badges

#### Application Status Visibility

| Context | Display |
|---------|---------|
| `/clubs/directory` | "Applied" badge on club card |
| `/my-clubs` | "Pending Approval" in list |
| `/clubs/[clubId]` | "Application Pending" banner |

**Why show in multiple contexts**: Users need clarity without hunting for status.

#### Technical Specifications

**API Endpoint**:
```typescript
GET /v1/clubs/discovery
  ?area=eastern-suburbs
  &pace=moderate
  &beginnerFriendly=true
  &limit=20
  &cursor=xyz

Response: {
  success: boolean;
  data: Club[];
  pagination: {
    nextCursor?: string;
    hasMore: boolean;
  };
}
```

**State Management**:
```typescript
// React Query hook
export const useClubsDiscovery = (filters: ClubFilters) => {
  return useQuery({
    queryKey: ['clubs', 'discovery', filters],
    queryFn: () => apiClient.clubs.discovery(filters),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
};
```

**Filter State**:
- Store in URL query params for shareability
- Preserve on navigation back
- Clear filters button

**Loading States**:
- Skeleton cards during initial load
- Inline loading for pagination
- Error boundaries for failures

---

### Phase 3.2.3: Polish Club Join Flow

**Goal**: Improve clarity for "Applied" vs "Member" states

#### Application Modal
- Clean, focused form
- "Why do you want to join?" message field
- Optional: Experience level, referral
- Clear submission feedback

#### Status Tracking
- Pending badge on club cards (directory)
- Application list in `/my-clubs`
- Status banner on club page
- Clear rejection messaging (if applicable)

#### Technical Specifications

**API Endpoint**:
```typescript
POST /v1/clubs/{clubId}/members
Body: {
  message: string;  // Why do you want to join?
  experience?: string;  // Optional
  referredBy?: string;  // Optional
}

Response: {
  success: boolean;
  data: Membership;
}
```

**Optimistic Updates**:
```typescript
const { mutate: applyToClub } = useMutation({
  mutationFn: (data) => apiClient.clubs.join(clubId, data),
  onMutate: async () => {
    // Optimistic update: show "Pending" immediately
    await queryClient.cancelQueries(['clubs', clubId]);
    const previous = queryClient.getQueryData(['clubs', clubId]);
    
    queryClient.setQueryData(['clubs', clubId], (old) => ({
      ...old,
      userMembership: { status: 'pending' }
    }));
    
    return { previous };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(['clubs', clubId], context.previous);
  },
  onSuccess: () => {
    // Invalidate related queries
    queryClient.invalidateQueries(['users', 'me', 'clubs']);
    queryClient.invalidateQueries(['clubs', 'discovery']);
  },
});
```

---

## Data Flow Architecture

### API Endpoints Summary

**Existing** (already implemented):
- ✅ `GET /v1/clubs/{clubId}` - Club details
- ✅ `GET /v1/clubs/discovery` - Club listing
- ✅ `POST /v1/clubs/{clubId}/members` - Join club
- ✅ `GET /v1/users/me/clubs` - My memberships
- ✅ `GET /v1/rides/club/{clubId}` - Club rides

**New** (minor additions):
- 🔧 `GET /v1/rides/club/{clubId}?status=upcoming&limit=5` - Add query params

### State Management Strategy

```typescript
// React Query hooks structure
hooks/
├── use-club.ts              // Individual club data
├── use-club-rides.ts        // Club's upcoming rides (NEW)
├── use-clubs-discovery.ts   // Discovery with filters (ENHANCE)
├── use-my-clubs.ts          // ✅ Already exists
└── use-club-join.ts         // Join/leave mutations (ENHANCE)
```

**Cache Strategy**:
- Club public data: 5 min stale time
- Club member data: 2 min stale time
- Upcoming rides: 1 min stale time
- My clubs: 2 min stale time
- Invalidate on mutations (join, leave, create ride)

---

## UI/UX Specifications

### Mobile-First Design

**Club Page Layout**:
```
Mobile (< 768px):
- Single column
- Sticky header with club name
- Collapsible sections
- Bottom sheet for actions

Desktop (≥ 768px):
- Two column layout
- Sidebar with club info
- Main content area
- Floating action button
```

### Navigation Patterns

**Breadcrumb Navigation**:
```
Home > Clubs > [Club Name]
Home > My Clubs > [Club Name]
```

**Back Button Behavior**:
- From club page → Return to previous page (directory or my-clubs)
- Preserve scroll position on back navigation
- Maintain filter state when returning to directory

### Loading States

**Skeleton Screens**:
- Club card skeletons in directory
- Club page header skeleton
- Rides list skeleton

**Progressive Loading**:
- Show club header first (fast)
- Load rides in parallel (slower)
- Show empty state if no rides

### Error Handling

**User-Friendly Messages**:
```typescript
const getErrorMessage = (error: ApiError): string => {
  switch (error.code) {
    case 'CLUB_NOT_FOUND':
      return 'This club no longer exists';
    case 'ALREADY_MEMBER':
      return 'You are already a member of this club';
    case 'CLUB_FULL':
      return 'This club is currently at capacity';
    case 'UNAUTHORIZED':
      return 'Please sign in to join clubs';
    default:
      return 'Something went wrong. Please try again.';
  }
};
```

---

## Implementation Order

### Week 1: Directory Integration (3.2.2) ✅ COMPLETE
**Goal**: Get real data flowing

**Tasks**:
- [x] Remove all mock club data from `/clubs/directory`
- [x] Implement `useClubsDiscovery` hook
- [x] Connect filters to API query params (search, area client-side)
- [ ] Add pagination/infinite scroll (deferred to Phase 3.3)
- [ ] Implement membership state badges (moved to Phase 3.2.3)
- [x] Add loading states and error handling
- [x] Test with real backend data

**Success Criteria**:
- ✅ Directory shows real clubs from backend
- ✅ Filters work correctly (search, area, pace, beginner-friendly)
- ⏭️ Membership states display accurately (Phase 3.2.3)
- ✅ Mobile experience is smooth

**Implementation**: See `docs/phase-3.2.2-directory-integration.md`

---

### Week 2: Club Pages (3.2.1)
**Goal**: Create club home pages

**Tasks**:
- [ ] Create `/clubs/[clubId]` page structure
- [ ] Implement public section (no auth)
- [ ] Implement member section (with auth guards)
- [ ] Add `useClubRides` hook for upcoming rides
- [ ] Implement "Create ride" button (captain+)
- [ ] Add member count display (privacy-aware)
- [ ] Mobile optimization
- [ ] Test authorization logic

**Success Criteria**:
- Club pages load correctly
- Public/member sections show appropriately
- Upcoming rides display for members
- Authorization works correctly
- Mobile experience is smooth

---

### Week 3: Join Flow Polish (3.2.3)
**Goal**: Optimize conversion funnel

**Tasks**:
- [ ] Improve application modal UX
- [ ] Add optimistic UI updates
- [ ] Implement status tracking in multiple contexts
- [ ] Add clear error messages
- [ ] Test complete join flow
- [ ] Mobile optimization
- [ ] Cache invalidation testing

**Success Criteria**:
- Application flow is smooth
- Status is clear in all contexts
- Optimistic updates work correctly
- Error handling is user-friendly
- Mobile experience is smooth

---

### Week 4: Testing & Polish
**Goal**: Ship with confidence

**Tasks**:
- [ ] E2E testing of complete flow
- [ ] Performance optimization
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Bug fixes
- [ ] Documentation updates
- [ ] Deployment preparation

**Success Criteria**:
- All E2E tests passing
- Page load < 2s on 3G
- No accessibility violations
- Documentation complete
- Ready for production deployment

---

## Success Criteria

### Functional Requirements
- [ ] Users can browse real clubs (not mock data)
- [ ] Users can view club details before joining
- [ ] Members can see next 5 upcoming rides on club page
- [ ] Application status is clear in all contexts
- [ ] Mobile experience is smooth and responsive
- [ ] Join/leave workflow works correctly

### Technical Requirements
- [ ] Page load time < 2s on 3G
- [ ] No N+1 query problems
- [ ] Proper cache invalidation on mutations
- [ ] Error states handled gracefully
- [ ] Accessibility compliant (WCAG 2.1 AA)
- [ ] No console errors or warnings

### User Experience Requirements
- [ ] Navigation is intuitive
- [ ] Loading states are clear
- [ ] Error messages are helpful
- [ ] Empty states guide next actions
- [ ] Mobile touch targets are adequate (44px min)
- [ ] No horizontal scroll on mobile

### Business Metrics
- [ ] Club join conversion rate measurable
- [ ] Ride discovery from club pages tracked
- [ ] User engagement with club pages tracked
- [ ] Application approval rate tracked

---

## Risk Mitigation

### Technical Risks

**Risk**: Backend API performance issues
- **Mitigation**: Implement aggressive caching, loading states
- **Fallback**: Graceful degradation with error messages

**Risk**: Mobile performance on slow connections
- **Mitigation**: Skeleton screens, progressive loading, image optimization
- **Fallback**: Simplified mobile view if needed

**Risk**: Cache invalidation bugs
- **Mitigation**: Comprehensive testing, clear invalidation rules
- **Fallback**: Manual cache clear option for users

### User Experience Risks

**Risk**: Users confused about application status
- **Mitigation**: Show status in multiple contexts, clear messaging
- **Fallback**: Help text and tooltips

**Risk**: Mobile usability issues
- **Mitigation**: Real device testing, touch-friendly design
- **Fallback**: Desktop-first fallback if needed

### Rollback Plan
- Frontend-only changes: Easy revert via Vercel deployment history
- Feature flags: Gradual rollout capability
- Staging validation: Full testing before production deployment

---

## What We're NOT Building

Deferred to Phase 3.3+ or Phase 4:
- ❌ Activity feeds
- ❌ Member directory UI
- ❌ Announcements & pinned posts
- ❌ Notifications
- ❌ Messaging
- ❌ Advanced ride management
- ❌ Social features
- ❌ Real-time updates

**Why**: These are solutions looking for problems we haven't validated yet. Let user behavior guide Phase 3.3.

---

## User Journey (Complete)

```
1. Browse clubs (/clubs/directory)
   - See real clubs from backend
   - Filter by area, pace, beginner-friendly
   - See membership status badges
   ↓
2. View club details (/clubs/[clubId])
   - Public: See club info, member count
   - Decide if club is right fit
   ↓
3. Apply to join (modal)
   - Fill out application form
   - Submit with message
   ↓
4. See "Pending" status
   - Badge on club card (directory)
   - List in my-clubs
   - Banner on club page
   ↓
5. Get approved (backend process)
   - Admin reviews application
   - Status changes to "active"
   ↓
6. View club page as member (/clubs/[clubId])
   - See upcoming rides
   - Access member-only content
   ↓
7. See upcoming rides
   - Next 5 rides displayed
   - Click to view ride details
   ↓
8. Join a ride (Phase 3.3)
   - Navigate to ride page
   - Join ride
   - Participate
```

---

## The North Star

**Phase 3.2 delivers one thing perfectly**:
> "Clubs become living, useful spaces by connecting them to actual rides."

If we nail this, the next phase becomes obvious from user behavior:
- Lots of ride creation → Focus on ride management (Phase 3.3)
- Low club engagement → Enhance discovery features
- High member activity → Add community features (Phase 4)

**Let the data tell us what Phase 3.3 should be.**

---

## Conclusion

Phase 3.2 completes the core club experience by:
1. Connecting clubs to real backend data
2. Creating meaningful club home pages
3. Showing upcoming rides to members
4. Polishing the join workflow

This is the foundation for all future club features. Once users can discover clubs, join them, and see what rides are happening, we'll have validated the core value proposition and can expand based on real user behavior.

**Status**: Locked and ready for implementation.
**Next Step**: Begin with Phase 3.2.2 (directory integration) as the quickest win.
