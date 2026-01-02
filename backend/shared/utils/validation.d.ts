/**
 * Validation Utilities - Phase 1.2
 *
 * Input validation utilities for API requests.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 */
import { UpdateUserInput, SystemRole } from '../types/user';
/**
 * Validate email format
 *
 * @param email - Email address to validate
 * @returns True if valid
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate display name
 *
 * @param displayName - Display name to validate
 * @returns True if valid
 */
export declare function isValidDisplayName(displayName: string): boolean;
/**
 * Validate avatar URL
 *
 * @param avatarUrl - Avatar URL to validate
 * @returns True if valid
 */
export declare function isValidAvatarUrl(avatarUrl: string): boolean;
/**
 * Validate system role
 *
 * @param role - System role to validate
 * @returns True if valid
 */
export declare function isValidSystemRole(role: string): role is SystemRole;
/**
 * Validate user update input
 *
 * @param input - Update user input
 * @param allowSystemRoleChange - Whether system role changes are allowed
 * @throws ValidationError if input is invalid
 */
export declare function validateUpdateUserInput(input: UpdateUserInput, allowSystemRoleChange?: boolean): void;
/**
 * Validate that required fields are present in an object
 *
 * @param obj - Object to validate
 * @param requiredFields - Array of required field names
 * @throws ValidationError if any required field is missing
 */
export declare function validateRequest(obj: any, requiredFields: string[]): void;
/**
 * Sanitize string input
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export declare function sanitizeString(input: string): string;
/**
 * Parse and validate JSON body
 *
 * @param body - JSON string body
 * @returns Parsed object
 * @throws ValidationError if JSON is invalid
 */
export declare function parseValidatedJsonBody<T>(body: string | null): T;
