# Domain Model v1 - Sydney Cycling Platform

## Overview

This document defines the canonical v1 domain model for the Sydney Cycling Platform. This model serves as the authoritative reference for all backend implementation and API design decisions.

## Core Domain Entities

### User
**Responsibility:** Represents an individual person in the system
- Identity and authentication credentials
- Personal profile information
- System-wide preferences and settings
- Account lifecycle management

**Key Relationships:**
- Has many Memberships (in different Clubs)
- Has many RideParticipations
- Has SystemRole (SiteAdmin or standard user)

### Club
**Responsibility:** Represents a cycling organization/community
- Club identity and branding
- Organizational information and policies
- Club-specific settings and configuration
- Lifecycle management (active, suspended, archived)

**Key Relationships:**
- Has many Memberships
- Has many Rides
- Defines available ClubRoles for Members

### Ride
**Responsibility:** Represents a specific cycling event/activity
- Event details (time, location, route)
- Participation management
- Ride-specific metadata and requirements
- Event lifecycle (planned, active, completed, cancelled)

**Key Relationships:**
- Belongs to a Club
- Has many RideParticipations

### Membership
**Responsibility:** Links Users to Clubs with specific context
- User's relationship to a specific Club
- Membership status and lifecycle
- Club-specific member information
- Join/leave history

**Key Relationships:**
- Belongs to one User
- Belongs to one Club
- Has exactly one ClubRole assignment while active

### RideParticipation
**Responsibility:** User's involvement in a specific Ride
- Registration and attendance tracking
- Contextual ride leadership assignment (Captain, Leader, Participant)
- Participation history and feedback

**Key Relationships:**
- Belongs to one User
- Belongs to one Ride
- Leadership eligibility derived from User's Membership and ClubRole

## Role System (v1 Scope)

### SystemRole
**Responsibility:** Platform-wide administrative capabilities

**Roles:**
- **SiteAdmin:** Full platform administration
- **User:** Standard platform access (default)

### ClubRole
**Responsibility:** Club-specific organizational roles

**Roles:**
- **ClubAdmin:** Full club management
- **RideCaptain:** Ride creation and management
- **RideLeader:** Ride leadership capabilities
- **Member:** Basic club participation

## Permission Model (v1 Approach)

### Logical Capabilities
Permissions are **derived contextually** from roles, not stored as entities.

**System Capabilities:**
- `manage_platform` (SiteAdmin only)
- `manage_all_clubs` (SiteAdmin only)

**Club Capabilities:**
- `manage_club` (ClubAdmin)
- `manage_rides` (ClubAdmin, RideCaptain)
- `lead_rides` (ClubAdmin, RideCaptain, RideLeader)
- `participate_rides` (All active members)

**Ride Leadership Assignment:**
- Contextual assignment via RideParticipation
- Eligibility derived from active Membership + appropriate ClubRole
- Types: Captain, Leader, Participant

## Domain Relationships (v1)

```
User 1:N Membership N:1 Club
User 1:N RideParticipation N:1 Ride
Club 1:N Ride
Membership 1:1 ClubRole
User 1:1 SystemRole
```

## Key Domain Rules (v1)

### Membership Rules
- Users can have multiple Club memberships
- Each membership has exactly one ClubRole while active
- Membership status determines ride participation eligibility

### Role Assignment
- SystemRole: SiteAdmin or User (default)
- ClubRole: Assigned per Membership
- Ride leadership: Contextual assignment based on ClubRole eligibility

### Permission Evaluation
- Capabilities derived from role context
- Club-scoped permissions require active Membership
- Ride leadership requires appropriate ClubRole in the Ride's Club

### Ride Management
- Rides belong to exactly one Club
- Participation requires active Membership in that Club
- Leadership assignments validated against ClubRole capabilities

## Domain Boundaries (v1)

### User Management Domain
- User identity and profile
- System-level role assignment
- Cross-platform user experience

### Club Management Domain
- Club organization and governance
- Membership lifecycle and role assignment
- Club-specific policies

### Event Management Domain
- Ride planning and execution
- Participation and contextual leadership
- Event coordination

### Authorization Domain
- Role-based capability evaluation
- Context-aware access control
- Membership-scoped permissions

## Deferred Concepts

The following concepts are explicitly **not included in v1** but may be considered for future evolution:

### RideRole as Independent Entity
- **Current v1:** Ride leadership is a contextual attribute of RideParticipation
- **Future:** May evolve into first-class role entity with independent lifecycle

### Persisted Permission Entities
- **Current v1:** Permissions are derived capabilities based on roles and context
- **Future:** May introduce granular permission storage for complex authorization

### AuditLog
- **Current v1:** No audit logging entities
- **Future:** Cross-cutting concern for compliance and security tracking

### Extended SystemRoles
- **Current v1:** Only SiteAdmin and User roles
- **Future:** Support, Moderator, and other administrative roles

### Advanced Membership States
- **Current v1:** Simple active/inactive membership
- **Future:** Pending, suspended, expired, and other lifecycle states

## Canonical Status

This domain model is **canonical** and serves as the authoritative reference for:
- Backend service design and implementation
- API contract definition
- Database schema design
- Authorization logic implementation
- Future feature specification

Any changes to this model require explicit approval and versioning.