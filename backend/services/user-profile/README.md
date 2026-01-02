# User Profile Service - Phase 1.2

## Overview

The User Profile Service is the first production Lambda service for the Sydney Cycling Platform v1 backend. It provides authenticated user context and profile management without requiring any frontend changes.

## Purpose

This service establishes a durable backend source of truth for:
- User profiles
- SystemRole (User | SiteAdmin)
- Authenticated `/users/me` resolution

It serves as the foundation for all authorization, membership, and ride logic in later phases.

## Compliance

This service is fully compliant with:
- **Phase 1.2 Spec:** `.kiro/specs/phase-1.2.user-profile.v1.md`
- **Domain Model:** `.kiro/specs/domain.v1.md`
- **AWS Architecture:** `.kiro/specs/architecture.aws.v1.md`

## Architecture

### Service Structure

```
services/user-profile/
├── handlers/           # Lambda function handlers
├── domain/            # Business logic and entities
├── infrastructure/    # Data access implementations
└── README.md         # This documentation
```

### Components

#### Handlers (`handlers/`)
- **`get-current-user.ts`**: GET /users/me with lazy user creation
- **`get-user-by-id.ts`**: GET /users/{id} (SiteAdmin only)
- **`update-user.ts`**: PUT /users/{id} with authorization

#### Domain Layer (`domain/`)
- **`user.ts`**: User entity with business logic
- **`user-repository.ts`**: Repository interface
- **`user-service.ts`**: Business logic service

#### Infrastructure (`infrastructure/`)
- **`dynamodb-user-repository.ts`**: DynamoDB implementation

## API Endpoints

### GET /users/me
Returns the authenticated user's profile.

**Authorization:** Valid JWT required  
**Behavior:** Creates user profile lazily if not found  
**Response:** User profile object

### GET /users/{id}
Retrieve any user profile.

**Authorization:** SiteAdmin only  
**Response:** User profile object

### PUT /users/{id}
Update a user profile.

**Authorization:** 
- User: may update own profile
- SiteAdmin: may update any profile

**Allowed Fields:**
- `displayName`
- `avatarUrl`
- `systemRole` (SiteAdmin only)

## Domain Model

### User Entity
```typescript
{
  id: string              // Cognito sub
  email: string           // Immutable (from Cognito)
  displayName: string
  avatarUrl?: string
  systemRole: 'User' | 'SiteAdmin'
  createdAt: ISO timestamp
  updatedAt: ISO timestamp
}
```

### Domain Rules
- `systemRole` defaults to `User`
- Only `SiteAdmin` may assign or change `systemRole`
- Users may only modify their own profile
- Email is immutable (Cognito source of truth)

## Data Storage

### DynamoDB Single Table Pattern
```
PK = USER#{userId}
SK = PROFILE
```

**Attributes:**
- `email`, `displayName`, `avatarUrl`
- `systemRole`, `createdAt`, `updatedAt`
- GSI attributes for future queries

**Consistency:** Strongly consistent reads for `/users/me`

## Authentication & Authorization

### JWT Processing
- **API Gateway**: JWT signature validation via Cognito Authorizer
- **Lambda**: Claims extraction and business authorization
- **No cryptographic validation** in Lambda handlers

### Authorization Rules
| Action | Rule |
|--------|------|
| Read own profile | Authenticated user |
| Update own profile | Authenticated user |
| Read any profile | SiteAdmin |
| Assign SiteAdmin | SiteAdmin |

### Enforcement Location
All business authorization logic is enforced inside Lambda handlers, not at API Gateway level.

## Error Handling

| Scenario | HTTP Status | Error Type |
|----------|-------------|------------|
| Missing/invalid JWT | 401 | UNAUTHORIZED |
| Forbidden action | 403 | FORBIDDEN |
| User not found | 404 | NOT_FOUND |
| Invalid payload | 400 | VALIDATION_ERROR |
| Server error | 500 | INTERNAL_ERROR |

## Observability

### CloudWatch Logging
- Structured JSON logs for all operations
- Request ID tracking for correlation
- User ID and action logging
- Error details and stack traces

### Log Fields
- `timestamp`, `level`, `message`
- `requestId`, `userId`, `action`
- `error` details for failures

## Dependencies

### AWS Services
- **DynamoDB**: User profile persistence
- **Cognito**: JWT token validation (via API Gateway)
- **CloudWatch**: Logging and monitoring

### Shared Libraries
- **Types**: User domain and API types
- **Auth**: JWT claims extraction and context creation
- **Utils**: Lambda responses, validation, error handling

## Environment Variables

- `TABLE_NAME`: DynamoDB table name (from Phase 1.1 infrastructure)

## Success Criteria

✅ `/users/me` works with no frontend changes  
✅ User profiles persist across sessions  
✅ SystemRole enforced correctly  
✅ Clean foundation for Phase 2 authorization  

## Future Extensions

The service is designed to support future enhancements:
- Profile preferences and settings
- Public profile visibility controls
- Audit logging for security compliance
- Extended SystemRoles (Support, Moderator)

## Integration

This service integrates with:
- **Phase 1.1 Infrastructure**: Uses existing Cognito, DynamoDB, and API Gateway
- **Future Phase 2**: Provides user context for club and membership authorization
- **Frontend**: Transparent integration via existing auth patterns

## Testing

The service can be tested using:
- Valid JWT tokens from Cognito
- API Gateway test console
- Direct Lambda invocation for unit testing
- Integration tests with DynamoDB Local

## Deployment

The service is deployed as part of the main CDK stack and integrates seamlessly with Phase 1.1 infrastructure components.