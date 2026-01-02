# Phase 2.3: Ride Management & Event System v1

**Version:** 1.0  
**Status:** Draft  
**Phase:** 2.3 - Ride Management & Event Coordination  
**Dependencies:** Phase 1.1 (Infrastructure), Phase 1.2 (User Profile), Phase 1.3 (Authorization), Phase 2.1 (Club Service), Phase 2.2 (Club Membership)

## Purpose

Implement the core cycling activity functionality by adding comprehensive ride management and event coordination capabilities. This phase transforms clubs from static communities into active cycling organizations where members can create, discover, and participate in rides.

The service enables:
- Ride creation and management by authorized club members
- Ride discovery and browsing for club members
- Ride participation with role-based leadership assignments
- Route management and ride logistics
- Ride lifecycle management (planned, active, completed, cancelled)

## Alignment with Canonical Documents

### Domain Model Alignment
- **Ride Entity:** Core cycling event with time, location, and route details
- **RideParticipation Entity:** User involvement in specific rides with contextual leadership
- **Ride Leadership:** Captain, Leader, Participant roles based on club membership
- **Club Integration:** Rides belong to clubs and respect membership boundaries
- **Event Lifecycle:** Complete ride state management from creation to completion

### Architecture Alignment
- **Event-Driven:** Ride state changes trigger notifications
- **Club-Scoped:** All rides belong to clubs and respect membership access
- **Role-Based Leadership:** Contextual leadership assignment via RideParticipation
- **Performance:** Efficient ride queries and participation management
- **Scalability:** Support for high-volume ride creation and participation

### Implementation Alignment
- **Phase 2.2 Extension:** Builds on club membership foundation
- **Authorization Integration:** Club-level permissions for ride management
- **User Profile Integration:** Participant profile enrichment
- **Notification Foundation:** Ready for Phase 3.x notification system

## Scope Definition

### In-Scope (Phase 2.3)

#### Ride Management
- **Draft Ride Creation:** Any club member can create draft rides (invite-only proposals)
- **Official Ride Publishing:** Club leadership can publish official club rides
- **Ride Updates:** Modify ride details before and during events
- **Ride Cancellation:** Cancel rides with participant notification
- **Route Management:** Define ride routes with waypoints and difficulty
- **Logistics Management:** Meeting points, equipment requirements, safety notes

#### Ride Discovery
- **Club Ride Listing:** View all rides for clubs user belongs to
- **Ride Search:** Filter rides by date, difficulty, distance, type
- **Ride Details:** Complete ride information including route and participants
- **Calendar Integration:** Ride scheduling and calendar views
- **Public Discovery:** Public rides visible to non-members (read-only)

#### Ride Participation
- **Join/Leave Rides:** Members can register for and withdraw from rides
- **Participation Limits:** Configurable maximum participants per ride
- **Waitlist Management:** Queue system for oversubscribed rides
- **Leadership Assignment:** Captain, Leader, Participant roles
- **Participation History:** Track user's ride participation over time

#### Ride Leadership System
- **Ride Captain:** Primary ride organizer (creator or assigned)
- **Ride Leaders:** Additional leadership support for large groups
- **Leadership Eligibility:** Based on club role and experience
- **Leadership Responsibilities:** Route guidance, safety, group management
- **Leadership Transitions:** Promote participants to leadership roles

#### Ride Types & Categories
- **Training Rides:** Skill development and fitness building
- **Social Rides:** Community building and casual cycling
- **Competitive Events:** Races, time trials, challenges
- **Adventure Rides:** Exploration and long-distance events
- **Maintenance Rides:** Bike maintenance and repair sessions

#### Ride Status & Governance
- **Draft Rides:** Member proposals (invite-only, not official club events)
- **Published Rides:** Official club rides (endorsed by club leadership)
- **Ride Lifecycle:** Draft creation, publishing approval, execution, completion
- **Club Endorsement:** Clear distinction between member suggestions and official events

### Out-of-Scope (Phase 2.3)

#### Advanced Event Features
- **Multi-Day Events:** Tours and cycling holidays
- **Event Series:** Recurring ride templates and series management
- **External Events:** Integration with external cycling events
- **Event Payments:** Paid rides and event fees
- **Insurance Integration:** Liability and event insurance

#### Advanced Route Features
- **GPS Integration:** Real-time tracking and navigation
- **Elevation Profiles:** Detailed route elevation and difficulty analysis
- **Weather Integration:** Weather-based ride recommendations
- **Traffic Integration:** Real-time traffic and road condition updates
- **Route Sharing:** Export routes to external navigation apps
- **Route File Management:** GPX file upload, storage, and download (Phase 2.4)
- **External Route Integration:** Strava route import and sync (Phase 3.1)

#### Social Features
- **Ride Chat:** Real-time messaging during rides
- **Photo Sharing:** Ride photo galleries and social sharing
- **Ride Reviews:** Post-ride feedback and ratings
- **Achievement System:** Badges and milestone tracking
- **Social Media Integration:** Share rides on external platforms

#### Analytics & Reporting
- **Ride Analytics:** Detailed participation and performance metrics
- **Club Statistics:** Club-wide ride activity reporting
- **Performance Tracking:** Individual rider progress and statistics
- **Safety Reporting:** Incident tracking and safety analytics
- **Export Capabilities:** Data export for external analysis
- **Strava Integration:** Activity sync and performance tracking (Phase 3.1)
- **Gamification System:** Goals, challenges, and achievement tracking (Phase 3.2)

## Ride Creation Permissions & Official Status

### Ride Creation Workflow

#### Member Ride Proposals (Draft Status)
- **Who Can Create:** Any club member
- **Initial Status:** Draft (invite-only proposals)
- **Purpose:** Allow members to suggest rides and test concepts with invited participants
- **Club Endorsement:** Draft rides are not considered official club events
- **Visibility:** Visible only to ride creator and club leadership
- **Future Extensibility:** Designed to support non-club rides (friends/local) using the same event creation system

#### Official Ride Publishing
- **Who Can Publish:** Users with authorized club roles only
  - Club Owner
  - Club Admin  
  - Ride Captain
  - Ride Leader
- **Purpose:** Endorse rides as official club activities
- **Visibility:** Published rides appear in club-wide listings and calendars
- **Liability:** Official rides represent sanctioned club activities

### Ride Visibility Rules

#### Draft Rides
- **Visible to:** Ride creator + club leadership (Owner, Admin, Ride Captain, Ride Leader)
- **Sharing:** May be shared via direct invite (future Phase 2.4 feature)
- **Club Listings:** Do not appear in club-wide ride listings or calendars
- **Public Access:** Not visible to non-members or general club members

#### Published (Official) Rides  
- **Visible to:** All club members
- **Club Listings:** Appear in club ride listings and calendars by default
- **Public Access:** May be marked public (read-only) if enabled by club settings
- **Endorsement:** Represent official club-sanctioned activities

### Ride Lifecycle & Status Transitions

#### Allowed Status Transitions
| From Status | To Status | Who Can Perform | Notes |
|-------------|-----------|-----------------|-------|
| `draft` | `published` | Club leadership only | Promotes to official ride |
| `draft` | `cancelled` | Ride creator or club leadership | Cancels proposal |
| `published` | `active` | Automatic or manual | Ride begins |
| `published` | `cancelled` | Club leadership only | Cancels official ride |
| `active` | `completed` | Automatic or manual | Ride ends |
| `active` | `cancelled` | Club leadership only | Emergency cancellation |

#### Business Rules
- **Creation ≠ Endorsement:** Creating a draft ride does not imply club endorsement
- **Publishing Authority:** Only authorized roles can promote drafts to official status
- **Cancellation Rights:** Club leadership can cancel any ride; creators can only cancel their own drafts
- **Status Immutability:** Completed and cancelled rides cannot change status

### Future Extensibility (Phase 4.x+)

The ride system is designed to support future expansion beyond club rides:

- **Friend Rides:** Private rides with invited friends (Phase 4.1)
- **Community Rides:** Local discovery-based rides (Phase 4.2)  
- **Public Events:** Open community events (Phase 4.3)

**Phase 2.3 Scope:** Only club rides are supported. The data model includes optional extensibility fields that are validated to club-only values.

## API Specification

### Base Path
All ride endpoints use the base path `/v1/clubs/{clubId}/rides`

### 1. Ride Management Operations

#### Create Ride (Draft)
**Endpoint:** `POST /v1/clubs/{clubId}/rides`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** Club membership required (any active member)

**Request Body:**
```json
{
  "title": "Saturday Morning Training Ride",
  "description": "Moderate pace training ride through the Royal National Park",
  "rideType": "training",
  "difficulty": "intermediate",
  "startDateTime": "2025-12-28T06:00:00.000Z",
  "estimatedDuration": 180,
  "maxParticipants": 20,
  "publishImmediately": false,
  "meetingPoint": {
    "name": "Cronulla Station",
    "address": "Cronulla NSW 2230",
    "coordinates": {
      "latitude": -34.0569,
      "longitude": 151.1537
    },
    "instructions": "Meet at the main entrance, bring your bike and helmet"
  },
  "route": {
    "name": "Royal National Park Loop",
    "type": "basic",
    "distance": 45.5,
    "estimatedTime": 180,
    "difficulty": "intermediate",
    "waypoints": [
      {
        "name": "Cronulla Station",
        "coordinates": { "latitude": -34.0569, "longitude": 151.1537 },
        "type": "start"
      },
      {
        "name": "Bundeena Ferry Wharf",
        "coordinates": { "latitude": -34.0847, "longitude": 151.1394 },
        "type": "waypoint"
      },
      {
        "name": "Cronulla Station",
        "coordinates": { "latitude": -34.0569, "longitude": 151.1537 },
        "type": "end"
      }
    ]
  },
  "requirements": {
    "equipment": ["helmet", "water_bottle", "spare_tube"],
    "experience": "intermediate",
    "fitness": "moderate"
  },
  "isPublic": false,
  "allowWaitlist": true
}
```

**Response 201 (Draft Created):**
```json
{
  "success": true,
  "data": {
    "rideId": "ride_abc123",
    "clubId": "club_123",
    "title": "Saturday Morning Training Ride",
    "description": "Moderate pace training ride through the Royal National Park",
    "rideType": "training",
    "difficulty": "intermediate",
    "status": "draft",
    "scope": "club",
    "audience": "invite_only",
    "startDateTime": "2025-12-28T06:00:00.000Z",
    "estimatedDuration": 180,
    "maxParticipants": 20,
    "currentParticipants": 1,
    "createdBy": "user_123",
    "createdAt": "2025-12-20T00:00:00.000Z",
    "meetingPoint": {
      "name": "Cronulla Station",
      "address": "Cronulla NSW 2230",
      "coordinates": {
        "latitude": -34.0569,
        "longitude": 151.1537
      },
      "instructions": "Meet at the main entrance, bring your bike and helmet"
    },
    "route": {
      "name": "Royal National Park Loop",
      "type": "basic",
      "distance": 45.5,
      "estimatedTime": 180,
      "difficulty": "intermediate",
      "waypoints": [
        {
          "name": "Cronulla Station",
          "coordinates": { "latitude": -34.0569, "longitude": 151.1537 },
          "type": "start"
        },
        {
          "name": "Bundeena Ferry Wharf",
          "coordinates": { "latitude": -34.0847, "longitude": 151.1394 },
          "type": "waypoint"
        },
        {
          "name": "Cronulla Station",
          "coordinates": { "latitude": -34.0569, "longitude": 151.1537 },
          "type": "end"
        }
      ]
    },
    "requirements": {
      "equipment": ["helmet", "water_bottle", "spare_tube"],
      "experience": "intermediate",
      "fitness": "moderate"
    },
    "isPublic": false,
    "allowWaitlist": true
  },
  "timestamp": "2025-12-20T00:00:00.000Z"
}
```

**Response 201 (Published Immediately - Leadership Roles):**
```json
{
  "success": true,
  "data": {
    "rideId": "ride_abc123",
    "status": "published",
    "scope": "club", 
    "audience": "members_only",
    // ... same structure as above
  },
  "timestamp": "2025-12-20T00:00:00.000Z"
}
```

#### Publish Ride
**Endpoint:** `POST /v1/clubs/{clubId}/rides/{rideId}/publish`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** `publish_official_rides` capability (Club Owner, Admin, Ride Captain, Ride Leader)

**Request Body:**
```json
{
  "audience": "members_only",
  "isPublic": false,
  "publishMessage": "Official club ride - all members welcome!"
}
```

**Response 200 (Success):**
```json
{
  "success": true,
  "data": {
    "rideId": "ride_abc123",
    "status": "published",
    "audience": "members_only",
    "publishedBy": "user_456",
    "publishedAt": "2025-12-20T10:00:00.000Z",
    "publishMessage": "Official club ride - all members welcome!"
  },
  "timestamp": "2025-12-20T10:00:00.000Z"
}
    "waypoints": [
      {
        "name": "Cronulla Station",
        "coordinates": { "latitude": -34.0569, "longitude": 151.1537 },
        "type": "start"
      },
      {
        "name": "Bundeena Ferry Wharf",
        "coordinates": { "latitude": -34.0847, "longitude": 151.1394 },
        "type": "waypoint"
      },
      {
        "name": "Cronulla Station",
        "coordinates": { "latitude": -34.0569, "longitude": 151.1537 },
        "type": "end"
      }
    ]
  },
  "requirements": {
    "equipment": ["helmet", "water_bottle", "spare_tube"],
    "experience": "intermediate",
    "fitness": "moderate"
  },
  "isPublic": true,
  "allowWaitlist": true
}
```

**Response 201 (Success):**
```json
{
  "success": true,
  "data": {
    "rideId": "ride_abc123",
    "clubId": "club_123",
    "title": "Saturday Morning Training Ride",
    "description": "Moderate pace training ride through the Royal National Park",
    "rideType": "training",
    "difficulty": "intermediate",
    "status": "planned",
    "startDateTime": "2025-12-28T06:00:00.000Z",
    "estimatedDuration": 180,
    "maxParticipants": 20,
    "currentParticipants": 1,
    "createdBy": "user_123",
    "createdAt": "2025-12-20T00:00:00.000Z",
    "meetingPoint": {
      "name": "Cronulla Station",
      "address": "Cronulla NSW 2230",
      "coordinates": {
        "latitude": -34.0569,
        "longitude": 151.1537
      },
      "instructions": "Meet at the main entrance, bring your bike and helmet"
    },
    "route": {
      "name": "Royal National Park Loop",
      "distance": 45.5,
      "estimatedTime": 180,
      "difficulty": "intermediate",
      "waypoints": [
        {
          "name": "Cronulla Station",
          "coordinates": { "latitude": -34.0569, "longitude": 151.1537 },
          "type": "start"
        },
        {
          "name": "Bundeena Ferry Wharf",
          "coordinates": { "latitude": -34.0847, "longitude": 151.1394 },
          "type": "waypoint"
        },
        {
          "name": "Cronulla Station",
          "coordinates": { "latitude": -34.0569, "longitude": 151.1537 },
          "type": "end"
        }
      ]
    },
    "requirements": {
      "equipment": ["helmet", "water_bottle", "spare_tube"],
      "experience": "intermediate",
      "fitness": "moderate"
    },
    "isPublic": true,
    "allowWaitlist": true
  },
  "timestamp": "2025-12-20T00:00:00.000Z"
}
```

#### List Club Rides
**Endpoint:** `GET /v1/clubs/{clubId}/rides`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** Club membership required (any active member)

**Query Parameters:**
- `limit` (optional): Number of rides to return (default: 20, max: 100)
- `cursor` (optional): Pagination cursor
- `status` (optional): Filter by status (`draft` | `published` | `active` | `completed` | `cancelled`)
- `rideType` (optional): Filter by type (`training` | `social` | `competitive` | `adventure` | `maintenance`)
- `difficulty` (optional): Filter by difficulty (`beginner` | `intermediate` | `advanced` | `expert`)
- `startDate` (optional): Filter rides starting after this date
- `endDate` (optional): Filter rides starting before this date
- `includeDrafts` (optional): Include draft rides (default: false, requires leadership role)

**Response 200 (Success):**
```json
{
  "success": true,
  "data": [
    {
      "rideId": "ride_abc123",
      "title": "Saturday Morning Training Ride",
      "rideType": "training",
      "difficulty": "intermediate",
      "status": "published",
      "scope": "club",
      "audience": "members_only",
      "startDateTime": "2025-12-28T06:00:00.000Z",
      "estimatedDuration": 180,
      "maxParticipants": 20,
      "currentParticipants": 8,
      "meetingPoint": {
        "name": "Cronulla Station",
        "address": "Cronulla NSW 2230"
      },
      "route": {
        "name": "Royal National Park Loop",
        "type": "basic",
        "distance": 45.5,
        "difficulty": "intermediate"
      },
      "createdBy": "user_123",
      "createdByName": "Jane Smith",
      "publishedBy": "user_456",
      "publishedAt": "2025-12-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "nextCursor": "eyJyaWRlSWQiOiJyaWRlX2FiYzEyMyJ9"
  },
  "timestamp": "2025-12-20T00:00:00.000Z"
}
```

#### Get Ride Details
**Endpoint:** `GET /v1/clubs/{clubId}/rides/{rideId}`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** Club membership required (or public ride)

**Response 200 (Success):**
```json
{
  "success": true,
  "data": {
    "rideId": "ride_abc123",
    "clubId": "club_123",
    "title": "Saturday Morning Training Ride",
    "description": "Moderate pace training ride through the Royal National Park",
    "rideType": "training",
    "difficulty": "intermediate",
    "status": "planned",
    "startDateTime": "2025-12-28T06:00:00.000Z",
    "estimatedDuration": 180,
    "maxParticipants": 20,
    "currentParticipants": 8,
    "waitlistCount": 2,
    "createdBy": "user_123",
    "createdByName": "Jane Smith",
    "createdAt": "2025-12-20T00:00:00.000Z",
    "updatedAt": "2025-12-20T00:00:00.000Z",
    "meetingPoint": {
      "name": "Cronulla Station",
      "address": "Cronulla NSW 2230",
      "coordinates": {
        "latitude": -34.0569,
        "longitude": 151.1537
      },
      "instructions": "Meet at the main entrance, bring your bike and helmet"
    },
    "route": {
      "name": "Royal National Park Loop",
      "distance": 45.5,
      "estimatedTime": 180,
      "difficulty": "intermediate",
      "waypoints": [
        {
          "name": "Cronulla Station",
          "coordinates": { "latitude": -34.0569, "longitude": 151.1537 },
          "type": "start"
        },
        {
          "name": "Bundeena Ferry Wharf",
          "coordinates": { "latitude": -34.0847, "longitude": 151.1394 },
          "type": "waypoint"
        },
        {
          "name": "Cronulla Station",
          "coordinates": { "latitude": -34.0569, "longitude": 151.1537 },
          "type": "end"
        }
      ]
    },
    "requirements": {
      "equipment": ["helmet", "water_bottle", "spare_tube"],
      "experience": "intermediate",
      "fitness": "moderate"
    },
    "isPublic": true,
    "allowWaitlist": true,
    "participants": [
      {
        "userId": "user_123",
        "displayName": "Jane Smith",
        "role": "captain",
        "status": "confirmed",
        "joinedAt": "2025-12-20T00:00:00.000Z"
      },
      {
        "userId": "user_456",
        "displayName": "John Doe",
        "role": "participant",
        "status": "confirmed",
        "joinedAt": "2025-12-21T00:00:00.000Z"
      }
    ],
    "waitlist": [
      {
        "userId": "user_789",
        "displayName": "Bob Wilson",
        "joinedWaitlistAt": "2025-12-22T00:00:00.000Z",
        "position": 1
      }
    ]
  },
  "timestamp": "2025-12-20T00:00:00.000Z"
}
```

#### Update Ride
**Endpoint:** `PUT /v1/clubs/{clubId}/rides/{rideId}`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** `manage_rides` capability or ride creator

**Request Body:** (Same structure as create, all fields optional)
```json
{
  "title": "Updated Saturday Morning Training Ride",
  "startDateTime": "2025-12-28T06:30:00.000Z",
  "maxParticipants": 25
}
```

#### Cancel Ride
**Endpoint:** `DELETE /v1/clubs/{clubId}/rides/{rideId}`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** `manage_rides` capability or ride creator

**Request Body:**
```json
{
  "reason": "Weather conditions unsafe for cycling",
  "notifyParticipants": true
}
```

### 2. Ride Participation Operations

#### Join Ride
**Endpoint:** `POST /v1/clubs/{clubId}/rides/{rideId}/participants`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** Club membership required

**Request Body:**
```json
{
  "message": "Looking forward to this ride!"
}
```

**Response 201 (Confirmed):**
```json
{
  "success": true,
  "data": {
    "participationId": "part_xyz789",
    "rideId": "ride_abc123",
    "userId": "user_456",
    "role": "participant",
    "status": "confirmed",
    "joinedAt": "2025-12-20T00:00:00.000Z",
    "message": "Looking forward to this ride!"
  },
  "timestamp": "2025-12-20T00:00:00.000Z"
}
```

**Response 201 (Waitlisted):**
```json
{
  "success": true,
  "data": {
    "participationId": "part_xyz789",
    "rideId": "ride_abc123",
    "userId": "user_456",
    "role": "participant",
    "status": "waitlisted",
    "waitlistPosition": 3,
    "joinedAt": "2025-12-20T00:00:00.000Z",
    "message": "Looking forward to this ride!"
  },
  "timestamp": "2025-12-20T00:00:00.000Z"
}
```

#### Leave Ride
**Endpoint:** `DELETE /v1/clubs/{clubId}/rides/{rideId}/participants/me`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** User must be participant

**Response 200 (Success):**
```json
{
  "success": true,
  "message": "Successfully left the ride",
  "timestamp": "2025-12-20T00:00:00.000Z"
}
```

#### Update Participant Role
**Endpoint:** `PUT /v1/clubs/{clubId}/rides/{rideId}/participants/{userId}`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** `manage_rides` capability or ride captain

**Request Body:**
```json
{
  "role": "leader",
  "reason": "Experienced rider to help with navigation"
}
```

### 3. User Ride Discovery

#### Get User's Rides
**Endpoint:** `GET /v1/users/me/rides`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** User accessing own rides

**Query Parameters:**
- `status` (optional): Filter by participation status (`upcoming` | `completed` | `cancelled`)
- `role` (optional): Filter by participation role (`captain` | `leader` | `participant`)
- `limit` (optional): Number of rides to return (default: 20, max: 100)
- `cursor` (optional): Pagination cursor

**Response 200 (Success):**
```json
{
  "success": true,
  "data": [
    {
      "participationId": "part_xyz789",
      "rideId": "ride_abc123",
      "clubId": "club_123",
      "clubName": "Attaquer SWARM",
      "title": "Saturday Morning Training Ride",
      "rideType": "training",
      "difficulty": "intermediate",
      "startDateTime": "2025-12-28T06:00:00.000Z",
      "role": "participant",
      "status": "confirmed",
      "joinedAt": "2025-12-20T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "nextCursor": "eyJwYXJ0aWNpcGF0aW9uSWQiOiJwYXJ0X3h5ejc4OSJ9"
  },
  "timestamp": "2025-12-20T00:00:00.000Z"
}
```

## Data Model

### DynamoDB Single-Table Design Extensions

Building on Phase 2.2's single-table design, Phase 2.3 adds ride-related items.

#### Ride Item

**Primary Key:**
- `PK`: `CLUB#{clubId}`
- `SK`: `RIDE#{rideId}`

**GSI1 Key (Ride Lookup):**
- `GSI1PK`: `RIDE#{rideId}`
- `GSI1SK`: `METADATA`

**Attributes:**
```typescript
{
  PK: "CLUB#club_123",
  SK: "RIDE#ride_abc123",
  entityType: "RIDE",
  rideId: "ride_abc123",
  clubId: "club_123",
  title: "Saturday Morning Training Ride",
  description: "Moderate pace training ride through the Royal National Park",
  rideType: "training",
  difficulty: "intermediate",
  status: "published",
  scope: "club",                    // Future extensibility
  audience: "members_only",         // Future extensibility
  startDateTime: "2025-12-28T06:00:00.000Z",
  estimatedDuration: 180,
  maxParticipants: 20,
  currentParticipants: 8,
  waitlistCount: 2,
  createdBy: "user_123",
  createdAt: "2025-12-20T00:00:00.000Z",
  updatedAt: "2025-12-20T00:00:00.000Z",
  publishedBy: "user_456",          // Who published the ride
  publishedAt: "2025-12-20T10:00:00.000Z",
  meetingPoint: {
    name: "Cronulla Station",
    address: "Cronulla NSW 2230",
    coordinates: { latitude: -34.0569, longitude: 151.1537 },
    instructions: "Meet at the main entrance, bring your bike and helmet"
  },
  route: {
    name: "Royal National Park Loop",
    type: "basic",
    distance: 45.5,
    estimatedTime: 180,
    difficulty: "intermediate",
    waypoints: [...]
  },
  requirements: {
    equipment: ["helmet", "water_bottle", "spare_tube"],
    experience: "intermediate",
    fitness: "moderate"
  },
  isPublic: false,                  // Updated default for club rides
  allowWaitlist: true
}
```

#### Ride Participation Item

**Primary Key:**
- `PK`: `RIDE#{rideId}`
- `SK`: `PARTICIPANT#{userId}`

**Attributes:**
```typescript
{
  PK: "RIDE#ride_abc123",
  SK: "PARTICIPANT#user_456",
  entityType: "RIDE_PARTICIPATION",
  participationId: "part_xyz789",
  rideId: "ride_abc123",
  clubId: "club_123",
  userId: "user_456",
  role: "participant",
  status: "confirmed",
  joinedAt: "2025-12-20T00:00:00.000Z",
  message: "Looking forward to this ride!",
  waitlistPosition: null
}
```

#### User Ride Index Item

**Purpose:** Enable efficient user ride queries

**Primary Key:**
- `PK`: `USER#{userId}`
- `SK`: `RIDE#{rideId}`

**GSI1 Key:**
- `GSI1PK`: `USER#{userId}`
- `GSI1SK`: `RIDE#{startDateTime}#{rideId}`

**Attributes:**
```typescript
{
  PK: "USER#user_456",
  SK: "RIDE#ride_abc123",
  GSI1PK: "USER#user_456",
  GSI1SK: "RIDE#2025-12-28T06:00:00.000Z#ride_abc123",
  entityType: "USER_RIDE",
  participationId: "part_xyz789",
  rideId: "ride_abc123",
  clubId: "club_123",
  clubName: "Attaquer SWARM",
  title: "Saturday Morning Training Ride",
  rideType: "training",
  difficulty: "intermediate",
  startDateTime: "2025-12-28T06:00:00.000Z",
  role: "participant",
  status: "confirmed",
  joinedAt: "2025-12-20T00:00:00.000Z"
}
```

#### Club Ride Index Item

**Purpose:** Enable efficient club ride listing with filtering

**Primary Key:**
- `PK`: `CLUB#{clubId}#RIDES`
- `SK`: `DATE#{startDate}#RIDE#{rideId}`

**GSI2 Key:**
- `GSI2PK`: `CLUB#{clubId}#RIDES#{status}`
- `GSI2SK`: `DATE#{startDate}#RIDE#{rideId}`

**Attributes:**
```typescript
{
  PK: "CLUB#club_123#RIDES",
  SK: "DATE#2025-12-28#RIDE#ride_abc123",
  GSI2PK: "CLUB#club_123#RIDES#planned",
  GSI2SK: "DATE#2025-12-28#RIDE#ride_abc123",
  entityType: "CLUB_RIDE_INDEX",
  rideId: "ride_abc123",
  title: "Saturday Morning Training Ride",
  rideType: "training",
  difficulty: "intermediate",
  status: "planned",
  startDateTime: "2025-12-28T06:00:00.000Z",
  currentParticipants: 8,
  maxParticipants: 20,
  createdBy: "user_123"
}
```

### Access Patterns

#### 1. Get Ride by ID (Direct Lookup)
- **Operation:** `Query` on GSI1
- **Key:** `GSI1PK = RIDE#{rideId}, GSI1SK = METADATA`
- **Use Case:** Direct ride access, system admin operations, cross-club ride references

#### 2. List Club Rides
- **Operation:** `Query` on GSI2
- **Key:** `GSI2PK = CLUB#{clubId}#RIDES#{status}`
- **Sort:** By start date (GSI2SK)
- **Use Case:** Club ride listings with status filtering

#### 3. Get User's Rides
- **Operation:** `Query` on GSI1
- **Key:** `GSI1PK = USER#{userId}, GSI1SK begins_with RIDE#`
- **Sort:** By start date (chronological order)
- **Use Case:** User ride dashboard and history

#### 4. Get Ride Participants
- **Operation:** `Query`
- **Key:** `PK = RIDE#{rideId}, SK begins_with PARTICIPANT#`
- **Use Case:** Ride participant management and display

#### 5. Check User Ride Participation
- **Operation:** `GetItem`
- **Key:** `PK = RIDE#{rideId}, SK = PARTICIPANT#{userId}`
- **Use Case:** Participation validation and role checking

## Route Storage & Management Contract (Phase 2.4 Preparation)

### Route Data Model Extensions

#### Route Type System
```typescript
enum RouteType {
  BASIC = 'basic',           // Simple waypoint-based route (Phase 2.3)
  S3_GPX = 's3_gpx',         // GPX file stored in S3 (Phase 2.4)
  EXTERNAL = 'external'      // External route reference (Phase 3.1)
}
```

#### Enhanced Route Object
```typescript
interface Route {
  // Core fields (Phase 2.3)
  name: string;
  type: RouteType;
  distance?: number;          // meters
  estimatedTime?: number;     // seconds
  difficulty?: RouteDifficulty;
  
  // Basic route data (Phase 2.3)
  waypoints?: Waypoint[];
  
  // S3 GPX fields (Phase 2.4)
  routeKey?: string;          // S3 object key
  contentType?: string;       // application/gpx+xml
  hash?: string;              // SHA-256 for integrity
  
  // External route fields (Phase 3.1)
  provider?: string;          // 'strava', 'komoot', etc.
  externalId?: string;        // Provider-specific ID
  externalUrl?: string;       // Deep link to provider
  externalType?: string;      // 'route' | 'activity'
  
  // Metadata
  version?: string;           // Route version for updates
  createdAt?: string;
  updatedAt?: string;
}
```

### Route Access & Visibility Rules

#### Club Member Access
- **Full Access:** Club members can view complete route details including waypoints
- **Download Access:** Members can download GPX files (when available in Phase 2.4)
- **Edit Access:** Ride creators and club admins can modify routes

#### Public Ride Access
- **Summary Access:** Non-members can view route name, distance, and difficulty
- **Limited Details:** Meeting point visible, but no detailed waypoints
- **No Downloads:** GPX files restricted to club members only
- **External Links:** Public external route links (Strava, etc.) may be visible

#### Authorization Rules
```typescript
interface RouteAccessRules {
  // Phase 2.3 - Basic route data
  viewRouteSummary: 'public' | 'club_members';
  viewRouteDetails: 'club_members' | 'ride_participants';
  
  // Phase 2.4 - File access
  downloadGpxFile: 'club_members' | 'ride_participants';
  uploadRouteFile: 'ride_creators' | 'club_admins';
  
  // Phase 3.1 - External routes
  viewExternalLinks: 'public' | 'club_members';
  syncExternalRoute: 'route_owner' | 'club_admins';
}
```

### S3 Storage Contract (Phase 2.4)

#### File Storage Rules
- **Location:** `s3://sydney-cycles-routes/{clubId}/{rideId}/{routeKey}`
- **Formats:** GPX, KML (GPX preferred)
- **Size Limits:** 10MB maximum per route file
- **Retention:** Route files retained for ride lifetime + 1 year

#### Signed URL Behavior
```typescript
interface RouteDownloadUrl {
  url: string;              // Pre-signed S3 URL
  expiresAt: string;        // 15-minute TTL
  contentType: string;      // application/gpx+xml
  filename: string;         // Suggested download filename
}
```

#### API Extensions (Phase 2.4)
```typescript
// Route file upload
POST /v1/clubs/{clubId}/rides/{rideId}/route/upload
Content-Type: multipart/form-data

// Route file download
GET /v1/clubs/{clubId}/rides/{rideId}/route/download
Response: { downloadUrl: RouteDownloadUrl }
```

### External Route Integration (Phase 3.1)

#### Strava Integration Contract
```typescript
interface StravaRouteReference {
  type: 'external';
  provider: 'strava';
  externalId: string;       // Strava route ID
  externalUrl: string;      // https://strava.com/routes/{id}
  externalType: 'route' | 'activity';
  
  // Cached metadata (optional)
  cachedSummary?: {
    distance: number;
    elevationGain: number;
    polyline?: string;      // Encoded polyline
  };
  
  // Import options (Phase 3.1)
  importToS3?: boolean;     // Cache GPX in S3
  syncUpdates?: boolean;    // Auto-sync route changes
}
```

#### External Route Access Rules
- **Public Routes:** Strava public routes visible to all users
- **Private Routes:** Only accessible to connected Strava users
- **Import Permissions:** Route creators can import external routes to S3
- **Sync Permissions:** Auto-sync requires user consent and active Strava connection

## Domain Events (Phase 3.1 Preparation)

### Event Definitions

Phase 2.3 establishes the foundation for event-driven architecture without implementing event publishing. These events will be implemented in Phase 3.1 to support notifications and external integrations.

#### Ride Events
```typescript
interface RideCreatedEvent {
  eventType: 'RideCreated';
  rideId: string;
  clubId: string;
  createdBy: string;
  rideData: {
    title: string;
    startDateTime: string;
    rideType: string;
    difficulty: string;
    status: 'draft' | 'published';
    scope: string;
    audience: string;
  };
  timestamp: string;
}

interface RidePublishedEvent {
  eventType: 'RidePublished';
  rideId: string;
  clubId: string;
  publishedBy: string;
  publishedAt: string;
  rideData: {
    title: string;
    startDateTime: string;
    rideType: string;
    difficulty: string;
  };
  timestamp: string;
}

interface RideUpdatedEvent {
  eventType: 'RideUpdated';
  rideId: string;
  clubId: string;
  updatedBy: string;
  changes: Record<string, any>;
  timestamp: string;
}

interface RideCancelledEvent {
  eventType: 'RideCancelled';
  rideId: string;
  clubId: string;
  cancelledBy: string;
  reason?: string;
  participantCount: number;
  timestamp: string;
}

interface RideStatusChangedEvent {
  eventType: 'RideStatusChanged';
  rideId: string;
  clubId: string;
  fromStatus: string;
  toStatus: string;
  changedBy?: string;
  timestamp: string;
}
```

#### Participation Events
```typescript
interface ParticipantJoinedEvent {
  eventType: 'ParticipantJoined';
  rideId: string;
  clubId: string;
  userId: string;
  participationId: string;
  role: string;
  status: 'confirmed' | 'waitlisted';
  waitlistPosition?: number;
  timestamp: string;
}

interface ParticipantLeftEvent {
  eventType: 'ParticipantLeft';
  rideId: string;
  clubId: string;
  userId: string;
  participationId: string;
  reason: 'voluntary' | 'removed';
  removedBy?: string;
  timestamp: string;
}

interface LeadershipAssignedEvent {
  eventType: 'LeadershipAssigned';
  rideId: string;
  clubId: string;
  userId: string;
  participationId: string;
  fromRole: string;
  toRole: string;
  assignedBy: string;
  timestamp: string;
}
```

### Event Publishing Strategy (Phase 3.1)

#### Event Store Options
- **EventBridge:** AWS native event routing for external integrations
- **SQS/SNS:** Internal event processing and fan-out
- **DynamoDB Streams:** Change data capture for audit trails

#### Event Consumers (Future Phases)
- **Notification Service:** Email, SMS, push notifications
- **Analytics Service:** Ride participation metrics
- **External Integrations:** Strava sync, calendar updates
- **Audit Service:** Compliance and security logging

#### Event Ordering & Consistency
- **Event Ordering:** Events published after successful database writes
- **Idempotency:** Events include idempotency keys for safe retries
- **Failure Handling:** Dead letter queues for failed event processing
- **Schema Evolution:** Event versioning for backward compatibility

## Ride Lifecycle & State Management

### Ride Status Definitions

```typescript
enum RideStatus {
  DRAFT = 'draft',           // Member proposal, invite-only
  PUBLISHED = 'published',   // Official club ride, accepting participants  
  ACTIVE = 'active',         // Ride in progress
  COMPLETED = 'completed',   // Ride finished successfully
  CANCELLED = 'cancelled',   // Ride cancelled before start
}

enum RideScope {
  CLUB = 'club',             // Club-based ride (Phase 2.3)
  PRIVATE = 'private',       // Friend ride (Phase 4.1+)
  COMMUNITY = 'community'    // Local/community ride (Phase 4.2+)
}

enum RideAudience {
  INVITE_ONLY = 'invite_only',       // Draft rides, friend rides
  MEMBERS_ONLY = 'members_only',     // Published club rides
  PUBLIC_READ_ONLY = 'public_read_only' // Public discovery
}
```

### Allowed Status Transitions

| From Status | To Status | Allowed | Trigger | Notes |
|-------------|-----------|---------|---------|-------|
| `draft` | `published` | ✅ | Manual by club leadership | Promotes to official ride |
| `draft` | `cancelled` | ✅ | Manual by creator or leadership | Cancels proposal |
| `published` | `active` | ✅ | Manual or automatic at start time | Ride begins |
| `published` | `cancelled` | ✅ | Manual by club leadership | Cancels official ride |
| `active` | `completed` | ✅ | Manual or automatic after duration | Normal completion |
| `active` | `cancelled` | ✅ | Emergency by club leadership | Safety issues |
| `completed` | - | ❌ | No transitions allowed | Final state |
| `cancelled` | - | ❌ | No transitions allowed | Final state |

### Participation Status Definitions

```typescript
enum ParticipationStatus {
  CONFIRMED = 'confirmed',   // Confirmed participant
  WAITLISTED = 'waitlisted', // On waitlist (ride full)
  WITHDRAWN = 'withdrawn',   // Voluntarily left ride
  REMOVED = 'removed',       // Removed by organizer
}
```

### Ride Leadership Roles

```typescript
enum RideRole {
  CAPTAIN = 'captain',       // Primary ride organizer
  LEADER = 'leader',         // Additional leadership support
  PARTICIPANT = 'participant' // Regular participant
}
```

### Leadership Eligibility Rules

1. **Ride Captain:** Ride creator automatically becomes captain, or can be assigned by club admin
2. **Ride Leader:** Club admins, ride captains, and members with RideLeader club role
3. **Leadership Limits:** Maximum 1 captain, up to 4 leaders per ride (configurable)
4. **Promotion Rules:** Captains can promote participants to leaders
5. **Club Role Requirements:** Leadership roles require appropriate club membership level

## Club Integration & Authorization

### Ride Capabilities

```typescript
enum RideCapability {
  // Basic ride access
  VIEW_CLUB_RIDES = 'view_club_rides',
  VIEW_DRAFT_RIDES = 'view_draft_rides',
  JOIN_RIDES = 'join_rides',
  
  // Ride creation and management
  CREATE_RIDE_PROPOSALS = 'create_ride_proposals',  // Any member
  PUBLISH_OFFICIAL_RIDES = 'publish_official_rides', // Leadership only
  MANAGE_RIDES = 'manage_rides',
  CANCEL_RIDES = 'cancel_rides',
  
  // Participant management
  MANAGE_PARTICIPANTS = 'manage_participants',
  ASSIGN_LEADERSHIP = 'assign_leadership',
}
```

### Role-Capability Mapping Extensions

```typescript
const CLUB_ROLE_CAPABILITIES = {
  [ClubRole.MEMBER]: [
    // Existing member capabilities...
    RideCapability.VIEW_CLUB_RIDES,
    RideCapability.JOIN_RIDES,
    RideCapability.CREATE_RIDE_PROPOSALS,  // Members can create drafts
  ],
  [ClubRole.RIDE_LEADER]: [
    // All member capabilities...
    ...CLUB_ROLE_CAPABILITIES[ClubRole.MEMBER],
    RideCapability.VIEW_DRAFT_RIDES,
    RideCapability.PUBLISH_OFFICIAL_RIDES,  // Can publish official rides
    RideCapability.MANAGE_PARTICIPANTS,
  ],
  [ClubRole.RIDE_CAPTAIN]: [
    // All ride leader capabilities...
    ...CLUB_ROLE_CAPABILITIES[ClubRole.RIDE_LEADER],
    RideCapability.MANAGE_RIDES,
    RideCapability.CANCEL_RIDES,
    RideCapability.ASSIGN_LEADERSHIP,
  ],
  [ClubRole.ADMIN]: [
    // All existing admin capabilities...
    // All ride capabilities...
    ...Object.values(RideCapability),
  ],
  [ClubRole.OWNER]: [
    // All admin capabilities (inherits all ride capabilities)
    ...CLUB_ROLE_CAPABILITIES[ClubRole.ADMIN],
  ],
};
```

### Authorization Context Extensions

```typescript
interface RideAuthContext extends ClubAuthContext {
  rideParticipation?: {
    participationId: string;
    rideId: string;
    role: RideRole;
    status: ParticipationStatus;
    joinedAt: string;
  };
  rideCapabilities: RideCapability[];
}
```

## Implementation Architecture

### Service Structure

```
backend/services/ride-service/
├── domain/
│   ├── ride/
│   │   ├── ride.ts                    # Ride entity
│   │   ├── ride-repository.ts         # Repository interface
│   │   ├── ride-service.ts            # Business logic
│   │   └── ride-errors.ts             # Ride-specific errors
│   ├── participation/
│   │   ├── participation.ts           # Participation entity
│   │   ├── participation-repository.ts # Repository interface
│   │   ├── participation-service.ts   # Business logic
│   │   └── participation-errors.ts    # Participation errors
│   └── authorization/
│       ├── ride-authorization.ts      # Ride-level auth
│       └── ride-capabilities.ts       # Capability definitions
├── infrastructure/
│   ├── dynamodb-ride-repository.ts
│   └── dynamodb-participation-repository.ts
├── handlers/
│   ├── ride/
│   │   ├── create-ride.ts             # POST /clubs/{id}/rides
│   │   ├── publish-ride.ts            # POST /clubs/{id}/rides/{rideId}/publish
│   │   ├── list-rides.ts              # GET /clubs/{id}/rides
│   │   ├── get-ride.ts                # GET /clubs/{id}/rides/{rideId}
│   │   ├── update-ride.ts             # PUT /clubs/{id}/rides/{rideId}
│   │   └── cancel-ride.ts             # DELETE /clubs/{id}/rides/{rideId}
│   ├── participation/
│   │   ├── join-ride.ts               # POST /clubs/{id}/rides/{rideId}/participants
│   │   ├── leave-ride.ts              # DELETE /clubs/{id}/rides/{rideId}/participants/me
│   │   └── update-participant.ts      # PUT /clubs/{id}/rides/{rideId}/participants/{userId}
│   └── user/
│       └── get-user-rides.ts          # GET /users/me/rides
```

### Shared Types

```
backend/shared/types/
├── ride.ts                           # Ride-related types
├── participation.ts                  # Participation types
└── ride-authorization.ts             # Ride auth types
```

## Success Criteria

### Functional Requirements

1. **✅ Ride Management**
   - Club members can create rides with complete details
   - Ride creators and admins can update ride information
   - Rides can be cancelled with participant notification
   - Route and logistics management functional

2. **✅ Ride Discovery**
   - Club members can browse and search club rides
   - Filtering by date, type, difficulty, and status
   - Public rides visible to non-members (read-only)
   - Efficient pagination for large ride lists

3. **✅ Participation Management**
   - Members can join and leave rides
   - Waitlist system for oversubscribed rides
   - Leadership role assignment and management
   - Participation history tracking

4. **✅ Authorization Integration**
   - Club-level ride permissions enforced
   - Role-based ride management capabilities
   - Contextual leadership assignment
   - System admin override support

### Technical Requirements

1. **✅ Performance**
   - Efficient ride queries with proper indexing
   - Optimized participation management
   - Scalable ride listing and search
   - Minimal database operations

2. **✅ Data Consistency**
   - Atomic participation operations
   - Consistent ride state management
   - Proper index synchronization
   - Audit trail maintenance

3. **✅ Integration**
   - Seamless club service integration
   - Authorization service extension
   - User profile service integration
   - Notification system preparation

### Quality Requirements

1. **✅ Security**
   - Proper authorization enforcement
   - Club membership validation
   - Ride access control
   - Audit logging

2. **✅ Usability**
   - Intuitive ride creation workflow
   - Clear participation management
   - Helpful error messages
   - Responsive operations

## Future Extensions

### Phase 3.x: Advanced Features

#### Real-Time Features
- Live ride tracking and updates
- Real-time participant communication
- GPS integration and navigation
- Weather and traffic integration

#### Social Features
- Ride photo sharing and galleries
- Post-ride reviews and feedback
- Achievement system and badges
- Social media integration

#### Analytics & Insights
- Ride performance analytics
- Club activity reporting
- Individual progress tracking
- Safety and incident reporting

#### Advanced Event Management
- Multi-day event support
- Event series and recurring rides
- External event integration
- Payment and fee management

## Future Phase Roadmap

### Phase 2.4: Advanced Route Management (Q2 2026)
**Focus:** File storage and advanced route features
- S3 GPX file storage implementation
- Route upload/download endpoints
- Signed URL generation for secure file access
- Route versioning and update management
- Route import from common formats (GPX, KML, TCX)

**Dependencies:** Phase 2.3 route storage contracts

### Phase 3.1: External Integrations & Notifications (Q3 2026)
**Focus:** Third-party integrations and real-time notifications
- Strava OAuth integration and activity sync
- Webhook processing infrastructure
- Event-driven notification system
- Email and push notification delivery
- External calendar integration (Google Calendar, Outlook)

**Dependencies:** Phase 2.3 domain events, Phase 2.4 route management

### Phase 3.2: Gamification & User Engagement (Q4 2026)
**Focus:** User motivation and community building
- User progress tracking and analytics
- Goals and challenges system
- Achievement badges and streaks
- Leaderboards and competitions
- Social features and community building

**Dependencies:** Phase 3.1 Strava integration for activity data

### Phase 4.x: Advanced Platform Features (2027+)
**Focus:** Enterprise features and advanced functionality
- Multi-tenant club management
- Advanced analytics and reporting
- Payment processing and event fees
- Insurance integration
- Mobile app development
- API marketplace and third-party integrations

---

**Phase 2.3 Scope:** Core ride management and participation functionality  
**Target Completion:** Q1 2026  
**Dependencies:** Phase 2.2 (Club Membership) must be complete