# Phase 1.3: Authorization Service Foundation (System-Level Only)

**Version:** 1.0  
**Status:** Draft  
**Phase:** 1.3 - Authorization Foundation  
**Dependencies:** Phase 1.2 (User Profile Service)

## Purpose

This specification defines the Authorization Service Foundation for the Sydney Cycling Platform, establishing system-level authorization capabilities that build upon the authentication foundation from Phase 1.2. The service provides derived authorization decisions based on user system roles without storing permission data, creating a clean separation between authentication (who you are) and authorization (what you can do).

## Alignment with Canonical Documents

### Domain Model Alignment
- **Extends:** User entity with system-level capabilities
- **Leverages:** SystemRole enumeration (User, SiteAdmin)
- **Maintains:** Single source of truth for user roles in User Profile Service
- **Prepares:** Foundation for future Club/Membership/Ride authorization

### Architecture Alignment
- **Service Layer:** Authorization logic in shared libraries
- **API Gateway:** Continues JWT validation only (no authorization logic)
- **Lambda Functions:** Consume authorization service via shared library
- **Data Layer:** No new storage - derives from existing User data

### Implementation Alignment
- **Phase 1.1:** Infrastructure foundation (complete)
- **Phase 1.2:** User Profile Service with enhanced auth context (complete)
- **Phase 1.3:** Authorization Service Foundation (this phase)
- **Future Phases:** Club/Membership/Ride authorization will extend this foundation

## Scope Definition

### In-Scope (Phase 1.3)

#### Core Authorization Service
- **Capability Derivation:** Compute system-level capabilities from user systemRole
- **Authorization Context:** Enhanced context with capability information
- **Shared Library:** Reusable authorization logic for Lambda functions
- **Error Handling:** Comprehensive error scenarios and logging

#### System-Level Capabilities (v1)
- **`manage_platform`:** Full platform administration (SiteAdmin only)
- **`manage_all_clubs`:** Cross-club management capabilities (SiteAdmin only)

#### Integration Points
- **User Profile Service:** Consume user role information
- **Lambda Functions:** Authorization checks via shared library
- **Logging:** Structured authorization decision logging

#### Testing & Validation
- **Unit Tests:** Capability derivation logic
- **Integration Tests:** Service consumption patterns
- **Performance Tests:** Authorization check latency

### Out-of-Scope (Phase 1.3)

#### Future Authorization Features
- **Club-Level Authorization:** Club-specific permissions and roles
- **Membership Authorization:** Member/Admin/Owner role-based access
- **Ride Authorization:** Ride participation and management permissions
- **Resource-Level Permissions:** Fine-grained object-level access control

#### Data Storage
- **Permission Entities:** No stored permission records
- **Role Assignments:** No additional role storage beyond systemRole
- **Audit Logs:** No authorization audit trail (future phase)

#### API Endpoints
- **Authorization API:** No REST endpoints for authorization management
- **Permission Management:** No CRUD operations for permissions

#### Frontend Integration
- **UI Changes:** No frontend modifications
- **Client-Side Authorization:** No browser-based authorization logic

## Capability Model (v1)

### System Capabilities

```typescript
enum SystemCapability {
  // Platform Administration
  MANAGE_PLATFORM = 'manage_platform',
  
  // Cross-Club Management
  MANAGE_ALL_CLUBS = 'manage_all_clubs',
}
```

### Capability Derivation Rules

#### SiteAdmin Users
- **`manage_platform`:** Full platform administration
  - User management across all accounts
  - System configuration and settings
  - Platform-wide analytics and reporting
  
- **`manage_all_clubs`:** Cross-club management
  - Create, modify, delete any club
  - Manage memberships across all clubs
  - Override club-specific settings

#### Regular Users
- **No System Capabilities:** Regular users have no system-level capabilities
- **Future:** Club-specific capabilities will be added in later phases

### Capability Matrix

| SystemRole | manage_platform | manage_all_clubs |
|------------|----------------|------------------|
| User       | ❌             | ❌               |
| SiteAdmin  | ✅             | ✅               |

## Interface Design

### Option A: Shared Library (Preferred)

#### Authorization Service Interface

```typescript
interface AuthorizationContext extends AuthContext {
  capabilities: SystemCapability[];
  hasCapability: (capability: SystemCapability) => boolean;
  canPerform: (action: string, resource?: string) => boolean;
}

interface IAuthorizationService {
  /**
   * Create authorization context with derived capabilities
   */
  createAuthorizationContext(
    authContext: AuthContext
  ): Promise<AuthorizationContext>;
  
  /**
   * Check if user has specific system capability
   */
  hasSystemCapability(
    authContext: AuthContext,
    capability: SystemCapability
  ): Promise<boolean>;
  
  /**
   * Validate authorization for specific action
   */
  authorize(
    authContext: AuthContext,
    requiredCapability: SystemCapability,
    resource?: string
  ): Promise<AuthorizationResult>;
}
```

#### Authorization Result

```typescript
interface AuthorizationResult {
  granted: boolean;
  capability: SystemCapability;
  reason?: string;
  context: {
    userId: string;
    systemRole: SystemRole;
    timestamp: string;
  };
}
```

### Option B: REST Endpoint (Optional)

If shared library approach proves insufficient, provide optional REST endpoint:

```typescript
// POST /authz/evaluate
interface AuthorizationRequest {
  userId: string;
  capability: SystemCapability;
  resource?: {
    type: string;
    id: string;
  };
}

interface AuthorizationResponse {
  granted: boolean;
  capability: SystemCapability;
  expiresAt: string;
  context: AuthorizationContext;
}
```

## Service Consumption Patterns

### Pattern 1: Lambda Handler Authorization

```typescript
// Lambda handler example
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    // Create enhanced auth context (from Phase 1.2)
    const authContext = await createEnhancedAuthContext(event.requestContext, userRepository);
    
    // Create authorization context
    const authzContext = await authorizationService.createAuthorizationContext(authContext);
    
    // Check required capability
    if (!authzContext.hasCapability(SystemCapability.MANAGE_PLATFORM)) {
      return createErrorResponse(403, 'FORBIDDEN', 'Platform management privileges required');
    }
    
    // Proceed with business logic
    const result = await businessLogic.execute();
    return createSuccessResponse(result);
    
  } catch (error) {
    return handleLambdaError(error);
  }
}
```

### Pattern 2: Service Layer Authorization

```typescript
// Service class example
export class PlatformAdminService {
  constructor(
    private authorizationService: IAuthorizationService,
    private userRepository: IUserRepository
  ) {}
  
  async deleteUser(userId: string, authContext: AuthContext): Promise<void> {
    // Authorize action
    const authzResult = await this.authorizationService.authorize(
      authContext,
      SystemCapability.MANAGE_PLATFORM,
      `user:${userId}`
    );
    
    if (!authzResult.granted) {
      throw new AuthorizationError('Insufficient privileges for user deletion');
    }
    
    // Log authorization decision
    logStructured('INFO', 'Authorization granted', {
      userId: authContext.userId,
      action: 'delete_user',
      targetUserId: userId,
      capability: SystemCapability.MANAGE_PLATFORM,
    });
    
    // Execute business logic
    await this.userRepository.deleteUser(userId);
  }
}
```

### Pattern 3: Middleware Authorization

```typescript
// Authorization middleware
export function requireCapability(capability: SystemCapability) {
  return async (authContext: AuthContext): Promise<void> => {
    const authzContext = await authorizationService.createAuthorizationContext(authContext);
    
    if (!authzContext.hasCapability(capability)) {
      throw new AuthorizationError(`Required capability: ${capability}`);
    }
  };
}

// Usage in service
export class ClubManagementService {
  @requireCapability(SystemCapability.MANAGE_ALL_CLUBS)
  async createClub(clubData: CreateClubInput, authContext: AuthContext): Promise<Club> {
    // Business logic - authorization already validated
    return await this.clubRepository.createClub(clubData);
  }
}
```

## Error Handling Requirements

### Authorization Errors

```typescript
enum AuthorizationErrorType {
  INSUFFICIENT_PRIVILEGES = 'INSUFFICIENT_PRIVILEGES',
  CAPABILITY_NOT_FOUND = 'CAPABILITY_NOT_FOUND',
  AUTHORIZATION_SERVICE_ERROR = 'AUTHORIZATION_SERVICE_ERROR',
  USER_DATA_UNAVAILABLE = 'USER_DATA_UNAVAILABLE',
}

interface AuthorizationError extends Error {
  errorType: AuthorizationErrorType;
  capability?: SystemCapability;
  userId?: string;
  resource?: string;
  statusCode: number;
}
```

### Error Response Format

```json
{
  "error": "INSUFFICIENT_PRIVILEGES",
  "message": "Platform management privileges required",
  "details": {
    "requiredCapability": "manage_platform",
    "userCapabilities": [],
    "resource": "user:123"
  },
  "timestamp": "2025-12-18T20:00:00.000Z",
  "requestId": "req-123"
}
```

### Fallback Behavior

1. **User Data Unavailable:** Deny access, log error
2. **Service Unavailable:** Deny access, alert monitoring
3. **Invalid Capability:** Deny access, log warning
4. **Network Timeout:** Deny access, retry once

## Logging Requirements

### Authorization Decision Logging

```typescript
interface AuthorizationLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  event: 'authorization_check' | 'authorization_granted' | 'authorization_denied';
  userId: string;
  systemRole: SystemRole;
  capability: SystemCapability;
  resource?: string;
  granted: boolean;
  reason?: string;
  requestId: string;
  duration: number; // milliseconds
}
```

### Log Examples

```json
{
  "timestamp": "2025-12-18T20:00:00.000Z",
  "level": "INFO",
  "event": "authorization_granted",
  "userId": "user-123",
  "systemRole": "SiteAdmin",
  "capability": "manage_platform",
  "resource": "user:456",
  "granted": true,
  "requestId": "req-789",
  "duration": 15
}
```

### Performance Monitoring

- **Authorization Check Latency:** Target <50ms p95
- **Cache Hit Rate:** Monitor capability derivation efficiency
- **Error Rate:** Track authorization service availability
- **User Role Distribution:** Monitor system role usage patterns

## Implementation Architecture

### Shared Library Structure

```
backend/shared/authorization/
├── authorization-service.ts      # Main service implementation
├── capability-resolver.ts        # Capability derivation logic
├── authorization-context.ts      # Enhanced context types
├── authorization-errors.ts       # Error definitions
├── authorization-logger.ts       # Structured logging
└── __tests__/
    ├── authorization-service.test.ts
    ├── capability-resolver.test.ts
    └── integration.test.ts
```

### Service Dependencies

```typescript
// Authorization service dependencies
interface AuthorizationServiceDependencies {
  userRepository: IUserRepository;  // From Phase 1.2
  logger: IStructuredLogger;        // From shared utilities
  metricsCollector: IMetricsCollector; // Performance monitoring
}
```

### Caching Strategy

```typescript
interface CapabilityCacheEntry {
  userId: string;
  systemRole: SystemRole;
  capabilities: SystemCapability[];
  expiresAt: Date;
}

// Cache TTL: 5 minutes (balance between performance and consistency)
const CAPABILITY_CACHE_TTL = 5 * 60 * 1000;
```

## Success Criteria

### Functional Requirements

1. **✅ Capability Derivation**
   - SiteAdmin users receive `manage_platform` and `manage_all_clubs` capabilities
   - Regular users receive no system capabilities
   - Capability derivation completes in <50ms p95

2. **✅ Authorization Checks**
   - `hasCapability()` returns correct boolean results
   - `authorize()` provides detailed authorization results
   - Authorization context includes all required information

3. **✅ Error Handling**
   - Graceful handling of user data unavailability
   - Proper error responses with appropriate HTTP status codes
   - Comprehensive error logging for debugging

4. **✅ Integration**
   - Seamless integration with existing Lambda handlers
   - Compatible with Phase 1.2 enhanced auth context
   - No breaking changes to existing APIs

### Performance Requirements

1. **✅ Latency**
   - Authorization checks complete in <50ms p95
   - Capability derivation cached for 5 minutes
   - No significant impact on existing API response times

2. **✅ Scalability**
   - Handles concurrent authorization checks
   - Efficient memory usage in Lambda functions
   - Minimal cold start impact

### Quality Requirements

1. **✅ Reliability**
   - 99.9% authorization service availability
   - Fail-safe: deny access when service unavailable
   - Comprehensive error recovery

2. **✅ Maintainability**
   - Clear separation of concerns
   - Comprehensive unit test coverage (>90%)
   - Well-documented interfaces and patterns

## Test Cases

### Unit Tests

#### Test Case 1: SiteAdmin Capability Derivation
```typescript
describe('CapabilityResolver', () => {
  it('should grant all system capabilities to SiteAdmin', async () => {
    const authContext = createMockAuthContext({ systemRole: SystemRole.SITE_ADMIN });
    const capabilities = await capabilityResolver.deriveCapabilities(authContext);
    
    expect(capabilities).toContain(SystemCapability.MANAGE_PLATFORM);
    expect(capabilities).toContain(SystemCapability.MANAGE_ALL_CLUBS);
  });
});
```

#### Test Case 2: Regular User Capability Derivation
```typescript
it('should grant no system capabilities to regular users', async () => {
  const authContext = createMockAuthContext({ systemRole: SystemRole.USER });
  const capabilities = await capabilityResolver.deriveCapabilities(authContext);
  
  expect(capabilities).toHaveLength(0);
});
```

#### Test Case 3: Authorization Check Success
```typescript
it('should authorize SiteAdmin for platform management', async () => {
  const authContext = createMockAuthContext({ systemRole: SystemRole.SITE_ADMIN });
  const result = await authorizationService.authorize(
    authContext,
    SystemCapability.MANAGE_PLATFORM
  );
  
  expect(result.granted).toBe(true);
  expect(result.capability).toBe(SystemCapability.MANAGE_PLATFORM);
});
```

#### Test Case 4: Authorization Check Failure
```typescript
it('should deny regular user platform management', async () => {
  const authContext = createMockAuthContext({ systemRole: SystemRole.USER });
  const result = await authorizationService.authorize(
    authContext,
    SystemCapability.MANAGE_PLATFORM
  );
  
  expect(result.granted).toBe(false);
  expect(result.reason).toContain('Insufficient privileges');
});
```

### Integration Tests

#### Test Case 5: Lambda Handler Integration
```typescript
it('should integrate with Lambda handler authorization', async () => {
  const event = createMockAPIGatewayEvent();
  const response = await handler(event);
  
  // Should succeed for SiteAdmin
  expect(response.statusCode).toBe(200);
  
  // Should fail for regular user
  const userEvent = createMockAPIGatewayEvent({ systemRole: SystemRole.USER });
  const userResponse = await handler(userEvent);
  expect(userResponse.statusCode).toBe(403);
});
```

#### Test Case 6: Service Layer Integration
```typescript
it('should integrate with service layer authorization', async () => {
  const authContext = createMockAuthContext({ systemRole: SystemRole.SITE_ADMIN });
  
  await expect(
    platformAdminService.deleteUser('user-123', authContext)
  ).resolves.not.toThrow();
  
  const userAuthContext = createMockAuthContext({ systemRole: SystemRole.USER });
  
  await expect(
    platformAdminService.deleteUser('user-123', userAuthContext)
  ).rejects.toThrow(AuthorizationError);
});
```

### Performance Tests

#### Test Case 7: Authorization Latency
```typescript
it('should complete authorization checks within latency requirements', async () => {
  const authContext = createMockAuthContext({ systemRole: SystemRole.SITE_ADMIN });
  
  const startTime = Date.now();
  await authorizationService.authorize(authContext, SystemCapability.MANAGE_PLATFORM);
  const duration = Date.now() - startTime;
  
  expect(duration).toBeLessThan(50); // 50ms requirement
});
```

#### Test Case 8: Concurrent Authorization
```typescript
it('should handle concurrent authorization checks', async () => {
  const authContext = createMockAuthContext({ systemRole: SystemRole.SITE_ADMIN });
  
  const promises = Array(100).fill(null).map(() =>
    authorizationService.authorize(authContext, SystemCapability.MANAGE_PLATFORM)
  );
  
  const results = await Promise.all(promises);
  expect(results.every(r => r.granted)).toBe(true);
});
```

## Migration Strategy

### Phase 1.3 Implementation Steps

1. **Create Shared Library Structure**
   - Authorization service interfaces
   - Capability resolver implementation
   - Error handling and logging

2. **Implement Core Authorization Logic**
   - Capability derivation from systemRole
   - Authorization context creation
   - Authorization decision logic

3. **Add Integration Points**
   - Lambda handler patterns
   - Service layer integration
   - Error handling middleware

4. **Testing & Validation**
   - Unit test coverage
   - Integration testing
   - Performance validation

5. **Documentation & Examples**
   - Usage patterns documentation
   - Code examples for common scenarios
   - Migration guide for existing services

### Backward Compatibility

- **No Breaking Changes:** Existing APIs continue to work
- **Gradual Adoption:** Services can adopt authorization incrementally
- **Fallback Support:** Graceful degradation when authorization service unavailable

## Future Extensibility

### Phase 2.x: Club-Level Authorization
```typescript
enum ClubCapability {
  MANAGE_CLUB = 'manage_club',
  MANAGE_MEMBERS = 'manage_members',
  CREATE_RIDES = 'create_rides',
}
```

### Phase 3.x: Ride-Level Authorization
```typescript
enum RideCapability {
  MANAGE_RIDE = 'manage_ride',
  PARTICIPATE_IN_RIDE = 'participate_in_ride',
  VIEW_RIDE_DETAILS = 'view_ride_details',
}
```

### Resource-Specific Authorization
```typescript
interface ResourceAuthorizationRequest {
  capability: Capability;
  resource: {
    type: 'club' | 'ride' | 'membership';
    id: string;
    context?: Record<string, any>;
  };
}
```

This foundation provides a clean, extensible architecture for authorization that will scale with the platform's growing complexity while maintaining performance and reliability.