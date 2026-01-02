# Phase 2.5: Ride Completion & Strava Integration (MVP)

**Version:** 2.1  
**Date:** January 1, 2026  
**Dependencies:** Phase 2.4 (Advanced Route Management)  
**Target Completion:** Q2 2026  
**Priority:** High

## Pre-Implementation Review Applied (v2.1)

**Changes from v2.0:**
- ✅ **Removed duplicate status enums**: `Ride.status` is single source of truth
- ✅ **Added `unknown` attendance status**: Clear default state for participants
- ✅ **Clarified `withdrawn` vs `cancelled`**: `withdrawn` = user left before ride start
- ✅ **Implemented tag-first Strava matching**: Deterministic matching with explicit thresholds
- ✅ **Updated token storage**: Using secure references (`accessTokenRef`) instead of raw tokens
- ✅ **Unified API endpoints**: Consistent `/v1/integrations/strava/*` pattern
- ✅ **Simplified evidence model**: Single evidence link per participant via `RideParticipation`
- ✅ **Enhanced webhook security**: Strava-supported verification mechanism (not just "signatures")

## Phase 2.5 Scope Guarantee

**Phase 2.5 delivers ride completion lifecycle, attendance tracking, and Strava integration ONLY.** This phase focuses exclusively on completing the ride lifecycle and establishing the data foundation for future gamification, not implementing gamification itself.

**Scope Boundaries (Non-Negotiable):**
- ✅ **IN SCOPE**: Ride completion, attendance outcomes, manual evidence, Strava OAuth + webhooks
- ❌ **OUT OF SCOPE**: Achievements, community features, reports/feedback, photo uploads, advanced analytics

## Executive Summary

Phase 2.5 completes the ride lifecycle by implementing ride completion workflows, attendance tracking, and Strava integration. This focused MVP establishes the data foundation needed for future community and gamification features without implementing those features directly.

**Key Deliverables (MVP):**
- Ride completion lifecycle (planned → active → completed/cancelled)
- Attendance outcome tracking for participants  
- Manual evidence linking (fallback for non-Strava users)
- Strava OAuth integration and activity webhook processing
- Post-ride summary snapshots (data foundation only)

**Explicitly Deferred to Phase 2.6+:**
- Achievement system and gamification
- Ride reports and community feedback  
- Photo upload and moderation workflows
- Advanced analytics and route quality scoring
- Community engagement features

## Business Context

### Current State (Post Phase 2.4)
- ✅ Complete ride management (creation, publishing, participation)
- ✅ Advanced route management with GPX files and analytics
- ✅ Club-scoped template system
- ✅ Authorization and access controls
- ✅ File storage and processing infrastructure

### Gap Analysis
**Missing Capabilities (Phase 2.5 Scope Only):**
1. **Ride Completion Tracking**: No way to mark rides as completed or track outcomes
2. **Attendance Outcomes**: No system for tracking who actually participated vs. who signed up
3. **Strava Integration**: No connection to external activity tracking
4. **Evidence Foundation**: No basic system for linking ride evidence (manual fallback)

### Business Drivers
1. **Lifecycle Completion**: Rides need definitive completion states for data integrity
2. **Attendance Accountability**: Track actual participation vs. planned participation
3. **External Integration**: Connect with popular cycling platforms (Strava)
4. **Data Foundation**: Establish metrics needed for future gamification without implementing gamification

## Phase 2.5 Scope

### Core Features (MVP)

#### 1. Ride Completion System
**Capability**: Track ride lifecycle from planning through completion

**Features:**
- Ride status management (planned → active → completed/cancelled)
- Completion workflow for ride captains and ride leaders
- Manual completion triggers (captain/leader initiated)
- Basic completion metadata (duration, participant count)

**API Endpoints:**
```
POST /v1/clubs/{clubId}/rides/{rideId}/complete
GET  /v1/clubs/{clubId}/rides/{rideId}/completion-status
PUT  /v1/clubs/{clubId}/rides/{rideId}/attendance/{participantId}
```

#### 2. Attendance Tracking System
**Capability**: Track actual participation vs. planned participation

**Features:**
- Attendance outcome tracking (attended, no-show, cancelled)
- Participant-level completion status
- Basic attendance statistics for future analytics
- Manual attendance confirmation (fallback)

**Storage:**
- DynamoDB attendance records with completion outcomes
- Basic metrics for future gamification consumption

#### 3. Strava Integration System
**Capability**: Connect rides with Strava activities for evidence

**Features:**
- Strava OAuth 2.0 integration for user authentication
- Webhook processing for activity creation/updates
- Activity linking to completed rides
- Basic activity metadata storage (distance, time, elevation)

**Integration Points:**
- OAuth flow for user consent and token management
- Webhook endpoint for real-time activity updates
- Activity matching based on time/location proximity

#### 4. Manual Evidence System (Fallback)
**Capability**: Basic evidence linking for non-Strava users

**Features:**
- Manual attendance confirmation by ride leaders
- Simple text-based evidence notes
- Basic completion verification workflow
- Fallback for users without Strava accounts

**API Endpoints:**
```
POST /v1/clubs/{clubId}/rides/{rideId}/evidence/manual
GET  /v1/clubs/{clubId}/rides/{rideId}/evidence
PUT  /v1/clubs/{clubId}/rides/{rideId}/evidence/{evidenceId}
```

## Technical Architecture

### Data Model Extensions

#### Design Principles
- **Single source of truth for ride state**: `Ride.status`
- **No duplicate status enums**
- **Evidence is linked at participation level**
- **Strava activities are ingested once, then referenced**
- **All analytics are snapshots only (no recomputation in Phase 2.5)**

#### Extended Entities

**Ride** (Existing – Extended)
```typescript
interface Ride {
  rideId: string;
  clubId: string;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  
  startedAt?: string;
  startedBy?: string;
  
  completedAt?: string;
  completedBy?: string;
  completionNotes?: string;
}
```

**Rules:**
- `Ride.status` is the authoritative lifecycle state
- Completion locks route reference and participant roster
- No separate "completion status" enum exists

**RideParticipation** (Extended)
```typescript
interface RideParticipation {
  rideId: string;
  userId: string;
  
  attendanceStatus: 'unknown' | 'attended' | 'no_show' | 'withdrawn';
  
  evidence?: {
    type: 'strava' | 'manual';
    refId: string;
    matchType: 'tag' | 'time_window' | 'manual';
    metricsSnapshot?: {
      distanceMeters?: number;
      movingTimeSeconds?: number;
      elevationGainMeters?: number;
      startTimeUtc?: string;
    };
    linkedAt: string;
  };
  
  confirmedBy?: string;
  confirmedAt?: string;
}
```

**Notes:**
- Default attendance is `unknown`
- `withdrawn` = user left before ride start
- Only one evidence link per participant in Phase 2.5

**StravaIntegration** (User-Level)
```typescript
interface StravaIntegration {
  userId: string;
  provider: 'strava';
  
  athleteId: string;
  scopesGranted: string[];
  
  accessTokenRef: string;
  refreshTokenRef: string;
  tokenExpiresAt: string;
  
  connectedAt: string;
  revokedAt?: string;
  lastSyncAt?: string;
}
```

**Rules:**
- Tokens are stored as secure references, not raw strings
- Token encryption and rotation strategy is implementation-defined

**StravaActivity** (Ingested External Object)
```typescript
interface StravaActivity {
  provider: 'strava';
  stravaActivityId: string;
  userId: string;
  
  type: string;
  startDateUtc: string;
  
  distanceMeters: number;
  movingTimeSeconds: number;
  elevationGainMeters: number;
  
  startLatLng?: [number, number];
  endLatLng?: [number, number];
  
  ingestedAt: string;
}
```

**Rules:**
- Activities are ingested once
- Linking to rides happens via `RideParticipation.evidence`

**RideSummary** (Snapshot – Foundation Only)
```typescript
interface RideSummary {
  rideId: string;
  clubId: string;
  
  completedAt: string;
  
  participantsPlanned: number;
  participantsAttended: number;
  participantsNoShow: number;
  
  participantsWithStrava: number;
  participantsWithManualEvidence: number;
  
  aggregatedMetrics?: {
    totalDistanceMeters?: number;
    totalElevationGainMeters?: number;
    averageSpeedMps?: number;
  };
  
  lastUpdatedAt: string;
}
```

**Important:**
- No derived analytics logic lives here
- Values are updated incrementally as evidence is linked

### Infrastructure Components

#### Strava Integration Service
- **OAuth 2.0 Flow**: Secure user authentication and token management
- **Webhook Processing**: Real-time activity sync from Strava
- **Activity Matching**: Link Strava activities to completed rides using deterministic strategy
- **Token Management**: Refresh token handling and expiration

#### Strava Activity Matching Policy

**Matching Strategy (Deterministic First)**

**1️⃣ Tag-Based Match (Primary)**
- Ride generates a short code (e.g. `#RIDE-7F2K`)
- Rider includes tag in Strava title or description
- Exact match required

**2️⃣ Time-Window Match (Fallback)**
- Used only if no tag match exists
- **Default thresholds:**
  - Activity start time: between `ride.startTime - 60 minutes` and `ride.startTime + 240 minutes`
  - Optional distance tolerance: ±25% if planned distance exists
  - Optional location tolerance: within X km of ride start (if coordinates available)

**3️⃣ Manual Link (Final Authority)**
- Rider explicitly links activity via API
- Overrides heuristic failures
- Logged as `matchType = manual`

**Safety Rules:**
- A Strava activity can only be linked once per ride
- A user may only link their own activities
- Duplicate webhook events must be idempotent
- Deletions mark evidence as removed (no silent re-add)

#### Completion Service
- **Ride State Management**: Handle ride lifecycle transitions
- **Attendance Tracking**: Track participant outcomes
- **Evidence Linking**: Connect manual and Strava evidence
- **Summary Generation**: Create data snapshots for future analytics

#### Security & Access Control
- **Strava Token Security**: Secure storage of OAuth tokens using encrypted references
- **Webhook Verification**: Validate Strava webhook authenticity per Strava-supported verification mechanism
- **Privacy Controls**: User consent for activity sharing
- **Data Retention**: Configurable retention policies

### API Design

#### Ride Lifecycle

**Complete Ride**
```http
POST /v1/clubs/{clubId}/rides/{rideId}/complete
{
  "completionNotes": "Strong turnout, smooth ride"
}
```

**Permissions:**
- Ride Captain
- Ride Leader  
- Club Admin / Owner

**Get Completion Status**
```http
GET /v1/clubs/{clubId}/rides/{rideId}/summary
```
Returns `RideSummary`.

#### Attendance & Evidence

**Update Attendance** (Leader/Captain Only)
```http
PUT /v1/clubs/{clubId}/rides/{rideId}/participants/{userId}/attendance
{
  "attendanceStatus": "attended"
}
```

**Manual Evidence Link** (Fallback)
```http
POST /v1/clubs/{clubId}/rides/{rideId}/participants/{userId}/evidence/manual
{
  "description": "Confirmed attendance — no Strava account"
}
```

#### Strava Integration

**Initiate OAuth**
```http
GET /v1/integrations/strava/connect
Response: {
  "authUrl": "https://www.strava.com/oauth/authorize?...",
  "state": "opaque_state_value"
}
```

**OAuth Callback**
```http
GET /v1/integrations/strava/callback?code=...&state=...
```

**Webhook Receiver** (Public)
```http
POST /v1/integrations/strava/webhook
```

**Responsibilities:**
- Verify subscription challenge
- Validate event authenticity (per Strava-supported verification mechanism)
- Enqueue event for async processing

**Manual Activity Link** (User Fix)
```http
POST /v1/clubs/{clubId}/rides/{rideId}/participants/{userId}/evidence/strava
{
  "stravaActivityId": "123456789"
}
```

## Implementation Plan

### Phase 2.5.1: Ride Completion Foundation (3 weeks)
**Deliverables:**
- Ride status management system
- Basic completion workflow
- Completion API endpoints
- Database schema updates

**Success Criteria:**
- Captains and ride leaders can mark rides as completed
- Completion status is tracked and queryable
- Basic attendance tracking functional

### Phase 2.5.2: Strava Integration (4 weeks)
**Deliverables:**
- Strava OAuth 2.0 integration
- Webhook processing for activity sync
- Activity matching and linking
- Token management and refresh

**Success Criteria:**
- Users can connect Strava accounts
- Activities automatically sync from Strava
- Activities can be linked to completed rides
- Token refresh works automatically

### Phase 2.5.3: Attendance & Evidence (3 weeks)
**Deliverables:**
- Attendance outcome tracking
- Manual evidence system (fallback)
- Evidence linking APIs
- Basic summary generation

**Success Criteria:**
- Attendance can be tracked per participant
- Manual evidence can be added for non-Strava users
- Evidence summaries are generated correctly
- Data foundation is established for future analytics

## Authorization & Security

### Access Control Matrix

| Action | Club Admin | Ride Captain | Ride Leader | Participant | Non-Member |
|--------|------------|--------------|-------------|-------------|------------|
| Complete Ride | ✅ | ✅ (own rides) | ✅ (own rides) | ❌ | ❌ |
| Update Attendance | ✅ | ✅ (own rides) | ✅ (own rides) | ❌ | ❌ |
| View Completion Status | ✅ | ✅ | ✅ | ✅ (if participated) | ❌ |
| Connect Strava | ✅ | ✅ | ✅ | ✅ | ❌ |
| Add Manual Evidence | ✅ | ✅ (own rides) | ✅ (own rides) | ❌ | ❌ |
| View Evidence Summary | ✅ | ✅ | ✅ | ✅ (if participated) | ❌ |

### Privacy & Consent
- **Strava Consent**: Users must explicitly consent to Strava integration
- **Activity Privacy**: Users control which activities are shared with clubs
- **Data Retention**: Configurable retention policies for Strava data
- **Token Security**: OAuth tokens encrypted at rest and in transit

## Testing Strategy

### Unit Testing
- Ride completion workflow logic
- Strava OAuth flow and token management
- Activity matching algorithms
- Attendance tracking accuracy
- Access control validation

### Integration Testing
- End-to-end ride completion workflow
- Strava webhook processing
- Activity linking and evidence creation
- Manual evidence fallback system

### Performance Testing
- Strava API rate limiting compliance
- Webhook processing performance
- Database query performance for summaries
- OAuth token refresh reliability

## Success Metrics

### Technical Metrics
- **Ride Completion Rate**: >90% of published rides marked complete within 24 hours
- **Strava Connection Rate**: >60% of active users connect Strava accounts
- **Activity Matching Accuracy**: >85% of Strava activities correctly matched to rides
- **Webhook Processing Time**: <30 seconds for activity sync

### Business Metrics
- **Attendance Tracking**: >80% of completed rides have attendance outcomes recorded
- **Evidence Coverage**: >70% of participants have evidence (Strava or manual)
- **Data Foundation**: 100% of completed rides have summary snapshots for future analytics
- **User Adoption**: >50% of ride leaders use completion workflow within 2 months

### User Experience Metrics
- **Strava OAuth Success**: >95% of OAuth flows complete successfully
- **Evidence Discovery**: <2 minutes average time to find ride evidence
- **Completion Workflow**: <1 minute average time to complete a ride

## Risk Assessment

### Technical Risks
- **Strava API Changes**: Strava may change API or rate limits
- **OAuth Complexity**: Token management and refresh complexity
- **Activity Matching**: Difficulty matching activities to rides accurately

### Mitigation Strategies
- **API Monitoring**: Monitor Strava API changes and deprecations
- **Robust Token Management**: Implement comprehensive token refresh logic
- **Flexible Matching**: Use time/location proximity with manual override options

### Business Risks
- **User Privacy Concerns**: Users may be reluctant to connect Strava
- **Limited Strava Adoption**: Not all users have Strava accounts
- **Feature Complexity**: Users may find integration confusing

### Mitigation Strategies
- **Clear Privacy Controls**: Transparent consent and data usage policies
- **Manual Fallback**: Robust manual evidence system for non-Strava users
- **Progressive Disclosure**: Introduce features gradually with clear benefits

## Future Evolution

### Phase 2.6 Candidates (Explicitly Deferred)
- **Achievement System**: Distance milestones, participation streaks, club challenges
- **Ride Reports & Feedback**: Community-driven ride documentation and ratings
- **Photo Upload System**: Evidence photos with moderation workflow
- **Advanced Analytics**: Route quality scoring, performance benchmarking

### Phase 2.7+ Candidates
- **Live Tracking**: Real-time ride monitoring and safety features
- **Social Integration**: Facebook, Instagram sharing beyond Strava
- **Advanced Gamification**: Leaderboards, competitions, and challenges
- **AI-Powered Insights**: Route optimization and predictive analytics

## Conclusion

Phase 2.5 completes the core ride lifecycle by adding completion tracking, attendance outcomes, and Strava integration. This focused MVP establishes the essential data foundation needed for future community and gamification features without implementing those features directly.

The phase builds naturally on the solid foundations established in Phases 2.3 and 2.4, leveraging existing infrastructure for authorization and data storage while adding new capabilities that complete the ride experience and prepare for future enhancements.

**Key Success Factors:**
- **Focused Scope**: Ride completion + Strava integration only, no feature creep
- **Data Foundation**: Establishes metrics and events for future gamification
- **User Choice**: Supports both Strava users and manual fallback
- **Privacy First**: Clear consent and data control for users
- **Future Ready**: Domain events and data structure support Phase 2.6+ features

**Phase 2.5 MVP Deliverables:**
- ✅ Ride completion lifecycle with captain/leader permissions
- ✅ Attendance outcome tracking for all participants
- ✅ Strava OAuth integration and activity webhook processing
- ✅ Manual evidence system for non-Strava users
- ✅ Data foundation (RideSummary, domain events) for future analytics

With successful implementation of Phase 2.5 MVP, Sydney Cycles will have a complete ride lifecycle that connects with popular cycling platforms while maintaining clear boundaries for future feature development.

---

**Document Status**: Ready for Implementation (v2.1)  
**Next Steps**: Implementation can begin  
**Implementation Start**: Upon Phase 2.4 completion  
**Timeline**: 10 weeks  
**Scope**: Focused on ride completion + Strava integration only

**Pre-Implementation Review Complete:**
- ✅ Duplicate status enums removed
- ✅ Attendance states clarified with `unknown` default
- ✅ Tag-first Strava matching with explicit thresholds
- ✅ Secure token reference storage pattern
- ✅ Unified API endpoint naming
- ✅ Single evidence model via `RideParticipation`
- ✅ Enhanced security specifications