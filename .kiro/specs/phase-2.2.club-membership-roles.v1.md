# Phase 2.2: Club Membership & Roles v1

**Version:** 1.0  
**Status:** Draft  
**Phase:** 2.2 - Club Membership Management & Role-Based Access Control  
**Dependencies:** Phase 1.1 (Infrastructure), Phase 1.2 (User Profile), Phase 1.3 (Authorization), Phase 2.1 (Club Service)

## Purpose

Extend the Phase 2.1 Club Service with comprehensive membership management and club-level role-based access control. This phase transforms clubs from simple entities into interactive communities where users can join, participate, and manage club activities based on their roles.

The service enables:
- User membership lifecycle (join, leave, invite, remove)
- Club-level role-based access control (Member, Admin, Owner)
- Club-specific authorization capabilities
- Member management for club administrators
- Membership discovery and club browsing for users

## Alignment with Canonical Documents

### Domain Model Alignment
- **Club Membership Entity:** User-club relationship with role and status
- **Club Roles:** Hierarchical permission system (Member < Admin < Owner)
- **Club Capabilities:** Fine-grained permissions for club operations
- **Membership Lifecycle:** Join requests, invitations, approvals, removals
- **Activity Tracking:** Membership history and audit trail

### Architecture Alignment
- **Extended Authorization:** Club-level capabilities extending Phase 1.3
- **Membership Service:** New service layer for membership operations
- **Event-Driven:** Membership changes trigger notifications
- **Data Consistency:** Transactional membership operations
- **Performance:** Efficient member queries and role checks

### Implementation Alignment
- **Phase 2.1 Extension:** Builds on existing club infrastructure
- **Authorization Integration:** Seamless club-level permission checks
- **User Profile Integration:** Member profile enrichment
- **Notification Foundation:** Ready for Phase 3.x notification system

## Scope Definition

### In-Scope (Phase 2.2)

#### Club Membership Management
- **Join Workflow:** Users can request to join clubs
- **Dual Invitation System:** Club admins can invite both existing users (in-app) and new users (email)
- **Approval Process:** Configurable join approval requirements
- **Member Removal:** Admins can remove members
- **Leave Functionality:** Members can leave clubs voluntarily

#### Club Role System
- **Member Role:** Basic club participation
- **Admin Role:** Club management capabilities
- **Owner Role:** Full club control including admin management
- **Role Transitions:** Promote/demote members between roles

#### Club-Level Authorization
- **Club Capabilities:** Fine-grained permission system
- **Role-Based Access:** Capabilities assigned to roles
- **Context-Aware:** Authorization considers club membership and role
- **Inheritance:** Higher roles inherit lower role capabilities

#### Member Discovery
- **Club Member Lists:** View club membership (with privacy controls)
- **User Club Lists:** View user's club memberships
- **Member Search:** Find members within clubs
- **Activity Feeds:** Member activity within clubs

#### Club Configuration
- **Membership Settings:** Public/private clubs, approval requirements
- **Role Permissions:** Customizable role-capability mappings
- **Member Limits:** Optional membership caps
- **Privacy Controls:** Member visibility settings

### Out-of-Scope (Phase 2.2)

#### Advanced Membership Features
- **Membership Tiers:** Paid/premium memberships
- **Membership Expiry:** Time-limited memberships
- **Bulk Operations:** Mass member imports/exports (single invitations only in v1)
- **Advanced Workflows:** Multi-step approval processes
- **Email Delivery:** Actual email sending (Phase 2.2 creates invitation records; email integration in Phase 3.x)

#### Governance Features (Explicitly Out of Scope)
- **Ownership Transfer:** Transferring club ownership between users
- **Club Deletion:** Deleting clubs and handling membership cleanup
- **Advanced Role Management:** Custom roles beyond Member/Admin/Owner
- **Membership Appeals:** Formal processes for membership disputes

#### Social Features
- **Member Messaging:** Direct messaging between members
- **Social Profiles:** Extended member profiles within clubs
- **Activity Streams:** Real-time activity feeds
- **Member Ratings:** Peer review systems

#### Integration Features
- **External Auth:** Third-party authentication integration
- **Calendar Integration:** External calendar syncing
- **Payment Processing:** Membership fee collection
- **Analytics Dashboard:** Advanced membership analytics

## API Specification

### Base Path
All membership endpoints use the base path `/v1/clubs/{clubId}`

### 1. Club Membership Operations

#### Join Club
**Endpoint:** `POST /v1/clubs/{clubId}/members`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** User must not already be a member

**Request Body:**
```json
{
  "message": "I'd love to join your cycling group!"
}
```

**Response 201 (Joined - Public Club):**
```json
{
  "success": true,
  "data": {
    "membershipId": "mem_abc123",
    "clubId": "club_123",
    "userId": "user_456",
    "role": "member",
    "status": "active",
    "joinedAt": "2025-12-19T00:00:00.000Z",
    "message": "I'd love to join your cycling group!"
  },
  "timestamp": "2025-12-19T00:00:00.000Z"
}
```

**Response 202 (Join Request - Private Club):**
```json
{
  "success": true,
  "data": {
    "membershipId": "mem_abc123",
    "clubId": "club_123",
    "userId": "user_456",
    "role": "member",
    "status": "pending",
    "requestedAt": "2025-12-19T00:00:00.000Z",
    "message": "I'd love to join your cycling group!"
  },
  "timestamp": "2025-12-19T00:00:00.000Z"
}
```

#### Leave Club
**Endpoint:** `DELETE /v1/clubs/{clubId}/members/me`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** User must be a member

**Response 200 (Success):**
```json
{
  "success": true,
  "message": "Successfully left the club",
  "timestamp": "2025-12-19T00:00:00.000Z"
}
```

### 2. Member Management (Admin Operations)

#### List Club Members
**Endpoint:** `GET /v1/clubs/{clubId}/members`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** `view_club_members` capability

**Query Parameters:**
- `limit` (optional): Number of members to return (default: 20, max: 100)
- `cursor` (optional): Pagination cursor
- `role` (optional): Filter by role (`member` | `admin` | `owner`)
- `status` (optional): Filter by status (`active` | `pending` | `suspended`)

**Response 200 (Success):**
```json
{
  "success": true,
  "data": [
    {
      "membershipId": "mem_abc123",
      "userId": "user_456",
      "displayName": "John Doe",
      "email": "john@example.com",
      "role": "member",
      "status": "active",
      "joinedAt": "2025-12-19T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "nextCursor": "eyJ1c2VySWQiOiJ1c2VyXzQ1NiJ9"
  },
  "timestamp": "2025-12-19T00:00:00.000Z"
}
```

#### Invite User to Club
**Endpoint:** `POST /v1/clubs/{clubId}/invitations`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** `invite_members` capability

**Request Body (Email Invitation - New User):**
```json
{
  "type": "email",
  "email": "newmember@example.com",
  "role": "member",
  "message": "Join our cycling club!"
}
```

**Request Body (In-App Invitation - Existing User):**
```json
{
  "type": "user",
  "userId": "user_789",
  "role": "member",
  "message": "Join our cycling club!"
}
```

**Response 201 (Email Invitation):**
```json
{
  "success": true,
  "data": {
    "invitationId": "inv_xyz789",
    "type": "email",
    "clubId": "club_123",
    "email": "newmember@example.com",
    "userId": null,
    "role": "member",
    "status": "pending",
    "invitedBy": "user_123",
    "invitedAt": "2025-12-19T00:00:00.000Z",
    "expiresAt": "2025-12-26T00:00:00.000Z",
    "message": "Join our cycling club!",
    "deliveryMethod": "email"
  },
  "timestamp": "2025-12-19T00:00:00.000Z"
}
```

**Response 201 (In-App Invitation):**
```json
{
  "success": true,
  "data": {
    "invitationId": "inv_abc456",
    "type": "user",
    "clubId": "club_123",
    "email": null,
    "userId": "user_789",
    "role": "member",
    "status": "pending",
    "invitedBy": "user_123",
    "invitedAt": "2025-12-19T00:00:00.000Z",
    "expiresAt": "2025-12-26T00:00:00.000Z",
    "message": "Join our cycling club!",
    "deliveryMethod": "in_app"
  },
  "timestamp": "2025-12-19T00:00:00.000Z"
}
```

#### Update Member Role
**Endpoint:** `PUT /v1/clubs/{clubId}/members/{userId}`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** `manage_members` capability

**Request Body:**
```json
{
  "role": "admin",
  "reason": "Promoting to help with club management"
}
```

**Response 200 (Success):**
```json
{
  "success": true,
  "data": {
    "membershipId": "mem_abc123",
    "userId": "user_456",
    "role": "admin",
    "status": "active",
    "updatedAt": "2025-12-19T00:00:00.000Z",
    "updatedBy": "user_123",
    "reason": "Promoting to help with club management"
  },
  "timestamp": "2025-12-19T00:00:00.000Z"
}
```

#### Remove Member
**Endpoint:** `DELETE /v1/clubs/{clubId}/members/{userId}`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** `remove_members` capability

**Request Body:**
```json
{
  "reason": "Violation of club rules"
}
```

**Response 200 (Success):**
```json
{
  "success": true,
  "message": "Member removed from club",
  "timestamp": "2025-12-19T00:00:00.000Z"
}
```

### 3. Membership Requests & Invitations

#### Approve/Reject Join Request
**Endpoint:** `PUT /v1/clubs/{clubId}/requests/{membershipId}`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** `manage_join_requests` capability

**Request Body:**
```json
{
  "action": "approve",
  "message": "Welcome to the club!"
}
```

**Response 200 (Success):**
```json
{
  "success": true,
  "data": {
    "membershipId": "mem_abc123",
    "status": "active",
    "processedAt": "2025-12-19T00:00:00.000Z",
    "processedBy": "user_123",
    "message": "Welcome to the club!"
  },
  "timestamp": "2025-12-19T00:00:00.000Z"
}
```

#### Accept/Decline Invitation
**Endpoint:** `PUT /v1/invitations/{invitationId}`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** User must be invitation recipient

**Request Body:**
```json
{
  "action": "accept"
}
```

### 4. User Membership Discovery

#### Get User's Club Memberships
**Endpoint:** `GET /v1/users/me/memberships`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** User accessing own memberships

**Response 200 (Success):**
```json
{
  "success": true,
  "data": [
    {
      "membershipId": "mem_abc123",
      "clubId": "club_123",
      "clubName": "Attaquer SWARM",
      "role": "member",
      "status": "active",
      "joinedAt": "2025-12-19T00:00:00.000Z"
    }
  ],
  "timestamp": "2025-12-19T00:00:00.000Z"
}
```

#### Get User's Pending Invitations
**Endpoint:** `GET /v1/users/me/invitations`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** User accessing own invitations

**Response 200 (Success):**
```json
{
  "success": true,
  "data": [
    {
      "invitationId": "inv_xyz789",
      "clubId": "club_456",
      "clubName": "Sydney Cyclists",
      "role": "member",
      "invitedBy": "user_789",
      "invitedByName": "Jane Smith",
      "invitedAt": "2025-12-19T00:00:00.000Z",
      "expiresAt": "2025-12-26T00:00:00.000Z",
      "message": "Join our cycling club!"
    }
  ],
  "timestamp": "2025-12-19T00:00:00.000Z"
}
```

## Data Model

### DynamoDB Single-Table Design Extensions

Building on Phase 2.1's single-table design, Phase 2.2 adds membership-related items.

#### Club Membership Item

**Primary Key:**
- `PK`: `CLUB#{clubId}`
- `SK`: `MEMBER#{userId}`

**Attributes:**
```typescript
{
  PK: "CLUB#club_123",
  SK: "MEMBER#user_456",
  entityType: "CLUB_MEMBERSHIP",
  membershipId: "mem_abc123",
  clubId: "club_123",
  userId: "user_456",
  role: "member",
  status: "active",
  joinedAt: "2025-12-19T00:00:00.000Z",
  updatedAt: "2025-12-19T00:00:00.000Z",
  joinMessage: "I'd love to join your cycling group!",
  invitedBy: null,
  processedBy: null
}
```

#### User Membership Index Item

**Purpose:** Enable efficient user membership queries

**Primary Key:**
- `PK`: `USER#{userId}`
- `SK`: `MEMBERSHIP#{clubId}`

**GSI1 Key:**
- `GSI1PK`: `USER#{userId}`
- `GSI1SK`: `MEMBERSHIP#{clubId}`

**Attributes:**
```typescript
{
  PK: "USER#user_456",
  SK: "MEMBERSHIP#club_123",
  GSI1PK: "USER#user_456",
  GSI1SK: "MEMBERSHIP#club_123",
  entityType: "USER_MEMBERSHIP",
  membershipId: "mem_abc123",
  clubId: "club_123",
  userId: "user_456",
  role: "member",
  status: "active",
  joinedAt: "2025-12-19T00:00:00.000Z"
}
```

#### Club Member Index Item

**Purpose:** Enable efficient club member listing with role filtering

**Primary Key:**
- `PK`: `CLUB#{clubId}#MEMBERS`
- `SK`: `ROLE#{role}#USER#{userId}`

**GSI2 Key:**
- `GSI2PK`: `CLUB#{clubId}#MEMBERS`
- `GSI2SK`: `ROLE#{role}#USER#{userId}`

**Attributes:**
```typescript
{
  PK: "CLUB#club_123#MEMBERS",
  SK: "ROLE#member#USER#user_456",
  GSI2PK: "CLUB#club_123#MEMBERS",
  GSI2SK: "ROLE#member#USER#user_456",
  entityType: "CLUB_MEMBER_INDEX",
  membershipId: "mem_abc123",
  userId: "user_456",
  role: "member",
  status: "active",
  joinedAt: "2025-12-19T00:00:00.000Z"
}
```

#### Club Invitation Item

**Primary Key:**
- `PK`: `INVITATION#{invitationId}`
- `SK`: `METADATA`

**Attributes (Email Invitation):**
```typescript
{
  PK: "INVITATION#inv_xyz789",
  SK: "METADATA",
  entityType: "CLUB_INVITATION",
  invitationId: "inv_xyz789",
  type: "email",
  clubId: "club_123",
  email: "newmember@example.com",
  userId: null, // Set when user registers and accepts
  role: "member",
  status: "pending",
  invitedBy: "user_123",
  invitedAt: "2025-12-19T00:00:00.000Z",
  expiresAt: "2025-12-26T00:00:00.000Z",
  message: "Join our cycling club!",
  token: "secure_invitation_token",
  deliveryMethod: "email"
}
```

**Attributes (In-App Invitation):**
```typescript
{
  PK: "INVITATION#inv_abc456",
  SK: "METADATA",
  entityType: "CLUB_INVITATION",
  invitationId: "inv_abc456",
  type: "user",
  clubId: "club_123",
  email: null,
  userId: "user_789", // Known user being invited
  role: "member",
  status: "pending",
  invitedBy: "user_123",
  invitedAt: "2025-12-19T00:00:00.000Z",
  expiresAt: "2025-12-26T00:00:00.000Z",
  message: "Join our cycling club!",
  token: null, // Not needed for in-app invitations
  deliveryMethod: "in_app"
}
```

#### User Invitation Index Item

**Purpose:** Enable efficient user invitation queries for in-app notifications

**Primary Key:**
- `PK`: `USER#{userId}`
- `SK`: `INVITATION#{invitationId}`

**GSI1 Key:**
- `GSI1PK`: `USER#{userId}`
- `GSI1SK`: `INVITATION#{invitationId}`

**Attributes:**
```typescript
{
  PK: "USER#user_789",
  SK: "INVITATION#inv_abc456",
  GSI1PK: "USER#user_789",
  GSI1SK: "INVITATION#inv_abc456",
  entityType: "USER_INVITATION",
  invitationId: "inv_abc456",
  clubId: "club_123",
  clubName: "Attaquer SWARM",
  role: "member",
  status: "pending",
  invitedBy: "user_123",
  invitedByName: "Jane Smith",
  invitedAt: "2025-12-19T00:00:00.000Z",
  expiresAt: "2025-12-26T00:00:00.000Z"
}
```

### Access Patterns

#### 1. Get User's Club Memberships
- **Operation:** `Query` on GSI1
- **Key:** `GSI1PK = USER#{userId}, GSI1SK begins_with MEMBERSHIP#`
- **Use Case:** User dashboard, membership lists

#### 2. List Club Members
- **Operation:** `Query` on GSI2
- **Key:** `GSI2PK = CLUB#{clubId}#MEMBERS`
- **Filter:** Optional role and status filtering
- **Use Case:** Member management, club directories

#### 3. Check User Club Membership
- **Operation:** `GetItem`
- **Key:** `PK = CLUB#{clubId}, SK = MEMBER#{userId}`
- **Use Case:** Authorization checks, membership validation

#### 4. List Club Members by Role
- **Operation:** `Query` on GSI2
- **Key:** `GSI2PK = CLUB#{clubId}#MEMBERS, GSI2SK begins_with ROLE#{role}#`
- **Use Case:** Role-specific member lists

#### 5. Get User's Pending Invitations
- **Operation:** `Query` on GSI1
- **Key:** `GSI1PK = USER#{userId}, GSI1SK begins_with INVITATION#`
- **Use Case:** User dashboard, notification system

## Dual Invitation System

### In-App Invitations (Existing Users)

**Use Case:** Inviting users who already have accounts on the platform

**Workflow:**
1. Admin searches for existing users by email/name
2. Admin sends in-app invitation to selected user
3. User receives notification in their dashboard/notifications
4. User can accept/decline directly in the web app
5. No email required - purely in-app experience

**Benefits:**
- Immediate notification delivery
- No external email dependency
- Rich user experience with user profiles
- Real-time acceptance/decline
- Integration with notification system

### Email Invitations (New Users)

**Use Case:** Inviting people who don't have accounts yet

**Workflow:**
1. Admin enters email address of person to invite
2. System generates secure invitation token
3. Email sent with invitation link to join club
4. Recipient clicks link, registers account (if needed)
5. Upon registration/login, invitation is automatically processed
6. User joins club seamlessly

**Benefits:**
- Reach users outside the platform
- Growth mechanism for user acquisition
- Familiar email-based invitation pattern
- Secure token-based authentication
- Automatic account linking

### Unified Invitation Management

Both invitation types share:
- Same expiration logic (7 days default)
- Same role assignment capabilities
- Same approval workflow
- Same audit trail and logging
- Same admin management interface

### Future Extensibility

**Phase 3.x Enhancements:**
- **Bulk Invitations:** Invite multiple users at once
- **Invitation Templates:** Pre-defined invitation messages
- **Social Invitations:** Share invitation links on social media
- **QR Code Invitations:** Generate QR codes for easy sharing
- **SMS Invitations:** Text message invitation delivery
- **Calendar Integration:** Include club events in invitations

## Club Role System

### Role Hierarchy

```
Owner (Highest Authority)
├── All Admin capabilities
├── Manage club settings
├── Manage admins (promote/demote)
├── Transfer ownership
└── Delete club

Admin (Management Authority)
├── All Member capabilities
├── Manage members (invite/remove/promote to member)
├── Manage join requests
├── Manage club content
└── View member details

Member (Basic Participation)
├── View club details
├── View public member list
├── Leave club
└── Participate in club activities
```

### Club Capabilities

```typescript
enum ClubCapability {
  // Member capabilities
  VIEW_CLUB_DETAILS = 'view_club_details',
  VIEW_PUBLIC_MEMBERS = 'view_public_members',
  LEAVE_CLUB = 'leave_club',
  
  // Admin capabilities
  VIEW_CLUB_MEMBERS = 'view_club_members',
  INVITE_MEMBERS = 'invite_members',
  REMOVE_MEMBERS = 'remove_members',
  MANAGE_JOIN_REQUESTS = 'manage_join_requests',
  MANAGE_CLUB_CONTENT = 'manage_club_content',
  
  // Owner capabilities
  MANAGE_CLUB_SETTINGS = 'manage_club_settings',
  MANAGE_ADMINS = 'manage_admins',
  TRANSFER_OWNERSHIP = 'transfer_ownership',
  DELETE_CLUB = 'delete_club',
}
```

### Role-Capability Mapping

```typescript
const ROLE_CAPABILITIES: Record<ClubRole, ClubCapability[]> = {
  [ClubRole.MEMBER]: [
    ClubCapability.VIEW_CLUB_DETAILS,
    ClubCapability.VIEW_PUBLIC_MEMBERS,
    ClubCapability.LEAVE_CLUB,
  ],
  [ClubRole.ADMIN]: [
    // Inherits all member capabilities
    ...ROLE_CAPABILITIES[ClubRole.MEMBER],
    ClubCapability.VIEW_CLUB_MEMBERS,
    ClubCapability.INVITE_MEMBERS,
    ClubCapability.REMOVE_MEMBERS,
    ClubCapability.MANAGE_JOIN_REQUESTS,
    ClubCapability.MANAGE_CLUB_CONTENT,
  ],
  [ClubRole.OWNER]: [
    // Inherits all admin capabilities
    ...ROLE_CAPABILITIES[ClubRole.ADMIN],
    ClubCapability.MANAGE_CLUB_SETTINGS,
    ClubCapability.MANAGE_ADMINS,
    // Note: TRANSFER_OWNERSHIP and DELETE_CLUB are out of scope for Phase 2.2
  ],
};
```

## Membership Lifecycle & State Transitions

### Membership Status Definitions

```typescript
enum MembershipStatus {
  PENDING = 'pending',     // Join request or invitation awaiting approval
  ACTIVE = 'active',       // Active club member
  SUSPENDED = 'suspended', // Temporarily suspended member
  REMOVED = 'removed',     // Permanently removed from club
}
```

### Allowed Status Transitions

| From Status | To Status | Allowed | Trigger | Notes |
|-------------|-----------|---------|---------|-------|
| `pending` | `active` | ✅ | Accept invitation/request | Normal activation |
| `pending` | `removed` | ✅ | Decline/reject invitation | Cleanup pending state |
| `active` | `suspended` | ✅ | Admin action | Temporary disciplinary action |
| `active` | `removed` | ✅ | Admin/Owner action or voluntary leave | Permanent removal |
| `suspended` | `active` | ✅ | Admin action | Reinstate member |
| `suspended` | `removed` | ✅ | Admin/Owner action | Permanent removal |
| `removed` | `active` | ❌ | Not allowed | Must create new invitation |
| `removed` | `pending` | ❌ | Not allowed | Must create new invitation |
| `removed` | `suspended` | ❌ | Not allowed | Must create new invitation |

### Business Rules

1. **Owner Protection**: Club owners cannot be removed or suspended (must transfer ownership first)
2. **Re-admission**: Removed members must be re-invited to rejoin (no direct status change)
3. **Voluntary Leave**: Active members can leave voluntarily (transitions to `removed`)
4. **Invitation Expiry**: Pending invitations automatically expire after 7 days
5. **Single Membership**: Users can only have one membership record per club at a time
6. **Owner Limitations**: Owners cannot leave clubs or be demoted (ownership transfer required)

### Ownership Transfer (Out of Scope)

**Phase 2.2 Limitation:** Ownership transfer is not supported and will be addressed in a future governance phase.

**Current Behavior:**
- Each club has exactly one owner (set during club creation)
- Owners cannot be removed, suspended, or demoted
- Owners cannot leave clubs voluntarily
- Owner role is permanent within Phase 2.2 scope

**Future Phase Considerations:**
- Secure ownership transfer workflow
- Owner succession planning
- Multi-step ownership verification
- Ownership transfer audit trail
- Emergency ownership recovery procedures

**Workaround for Phase 2.2:**
- System administrators can modify ownership through direct database operations if needed
- Club deletion and recreation as last resort (when club deletion is implemented)

## Club Deletion & Data Consistency

### Club Deletion Behavior (Out of Scope for Phase 2.2)

**Current Assumption:** Clubs are permanent entities in Phase 2.2

**Future Considerations (Phase 3.x):**
- **Soft Deletion:** Clubs marked as deleted but data preserved
- **Membership Cleanup:** All memberships transition to `removed` status
- **Invitation Cleanup:** All pending invitations are cancelled
- **Data Retention:** Membership history preserved for audit purposes
- **Cascade Rules:** Clear deletion cascade behavior for related entities

**Phase 2.2 Behavior:**
- Club deletion is not supported
- Clubs can only be set to `archived` status (from Phase 2.1)
- Archived clubs retain all membership data
- Members of archived clubs maintain their memberships but cannot perform club activities

## Authorization Integration

### Enhanced Authorization Context

Extending Phase 1.3 authorization with club-level context:

```typescript
interface ClubAuthContext extends AuthContext {
  clubMembership?: {
    membershipId: string;
    clubId: string;
    role: ClubRole;
    status: MembershipStatus;
    joinedAt: string;
  };
  clubCapabilities: ClubCapability[];
}
```

### Authorization Middleware

```typescript
export function requireClubCapability(
  capability: ClubCapability,
  clubId: string
) {
  return async (authContext: AuthContext): Promise<void> => {
    // Check system-level capabilities first
    if (authContext.systemCapabilities.includes(SystemCapability.MANAGE_ALL_CLUBS)) {
      return; // System admin has all club capabilities
    }
    
    // Get user's club membership (no caching - real-time check)
    const membership = await getMembershipByUserAndClub(authContext.userId, clubId);
    if (!membership || membership.status !== 'active') {
      throw new InsufficientPrivilegesError(capability, authContext.userId, `club:${clubId}`);
    }
    
    // Check club-level capability
    const roleCapabilities = ROLE_CAPABILITIES[membership.role];
    if (!roleCapabilities.includes(capability)) {
      throw new InsufficientPrivilegesError(capability, authContext.userId, `club:${clubId}`);
    }
  };
}
```

### Authorization Cache Considerations

**Real-Time Role Changes:** Club membership roles can change dynamically (promotion, demotion, removal), requiring careful cache management.

**Cache Strategy:**
- **No Long-Lived Caches:** Membership checks must not rely on long-lived authorization caches
- **Real-Time Validation:** Each request validates current membership status and role
- **Performance Balance:** Use short-lived caches (< 30 seconds) if needed for performance
- **Cache Invalidation:** Any membership role change must invalidate related authorization caches
- **Consistency Guarantee:** Authorization decisions reflect current membership state

**Implementation Notes:**
- DynamoDB provides strong consistency for membership reads
- Lambda function memory can cache membership for request duration only
- API Gateway caching should not cache authorization decisions
- Client-side role assumptions must be validated server-side

## Implementation Architecture

### Service Structure Extensions

```
backend/services/club-service/
├── domain/
│   ├── membership/
│   │   ├── membership.ts              # Membership entity
│   │   ├── membership-repository.ts   # Repository interface
│   │   ├── membership-service.ts      # Business logic
│   │   └── membership-errors.ts       # Membership errors
│   ├── invitation/
│   │   ├── invitation.ts              # Invitation entity
│   │   ├── invitation-repository.ts   # Repository interface
│   │   ├── invitation-service.ts      # Business logic
│   │   └── invitation-errors.ts       # Invitation errors
│   └── authorization/
│       ├── club-authorization.ts      # Club-level auth
│       └── club-capabilities.ts       # Capability definitions
├── infrastructure/
│   ├── dynamodb-membership-repository.ts
│   └── dynamodb-invitation-repository.ts
├── handlers/
│   ├── membership/
│   │   ├── join-club.ts               # POST /clubs/{id}/members
│   │   ├── leave-club.ts              # DELETE /clubs/{id}/members/me
│   │   ├── list-members.ts            # GET /clubs/{id}/members
│   │   ├── update-member.ts           # PUT /clubs/{id}/members/{userId}
│   │   └── remove-member.ts           # DELETE /clubs/{id}/members/{userId}
│   ├── invitation/
│   │   ├── invite-user.ts             # POST /clubs/{id}/invitations
│   │   ├── accept-invitation.ts       # PUT /invitations/{id}
│   │   └── list-invitations.ts        # GET /users/me/invitations
│   └── user/
│       └── get-memberships.ts         # GET /users/me/memberships
```

### Shared Types Extensions

```
backend/shared/types/
├── membership.ts                      # Membership-related types
├── invitation.ts                      # Invitation-related types
└── club-authorization.ts              # Club auth types
```

## Error Handling

### Membership-Specific Errors

```typescript
export class MembershipNotFoundError extends Error {
  statusCode = 404;
  errorType = 'MEMBERSHIP_NOT_FOUND';
}

export class AlreadyMemberError extends Error {
  statusCode = 409;
  errorType = 'ALREADY_MEMBER';
}

export class MembershipLimitExceededError extends Error {
  statusCode = 409;
  errorType = 'MEMBERSHIP_LIMIT_EXCEEDED';
}

export class InvalidRoleTransitionError extends Error {
  statusCode = 400;
  errorType = 'INVALID_ROLE_TRANSITION';
}

export class CannotRemoveOwnerError extends Error {
  statusCode = 400;
  errorType = 'CANNOT_REMOVE_OWNER';
}
```

## Success Criteria

### Functional Requirements

1. **✅ Membership Lifecycle**
   - Users can join public clubs immediately
   - Users can request to join private clubs
   - Admins can approve/reject join requests
   - Members can leave clubs voluntarily

2. **✅ Role Management**
   - Owners can promote/demote admins
   - Admins can promote members to admin (if allowed)
   - Role transitions follow hierarchy rules
   - Ownership transfer functionality

3. **✅ Invitation System**
   - Admins can invite users by email
   - Invitations have expiration dates
   - Users can accept/decline invitations
   - Invitation tracking and management

4. **✅ Member Discovery**
   - Club member lists with role filtering
   - User membership dashboard
   - Privacy-respecting member visibility
   - Efficient member search

### Technical Requirements

1. **✅ Authorization Integration**
   - Seamless club-level capability checking
   - Role-based access control
   - System admin override capabilities
   - Performance-optimized permission checks

2. **✅ Data Consistency**
   - Transactional membership operations
   - Index item synchronization
   - Membership state consistency
   - Audit trail maintenance

3. **✅ Performance**
   - Efficient member queries
   - Optimized role checks
   - Scalable membership operations
   - Minimal database operations

### Quality Requirements

1. **✅ Security**
   - Proper authorization enforcement
   - Invitation token security
   - Member privacy protection
   - Audit logging

2. **✅ Usability**
   - Intuitive membership workflows
   - Clear role hierarchy
   - Helpful error messages
   - Responsive operations

## Future Extensions

### Phase 3.x: Advanced Features

#### Notification System
- Membership change notifications
- Invitation notifications
- Role change notifications
- Club activity updates

#### Advanced Membership
- Membership tiers and benefits
- Temporary memberships
- Membership renewal workflows
- Bulk member operations

#### Social Features
- Member profiles within clubs
- Member activity feeds
- Member interaction tracking
- Social networking features

## Testing Strategy

### Overview

Phase 2.2 requires comprehensive testing to ensure the membership and invitation systems work correctly across all user roles and scenarios. Testing covers functional correctness, authorization enforcement, data consistency, and performance.

### Testing Levels

#### 1. Unit Testing (Optional - Not Required for MVP)
- Domain entity business logic validation
- Repository operation correctness
- Authorization service functionality
- Error handling and edge cases

#### 2. Integration Testing (Required)
- API endpoint functionality
- Database operations and consistency
- Authorization flow validation
- Cross-service integration

#### 3. End-to-End Testing (Required)
- Complete user workflows
- Role-based access scenarios
- Invitation lifecycle testing
- Multi-user interaction scenarios

### Test Categories

#### A. Membership Management Tests

**Join Club Workflow**
- ✅ Public club immediate join
- ✅ Private club join request creation
- ✅ Duplicate membership prevention
- ✅ Authorization validation
- ❌ Invalid club ID handling
- ❌ Unauthenticated user rejection

**Leave Club Workflow**
- ✅ Successful voluntary departure
- ❌ Owner cannot leave (must transfer ownership)
- ❌ Non-member cannot leave
- ✅ Membership status update to 'removed'

**Member Management (Admin Operations)**
- ✅ List club members with pagination
- ✅ Role filtering (member, admin, owner)
- ✅ Status filtering (active, pending, suspended)
- ✅ Update member roles (member ↔ admin)
- ❌ Cannot promote to owner
- ✅ Remove members (except owners)
- ❌ Insufficient privileges rejection

#### B. Invitation System Tests

**Email Invitations (New Users)**
- ✅ Create email invitation with token
- ✅ Invitation expiry (7 days default)
- ✅ Duplicate invitation prevention
- ✅ Token-based invitation lookup
- ❌ Invalid email format rejection
- ❌ Expired invitation rejection

**In-App Invitations (Existing Users)**
- ✅ Create user invitation
- ✅ User notification creation
- ✅ Accept invitation workflow
- ✅ Decline invitation workflow
- ❌ Invite non-existent user
- ❌ Invite existing member

**Invitation Processing**
- ✅ Accept invitation creates membership
- ✅ Decline invitation updates status
- ✅ Admin can cancel pending invitations
- ❌ Process expired invitations
- ❌ Process already-processed invitations

#### C. Authorization Tests

**Role-Based Access Control**
- ✅ Member capabilities enforcement
- ✅ Admin capabilities enforcement
- ✅ Owner capabilities enforcement
- ❌ Unauthorized operation rejection
- ✅ System admin override functionality

**Club Capability Validation**
- ✅ `VIEW_CLUB_MEMBERS` (admin+ required)
- ✅ `INVITE_MEMBERS` (admin+ required)
- ✅ `REMOVE_MEMBERS` (admin+ required)
- ✅ `MANAGE_JOIN_REQUESTS` (admin+ required)
- ✅ `MANAGE_ADMINS` (owner required)
- ❌ Insufficient role rejection

**Cross-Club Authorization**
- ❌ Cannot manage members of other clubs
- ❌ Cannot view private members of other clubs
- ✅ System admin can manage any club

#### D. Data Consistency Tests

**Atomic Operations**
- ✅ Membership creation with all index items
- ✅ Role update consistency across indexes
- ✅ Membership removal cleanup
- ❌ Partial failure rollback

**Index Synchronization**
- ✅ User membership index accuracy
- ✅ Club member index accuracy
- ✅ Invitation index accuracy
- ✅ Cross-reference consistency

#### E. Performance Tests

**Query Performance**
- ✅ Club member listing (< 500ms for 100 members)
- ✅ User membership listing (< 200ms for 20 memberships)
- ✅ Invitation lookup (< 100ms)
- ✅ Authorization checks (< 50ms)

**Scalability Tests**
- ✅ Large club member lists (1000+ members)
- ✅ High concurrent join requests
- ✅ Bulk invitation processing
- ✅ Database connection pooling

### Test Execution Plan

#### Phase 1: Pre-Deployment Testing
1. **Compilation & Syntax Validation** ✅
2. **Import Resolution Testing** ✅
3. **Type Safety Verification** ✅
4. **Infrastructure Configuration Validation** ✅

#### Phase 2: Post-Deployment Testing
1. **API Endpoint Connectivity**
2. **Authentication Integration**
3. **Basic CRUD Operations**
4. **Authorization Enforcement**

#### Phase 3: Comprehensive Workflow Testing
1. **Complete Membership Lifecycles**
2. **Invitation System End-to-End**
3. **Role Management Scenarios**
4. **Multi-User Interaction Testing**

#### Phase 4: Performance & Load Testing
1. **Response Time Validation**
2. **Concurrent User Testing**
3. **Database Performance Monitoring**
4. **Error Rate Analysis**

### Test Data Requirements

#### Test Users
- **Site Admin** - System-level privileges
- **Club Owner** - Full club management
- **Club Admin** - Member management privileges
- **Club Member** - Basic participation
- **Non-Member** - External user for invitation testing

#### Test Clubs
- **Public Club** - Immediate join allowed
- **Private Club** - Join requests required
- **Large Club** - 100+ members for performance testing
- **Empty Club** - New club for testing initial membership

#### Test Scenarios
- **Happy Path Workflows** - All operations succeed
- **Authorization Failures** - Insufficient privileges
- **Validation Failures** - Invalid input data
- **Edge Cases** - Boundary conditions and limits
- **Error Recovery** - System resilience testing

### Success Criteria

#### Functional Criteria
- ✅ All API endpoints return expected responses
- ✅ Authorization correctly enforces role restrictions
- ✅ Data consistency maintained across all operations
- ✅ Invitation system works for both email and in-app
- ✅ Membership lifecycle operates correctly

#### Performance Criteria
- ✅ API response times < 1 second (95th percentile)
- ✅ Database queries optimized for scale
- ✅ No memory leaks in Lambda functions
- ✅ Concurrent user support (100+ simultaneous)

#### Security Criteria
- ✅ No unauthorized access to club data
- ✅ Invitation tokens secure and time-limited
- ✅ Audit logging captures all operations
- ✅ Input validation prevents injection attacks

### Testing Tools & Environment

#### API Testing
- **Postman/Insomnia** - Manual API testing
- **curl/HTTPie** - Command-line testing
- **AWS API Gateway Test Console** - Built-in testing

#### Database Testing
- **AWS DynamoDB Console** - Data inspection
- **NoSQL Workbench** - Query testing and optimization
- **CloudWatch Logs** - Operation monitoring

#### Performance Testing
- **Artillery/k6** - Load testing tools
- **AWS X-Ray** - Distributed tracing
- **CloudWatch Metrics** - Performance monitoring

#### Monitoring & Observability
- **CloudWatch Dashboards** - Real-time metrics
- **AWS Lambda Insights** - Function performance
- **DynamoDB Metrics** - Database performance
- **API Gateway Metrics** - Request/response analytics

## Migration Strategy

### Phase 2.2 Implementation Steps

1. **Domain Extensions** ✅
   - Create membership and invitation entities
   - Implement club authorization system
   - Build membership business logic

2. **Data Layer Extensions** ✅
   - Extend DynamoDB repository
   - Add membership access patterns
   - Implement invitation management

3. **API Layer Extensions** ✅
   - Implement membership endpoints
   - Add invitation endpoints
   - Integrate club authorization

4. **Authorization Integration** ✅
   - Extend authorization middleware
   - Implement club capability checking
   - Add role-based access control

5. **Testing & Validation** 🔄
   - Comprehensive membership testing
   - Authorization integration testing
   - Performance validation

## Conclusion

Phase 2.2 Club Membership & Roles transforms the Phase 2.1 club foundation into a fully interactive community platform. By adding comprehensive membership management and role-based access control, clubs become dynamic spaces where users can participate, contribute, and manage based on their roles and permissions.

This phase establishes the foundation for all future club-centric features while maintaining the performance, security, and architectural principles established in previous phases.