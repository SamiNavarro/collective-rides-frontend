/**
 * Authorization Service Foundation - Phase 1.3
 * 
 * Main export file for the authorization service foundation.
 * Provides system-level authorization capabilities derived from user systemRole.
 * 
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */

// Core types and interfaces
export {
  SystemCapability,
  AuthorizationContext,
  AuthorizationResult,
  AuthorizationRequest,
  CapabilityCacheEntry,
  IAuthorizationService,
  ICapabilityResolver,
} from './types';

// Authorization service
export {
  AuthorizationService,
  authorizationService,
} from './authorization-service';

// Capability resolver
export {
  CapabilityResolver,
} from './capability-resolver';

// Error handling
export {
  AuthorizationErrorType,
  AuthorizationError,
  InsufficientPrivilegesError,
  CapabilityNotFoundError,
  AuthorizationServiceError,
  UserDataUnavailableError,
  createAuthorizationErrorResponse,
  isAuthorizationError,
} from './authorization-errors';

// Logging
export {
  AuthorizationLogEvent,
  AuthorizationLogEntry,
  AuthorizationLogger,
} from './authorization-logger';

// Middleware and utilities
export {
  AuthorizationMiddleware,
  requireCapability,
  requirePlatformManagement,
  requireClubManagement,
  Authorize,
  createAuthorizationContext,
  hasCapability,
  authorizeRequest,
  authorizeIf,
  validateAuthContext,
} from './authorization-middleware';

// Re-export commonly used types from other modules
export { AuthContext } from '../types/auth';
export { SystemRole } from '../types/user';