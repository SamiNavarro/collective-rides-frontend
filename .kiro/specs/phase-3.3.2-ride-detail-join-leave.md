# Phase 3.3.2: Ride Detail + Join/Leave

**Status:** Ready for Implementation  
**Phase:** 3.3.2 - Ride Interaction  
**Dependencies:** Phase 3.3.1 (Ride Listing) ✅  
**Blocks:** Phase 3.3.3 (Create Ride)

---

## Overview

Enable users to view full ride details and join/leave rides. This is the core interaction layer that transforms ride discovery into ride participation.

**Scope:** MVP interaction only - no waitlist, no editing, no advanced features.

---

## User Stories

### US-1: View Ride Details
**As a** club member  
**I want to** view full details of a ride  
**So that** I can decide if I want to join

**Acceptance Criteria:**
- AC-1.1: Clicking a ride card navigates to `/clubs/[clubId]/rides/[rideId]`
- AC-1.2: Page displays all ride information (title, date, meeting point, route, participants)
- AC-1.3: Page shows current participation status (joined/not joined)
- AC-1.4: Page displays appropriate CTA based on user state and ride status
- AC-1.5: Non-members see "Sign in to join" message
- AC-1.6: Page handles loading and error states gracefully

### US-2: Join a Ride
**As a** club member  
**I want to** join an upcoming ride  
**So that** I can participate with my club

**Acceptance Criteria:**
- AC-2.1: "Join Ride" button visible when user is not a participant and ride has capacity
- AC-2.2: Clicking "Join Ride" sends POST request to join endpoint
- AC-2.3: Success shows confirmation toast and updates UI immediately
- AC-2.4: Participant count increments by 1
- AC-2.5: Button changes to "Leave Ride" after joining
- AC-2.6: Ride list page reflects updated participation status
- AC-2.7: Error states handled with clear messaging

### US-3: Leave a Ride
**As a** ride participant  
**I want to** leave a ride I've joined  
**So that** I can cancel my participation if plans change

**Acceptance Criteria:**
- AC-3.1: "Leave Ride" button visible when user is a participant
- AC-3.2: Clicking "Leave Ride" shows confirmation dialog
- AC-3.3: Confirming sends DELETE request using participationId
- AC-3.4: Success shows confirmation toast and updates UI immediately
- AC-3.5: Participant count decrements by 1
- AC-3.6: Button changes to "Join Ride" after leaving
- AC-3.7: Cannot leave ride after start time (enforced by backend)

### US-4: View Participant List
**As a** club member viewing a ride  
**I want to** see who else is joining  
**So that** I know who will be on the ride

**Acceptance Criteria:**
- AC-4.1: Participant list shows all confirmed participants
- AC-4.2: Each participant shows name and role badge
- AC-4.3: List is only visible to club members (not public)
- AC-4.4: List updates in real-time after join/leave actions
- AC-4.5: Empty state shows "No participants yet" message

---

## Technical Specification

### Route Structure

**Canonical URL Pattern:**
```
/clubs/[clubId]/rides/[rideId]
```

**Why this pattern:**
- Matches permission model (rides belong to clubs)
- Avoids global-ride ambiguity
- Scales cleanly for admin tools later
- Consistent with `/clubs/[clubId]` pattern

### Page Component

**Location:** `app/clubs/[clubId]/rides/[rideId]/page.tsx`

**Data Fetching:**
```typescript
// Use existing backend endpoint
GET /v1/clubs/{clubId}/rides/{rideId}

// Response includes:
{
  success: true,
  data: {
    ...rideDetails,
    viewerParticipation: {
      participationId: string,
      status: 'confirmed',
      joinedAt: string
    } | null,
    participants: [
      {
        userId: string,
        name: string,
        role: 'participant' | 'leader' | 'captain',
        joinedAt: string
      }
    ]
  }
}
```

### CTA Logic (Critical)

**Lock these rules - no exceptions:**

```typescript
// Determine which CTA to show
if (!user) {
  return <SignInPrompt />
}

if (ride.status !== 'published') {
  return <NoActionAvailable message="Ride not published" />
}

if (viewerParticipation) {
  return <LeaveRideButton participationId={viewerParticipation.participationId} />
}

if (ride.currentParticipants >= ride.maxParticipants) {
  return <RideFullMessage />  // No waitlist in 3.3.2
}

return <JoinRideButton clubId={clubId} rideId={rideId} />
```

### API Integration

**Join Ride:**
```typescript
POST /v1/clubs/{clubId}/rides/{rideId}/participants
Authorization: Bearer {token}

Response:
{
  success: true,
  data: {
    participationId: string,
    status: 'confirmed',
    joinedAt: string
  }
}
```

**Leave Ride:**
```typescript
DELETE /v1/participations/{participationId}
Authorization: Bearer {token}

Response:
{
  success: true,
  message: 'Successfully left ride'
}
```

### React Query Hooks

**New hooks to create:**

```typescript
// hooks/use-rides.ts (extend existing)

export const useRide = (clubId: string, rideId: string) => {
  return useQuery({
    queryKey: ['clubs', clubId, 'rides', rideId],
    queryFn: async () => {
      const response = await api.rides.get(clubId, rideId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    enabled: !!clubId && !!rideId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useJoinRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ clubId, rideId }) => {
      const response = await api.rides.join(clubId, rideId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data, { clubId, rideId }) => {
      // Invalidate ride detail and ride lists
      queryClient.invalidateQueries(['clubs', clubId, 'rides', rideId]);
      queryClient.invalidateQueries(['rides']);
      toast({ title: 'Joined Ride', description: 'You have successfully joined this ride.' });
    },
  });
};

export const useLeaveRide = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ participationId, clubId, rideId }) => {
      const response = await api.rides.leave(participationId);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (data, { clubId, rideId }) => {
      queryClient.invalidateQueries(['clubs', clubId, 'rides', rideId]);
      queryClient.invalidateQueries(['rides']);
      toast({ title: 'Left Ride', description: 'You have successfully left this ride.' });
    },
  });
};
```

---

## UI Components

### 1. Ride Detail Page Layout

**Always Visible Section:**
- Ride title (h1)
- Club name with link back to club page
- Status badge (published/draft/completed/cancelled)
- Date and start time (formatted, with timezone)
- Participant count: "X / Y riders" or "X riders" if no max
- Meeting point (name, address, map link)
- Route summary (distance, elevation if available, or "Route details TBD")

**Member-Only Section:**
- Participant list (names + role badges)
- Join/Leave CTA area

**Not Included in 3.3.2:**
- ❌ Comments/chat
- ❌ Activity feed
- ❌ Waitlist UI
- ❌ Edit controls
- ❌ Attendance marking
- ❌ Strava integration UI

### 2. Participant List Component

**Display:**
```typescript
interface ParticipantListProps {
  participants: Array<{
    userId: string;
    name: string;
    role: 'participant' | 'leader' | 'captain';
    joinedAt: string;
  }>;
}
```

**Show:**
- Name (or "Anonymous" if privacy settings later)
- Role badge (visual indicator)
- Joined timestamp (optional, "Joined 2 days ago")

**Don't Show:**
- Email addresses
- Strava profiles
- Participation IDs
- Actions on other users

### 3. Join/Leave Buttons

**Join Button:**
- Primary button style
- "Join Ride" text
- Loading state during mutation
- Disabled if ride is full

**Leave Button:**
- Secondary/outline button style
- "Leave Ride" text
- Shows confirmation dialog before action
- Disabled if ride has started

### 4. Confirmation Dialog

**Leave Ride Confirmation:**
```
Title: "Leave this ride?"
Message: "You can rejoin later if spots are available."
Actions: [Cancel] [Leave Ride]
```

---

## Implementation Order

**Low-risk sequence:**

1. **Page Shell + Read-Only Data** (Day 1 Morning)
   - Create page route structure
   - Implement useRide hook
   - Display all ride information
   - Show participant list
   - No actions yet

2. **Join CTA** (Day 1 Afternoon)
   - Implement useJoinRide hook
   - Add Join button with loading states
   - Handle success/error cases
   - Update UI optimistically

3. **Leave CTA** (Day 2 Morning)
   - Implement useLeaveRide hook
   - Add Leave button with confirmation dialog
   - Handle success/error cases
   - Update UI optimistically

4. **Polish** (Day 2 Afternoon)
   - Empty states (no participants)
   - Error states (ride not found, network errors)
   - Loading skeletons
   - Mobile responsiveness
   - Toast notifications

---

## Edge Cases & Error Handling

### Ride Not Found
- Show 404-style message
- Provide link back to rides list
- Log error for debugging

### Ride Status Changes
- If ride becomes unpublished while viewing, show message
- If ride fills up while viewing, update CTA immediately
- If ride starts while viewing, disable leave button

### Network Errors
- Show retry button
- Preserve form state
- Clear error messaging

### Concurrent Actions
- Optimistic updates for better UX
- Revert on error
- Handle race conditions (user joins from multiple tabs)

### Authorization Errors
- 401: Redirect to login
- 403: Show "Access denied" message
- Handle token expiration gracefully

---

## What NOT to Build

**Explicitly out of scope for 3.3.2:**

❌ **Waitlist functionality** - Show "Ride full" only, no waitlist UI  
❌ **Leadership reassignment** - Phase 3.4+  
❌ **Editing rides** - Phase 3.3.3 (create) first  
❌ **Attendance marking** - Post-ride feature, later phase  
❌ **Strava linking UI** - Already in Phase 2.5, surface later  
❌ **Comments/chat** - Not in MVP scope  
❌ **Ride sharing** - Not in MVP scope  
❌ **Calendar export** - Nice-to-have, later  

**Rule:** If it doesn't help someone join or leave a ride, it doesn't belong here.

---

## Testing Checklist

### Manual Testing

**Join Flow:**
- [ ] Can join ride with available capacity
- [ ] Cannot join full ride
- [ ] Cannot join unpublished ride
- [ ] Cannot join as non-member
- [ ] Participant count updates correctly
- [ ] Toast notification appears
- [ ] Ride list reflects new status

**Leave Flow:**
- [ ] Can leave ride before start time
- [ ] Cannot leave ride after start time
- [ ] Confirmation dialog appears
- [ ] Participant count updates correctly
- [ ] Toast notification appears
- [ ] Ride list reflects new status

**Edge Cases:**
- [ ] Ride not found shows 404
- [ ] Network error shows retry
- [ ] Concurrent join/leave handled
- [ ] Token expiration handled
- [ ] Mobile responsive

### Backend Verification

- [ ] GET /v1/clubs/{clubId}/rides/{rideId} returns viewerParticipation
- [ ] POST join endpoint works
- [ ] DELETE leave endpoint works
- [ ] Authorization enforced correctly
- [ ] Participant count accurate

---

## Success Criteria

**Phase 3.3.2 is complete when:**

1. ✅ Users can view full ride details at `/clubs/[clubId]/rides/[rideId]`
2. ✅ Users can join rides with available capacity
3. ✅ Users can leave rides before start time
4. ✅ Participant list displays correctly
5. ✅ All CTAs follow the locked logic rules
6. ✅ Error states handled gracefully
7. ✅ Mobile responsive
8. ✅ No waitlist UI (intentionally deferred)

**Time estimate:** 1-2 focused days

---

## Next Phase

**Phase 3.3.3: Create Ride**
- Multi-step ride creation form
- Draft → Publish workflow
- Captain/leader authorization
- Route selection integration

---

## Notes

- Backend endpoints already exist and work (tested in Phase 2.3)
- `viewerParticipation` field makes join/leave logic clean
- No need to track participation state separately
- Optimistic updates improve perceived performance
- Keep it simple - resist feature creep

