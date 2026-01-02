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
export function extractJwtClaims(authorizerContext: ApiGatewayAuthorizerContext): JwtClaims {
  const { claims } = authorizerContext;
  
  if (!claims) {
    throw new Error('No JWT claims found in authorizer context');
  }
  
  // Validate required claims
  if (!claims.sub) {
    throw new Error('Missing required claim: sub');
  }
  
  if (!claims.email) {
    throw new Error('Missing required claim: email');
  }
  
  if (!claims.iat) {
    throw new Error('Missing required claim: iat');
  }
  
  if (!claims.exp) {
    throw new Error('Missing required claim: exp');
  }
  
  // Convert timestamps to numbers (API Gateway formats them as date strings)
  let iat: number;
  let exp: number;
  
  if (typeof claims.iat === 'string') {
    // Check if it's a Unix timestamp string or a formatted date string
    if (/^\d+$/.test(claims.iat)) {
      iat = parseInt(claims.iat, 10);
    } else {
      // Parse formatted date string
      iat = Math.floor(new Date(claims.iat).getTime() / 1000);
    }
  } else {
    iat = Number(claims.iat);
  }
  
  if (typeof claims.exp === 'string') {
    // Check if it's a Unix timestamp string or a formatted date string
    if (/^\d+$/.test(claims.exp)) {
      exp = parseInt(claims.exp, 10);
    } else {
      // Parse formatted date string
      exp = Math.floor(new Date(claims.exp).getTime() / 1000);
    }
  } else {
    exp = Number(claims.exp);
  }
  
  if (isNaN(iat) || isNaN(exp)) {
    throw new Error('Invalid timestamp claims');
  }
  
  // Check if token is expired (additional safety check)
  const now = Math.floor(Date.now() / 1000);
  if (exp < now) {
    throw new Error('JWT token has expired');
  }
  
  return {
    sub: claims.sub,
    email: claims.email,
    iat,
    exp,
    iss: claims.iss || '',
    aud: claims.aud || '',
    'custom:system_role': claims['custom:system_role'],
  };
}

/**
 * Extract user ID from JWT claims
 * 
 * @param claims - JWT claims
 * @returns User ID (Cognito sub)
 */
export function getUserIdFromClaims(claims: JwtClaims): string {
  return claims.sub;
}

/**
 * Extract email from JWT claims
 * 
 * @param claims - JWT claims
 * @returns Email address
 */
export function getEmailFromClaims(claims: JwtClaims): string {
  return claims.email;
}

/**
 * Extract system role from JWT claims
 * 
 * @param claims - JWT claims
 * @returns System role or 'User' as default
 */
export function getSystemRoleFromClaims(claims: JwtClaims): 'User' | 'SiteAdmin' {
  const customRole = claims['custom:system_role'];
  
  // Validate and return system role, default to 'User'
  if (customRole === 'SiteAdmin') {
    return 'SiteAdmin';
  }
  
  return 'User';
}