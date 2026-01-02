/**
 * Validation Utilities - Phase 1.2
 * 
 * Input validation utilities for API requests.
 * 
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 */

import { UpdateUserInput, SystemRole } from '../types/user';
import { ValidationError } from './errors';

/**
 * Validate email format
 * 
 * @param email - Email address to validate
 * @returns True if valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate display name
 * 
 * @param displayName - Display name to validate
 * @returns True if valid
 */
export function isValidDisplayName(displayName: string): boolean {
  return displayName.length > 0 && displayName.length <= 100;
}

/**
 * Validate avatar URL
 * 
 * @param avatarUrl - Avatar URL to validate
 * @returns True if valid
 */
export function isValidAvatarUrl(avatarUrl: string): boolean {
  try {
    const url = new URL(avatarUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate system role
 * 
 * @param role - System role to validate
 * @returns True if valid
 */
export function isValidSystemRole(role: string): role is SystemRole {
  return role === SystemRole.USER || role === SystemRole.SITE_ADMIN;
}

/**
 * Validate user update input
 * 
 * @param input - Update user input
 * @param allowSystemRoleChange - Whether system role changes are allowed
 * @throws ValidationError if input is invalid
 */
export function validateUpdateUserInput(
  input: UpdateUserInput,
  allowSystemRoleChange: boolean = false
): void {
  // Check if at least one field is provided
  if (!input.displayName && !input.avatarUrl && !input.systemRole) {
    throw new ValidationError('At least one field must be provided for update');
  }
  
  // Validate display name if provided
  if (input.displayName !== undefined) {
    if (typeof input.displayName !== 'string') {
      throw new ValidationError('Display name must be a string');
    }
    
    if (!isValidDisplayName(input.displayName)) {
      throw new ValidationError('Display name must be between 1 and 100 characters');
    }
  }
  
  // Validate avatar URL if provided
  if (input.avatarUrl !== undefined) {
    if (typeof input.avatarUrl !== 'string') {
      throw new ValidationError('Avatar URL must be a string');
    }
    
    if (input.avatarUrl.length > 0 && !isValidAvatarUrl(input.avatarUrl)) {
      throw new ValidationError('Avatar URL must be a valid HTTP(S) URL');
    }
  }
  
  // Validate system role if provided
  if (input.systemRole !== undefined) {
    if (!allowSystemRoleChange) {
      throw new ValidationError('System role changes are not allowed');
    }
    
    if (!isValidSystemRole(input.systemRole)) {
      throw new ValidationError('Invalid system role');
    }
  }
}

/**
 * Validate that required fields are present in an object
 * 
 * @param obj - Object to validate
 * @param requiredFields - Array of required field names
 * @throws ValidationError if any required field is missing
 */
export function validateRequest(obj: any, requiredFields: string[]): void {
  if (!obj || typeof obj !== 'object') {
    throw new ValidationError('Request body must be an object');
  }
  
  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      throw new ValidationError(`Field '${field}' is required`);
    }
  }
}

/**
 * Sanitize string input
 * 
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  return input.trim();
}

/**
 * Parse and validate JSON body
 * 
 * @param body - JSON string body
 * @returns Parsed object
 * @throws ValidationError if JSON is invalid
 */
export function parseValidatedJsonBody<T>(body: string | null): T {
  if (!body) {
    throw new ValidationError('Request body is required');
  }
  
  try {
    return JSON.parse(body) as T;
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body');
  }
}