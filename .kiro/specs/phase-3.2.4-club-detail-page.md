# Phase 3.2.4: Club Detail Page - Specification v1

## Overview

Phase 3.2.4 creates the "bridge" between club membership and ride participation by building individual club detail pages. This completes the discovery loop: Browse → Join → Enter club space → See rides.

**Duration**: 1 week  
**Dependencies**: Phase 3.2.3 (✅ Complete)  
**Risk Level**: Low - Leverages existing backend APIs  
**Success Metric**: Members can view club details and see upcoming rides

**Key Refinements** (based on product review):
- ✅ Removed member directory (deferred to Phase 4 as social feature)
- ✅ Clarified ride creation permissions (leader/captain/admin/owner)
- ✅ Added club state handling (suspended/archived)
- ✅ Normalized pagination response structure
- ✅ Focus on ride coordination, not social networking

## Strategic Context

### The Bridge Concept

The club detail page is the **bridge** between:
- **Discovery** (browsing clubs in directory)
- **Membership** (joining/leaving clubs)
- **Participation** (viewing and joining rides)

Without this bridge, users can join clubs but have nowhere to go. This page becomes the **entry point** for all club activity.

### What We're Building

**Public Section** (all users):
- Club name, location, description
- Member count (privacy-aware)
- Join/Leave button (context-aware)

**Member Section** (active members only):
- Next 5 upcoming rides
- Create Ride button (leaders/admins only)

**NOT Building** (deferred to Phase 4+):
- ❌ Member directory (social feature, not ride coordination)
- ❌ Activity feeds
- ❌ Announcements
- ❌ Admin dashboards
- ❌ Strava matching UI
- ❌ Route templates display

**Rationale**: This phase focuses on **ride coordination**, not social networking. The member directory adds complexity without immediate value for the core flow: find rides → join rides → ride together.

## Requirements

### Functional Requirements

#### FR-1: Public Club Information
**User Story**: As any user, I want to view basic club information, so that I can decide if I want to join.

**Acceptance Criteria**:
1. WHEN a user visits `/clubs/[clubId]` THEN the system SHALL display club name, location, and description
2. WHEN displaying member count THEN the system SHALL show exact count for public clubs
3. WHEN displaying member count for private clubs THEN the system SHALL show approximate count (e.g., "10+ members")
4. THE system SHALL display club information without requiring authentication

#### FR-2: Membership Actions
**User Story**: As a user, I want to join or leave clubs from the club page, so that I can manage my memberships.

**Acceptance Criteria**:
1. WHEN a non-member views a club THEN the system SHALL display a "Join Club" button
2. WHEN an active member views a club THEN the system SHALL display a "Leave Club" button
3. WHEN a user with pending application views a club THEN the system SHALL display "Application Pending" status
4. WHEN a user clicks "Join Club" THEN the system SHALL activate membership immediately (Phase 3.2.3 behavior)
5. WHEN a user clicks "Leave Club" THEN the system SHALL show confirmation dialog before leaving

#### FR-3: Member-Only Content
**User Story**: As an active club member, I want to see upcoming rides, so that I can plan my participation.

**Acceptance Criteria**:
1. WHEN an active member views a club THEN the system SHALL display the next 5 upcoming rides
2. WHEN a non-member views a club THEN the system SHALL NOT display upcoming rides
3. WHEN displaying rides THEN the system SHALL show ride title, date, time, and participant count
4. WHEN a member clicks a ride THEN the system SHALL navigate to the ride detail page
5. WHEN there are no upcoming rides THEN the system SHALL display an empty state with helpful message

#### FR-4: Create Ride Access
**User Story**: As a ride leader or admin, I want to create rides from the club page, so that I can organize club activities.

**Acceptance Criteria**:
1. WHEN a ride leader, ride captain, admin, or owner views a club THEN the system SHALL display a "Create Ride" button
2. WHEN a regular member views a club THEN the system SHALL NOT display the "Create Ride" button
3. WHEN a user clicks "Create Ride" THEN the system SHALL navigate to the ride creation page (Phase 3.3)

**Role Permissions**:
```typescript
canCreateRide = ['ride_leader', 'ride_captain', 'admin', 'owner'].includes(membership.role)
```

### Non-Functional Requirements

#### NFR-1: Performance
- Page load time < 2s on 3G connection
- Skeleton screens during data loading
- Parallel API calls for club data and rides

#### NFR-2: Mobile Responsiveness
- Single column layout on mobile (< 768px)
- Two column layout on desktop (≥ 768px)
- Touch-friendly buttons (44px minimum)

#### NFR-4: Club State Handling
- Suspended clubs: Hide rides + show banner
- Archived clubs: Read-only view only
- Active clubs: Show normally

#### NFR-5: Accessibility
- WCAG 2.1 AA compliance
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly

## Design

### Page Architecture

**Route**: `/clubs/[clubId]`

**Component Structure**:
```
app/clubs/[clubId]/page.tsx
├── ClubHeader (public)
│   ├── Club name
│   ├── Location
│   └── Member count
├── ClubDescription (public)
│   └── Club description text
├── MembershipActions (public/member)
│   ├── Join button (non-members)
│   ├── Leave button (members)
│   └── Pending badge (applicants)
└── MemberContent (member-only)
    └── UpcomingRides
        ├── Ride cards (next 5)
        ├── Empty state
        └── Create Ride button (leaders+)
```

### API Endpoints

**Existing APIs** (already implemented):
```typescript
// Club details
GET /v1/clubs/{clubId}
Response: {
  success: boolean;
  data: {
    id: string;
    name: string;
    description?: string;
    city?: string;
    logoUrl?: string;
    memberCount?: number;
    status: 'active' | 'suspended' | 'archived';
    createdAt: string;
    updatedAt: string;
    userMembership?: {
      membershipId: string;
      role: 'member' | 'admin' | 'owner';
      status: 'active' | 'pending' | 'suspended' | 'removed';
      joinedAt: string;
    };
  };
}

// Club members (normalized pagination)
GET /v1/clubs/{clubId}/members
Response: {
  success: boolean;
  data: {
    members: ClubMember[];
    pagination: {
      limit: number;
      nextCursor?: string;
    };
  };
}

// Club rides (Phase 2.3)
GET /v1/rides?clubId={clubId}&status=published&limit=5
Response: {
  success: boolean;
  data: Ride[];
  pagination: {
    limit: number;
    nextCursor?: string;
  };
}
```

### State Management

**React Query Hooks** (already exist):
```typescript
// From hooks/use-clubs.ts
useClub(clubId)           // Club details
useJoinClub()             // Join mutation
useLeaveClub()            // Leave mutation

// NEW: To be created
useClubRides(clubId)      // Upcoming rides
```

**Cache Strategy**:
- Club public data: 5 min stale time
- Upcoming rides: 1 min stale time
- Invalidate on mutations (join, leave, create ride)

### UI/UX Design

#### Mobile Layout (< 768px)
```
┌─────────────────────┐
│ Club Header         │
│ - Name              │
│ - Location          │
│ - Member count      │
├─────────────────────┤
│ Description         │
├─────────────────────┤
│ [Join/Leave Button] │
├─────────────────────┤
│ Upcoming Rides      │
│ (member-only)       │
│ - Ride 1            │
│ - Ride 2            │
│ - ...               │
│ [Create Ride]       │
└─────────────────────┘
```

#### Desktop Layout (≥ 768px)
```
┌──────────────────────────────────────┐
│ Club Header                          │
│ Name | Location | Member count       │
├──────────────────┬───────────────────┤
│ Description      │ Membership        │
│                  │ [Join/Leave]      │
├──────────────────┴───────────────────┤
│ Upcoming Rides (member-only)         │
│ ┌────────┐ ┌────────┐ ┌────────┐   │
│ │ Ride 1 │ │ Ride 2 │ │ Ride 3 │   │
│ └────────┘ └────────┘ └────────┘   │
│ [Create Ride]                        │
└──────────────────────────────────────┘
```

### Authorization Logic

**Public Data** (no auth required):
- Club name, description, location
- Member count (privacy-aware)

**Member-Only Data** (requires active membership):
- Upcoming rides list
- Create ride button (captain+)

**Authorization Check**:
```typescript
const isActiveMember = 
  club.userMembership?.status === 'active';

const canCreateRides = 
  isActiveMember && 
  ['ride_leader', 'ride_captain', 'admin', 'owner'].includes(
    club.userMembership?.role
  );
```

### Loading States

**Skeleton Screens**:
```typescript
// Club header skeleton
<div className="animate-pulse">
  <div className="h-8 bg-gray-200 rounded w-1/3 mb-2" />
  <div className="h-4 bg-gray-200 rounded w-1/4" />
</div>

// Ride card skeleton
<div className="animate-pulse">
  <div className="h-6 bg-gray-200 rounded w-2/3 mb-2" />
  <div className="h-4 bg-gray-200 rounded w-1/2" />
</div>
```

**Progressive Loading**:
1. Show club header first (fast)
2. Load rides in parallel (slower)
3. Load members in parallel (slower)
4. Show empty states if no data

### Error Handling

**User-Friendly Messages**:
```typescript
const getErrorMessage = (error: ApiError): string => {
  switch (error.code) {
    case 'CLUB_NOT_FOUND':
      return 'This club no longer exists';
    case 'UNAUTHORIZED':
      return 'Please sign in to view this club';
    case 'FORBIDDEN':
      return 'You do not have permission to view this club';
    default:
      return 'Something went wrong. Please try again.';
  }
};
```

## Implementation Plan

### Task 1: Create Club Detail Page Structure
**Estimated Time**: 2 hours

**Subtasks**:
1. Create `app/clubs/[clubId]/page.tsx`
2. Set up basic layout with Header and Footer
3. Extract clubId from URL params
4. Add loading and error states
5. Test page routing

**Acceptance**:
- Page loads at `/clubs/[clubId]`
- Shows loading state initially
- Shows error state for invalid clubId

### Task 2: Implement Public Section
**Estimated Time**: 3 hours

**Subtasks**:
1. Use `useClub(clubId)` hook to fetch club data
2. Create ClubHeader component (name, location, member count)
3. Create ClubDescription component
4. Add privacy-aware member count display
5. Test with real club data

**Acceptance**:
- Club header displays correctly
- Description shows properly
- Member count respects privacy settings
- Works for both authenticated and unauthenticated users

### Task 3: Implement Membership Actions
**Estimated Time**: 2 hours

**Subtasks**:
1. Reuse join/leave logic from directory page
2. Add context-aware button display
3. Show "Application Pending" for pending status
4. Add confirmation dialog for leave action
5. Test join/leave flow

**Acceptance**:
- Join button shows for non-members
- Leave button shows for members
- Pending badge shows for applicants
- Confirmation dialog works correctly

### Task 4: Create Upcoming Rides Hook
**Estimated Time**: 2 hours

**Subtasks**:
1. Create `useClubRides` hook in `hooks/use-clubs.ts`
2. Call `GET /v1/rides?clubId={id}&status=published&limit=5`
3. Add proper error handling
4. Set staleTime to 1 minute
5. Test with real ride data

**Acceptance**:
- Hook fetches rides correctly
- Filters to published rides only
- Limits to 5 rides
- Handles errors gracefully

### Task 5: Implement Upcoming Rides Section
**Estimated Time**: 3 hours

**Subtasks**:
1. Create UpcomingRides component
2. Display ride cards (title, date, time, participants)
3. Add empty state for no rides
4. Add "Create Ride" button (conditional on role)
5. Make ride cards clickable (navigate to ride detail)
6. Test with various ride counts

**Acceptance**:
- Rides display correctly for members
- Empty state shows when no rides
- Create Ride button shows for leaders/admins
- Ride cards are clickable
- Section hidden for non-members

### Task 6: Mobile Optimization
**Estimated Time**: 2 hours

**Subtasks**:
1. Test on mobile viewport (< 768px)
2. Ensure single column layout
3. Verify touch targets (44px minimum)
4. Test scrolling behavior
5. Fix any layout issues

**Acceptance**:
- Single column layout on mobile
- All buttons are touch-friendly
- No horizontal scroll
- Smooth scrolling

### Task 7: Testing & Polish
**Estimated Time**: 2 hours

**Subtasks**:
1. Test complete user flow (browse → join → view club)
2. Test authorization logic (public vs member content)
3. Test error states (invalid clubId, network errors)
4. Test loading states
5. Accessibility audit (keyboard navigation, screen reader)
6. Fix any bugs

**Acceptance**:
- All user flows work correctly
- Authorization logic is correct
- Error handling is user-friendly
- Loading states are smooth
- Accessibility compliant

## Testing Strategy

### Manual Testing

**Test Cases**:
1. **Public User**:
   - Visit club page without auth
   - Verify public section visible
   - Verify member section hidden
   - Verify "Join" button shows

2. **Non-Member (Authenticated)**:
   - Visit club page as authenticated user
   - Verify public section visible
   - Verify member section hidden
   - Verify "Join" button shows
   - Click "Join" and verify immediate activation

3. **Pending Applicant**:
   - Visit club page with pending application
   - Verify "Application Pending" badge shows
   - Verify member section hidden

4. **Active Member**:
   - Visit club page as active member
   - Verify public section visible
   - Verify member section visible
   - Verify upcoming rides display
   - Verify "Leave" button shows

5. **Ride Leader/Captain/Admin**:
   - Visit club page as leader/admin
   - Verify "Create Ride" button shows
   - Verify all member content visible

### Edge Cases

1. **No Upcoming Rides**:
   - Verify empty state displays
   - Verify helpful message

2. **No Members**:
   - Verify empty state displays
   - Verify helpful message

3. **Suspended/Archived Clubs**:
   - Verify suspended clubs show banner
   - Verify archived clubs are read-only
   - Verify rides hidden for suspended clubs

4. **Invalid Club ID**:
   - Verify error message displays
   - Verify user can navigate back

5. **Network Error**:
   - Verify error message displays
   - Verify retry button works

## Success Criteria

### Functional
- [ ] Public section displays for all users
- [ ] Member section displays only for active members
- [ ] Join/leave functionality works correctly
- [ ] Upcoming rides display for members
- [ ] Create Ride button shows for leaders/captains/admins
- [ ] Authorization logic is correct
- [ ] Club state handling (suspended/archived) works

### Technical
- [ ] Page load time < 2s on 3G
- [ ] No console errors or warnings
- [ ] Proper cache invalidation on mutations
- [ ] Error states handled gracefully
- [ ] Loading states are smooth

### User Experience
- [ ] Navigation is intuitive
- [ ] Loading states are clear
- [ ] Error messages are helpful
- [ ] Empty states guide next actions
- [ ] Mobile experience is smooth
- [ ] Accessibility compliant (WCAG 2.1 AA)

## Deployment Plan

### Pre-Deployment
1. Test on localhost with real backend data
2. Test all user roles and states
3. Test mobile responsiveness
4. Run accessibility audit
5. Fix any bugs

### Deployment
1. Push to GitHub
2. Vercel auto-deploys to preview URL
3. Test on preview URL
4. Merge to main
5. Vercel auto-deploys to production

### Post-Deployment
1. Test on production URL
2. Monitor for errors
3. Gather user feedback
4. Plan Phase 3.3 based on usage

## Known Limitations

**Documented Limitations** (acceptable for MVP):
1. **No Pagination**: Rides limited to first 5
   - Impact: Low (most clubs have < 5 upcoming rides)
   - Workaround: None needed for MVP
   - Future: Add pagination in Phase 3.3

2. **No Real-Time Updates**: Data refreshes on page load only
   - Impact: Low (club data changes infrequently)
   - Workaround: Manual page refresh
   - Future: Add real-time updates in Phase 4

3. **No Ride Filtering**: Shows all upcoming rides
   - Impact: Low (limited to 5 rides)
   - Workaround: None needed for MVP
   - Future: Add filtering in Phase 3.3

4. **No Member Directory**: Deferred to Phase 4
   - Impact: Low (focus is ride coordination, not social networking)
   - Workaround: Members can see each other on rides
   - Future: Add member directory in Phase 4 as social feature

## Next Steps (Phase 3.3)

After Phase 3.2.4 is complete, the next logical phase is:

**Phase 3.3: Ride Discovery & Participation**
- Ride detail pages
- Join/leave ride functionality
- Ride search and filtering
- Ride creation UI (for leaders/admins)

This builds on the club detail page by enabling users to:
1. View ride details
2. Join rides
3. Manage ride participation
4. Create new rides (leaders/admins)

## Conclusion

Phase 3.2.4 completes the "bridge" between club membership and ride participation. Once users can:
1. Browse clubs (Phase 3.2.2) ✅
2. Join clubs (Phase 3.2.3) ✅
3. View club details and upcoming rides (Phase 3.2.4) ← **This phase**

They'll be ready to:
4. View ride details and join rides (Phase 3.3) ← **Next phase**

This creates a complete user journey from discovery to participation, validating the core value proposition of the platform.

**Status**: Ready for implementation  
**Next Step**: Begin with Task 1 (Create Club Detail Page Structure)
