# Implementation Plan v1 - Sydney Cycling Platform Backend

## Overview

This document defines the authoritative step-by-step implementation plan for the Sydney Cycling Platform v1 backend. The plan ensures incremental, low-risk delivery while maintaining existing frontend functionality throughout the transition.

## Implementation Strategy

### Core Principles
- **Frontend preservation:** Zero changes to existing UI code
- **Incremental deployment:** Each phase independently deployable
- **Domain-by-domain:** Complete one bounded context before moving to next
- **Low-risk evolution:** Reversible changes with clear rollback paths
- **Parallel operation:** Backend and mock frontend coexist during transition

### Constraints
- Existing frontend code must remain unchanged
- No refactors to UI, auth-context, dashboards, or dialogs
- All backend code must live in new folders only
- Implement one domain at a time
- Each step must be independently deployable
- Prefer low-risk, reversible changes

## Phase 1: Foundation & User Management

### 1.1 Infrastructure Foundation

**New Folders:**
```
backend/
├── infrastructure/
│   ├── cognito/
│   ├── dynamodb/
│   └── api-gateway/
├── shared/
│   ├── types/
│   ├── auth/
│   └── utils/
└── services/
    └── user-profile/
```

**AWS Resources:**
- Cognito User Pool with custom attributes
- DynamoDB table (single table, v1 scope)
- API Gateway (REST API)
- Lambda execution roles and policies
- CloudWatch log groups

**Deliverables:**
- Infrastructure as Code (CDK/CloudFormation)
- Basic API Gateway with health check endpoint
- Cognito User Pool configured for JWT issuance
- DynamoDB table with initial access patterns

**Success Criteria:**
- Infrastructure deployed successfully
- Health checks passing
- Cognito User Pool operational
- DynamoDB table accessible

**Rollback Strategy:**
- Delete CloudFormation stack
- No impact on existing frontend
- Complete infrastructure removal

**Checkpoint:** Infrastructure deployed, health checks passing

### 1.2 User Profile Service

**New Implementation:**
```
backend/services/user-profile/
├── handlers/
│   ├── create-user.ts
│   ├── get-user.ts
│   ├── update-user.ts
│   └── get-current-user.ts
├── domain/
│   ├── user.ts
│   └── user-repository.ts
└── infrastructure/
    └── dynamodb-user-repository.ts
```

**API Endpoints:**
- `POST /users` - User registration coordination
- `GET /users/{id}` - User profile retrieval
- `PUT /users/{id}` - Profile updates
- `GET /users/me` - Current user context

**Authorization Points:**
- JWT validation via API Gateway authorizer
- User context injection for all endpoints
- Self-service profile updates only (users can only modify own profile)
- SiteAdmin can access any user profile

**Deliverables:**
- User domain entities and repository interfaces
- DynamoDB repository implementation
- Lambda handlers for user operations
- API Gateway integration with proper authorizers

**Success Criteria:**
- User management API functional
- Cognito integration complete
- JWT validation working
- User profile CRUD operations operational

**Rollback Strategy:**
- Disable API Gateway routes
- Remove Lambda functions
- Preserve infrastructure for retry

**Checkpoint:** User management API functional, Cognito integration complete

### 1.3 Authorization Service Foundation

**New Implementation:**
```
backend/services/authorization/
├── handlers/
│   └── evaluate-permissions.ts
├── domain/
│   ├── permissions.ts
│   ├── system-roles.ts
│   └── authorization-context.ts
└── infrastructure/
    └── permission-evaluator.ts
```

**Capabilities Implemented:**
- SystemRole-based permissions (`manage_platform`, `manage_all_clubs`)
- User context evaluation
- Permission derivation logic (no stored permissions)

**Integration Points:**
- Shared library for Lambda functions
- Context injection for all API calls
- Permission evaluation before business operations

**Success Criteria:**
- Authorization framework operational
- System-level permissions enforced
- Permission evaluation working correctly
- Integration with User Profile Service complete

**Rollback Strategy:**
- Disable authorization checks
- Fall back to basic JWT validation
- Maintain API functionality without complex authorization

**Checkpoint:** Authorization framework operational, system-level permissions enforced

## Phase 2: Club Management Domain

### 2.1 Club Service Implementation

**New Implementation:**
```
backend/services/club/
├── handlers/
│   ├── create-club.ts
│   ├── get-club.ts
│   ├── update-club.ts
│   └── list-clubs.ts
├── domain/
│   ├── club.ts
│   └── club-repository.ts
└── infrastructure/
    └── dynamodb-club-repository.ts
```

**API Endpoints:**
- `GET /clubs` - Club discovery and listing
- `POST /clubs` - Club creation (SiteAdmin only)
- `GET /clubs/{id}` - Club details
- `PUT /clubs/{id}` - Club updates

**Authorization Points:**
- Public club listing (read-only)
- SiteAdmin-only club creation
- Club-specific update permissions (ClubAdmin role - prepared for Phase 2.2)

**DynamoDB Patterns:**
- Club metadata storage: `PK=CLUB#{id}`, `SK=METADATA`
- Club listing queries via GSI
- Club search and filtering capabilities

**Success Criteria:**
- Club management operational
- Public discovery functional
- SiteAdmin club creation working
- Club listing and details accessible

**Rollback Strategy:**
- Disable club management endpoints
- Preserve club data in DynamoDB
- Fall back to frontend mock data

**Checkpoint:** Club management operational, public discovery functional

### 2.2 Membership Service Implementation

**New Implementation:**
```
backend/services/membership/
├── handlers/
│   ├── create-membership.ts
│   ├── update-membership.ts
│   ├── delete-membership.ts
│   └── list-club-members.ts
├── domain/
│   ├── membership.ts
│   ├── club-roles.ts
│   └── membership-repository.ts
└── infrastructure/
    └── dynamodb-membership-repository.ts
```

**API Endpoints:**
- `POST /clubs/{id}/memberships` - Join club / application
- `GET /clubs/{id}/memberships` - Club member listing
- `PUT /memberships/{id}` - Role assignment, status updates
- `DELETE /memberships/{id}` - Leave club

**Authorization Points:**
- Authenticated users can join clubs
- Club membership required for member listing
- ClubAdmin role required for role assignments
- Users can leave their own memberships

**DynamoDB Patterns:**
- Membership records: `PK=CLUB#{id}`, `SK=MEMBER#{user_id}`
- User membership queries: GSI on user_id
- Strong consistency for membership operations

**Authorization Service Extension:**
- ClubRole-based permission evaluation
- Membership context validation
- Club-scoped capability derivation

**Success Criteria:**
- Complete club and membership management
- Role-based authorization operational
- Strong consistency for membership operations
- Club-scoped permissions working

**Rollback Strategy:**
- Disable membership endpoints
- Preserve membership data
- Fall back to mock membership data in frontend

**Checkpoint:** Complete club and membership management, role-based authorization operational

## Phase 3: Event Management Domain

### 3.1 Ride Service Implementation

**New Implementation:**
```
backend/services/ride/
├── handlers/
│   ├── create-ride.ts
│   ├── get-ride.ts
│   ├── update-ride.ts
│   └── list-club-rides.ts
├── domain/
│   ├── ride.ts
│   └── ride-repository.ts
└── infrastructure/
    └── dynamodb-ride-repository.ts
```

**API Endpoints:**
- `GET /clubs/{id}/rides` - Club ride listing
- `POST /clubs/{id}/rides` - Ride creation
- `GET /rides/{id}` - Ride details
- `PUT /rides/{id}` - Ride updates

**Authorization Points:**
- Club membership required for ride listing
- `manage_rides` capability required for creation (ClubAdmin, RideCaptain)
- Ride creators and club admins can update rides

**DynamoDB Patterns:**
- Ride records: `PK=CLUB#{id}`, `SK=RIDE#{ride_id}`
- Ride queries by club and date ranges
- Ride metadata and status management

**Success Criteria:**
- Ride management operational within clubs
- Authorization based on ClubRole working
- Ride creation and updates functional
- Club ride listing operational

**Rollback Strategy:**
- Disable ride management endpoints
- Preserve ride data
- Fall back to mock ride data in frontend

**Checkpoint:** Ride management operational within clubs

### 3.2 Ride Participation Service

**New Implementation:**
```
backend/services/ride-participation/
├── handlers/
│   ├── join-ride.ts
│   ├── leave-ride.ts
│   ├── update-participation.ts
│   └── list-ride-participants.ts
├── domain/
│   ├── ride-participation.ts
│   ├── leadership-assignment.ts
│   └── participation-repository.ts
└── infrastructure/
    └── dynamodb-participation-repository.ts
```

**API Endpoints:**
- `POST /rides/{id}/participations` - Join ride
- `DELETE /participations/{id}` - Leave ride
- `PUT /participations/{id}` - Update participation (leadership assignment)
- `GET /rides/{id}/participations` - List participants

**Authorization Points:**
- Club membership required for ride participation
- `lead_rides` capability required for leadership assignment
- Participants can manage their own participation
- Ride captains can assign leadership roles

**DynamoDB Patterns:**
- Participation records: `PK=RIDE#{id}`, `SK=PARTICIPANT#{user_id}`
- User participation history: GSI on user_id
- Strong consistency for participation and leadership changes

**Leadership Assignment Logic:**
- Contextual attribute on RideParticipation (Captain, Leader, Participant)
- Eligibility validation based on ClubRole capabilities
- No separate role entities - pure contextual assignment

**Success Criteria:**
- Complete ride and participation management
- Leadership assignment operational
- Strong consistency for critical operations
- Contextual leadership working correctly

**Rollback Strategy:**
- Disable participation endpoints
- Preserve participation data
- Fall back to mock participation data

**Checkpoint:** Complete ride and participation management, leadership assignment operational

## Phase 4: Integration & Enhancement

### 4.1 Event-Driven Architecture

**New Implementation:**
```
backend/services/events/
├── handlers/
│   ├── domain-event-publisher.ts
│   └── integration-event-handler.ts
├── domain/
│   └── domain-events.ts
└── infrastructure/
    └── eventbridge-publisher.ts
```

**AWS Resources:**
- EventBridge custom bus
- Event rules and targets
- Dead letter queues for failed events

**Domain Events:**
- `UserRegistered`
- `ClubCreated`
- `MembershipCreated`
- `RideCreated`
- `ParticipationChanged`

**Success Criteria:**
- Event-driven architecture operational
- Async processing enabled
- Domain events publishing correctly
- Event handlers processing successfully

**Rollback Strategy:**
- Disable event publishing
- Remove EventBridge rules
- Maintain synchronous operation

**Checkpoint:** Event-driven architecture operational, async processing enabled

### 4.2 Third-Party Integration Foundation

**New Implementation:**
```
backend/services/integrations/
├── handlers/
│   ├── email-service.ts
│   └── webhook-processor.ts
├── domain/
│   └── integration-contracts.ts
└── infrastructure/
    ├── ses-email-service.ts
    └── strava-webhook-handler.ts
```

**AWS Resources:**
- SES for email notifications
- SNS for push notifications
- Secrets Manager for API keys
- Lambda for webhook processing

**Integration Points:**
- Welcome emails for new memberships
- Ride notification system
- Strava webhook foundation (future enhancement)

**Success Criteria:**
- Basic integrations operational
- Notification system functional
- Email delivery working
- Webhook processing ready

**Rollback Strategy:**
- Disable integration services
- Remove notification triggers
- Maintain core functionality without integrations

**Checkpoint:** Basic integrations operational, notification system functional

## Deployment Strategy

### Rollout Approach
1. **Shadow deployment:** Backend operates alongside existing mock system
2. **Feature flags:** Control which endpoints use backend vs. mock data
3. **Gradual migration:** Phase-by-phase cutover to backend APIs
4. **Validation period:** Parallel operation to verify data consistency
5. **Full cutover:** Frontend switches completely to backend APIs
6. **Mock cleanup:** Remove mock data and auth context (separate phase)

### Risk Mitigation Strategies

#### Feature Flags
- Environment-based configuration for backend vs. mock
- Per-endpoint granular control
- Instant rollback capability
- A/B testing support for validation

#### Data Validation
- Parallel writes to validate consistency
- Automated testing between mock and real systems
- Data integrity checks and alerts
- Reconciliation processes for discrepancies

#### Monitoring and Alerting
- Real-time health checks for all services
- Business metric monitoring (user registrations, club joins, ride participation)
- Error rate and latency alerting
- Automated rollback triggers for critical failures

#### Load Testing
- Gradual traffic increase to backend services
- Performance baseline establishment
- Capacity planning and auto-scaling validation
- Stress testing before full production load

### Success Criteria Per Phase

#### Phase 1 Success Criteria
- User management API functional with 99.9% uptime
- Authentication working correctly for all user types
- Authorization framework operational
- No impact on existing frontend functionality

#### Phase 2 Success Criteria
- Club and membership operations complete
- Authorization enforced correctly for all club operations
- Strong consistency maintained for membership changes
- Role-based permissions working across all club contexts

#### Phase 3 Success Criteria
- Full ride management operational
- Leadership assignment working correctly
- Participation management functional
- All authorization contexts properly enforced

#### Phase 4 Success Criteria
- Event-driven features operational
- Basic integrations functional
- Notification system working
- System ready for production scale

### Rollback Procedures

#### Immediate Rollback (< 5 minutes)
- Feature flag toggle to disable backend endpoints
- API Gateway route disabling
- Automatic fallback to mock data
- No data loss or corruption

#### Partial Rollback (< 30 minutes)
- Phase-specific service disabling
- Selective endpoint rollback
- Data preservation with service isolation
- Gradual restoration of mock functionality

#### Full Rollback (< 2 hours)
- Complete backend service shutdown
- Infrastructure preservation for analysis
- Full restoration of mock-based operation
- Data export for future migration retry

### Validation and Testing Strategy

#### Pre-Deployment Testing
- Unit tests for all domain logic
- Integration tests for API endpoints
- Authorization tests for all permission scenarios
- Load tests for expected traffic patterns

#### Post-Deployment Validation
- Smoke tests for critical user journeys
- Data consistency validation between systems
- Performance monitoring and alerting
- User acceptance testing with real scenarios

#### Continuous Monitoring
- Real-time health dashboards
- Business metric tracking
- Error rate and latency monitoring
- Automated alerting for anomalies

## Canonical Status

This implementation plan is **authoritative for v1** and serves as the reference for:
- Development team execution and coordination
- Infrastructure provisioning and deployment
- Risk management and rollback procedures
- Success criteria and validation approaches
- Timeline and milestone planning

Any changes to this plan require explicit approval and impact assessment against the canonical domain model and AWS architecture.