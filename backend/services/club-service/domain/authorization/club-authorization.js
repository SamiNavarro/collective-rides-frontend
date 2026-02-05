"use strict";
/**
 * Club Authorization System - Phase 2.2
 *
 * Club-level authorization middleware and capability checking.
 * Extends Phase 1.3 authorization with club-specific permissions.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireClubCapabilityDynamic = exports.requireClubCapability = exports.ClubAuthorizationService = void 0;
const club_authorization_1 = require("../../../../shared/types/club-authorization");
const membership_1 = require("../../../../shared/types/membership");
const types_1 = require("../../../../shared/authorization/types");
const authorization_errors_1 = require("../../../../shared/authorization/authorization-errors");
/**
 * Club authorization service
 */
class ClubAuthorizationService {
    constructor(membershipRepository, authorizationService) {
        this.membershipRepository = membershipRepository;
        this.authorizationService = authorizationService;
    }
    /**
     * Create enhanced authorization context with club membership
     */
    async createClubAuthContext(authContext, clubId) {
        // Get user's club membership
        const membership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);
        let clubCapabilities = [];
        let clubMembership = undefined;
        if (membership && membership.status === membership_1.MembershipStatus.ACTIVE) {
            clubCapabilities = (0, club_authorization_1.getCapabilitiesForRole)(membership.role);
            clubMembership = {
                membershipId: membership.membershipId,
                clubId: membership.clubId,
                role: membership.role,
                status: membership.status,
                joinedAt: membership.joinedAt,
            };
        }
        return {
            ...authContext,
            clubMembership,
            clubCapabilities,
        };
    }
    /**
     * Check if user has club capability
     */
    async hasClubCapability(authContext, clubId, capability) {
        try {
            await this.requireClubCapability(authContext, clubId, capability);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Require club capability (throws if not authorized)
     */
    async requireClubCapability(authContext, clubId, capability) {
        // Check system-level capabilities first (SiteAdmin override)
        const hasSystemOverride = await this.authorizationService.hasSystemCapability(authContext, types_1.SystemCapability.MANAGE_ALL_CLUBS);
        if (hasSystemOverride) {
            return; // System admin has all club capabilities
        }
        // Get user's club membership (real-time check - no caching)
        const membership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);
        if (!membership || membership.status !== membership_1.MembershipStatus.ACTIVE) {
            throw new authorization_errors_1.AuthorizationError(`Insufficient privileges: ${capability} required`, authorization_errors_1.AuthorizationErrorType.INSUFFICIENT_PRIVILEGES, 403, {
                capability: capability,
                userId: authContext.userId,
                resource: `club:${clubId}`,
            });
        }
        // Check club-level capability
        if (!(0, club_authorization_1.roleHasCapability)(membership.role, capability)) {
            const requiredRoles = [(0, club_authorization_1.getMinimumRoleForCapability)(capability)].filter(Boolean);
            throw new authorization_errors_1.AuthorizationError(`Insufficient privileges: ${capability} requires ${requiredRoles.join(' or ')} role`, authorization_errors_1.AuthorizationErrorType.INSUFFICIENT_PRIVILEGES, 403, {
                capability: capability,
                userId: authContext.userId,
                resource: `club:${clubId}`,
            });
        }
    }
    /**
     * Check if user can manage member (role hierarchy check)
     */
    async canManageMember(authContext, clubId, targetMemberRole) {
        // System admins can manage anyone
        const hasSystemOverride = await this.authorizationService.hasSystemCapability(authContext, types_1.SystemCapability.MANAGE_ALL_CLUBS);
        if (hasSystemOverride) {
            return true;
        }
        // Get user's club membership
        const membership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);
        if (!membership || membership.status !== membership_1.MembershipStatus.ACTIVE) {
            return false;
        }
        // Role hierarchy: Owner > Admin > Captain > Member
        const roleHierarchy = {
            [membership_1.ClubRole.MEMBER]: 1,
            [membership_1.ClubRole.CAPTAIN]: 2,
            [membership_1.ClubRole.ADMIN]: 3,
            [membership_1.ClubRole.OWNER]: 4,
        };
        const userLevel = roleHierarchy[membership.role];
        const targetLevel = roleHierarchy[targetMemberRole];
        // Can only manage members with lower or equal role level
        // Exception: Owners cannot be managed by anyone except system admins
        if (targetMemberRole === membership_1.ClubRole.OWNER) {
            return false; // Owners cannot be managed (ownership transfer required)
        }
        return userLevel >= targetLevel;
    }
    /**
     * Validate role assignment permissions
     */
    async validateRoleAssignment(authContext, clubId, targetRole) {
        // System admins can assign any role
        const hasSystemOverride = await this.authorizationService.hasSystemCapability(authContext, types_1.SystemCapability.MANAGE_ALL_CLUBS);
        if (hasSystemOverride) {
            return;
        }
        // Get user's club membership
        const membership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);
        if (!membership || membership.status !== membership_1.MembershipStatus.ACTIVE) {
            throw new authorization_errors_1.AuthorizationError('Must be an active club member to assign roles', authorization_errors_1.AuthorizationErrorType.INSUFFICIENT_PRIVILEGES, 403, {
                userId: authContext.userId,
                resource: `club:${clubId}`,
            });
        }
        // Role assignment rules:
        // - Only owners can assign admin roles
        // - Admins and owners can assign member roles
        // - Nobody can assign owner roles (ownership transfer required)
        if (targetRole === membership_1.ClubRole.OWNER) {
            throw new authorization_errors_1.AuthorizationError('Cannot assign owner role - ownership transfer required', authorization_errors_1.AuthorizationErrorType.INSUFFICIENT_PRIVILEGES, 403, {
                userId: authContext.userId,
                resource: `club:${clubId}`,
            });
        }
        if (targetRole === membership_1.ClubRole.ADMIN && membership.role !== membership_1.ClubRole.OWNER) {
            throw new authorization_errors_1.AuthorizationError('Only club owners can assign admin roles', authorization_errors_1.AuthorizationErrorType.INSUFFICIENT_PRIVILEGES, 403, {
                userId: authContext.userId,
                resource: `club:${clubId}`,
            });
        }
        if (targetRole === membership_1.ClubRole.MEMBER && !this.isAdminOrOwner(membership.role)) {
            throw new authorization_errors_1.AuthorizationError('Only club admins and owners can assign member roles', authorization_errors_1.AuthorizationErrorType.INSUFFICIENT_PRIVILEGES, 403, {
                userId: authContext.userId,
                resource: `club:${clubId}`,
            });
        }
    }
    /**
     * Check if role is admin or owner
     */
    isAdminOrOwner(role) {
        return role === membership_1.ClubRole.ADMIN || role === membership_1.ClubRole.OWNER;
    }
}
exports.ClubAuthorizationService = ClubAuthorizationService;
/**
 * Create club authorization middleware function
 */
function requireClubCapability(capability, clubId, membershipRepository, authorizationService) {
    return async (authContext) => {
        const authService = new ClubAuthorizationService(membershipRepository, authorizationService);
        await authService.requireClubCapability(authContext, clubId, capability);
    };
}
exports.requireClubCapability = requireClubCapability;
/**
 * Create club authorization middleware with dynamic club ID
 */
function requireClubCapabilityDynamic(capability, membershipRepository, authorizationService) {
    return (clubId) => async (authContext) => {
        const authService = new ClubAuthorizationService(membershipRepository, authorizationService);
        await authService.requireClubCapability(authContext, clubId, capability);
    };
}
exports.requireClubCapabilityDynamic = requireClubCapabilityDynamic;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2x1Yi1hdXRob3JpemF0aW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2x1Yi1hdXRob3JpemF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBRUgsb0ZBTXFEO0FBQ3JELG9FQUFpRjtBQUVqRixrRUFBaUc7QUFDakcsZ0dBQW1IO0FBR25IOztHQUVHO0FBQ0gsTUFBYSx3QkFBd0I7SUFDakMsWUFDWSxvQkFBMkMsRUFDM0Msb0JBQTJDO1FBRDNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7UUFDM0MseUJBQW9CLEdBQXBCLG9CQUFvQixDQUF1QjtJQUNuRCxDQUFDO0lBRUw7O09BRUc7SUFDSCxLQUFLLENBQUMscUJBQXFCLENBQ3ZCLFdBQXdCLEVBQ3hCLE1BQWM7UUFFZCw2QkFBNkI7UUFDN0IsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsb0JBQW9CLENBQUMsMEJBQTBCLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUUxRyxJQUFJLGdCQUFnQixHQUFxQixFQUFFLENBQUM7UUFDNUMsSUFBSSxjQUFjLEdBQXNDLFNBQVMsQ0FBQztRQUVsRSxJQUFJLFVBQVUsSUFBSSxVQUFVLENBQUMsTUFBTSxLQUFLLDZCQUFnQixDQUFDLE1BQU0sRUFBRTtZQUM3RCxnQkFBZ0IsR0FBRyxJQUFBLDJDQUFzQixFQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMzRCxjQUFjLEdBQUc7Z0JBQ2IsWUFBWSxFQUFFLFVBQVUsQ0FBQyxZQUFZO2dCQUNyQyxNQUFNLEVBQUUsVUFBVSxDQUFDLE1BQU07Z0JBQ3pCLElBQUksRUFBRSxVQUFVLENBQUMsSUFBSTtnQkFDckIsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNO2dCQUN6QixRQUFRLEVBQUUsVUFBVSxDQUFDLFFBQVE7YUFDaEMsQ0FBQztTQUNMO1FBRUQsT0FBTztZQUNILEdBQUcsV0FBVztZQUNkLGNB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T0QsNERBbU9DO0FBRUQ7O0dBRUc7QUFDSCxTQUFnQixxQkFBcUIsQ0FDakMsVUFBMEIsRUFDMUIsTUFBYyxFQUNkLG9CQUEyQyxFQUMzQyxvQkFBMkM7SUFFM0MsT0FBTyxLQUFLLEVBQUUsV0FBd0IsRUFBaUIsRUFBRTtRQUNyRCxNQUFNLFdBQVcsR0FBRyxJQUFJLHdCQUF3QixDQUFDLG9CQUFvQixFQUFFLG9CQUFvQixDQUFDLENBQUM7UUFDN0YsTUFBTSxXQUFXLENBQUMscUJBQXFCLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztJQUM3RSxDQUFDLENBQUM7QUFDTixDQUFDO0FBVkQsc0RBVUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLDRCQUE0QixDQUN4QyxVQUEwQixFQUMxQixvQkFBMkMsRUFDM0Msb0JBQTJDO0lBRTNDLE9BQU8sQ0FBQyxNQUFjLEVBQUUsRUFBRSxDQUFDLEtBQUssRUFBRSxXQUF3QixFQUFpQixFQUFFO1FBQ3pFLE1BQU0sV0FBVyxHQUFHLElBQUksd0JBQXdCLENBQUMsb0JBQW9CLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztRQUM3RixNQUFNLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzdFLENBQUMsQ0FBQztBQUNOLENBQUM7QUFURCxvRUFTQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ2x1YiBBdXRob3JpemF0aW9uIFN5c3RlbSAtIFBoYXNlIDIuMlxuICogXG4gKiBDbHViLWxldmVsIGF1dGhvcml6YXRpb24gbWlkZGxld2FyZSBhbmQgY2FwYWJpbGl0eSBjaGVja2luZy5cbiAqIEV4dGVuZHMgUGhhc2UgMS4zIGF1dGhvcml6YXRpb24gd2l0aCBjbHViLXNwZWNpZmljIHBlcm1pc3Npb25zLlxuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBQaGFzZSAyLjIgU3BlYzogLmtpcm8vc3BlY3MvcGhhc2UtMi4yLmNsdWItbWVtYmVyc2hpcC1yb2xlcy52MS5tZFxuICovXG5cbmltcG9ydCB7XG4gICAgQ2x1YkNhcGFiaWxpdHksXG4gICAgQ2x1YkF1dGhDb250ZXh0LFxuICAgIGdldENhcGFiaWxpdGllc0ZvclJvbGUsXG4gICAgcm9sZUhhc0NhcGFiaWxpdHksXG4gICAgZ2V0TWluaW11bVJvbGVGb3JDYXBhYmlsaXR5XG59IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9jbHViLWF1dGhvcml6YXRpb24nO1xuaW1wb3J0IHsgQ2x1YlJvbGUsIE1lbWJlcnNoaXBTdGF0dXMgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvbWVtYmVyc2hpcCc7XG5pbXBvcnQgeyBBdXRoQ29udGV4dCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9hdXRoJztcbmltcG9ydCB7IFN5c3RlbUNhcGFiaWxpdHksIElBdXRob3JpemF0aW9uU2VydmljZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRob3JpemF0aW9uL3R5cGVzJztcbmltcG9ydCB7IEF1dGhvcml6YXRpb25FcnJvciwgQXV0aG9yaXphdGlvbkVycm9yVHlwZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRob3JpemF0aW9uL2F1dGhvcml6YXRpb24tZXJyb3JzJztcbmltcG9ydCB7IElNZW1iZXJzaGlwUmVwb3NpdG9yeSB9IGZyb20gJy4uL21lbWJlcnNoaXAvbWVtYmVyc2hpcC1yZXBvc2l0b3J5JztcblxuLyoqXG4gKiBDbHViIGF1dGhvcml6YXRpb24gc2VydmljZVxuICovXG5leHBvcnQgY2xhc3MgQ2x1YkF1dGhvcml6YXRpb25TZXJ2aWNlIHtcbiAgICBjb25zdHJ1Y3RvcihcbiAgICAgICAgcHJpdmF0ZSBtZW1iZXJzaGlwUmVwb3NpdG9yeTogSU1lbWJlcnNoaXBSZXBvc2l0b3J5LFxuICAgICAgICBwcml2YXRlIGF1dGhvcml6YXRpb25TZXJ2aWNlOiBJQXV0aG9yaXphdGlvblNlcnZpY2VcbiAgICApIHsgfVxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGVuaGFuY2VkIGF1dGhvcml6YXRpb24gY29udGV4dCB3aXRoIGNsdWIgbWVtYmVyc2hpcFxuICAgICAqL1xuICAgIGFzeW5jIGNyZWF0ZUNsdWJBdXRoQ29udGV4dChcbiAgICAgICAgYXV0aENvbnRleHQ6IEF1dGhDb250ZXh0LFxuICAgICAgICBjbHViSWQ6IHN0cmluZ1xuICAgICk6IFByb21pc2U8Q2x1YkF1dGhDb250ZXh0PiB7XG4gICAgICAgIC8vIEdldCB1c2VyJ3MgY2x1YiBtZW1iZXJzaGlwXG4gICAgICAgIGNvbnN0IG1lbWJlcnNoaXAgPSBhd2FpdCB0aGlzLm1lbWJlcnNoaXBSZXBvc2l0b3J5LmdldE1lbWJlcnNoaXBCeUNsdWJBbmRVc2VyKGNsdWJJZCwgYXV0aENvbnRleHQudXNlcklkKTtcblxuICAgICAgICBsZXQgY2x1YkNhcGFiaWxpdGllczogQ2x1YkNhcGFiaWxpdHlbXSA9IFtdO1xuICAgICAgICBsZXQgY2x1Yk1lbWJlcnNoaXA6IENsdWJBdXRoQ29udGV4dFsnY2x1Yk1lbWJlcnNoaXAnXSA9IHVuZGVmaW5lZDtcblxuICAgICAgICBpZiAobWVtYmVyc2hpcCAmJiBtZW1iZXJzaGlwLnN0YXR1cyA9PT0gTWVtYmVyc2hpcFN0YXR1cy5BQ1RJVkUpIHtcbiAgICAgICAgICAgIGNsdWJDYXBhYmlsaXRpZXMgPSBnZXRDYXBhYmlsaXRpZXNGb3JSb2xlKG1lbWJlcnNoaXAucm9sZSk7XG4gICAgICAgICAgICBjbHViTWVtYmVyc2hpcCA9IHtcbiAgICAgICAgICAgICAgICBtZW1iZXJzaGlwSWQ6IG1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgICAgICAgICAgIGNsdWJJZDogbWVtYmVyc2hpcC5jbHViSWQsXG4gICAgICAgICAgICAgICAgcm9sZTogbWVtYmVyc2hpcC5yb2xlLFxuICAgICAgICAgICAgICAgIHN0YXR1czogbWVtYmVyc2hpcC5zdGF0dXMsXG4gICAgICAgICAgICAgICAgam9pbmVkQXQ6IG1lbWJlcnNoaXAuam9pbmVkQXQsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIC4uLmF1dGhDb250ZXh0LFxuICAgICAgICAgICAgY2x1Yk1lbWJlcnNoaXAsXG4gICAgICAgICAgICBjbHViQ2FwYWJpbGl0aWVzLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHVzZXIgaGFzIGNsdWIgY2FwYWJpbGl0eVxuICAgICAqL1xuICAgIGFzeW5jIGhhc0NsdWJDYXBhYmlsaXR5KFxuICAgICAgICBhdXRoQ29udGV4dDogQXV0aENvbnRleHQsXG4gICAgICAgIGNsdWJJZDogc3RyaW5nLFxuICAgICAgICBjYXBhYmlsaXR5OiBDbHViQ2FwYWJpbGl0eVxuICAgICk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5yZXF1aXJlQ2x1YkNhcGFiaWxpdHkoYXV0aENvbnRleHQsIGNsdWJJZCwgY2FwYWJpbGl0eSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBjYXRjaCB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZXF1aXJlIGNsdWIgY2FwYWJpbGl0eSAodGhyb3dzIGlmIG5vdCBhdXRob3JpemVkKVxuICAgICAqL1xuICAgIGFzeW5jIHJlcXVpcmVDbHViQ2FwYWJpbGl0eShcbiAgICAgICAgYXV0aENvbnRleHQ6IEF1dGhDb250ZXh0LFxuICAgICAgICBjbHViSWQ6IHN0cmluZyxcbiAgICAgICAgY2FwYWJpbGl0eTogQ2x1YkNhcGFiaWxpdHlcbiAgICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgLy8gQ2hlY2sgc3lzdGVtLWxldmVsIGNhcGFiaWxpdGllcyBmaXJzdCAoU2l0ZUFkbWluIG92ZXJyaWRlKVxuICAgICAgICBjb25zdCBoYXNTeXN0ZW1PdmVycmlkZSA9IGF3YWl0IHRoaXMuYXV0aG9yaXphdGlvblNlcnZpY2UuaGFzU3lzdGVtQ2FwYWJpbGl0eShcbiAgICAgICAgICAgIGF1dGhDb250ZXh0LCBcbiAgICAgICAgICAgIFN5c3RlbUNhcGFiaWxpdHkuTUFOQUdFX0FMTF9DTFVCU1xuICAgICAgICApO1xuICAgICAgICBpZiAoaGFzU3lzdGVtT3ZlcnJpZGUpIHtcbiAgICAgICAgICAgIHJldHVybjsgLy8gU3lzdGVtIGFkbWluIGhhcyBhbGwgY2x1YiBjYXBhYmlsaXRpZXNcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdldCB1c2VyJ3MgY2x1YiBtZW1iZXJzaGlwIChyZWFsLXRpbWUgY2hlY2sgLSBubyBjYWNoaW5nKVxuICAgICAgICBjb25zdCBtZW1iZXJzaGlwID0gYXdhaXQgdGhpcy5tZW1iZXJzaGlwUmVwb3NpdG9yeS5nZXRNZW1iZXJzaGlwQnlDbHViQW5kVXNlcihjbHViSWQsIGF1dGhDb250ZXh0LnVzZXJJZCk7XG5cbiAgICAgICAgaWYgKCFtZW1iZXJzaGlwIHx8IG1lbWJlcnNoaXAuc3RhdHVzICE9PSBNZW1iZXJzaGlwU3RhdHVzLkFDVElWRSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEF1dGhvcml6YXRpb25FcnJvcihcbiAgICAgICAgICAgICAgICBgSW5zdWZmaWNpZW50IHByaXZpbGVnZXM6ICR7Y2FwYWJpbGl0eX0gcmVxdWlyZWRgLFxuICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb25FcnJvclR5cGUuSU5TVUZGSUNJRU5UX1BSSVZJTEVHRVMsXG4gICAgICAgICAgICAgICAgNDAzLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgY2FwYWJpbGl0eTogY2FwYWJpbGl0eSBhcyBhbnksIC8vIFR5cGUgYXNzZXJ0aW9uIGZvciBjb21wYXRpYmlsaXR5XG4gICAgICAgICAgICAgICAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZTogYGNsdWI6JHtjbHViSWR9YCxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2hlY2sgY2x1Yi1sZXZlbCBjYXBhYmlsaXR5XG4gICAgICAgIGlmICghcm9sZUhhc0NhcGFiaWxpdHkobWVtYmVyc2hpcC5yb2xlLCBjYXBhYmlsaXR5KSkge1xuICAgICAgICAgICAgY29uc3QgcmVxdWlyZWRSb2xlcyA9IFtnZXRNaW5pbXVtUm9sZUZvckNhcGFiaWxpdHkoY2FwYWJpbGl0eSldLmZpbHRlcihCb29sZWFuKSBhcyBDbHViUm9sZVtdO1xuXG4gICAgICAgICAgICB0aHJvdyBuZXcgQXV0aG9yaXphdGlvbkVycm9yKFxuICAgICAgICAgICAgICAgIGBJbnN1ZmZpY2llbnQgcHJpdmlsZWdlczogJHtjYXBhYmlsaXR5fSByZXF1aXJlcyAke3JlcXVpcmVkUm9sZXMuam9pbignIG9yICcpfSByb2xlYCxcbiAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uRXJyb3JUeXBlLklOU1VGRklDSUVOVF9QUklWSUxFR0VTLFxuICAgICAgICAgICAgICAgIDQwMyxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNhcGFiaWxpdHk6IGNhcGFiaWxpdHkgYXMgYW55LCAvLyBUeXBlIGFzc2VydGlvbiBmb3IgY29tcGF0aWJpbGl0eVxuICAgICAgICAgICAgICAgICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2U6IGBjbHViOiR7Y2x1YklkfWAsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIENoZWNrIGlmIHVzZXIgY2FuIG1hbmFnZSBtZW1iZXIgKHJvbGUgaGllcmFyY2h5IGNoZWNrKVxuICAgICAqL1xuICAgIGFzeW5jIGNhbk1hbmFnZU1lbWJlcihcbiAgICAgICAgYXV0aENvbnRleHQ6IEF1dGhDb250ZXh0LFxuICAgICAgICBjbHViSWQ6IHN0cmluZyxcbiAgICAgICAgdGFyZ2V0TWVtYmVyUm9sZTogQ2x1YlJvbGVcbiAgICApOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgLy8gU3lzdGVtIGFkbWlucyBjYW4gbWFuYWdlIGFueW9uZVxuICAgICAgICBjb25zdCBoYXNTeXN0ZW1PdmVycmlkZSA9IGF3YWl0IHRoaXMuYXV0aG9yaXphdGlvblNlcnZpY2UuaGFzU3lzdGVtQ2FwYWJpbGl0eShcbiAgICAgICAgICAgIGF1dGhDb250ZXh0LCBcbiAgICAgICAgICAgIFN5c3RlbUNhcGFiaWxpdHkuTUFOQUdFX0FMTF9DTFVCU1xuICAgICAgICApO1xuICAgICAgICBpZiAoaGFzU3lzdGVtT3ZlcnJpZGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gR2V0IHVzZXIncyBjbHViIG1lbWJlcnNoaXBcbiAgICAgICAgY29uc3QgbWVtYmVyc2hpcCA9IGF3YWl0IHRoaXMubWVtYmVyc2hpcFJlcG9zaXRvcnkuZ2V0TWVtYmVyc2hpcEJ5Q2x1YkFuZFVzZXIoY2x1YklkLCBhdXRoQ29udGV4dC51c2VySWQpO1xuXG4gICAgICAgIGlmICghbWVtYmVyc2hpcCB8fCBtZW1iZXJzaGlwLnN0YXR1cyAhPT0gTWVtYmVyc2hpcFN0YXR1cy5BQ1RJVkUpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJvbGUgaGllcmFyY2h5OiBPd25lciA+IEFkbWluID4gQ2FwdGFpbiA+IE1lbWJlclxuICAgICAgICBjb25zdCByb2xlSGllcmFyY2h5OiBSZWNvcmQ8Q2x1YlJvbGUsIG51bWJlcj4gPSB7XG4gICAgICAgICAgICBbQ2x1YlJvbGUuTUVNQkVSXTogMSxcbiAgICAgICAgICAgIFtDbHViUm9sZS5DQVBUQUlOXTogMixcbiAgICAgICAgICAgIFtDbHViUm9sZS5BRE1JTl06IDMsXG4gICAgICAgICAgICBbQ2x1YlJvbGUuT1dORVJdOiA0LFxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHVzZXJMZXZlbCA9IHJvbGVIaWVyYXJjaHlbbWVtYmVyc2hpcC5yb2xlXTtcbiAgICAgICAgY29uc3QgdGFyZ2V0TGV2ZWwgPSByb2xlSGllcmFyY2h5W3RhcmdldE1lbWJlclJvbGVdO1xuXG4gICAgICAgIC8vIENhbiBvbmx5IG1hbmFnZSBtZW1iZXJzIHdpdGggbG93ZXIgb3IgZXF1YWwgcm9sZSBsZXZlbFxuICAgICAgICAvLyBFeGNlcHRpb246IE93bmVycyBjYW5ub3QgYmUgbWFuYWdlZCBieSBhbnlvbmUgZXhjZXB0IHN5c3RlbSBhZG1pbnNcbiAgICAgICAgaWYgKHRhcmdldE1lbWJlclJvbGUgPT09IENsdWJSb2xlLk9XTkVSKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7IC8vIE93bmVycyBjYW5ub3QgYmUgbWFuYWdlZCAob3duZXJzaGlwIHRyYW5zZmVyIHJlcXVpcmVkKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHVzZXJMZXZlbCA+PSB0YXJnZXRMZXZlbDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBWYWxpZGF0ZSByb2xlIGFzc2lnbm1lbnQgcGVybWlzc2lvbnNcbiAgICAgKi9cbiAgICBhc3luYyB2YWxpZGF0ZVJvbGVBc3NpZ25tZW50KFxuICAgICAgICBhdXRoQ29udGV4dDogQXV0aENvbnRleHQsXG4gICAgICAgIGNsdWJJZDogc3RyaW5nLFxuICAgICAgICB0YXJnZXRSb2xlOiBDbHViUm9sZVxuICAgICk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICAvLyBTeXN0ZW0gYWRtaW5zIGNhbiBhc3NpZ24gYW55IHJvbGVcbiAgICAgICAgY29uc3QgaGFzU3lzdGVtT3ZlcnJpZGUgPSBhd2FpdCB0aGlzLmF1dGhvcml6YXRpb25TZXJ2aWNlLmhhc1N5c3RlbUNhcGFiaWxpdHkoXG4gICAgICAgICAgICBhdXRoQ29udGV4dCwgXG4gICAgICAgICAgICBTeXN0ZW1DYXBhYmlsaXR5Lk1BTkFHRV9BTExfQ0xVQlNcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKGhhc1N5c3RlbU92ZXJyaWRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXQgdXNlcidzIGNsdWIgbWVtYmVyc2hpcFxuICAgICAgICBjb25zdCBtZW1iZXJzaGlwID0gYXdhaXQgdGhpcy5tZW1iZXJzaGlwUmVwb3NpdG9yeS5nZXRNZW1iZXJzaGlwQnlDbHViQW5kVXNlcihjbHViSWQsIGF1dGhDb250ZXh0LnVzZXJJZCk7XG5cbiAgICAgICAgaWYgKCFtZW1iZXJzaGlwIHx8IG1lbWJlcnNoaXAuc3RhdHVzICE9PSBNZW1iZXJzaGlwU3RhdHVzLkFDVElWRSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEF1dGhvcml6YXRpb25FcnJvcihcbiAgICAgICAgICAgICAgICAnTXVzdCBiZSBhbiBhY3RpdmUgY2x1YiBtZW1iZXIgdG8gYXNzaWduIHJvbGVzJyxcbiAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uRXJyb3JUeXBlLklOU1VGRklDSUVOVF9QUklWSUxFR0VTLFxuICAgICAgICAgICAgICAgIDQwMyxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZTogYGNsdWI6JHtjbHViSWR9YCxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gUm9sZSBhc3NpZ25tZW50IHJ1bGVzOlxuICAgICAgICAvLyAtIE9ubHkgb3duZXJzIGNhbiBhc3NpZ24gYWRtaW4gcm9sZXNcbiAgICAgICAgLy8gLSBBZG1pbnMgYW5kIG93bmVycyBjYW4gYXNzaWduIG1lbWJlciByb2xlc1xuICAgICAgICAvLyAtIE5vYm9keSBjYW4gYXNzaWduIG93bmVyIHJvbGVzIChvd25lcnNoaXAgdHJhbnNmZXIgcmVxdWlyZWQpXG5cbiAgICAgICAgaWYgKHRhcmdldFJvbGUgPT09IENsdWJSb2xlLk9XTkVSKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQXV0aG9yaXphdGlvbkVycm9yKFxuICAgICAgICAgICAgICAgICdDYW5ub3QgYXNzaWduIG93bmVyIHJvbGUgLSBvd25lcnNoaXAgdHJhbnNmZXIgcmVxdWlyZWQnLFxuICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb25FcnJvclR5cGUuSU5TVUZGSUNJRU5UX1BSSVZJTEVHRVMsXG4gICAgICAgICAgICAgICAgNDAzLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlOiBgY2x1Yjoke2NsdWJJZH1gLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGFyZ2V0Um9sZSA9PT0gQ2x1YlJvbGUuQURNSU4gJiYgbWVtYmVyc2hpcC5yb2xlICE9PSBDbHViUm9sZS5PV05FUikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEF1dGhvcml6YXRpb25FcnJvcihcbiAgICAgICAgICAgICAgICAnT25seSBjbHViIG93bmVycyBjYW4gYXNzaWduIGFkbWluIHJvbGVzJyxcbiAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uRXJyb3JUeXBlLklOU1VGRklDSUVOVF9QUklWSUxFR0VTLFxuICAgICAgICAgICAgICAgIDQwMyxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgICAgICAgICAgICAgICByZXNvdXJjZTogYGNsdWI6JHtjbHViSWR9YCxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRhcmdldFJvbGUgPT09IENsdWJSb2xlLk1FTUJFUiAmJiAhdGhpcy5pc0FkbWluT3JPd25lcihtZW1iZXJzaGlwLnJvbGUpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQXV0aG9yaXphdGlvbkVycm9yKFxuICAgICAgICAgICAgICAgICdPbmx5IGNsdWIgYWRtaW5zIGFuZCBvd25lcnMgY2FuIGFzc2lnbiBtZW1iZXIgcm9sZXMnLFxuICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb25FcnJvclR5cGUuSU5TVUZGSUNJRU5UX1BSSVZJTEVHRVMsXG4gICAgICAgICAgICAgICAgNDAzLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICAgICAgICAgICAgICAgIHJlc291cmNlOiBgY2x1Yjoke2NsdWJJZH1gLFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBDaGVjayBpZiByb2xlIGlzIGFkbWluIG9yIG93bmVyXG4gICAgICovXG4gICAgcHJpdmF0ZSBpc0FkbWluT3JPd25lcihyb2xlOiBDbHViUm9sZSk6IGJvb2xlYW4ge1xuICAgICAgICByZXR1cm4gcm9sZSA9PT0gQ2x1YlJvbGUuQURNSU4gfHwgcm9sZSA9PT0gQ2x1YlJvbGUuT1dORVI7XG4gICAgfVxufVxuXG4vKipcbiAqIENyZWF0ZSBjbHViIGF1dGhvcml6YXRpb24gbWlkZGxld2FyZSBmdW5jdGlvblxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVxdWlyZUNsdWJDYXBhYmlsaXR5KFxuICAgIGNhcGFiaWxpdHk6IENsdWJDYXBhYmlsaXR5LFxuICAgIGNsdWJJZDogc3RyaW5nLFxuICAgIG1lbWJlcnNoaXBSZXBvc2l0b3J5OiBJTWVtYmVyc2hpcFJlcG9zaXRvcnksXG4gICAgYXV0aG9yaXphdGlvblNlcnZpY2U6IElBdXRob3JpemF0aW9uU2VydmljZVxuKSB7XG4gICAgcmV0dXJuIGFzeW5jIChhdXRoQ29udGV4dDogQXV0aENvbnRleHQpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICAgICAgY29uc3QgYXV0aFNlcnZpY2UgPSBuZXcgQ2x1YkF1dGhvcml6YXRpb25TZXJ2aWNlKG1lbWJlcnNoaXBSZXBvc2l0b3J5LCBhdXRob3JpemF0aW9uU2VydmljZSk7XG4gICAgICAgIGF3YWl0IGF1dGhTZXJ2aWNlLnJlcXVpcmVDbHViQ2FwYWJpbGl0eShhdXRoQ29udGV4dCwgY2x1YklkLCBjYXBhYmlsaXR5KTtcbiAgICB9O1xufVxuXG4vKipcbiAqIENyZWF0ZSBjbHViIGF1dGhvcml6YXRpb24gbWlkZGxld2FyZSB3aXRoIGR5bmFtaWMgY2x1YiBJRFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVxdWlyZUNsdWJDYXBhYmlsaXR5RHluYW1pYyhcbiAgICBjYXBhYmlsaXR5OiBDbHViQ2FwYWJpbGl0eSxcbiAgICBtZW1iZXJzaGlwUmVwb3NpdG9yeTogSU1lbWJlcnNoaXBSZXBvc2l0b3J5LFxuICAgIGF1dGhvcml6YXRpb25TZXJ2aWNlOiBJQXV0aG9yaXphdGlvblNlcnZpY2Vcbikge1xuICAgIHJldHVybiAoY2x1YklkOiBzdHJpbmcpID0+IGFzeW5jIChhdXRoQ29udGV4dDogQXV0aENvbnRleHQpOiBQcm9taXNlPHZvaWQ+ID0+IHtcbiAgICAgICAgY29uc3QgYXV0aFNlcnZpY2UgPSBuZXcgQ2x1YkF1dGhvcml6YXRpb25TZXJ2aWNlKG1lbWJlcnNoaXBSZXBvc2l0b3J5LCBhdXRob3JpemF0aW9uU2VydmljZSk7XG4gICAgICAgIGF3YWl0IGF1dGhTZXJ2aWNlLnJlcXVpcmVDbHViQ2FwYWJpbGl0eShhdXRoQ29udGV4dCwgY2x1YklkLCBjYXBhYmlsaXR5KTtcbiAgICB9O1xufSJdfQ==