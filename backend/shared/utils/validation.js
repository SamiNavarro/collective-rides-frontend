"use strict";
/**
 * Validation Utilities - Phase 1.2
 *
 * Input validation utilities for API requests.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseValidatedJsonBody = exports.sanitizeString = exports.validateRequest = exports.validateUpdateUserInput = exports.isValidSystemRole = exports.isValidAvatarUrl = exports.isValidDisplayName = exports.isValidEmail = void 0;
const user_1 = require("../types/user");
const errors_1 = require("./errors");
/**
 * Validate email format
 *
 * @param email - Email address to validate
 * @returns True if valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
exports.isValidEmail = isValidEmail;
/**
 * Validate display name
 *
 * @param displayName - Display name to validate
 * @returns True if valid
 */
function isValidDisplayName(displayName) {
    return displayName.length > 0 && displayName.length <= 100;
}
exports.isValidDisplayName = isValidDisplayName;
/**
 * Validate avatar URL
 *
 * @param avatarUrl - Avatar URL to validate
 * @returns True if valid
 */
function isValidAvatarUrl(avatarUrl) {
    try {
        const url = new URL(avatarUrl);
        return url.protocol === 'http:' || url.protocol === 'https:';
    }
    catch {
        return false;
    }
}
exports.isValidAvatarUrl = isValidAvatarUrl;
/**
 * Validate system role
 *
 * @param role - System role to validate
 * @returns True if valid
 */
function isValidSystemRole(role) {
    return role === user_1.SystemRole.USER || role === user_1.SystemRole.SITE_ADMIN;
}
exports.isValidSystemRole = isValidSystemRole;
/**
 * Validate user update input
 *
 * @param input - Update user input
 * @param allowSystemRoleChange - Whether system role changes are allowed
 * @throws ValidationError if input is invalid
 */
function validateUpdateUserInput(input, allowSystemRoleChange = false) {
    // Check if at least one field is provided
    if (!input.displayName && !input.avatarUrl && !input.systemRole) {
        throw new errors_1.ValidationError('At least one field must be provided for update');
    }
    // Validate display name if provided
    if (input.displayName !== undefined) {
        if (typeof input.displayName !== 'string') {
            throw new errors_1.ValidationError('Display name must be a string');
        }
        if (!isValidDisplayName(input.displayName)) {
            throw new errors_1.ValidationError('Display name must be between 1 and 100 characters');
        }
    }
    // Validate avatar URL if provided
    if (input.avatarUrl !== undefined) {
        if (typeof input.avatarUrl !== 'string') {
            throw new errors_1.ValidationError('Avatar URL must be a string');
        }
        if (input.avatarUrl.length > 0 && !isValidAvatarUrl(input.avatarUrl)) {
            throw new errors_1.ValidationError('Avatar URL must be a valid HTTP(S) URL');
        }
    }
    // Validate system role if provided
    if (input.systemRole !== undefined) {
        if (!allowSystemRoleChange) {
            throw new errors_1.ValidationError('System role changes are not allowed');
        }
        if (!isValidSystemRole(input.systemRole)) {
            throw new errors_1.ValidationError('Invalid system role');
        }
    }
}
exports.validateUpdateUserInput = validateUpdateUserInput;
/**
 * Validate that required fields are present in an object
 *
 * @param obj - Object to validate
 * @param requiredFields - Array of required field names
 * @throws ValidationError if any required field is missing
 */
function validateRequest(obj, requiredFields) {
    if (!obj || typeof obj !== 'object') {
        throw new errors_1.ValidationError('Request body must be an object');
    }
    for (const field of requiredFields) {
        if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
            throw new errors_1.ValidationError(`Field '${field}' is required`);
        }
    }
}
exports.validateRequest = validateRequest;
/**
 * Sanitize string input
 *
 * @param input - String to sanitize
 * @returns Sanitized string
 */
function sanitizeString(input) {
    return input.trim();
}
exports.sanitizeString = sanitizeString;
/**
 * Parse and validate JSON body
 *
 * @param body - JSON string body
 * @returns Parsed object
 * @throws ValidationError if JSON is invalid
 */
function parseValidatedJsonBody(body) {
    if (!body) {
        throw new errors_1.ValidationError('Request body is required');
    }
    try {
        return JSON.parse(body);
    }
    catch (error) {
        throw new errors_1.ValidationError('Invalid JSON in request body');
    }
}
exports.parseValidatedJsonBody = parseValidatedJsonBody;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmFsaWRhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInZhbGlkYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7O0dBT0c7OztBQUVILHdDQUE0RDtBQUM1RCxxQ0FBMkM7QUFFM0M7Ozs7O0dBS0c7QUFDSCxTQUFnQixZQUFZLENBQUMsS0FBYTtJQUN4QyxNQUFNLFVBQVUsR0FBRyw0QkFBNEIsQ0FBQztJQUNoRCxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEMsQ0FBQztBQUhELG9DQUdDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixrQkFBa0IsQ0FBQyxXQUFtQjtJQUNwRCxPQUFPLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLFdBQVcsQ0FBQyxNQUFNLElBQUksR0FBRyxDQUFDO0FBQzdELENBQUM7QUFGRCxnREFFQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsZ0JBQWdCLENBQUMsU0FBaUI7SUFDaEQsSUFBSTtRQUNGLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQy9CLE9BQU8sR0FBRyxDQUFDLFFBQVEsS0FBSyxPQUFPLElBQUksR0FBRyxDQUFDLFFBQVEsS0FBSyxRQUFRLENBQUM7S0FDOUQ7SUFBQyxNQUFNO1FBQ04sT0FBTyxLQUFLLENBQUM7S0FDZDtBQUNILENBQUM7QUFQRCw0Q0FPQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsSUFBWTtJQUM1QyxPQUFPLElBQUksS0FBSyxpQkFBVSxDQUFDLElBQUksSUFBSSxJQUFJLEtBQUssaUJBQVUsQ0FBQyxVQUFVLENBQUM7QUFDcEUsQ0FBQztBQUZELDhDQUVDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsdUJBQXVCLENBQ3JDLEtBQXNCLEVBQ3RCLHdCQUFpQyxLQUFLO0lBRXRDLDBDQUEwQztJQUMxQyxJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFO1FBQy9ELE1BQU0sSUFBSSx3QkFBZSxDQUFDLGdEQUFnRCxDQUFDLENBQUM7S0FDN0U7SUFFRCxvQ0FBb0M7SUFDcEMsSUFBSSxLQUFLLENBQUMsV0FBVyxLQUFLLFNBQVMsRUFBRTtRQUNuQyxJQUFJLE9BQU8sS0FBSyxDQUFDLFdBQVcsS0FBSyxRQUFRLEVBQUU7WUFDekMsTUFBTSxJQUFJLHdCQUFlLENBQUMsK0JBQStCLENBQUMsQ0FBQztTQUM1RDtRQUVELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUU7WUFDMUMsTUFBTSxJQUFJLHdCQUFlLENBQUMsbURBQW1ELENBQUMsQ0FBQztTQUNoRjtLQUNGO0lBRUQsa0NBQWtDO0lBQ2xDLElBQUksS0FBSyxDQUFDLFNBQVMsS0FBSyxTQUFTLEVBQUU7UUFDakMsSUFBSSxPQUFPLEtBQUssQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUFFO1lBQ3ZDLE1BQU0sSUFBSSx3QkFBZSxDQUFDLDZCQUE2QixDQUFDLENBQUM7U0FDMUQ7UUFFRCxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRTtZQUNwRSxNQUFNLElBQUksd0JBQWUsQ0FBQyx3Q0FBd0MsQ0FBQyxDQUFDO1NBQ3JFO0tBQ0Y7SUFFRCxtQ0FBbUM7SUFDbkMsSUFBSSxLQUFLLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRTtRQUNsQyxJQUFJLENBQUMscUJBQXFCLEVBQUU7WUFDMUIsTUFBTSxJQUFJLHdCQUFlLENBQUMscUNBQXFDLENBQUMsQ0FBQztTQUNsRTtRQUVELElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDeEMsTUFBTSxJQUFJLHdCQUFlLENBQUMscUJBQXFCLENBQUMsQ0FBQztTQUNsRDtLQUNGO0FBQ0gsQ0FBQztBQXpDRCwwREF5Q0M7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQixlQUFlLENBQUMsR0FBUSxFQUFFLGNBQXdCO0lBQ2hFLElBQUksQ0FBQyxHQUFHLElBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO1FBQ25DLE1BQU0sSUFBSSx3QkFBZSxDQUFDLGdDQUFnQyxDQUFDLENBQUM7S0FDN0Q7SUFFRCxLQUFLLE1BQU0sS0FBSyxJQUFJLGNBQWMsRUFBRTtRQUNsQyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxTQUFTLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBQ3hFLE1BQU0sSUFBSSx3QkFBZSxDQUFDLFVBQVUsS0FBSyxlQUFlLENBQUMsQ0FBQztTQUMzRDtLQUNGO0FBQ0gsQ0FBQztBQVZELDBDQVVDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixjQUFjLENBQUMsS0FBYTtJQUMxQyxPQUFPLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUN0QixDQUFDO0FBRkQsd0NBRUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQixzQkFBc0IsQ0FBSSxJQUFtQjtJQUMzRCxJQUFJLENBQUMsSUFBSSxFQUFFO1FBQ1QsTUFBTSxJQUFJLHdCQUFlLENBQUMsMEJBQTBCLENBQUMsQ0FBQztLQUN2RDtJQUVELElBQUk7UUFDRixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFNLENBQUM7S0FDOUI7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLE1BQU0sSUFBSSx3QkFBZSxDQUFDLDhCQUE4QixDQUFDLENBQUM7S0FDM0Q7QUFDSCxDQUFDO0FBVkQsd0RBVUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFZhbGlkYXRpb24gVXRpbGl0aWVzIC0gUGhhc2UgMS4yXG4gKiBcbiAqIElucHV0IHZhbGlkYXRpb24gdXRpbGl0aWVzIGZvciBBUEkgcmVxdWVzdHMuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDEuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0xLjIudXNlci1wcm9maWxlLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgVXBkYXRlVXNlcklucHV0LCBTeXN0ZW1Sb2xlIH0gZnJvbSAnLi4vdHlwZXMvdXNlcic7XG5pbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuL2Vycm9ycyc7XG5cbi8qKlxuICogVmFsaWRhdGUgZW1haWwgZm9ybWF0XG4gKiBcbiAqIEBwYXJhbSBlbWFpbCAtIEVtYWlsIGFkZHJlc3MgdG8gdmFsaWRhdGVcbiAqIEByZXR1cm5zIFRydWUgaWYgdmFsaWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWRFbWFpbChlbWFpbDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGVtYWlsUmVnZXggPSAvXlteXFxzQF0rQFteXFxzQF0rXFwuW15cXHNAXSskLztcbiAgcmV0dXJuIGVtYWlsUmVnZXgudGVzdChlbWFpbCk7XG59XG5cbi8qKlxuICogVmFsaWRhdGUgZGlzcGxheSBuYW1lXG4gKiBcbiAqIEBwYXJhbSBkaXNwbGF5TmFtZSAtIERpc3BsYXkgbmFtZSB0byB2YWxpZGF0ZVxuICogQHJldHVybnMgVHJ1ZSBpZiB2YWxpZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZERpc3BsYXlOYW1lKGRpc3BsYXlOYW1lOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIGRpc3BsYXlOYW1lLmxlbmd0aCA+IDAgJiYgZGlzcGxheU5hbWUubGVuZ3RoIDw9IDEwMDtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhdmF0YXIgVVJMXG4gKiBcbiAqIEBwYXJhbSBhdmF0YXJVcmwgLSBBdmF0YXIgVVJMIHRvIHZhbGlkYXRlXG4gKiBAcmV0dXJucyBUcnVlIGlmIHZhbGlkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1ZhbGlkQXZhdGFyVXJsKGF2YXRhclVybDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHRyeSB7XG4gICAgY29uc3QgdXJsID0gbmV3IFVSTChhdmF0YXJVcmwpO1xuICAgIHJldHVybiB1cmwucHJvdG9jb2wgPT09ICdodHRwOicgfHwgdXJsLnByb3RvY29sID09PSAnaHR0cHM6JztcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGUgc3lzdGVtIHJvbGVcbiAqIFxuICogQHBhcmFtIHJvbGUgLSBTeXN0ZW0gcm9sZSB0byB2YWxpZGF0ZVxuICogQHJldHVybnMgVHJ1ZSBpZiB2YWxpZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZFN5c3RlbVJvbGUocm9sZTogc3RyaW5nKTogcm9sZSBpcyBTeXN0ZW1Sb2xlIHtcbiAgcmV0dXJuIHJvbGUgPT09IFN5c3RlbVJvbGUuVVNFUiB8fCByb2xlID09PSBTeXN0ZW1Sb2xlLlNJVEVfQURNSU47XG59XG5cbi8qKlxuICogVmFsaWRhdGUgdXNlciB1cGRhdGUgaW5wdXRcbiAqIFxuICogQHBhcmFtIGlucHV0IC0gVXBkYXRlIHVzZXIgaW5wdXRcbiAqIEBwYXJhbSBhbGxvd1N5c3RlbVJvbGVDaGFuZ2UgLSBXaGV0aGVyIHN5c3RlbSByb2xlIGNoYW5nZXMgYXJlIGFsbG93ZWRcbiAqIEB0aHJvd3MgVmFsaWRhdGlvbkVycm9yIGlmIGlucHV0IGlzIGludmFsaWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlVXBkYXRlVXNlcklucHV0KFxuICBpbnB1dDogVXBkYXRlVXNlcklucHV0LFxuICBhbGxvd1N5c3RlbVJvbGVDaGFuZ2U6IGJvb2xlYW4gPSBmYWxzZVxuKTogdm9pZCB7XG4gIC8vIENoZWNrIGlmIGF0IGxlYXN0IG9uZSBmaWVsZCBpcyBwcm92aWRlZFxuICBpZiAoIWlucHV0LmRpc3BsYXlOYW1lICYmICFpbnB1dC5hdmF0YXJVcmwgJiYgIWlucHV0LnN5c3RlbVJvbGUpIHtcbiAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdBdCBsZWFzdCBvbmUgZmllbGQgbXVzdCBiZSBwcm92aWRlZCBmb3IgdXBkYXRlJyk7XG4gIH1cbiAgXG4gIC8vIFZhbGlkYXRlIGRpc3BsYXkgbmFtZSBpZiBwcm92aWRlZFxuICBpZiAoaW5wdXQuZGlzcGxheU5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2YgaW5wdXQuZGlzcGxheU5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdEaXNwbGF5IG5hbWUgbXVzdCBiZSBhIHN0cmluZycpO1xuICAgIH1cbiAgICBcbiAgICBpZiAoIWlzVmFsaWREaXNwbGF5TmFtZShpbnB1dC5kaXNwbGF5TmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0Rpc3BsYXkgbmFtZSBtdXN0IGJlIGJldHdlZW4gMSBhbmQgMTAwIGNoYXJhY3RlcnMnKTtcbiAgICB9XG4gIH1cbiAgXG4gIC8vIFZhbGlkYXRlIGF2YXRhciBVUkwgaWYgcHJvdmlkZWRcbiAgaWYgKGlucHV0LmF2YXRhclVybCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKHR5cGVvZiBpbnB1dC5hdmF0YXJVcmwgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdBdmF0YXIgVVJMIG11c3QgYmUgYSBzdHJpbmcnKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKGlucHV0LmF2YXRhclVybC5sZW5ndGggPiAwICYmICFpc1ZhbGlkQXZhdGFyVXJsKGlucHV0LmF2YXRhclVybCkpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0F2YXRhciBVUkwgbXVzdCBiZSBhIHZhbGlkIEhUVFAoUykgVVJMJyk7XG4gICAgfVxuICB9XG4gIFxuICAvLyBWYWxpZGF0ZSBzeXN0ZW0gcm9sZSBpZiBwcm92aWRlZFxuICBpZiAoaW5wdXQuc3lzdGVtUm9sZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgaWYgKCFhbGxvd1N5c3RlbVJvbGVDaGFuZ2UpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1N5c3RlbSByb2xlIGNoYW5nZXMgYXJlIG5vdCBhbGxvd2VkJyk7XG4gICAgfVxuICAgIFxuICAgIGlmICghaXNWYWxpZFN5c3RlbVJvbGUoaW5wdXQuc3lzdGVtUm9sZSkpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0ludmFsaWQgc3lzdGVtIHJvbGUnKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSB0aGF0IHJlcXVpcmVkIGZpZWxkcyBhcmUgcHJlc2VudCBpbiBhbiBvYmplY3RcbiAqIFxuICogQHBhcmFtIG9iaiAtIE9iamVjdCB0byB2YWxpZGF0ZVxuICogQHBhcmFtIHJlcXVpcmVkRmllbGRzIC0gQXJyYXkgb2YgcmVxdWlyZWQgZmllbGQgbmFtZXNcbiAqIEB0aHJvd3MgVmFsaWRhdGlvbkVycm9yIGlmIGFueSByZXF1aXJlZCBmaWVsZCBpcyBtaXNzaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZVJlcXVlc3Qob2JqOiBhbnksIHJlcXVpcmVkRmllbGRzOiBzdHJpbmdbXSk6IHZvaWQge1xuICBpZiAoIW9iaiB8fCB0eXBlb2Ygb2JqICE9PSAnb2JqZWN0Jykge1xuICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1JlcXVlc3QgYm9keSBtdXN0IGJlIGFuIG9iamVjdCcpO1xuICB9XG4gIFxuICBmb3IgKGNvbnN0IGZpZWxkIG9mIHJlcXVpcmVkRmllbGRzKSB7XG4gICAgaWYgKG9ialtmaWVsZF0gPT09IHVuZGVmaW5lZCB8fCBvYmpbZmllbGRdID09PSBudWxsIHx8IG9ialtmaWVsZF0gPT09ICcnKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKGBGaWVsZCAnJHtmaWVsZH0nIGlzIHJlcXVpcmVkYCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2FuaXRpemUgc3RyaW5nIGlucHV0XG4gKiBcbiAqIEBwYXJhbSBpbnB1dCAtIFN0cmluZyB0byBzYW5pdGl6ZVxuICogQHJldHVybnMgU2FuaXRpemVkIHN0cmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gc2FuaXRpemVTdHJpbmcoaW5wdXQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBpbnB1dC50cmltKCk7XG59XG5cbi8qKlxuICogUGFyc2UgYW5kIHZhbGlkYXRlIEpTT04gYm9keVxuICogXG4gKiBAcGFyYW0gYm9keSAtIEpTT04gc3RyaW5nIGJvZHlcbiAqIEByZXR1cm5zIFBhcnNlZCBvYmplY3RcbiAqIEB0aHJvd3MgVmFsaWRhdGlvbkVycm9yIGlmIEpTT04gaXMgaW52YWxpZFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VWYWxpZGF0ZWRKc29uQm9keTxUPihib2R5OiBzdHJpbmcgfCBudWxsKTogVCB7XG4gIGlmICghYm9keSkge1xuICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1JlcXVlc3QgYm9keSBpcyByZXF1aXJlZCcpO1xuICB9XG4gIFxuICB0cnkge1xuICAgIHJldHVybiBKU09OLnBhcnNlKGJvZHkpIGFzIFQ7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignSW52YWxpZCBKU09OIGluIHJlcXVlc3QgYm9keScpO1xuICB9XG59Il19