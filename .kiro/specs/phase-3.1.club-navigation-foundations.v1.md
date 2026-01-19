# Phase 3.1: Club Navigation Foundations - Specification v2

## Overview

Phase 3.1 establishes clean, focused club navigation and management functionality. This phase fixes data hydration issues from the previous rollback and implements a simplified, mobile-first approach to club discovery and membership management.

**Duration**: 1 week (5 working days)  
**Dependencies**: Phase 2.5 backend (✅ Complete)  
**Risk Level**: Low - Focused fixes and simplification  
**Success Metric**: Users can discover clubs, join them, and navigate cleanly between pages

## Strategic Direction (Post-Rollback Analysis)

### Lessons from Phase 3.1 Rollback
- **Data hydration issues**: "Unknown Club" problems from N+1 API calls
- **Over-engineering**: Premature notifications and complex inline expansions
- **Mobile UX gaps**: Desktop-first thinking that broke on mobile

### Core Principles (Locked)
✅ **Navigation over expansion** - Click to navigate, don't expand inline  
✅ **Mobile-first design** - Single column navigation on mobile  
✅ **Fix data at source** - Hydrated APIs prevent UI race conditions  
✅ **Scope discipline** - Core functionality only, no premature features  

### Page Role Clarity (Final Decision)
- **/directory** → Discovery/Marketing (public clubs, rich cards, SEO-friendly)
- **/my-clubs** → Personal Launcher (auth-only dashboard, no discovery)  
- **/clubs/[clubId]** → Club Home (shared context, members + interested users)

## Critical Fix: Data Hydration (Must Be Done First)

### The "Unknown Club" Problem
**Root Cause**: Current flow fetches membership IDs first, then resolves club data separately, causing race conditions and "Unknown Club" placeholders.

**Required Solution**: Introduce hydrated endpoint that eliminates N+1 calls:

```typescript
// NEW: Hydrated endpoint
GET /v1/users/me/clubs

// Response shape
interface MyClubMembership {
  clubId: string
  clubName: string        // ← Eliminates "Unknown Club"
  clubSlug: string        // ← For navigation
  clubLocation?: string   // ← For display
  clubAvatarUrl?: string  // ← For rich cards
  memberCount?: number    // ← For context
  membershipRole: 'member' | 'leader' | 'admin' | 'owner'
  membershipStatus: 'active' | 'pending'
  joinedAt: string
}
```

**Why This Matters**:
- One request = one render (no loading states)
- No N+1 API calls
- Cleaner frontend logic
- Prevents UI bugs from cascading

### Implementation Priority
1. **Backend**: Add hydrated `/v1/users/me/clubs` endpoint
2. **Frontend**: Replace separate membership + club calls
3. **Remove**: All "Unknown Club" fallback logic
4. **Test**: Verify no race conditions remain

## Simplified UI Strategy

### Remove Notifications Card (Immediate)
The notifications card on `/my-clubs` creates "fake controls" and is premature for Phase 3.1.

**Decision**: 
❌ Remove entirely OR  
🔧 Hide behind explicit flag: `NEXT_PUBLIC_DEV_TOOLS=true`

**Rationale**: Notifications are Phase 4+ scope, not core navigation.

### Navigation-First Behavior (Enforced)
**Rule**: Clicking a club in `/my-clubs` → navigate to `/clubs/[clubId]`

**No inline expansion because**:
- Simpler state management
- Mobile-friendly (single column)
- Clear URLs for sharing
- Matches established patterns (GitHub, Slack, Notion)

### Mobile-First Layout Strategy
- **Desktop**: List + detail layouts acceptable
- **Mobile**: Single-column navigation only
  - `/my-clubs` → list view
  - Select club → navigate to detail page
  - Back button returns to list

## Technical Specifications

### Backend API Requirements

#### New Hydrated Endpoint (Priority 1)
```typescript
// Replace existing separate calls
GET /v1/users/me/clubs
Authorization: Bearer {jwt}

Response: {
  success: boolean;
  data: MyClubMembership[];
}
```

#### Existing Endpoints (Keep As-Is)
```typescript
// Club Discovery (public)
GET /v1/clubs/discovery
Response: {
  success: boolean;
  data: Club[];
  pagination: { limit: number; nextCursor?: string };
}

// Club Details (shared context)
GET /v1/clubs/{clubId}
Response: {
  success: boolean;
  data: Club;
}

// Join/Leave Actions (existing)
POST /v1/clubs/{clubId}/members
DELETE /v1/memberships/{membershipId}
```

### Component Architecture

#### App Shell Structure
```
app/
├── layout.tsx                 # Root layout with navigation
├── page.tsx                   # Home/dashboard page
├── clubs/
│   ├── page.tsx              # Club discovery page
│   ├── [clubId]/
│   │   └── page.tsx          # Club detail page
│   └── my-clubs/
│       └── page.tsx          # My clubs dashboard
└── components/
    ├── navigation/
    │   ├── app-shell.tsx     # Main app container
    │   ├── sidebar.tsx       # Navigation sidebar
    │   ├── header.tsx        # Top header bar
    │   └── mobile-nav.tsx    # Mobile navigation
    ├── clubs/
    │   ├── club-card.tsx     # Club preview card
    │   ├── club-list.tsx     # Club listing component
    │   ├── club-detail.tsx   # Club detail view
    │   ├── join-club-button.tsx # Join/leave club action
    │   └── membership-badge.tsx # User membership status
    └── ui/
        ├── button.tsx        # Base button component
        ├── card.tsx          # Base card component
        ├── loading.tsx       # Loading states
        └── empty-state.tsx   # Empty state component
```

### Page Specifications (Simplified)

#### Routing Structure (Locked)
```
/directory                          # Club discovery (public marketing)
/my-clubs                          # Personal launcher (auth dashboard)
/clubs/[clubId]                    # Club home (shared context)
```

**Benefits**: Clear separation of concerns, predictable patterns, mobile-friendly

#### 1. App Shell (`app/layout.tsx`)
**Purpose**: Minimal navigation container

**Requirements**:
- Responsive navigation (sidebar desktop, bottom nav mobile)
- Authentication state (user profile, logout)
- Route-based active highlighting
- **No complex features** - just navigation

#### 2. Club Discovery (`/directory`)
**Purpose**: Public club discovery and marketing

**Audience**: Logged-out + logged-in users  
**Features**:
- Rich club cards (image, focus, pace, location, meeting times)
- Filters (area, pace, beginner-friendly)
- SEO-friendly, public
- Primary CTA surface for joining clubs

**Logged-in vs Logged-out**:
- **Logged out**: Full browsing, CTA: "Sign in to apply"
- **Logged in**: Same experience + membership state on cards:
  - Member → "View club"
  - Pending → "Request sent"  
  - Not a member → "Request to join"

#### 3. My Clubs Dashboard (`/my-clubs`)
**Purpose**: Personal launcher (auth-only)

**Audience**: Logged-in users only  
**Purpose**: "Where do I belong?"

**Features**:
- List of user's club memberships (using hydrated data)
- Shows role + membership status
- Fast access to each club via navigation
- **No discovery, no filters, no marketing copy**

**Layout**:
```
My Clubs Header
├── Total clubs count
├── Active memberships
└── [Remove notifications card]

Club Cards (Compact)
├── Club name and role
├── Membership status
├── Click → navigate to /clubs/[clubId]
└── Leave club action (secondary)
```

**Critical**: Use hydrated `/v1/users/me/clubs` data to prevent "Unknown Club"

#### 4. Club Detail (`/clubs/[clubId]`)
**Purpose**: Full club experience (shared context)

**Audience**: Members + interested users  
**Phase 3.1 Scope**: Read-only

**Information Architecture**:
```
Club Header
├── Club name and description
├── Location and member count  
├── Join/Leave button (context-aware)
└── User's membership status badge

Club Content (Members Only)
├── Member list (basic)
├── Club statistics (basic)
└── [Future: rides, admin tools, analytics]
```

**Authorization Logic**:
- **Public**: Club name, description, location, member count
- **Members**: Full club details, member list
- **Non-members**: Join button and public information only

### Component Architecture (Simplified)

#### Shared Components Strategy
**Rule**: Share data + logic, not layouts

```typescript
// ClubCard variants for different contexts
interface ClubCardProps {
  club: Club | MyClubMembership;
  variant: 'rich' | 'compact';  // rich for /directory, compact for /my-clubs
  showJoinButton?: boolean;
  onNavigate?: (clubId: string) => void;
}

// ClubCardRich → /directory (discovery)
// ClubCardCompact → /my-clubs (dashboard)
// Same data model, different presentation
```

#### Data Calls Strategy
```typescript
// /directory: GET /v1/clubs/discovery 
// (public clubs + optional membership state if logged in)

// /my-clubs: GET /v1/users/me/clubs 
// (hydrated membership data - no separate club calls)

// /clubs/[clubId]: GET /v1/clubs/{clubId}
// (full club details for shared context)
```

### State Management (Simplified)

#### React Query Patterns
```typescript
// Hydrated memberships (fixes "Unknown Club")
export const useMyClubs = () => {
  return useQuery({
    queryKey: ['users', 'me', 'clubs'],
    queryFn: () => apiClient.users.getMyClubs(), // NEW hydrated endpoint
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  });
};

// Club discovery (existing)
export const useClubDiscovery = (params?: ClubListParams) => {
  return useQuery({
    queryKey: ['clubs', 'discovery', params],
    queryFn: () => apiClient.clubs.discovery(params),
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

// Individual club details (existing)
export const useClub = (clubId: string) => {
  return useQuery({
    queryKey: ['clubs', clubId],
    queryFn: () => apiClient.clubs.get(clubId),
    enabled: !!clubId,
    staleTime: 5 * 60 * 1000,
  });
};
```

#### Cache Invalidation (Critical)
```typescript
export const useJoinClub = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clubId, joinMessage }: JoinClubParams) =>
      apiClient.clubs.join(clubId, { joinMessage }),
    onSuccess: (membership) => {
      // Invalidate affected queries
      queryClient.invalidateQueries(['users', 'me', 'clubs']); // My clubs
      queryClient.invalidateQueries(['clubs', membership.clubId]); // Club detail
      queryClient.invalidateQueries(['clubs', 'discovery']); // Discovery list
    },
  });
};
```

### Mobile-First Design System

#### Responsive Breakpoints
```css
/* Tailwind CSS breakpoints */
sm: 640px   /* Small tablets */
md: 768px   /* Large tablets */
lg: 1024px  /* Small desktops */
xl: 1280px  /* Large desktops */

/* Mobile-first approach */
.club-card {
  @apply w-full p-4 mb-4;           /* Mobile: full width, stack */
  @apply sm:w-1/2 sm:px-2;          /* Tablet: 2 columns */
  @apply lg:w-1/3;                  /* Desktop: 3 columns */
}
```

#### Touch-Friendly Interactions
```css
/* Minimum touch targets */
.touch-target {
  @apply min-h-[44px] min-w-[44px];
}

/* Button styles */
.btn-primary {
  @apply bg-blue-600 text-white px-6 py-3 rounded-lg;
  @apply hover:bg-blue-700 active:bg-blue-800;
  @apply disabled:bg-gray-300 disabled:cursor-not-allowed;
  @apply transition-colors duration-200;
}
```

### Error Handling and Loading States

#### Loading States
```typescript
// Component loading patterns
const ClubList = () => {
  const { data: clubs, isLoading, error } = useClubs();
  
  if (isLoading) {
    return <ClubListSkeleton />;
  }
  
  if (error) {
    return <ErrorState error={error} retry={() => refetch()} />;
  }
  
  if (!clubs?.length) {
    return <EmptyState 
      title="No clubs found"
      description="Be the first to create a club in your area"
      action={<Button>Create Club</Button>}
    />;
  }
  
  return <ClubGrid clubs={clubs} />;
};
```

#### Error Messages
```typescript
// User-friendly error messages
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

### Performance Optimizations

#### Performance Guardrail Implementation
**Rule**: No page blocks on more than 2 sequential API calls

```typescript
// Club Detail Page - Parallel Loading Pattern
const ClubDetailPage = ({ clubId }: { clubId: string }) => {
  // ✅ Good: Parallel API calls
  const { data: club, isLoading: clubLoading } = useClub(clubId);
  const { data: members, isLoading: membersLoading } = useClubMembers(clubId);
  const { data: upcomingRides, isLoading: ridesLoading } = useUpcomingRides(clubId);
  
  // Show progressive loading states
  if (clubLoading) return <ClubDetailSkeleton />;
  if (!club) return <ClubNotFound />;
  
  return (
    <div>
      <ClubHeader club={club} />
      {membersLoading ? <MembersSkeleton /> : <MembersList members={members} />}
      {ridesLoading ? <RidesSkeleton /> : <UpcomingRides rides={upcomingRides} />}
    </div>
  );
};
```

#### Image Optimization
```typescript
// Next.js Image component for club avatars
import Image from 'next/image';

const ClubAvatar = ({ club }: { club: Club }) => (
  <Image
    src={club.avatarUrl || '/default-club-avatar.jpg'}
    alt={`${club.name} avatar`}
    width={64}
    height={64}
    className="rounded-full"
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,..."
  />
);
```

#### Code Splitting
```typescript
// Lazy load heavy components
const ClubDetailModal = lazy(() => import('./club-detail-modal'));

// Use Suspense for loading states
<Suspense fallback={<LoadingSpinner />}>
  <ClubDetailModal clubId={clubId} />
</Suspense>
```

### Testing Strategy

#### Unit Tests
```typescript
// Component testing with React Testing Library
describe('JoinClubButton', () => {
  it('shows join button for non-members', () => {
    render(<JoinClubButton club={mockClub} membership={null} />);
    expect(screen.getByText('Join Club')).toBeInTheDocument();
  });
  
  it('shows leave button for active members', () => {
    render(<JoinClubButton club={mockClub} membership={activeMembership} />);
    expect(screen.getByText('Leave Club')).toBeInTheDocument();
  });
  
  it('handles join club mutation', async () => {
    const onJoinSuccess = jest.fn();
    render(<JoinClubButton club={mockClub} onJoinSuccess={onJoinSuccess} />);
    
    fireEvent.click(screen.getByText('Join Club'));
    await waitFor(() => expect(onJoinSuccess).toHaveBeenCalled());
  });
});
```

#### Integration Tests
```typescript
// End-to-end user journey testing
describe('Club Discovery Journey', () => {
  it('allows user to discover and join a club', async () => {
    // Navigate to clubs page
    await page.goto('/clubs');
    
    // Search for a club
    await page.fill('[data-testid=club-search]', 'Sydney Cyclists');
    
    // Click on club card
    await page.click('[data-testid=club-card-sydney-cyclists]');
    
    // Join the club
    await page.click('[data-testid=join-club-button]');
    
    // Verify success
    await expect(page.locator('[data-testid=membership-badge]')).toBeVisible();
  });
});
```

### Accessibility Requirements

#### WCAG 2.1 AA Compliance
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: Minimum 4.5:1 ratio for text
- **Focus Management**: Clear focus indicators and logical tab order

#### Implementation
```typescript
// Accessible button component
const Button = ({ children, ...props }) => (
  <button
    className="focus:outline-none focus:ring-2 focus:ring-blue-500"
    aria-describedby={props['aria-describedby']}
    {...props}
  >
    {children}
  </button>
);

// Screen reader announcements
const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
};
```

## Phase 3.1 Scope Discipline (Locked)

### What IS Included ✅
- **Data hydration fix** - New `/v1/users/me/clubs` endpoint
- **App shell navigation** - Minimal, responsive navigation
- **Club discovery** (`/directory`) - Public clubs with rich cards
- **Personal dashboard** (`/my-clubs`) - Hydrated membership list
- **Club detail pages** (`/clubs/[clubId]`) - Read-only, shared context
- **Join/leave workflow** - Basic membership management
- **Navigation-first behavior** - Click to navigate, no inline expansion

### What is NOT Included ❌ (Phase 3.2+)
- ❌ **Notifications card** - Removed or hidden behind dev flag
- ❌ **Inline expansion** - All interactions navigate to new pages
- ❌ **Club creation UI** - Admin-only feature
- ❌ **Invite flows** - Private club features
- ❌ **Ride management** - Belongs in Phase 3.3+
- ❌ **Admin dashboards** - Complex management features
- ❌ **Real-time features** - Notifications, live updates

**Response to scope requests**: "That's planned for Phase 3.2+ after we nail the navigation foundations"

## Implementation Order (Revised)

### Day 1: Data Foundation
- [x] **Backend**: Add hydrated `/v1/users/me/clubs` endpoint
- [x] **Frontend**: Replace separate membership + club API calls
- [ ] **Remove**: "Unknown Club" fallback logic
- [ ] **Test**: Verify no race conditions in `/my-clubs`

### Day 2: Navigation Structure  
- [ ] **App shell**: Minimal navigation container
- [ ] **Route structure**: `/directory`, `/my-clubs`, `/clubs/[clubId]`
- [ ] **Mobile nav**: Bottom navigation for mobile
- [ ] **Auth guard**: Protect `/my-clubs` route

### Day 3: Club Discovery
- [ ] **`/directory` page**: Public club discovery with rich cards
- [ ] **Search/filters**: Basic club filtering
- [ ] **Join workflow**: Happy path join functionality
- [ ] **Logged-in state**: Show membership status on cards

### Day 4: Personal Dashboard
- [ ] **`/my-clubs` page**: Use hydrated data, compact cards
- [ ] **Remove notifications**: Delete or hide behind dev flag
- [ ] **Navigation behavior**: Click club → navigate to detail
- [ ] **Leave club**: Secondary action on cards

### Day 5: Club Details + Polish
- [ ] **`/clubs/[clubId]` page**: Read-only club information
- [ ] **Member-only content**: Authorization-based sections
- [ ] **Mobile polish**: Touch targets, responsive design
- [ ] **E2E test**: Complete "Join a Club" journey

**Deployment Strategy**: Deploy daily, continuous integration

## Success Criteria (Revised)

### Functional Requirements
- [ ] **No "Unknown Club" issues** - Hydrated data loads correctly
- [ ] **Clean navigation** - Click club → navigate to detail page
- [ ] **Mobile-first responsive** - Single column navigation on mobile
- [ ] **Join/leave workflow** - Complete membership management
- [ ] **Discovery works** - Users can find and join public clubs
- [ ] **Dashboard clarity** - `/my-clubs` shows personal memberships only

### Technical Requirements
- [ ] **Data hydration** - Single API call for membership data
- [ ] **Performance** - Page loads under 3 seconds on 3G
- [ ] **Mobile UX** - Touch-friendly, no horizontal scroll
- [ ] **Error handling** - Clear feedback for all failure states
- [ ] **Cache invalidation** - Join/leave actions update all affected views

### User Experience Requirements
- [ ] **Navigation clarity** - Users understand where they are
- [ ] **No fake controls** - All buttons perform real actions
- [ ] **Mobile native feel** - Smooth navigation, proper touch targets
- [ ] **Loading states** - Skeleton screens, no "Unknown" placeholders
- [ ] **Empty states** - Guide users to next actions

## Risk Mitigation (Updated)

### Technical Risks
- **Data hydration complexity**: Start with backend endpoint, test thoroughly
- **Mobile performance**: Implement performance budgets, real device testing
- **State management**: Use proven React Query patterns, avoid over-engineering

### User Experience Risks  
- **Navigation confusion**: User test the simplified flow
- **Mobile usability**: Test on real devices, various screen sizes
- **Feature expectations**: Clear communication about Phase 3.1 scope

### Rollback Plan
- **Frontend-only changes**: Easy revert via Vercel deployment history
- **Feature flags**: Gradual rollout capability
- **Staging validation**: Full testing before production deployment

## Key Differences from Previous Version

### What Changed
1. **Data hydration priority** - Fixed at API level, not UI bandaids
2. **Removed notifications** - Eliminated premature features
3. **Navigation-first** - No inline expansion, clean page transitions
4. **Mobile-first design** - Single column navigation enforced
5. **Scope discipline** - Removed ride previews, admin features

### What Stayed the Same
- Core user journey (discover → join → manage clubs)
- Authentication integration
- Basic club information display
- Join/leave workflow

Phase 3.1 v2 focuses on getting the navigation foundations right through data hydration fixes and simplified, mobile-first design patterns. Success here creates a solid foundation for all subsequent phases.