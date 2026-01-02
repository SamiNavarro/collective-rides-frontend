"use strict";
/**
 * Authentication Context - Phase 1.2
 *
 * Utilities for creating and managing user authentication context
 * from API Gateway events.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - AWS Architecture: .kiro/specs/architecture.aws.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAuthContext = exports.canModifySystemRole = exports.canModifyUser = exports.canAccessUser = exports.requireSiteAdmin = exports.requireAuthentication = exports.createEnhancedAuthContext = exports.createAuthContext = exports.getAuthContext = void 0;
const user_1 = require("../types/user");
const jwt_utils_1 = require("./jwt-utils");
/**
 * Get authentication context from API Gateway event
 *
 * @param event - API Gateway proxy event
 * @returns Authentication context
 */
async function getAuthContext(event) {
    return createAuthContext(event.requestContext);
}
exports.getAuthContext = getAuthContext;
/**
 * Create authentication context from Lambda event request context
 *
 * @param requestContext - Lambda request context from API Gateway
 * @returns Authentication context
 * @throws Error if authentication context cannot be created
 */
function createAuthContext(requestContext) {
    // Check if authorizer context exists (user is authenticated)
    if (!requestContext.authorizer) {
        return {
            userId: '',
            email: '',
            systemRole: user_1.SystemRole.USER,
            isAuthenticated: false,
            isSiteAdmin: false,
        };
    }
    try {
        // Extract JWT claims from API Gateway authorizer context
        const claims = (0, jwt_utils_1.extractJwtClaims)(requestContext.authorizer);
        // Extract user information
        const userId = (0, jwt_utils_1.getUserIdFromClaims)(claims);
        const email = (0, jwt_utils_1.getEmailFromClaims)(claims);
        // Note: systemRole is determined from database, not JWT claims
        // This allows for real-time role changes without re-authentication
        const systemRole = user_1.SystemRole.USER; // Default, will be updated by service layer
        return {
            userId,
            email,
            systemRole,
            isAuthenticated: true,
            isSiteAdmin: false, // Will be updated by service layer
        };
    }
    catch (error) {
        throw new Error(`Failed to create auth context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
exports.createAuthContext = createAuthContext;
/**
 * Create enhanced authentication context with database-sourced role information
 *
 * @param requestContext - Lambda request context from API Gateway
 * @param userRepository - User repository for fetching current role
 * @returns Enhanced authentication context with current systemRole
 */
async function createEnhancedAuthContext(requestContext, userRepository) {
    const baseContext = createAuthContext(requestContext);
    if (!baseContext.isAuthenticated) {
        return baseContext;
    }
    try {
        // Fetch current user data from database to get accurate systemRole
        const userData = await userRepository.getUserById(baseContext.userId);
        if (userData) {
            return {
                ...baseContext,
                systemRole: userData.systemRole,
                isSiteAdmin: userData.systemRole === user_1.SystemRole.SITE_ADMIN,
            };
        }
        return baseContext;
    }
    catch (error) {
        // If database lookup fails, return base context with default role
        return baseContext;
    }
}
exports.createEnhancedAuthContext = createEnhancedAuthContext;
/**
 * Validate that user is authenticated
 *
 * @param authContext - Authentication context
 * @throws Error if user is not authenticated
 */
function requireAuthentication(authContext) {
    if (!authContext.isAuthenticated) {
        throw new Error('Authentication required');
    }
}
exports.requireAuthentication = requireAuthentication;
/**
 * Validate that user is a site administrator
 *
 * @param authContext - Authentication context
 * @throws Error if user is not a site administrator
 */
function requireSiteAdmin(authContext) {
    requireAuthentication(authContext);
    if (!authContext.isSiteAdmin) {
        throw new Error('Site administrator privileges required');
    }
}
exports.requireSiteAdmin = requireSiteAdmin;
/**
 * Check if user can access another user's profile
 *
 * @param authContext - Authentication context
 * @param targetUserId - ID of the user being accessed
 * @returns True if access is allowed
 */
function canAccessUser(authContext, targetUserId) {
    if (!authContext.isAuthenticated) {
        return false;
    }
    // Users can access their own profile
    if (authContext.userId === targetUserId) {
        return true;
    }
    // Site admins can access any profile
    if (authContext.isSiteAdmin) {
        return true;
    }
    return false;
}
exports.canAccessUser = canAccessUser;
/**
 * Check if user can modify another user's profile
 *
 * @param authContext - Authentication context
 * @param targetUserId - ID of the user being modified
 * @returns True if modification is allowed
 */
function canModifyUser(authContext, targetUserId) {
    return canAccessUser(authContext, targetUserId);
}
exports.canModifyUser = canModifyUser;
/**
 * Check if user can modify system role
 *
 * @param authContext - Authentication context
 * @returns True if system role modification is allowed
 */
function canModifySystemRole(authContext) {
    return authContext.isSiteAdmin;
}
exports.canModifySystemRole = canModifySystemRole;
/**
 * Validate authentication context from API Gateway event
 *
 * @param event - API Gateway proxy event
 * @returns Authentication context
 * @throws Error if user is not authenticated
 */
function validateAuthContext(event) {
    const authContext = createAuthContext(event.requestContext);
    if (!authContext.isAuthenticated) {
        throw new Error('Authentication required');
    }
    return authContext;
}
exports.validateAuthContext = validateAuthContext;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXV0aC1jb250ZXh0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXV0aC1jb250ZXh0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7OztBQUlILHdDQUEyQztBQUMzQywyQ0FBaUg7QUFFakg7Ozs7O0dBS0c7QUFDSSxLQUFLLFVBQVUsY0FBYyxDQUFDLEtBQTJCO0lBQzlELE9BQU8saUJBQWlCLENBQUMsS0FBSyxDQUFDLGNBQXNDLENBQUMsQ0FBQztBQUN6RSxDQUFDO0FBRkQsd0NBRUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxjQUFvQztJQUNwRSw2REFBNkQ7SUFDN0QsSUFBSSxDQUFDLGNBQWMsQ0FBQyxVQUFVLEVBQUU7UUFDOUIsT0FBTztZQUNMLE1BQU0sRUFBRSxFQUFFO1lBQ1YsS0FBSyxFQUFFLEVBQUU7WUFDVCxVQUFVLEVBQUUsaUJBQVUsQ0FBQyxJQUFJO1lBQzNCLGVBQWUsRUFBRSxLQUFLO1lBQ3RCLFdBQVcsRUFBRSxLQUFLO1NBQ25CLENBQUM7S0FDSDtJQUVELElBQUk7UUFDRix5REFBeUQ7UUFDekQsTUFBTSxNQUFNLEdBQUcsSUFBQSw0QkFBZ0IsRUFBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFM0QsMkJBQTJCO1FBQzNCLE1BQU0sTUFBTSxHQUFHLElBQUEsK0JBQW1CLEVBQUMsTUFBTSxDQUFDLENBQUM7UUFDM0MsTUFBTSxLQUFLLEdBQUcsSUFBQSw4QkFBa0IsRUFBQyxNQUFNLENBQUMsQ0FBQztRQUV6QywrREFBK0Q7UUFDL0QsbUVBQW1FO1FBQ25FLE1BQU0sVUFBVSxHQUFHLGlCQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsNENBQTRDO1FBRWhGLE9BQU87WUFDTCxNQUFNO1lBQ04sS0FBSztZQUNMLFVBQVU7WUFDVixlQUFlLEVBQUUsSUFBSTtZQUNyQixXQUFXLEVBQUUsS0FBSyxFQUFFLG1DQUFtQztTQUN4RCxDQUFDO0tBQ0g7SUFB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dGlvbiBDb250ZXh0IC0gUGhhc2UgMS4yXG4gKiBcbiAqIFV0aWxpdGllcyBmb3IgY3JlYXRpbmcgYW5kIG1hbmFnaW5nIHVzZXIgYXV0aGVudGljYXRpb24gY29udGV4dFxuICogZnJvbSBBUEkgR2F0ZXdheSBldmVudHMuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDEuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0xLjIudXNlci1wcm9maWxlLnYxLm1kXG4gKiAtIEFXUyBBcmNoaXRlY3R1cmU6IC5raXJvL3NwZWNzL2FyY2hpdGVjdHVyZS5hd3MudjEubWRcbiAqL1xuXG5pbXBvcnQgeyBBUElHYXRld2F5UHJveHlFdmVudCB9IGZyb20gJ2F3cy1sYW1iZGEnO1xuaW1wb3J0IHsgQXV0aENvbnRleHQsIExhbWJkYVJlcXVlc3RDb250ZXh0IH0gZnJvbSAnLi4vdHlwZXMvYXV0aCc7XG5pbXBvcnQgeyBTeXN0ZW1Sb2xlIH0gZnJvbSAnLi4vdHlwZXMvdXNlcic7XG5pbXBvcnQgeyBleHRyYWN0Snd0Q2xhaW1zLCBnZXRVc2VySWRGcm9tQ2xhaW1zLCBnZXRFbWFpbEZyb21DbGFpbXMsIGdldFN5c3RlbVJvbGVGcm9tQ2xhaW1zIH0gZnJvbSAnLi9qd3QtdXRpbHMnO1xuXG4vKipcbiAqIEdldCBhdXRoZW50aWNhdGlvbiBjb250ZXh0IGZyb20gQVBJIEdhdGV3YXkgZXZlbnRcbiAqIFxuICogQHBhcmFtIGV2ZW50IC0gQVBJIEdhdGV3YXkgcHJveHkgZXZlbnRcbiAqIEByZXR1cm5zIEF1dGhlbnRpY2F0aW9uIGNvbnRleHRcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEF1dGhDb250ZXh0KGV2ZW50OiBBUElHYXRld2F5UHJveHlFdmVudCk6IFByb21pc2U8QXV0aENvbnRleHQ+IHtcbiAgcmV0dXJuIGNyZWF0ZUF1dGhDb250ZXh0KGV2ZW50LnJlcXVlc3RDb250ZXh0IGFzIExhbWJkYVJlcXVlc3RDb250ZXh0KTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYXV0aGVudGljYXRpb24gY29udGV4dCBmcm9tIExhbWJkYSBldmVudCByZXF1ZXN0IGNvbnRleHRcbiAqIFxuICogQHBhcmFtIHJlcXVlc3RDb250ZXh0IC0gTGFtYmRhIHJlcXVlc3QgY29udGV4dCBmcm9tIEFQSSBHYXRld2F5XG4gKiBAcmV0dXJucyBBdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gKiBAdGhyb3dzIEVycm9yIGlmIGF1dGhlbnRpY2F0aW9uIGNvbnRleHQgY2Fubm90IGJlIGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUF1dGhDb250ZXh0KHJlcXVlc3RDb250ZXh0OiBMYW1iZGFSZXF1ZXN0Q29udGV4dCk6IEF1dGhDb250ZXh0IHtcbiAgLy8gQ2hlY2sgaWYgYXV0aG9yaXplciBjb250ZXh0IGV4aXN0cyAodXNlciBpcyBhdXRoZW50aWNhdGVkKVxuICBpZiAoIXJlcXVlc3RDb250ZXh0LmF1dGhvcml6ZXIpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdXNlcklkOiAnJyxcbiAgICAgIGVtYWlsOiAnJyxcbiAgICAgIHN5c3RlbVJvbGU6IFN5c3RlbVJvbGUuVVNFUixcbiAgICAgIGlzQXV0aGVudGljYXRlZDogZmFsc2UsXG4gICAgICBpc1NpdGVBZG1pbjogZmFsc2UsXG4gICAgfTtcbiAgfVxuICBcbiAgdHJ5IHtcbiAgICAvLyBFeHRyYWN0IEpXVCBjbGFpbXMgZnJvbSBBUEkgR2F0ZXdheSBhdXRob3JpemVyIGNvbnRleHRcbiAgICBjb25zdCBjbGFpbXMgPSBleHRyYWN0Snd0Q2xhaW1zKHJlcXVlc3RDb250ZXh0LmF1dGhvcml6ZXIpO1xuICAgIFxuICAgIC8vIEV4dHJhY3QgdXNlciBpbmZvcm1hdGlvblxuICAgIGNvbnN0IHVzZXJJZCA9IGdldFVzZXJJZEZyb21DbGFpbXMoY2xhaW1zKTtcbiAgICBjb25zdCBlbWFpbCA9IGdldEVtYWlsRnJvbUNsYWltcyhjbGFpbXMpO1xuICAgIFxuICAgIC8vIE5vdGU6IHN5c3RlbVJvbGUgaXMgZGV0ZXJtaW5lZCBmcm9tIGRhdGFiYXNlLCBub3QgSldUIGNsYWltc1xuICAgIC8vIFRoaXMgYWxsb3dzIGZvciByZWFsLXRpbWUgcm9sZSBjaGFuZ2VzIHdpdGhvdXQgcmUtYXV0aGVudGljYXRpb25cbiAgICBjb25zdCBzeXN0ZW1Sb2xlID0gU3lzdGVtUm9sZS5VU0VSOyAvLyBEZWZhdWx0LCB3aWxsIGJlIHVwZGF0ZWQgYnkgc2VydmljZSBsYXllclxuICAgIFxuICAgIHJldHVybiB7XG4gICAgICB1c2VySWQsXG4gICAgICBlbWFpbCxcbiAgICAgIHN5c3RlbVJvbGUsXG4gICAgICBpc0F1dGhlbnRpY2F0ZWQ6IHRydWUsXG4gICAgICBpc1NpdGVBZG1pbjogZmFsc2UsIC8vIFdpbGwgYmUgdXBkYXRlZCBieSBzZXJ2aWNlIGxheWVyXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byBjcmVhdGUgYXV0aCBjb250ZXh0OiAke2Vycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogJ1Vua25vd24gZXJyb3InfWApO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlIGVuaGFuY2VkIGF1dGhlbnRpY2F0aW9uIGNvbnRleHQgd2l0aCBkYXRhYmFzZS1zb3VyY2VkIHJvbGUgaW5mb3JtYXRpb25cbiAqIFxuICogQHBhcmFtIHJlcXVlc3RDb250ZXh0IC0gTGFtYmRhIHJlcXVlc3QgY29udGV4dCBmcm9tIEFQSSBHYXRld2F5XG4gKiBAcGFyYW0gdXNlclJlcG9zaXRvcnkgLSBVc2VyIHJlcG9zaXRvcnkgZm9yIGZldGNoaW5nIGN1cnJlbnQgcm9sZVxuICogQHJldHVybnMgRW5oYW5jZWQgYXV0aGVudGljYXRpb24gY29udGV4dCB3aXRoIGN1cnJlbnQgc3lzdGVtUm9sZVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY3JlYXRlRW5oYW5jZWRBdXRoQ29udGV4dChcbiAgcmVxdWVzdENvbnRleHQ6IExhbWJkYVJlcXVlc3RDb250ZXh0LCBcbiAgdXNlclJlcG9zaXRvcnk6IHsgZ2V0VXNlckJ5SWQ6IChpZDogc3RyaW5nKSA9PiBQcm9taXNlPHsgc3lzdGVtUm9sZTogU3lzdGVtUm9sZSB9IHwgbnVsbD4gfVxuKTogUHJvbWlzZTxBdXRoQ29udGV4dD4ge1xuICBjb25zdCBiYXNlQ29udGV4dCA9IGNyZWF0ZUF1dGhDb250ZXh0KHJlcXVlc3RDb250ZXh0KTtcbiAgXG4gIGlmICghYmFzZUNvbnRleHQuaXNBdXRoZW50aWNhdGVkKSB7XG4gICAgcmV0dXJuIGJhc2VDb250ZXh0O1xuICB9XG4gIFxuICB0cnkge1xuICAgIC8vIEZldGNoIGN1cnJlbnQgdXNlciBkYXRhIGZyb20gZGF0YWJhc2UgdG8gZ2V0IGFjY3VyYXRlIHN5c3RlbVJvbGVcbiAgICBjb25zdCB1c2VyRGF0YSA9IGF3YWl0IHVzZXJSZXBvc2l0b3J5LmdldFVzZXJCeUlkKGJhc2VDb250ZXh0LnVzZXJJZCk7XG4gICAgXG4gICAgaWYgKHVzZXJEYXRhKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAuLi5iYXNlQ29udGV4dCxcbiAgICAgICAgc3lzdGVtUm9sZTogdXNlckRhdGEuc3lzdGVtUm9sZSxcbiAgICAgICAgaXNTaXRlQWRtaW46IHVzZXJEYXRhLnN5c3RlbVJvbGUgPT09IFN5c3RlbVJvbGUuU0lURV9BRE1JTixcbiAgICAgIH07XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBiYXNlQ29udGV4dDtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBJZiBkYXRhYmFzZSBsb29rdXAgZmFpbHMsIHJldHVybiBiYXNlIGNvbnRleHQgd2l0aCBkZWZhdWx0IHJvbGVcbiAgICByZXR1cm4gYmFzZUNvbnRleHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSB0aGF0IHVzZXIgaXMgYXV0aGVudGljYXRlZFxuICogXG4gKiBAcGFyYW0gYXV0aENvbnRleHQgLSBBdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gKiBAdGhyb3dzIEVycm9yIGlmIHVzZXIgaXMgbm90IGF1dGhlbnRpY2F0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlcXVpcmVBdXRoZW50aWNhdGlvbihhdXRoQ29udGV4dDogQXV0aENvbnRleHQpOiB2b2lkIHtcbiAgaWYgKCFhdXRoQ29udGV4dC5pc0F1dGhlbnRpY2F0ZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0F1dGhlbnRpY2F0aW9uIHJlcXVpcmVkJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSB0aGF0IHVzZXIgaXMgYSBzaXRlIGFkbWluaXN0cmF0b3JcbiAqIFxuICogQHBhcmFtIGF1dGhDb250ZXh0IC0gQXV0aGVudGljYXRpb24gY29udGV4dFxuICogQHRocm93cyBFcnJvciBpZiB1c2VyIGlzIG5vdCBhIHNpdGUgYWRtaW5pc3RyYXRvclxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVxdWlyZVNpdGVBZG1pbihhdXRoQ29udGV4dDogQXV0aENvbnRleHQpOiB2b2lkIHtcbiAgcmVxdWlyZUF1dGhlbnRpY2F0aW9uKGF1dGhDb250ZXh0KTtcbiAgXG4gIGlmICghYXV0aENvbnRleHQuaXNTaXRlQWRtaW4pIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1NpdGUgYWRtaW5pc3RyYXRvciBwcml2aWxlZ2VzIHJlcXVpcmVkJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVjayBpZiB1c2VyIGNhbiBhY2Nlc3MgYW5vdGhlciB1c2VyJ3MgcHJvZmlsZVxuICogXG4gKiBAcGFyYW0gYXV0aENvbnRleHQgLSBBdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gKiBAcGFyYW0gdGFyZ2V0VXNlcklkIC0gSUQgb2YgdGhlIHVzZXIgYmVpbmcgYWNjZXNzZWRcbiAqIEByZXR1cm5zIFRydWUgaWYgYWNjZXNzIGlzIGFsbG93ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNhbkFjY2Vzc1VzZXIoYXV0aENvbnRleHQ6IEF1dGhDb250ZXh0LCB0YXJnZXRVc2VySWQ6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBpZiAoIWF1dGhDb250ZXh0LmlzQXV0aGVudGljYXRlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgLy8gVXNlcnMgY2FuIGFjY2VzcyB0aGVpciBvd24gcHJvZmlsZVxuICBpZiAoYXV0aENvbnRleHQudXNlcklkID09PSB0YXJnZXRVc2VySWQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBcbiAgLy8gU2l0ZSBhZG1pbnMgY2FuIGFjY2VzcyBhbnkgcHJvZmlsZVxuICBpZiAoYXV0aENvbnRleHQuaXNTaXRlQWRtaW4pIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICBcbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIHVzZXIgY2FuIG1vZGlmeSBhbm90aGVyIHVzZXIncyBwcm9maWxlXG4gKiBcbiAqIEBwYXJhbSBhdXRoQ29udGV4dCAtIEF1dGhlbnRpY2F0aW9uIGNvbnRleHRcbiAqIEBwYXJhbSB0YXJnZXRVc2VySWQgLSBJRCBvZiB0aGUgdXNlciBiZWluZyBtb2RpZmllZFxuICogQHJldHVybnMgVHJ1ZSBpZiBtb2RpZmljYXRpb24gaXMgYWxsb3dlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FuTW9kaWZ5VXNlcihhdXRoQ29udGV4dDogQXV0aENvbnRleHQsIHRhcmdldFVzZXJJZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBjYW5BY2Nlc3NVc2VyKGF1dGhDb250ZXh0LCB0YXJnZXRVc2VySWQpO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIHVzZXIgY2FuIG1vZGlmeSBzeXN0ZW0gcm9sZVxuICogXG4gKiBAcGFyYW0gYXV0aENvbnRleHQgLSBBdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gKiBAcmV0dXJucyBUcnVlIGlmIHN5c3RlbSByb2xlIG1vZGlmaWNhdGlvbiBpcyBhbGxvd2VkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjYW5Nb2RpZnlTeXN0ZW1Sb2xlKGF1dGhDb250ZXh0OiBBdXRoQ29udGV4dCk6IGJvb2xlYW4ge1xuICByZXR1cm4gYXV0aENvbnRleHQuaXNTaXRlQWRtaW47XG59XG5cbi8qKlxuICogVmFsaWRhdGUgYXV0aGVudGljYXRpb24gY29udGV4dCBmcm9tIEFQSSBHYXRld2F5IGV2ZW50XG4gKiBcbiAqIEBwYXJhbSBldmVudCAtIEFQSSBHYXRld2F5IHByb3h5IGV2ZW50XG4gKiBAcmV0dXJucyBBdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gKiBAdGhyb3dzIEVycm9yIGlmIHVzZXIgaXMgbm90IGF1dGhlbnRpY2F0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlQXV0aENvbnRleHQoZXZlbnQ6IEFQSUdhdGV3YXlQcm94eUV2ZW50KTogQXV0aENvbnRleHQge1xuICBjb25zdCBhdXRoQ29udGV4dCA9IGNyZWF0ZUF1dGhDb250ZXh0KGV2ZW50LnJlcXVlc3RDb250ZXh0IGFzIExhbWJkYVJlcXVlc3RDb250ZXh0KTtcbiAgXG4gIGlmICghYXV0aENvbnRleHQuaXNBdXRoZW50aWNhdGVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdBdXRoZW50aWNhdGlvbiByZXF1aXJlZCcpO1xuICB9XG4gIFxuICByZXR1cm4gYXV0aENvbnRleHQ7XG59Il19