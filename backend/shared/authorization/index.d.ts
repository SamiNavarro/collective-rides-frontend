/**
 * Authorization Service Foundation - Phase 1.3
 *
 * Main export file for the authorization service foundation.
 * Provides system-level authorization capabilities derived from user systemRole.
 *
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */
export { SystemCapability, AuthorizationContext, AuthorizationResult, AuthorizationRequest, CapabilityCacheEntry, IAuthorizationService, ICapabilityResolver, } from './types';
export { AuthorizationService, authorizationService, } from './authorization-service';
export { CapabilityResolver, } from './capability-resolver';
export { AuthorizationErrorType, AuthorizationError, InsufficientPrivilegesError, CapabilityNotFoundError, AuthorizationServiceError, UserDataUnavailableError, createAuthorizationErrorResponse, isAuthorizationError, } from './authorization-errors';
export { AuthorizationLogEvent, AuthorizationLogEntry, AuthorizationLogger, } from './authorization-logger';
export { AuthorizationMiddleware, requireCapability, requirePlatformManagement, requireClubManagement, Authorize, createAuthorizationContext, hasCapability, authorizeRequest, authorizeIf, validateAuthContext, } from './authorization-middleware';
export { AuthContext } from '../types/auth';
export { SystemRole } from '../types/user';
