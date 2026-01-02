/**
 * JWT Utilities - Phase 1.2
 *
 * Utilities for extracting JWT claims from API Gateway events.
 * Note: JWT signature validation is handled by API Gateway + Cognito Authorizer.
 * This module only extracts claims from the validated context.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 */
import { JwtClaims, ApiGatewayAuthorizerContext } from '../types/auth';
/**
 * Extract JWT claims from API Gateway authorizer context
 *
 * @param authorizerContext - API Gateway authorizer context
 * @returns JWT claims object
 * @throws Error if claims are missing or invalid
 */
export declare function extractJwtClaims(authorizerContext: ApiGatewayAuthorizerContext): JwtClaims;
/**
 * Extract user ID from JWT claims
 *
 * @param claims - JWT claims
 * @returns User ID (Cognito sub)
 */
export declare function getUserIdFromClaims(claims: JwtClaims): string;
/**
 * Extract email from JWT claims
 *
 * @param claims - JWT claims
 * @returns Email address
 */
export declare function getEmailFromClaims(claims: JwtClaims): string;
/**
 * Extract system role from JWT claims
 *
 * @param claims - JWT claims
 * @returns System role or 'User' as default
 */
export declare function getSystemRoleFromClaims(claims: JwtClaims): 'User' | 'SiteAdmin';
