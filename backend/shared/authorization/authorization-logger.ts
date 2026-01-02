/**
 * Authorization Logger - Phase 1.3
 * 
 * Structured logging for authorization decisions and events.
 * Provides audit trail and debugging information.
 * 
 * Compliance:
 * - Phase 1.3 Spec: .kiro/specs/phase-1.3.authorization.foundation.v1.md
 */

import { SystemRole } from '../types/user';
import { SystemCapability } from './types';
import { logStructured } from '../utils/lambda-utils';

/**
 * Authorization log event types
 */
export enum AuthorizationLogEvent {
  AUTHORIZATION_CHECK = 'authorization_check',
  AUTHORIZATION_GRANTED = 'authorization_granted',
  AUTHORIZATION_DENIED = 'authorization_denied',
  CAPABILITY_DERIVED = 'capability_derived',
  AUTHORIZATION_ERROR = 'authorization_error',
}

/**
 * Authorization log entry structure
 */
export interface AuthorizationLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  event: AuthorizationLogEvent;
  userId: string;
  systemRole: SystemRole;
  capability?: SystemCapability;
  resource?: string;
  granted?: boolean;
  reason?: string;
  requestId?: string;
  duration?: number; // milliseconds
  error?: string;
}

/**
 * Authorization logger class
 */
export class AuthorizationLogger {
  /**
   * Log authorization check initiation
   */
  static logAuthorizationCheck(
    userId: string,
    systemRole: SystemRole,
    capability: SystemCapability,
    resource?: string,
    requestId?: string
  ): void {
    logStructured('INFO', 'Authorization check initiated', {
      event: AuthorizationLogEvent.AUTHORIZATION_CHECK,
      userId,
      systemRole,
      capability,
      resource,
      requestId,
      timestamp: new Date().toISOString(),
    });
  }
  
  /**
   * Log successful authorization
   */
  static logAuthorizationGranted(
    userId: string,
    systemRole: SystemRole,
    capability: SystemCapability,
    resource?: string,
    requestId?: string,
    duration?: number
  ): void {
    logStructured('INFO', 'Authorization granted', {
      event: AuthorizationLogEvent.AUTHORIZATION_GRANTED,
      userId,
      systemRole,
      capability,
      resource,
      granted: true,
      requestId,
      duration,
      timestamp: new Date().toISOString(),
    });
  }
  
  /**
   * Log denied authorization
   */
  static logAuthorizationDenied(
    userId: string,
    systemRole: SystemRole,
    capability: SystemCapability,
    reason: string,
    resource?: string,
    requestId?: string,
    duration?: number
  ): void {
    logStructured('WARN', 'Authorization denied', {
      event: AuthorizationLogEvent.AUTHORIZATION_DENIED,
      userId,
      systemRole,
      capability,
      resource,
      granted: false,
      reason,
      requestId,
      duration,
      timestamp: new Date().toISOString(),
    });
  }
  
  /**
   * Log capability derivation
   */
  static logCapabilityDerived(
    userId: string,
    systemRole: SystemRole,
    capabilities: SystemCapability[],
    duration?: number
  ): void {
    logStructured('INFO', 'Capabilities derived', {
      event: AuthorizationLogEvent.CAPABILITY_DERIVED,
      userId,
      systemRole,
      capabilities,
      duration,
      timestamp: new Date().toISOString(),
    });
  }
  
  /**
   * Log authorization error
   */
  static logAuthorizationError(
    userId: string,
    systemRole: SystemRole,
    error: Error,
    capability?: SystemCapability,
    resource?: string,
    requestId?: string,
    duration?: number
  ): void {
    logStructured('ERROR', 'Authorization error', {
      event: AuthorizationLogEvent.AUTHORIZATION_ERROR,
      userId,
      systemRole,
      capability,
      resource,
      error: error.message,
      requestId,
      duration,
      timestamp: new Date().toISOString(),
    });
  }
  
  /**
   * Log performance metrics
   */
  static logPerformanceMetrics(
    operation: string,
    duration: number,
    userId?: string,
    capability?: SystemCapability
  ): void {
    logStructured('INFO', 'Authorization performance metrics', {
      operation,
      duration,
      userId,
      capability,
      timestamp: new Date().toISOString(),
    });
  }
  
  /**
   * Log cache hit/miss for debugging
   */
  static logCacheEvent(
    event: 'hit' | 'miss' | 'set' | 'evict',
    userId: string,
    systemRole: SystemRole,
    capabilities?: SystemCapability[]
  ): void {
    logStructured('INFO', `Authorization cache ${event}`, {
      event: `cache_${event}`,
      userId,
      systemRole,
      capabilities,
      timestamp: new Date().toISOString(),
    });
  }
}