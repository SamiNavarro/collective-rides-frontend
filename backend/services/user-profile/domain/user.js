"use strict";
/**
 * User Domain Entity - Phase 1.2
 *
 * Core User entity with business logic and validation rules as defined
 * in the canonical Phase 1.2 specification.
 *
 * Compliance:
 * - Phase 1.2 Spec: .kiro/specs/phase-1.2.user-profile.v1.md
 * - Domain Model: .kiro/specs/domain.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromUserData = exports.createUser = exports.UserEntity = void 0;
const user_1 = require("../../../shared/types/user");
const errors_1 = require("../../../shared/utils/errors");
/**
 * User domain entity with business logic
 */
class UserEntity {
    constructor(user) {
        this.user = user;
    }
    /**
     * Get user data
     */
    get data() {
        return { ...this.user };
    }
    /**
     * Get user ID
     */
    get id() {
        return this.user.id;
    }
    /**
     * Get user email
     */
    get email() {
        return this.user.email;
    }
    /**
     * Get display name
     */
    get displayName() {
        return this.user.displayName;
    }
    /**
     * Get avatar URL
     */
    get avatarUrl() {
        return this.user.avatarUrl;
    }
    /**
     * Get system role
     */
    get systemRole() {
        return this.user.systemRole;
    }
    /**
     * Check if user is a site administrator
     */
    get isSiteAdmin() {
        return this.user.systemRole === user_1.SystemRole.SITE_ADMIN;
    }
    /**
     * Update user with new data
     *
     * @param input - Update input
     * @param canModifySystemRole - Whether system role can be modified
     * @returns Updated user entity
     */
    update(input, canModifySystemRole = false) {
        // Validate system role change permission
        if (input.systemRole !== undefined && !canModifySystemRole) {
            throw new errors_1.ValidationError('System role changes are not allowed');
        }
        // Create updated user data
        const updatedUser = {
            ...this.user,
            updatedAt: new Date().toISOString(),
        };
        // Update allowed fields
        if (input.displayName !== undefined) {
            updatedUser.displayName = input.displayName.trim();
        }
        if (input.avatarUrl !== undefined) {
            updatedUser.avatarUrl = input.avatarUrl.trim() || undefined;
        }
        if (input.systemRole !== undefined && canModifySystemRole) {
            updatedUser.systemRole = input.systemRole;
        }
        return new UserEntity(updatedUser);
    }
    /**
     * Check if this user can access another user's profile
     *
     * @param targetUserId - Target user ID
     * @returns True if access is allowed
     */
    canAccessUser(targetUserId) {
        // Users can access their own profile
        if (this.id === targetUserId) {
            return true;
        }
        // Site admins can access any profile
        if (this.isSiteAdmin) {
            return true;
        }
        return false;
    }
    /**
     * Check if this user can modify another user's profile
     *
     * @param targetUserId - Target user ID
     * @returns True if modification is allowed
     */
    canModifyUser(targetUserId) {
        return this.canAccessUser(targetUserId);
    }
}
exports.UserEntity = UserEntity;
/**
 * Create a new user entity from creation input
 *
 * @param input - User creation input
 * @returns New user entity
 */
function createUser(input) {
    const now = new Date().toISOString();
    const user = {
        id: input.id,
        email: input.email,
        displayName: input.displayName || extractDisplayNameFromEmail(input.email),
        avatarUrl: input.avatarUrl,
        systemRole: user_1.SystemRole.USER,
        createdAt: now,
        updatedAt: now,
    };
    return new UserEntity(user);
}
exports.createUser = createUser;
/**
 * Create user entity from existing user data
 *
 * @param userData - Existing user data
 * @returns User entity
 */
function fromUserData(userData) {
    return new UserEntity(userData);
}
exports.fromUserData = fromUserData;
/**
 * Extract display name from email address
 *
 * @param email - Email address
 * @returns Display name
 */
function extractDisplayNameFromEmail(email) {
    const localPart = email.split('@')[0];
    // Convert to title case and replace common separators
    return localPart
        .replace(/[._-]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInVzZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7R0FTRzs7O0FBRUgscURBQWdHO0FBQ2hHLHlEQUErRDtBQUUvRDs7R0FFRztBQUNILE1BQWEsVUFBVTtJQUNyQixZQUE2QixJQUFVO1FBQVYsU0FBSSxHQUFKLElBQUksQ0FBTTtJQUFHLENBQUM7SUFFM0M7O09BRUc7SUFDSCxJQUFJLElBQUk7UUFDTixPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxFQUFFO1FBQ0osT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLEtBQUs7UUFDUCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ3pCLENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksV0FBVztRQUNiLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDL0IsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxTQUFTO1FBQ1gsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUM3QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLFVBQVU7UUFDWixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO0lBQzlCLENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksV0FBVztRQUNiLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEtBQUssaUJBQVUsQ0FBQyxVQUFVLENBQUM7SUFDeEQsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILE1BQU0sQ0FBQyxLQUFzQixFQUFFLHNCQUErQixLQUFLO1FBQ2pFLHlDQUF5QztRQUN6QyxJQUFJLEtBQUssQ0FBQyxVQUFVLEtBQUssU0FBUyxJQUFJLENBQUMsbUJBQW1C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Q29udGVudCI6WyIvKipcbiAqIFVzZXIgRG9tYWluIEVudGl0eSAtIFBoYXNlIDEuMlxuICogXG4gKiBDb3JlIFVzZXIgZW50aXR5IHdpdGggYnVzaW5lc3MgbG9naWMgYW5kIHZhbGlkYXRpb24gcnVsZXMgYXMgZGVmaW5lZFxuICogaW4gdGhlIGNhbm9uaWNhbCBQaGFzZSAxLjIgc3BlY2lmaWNhdGlvbi5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMS4yIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTEuMi51c2VyLXByb2ZpbGUudjEubWRcbiAqIC0gRG9tYWluIE1vZGVsOiAua2lyby9zcGVjcy9kb21haW4udjEubWRcbiAqL1xuXG5pbXBvcnQgeyBVc2VyLCBDcmVhdGVVc2VySW5wdXQsIFVwZGF0ZVVzZXJJbnB1dCwgU3lzdGVtUm9sZSB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC90eXBlcy91c2VyJztcbmltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscy9lcnJvcnMnO1xuXG4vKipcbiAqIFVzZXIgZG9tYWluIGVudGl0eSB3aXRoIGJ1c2luZXNzIGxvZ2ljXG4gKi9cbmV4cG9ydCBjbGFzcyBVc2VyRW50aXR5IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSB1c2VyOiBVc2VyKSB7fVxuICBcbiAgLyoqXG4gICAqIEdldCB1c2VyIGRhdGFcbiAgICovXG4gIGdldCBkYXRhKCk6IFVzZXIge1xuICAgIHJldHVybiB7IC4uLnRoaXMudXNlciB9O1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHVzZXIgSURcbiAgICovXG4gIGdldCBpZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnVzZXIuaWQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdXNlciBlbWFpbFxuICAgKi9cbiAgZ2V0IGVtYWlsKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMudXNlci5lbWFpbDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBkaXNwbGF5IG5hbWVcbiAgICovXG4gIGdldCBkaXNwbGF5TmFtZSgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLnVzZXIuZGlzcGxheU5hbWU7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYXZhdGFyIFVSTFxuICAgKi9cbiAgZ2V0IGF2YXRhclVybCgpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLnVzZXIuYXZhdGFyVXJsO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHN5c3RlbSByb2xlXG4gICAqL1xuICBnZXQgc3lzdGVtUm9sZSgpOiBTeXN0ZW1Sb2xlIHtcbiAgICByZXR1cm4gdGhpcy51c2VyLnN5c3RlbVJvbGU7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDaGVjayBpZiB1c2VyIGlzIGEgc2l0ZSBhZG1pbmlzdHJhdG9yXG4gICAqL1xuICBnZXQgaXNTaXRlQWRtaW4oKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMudXNlci5zeXN0ZW1Sb2xlID09PSBTeXN0ZW1Sb2xlLlNJVEVfQURNSU47XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBVcGRhdGUgdXNlciB3aXRoIG5ldyBkYXRhXG4gICAqIFxuICAgKiBAcGFyYW0gaW5wdXQgLSBVcGRhdGUgaW5wdXRcbiAgICogQHBhcmFtIGNhbk1vZGlmeVN5c3RlbVJvbGUgLSBXaGV0aGVyIHN5c3RlbSByb2xlIGNhbiBiZSBtb2RpZmllZFxuICAgKiBAcmV0dXJucyBVcGRhdGVkIHVzZXIgZW50aXR5XG4gICAqL1xuICB1cGRhdGUoaW5wdXQ6IFVwZGF0ZVVzZXJJbnB1dCwgY2FuTW9kaWZ5U3lzdGVtUm9sZTogYm9vbGVhbiA9IGZhbHNlKTogVXNlckVudGl0eSB7XG4gICAgLy8gVmFsaWRhdGUgc3lzdGVtIHJvbGUgY2hhbmdlIHBlcm1pc3Npb25cbiAgICBpZiAoaW5wdXQuc3lzdGVtUm9sZSAhPT0gdW5kZWZpbmVkICYmICFjYW5Nb2RpZnlTeXN0ZW1Sb2xlKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdTeXN0ZW0gcm9sZSBjaGFuZ2VzIGFyZSBub3QgYWxsb3dlZCcpO1xuICAgIH1cbiAgICBcbiAgICAvLyBDcmVhdGUgdXBkYXRlZCB1c2VyIGRhdGFcbiAgICBjb25zdCB1cGRhdGVkVXNlcjogVXNlciA9IHtcbiAgICAgIC4uLnRoaXMudXNlcixcbiAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG4gICAgXG4gICAgLy8gVXBkYXRlIGFsbG93ZWQgZmllbGRzXG4gICAgaWYgKGlucHV0LmRpc3BsYXlOYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHVwZGF0ZWRVc2VyLmRpc3BsYXlOYW1lID0gaW5wdXQuZGlzcGxheU5hbWUudHJpbSgpO1xuICAgIH1cbiAgICBcbiAgICBpZiAoaW5wdXQuYXZhdGFyVXJsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHVwZGF0ZWRVc2VyLmF2YXRhclVybCA9IGlucHV0LmF2YXRhclVybC50cmltKCkgfHwgdW5kZWZpbmVkO1xuICAgIH1cbiAgICBcbiAgICBpZiAoaW5wdXQuc3lzdGVtUm9sZSAhPT0gdW5kZWZpbmVkICYmIGNhbk1vZGlmeVN5c3RlbVJvbGUpIHtcbiAgICAgIHVwZGF0ZWRVc2VyLnN5c3RlbVJvbGUgPSBpbnB1dC5zeXN0ZW1Sb2xlO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gbmV3IFVzZXJFbnRpdHkodXBkYXRlZFVzZXIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhpcyB1c2VyIGNhbiBhY2Nlc3MgYW5vdGhlciB1c2VyJ3MgcHJvZmlsZVxuICAgKiBcbiAgICogQHBhcmFtIHRhcmdldFVzZXJJZCAtIFRhcmdldCB1c2VyIElEXG4gICAqIEByZXR1cm5zIFRydWUgaWYgYWNjZXNzIGlzIGFsbG93ZWRcbiAgICovXG4gIGNhbkFjY2Vzc1VzZXIodGFyZ2V0VXNlcklkOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgICAvLyBVc2VycyBjYW4gYWNjZXNzIHRoZWlyIG93biBwcm9maWxlXG4gICAgaWYgKHRoaXMuaWQgPT09IHRhcmdldFVzZXJJZCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIFxuICAgIC8vIFNpdGUgYWRtaW5zIGNhbiBhY2Nlc3MgYW55IHByb2ZpbGVcbiAgICBpZiAodGhpcy5pc1NpdGVBZG1pbikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoaXMgdXNlciBjYW4gbW9kaWZ5IGFub3RoZXIgdXNlcidzIHByb2ZpbGVcbiAgICogXG4gICAqIEBwYXJhbSB0YXJnZXRVc2VySWQgLSBUYXJnZXQgdXNlciBJRFxuICAgKiBAcmV0dXJucyBUcnVlIGlmIG1vZGlmaWNhdGlvbiBpcyBhbGxvd2VkXG4gICAqL1xuICBjYW5Nb2RpZnlVc2VyKHRhcmdldFVzZXJJZDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY2FuQWNjZXNzVXNlcih0YXJnZXRVc2VySWQpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IHVzZXIgZW50aXR5IGZyb20gY3JlYXRpb24gaW5wdXRcbiAqIFxuICogQHBhcmFtIGlucHV0IC0gVXNlciBjcmVhdGlvbiBpbnB1dFxuICogQHJldHVybnMgTmV3IHVzZXIgZW50aXR5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVVc2VyKGlucHV0OiBDcmVhdGVVc2VySW5wdXQpOiBVc2VyRW50aXR5IHtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICBcbiAgY29uc3QgdXNlcjogVXNlciA9IHtcbiAgICBpZDogaW5wdXQuaWQsXG4gICAgZW1haWw6IGlucHV0LmVtYWlsLFxuICAgIGRpc3BsYXlOYW1lOiBpbnB1dC5kaXNwbGF5TmFtZSB8fCBleHRyYWN0RGlzcGxheU5hbWVGcm9tRW1haWwoaW5wdXQuZW1haWwpLFxuICAgIGF2YXRhclVybDogaW5wdXQuYXZhdGFyVXJsLFxuICAgIHN5c3RlbVJvbGU6IFN5c3RlbVJvbGUuVVNFUiwgLy8gRGVmYXVsdCB0byBVc2VyIGFzIHBlciBkb21haW4gcnVsZXNcbiAgICBjcmVhdGVkQXQ6IG5vdyxcbiAgICB1cGRhdGVkQXQ6IG5vdyxcbiAgfTtcbiAgXG4gIHJldHVybiBuZXcgVXNlckVudGl0eSh1c2VyKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgdXNlciBlbnRpdHkgZnJvbSBleGlzdGluZyB1c2VyIGRhdGFcbiAqIFxuICogQHBhcmFtIHVzZXJEYXRhIC0gRXhpc3RpbmcgdXNlciBkYXRhXG4gKiBAcmV0dXJucyBVc2VyIGVudGl0eVxuICovXG5leHBvcnQgZnVuY3Rpb24gZnJvbVVzZXJEYXRhKHVzZXJEYXRhOiBVc2VyKTogVXNlckVudGl0eSB7XG4gIHJldHVybiBuZXcgVXNlckVudGl0eSh1c2VyRGF0YSk7XG59XG5cbi8qKlxuICogRXh0cmFjdCBkaXNwbGF5IG5hbWUgZnJvbSBlbWFpbCBhZGRyZXNzXG4gKiBcbiAqIEBwYXJhbSBlbWFpbCAtIEVtYWlsIGFkZHJlc3NcbiAqIEByZXR1cm5zIERpc3BsYXkgbmFtZVxuICovXG5mdW5jdGlvbiBleHRyYWN0RGlzcGxheU5hbWVGcm9tRW1haWwoZW1haWw6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IGxvY2FsUGFydCA9IGVtYWlsLnNwbGl0KCdAJylbMF07XG4gIFxuICAvLyBDb252ZXJ0IHRvIHRpdGxlIGNhc2UgYW5kIHJlcGxhY2UgY29tbW9uIHNlcGFyYXRvcnNcbiAgcmV0dXJuIGxvY2FsUGFydFxuICAgIC5yZXBsYWNlKC9bLl8tXS9nLCAnICcpXG4gICAgLnNwbGl0KCcgJylcbiAgICAubWFwKHdvcmQgPT4gd29yZC5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHdvcmQuc2xpY2UoMSkudG9Mb3dlckNhc2UoKSlcbiAgICAuam9pbignICcpO1xufSJdfQ==