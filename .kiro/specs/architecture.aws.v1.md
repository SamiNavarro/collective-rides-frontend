# AWS-Native Backend Architecture v1

## Overview

This document defines the authoritative AWS-native backend architecture for the Sydney Cycling Platform v1. The architecture supports the canonical domain model with emphasis on simplicity, incremental evolution, and AWS-native operational patterns.

## Core Architecture Principles

### Service Boundaries
- **Domain-aligned services** following v1 canonical model
- **Clear separation** between authentication, authorization, and business logic
- **Incremental evolution** supporting future domain expansion
- **AWS-native patterns** for scalability and operational simplicity

## Authentication & Identity Layer

### AWS Cognito User Pools
**Responsibility:** User identity and authentication
- User registration, login, password management
- JWT token issuance and validation
- MFA and account recovery flows
- Social login integration (future: Strava OAuth)

**Configuration:**
- Issues JWT tokens containing `user_id` and `system_role`
- Custom attributes for basic profile data
- Triggers for user lifecycle events
- Integration with User Profile Service

### User Profile Service (Lambda)
**Responsibility:** User profile and system role management
- User profile CRUD operations
- SystemRole assignment (SiteAdmin vs User)
- User lifecycle coordination with Cognito
- Profile data enrichment and validation

**Scope Clarification:**
- **Cognito:** Sole authentication authority
- **Service:** Profile data and SystemRole management only
- **Clear boundary:** Authentication vs. profile management

## API Layer

### API Gateway + Lambda Architecture
**Responsibility:** Request routing, validation, and orchestration

#### User Management API
- `POST /users` - User registration coordination
- `GET /users/{id}` - User profile retrieval
- `PUT /users/{id}` - Profile updates
- `GET /users/me` - Current user context

#### Club Management API
- `GET /clubs` - Club discovery and listing
- `POST /clubs` - Club creation (SiteAdmin only)
- `GET /clubs/{id}` - Club details
- `PUT /clubs/{id}` - Club updates

#### Membership API
- `POST /clubs/{id}/memberships` - Join club / application
- `GET /clubs/{id}/memberships` - Club member listing
- `PUT /memberships/{id}` - Role assignment, status updates
- `DELETE /memberships/{id}` - Leave club

#### Ride Management API
- `GET /clubs/{id}/rides` - Club ride listing
- `POST /clubs/{id}/rides` - Ride creation
- `GET /rides/{id}` - Ride details
- `POST /rides/{id}/participations` - Join ride
- `PUT /participations/{id}` - Update participation (leadership assignment)

## Authorization Enforcement

### Authorization Service (Lambda Layer)
**Responsibility:** Contextual permission evaluation
- Capability derivation from SystemRole + ClubRole + context
- Membership validation and status checking
- Request-scoped authorization decisions
- No stored permissions - pure computation

**Authorization Patterns:**
```
System Capabilities: derive_from(user.system_role)
Club Capabilities: derive_from(membership.club_role, club_context)
Ride Capabilities: derive_from(membership.club_role, ride.club_id)
```

### API Gateway Authorizers (Limited Scope)
**Responsibility:** Request-level access control
- **JWT validation** and **user context injection** only
- **Complex authorization:** Delegated to Authorization Service within Lambdas
- **Clean separation:** Gateway handles tokens, services handle business authorization

**Scope Limitations:**
- JWT validation via Cognito
- User context injection
- Route-level basic access control
- Complex decisions deferred to Lambda Authorization Service

## Data Storage Strategy

### Amazon DynamoDB (Pragmatic Evolution)
**Responsibility:** Primary application data store

**Strategy:**
- **Initial:** Single table approach acceptable
- **Evolution:** Split by bounded context when access patterns require it
- **Flexibility:** Table-per-context as needed, not premature optimization

#### Single-Table Design Pattern
```
PK: Entity identifier
SK: Sort key for relationships/queries
GSI1: Secondary access patterns
GSI2: Additional query patterns
```

**Entity Storage:**
- **Users:** `PK=USER#{id}`, `SK=PROFILE`
- **Clubs:** `PK=CLUB#{id}`, `SK=METADATA`
- **Memberships:** `PK=CLUB#{id}`, `SK=MEMBER#{user_id}`
- **Rides:** `PK=CLUB#{id}`, `SK=RIDE#{ride_id}`
- **RideParticipations:** `PK=RIDE#{id}`, `SK=PARTICIPANT#{user_id}`

**Access Patterns:**
- User profile lookup
- Club membership queries
- Club ride listings
- User's memberships across clubs
- Ride participation management

### Amazon S3
**Responsibility:** Static asset storage
- User profile images
- Club logos and media
- Ride route files and attachments
- System configuration and templates

## Data Consistency Requirements

### Strong Consistency (Required)
- **Membership creation and updates**
- **Ride participation and leadership assignment**
- All operations affecting authorization context
- Critical business state changes

### Eventual Consistency (Acceptable)
- **Derived data only**
- **Analytical data only**
- Non-critical aggregations and statistics
- Cross-service synchronization for non-authoritative data

## Third-Party Integration Layer

### Integration Service (Lambda)
**Responsibility:** External service coordination
- Strava API integration for ride data sync
- Email service integration (SES)
- Push notification services (SNS)
- Webhook processing and event distribution

### EventBridge
**Responsibility:** Event-driven integration
- Domain event publishing (user_joined_club, ride_created)
- Third-party webhook ingestion
- Async processing coordination
- Future microservice communication

## Service Interaction Patterns

### Request Flow Example: Join Club
1. **API Gateway** validates JWT, routes to Membership API
2. **Authorization Service** validates user can join clubs
3. **Membership Service** creates membership record (strong consistency)
4. **Club Service** updates member count (eventual consistency)
5. **Integration Service** sends welcome email via EventBridge

### Authorization Flow Example: Create Ride
1. **API Gateway** validates JWT, injects user context
2. **Ride Service** calls Authorization Service with club context
3. **Authorization Service** validates `manage_rides` capability
4. **Membership Service** confirms active membership and ClubRole
5. **Ride Service** creates ride (strong consistency)

## Security Architecture

### Security Boundaries
- **VPC isolation** for sensitive operations
- **IAM roles** with least-privilege access
- **Secrets Manager** for third-party API keys
- **WAF** for API Gateway protection

### Authentication Flow
1. **Cognito** handles user authentication
2. **JWT tokens** issued with user_id and system_role
3. **API Gateway** validates JWT signature
4. **User context** injected into Lambda execution
5. **Authorization Service** evaluates permissions contextually

### Authorization Enforcement Points
- **API Gateway:** JWT validation and basic routing
- **Lambda Functions:** Business logic authorization via Authorization Service
- **DynamoDB:** Item-level access patterns based on user context
- **S3:** Bucket policies and signed URLs for asset access

## Operational Considerations

### Monitoring & Observability
- **CloudWatch** for metrics and logging
- **X-Ray** for distributed tracing
- **Custom metrics** for domain-specific KPIs
- **Alarms** for service health and business metrics

### Scalability Patterns
- **Auto-scaling Lambda** for compute elasticity
- **DynamoDB on-demand** for storage elasticity
- **CloudFront** for global content delivery
- **Read replicas** via DynamoDB Global Tables (future)

### Deployment Strategy
- **Infrastructure as Code** (CDK/CloudFormation)
- **Blue-green deployments** for Lambda functions
- **Canary releases** for API Gateway changes
- **Feature flags** for gradual rollout

## Evolution Strategy

### Phase 1: Core Domain
- User management and authentication
- Club and membership management
- Basic ride creation and participation

### Phase 2: Enhanced Features
- Rich ride management and coordination
- Integration with external services
- Advanced authorization patterns

### Phase 3: Scale & Optimize
- Performance optimization
- Advanced analytics and reporting
- Multi-region deployment

## Canonical Status

This architecture is **authoritative for v1** and serves as the reference for:
- Infrastructure provisioning and configuration
- Service implementation and deployment
- Security policy and access control design
- Integration patterns and event flows
- Operational procedures and monitoring

Any architectural changes require explicit approval and impact assessment against the canonical domain model.