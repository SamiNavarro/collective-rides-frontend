# Phase 1.2 Spec — User Profile Service v1

## Status
**Canonical • Approved for implementation**

## Purpose

Introduce the first production Lambda service that backs authenticated user context without requiring any frontend changes.

This phase establishes a durable backend source of truth for:
- User profiles
- SystemRole (User | SiteAdmin)
- Authenticated `/users/me` resolution

It is the foundation for all authorization, membership, and ride logic in later phases.

## Alignment

This spec is fully aligned with:
- `.kiro/specs/domain.v1.md`
- `.kiro/specs/architecture.aws.v1.md`
- `.kiro/specs/implementation.v1.md`

No concepts are introduced beyond canonical v1 scope.

## In Scope

- Lambda-based User Profile Service
- DynamoDB-backed user profile persistence
- SystemRole enforcement (User | SiteAdmin)
- Self-service profile access and updates
- Cognito JWT-derived identity integration

## Explicitly Out of Scope

- Authentication flows (handled by Cognito)
- Club, Membership, or Ride logic
- Permission entities or stored permissions
- UI validation or form rules
- Audit logging

## Domain Model (v1)

### User
```typescript
User {
  id: string              // Cognito sub
  email: string
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

## API Contract

### GET /users/me

Returns the authenticated user's profile.

**Authorization:** Valid JWT required

**Behavior:**
- If profile does not exist, it is created lazily
- Cognito `sub` is used as `id`

**Response:**
```json
200 OK
{
  "id": "abc123",
  "email": "user@email.com",
  "displayName": "Alex",
  "avatarUrl": "https://...",
  "systemRole": "User"
}
```

### GET /users/{id}

Retrieve any user profile.

**Authorization:** SiteAdmin only

### PUT /users/{id}

Update a user profile.

**Authorization:**
- User: may update own profile
- SiteAdmin: may update any profile

**Allowed Fields:**
- `displayName`
- `avatarUrl`

**Restricted Fields:**
- `id`
- `email`
- `systemRole` (SiteAdmin only)

## Authorization Rules

| Action | Rule |
|--------|------|
| Read own profile | Authenticated user |
| Update own profile | Authenticated user |
| Read any profile | SiteAdmin |
| Assign SiteAdmin | SiteAdmin |

### Enforcement Location

- Inside Lambda handlers
- No API Gateway business authorization

## Data Storage

### DynamoDB (Single Table v1)

```
PK = USER#{userId}
SK = PROFILE
```

**Attributes:**
- `email`
- `displayName`
- `avatarUrl`
- `systemRole`
- `createdAt`
- `updatedAt`

### Consistency

Strongly consistent reads for `/users/me`

## Cognito Integration

- Cognito is the sole authentication authority
- JWT claims used:
  - `sub` → `userId`
  - `email`

## User Creation Strategy

- User profile created on first `/users/me` request
- No pre-provisioning required

## Error Handling

| Scenario | HTTP |
|----------|------|
| Missing / invalid JWT | 401 |
| Forbidden action | 403 |
| User not found | 404 |
| Invalid update payload | 400 |

## Observability

- CloudWatch logs per Lambda
- Structured logs include:
  - `userId`
  - `requestId`
  - `action`

## Success Criteria

- `/users/me` works with no frontend changes
- User profile persists across sessions
- SystemRole enforced correctly
- Clean boundary for Phase 2 authorization

## Non-Blocking Future Extensions

- Profile preferences
- Public profile visibility
- Audit logging
- Extended SystemRoles

## Canonical Declaration

This document is **authoritative for Phase 1.2**.

Implementation must not:
- Introduce new domain concepts
- Leak business logic into API Gateway
- Modify existing frontend code

Once implemented, Phase 1 (Foundation + User Profile) is considered complete and unblocks Phase 2: Club Management.