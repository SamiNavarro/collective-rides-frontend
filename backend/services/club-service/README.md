# Club Service - Phase 2.1

The Club Service provides club management functionality for the Sydney Cycles platform. This service implements the v1 Club Service as specified in the Phase 2.1 specification.

## Overview

The Club Service enables:
- **Public Club Discovery**: List and view clubs without authentication
- **Club Administration**: Create and update clubs (SiteAdmin only)
- **Efficient Data Access**: DynamoDB single-table with index item pattern
- **Authorization Integration**: Uses Phase 1.3 authorization capabilities

## Architecture

```
backend/services/club-service/
├── domain/
│   ├── club.ts                    # Club entity and business logic
│   ├── club-repository.ts         # Repository interface
│   ├── club-service.ts            # Business service layer
│   └── club-errors.ts             # Club-specific errors
├── infrastructure/
│   └── dynamodb-club-repository.ts # DynamoDB implementation
├── handlers/
│   ├── list-clubs.ts              # GET /clubs
│   ├── get-club.ts                # GET /clubs/{id}
│   ├── create-club.ts             # POST /clubs
│   ├── update-club.ts             # PUT /clubs/{id}
│   └── package.json               # Handler dependencies
└── README.md                      # This file
```

## API Endpoints

### Public Endpoints (No Authentication)

#### GET /v1/clubs
List clubs with pagination and filtering.

**Query Parameters:**
- `limit` (optional): Number of clubs to return (default: 20, max: 100)
- `cursor` (optional): Pagination cursor for next page
- `status` (optional): Filter by status (`active` | `suspended` | `archived`, default: `active`)

**Example:**
```bash
curl https://api.sydneycycles.com/v1/clubs?limit=10&status=active
```

#### GET /v1/clubs/{id}
Get club details by ID.

**Example:**
```bash
curl https://api.sydneycycles.com/v1/clubs/club_123
```

### Admin Endpoints (SiteAdmin Only)

#### POST /v1/clubs
Create a new club. Requires `manage_all_clubs` capability.

**Request Body:**
```json
{
  "name": "New Cycling Club",
  "description": "A new cycling club for enthusiasts",
  "city": "Sydney",
  "logoUrl": "https://example.com/logo.png"
}
```

**Example:**
```bash
curl -X POST https://api.sydneycycles.com/v1/clubs \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Club", "city": "Sydney"}'
```

#### PUT /v1/clubs/{id}
Update an existing club. Requires `manage_all_clubs` capability.

**Request Body (partial update):**
```json
{
  "name": "Updated Club Name",
  "status": "suspended"
}
```

**Example:**
```bash
curl -X PUT https://api.sydneycycles.com/v1/clubs/club_123 \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "suspended"}'
```

## Data Model

### Club Entity
```typescript
interface Club {
  id: string;
  name: string;
  description?: string;
  status: ClubStatus;
  city?: string;
  logoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

enum ClubStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  ARCHIVED = 'archived',
}
```

### DynamoDB Storage

The service uses a single-table design with index items for efficient queries:

#### Canonical Club Item
- **PK**: `CLUB#{clubId}`
- **SK**: `METADATA`
- Contains complete club data

#### Index Item (for listing)
- **PK**: `INDEX#CLUB`
- **SK**: `NAME#{nameLower}#ID#{clubId}`
- **GSI1PK**: `INDEX#CLUB`
- **GSI1SK**: `NAME#{nameLower}#ID#{clubId}`
- Contains essential club data for listing

## Authorization

### System-Level Authorization
- **Public Endpoints**: No authentication required
- **Admin Endpoints**: Requires `manage_all_clubs` capability (SiteAdmin only)

### Authorization Flow
1. JWT validation by API Gateway (admin endpoints only)
2. Enhanced auth context creation in Lambda
3. Capability check using Phase 1.3 authorization service
4. Business logic execution if authorized

## Error Handling

### Standard Error Response
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

### Common Error Types
- `VALIDATION_ERROR` (400): Invalid input data
- `NOT_FOUND` (404): Club not found
- `CONFLICT` (409): Club name already exists
- `INSUFFICIENT_PRIVILEGES` (403): Missing required capability
- `INTERNAL_ERROR` (500): Unexpected server error

## Development

### Local Development
```bash
# Install dependencies
cd backend/services/club-service/handlers
npm install

# Build TypeScript
npm run build

# Run tests
npm test
```

### Deployment
The service is deployed as part of the main CDK stack:

```bash
cd backend/infrastructure
npm run deploy
```

## Testing

### Unit Tests
- Domain entity validation
- Business logic testing
- Repository interface testing

### Integration Tests
- API endpoint testing
- DynamoDB operations
- Authorization integration

### Performance Tests
- Public endpoint load testing
- Pagination performance
- DynamoDB query optimization

## Monitoring

### CloudWatch Metrics
- Lambda function metrics (duration, errors, invocations)
- DynamoDB table metrics (read/write capacity, throttling)
- API Gateway metrics (latency, error rates)

### Structured Logging
All operations use structured logging with consistent fields:
- `requestId`: Unique request identifier
- `userId`: User performing the operation (admin endpoints)
- `clubId`: Club being operated on
- `operation`: Type of operation being performed
- `duration`: Operation duration in milliseconds

### Log Examples
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

## Future Extensions

### Phase 2.2: Club Membership & Roles
The service is designed to extend seamlessly with:
- Club membership management
- Club-level authorization (ClubAdmin, Member roles)
- Member-specific endpoints

### Phase 3.x: Ride Management
Clubs will serve as the foundation for:
- Club-specific ride creation
- Member ride participation
- Club ride management

## Compliance

This service implements:
- **Phase 2.1 Spec**: `.kiro/specs/phase-2.1.club-service.v1.md`
- **Domain Model**: `.kiro/specs/domain.v1.md`
- **AWS Architecture**: `.kiro/specs/architecture.aws.v1.md`
- **Authorization Foundation**: Phase 1.3 authorization capabilities

## Support

For questions or issues with the Club Service:
1. Check the Phase 2.1 specification
2. Review CloudWatch logs for error details
3. Verify authorization configuration
4. Test with proper SiteAdmin credentials for admin endpoints