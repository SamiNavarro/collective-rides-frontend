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
/**
 * Authorization log event types
 */
export declare enum AuthorizationLogEvent {
    AUTHORIZATION_CHECK = "authorization_check",
    AUTHORIZATION_GRANTED = "authorization_granted",
    AUTHORIZATION_DENIED = "authorization_denied",
    CAPABILITY_DERIVED = "capability_derived",
    AUTHORIZATION_ERROR = "authorization_error"
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
    duration?: number;
    error?: string;
}
/**
 * Authorization logger class
 */
export declare class AuthorizationLogger {
    /**
     * Log authorization check initiation
     */
    static logAuthorizationCheck(userId: string, systemRole: SystemRole, capability: SystemCapability, resource?: string, requestId?: string): void;
    /**
     * Log successful authorization
     */
    static logAuthorizationGranted(userId: string, systemRole: SystemRole, capability: SystemCapability, resource?: string, requestId?: string, duration?: number): void;
    /**
     * Log denied authorization
     */
    static logAuthorizationDenied(userId: string, systemRole: SystemRole, capability: SystemCapability, reason: string, resource?: string, requestId?: string, duration?: number): void;
    /**
     * Log capability derivation
     */
    static logCapabilityDerived(userId: string, systemRole: SystemRole, capabilities: SystemCapability[], duration?: number): void;
    /**
     * Log authorization error
     */
    static logAuthorizationError(userId: string, systemRole: SystemRole, error: Error, capability?: SystemCapability, resource?: string, requestId?: string, duration?: number): void;
    /**
     * Log performance metrics
     */
    static logPerformanceMetrics(operation: string, duration: number, userId?: string, capability?: SystemCapability): void;
    /**
     * Log cache hit/miss for debugging
     */
    static logCacheEvent(event: 'hit' | 'miss' | 'set' | 'evict', userId: string, systemRole: SystemRole, capabilities?: SystemCapability[]): void;
}
