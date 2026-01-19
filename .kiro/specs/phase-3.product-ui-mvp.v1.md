# Phase 3: Product UI MVP (Web) - Specification v1

## Overview

Phase 3 transforms the complete backend infrastructure into a usable product through a thin MVP UI layer. The goal is to make the application end-to-end functional for real cycling clubs with minimal UI, validating core user journeys before expanding features.

**Duration**: 3-4 weeks  
**Priority**: High - Critical path to usable product  
**Risk Level**: Low - No backend changes, pure frontend implementation  

## Strategic Approach

### Primary MVP Persona
**Target User**: Club member who occasionally leads rides

**Why This Persona**:
- Represents 80% of platform users (most members step up to lead occasionally)
- Prevents over-optimizing for site admins (5% of users)
- Keeps mobile UX focused on cyclists, not administrators
- Guides UI decisions toward simplicity and mobile-first design
- Covers both participation and leadership workflows

### Core Principle: Journey-First Development
- **Rule**: If it doesn't support an end-to-end user journey, it's not in Phase 3 MVP
- **Focus**: 5 must-have journeys that prove product value
- **Validation**: Each sub-phase delivers a complete, testable user experience

### Risk Mitigation Strategy
- **Thin MVP Layer**: Minimal UI to validate journeys, not comprehensive features
- **Incremental Delivery**: Each sub-phase ships independently
- **Mobile-First**: Optimized for cyclists using phones during rides
- **Backend Leverage**: Uses all existing infrastructure without modifications

## The 5 Must-Have User Journeys

### Journey 1: Join a Club
**User Story**: As a cyclist, I want to discover and join cycling clubs in my area.

**Acceptance Criteria**:
- Discover clubs through public listing
- View club details (members, upcoming rides, description)
- Join club with single action
- Leave club if needed

**Backend Support**: ✅ Complete
- `GET /clubs` - Club discovery
- `GET /clubs/{id}` - Club details  
- `POST /v1/clubs/{id}/members` - Join club
- `DELETE /v1/memberships/{id}` - Leave club

### Journey 2: See Upcoming Rides
**User Story**: As a club member, I want to see upcoming rides and join them.

**Acceptance Criteria**:
- List upcoming rides for my clubs
- View ride details (route, difficulty, participants)
- Join/leave rides
- See participant list and my status

**Backend Support**: ✅ Complete
- `GET /v1/clubs/{id}/rides` - List club rides
- `GET /v1/clubs/{id}/rides/{rideId}` - Ride details
- `POST /v1/clubs/{id}/rides/{rideId}/participants` - Join ride
- `DELETE /v1/participations/{id}` - Leave ride

### Journey 3: Create/Publish Official Ride
**User Story**: As a ride leader/admin, I want to create and publish official club rides.

**Acceptance Criteria**:
- Create ride with essential details
- Select route from templates or create basic route
- Publish ride for club members (with proper visibility controls)
- Edit/cancel rides before they start

**Ride Visibility Rules**:
- **Draft rides**: Visible only to creator + club leaders/admins
- **Published rides**: Visible to all club members
- Clear publish/unpublish controls with status indicators

**Backend Support**: ✅ Complete
- `POST /v1/clubs/{id}/rides` - Create ride
- `PUT /v1/clubs/{id}/rides/{rideId}/publish` - Publish ride
- `PUT /v1/clubs/{id}/rides/{rideId}` - Edit ride
- Route template selection via route-template-service

### Journey 4: Complete Ride
**User Story**: As a ride leader, I want to mark rides complete and track attendance.

**Acceptance Criteria**:
- Mark ride as completed
- Update participant attendance (attended/absent)
- View ride summary with statistics
- Link evidence (manual or Strava)

**Backend Support**: ✅ Complete
- `POST /v1/clubs/{id}/rides/{rideId}/complete` - Complete ride
- `PUT /v1/clubs/{id}/rides/{rideId}/participants/{userId}/attendance` - Mark attendance
- `GET /v1/clubs/{id}/rides/{rideId}/summary` - View summary
- Manual evidence linking supported

### Journey 5: Connect Strava
**User Story**: As a cyclist, I want to connect my Strava account for automatic ride evidence.

**Acceptance Criteria**:
- Connect/disconnect Strava account
- See linked Strava activities on ride participation
- Manual link fallback for unmatched activities
- View connection status

**Backend Support**: ✅ Complete
- `GET /integrations/strava/connect` - OAuth connect
- `GET /integrations/strava/callback` - OAuth callback
- Automatic activity matching implemented
- Manual evidence linking available

## Phase 3 Implementation Breakdown

### Phase 3.1: Club + Navigation Foundations
**Duration**: 1 week  
**Goal**: Establish app structure and club management

**Deliverables**:
- App shell with sidebar/header navigation
- Authentication-gated routes
- "My Clubs" dashboard
- Club detail page (members, upcoming rides)
- Join/leave club workflow

**Why First**: Clubs are the container for everything else. Users need club membership to access rides.

### Phase 3.2: Ride Discovery + Participation
**Duration**: 1 week  
**Goal**: Enable member ride participation experience

**Deliverables**:
- Ride list with filters (date, type, difficulty)
- Ride detail page with full information
- Join/leave ride buttons with status
- Participants list display

**Success Signal**: Regular members can discover and join rides without admin powers.

### Phase 3.3: Ride Creation + Publishing
**Duration**: 1 week  
**Goal**: Enable leader ride management experience

**Deliverables**:
- Create ride form with minimum required fields
- Route picker (template selection + "none" option)
- Publish control (role-gated to leaders/captains/admins)
- Edit/cancel ride functionality

**Important**: Match backend spec - members can create invite-only proposals later; don't add unless already supported.

### Phase 3.4: Completion + Attendance + Evidence
**Duration**: 1 week  
**Goal**: Close the loop on ride lifecycle

**Deliverables**:
- Complete ride action (role-gated)
- Attendance marking UI for leaders
- Ride summary view with statistics
- Manual evidence link interface

**Success Signal**: Leaders can complete the full ride lifecycle after group rides.

### Phase 3.5: Routes/Templates UI
**Duration**: 3-4 days  
**Goal**: Essential route management for ride creation

**Deliverables**:
- Template search and selection interface
- Basic analytics display
- (Optional) GPX upload dev-only screen

**Note**: Route upload is admin-heavy; keep as "dev tools" unless required for ride creation workflow.

## Critical UI Design Decisions

### 1. Mobile-First Design
**Decision**: Prioritize mobile experience over desktop

**Rationale**:
- Cyclists use phones during rides for navigation/tracking
- Current UI components are desktop-heavy (forms, tables)
- Mobile usage patterns dominate cycling apps

**Requirements**:
- Touch-friendly buttons (minimum 44px touch targets)
- Readable text on small screens (minimum 16px font)
- Fast loading on mobile networks
- Thumb-friendly navigation

### 2. Routing Convention (Locked)
**Decision**: RESTful nested routing structure

**Pattern**:
```
/clubs                              # Club discovery
/clubs/[clubId]                     # Club details
/clubs/[clubId]/rides               # Club rides list
/clubs/[clubId]/rides/[rideId]      # Ride details
/clubs/[clubId]/rides/[rideId]/complete  # Complete ride
/clubs/my-clubs                     # User's clubs dashboard
/settings/integrations/strava       # Strava integration
```

**Benefits**:
- Logical hierarchy matches user mental model
- RESTful and predictable
- Easy to implement authorization at route level
- Scalable for future features

### 3. Performance Guardrail
**Rule**: No page blocks on more than 2 sequential API calls

**Implementation**:
- Parallel API calls wherever possible
- Progressive loading for non-critical data
- Skeleton states during loading
- Fail gracefully if secondary calls fail

**Examples**:
```typescript
// ❌ Bad: Sequential waterfall
const club = await getClub(clubId);
const rides = await getRides(club.clubId);
const members = await getMembers(club.clubId);

// ✅ Good: Parallel loading
const [club, rides, members] = await Promise.all([
  getClub(clubId),
  getRides(clubId),
  getMembers(clubId)
]);
```

### 4. Role-Based Authorization Pattern
### 4. Role-Based Authorization Pattern
**Decision**: Implement centralized `can(user, action, resource)` helper

**Implementation**:
```typescript
// Centralized authorization helper
const can = (user: User, action: string, resource?: any) => {
  // Implement role-based logic
  return authorizationService.hasCapability(user, action, resource);
};

// Usage throughout components
const canCreateRide = can(user, 'CREATE_RIDE', club);
const canCompleteRide = can(user, 'COMPLETE_RIDE', ride);
```

**Benefits**:
- Consistent authorization logic
- Easy to test and maintain
- Prevents scattered permission checks
- Matches backend authorization patterns

### 5. Error and Loading States
**Decision**: Implement comprehensive state management early

**Critical States**:
- **Loading Skeletons**: For ride lists, club details, participant lists
- **Empty States**: "No rides scheduled", "No clubs joined", "No participants yet"
- **Error Messages**: Clear, actionable feedback
  - "You need to join this club first"
  - "This ride is full - join the waitlist"
  - "Connection error - please try again"

**Implementation Priority**: High - Most apps fail here, implement early.

## Development Guidelines

### Component Architecture
```
components/
├── ui/                    # Base UI components (buttons, forms, cards)
├── auth/                  # Authentication components
├── clubs/                 # Club-specific components
├── rides/                 # Ride-specific components
├── navigation/            # App shell and navigation
└── dev-tools/            # Development utilities (gated)
```

### State Management
- **Authentication**: Existing auth context (already implemented)
- **API State**: React Query for server state management
- **UI State**: React useState for local component state
- **Form State**: React Hook Form for complex forms

### Styling Approach
- **Framework**: Tailwind CSS (already configured)
- **Components**: Headless UI for accessible components
- **Icons**: Heroicons or Lucide React
- **Mobile**: Responsive design with mobile-first breakpoints

## What NOT to Include (Resist Feature Creep)

### Explicitly Deferred Features
- **Notifications/Real-time**: WebSocket integration, push notifications
- **Weather/Traffic/POI**: External API integrations
- **Achievements/Challenges**: Gamification features
- **Social/Community**: Chat, forums, social feeds
- **Advanced Analytics**: Detailed statistics, reporting dashboards
- **Multi-language**: Internationalization support

### Rationale
Focus on "boring" workflows first. These features add complexity without validating core product value. They can be added after MVP proves market fit.

## Dev Tools Strategy

### Hidden Development Pages
**Access**: Behind `NEXT_PUBLIC_DEV_TOOLS=true` environment variable

**Pages**:
- `/dev/route-upload` - Route upload-url workflow testing
- `/dev/strava-status` - Strava connection test and status
- `/dev/evidence-link` - Manual evidence link testing  
- `/dev/api-test` - Backend API endpoint testing
- `/dev/auth-debug` - Authentication state debugging

**Benefits**:
- Validate backend continuously without bloating user UI
- Test complex workflows during development
- Debug production issues
- Onboard new developers quickly

## Success Criteria

### Phase 3.1 Success Criteria
- [ ] Users can navigate the app with clear information architecture
- [ ] Club discovery and joining workflow is intuitive
- [ ] "My Clubs" dashboard shows relevant information
- [ ] Mobile experience is usable and fast

### Phase 3.2 Success Criteria  
- [ ] Club members can discover upcoming rides easily
- [ ] Ride details provide sufficient information for decision-making
- [ ] Join/leave ride workflow is smooth and provides clear feedback
- [ ] Participant lists are accurate and up-to-date

### Phase 3.3 Success Criteria
- [ ] Ride leaders can create rides with essential information
- [ ] Route selection (template or none) works intuitively
- [ ] Publish workflow is clear and role-appropriate
- [ ] Edit/cancel functionality prevents data loss

### Phase 3.4 Success Criteria
- [ ] Ride completion workflow is efficient for leaders
- [ ] Attendance tracking is accurate and easy to use
- [ ] Ride summaries provide valuable post-ride information
- [ ] Evidence linking (manual) works reliably

### Phase 3.5 Success Criteria
- [ ] Route template selection integrates smoothly with ride creation
- [ ] Basic analytics provide useful insights
- [ ] Dev tools enable efficient backend validation

### Overall MVP Success Criteria
- [ ] All 5 user journeys work end-to-end
- [ ] Mobile experience is production-ready
- [ ] Error handling provides clear user guidance
- [ ] Performance meets mobile web standards (<3s load time)
- [ ] Real cycling club can use the app for basic operations

## Testing Strategy

### User Journey Testing
- **End-to-End Tests**: Automated tests for all 5 core journeys
- **Mobile Testing**: Real device testing on iOS and Android
- **Role-Based Testing**: Verify authorization works correctly
- **Error Scenario Testing**: Network failures, invalid data, edge cases

### Performance Testing
- **Mobile Performance**: Test on 3G networks and older devices
- **Bundle Size**: Monitor JavaScript bundle size growth
- **Core Web Vitals**: Maintain green scores for LCP, FID, CLS
- **API Response Times**: Ensure backend integration performs well

### Usability Testing
- **Real User Testing**: Test with actual cycling club members
- **Accessibility Testing**: Screen reader and keyboard navigation
- **Cross-Browser Testing**: Chrome, Safari, Firefox mobile
- **Progressive Enhancement**: Ensure basic functionality without JavaScript

## Risk Management

### Technical Risks
- **Mobile Performance**: Mitigate with performance budgets and monitoring
- **Complex State Management**: Use proven patterns (React Query, React Hook Form)
- **Authorization Complexity**: Implement centralized `can()` helper early
- **API Integration Issues**: Comprehensive error handling and retry logic

### Product Risks
- **Feature Creep**: Strict adherence to 5 core journeys only
- **Over-Engineering**: Focus on MVP functionality, not perfect design
- **User Experience Issues**: Early and frequent user testing
- **Mobile Usability**: Mobile-first design and real device testing

### Mitigation Strategies
- **Incremental Delivery**: Each sub-phase can be tested and validated
- **Rollback Plan**: Pure frontend changes, easy to revert
- **Performance Monitoring**: Real-time alerts for performance degradation
- **User Feedback Loop**: Direct feedback channel for early users

## Deployment Strategy

### Staging Environment
- **Preview Deployments**: Vercel preview for each pull request
- **Staging API**: Use development backend for testing
- **Feature Flags**: Environment-based feature toggles
- **User Acceptance Testing**: Staging environment for stakeholder review

### Production Deployment
- **Incremental Rollout**: Deploy each sub-phase independently
- **Monitoring**: Real-time error tracking and performance monitoring
- **Rollback Plan**: Instant rollback via Vercel deployment history
- **User Communication**: Clear communication about new features

## Documentation Requirements

### Technical Documentation
- **Component Documentation**: Storybook for UI components
- **API Integration Guide**: How to add new backend endpoints
- **Testing Guide**: How to write and run tests
- **Deployment Guide**: Step-by-step deployment process

### User Documentation
- **User Guide**: How to use core features
- **Admin Guide**: Club administration workflows
- **Troubleshooting**: Common issues and solutions
- **FAQ**: Frequently asked questions

## Conclusion

Phase 3 represents the critical transition from infrastructure to product. By focusing on 5 core user journeys and implementing them as a thin MVP layer, we minimize risk while maximizing learning and validation.

The mobile-first, journey-focused approach ensures we build something cyclists actually want to use, rather than a comprehensive feature set that may miss the mark. Each sub-phase delivers value independently, allowing for course correction based on real user feedback.

Success in Phase 3 means having a usable product that real cycling clubs can adopt for their basic operations, setting the foundation for future feature expansion based on validated user needs.