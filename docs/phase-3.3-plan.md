# Phase 3.3: Ride Discovery & Participation - Implementation Plan

**Spec**: `.kiro/specs/phase-3.product-ui-mvp.v1.md` (Phase 3.2)  
**Started**: January 20, 2026  
**Estimated Duration**: 6 days (1 week)  
**Status**: Ready to Start

## ⚠️ Pre-Implementation Refinements Applied

Based on user feedback, 5 critical refinements locked before implementation:

1. ✅ **Canonical Ride Summary Model** - Always show core fields, route stats only if present, clean fallback
2. ✅ **clubIds Strategy** - Explicit empty state handling (0 clubs, pending only, active)
3. ✅ **Viewer Participation ID** - Backend must return `viewerParticipation` for leave action
4. ✅ **Post-Create Navigation** - Navigate to ride detail after create (draft or published)
5. ✅ **MVP Filters Locked** - Club (single), Date preset, Search only (no difficulty/type)

**Bonus**: Added "My clubs only" indicator on `/rides` page for clarity

---

## Overview

Phase 3.3 implements the ride participation loop - the core value proposition of the platform. Members can discover upcoming rides, view details, and join/leave rides.

## Pre-Implementation Checklist

Before starting Phase 3.3.1, verify:

- [x] **Backend Contract**: Check if `GET /v1/clubs/{clubId}/rides/{rideId}` returns `viewerParticipation`
  - ✅ **FIXED**: Backend now returns `viewerParticipation` field
  - Implementation: Top-level field with `{ participationId, role, status, joinedAt }`
  - Privacy-friendly: Only viewer's participation exposed, not all participants
- [x] **Viewer Participation ID**: Backend includes `participationId` for leave action
  - ✅ **FIXED**: `viewerParticipation.participationId` available when user is joined
- [ ] **Active Memberships**: Confirm `useMyClubs()` returns active memberships correctly
- [ ] **Ride List Endpoint**: Verify `GET /v1/clubs/{clubId}/rides` supports query params (status, startDate, limit)
- [ ] **Join Endpoint**: Confirm join returns `participationId` in response

**Backend Enhancement Complete**: 
- ✅ `viewerParticipation` field added to ride detail response
- ✅ Privacy-friendly (viewer-only, not all participants)
- ✅ Clean contract (top-level field, not nested in participants array)
- ✅ Ready for Phase 3.3.2 implementation

---

## Implementation Order

Following the recommended phased approach from user feedback:

### Phase 3.3.1: Ride Listing (Days 1-2)
### Phase 3.3.2: Ride Detail + Join/Leave (Days 3-4)
### Phase 3.3.3: Create Ride (Days 5-6)

---

## Phase 3.3.1: Ride Listing (`/rides` page)

**Goal**: Members can find upcoming rides across their clubs fast

**Duration**: 2 days

### Must-Have UI

1. **Default View**: Upcoming rides sorted by start time
2. **"My clubs only" indicator** (default on) - helps users understand filtering
3. **Filters** (MVP minimal):
   - Club (single select dropdown)
   - Date preset: "This week" / "Next 30 days" / Custom
   - Search by title
4. **Ride Cards** (canonical model):
   - **Always show**: title, clubName, startDateTime, status, currentParticipants/maxParticipants
   - **Show route stats only if present**: distance, elevation, difficulty
   - **Fallback for missing route**: "Route details TBD" (clean placeholder)
   - Click → navigate to ride detail

### Data Strategy

**Backend Query**:
- Endpoint: `GET /v1/clubs/{clubId}/rides` (already exists)
- Query params:
  - `status=published`
  - `startDate=now` (upcoming only)
  - `limit=20`
  - `cursor` (pagination)

**clubIds Strategy**:
- Get active memberships from `useMyClubs()`
- If **0 active memberships** → Empty state: "Browse clubs to see rides"
- If **only pending memberships** → Message: "You have pending applications; rides appear after approval"
- If **1+ active memberships** → Fetch rides for those clubs

**Implementation**:
```typescript
// hooks/use-rides.ts
export const useRides = (clubIds: string[], filters?: RideFilters) => {
  return useQuery({
    queryKey: ['rides', clubIds, filters],
    queryFn: async () => {
      // Fetch rides for each club in parallel
      const ridePromises = clubIds.map(clubId => 
        api.rides.list(clubId, {
          status: 'published',
          startDate: filters?.from || new Date().toISOString(),
          limit: 20,
        })
      );
      
      const results = await Promise.all(ridePromises);
      
      // Merge and sort by startDateTime
      const allRides = results.flatMap(r => r.data);
      return allRides.sort((a, b) => 
        new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
      );
    },
    enabled: clubIds.length > 0, // Only fetch if user has clubs
  });
};
```

### Files to Create/Modify

- `app/rides/page.tsx` - Ride listing page
- `hooks/use-rides.ts` - Ride data fetching hooks
- `components/rides/ride-card.tsx` - Ride card component
- `components/rides/ride-filters.tsx` - Filter controls

### Done When

- ✅ User sees upcoming rides with stable pagination
- ✅ Filters work (club, date range, search)
- ✅ Loading states work correctly
- ✅ Empty state shows when no rides
- ✅ Mobile responsive

---

## Phase 3.3.2: Ride Detail + Join/Leave (Days 3-4)

**Goal**: Ride pages are operational with join/leave functionality

**Duration**: 2 days

### URL Decision

**Chosen**: `/clubs/[clubId]/rides/[rideId]`

**Rationale**:
- Matches mental model (rides belong to clubs)
- Easier permission checks (club membership required)
- Consistent with club-scoped navigation

### Must-Have Sections

1. **Ride Header**:
   - Title
   - Date/time
   - Status badge
   - Club name (link to club)

2. **Route Summary** (if linked):
   - Distance
   - Elevation gain
   - Difficulty level
   - Route name (link to route detail)

3. **Participant Section**:
   - Participant count / capacity
   - "X going" display
   - Participant list (avatars + names)
   - **Viewer participation state** (from backend):
     - `viewerParticipation: { participationId, role, status }` (if joined)
     - Used for "Leave Ride" action (needs participationId)

4. **CTA Button** (state-aware):
   - Not member: "Join club to participate"
   - Eligible: "Join Ride"
   - Already joined: "Leave Ride" (uses `viewerParticipation.participationId`)
   - Full: "Ride Full"
   - Cancelled: "Ride Cancelled"

### Rules to Enforce

**Cannot join if**:
- Not an active club member
- Ride is full (capacity reached)
- Ride is cancelled/completed
- Already joined

**Cannot leave if**:
- Ride has started (optional - depends on business rules)

### Data Strategy

**Backend Queries**:
- `GET /v1/clubs/{clubId}/rides/{rideId}` - Ride details (includes participants array + viewerParticipation)
- Response includes: 
  - `participants: [{ userId, role, status, joinedAt }]`
  - `viewerParticipation?: { participationId, role, status, joinedAt }` ✅ **Now available**

**Mutations**:
- `POST /v1/clubs/{clubId}/rides/{rideId}/participants` - Join ride
- `DELETE /v1/participations/{participationId}` - Leave ride (uses `viewerParticipation.participationId`)

**Implementation**:
```typescript
// hooks/use-rides.ts
export const useRide = (clubId: string, rideId: string) => {
  return useQuery({
    queryKey: ['clubs', clubId, 'rides', rideId],
    queryFn: async () => {
      const response = await api.rides.get(clubId, rideId);
      // Backend returns: { ...rideData, participants: [...], viewerParticipation?: {...} }
      return response.data;
    },
  });
};

export const useJoinRide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, rideId }: { clubId: string; rideId: string }) => {
      const response = await api.rides.join(clubId, rideId);
      return response.data; // Returns { participationId, status, ... }
    },
    onSuccess: (data, { clubId, rideId }) => {
      // Invalidate ride detail and ride list
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides', rideId] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
  });
};

export const useLeaveRide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      participationId, 
      clubId, 
      rideId 
    }: { 
      participationId: string; 
      clubId: string; 
      rideId: string; 
    }) => {
      const response = await api.rides.leave(participationId);
      return response.data;
    },
    onSuccess: (data, { clubId, rideId }) => {
      // Invalidate ride detail and ride list
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides', rideId] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
  });
};
```

### Files to Create/Modify

- `app/clubs/[clubId]/rides/[rideId]/page.tsx` - Ride detail page
- `hooks/use-rides.ts` - Add ride detail and join/leave hooks
- `components/rides/ride-header.tsx` - Ride header component
- `components/rides/participant-list.tsx` - Participant list component
- `lib/api/api-client.ts` - Add ride join/leave methods

### Done When

- ✅ Join/leave works reliably
- ✅ State updates across `/rides` and club page
- ✅ Participant list displays correctly
- ✅ Authorization rules enforced
- ✅ Error handling with toasts
- ✅ Mobile responsive

---

## Phase 3.3.3: Create Ride (Days 5-6)

**Goal**: Leaders can create and publish rides

**Duration**: 2 days

### Entry Points

- "Create ride" button on club page (`/clubs/[clubId]`)
- Direct URL: `/clubs/[clubId]/rides/new`

### Form (v1 - Lean)

**Required Fields**:
- Title (text input)
- Start time (date + time picker)
- Meeting point (text input or location picker)

**Optional Fields**:
- Description/safety notes (textarea)
- Route template picker (dropdown)
- Capacity (number input)

**Status Control**:
- Save as draft (default)
- Publish (button)

**Post-Create Navigation**:
- **Save draft** → Navigate to ride detail page (draft state) with clear "Publish" button
- **Publish** → Same page, toast "Published", primary CTA becomes "View in rides"
- Keeps flow simple, avoids multi-page orchestration

### Do NOT Build Yet

- Multi-step wizard
- Advanced validation
- Waitlist management UI
- Leadership assignment UI
- Recurring rides

### Data Strategy

**Backend Mutations**:
- `POST /v1/clubs/{clubId}/rides` - Create ride (draft)
- `PUT /v1/clubs/{clubId}/rides/{rideId}/publish` - Publish ride

**Implementation**:
```typescript
// hooks/use-rides.ts
export const useCreateRide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, data }: { clubId: string; data: CreateRideRequest }) => {
      const response = await api.rides.create(clubId, data);
      return response.data;
    },
    onSuccess: (data, { clubId }) => {
      // Invalidate ride lists
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
  });
};

export const usePublishRide = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ clubId, rideId }: { clubId: string; rideId: string }) => {
      const response = await api.rides.publish(clubId, rideId);
      return response.data;
    },
    onSuccess: (data, { clubId, rideId }) => {
      // Invalidate ride detail and lists
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides', rideId] });
      queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'rides'] });
      queryClient.invalidateQueries({ queryKey: ['rides'] });
    },
  });
};
```

### Files to Create/Modify

- `app/clubs/[clubId]/rides/new/page.tsx` - Create ride page
- `hooks/use-rides.ts` - Add create and publish hooks
- `components/rides/ride-form.tsx` - Ride form component
- `lib/api/api-client.ts` - Add ride create/publish methods

### Done When

- ✅ Captain/admin can create a ride
- ✅ Ride appears in `/rides` and `/clubs/[clubId]`
- ✅ Publish workflow is clear
- ✅ Form validation works
- ✅ Error handling with toasts
- ✅ Mobile responsive

---

## Success Criteria (Phase 3.3 Complete)

- ✅ User can browse upcoming rides across their clubs
- ✅ User can open a ride detail page
- ✅ User can join/leave a ride and see state update everywhere
- ✅ Leaders can create + publish a ride
- ✅ Mobile UX is smooth, fast, and clear

---

## Key Decisions (Locked)

### 1. Canonical Ride Summary Model

**Decision**: Always show core fields, route stats only if present

**Always Show**:
- title, clubName, startDateTime, status, currentParticipants/maxParticipants

**Show Only If Present**:
- route.distance, route.elevation, route.difficulty

**Fallback**:
- If no route: "Route details TBD" (clean placeholder)

**Rationale**: Prevents half-empty cards, makes list feel intentional

### 2. clubIds Strategy for /rides Listing

**Decision**: Explicit empty state handling

**Behavior**:
- 0 active memberships → Empty state: "Browse clubs to see rides"
- Only pending memberships → Message: "You have pending applications; rides appear after approval"
- 1+ active memberships → Fetch rides for those clubs

**Rationale**: Prevents confusing "no rides" states

### 3. Viewer Participation ID (Critical Backend Contract)

**Decision**: Backend must return `viewerParticipation` in ride detail

**Required Field**:
```typescript
viewerParticipation?: {
  participationId: string;
  role: RideRole;
  status: ParticipationStatus;
}
```

**Rationale**: 
- Provides `participationId` needed for leave action
- Privacy-friendly: Only viewer's participation exposed
- Clean contract: Top-level field, not nested in participants array
- Single source of truth for viewer's participation state

**Implementation**: 
- ✅ **Backend enhancement complete** (Phase 3.3 prep)
- Backend now returns `viewerParticipation` at top level of ride detail response
- Frontend can use `ride.viewerParticipation?.participationId` for leave action

### 4. Post-Create Navigation

**Decision**: Navigate to ride detail after create

**Flow**:
- Save draft → `/clubs/{clubId}/rides/{rideId}` (draft state) + "Publish" button
- Publish → Same page + toast "Published" + "View in rides" CTA

**Rationale**: Simple flow, avoids multi-page orchestration

### 5. MVP Filters (Locked)

**Decision**: Minimal filter set for MVP

**Filters**:
- Club (single select dropdown)
- Date preset: "This week" / "Next 30 days" / Custom
- Search by title

**Not Included**:
- Difficulty filter (defer to Phase 3.4)
- Type filter (defer to Phase 3.4)
- Multi-club select (single select is enough)

**Rationale**: Enough to ship, avoids complexity

### 6. URL Pattern for Ride Detail

**Decision**: `/clubs/[clubId]/rides/[rideId]`

**Rationale**:
- Matches mental model (rides belong to clubs)
- Easier permission checks (club membership required)
- Consistent with club-scoped navigation

**Alternative Considered**: `/rides/[rideId]` (global)
- Simpler URL
- But requires extra permission checks
- Less clear ownership

### 7. Waitlist Support

**Decision**: Defer to Phase 3.4 or later

**Rationale**:
- Backend supports it
- But adds UI complexity
- "Full" + "Can't join" is enough for MVP
- Can add later if clubs hit capacity frequently

### 8. Ride Visibility

**Decision**: Only show published rides to members

**Rationale**:
- Draft rides visible only to creator + club leaders/admins
- Published rides visible to all club members
- Matches backend authorization rules

### 9. Pagination Strategy

**Decision**: Cursor-based pagination (backend supports it)

**Implementation**:
- "Load More" button at bottom of list
- Infinite scroll (optional enhancement)

---

## Backend Integration

### Existing Endpoints (Phase 2.3)

All ride endpoints already exist and are tested:

- ✅ `GET /v1/clubs/{clubId}/rides` - List club rides (with filters)
- ✅ `GET /v1/clubs/{clubId}/rides/{rideId}` - Get ride details
- ✅ `POST /v1/clubs/{clubId}/rides` - Create ride
- ✅ `PUT /v1/clubs/{clubId}/rides/{rideId}/publish` - Publish ride
- ✅ `POST /v1/clubs/{clubId}/rides/{rideId}/participants` - Join ride
- ✅ `DELETE /v1/participations/{participationId}` - Leave ride

### Backend Contract Verification Complete ✅

**Ride Detail Response** (`GET /v1/clubs/{clubId}/rides/{rideId}`):
```typescript
{
  ...rideData,
  participants: [...],
  waitlist: [...],
  viewerParticipation?: {
    participationId: string;
    role: RideRole;
    status: ParticipationStatus;
    joinedAt: string;
  }
}
```

**Benefits**:
- Privacy-friendly: Only viewer's participation exposed, not all participants
- Clean contract: Top-level field, not nested in participants array
- Efficient: No need to search participants array for current user
- Single source of truth for viewer's participation state

**Implementation**: Backend enhancement complete (Phase 3.3 prep)

---

## Risk Mitigation

### Technical Risks

1. **Complex State Management**: Use React Query for server state
2. **Authorization Complexity**: Centralize permission checks
3. **Mobile Performance**: Optimize ride list rendering
4. **API Integration**: Comprehensive error handling

### Product Risks

1. **Feature Creep**: Stick to lean form, no wizard
2. **Over-Engineering**: Focus on MVP functionality
3. **User Experience**: Early testing with real users
4. **Mobile Usability**: Mobile-first design

---

## Testing Strategy

### Manual Testing

- [ ] Browse rides across multiple clubs
- [ ] Filter rides by club, date, search
- [ ] Join/leave rides
- [ ] Create ride as leader
- [ ] Publish ride
- [ ] View ride detail
- [ ] Test on mobile device

### Automated Testing

- [ ] Ride list loads correctly
- [ ] Filters work
- [ ] Join/leave mutations work
- [ ] Create ride mutation works
- [ ] Authorization rules enforced

---

## Next Steps

1. ✅ Phase 3.2 polish fixes complete
2. ➡️ Start Phase 3.3.1: Ride Listing (Days 1-2)
3. ⏭️ Phase 3.3.2: Ride Detail + Join/Leave (Days 3-4)
4. ⏭️ Phase 3.3.3: Create Ride (Days 5-6)

**Estimated Completion**: January 27, 2026 (1 week from now)

---

**Status**: 📋 Ready to Start Phase 3.3.1
