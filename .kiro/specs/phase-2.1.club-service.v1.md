# Phase 2.1: Club Service v1

**Version:** 1.0  
**Status:** Draft  
**Phase:** 2.1 - Club Management Domain (Club Service)  
**Dependencies:** Phase 1.1 (Infrastructure), Phase 1.2 (User Profile), Phase 1.3 (Authorization - System Level)

## Purpose

Implement the v1 Club Service aligned to the canonical domain model and AWS-native architecture. This phase establishes the foundation for club management by providing public club discovery endpoints and system-level club administration capabilities.

The service enables:
- Create and manage Club entities (system-level administration only)
- Public club discovery endpoints for listing and viewing clubs
- Efficient data access using DynamoDB single-table with index item pattern
- Authorization enforcement in Lambda functions using Phase 1.3 capabilities

## Alignment with Canonical Documents

### Domain Model Alignment
- **Club Entity:** Core domain entity with proper lifecycle management
- **Club Status:** Supports `active | suspended | archived` lifecycle states
- **Future-Ready:** Prepared for Phase 2.2 (ClubRoles and Membership)
- **Single Source of Truth:** Canonical club data in DynamoDB

### Architecture Alignment
- **Service Layer:** Club business logic and domain services
- **API Gateway:** Continues JWT validation only (no authorization logic)
- **Lambda Functions:** Authorization enforcement using Phase 1.3 capabilities
- **Data Layer:** DynamoDB single-table with efficient access patterns

### Implementation Alignment
- **Phase 1.1:** Infrastructure foundation (leveraged)
- **Phase 1.2:** User Profile Service (leveraged for admin identification)
- **Phase 1.3:** Authorization Service (leveraged for `manage_all_clubs`)
- **Phase 2.1:** Club Service Foundation (this phase)
- **Phase 2.2:** Club membership and roles will extend this foundation

## Scope Definition

### In-Scope (Phase 2.1)

#### Core Club Service
- **Club Entity Management:** Create, read, update club entities
- **Public Discovery:** List and view clubs without authentication
- **System Administration:** Club management for SiteAdmins only
- **Lifecycle Management:** Club status transitions (active/suspended/archived)

#### API Endpoints
- **GET /v1/clubs** - Public club listing with pagination
- **GET /v1/clubs/{id}** - Public club details
- **POST /v1/clubs** - Create club (SiteAdmin only)
- **PUT /v1/clubs/{id}** - Update club (SiteAdmin only)

#### Data Management
- **DynamoDB Single-Table:** Efficient storage with index item pattern
- **No Table Scans:** GSI-based queries for all list operations
- **Transactional Consistency:** TransactWrite for create/update operations
- **Index Maintenance:** Automatic index item synchronization

#### Authorization Integration
- **System-Level Only:** Uses `manage_all_clubs` capability from Phase 1.3
- **Public Endpoints:** No authentication required for discovery
- **Admin Endpoints:** SiteAdmin authorization required

### Out-of-Scope (Phase 2.1)

#### Club-Level Authorization
- **ClubAdmin Roles:** Club-specific administrative roles
- **Member Permissions:** Club membership-based access control
- **Role-Based Access:** Fine-grained club permissions

#### Membership Management
- **Club Membership:** User-club relationship management
- **Membership Status:** Member/Admin/Owner role assignments
- **Membership Lifecycle:** Join/leave/invite workflows

#### Advanced Features
- **Club Search:** Full-text search capabilities
- **Club Categories:** Club type/category classification
- **Club Images:** Advanced media management
- **Club Analytics:** Usage and engagement metrics

#### Frontend Integration
- **UI Components:** No frontend modifications
- **Client Libraries:** No client-side club management tools

## API Specification

### Base Path
All club endpoints use the base path `/v1`

### 1. List Clubs (Public Discovery)

**Endpoint:** `GET /v1/clubs`  
**Authentication:** Optional (public endpoint)  
**Authorization:** None required

#### Query Parameters
- `limit` (optional): Number of clubs to return (default: 20, max: 100)
- `cursor` (optional): Opaque pagination cursor for next page
- `status` (optional): Filter by status (`active` | `suspended` | `archived`, default: `active`)

#### Response 200 (Success)
```json
{
  "success": true,
  "data": [
    {
      "id": "club_123",
      "name": "Attaquer SWARM",
      "status": "active",
      "city": "Sydney",
      "createdAt": "2025-12-19T00:00:00.000Z",
      "updatedAt": "2025-12-19T00:00:00.000Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "nextCursor": "eyJuYW1lIjoiYXR0YXF1ZXIgc3dhcm0iLCJpZCI6ImNsdWJfMTIzIn0="
  },
  "timestamp": "2025-12-19T00:00:00.000Z"
}
```

#### Response 400 (Bad Request)
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid limit parameter",
  "timestamp": "2025-12-19T00:00:00.000Z",
  "requestId": "req-123"
}
```

### 2. Get Club Details (Public Discovery)

**Endpoint:** `GET /v1/clubs/{id}`  
**Authentication:** Optional (public endpoint)  
**Authorization:** None required

#### Path Parameters
- `id` (required): Club identifier

#### Response 200 (Success)
```json
{
  "success": true,
  "data": {
    "id": "club_123",
    "name": "Attaquer SWARM",
    "description": "Sydney group rides for cycling enthusiasts",
    "status": "active",
    "city": "Sydney",
    "logoUrl": "https://sydney-cycles-media.s3.amazonaws.com/clubs/club_123/logo.png",
    "createdAt": "2025-12-19T00:00:00.000Z",
    "updatedAt": "2025-12-19T00:00:00.000Z"
  },
  "timestamp": "2025-12-19T00:00:00.000Z"
}
```

#### Response 404 (Not Found)
```json
{
  "error": "NOT_FOUND",
  "message": "Club not found",
  "timestamp": "2025-12-19T00:00:00.000Z",
  "requestId": "req-123"
}
```

### 3. Create Club (SiteAdmin Only)

**Endpoint:** `POST /v1/clubs`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** `manage_all_clubs` capability required

#### Request Body
```json
{
  "name": "New Cycling Club",
  "description": "A new cycling club for enthusiasts",
  "city": "Sydney",
  "logoUrl": "https://example.com/logo.png"
}
```

#### Request Body Validation
- `name` (required): String, 1-100 characters, unique
- `description` (optional): String, max 500 characters
- `city` (optional): String, max 50 characters
- `logoUrl` (optional): Valid URL string

#### Response 201 (Created)
```json
{
  "success": true,
  "data": {
    "id": "club_abc",
    "name": "New Cycling Club",
    "description": "A new cycling club for enthusiasts",
    "status": "active",
    "city": "Sydney",
    "logoUrl": "https://example.com/logo.png",
    "createdAt": "2025-12-19T00:00:00.000Z",
    "updatedAt": "2025-12-19T00:00:00.000Z"
  },
  "timestamp": "2025-12-19T00:00:00.000Z"
}
```

#### Response 400 (Validation Error)
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Club name is required",
  "timestamp": "2025-12-19T00:00:00.000Z",
  "requestId": "req-123"
}
```

#### Response 403 (Forbidden)
```json
{
  "error": "INSUFFICIENT_PRIVILEGES",
  "message": "Insufficient privileges: manage_all_clubs required",
  "details": {
    "requiredCapability": "manage_all_clubs",
    "userId": "user-123",
    "resource": "club"
  },
  "timestamp": "2025-12-19T00:00:00.000Z",
  "requestId": "req-123"
}
```

#### Response 409 (Conflict)
```json
{
  "error": "CONFLICT",
  "message": "Club name already exists",
  "timestamp": "2025-12-19T00:00:00.000Z",
  "requestId": "req-123"
}
```

### 4. Update Club (SiteAdmin Only)

**Endpoint:** `PUT /v1/clubs/{id}`  
**Authentication:** Required (Cognito JWT)  
**Authorization:** `manage_all_clubs` capability required

#### Path Parameters
- `id` (required): Club identifier

#### Request Body (Partial Update)
```json
{
  "name": "Updated Club Name",
  "description": "Updated description",
  "city": "Melbourne",
  "logoUrl": "https://example.com/new-logo.png",
  "status": "suspended"
}
```

#### Request Body Validation
- `name` (optional): String, 1-100 characters, unique if provided
- `description` (optional): String, max 500 characters
- `city` (optional): String, max 50 characters
- `logoUrl` (optional): Valid URL string
- `status` (optional): Enum (`active` | `suspended` | `archived`)

#### Response 200 (Success)
```json
{
  "success": true,
  "data": {
    "id": "club_123",
    "name": "Updated Club Name",
    "description": "Updated description",
    "status": "suspended",
    "city": "Melbourne",
    "logoUrl": "https://example.com/new-logo.png",
    "createdAt": "2025-12-19T00:00:00.000Z",
    "updatedAt": "2025-12-19T00:00:00.000Z"
  },
  "timestamp": "2025-12-19T00:00:00.000Z"
}
```

#### Response 404 (Not Found)
```json
{
  "error": "NOT_FOUND",
  "message": "Club not found",
  "timestamp": "2025-12-19T00:00:00.000Z",
  "requestId": "req-123"
}
```

## Data Model

### DynamoDB Single-Table Design

The club service uses the existing DynamoDB single-table with an index item pattern to enable efficient queries without table scans.

#### Canonical Club Item (Authoritative Record)

**Primary Key:**
- `PK`: `CLUB#{clubId}`
- `SK`: `METADATA`

**Attributes:**
```typescript
{
  PK: "CLUB#club_123",
  SK: "METADATA",
  entityType: "CLUB",
  id: "club_123",
  name: "Attaquer SWARM",
  nameLower: "attaquer swarm",
  description: "Sydney group rides for cycling enthusiasts",
  city: "Sydney",
  logoUrl: "https://sydney-cycles-media.s3.amazonaws.com/clubs/club_123/logo.png",
  status: "active",
  createdAt: "2025-12-19T00:00:00.000Z",
  updatedAt: "2025-12-19T00:00:00.000Z"
}
```

#### Index Item (For Efficient Listing)

**Purpose:** Enable `GET /v1/clubs` without table scans

**Primary Key:**
- `PK`: `INDEX#CLUB`
- `SK`: `NAME#{nameLower}#ID#{clubId}`

**GSI1 Key:**
- `GSI1PK`: `INDEX#CLUB`
- `GSI1SK`: `NAME#{nameLower}#ID#{clubId}`

**Attributes:**
```typescript
{
  PK: "INDEX#CLUB",
  SK: "NAME#attaquer swarm#ID#club_123",
  GSI1PK: "INDEX#CLUB",
  GSI1SK: "NAME#attaquer swarm#ID#club_123",
  entityType: "CLUB_INDEX",
  clubId: "club_123",
  name: "Attaquer SWARM",
  nameLower: "attaquer swarm",
  status: "active",
  city: "Sydney",
  createdAt: "2025-12-19T00:00:00.000Z",
  updatedAt: "2025-12-19T00:00:00.000Z"
}
```

### Access Patterns

#### 1. Get Club by ID
- **Operation:** `GetItem`
- **Key:** `PK = CLUB#{clubId}, SK = METADATA`
- **Use Case:** `GET /v1/clubs/{id}`

#### 2. List Clubs
- **Operation:** `Query` on GSI1
- **Key:** `GSI1PK = INDEX#CLUB`
- **Filter:** `status = active` (default)
- **Sort:** By `GSI1SK` (name-based sorting)
- **Use Case:** `GET /v1/clubs`

#### 3. List Clubs by Status
- **Operation:** `Query` on GSI1 with filter
- **Key:** `GSI1PK = INDEX#CLUB`
- **Filter:** `status = {requested_status}`
- **Use Case:** `GET /v1/clubs?status=suspended`

### Consistency Rules

#### Create Club Operation
- **Method:** `TransactWrite`
- **Items:** 
  1. Canonical club item (`CLUB#{id}#METADATA`)
  2. Index item (`INDEX#CLUB#NAME#{nameLower}#ID#{id}`)
- **Consistency:** Strong consistency for both items

#### Update Club Operation
- **Name Unchanged:** Update canonical item only
- **Name Changed:** `TransactWrite` with:
  1. Update canonical item
  2. Delete old index item
  3. Create new index item with updated name
- **Consistency:** Strong consistency maintained

#### Delete Club Operation (Future)
- **Method:** `TransactWrite`
- **Items:**
  1. Delete canonical club item
  2. Delete index item
- **Note:** Not implemented in Phase 2.1 (status change to `archived` instead)

## Authorization Rules

### System-Level Authorization (Phase 2.1)

#### Public Endpoints (No Authorization)
- **GET /v1/clubs** - Public club discovery
- **GET /v1/clubs/{id}** - Public club details

#### Admin Endpoints (SiteAdmin Only)
- **POST /v1/clubs** - Requires `manage_all_clubs` capability
- **PUT /v1/clubs/{id}** - Requires `manage_all_clubs` capability

### Authorization Implementation

#### Lambda Handler Pattern
```typescript
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // For admin endpoints only
    if (isAdminEndpoint(event)) {
      const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);
      await requireCapability(SystemCapability.MANAGE_ALL_CLUBS)(authContext);
    }
    
    // Business logic
    const result = await clubService.handleRequest(event);
    return createSuccessResponse(result);
  } catch (error) {
    if (isAuthorizationError(error)) {
      return createAuthorizationErrorResponse(error, requestId);
    }
    return handleLambdaError(error, requestId);
  }
}
```

## Implementation Architecture

### Service Structure

```
backend/services/club-service/
├── domain/
│   ├── club.ts                    # Club entity and business logic
│   ├── club-repository.ts         # Repository interface
│   └── club-service.ts            # Business service layer
├── infrastructure/
│   └── dynamodb-club-repository.ts # DynamoDB implementation
├── handlers/
│   ├── list-clubs.ts              # GET /clubs
│   ├── get-club.ts                # GET /clubs/{id}
│   ├── create-club.ts             # POST /clubs
│   ├── update-club.ts             # PUT /clubs/{id}
│   └── package.json               # Handler dependencies
└── README.md                      # Service documentation
```

### Shared Types

```
backend/shared/types/
├── club.ts                        # Club-related types
└── api.ts                         # API request/response types (updated)
```

### Infrastructure Integration

```
backend/infrastructure/lib/
├── club-service.ts                # CDK construct for club service
└── sydney-cycles-stack.ts         # Updated to include club service
```

### Domain Model

#### Club Entity
```typescript
export interface Club {
  id: string;
  name: string;
  description?: string;
  status: ClubStatus;
  city?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ClubStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
}

export interface CreateClubInput {
  name: string;
  description?: string;
  city?: string;
  logoUrl?: string;
}

export interface UpdateClubInput {
  name?: string;
  description?: string;
  city?: string;
  logoUrl?: string;
  status?: ClubStatus;
}
```

#### Repository Interface
```typescript
export interface IClubRepository {
  getClubById(id: string): Promise<Club | null>;
  listClubs(options: ListClubsOptions): Promise<ListClubsResult>;
  createClub(input: CreateClubInput): Promise<Club>;
  updateClub(id: string, input: UpdateClubInput): Promise<Club>;
  clubExists(id: string): Promise<boolean>;
  isClubNameUnique(name: string, excludeId?: string): Promise<boolean>;
}

export interface ListClubsOptions {
  limit?: number;
  cursor?: string;
  status?: ClubStatus;
}

export interface ListClubsResult {
  clubs: Club[];
  nextCursor?: string;
}
```

## Error Handling

### Error Types

#### Club-Specific Errors
```typescript
export class ClubNotFoundError extends Error {
  statusCode = 404;
  errorType = 'NOT_FOUND';
}

export class ClubNameConflictError extends Error {
  statusCode = 409;
  errorType = 'CONFLICT';
}

export class InvalidClubStatusError extends Error {
  statusCode = 400;
  errorType = 'VALIDATION_ERROR';
}
```

### Error Response Format

All errors follow the standard format established in previous phases:

```json
{
  "error": "ERROR_TYPE",
  "message": "Human-readable error message",
  "details": {
    "field": "specific error details"
  },
  "timestamp": "2025-12-19T00:00:00.000Z",
  "requestId": "req-123"
}
```

### Error Handling Strategy

1. **Validation Errors** - Return 400 with specific field errors
2. **Authorization Errors** - Return 403 with capability requirements
3. **Not Found Errors** - Return 404 for missing clubs
4. **Conflict Errors** - Return 409 for duplicate club names
5. **Internal Errors** - Return 500 with generic message (log details)

## Observability & Logging

### Structured Logging

All club service operations use structured logging with consistent fields:

```typescript
interface ClubLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  requestId: string;
  userId?: string;
  clubId?: string;
  operation: string;
  duration?: number;
  error?: string;
}
```

### Log Examples

#### Club Creation
```json
{
  "timestamp": "2025-12-19T00:00:00.000Z",
  "level": "INFO",
  "message": "Club created successfully",
  "requestId": "req-123",
  "userId": "user-456",
  "clubId": "club-789",
  "operation": "create_club",
  "duration": 150
}
```

#### Club Listing
```json
{
  "timestamp": "2025-12-19T00:00:00.000Z",
  "level": "INFO",
  "message": "Clubs listed",
  "requestId": "req-123",
  "operation": "list_clubs",
  "duration": 25,
  "resultCount": 15
}
```

### Performance Monitoring

#### Key Metrics
- **API Response Times** - Target <200ms p95 for all endpoints
- **DynamoDB Operations** - Monitor read/write capacity and throttling
- **Authorization Checks** - Track authorization decision latency
- **Error Rates** - Monitor 4xx/5xx error rates by endpoint

#### CloudWatch Metrics
- Custom metrics for club operations
- DynamoDB table metrics
- Lambda function metrics
- API Gateway metrics

## Testing Strategy

### Unit Tests

#### Domain Layer Tests
```typescript
describe('Club Entity', () => {
  it('should create club with valid data');
  it('should validate club name requirements');
  it('should handle status transitions');
});

describe('Club Service', () => {
  it('should create club with unique name');
  it('should update club maintaining consistency');
  it('should list clubs with pagination');
});
```

#### Repository Tests
```typescript
describe('DynamoDB Club Repository', () => {
  it('should store and retrieve club correctly');
  it('should maintain index item consistency');
  it('should handle transactional operations');
  it('should support pagination');
});
```

### Integration Tests

#### API Endpoint Tests
```typescript
describe('Club API Endpoints', () => {
  describe('GET /clubs', () => {
    it('should return paginated club list');
    it('should filter by status');
    it('should work without authentication');
  });
  
  describe('POST /clubs', () => {
    it('should create club for SiteAdmin');
    it('should reject for regular user');
    it('should validate required fields');
  });
});
```

### Performance Tests

#### Load Testing Scenarios
- **Public Discovery** - High read volume on GET endpoints
- **Admin Operations** - Concurrent create/update operations
- **Pagination** - Large result set handling

## Success Criteria

### Functional Requirements

1. **✅ Public Club Discovery**
   - `GET /clubs` returns paginated list without authentication
   - `GET /clubs/{id}` returns club details without authentication
   - Proper error handling for not found clubs

2. **✅ Club Administration**
   - `POST /clubs` creates club for SiteAdmin users
   - `PUT /clubs/{id}` updates club for SiteAdmin users
   - Authorization properly enforced using `manage_all_clubs`

3. **✅ Data Consistency**
   - Club and index items remain synchronized
   - TransactWrite ensures atomic operations
   - No orphaned index items

4. **✅ Performance**
   - No table scans for any operation
   - GSI queries for club listing
   - Response times <200ms p95

### Technical Requirements

1. **✅ DynamoDB Design**
   - Single-table design with index item pattern
   - Efficient access patterns for all operations
   - Proper GSI utilization

2. **✅ Authorization Integration**
   - Seamless integration with Phase 1.3 authorization service
   - Proper error responses for authorization failures
   - Public endpoints work without authentication

3. **✅ API Compliance**
   - RESTful API design
   - Consistent response formats
   - Proper HTTP status codes

### Quality Requirements

1. **✅ Error Handling**
   - Comprehensive error scenarios covered
   - Proper error response formats
   - Graceful degradation

2. **✅ Logging & Monitoring**
   - Structured logging for all operations
   - Performance metrics collection
   - Error tracking and alerting

3. **✅ Testing**
   - >90% unit test coverage
   - Integration tests for all endpoints
   - Performance test scenarios

## Migration Strategy

### Phase 2.1 Implementation Steps

1. **Domain Foundation**
   - Create Club entity and types
   - Implement repository interface
   - Build club service layer

2. **Data Layer**
   - Implement DynamoDB repository
   - Create index item management
   - Add transactional operations

3. **API Layer**
   - Implement public endpoints (GET)
   - Add admin endpoints (POST/PUT)
   - Integrate authorization checks

4. **Infrastructure**
   - Create CDK constructs
   - Wire into API Gateway
   - Configure Lambda functions

5. **Testing & Validation**
   - Unit test implementation
   - Integration testing
   - Performance validation

### Deployment Strategy

1. **Infrastructure Deployment**
   - Deploy Lambda functions
   - Update API Gateway routes
   - Verify DynamoDB access

2. **Data Migration**
   - No existing data to migrate
   - Create initial test clubs if needed

3. **Validation**
   - Test public endpoints
   - Test admin endpoints with authorization
   - Verify error handling

## Future Extensibility

### Phase 2.2: Club Membership & Roles

The club service foundation is designed to extend seamlessly:

#### Club-Level Authorization
```typescript
enum ClubCapability {
  MANAGE_CLUB = 'manage_club',
  MANAGE_MEMBERS = 'manage_members',
  CREATE_RIDES = 'create_rides',
  VIEW_CLUB_DETAILS = 'view_club_details',
}
```

#### Membership Management
```typescript
interface ClubMembership {
  clubId: string;
  userId: string;
  role: ClubRole;
  status: MembershipStatus;
  joinedAt: string;
}

enum ClubRole {
  MEMBER = 'member',
  ADMIN = 'admin',
  OWNER = 'owner',
}
```

#### Extended API Endpoints
- `POST /clubs/{id}/members` - Join club
- `GET /clubs/{id}/members` - List members
- `PUT /clubs/{id}/members/{userId}` - Update member role
- `DELETE /clubs/{id}/members/{userId}` - Remove member

### Phase 3.x: Ride Management

Clubs will serve as the foundation for ride organization:

#### Ride-Club Relationship
```typescript
interface Ride {
  id: string;
  clubId: string;
  name: string;
  // ... other ride properties
}
```

#### Club-Specific Ride Endpoints
- `GET /clubs/{id}/rides` - List club rides
- `POST /clubs/{id}/rides` - Create club ride

## Conclusion

Phase 2.1 Club Service v1 provides a solid foundation for club management while maintaining the architectural principles established in previous phases. The service delivers immediate value through public club discovery while establishing the infrastructure needed for future club-centric features.

Key achievements:
1. **Efficient Data Access** - No table scans, GSI-based queries
2. **Public Discovery** - Frictionless club browsing
3. **System Administration** - Proper authorization for club management
4. **Extensible Design** - Ready for club membership and ride management
5. **Performance Optimized** - Fast response times with proper caching
6. **Consistent Architecture** - Follows established patterns and practices

The implementation provides a clean separation between public discovery (no auth) and administrative functions (SiteAdmin only), setting up the perfect foundation for Phase 2.2's club membership and role-based access control features.