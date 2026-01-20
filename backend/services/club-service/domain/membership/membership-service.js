"use strict";
/**
 * Club Membership Service - Phase 2.2
 *
 * Business logic layer for club membership operations.
 * Handles membership lifecycle, role management, and business rules.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipService = void 0;
const membership_1 = require("../../../../shared/types/membership");
const errors_1 = require("../../../../shared/utils/errors");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const membership_errors_1 = require("./membership-errors");
const club_authorization_1 = require("../authorization/club-authorization");
/**
 * Club membership service implementation
 */
class MembershipService {
    constructor(membershipRepository, clubRepository, authorizationService) {
        this.membershipRepository = membershipRepository;
        this.clubRepository = clubRepository;
        this.authorizationService = authorizationService;
        this.authService = new club_authorization_1.ClubAuthorizationService(membershipRepository, authorizationService);
    }
    /**
     * Join a club (create membership request)
     *
     * @param clubId - Club ID
     * @param input - Join club input
     * @param authContext - Authentication context
     * @returns Created membership
     */
    async joinClub(clubId, input, authContext) {
        (0, lambda_utils_1.logStructured)('INFO', 'Processing club join request', {
            clubId,
            userId: authContext.userId,
            operation: 'join_club',
        });
        // Validate input
        this.validateJoinClubInput(input);
        // Check if club exists
        const club = await this.clubRepository.getClubById(clubId);
        if (!club) {
            throw new errors_1.NotFoundError('Club not found');
        }
        // Check if user is already a member
        const existingMembership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);
        // If user has an active membership, they can't join again
        if (existingMembership && existingMembership.status !== membership_1.MembershipStatus.REMOVED) {
            throw new membership_errors_1.AlreadyMemberError(clubId, authContext.userId);
        }
        // If user has a removed membership, reactivate it instead of creating new one
        if (existingMembership && existingMembership.status === membership_1.MembershipStatus.REMOVED) {
            (0, lambda_utils_1.logStructured)('INFO', 'Reactivating removed membership', {
                clubId,
                userId: authContext.userId,
                membershipId: existingMembership.membershipId,
            });
            const membership = await this.membershipRepository.updateMembershipStatusByClubAndUser(clubId, authContext.userId, membership_1.MembershipStatus.ACTIVE, authContext.userId);
            (0, lambda_utils_1.logStructured)('INFO', 'Removed membership reactivated successfully', {
                clubId,
                userId: authContext.userId,
                membershipId: membership.membershipId,
                status: membership.status,
            });
            return membership;
        }
        // Determine initial status based on club settings
        // For MVP, all new memberships are active immediately (no approval needed)
        const initialStatus = membership_1.MembershipStatus.ACTIVE;
        // Create new membership
        const membership = await this.membershipRepository.createMembership(clubId, authContext.userId, input, membership_1.ClubRole.MEMBER, initialStatus);
        (0, lambda_utils_1.logStructured)('INFO', 'User joined club successfully', {
            clubId,
            userId: authContext.userId,
            membershipId: membership.membershipId,
            status: membership.status,
        });
        return membership;
    }
    /**
     * Leave a club (voluntary departure)
     *
     * @param clubId - Club ID
     * @param authContext - Authentication context
     * @returns Updated membership
     */
    async leaveClub(clubId, authContext) {
        (0, lambda_utils_1.logStructured)('INFO', 'Processing club leave request', {
            clubId,
            userId: authContext.userId,
            operation: 'leave_club',
        });
        // Get user's membership
        const membership = await this.membershipRepository.getMembershipByClubAndUser(clubId, authContext.userId);
        if (!membership || membership.status !== membership_1.MembershipStatus.ACTIVE) {
            throw new membership_errors_1.MembershipNotFoundError(undefined, clubId, authContext.userId);
        }
        // Owners cannot leave (must transfer ownership first)
        if (membership.role === membership_1.ClubRole.OWNER) {
            throw new membership_errors_1.MembershipOperationNotAllowedError('leave_club', membership.membershipId, 'Owners cannot leave - ownership transfer required');
        }
        // Remove membership (use clubId and userId for efficiency)
        const updatedMembership = await this.membershipRepository.removeMembershipByClubAndUser(clubId, authContext.userId, authContext.userId, 'Voluntary departure');
        (0, lambda_utils_1.logStructured)('INFO', 'User left club successfully', {
            clubId,
            userId: authContext.userId,
            membershipId: membership.membershipId,
        });
        return updatedMembership;
    }
    /**
     * List club members
     *
     * @param clubId - Club ID
     * @param options - List options
     * @param authContext - Authentication context
     * @returns Paginated list of club members
     */
    async listClubMembers(clubId, options, authContext) {
        (0, lambda_utils_1.logStructured)('INFO', 'Listing club members', {
            clubId,
            userId: authContext.userId,
            limit: options.limit,
            role: options.role,
            status: options.status,
            operation: 'list_club_members',
        });
        // Validate options
        const limit = Math.min(options.limit || membership_1.MEMBERSHIP_CONSTRAINTS.DEFAULT_LIST_LIMIT, membership_1.MEMBERSHIP_CONSTRAINTS.MAX_LIST_LIMIT);
        // Check if club exists
        const club = await this.clubRepository.getClubById(clubId);
        if (!club) {
            throw new errors_1.NotFoundError('Club not found');
        }
        // List members
        const result = await this.membershipRepository.listClubMembers(clubId, {
            ...options,
            limit,
        });
        (0, lambda_utils_1.logStructured)('INFO', 'Club members listed successfully', {
            clubId,
            userId: authContext.userId,
            resultCount: result.members.length,
            hasNextCursor: !!result.nextCursor,
        });
        return result;
    }
    /**
     * Update member role
     *
     * @param clubId - Club ID
     * @param targetUserId - Target user ID
     * @param input - Update member input
     * @param authContext - Authentication context
     * @returns Updated membership
     */
    async updateMemberRole(clubId, targetUserId, input, authContext) {
        (0, lambda_utils_1.logStructured)('INFO', 'Updating member role', {
            clubId,
            userId: authContext.userId,
            targetUserId,
            newRole: input.role,
            operation: 'update_member_role',
        });
        // Validate input
        this.validateUpdateMemberInput(input);
        // Get target member's membership
        const targetMembership = await this.membershipRepository.getMembershipByClubAndUser(clubId, targetUserId);
        if (!targetMembership || targetMembership.status !== membership_1.MembershipStatus.ACTIVE) {
            throw new membership_errors_1.MembershipNotFoundError(undefined, clubId, targetUserId);
        }
        // Check authorization for role assignment
        await this.authService.validateRoleAssignment(authContext, clubId, input.role);
        // Check if user can manage this member
        const canManage = await this.authService.canManageMember(authContext, clubId, targetMembership.role);
        if (!canManage) {
            throw new membership_errors_1.MembershipOperationNotAllowedError('update_member_role', targetMembership.membershipId, 'Insufficient privileges to manage this member');
        }
        // Update membership role
        const updatedMembership = await this.membershipRepository.updateMembershipRole(targetMembership.membershipId, input, authContext.userId);
        (0, lambda_utils_1.logStructured)('INFO', 'Member role updated successfully', {
            clubId,
            userId: authContext.userId,
            targetUserId,
            membershipId: targetMembership.membershipId,
            previousRole: targetMembership.role,
            newRole: updatedMembership.role,
        });
        return updatedMembership;
    }
    /**
     * Remove member from club
     *
     * @param clubId - Club ID
     * @param targetUserId - Target user ID
     * @param input - Remove member input
     * @param authContext - Authentication context
     * @returns Updated membership
     */
    async removeMember(clubId, targetUserId, input, authContext) {
        (0, lambda_utils_1.logStructured)('INFO', 'Removing club member', {
            clubId,
            userId: authContext.userId,
            targetUserId,
            reason: input.reason,
            operation: 'remove_member',
        });
        // Validate input
        this.validateRemoveMemberInput(input);
        // Get target member's membership
        const targetMembership = await this.membershipRepository.getMembershipByClubAndUser(clubId, targetUserId);
        if (!targetMembership || targetMembership.status !== membership_1.MembershipStatus.ACTIVE) {
            throw new membership_errors_1.MembershipNotFoundError(undefined, clubId, targetUserId);
        }
        // Cannot remove owners (must transfer ownership first)
        if (targetMembership.role === membership_1.ClubRole.OWNER) {
            throw new membership_errors_1.CannotRemoveOwnerError(clubId, targetUserId);
        }
        // Check if user can manage this member
        const canManage = await this.authService.canManageMember(authContext, clubId, targetMembership.role);
        if (!canManage) {
            throw new membership_errors_1.MembershipOperationNotAllowedError('remove_member', targetMembership.membershipId, 'Insufficient privileges to remove this member');
        }
        // Remove membership
        const updatedMembership = await this.membershipRepository.removeMembership(targetMembership.membershipId, authContext.userId, input.reason);
        (0, lambda_utils_1.logStructured)('INFO', 'Member removed successfully', {
            clubId,
            userId: authContext.userId,
            targetUserId,
            membershipId: targetMembership.membershipId,
            reason: input.reason,
        });
        return updatedMembership;
    }
    /**
     * Get user's club memberships
     *
     * @param authContext - Authentication context
     * @param status - Optional status filter
     * @returns List of user's club memberships
     */
    async getUserMemberships(authContext, status) {
        (0, lambda_utils_1.logStructured)('INFO', 'Getting user memberships', {
            userId: authContext.userId,
            status,
            operation: 'get_user_memberships',
        });
        const memberships = await this.membershipRepository.listUserMemberships(authContext.userId, status);
        (0, lambda_utils_1.logStructured)('INFO', 'User memberships retrieved', {
            userId: authContext.userId,
            membershipCount: memberships.length,
            status,
        });
        return memberships;
    }
    /**
     * Get user's role in club
     *
     * @param clubId - Club ID
     * @param userId - User ID
     * @returns User's role if they are an active member, null otherwise
     */
    async getUserRoleInClub(clubId, userId) {
        return this.membershipRepository.getUserRoleInClub(clubId, userId);
    }
    /**
     * Check if user is club member
     *
     * @param clubId - Club ID
     * @param userId - User ID
     * @returns True if user is an active member
     */
    async isUserMember(clubId, userId) {
        return this.membershipRepository.isUserMember(clubId, userId);
    }
    /**
     * Validate join club input
     */
    validateJoinClubInput(input) {
        if (input.message && input.message.length > membership_1.MEMBERSHIP_CONSTRAINTS.JOIN_MESSAGE_MAX_LENGTH) {
            throw new errors_1.ValidationError(`Join message must not exceed ${membership_1.MEMBERSHIP_CONSTRAINTS.JOIN_MESSAGE_MAX_LENGTH} characters`);
        }
    }
    /**
     * Validate update member input
     */
    validateUpdateMemberInput(input) {
        if (!Object.values(membership_1.ClubRole).includes(input.role)) {
            throw new errors_1.ValidationError('Invalid club role');
        }
        if (input.reason && input.reason.length > membership_1.MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH) {
            throw new errors_1.ValidationError(`Reason must not exceed ${membership_1.MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH} characters`);
        }
    }
    /**
     * Validate remove member input
     */
    validateRemoveMemberInput(input) {
        if (input.reason && input.reason.length > membership_1.MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH) {
            throw new errors_1.ValidationError(`Reason must not exceed ${membership_1.MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH} characters`);
        }
    }
}
exports.MembershipService = MembershipService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVtYmVyc2hpcC1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWVtYmVyc2hpcC1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBRUgsb0VBVzZDO0FBRTdDLDREQUFnRztBQUNoRyx3RUFBc0U7QUFHdEUsMkRBSzZCO0FBQzdCLDRFQUErRTtBQUcvRTs7R0FFRztBQUNILE1BQWEsaUJBQWlCO0lBRzVCLFlBQ1Usb0JBQTJDLEVBQzNDLGNBQStCLEVBQy9CLG9CQUEyQztRQUYzQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1FBQzNDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtRQUMvQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1FBRW5ELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSw2Q0FBd0IsQ0FBQyxvQkFBb0IsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0lBQzlGLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFjLEVBQUUsS0FBb0IsRUFBRSxXQUF3QjtRQUMzRSxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLDhCQUE4QixFQUFFO1lBQ3BELE1BQU07WUFDTixNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07WUFDMUIsU0FBUyxFQUFFLFdBQVc7U0FDdkIsQ0FBQyxDQUFDO1FBRUgsaUJBQWlCO1FBQ2pCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVsQyx1QkFBdUI7UUFDdkIsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1QsTUFBTSxJQUFJLHNCQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUMzQztRQUVELG9DQUFvQztRQUNwQyxNQUFNLGtCQUFrQixHQUFHLE1BQU0sSUFBSSxD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LElBQUksd0JBQWUsQ0FBQyxnQ0FBZ0MsbUNBQXNCLENBQUMsdUJBQXVCLGFBQWEsQ0FBQyxDQUFDO1NBQ3hIO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0sseUJBQXlCLENBQUMsS0FBd0I7UUFDeEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMscUJBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDakQsTUFBTSxJQUFJLHdCQUFlLENBQUMsbUJBQW1CLENBQUMsQ0FBQztTQUNoRDtRQUVELElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxtQ0FBc0IsQ0FBQyxpQkFBaUIsRUFBRTtZQUNsRixNQUFNLElBQUksd0JBQWUsQ0FBQywwQkFBMEIsbUNBQXNCLENBQUMsaUJBQWlCLGFBQWEsQ0FBQyxDQUFDO1NBQzVHO0lBQ0gsQ0FBQztJQUVEOztPQUVHO0lBQ0sseUJBQXlCLENBQUMsS0FBd0I7UUFDeEQsSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLG1DQUFzQixDQUFDLGlCQUFpQixFQUFFO1lBQ2xGLE1BQU0sSUFBSSx3QkFBZSxDQUFDLDBCQUEwQixtQ0FBc0IsQ0FBQyxpQkFBaUIsYUFBYSxDQUFDLENBQUM7U0FDNUc7SUFDSCxDQUFDO0NBQ0Y7QUE1WUQsOENBNFlDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDbHViIE1lbWJlcnNoaXAgU2VydmljZSAtIFBoYXNlIDIuMlxuICogXG4gKiBCdXNpbmVzcyBsb2dpYyBsYXllciBmb3IgY2x1YiBtZW1iZXJzaGlwIG9wZXJhdGlvbnMuXG4gKiBIYW5kbGVzIG1lbWJlcnNoaXAgbGlmZWN5Y2xlLCByb2xlIG1hbmFnZW1lbnQsIGFuZCBidXNpbmVzcyBydWxlcy5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMi4yIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTIuMi5jbHViLW1lbWJlcnNoaXAtcm9sZXMudjEubWRcbiAqL1xuXG5pbXBvcnQgeyBcbiAgQ2x1Yk1lbWJlcnNoaXAsIFxuICBDbHViUm9sZSwgXG4gIE1lbWJlcnNoaXBTdGF0dXMsIFxuICBKb2luQ2x1YklucHV0LCBcbiAgVXBkYXRlTWVtYmVySW5wdXQsXG4gIFJlbW92ZU1lbWJlcklucHV0LFxuICBMaXN0TWVtYmVyc09wdGlvbnMsIFxuICBMaXN0TWVtYmVyc1Jlc3VsdCxcbiAgVXNlck1lbWJlcnNoaXBTdW1tYXJ5LFxuICBNRU1CRVJTSElQX0NPTlNUUkFJTlRTXG59IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9tZW1iZXJzaGlwJztcbmltcG9ydCB7IEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL2F1dGgnO1xuaW1wb3J0IHsgTm90Rm91bmRFcnJvciwgVmFsaWRhdGlvbkVycm9yLCBDb25mbGljdEVycm9yIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2Vycm9ycyc7XG5pbXBvcnQgeyBsb2dTdHJ1Y3R1cmVkIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBJTWVtYmVyc2hpcFJlcG9zaXRvcnkgfSBmcm9tICcuL21lbWJlcnNoaXAtcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBJQ2x1YlJlcG9zaXRvcnkgfSBmcm9tICcuLi9jbHViLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgXG4gIEFscmVhZHlNZW1iZXJFcnJvciwgXG4gIE1lbWJlcnNoaXBOb3RGb3VuZEVycm9yLCBcbiAgQ2Fubm90UmVtb3ZlT3duZXJFcnJvcixcbiAgTWVtYmVyc2hpcE9wZXJhdGlvbk5vdEFsbG93ZWRFcnJvclxufSBmcm9tICcuL21lbWJlcnNoaXAtZXJyb3JzJztcbmltcG9ydCB7IENsdWJBdXRob3JpemF0aW9uU2VydmljZSB9IGZyb20gJy4uL2F1dGhvcml6YXRpb24vY2x1Yi1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IElBdXRob3JpemF0aW9uU2VydmljZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRob3JpemF0aW9uL3R5cGVzJztcblxuLyoqXG4gKiBDbHViIG1lbWJlcnNoaXAgc2VydmljZSBpbXBsZW1lbnRhdGlvblxuICovXG5leHBvcnQgY2xhc3MgTWVtYmVyc2hpcFNlcnZpY2Uge1xuICBwcml2YXRlIGF1dGhTZXJ2aWNlOiBDbHViQXV0aG9yaXphdGlvblNlcnZpY2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBtZW1iZXJzaGlwUmVwb3NpdG9yeTogSU1lbWJlcnNoaXBSZXBvc2l0b3J5LFxuICAgIHByaXZhdGUgY2x1YlJlcG9zaXRvcnk6IElDbHViUmVwb3NpdG9yeSxcbiAgICBwcml2YXRlIGF1dGhvcml6YXRpb25TZXJ2aWNlOiBJQXV0aG9yaXphdGlvblNlcnZpY2VcbiAgKSB7XG4gICAgdGhpcy5hdXRoU2VydmljZSA9IG5ldyBDbHViQXV0aG9yaXphdGlvblNlcnZpY2UobWVtYmVyc2hpcFJlcG9zaXRvcnksIGF1dGhvcml6YXRpb25TZXJ2aWNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBKb2luIGEgY2x1YiAoY3JlYXRlIG1lbWJlcnNoaXAgcmVxdWVzdClcbiAgICogXG4gICAqIEBwYXJhbSBjbHViSWQgLSBDbHViIElEXG4gICAqIEBwYXJhbSBpbnB1dCAtIEpvaW4gY2x1YiBpbnB1dFxuICAgKiBAcGFyYW0gYXV0aENvbnRleHQgLSBBdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gICAqIEByZXR1cm5zIENyZWF0ZWQgbWVtYmVyc2hpcFxuICAgKi9cbiAgYXN5bmMgam9pbkNsdWIoY2x1YklkOiBzdHJpbmcsIGlucHV0OiBKb2luQ2x1YklucHV0LCBhdXRoQ29udGV4dDogQXV0aENvbnRleHQpOiBQcm9taXNlPENsdWJNZW1iZXJzaGlwPiB7XG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdQcm9jZXNzaW5nIGNsdWIgam9pbiByZXF1ZXN0Jywge1xuICAgICAgY2x1YklkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBvcGVyYXRpb246ICdqb2luX2NsdWInLFxuICAgIH0pO1xuXG4gICAgLy8gVmFsaWRhdGUgaW5wdXRcbiAgICB0aGlzLnZhbGlkYXRlSm9pbkNsdWJJbnB1dChpbnB1dCk7XG5cbiAgICAvLyBDaGVjayBpZiBjbHViIGV4aXN0c1xuICAgIGNvbnN0IGNsdWIgPSBhd2FpdCB0aGlzLmNsdWJSZXBvc2l0b3J5LmdldENsdWJCeUlkKGNsdWJJZCk7XG4gICAgaWYgKCFjbHViKSB7XG4gICAgICB0aHJvdyBuZXcgTm90Rm91bmRFcnJvcignQ2x1YiBub3QgZm91bmQnKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiB1c2VyIGlzIGFscmVhZHkgYSBtZW1iZXJcbiAgICBjb25zdCBleGlzdGluZ01lbWJlcnNoaXAgPSBhd2FpdCB0aGlzLm1lbWJlcnNoaXBSZXBvc2l0b3J5LmdldE1lbWJlcnNoaXBCeUNsdWJBbmRVc2VyKGNsdWJJZCwgYXV0aENvbnRleHQudXNlcklkKTtcbiAgICBcbiAgICAvLyBJZiB1c2VyIGhhcyBhbiBhY3RpdmUgbWVtYmVyc2hpcCwgdGhleSBjYW4ndCBqb2luIGFnYWluXG4gICAgaWYgKGV4aXN0aW5nTWVtYmVyc2hpcCAmJiBleGlzdGluZ01lbWJlcnNoaXAuc3RhdHVzICE9PSBNZW1iZXJzaGlwU3RhdHVzLlJFTU9WRUQpIHtcbiAgICAgIHRocm93IG5ldyBBbHJlYWR5TWVtYmVyRXJyb3IoY2x1YklkLCBhdXRoQ29udGV4dC51c2VySWQpO1xuICAgIH1cblxuICAgIC8vIElmIHVzZXIgaGFzIGEgcmVtb3ZlZCBtZW1iZXJzaGlwLCByZWFjdGl2YXRlIGl0IGluc3RlYWQgb2YgY3JlYXRpbmcgbmV3IG9uZVxuICAgIGlmIChleGlzdGluZ01lbWJlcnNoaXAgJiYgZXhpc3RpbmdNZW1iZXJzaGlwLnN0YXR1cyA9PT0gTWVtYmVyc2hpcFN0YXR1cy5SRU1PVkVEKSB7XG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1JlYWN0aXZhdGluZyByZW1vdmVkIG1lbWJlcnNoaXAnLCB7XG4gICAgICAgIGNsdWJJZCxcbiAgICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICAgIG1lbWJlcnNoaXBJZDogZXhpc3RpbmdNZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgIH0pO1xuXG4gICAgICBjb25zdCBtZW1iZXJzaGlwID0gYXdhaXQgdGhpcy5tZW1iZXJzaGlwUmVwb3NpdG9yeS51cGRhdGVNZW1iZXJzaGlwU3RhdHVzQnlDbHViQW5kVXNlcihcbiAgICAgICAgY2x1YklkLFxuICAgICAgICBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICAgIE1lbWJlcnNoaXBTdGF0dXMuQUNUSVZFLFxuICAgICAgICBhdXRoQ29udGV4dC51c2VySWRcbiAgICAgICk7XG5cbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnUmVtb3ZlZCBtZW1iZXJzaGlwIHJlYWN0aXZhdGVkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgICAgY2x1YklkLFxuICAgICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgICAgc3RhdHVzOiBtZW1iZXJzaGlwLnN0YXR1cyxcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gbWVtYmVyc2hpcDtcbiAgICB9XG5cbiAgICAvLyBEZXRlcm1pbmUgaW5pdGlhbCBzdGF0dXMgYmFzZWQgb24gY2x1YiBzZXR0aW5nc1xuICAgIC8vIEZvciBNVlAsIGFsbCBuZXcgbWVtYmVyc2hpcHMgYXJlIGFjdGl2ZSBpbW1lZGlhdGVseSAobm8gYXBwcm92YWwgbmVlZGVkKVxuICAgIGNvbnN0IGluaXRpYWxTdGF0dXMgPSBNZW1iZXJzaGlwU3RhdHVzLkFDVElWRTtcblxuICAgIC8vIENyZWF0ZSBuZXcgbWVtYmVyc2hpcFxuICAgIGNvbnN0IG1lbWJlcnNoaXAgPSBhd2FpdCB0aGlzLm1lbWJlcnNoaXBSZXBvc2l0b3J5LmNyZWF0ZU1lbWJlcnNoaXAoXG4gICAgICBjbHViSWQsXG4gICAgICBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBpbnB1dCxcbiAgICAgIENsdWJSb2xlLk1FTUJFUixcbiAgICAgIGluaXRpYWxTdGF0dXNcbiAgICApO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdVc2VyIGpvaW5lZCBjbHViIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIGNsdWJJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgIHN0YXR1czogbWVtYmVyc2hpcC5zdGF0dXMsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWVtYmVyc2hpcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBMZWF2ZSBhIGNsdWIgKHZvbHVudGFyeSBkZXBhcnR1cmUpXG4gICAqIFxuICAgKiBAcGFyYW0gY2x1YklkIC0gQ2x1YiBJRFxuICAgKiBAcGFyYW0gYXV0aENvbnRleHQgLSBBdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gICAqIEByZXR1cm5zIFVwZGF0ZWQgbWVtYmVyc2hpcFxuICAgKi9cbiAgYXN5bmMgbGVhdmVDbHViKGNsdWJJZDogc3RyaW5nLCBhdXRoQ29udGV4dDogQXV0aENvbnRleHQpOiBQcm9taXNlPENsdWJNZW1iZXJzaGlwPiB7XG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdQcm9jZXNzaW5nIGNsdWIgbGVhdmUgcmVxdWVzdCcsIHtcbiAgICAgIGNsdWJJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgb3BlcmF0aW9uOiAnbGVhdmVfY2x1YicsXG4gICAgfSk7XG5cbiAgICAvLyBHZXQgdXNlcidzIG1lbWJlcnNoaXBcbiAgICBjb25zdCBtZW1iZXJzaGlwID0gYXdhaXQgdGhpcy5tZW1iZXJzaGlwUmVwb3NpdG9yeS5nZXRNZW1iZXJzaGlwQnlDbHViQW5kVXNlcihjbHViSWQsIGF1dGhDb250ZXh0LnVzZXJJZCk7XG4gICAgaWYgKCFtZW1iZXJzaGlwIHx8IG1lbWJlcnNoaXAuc3RhdHVzICE9PSBNZW1iZXJzaGlwU3RhdHVzLkFDVElWRSkge1xuICAgICAgdGhyb3cgbmV3IE1lbWJlcnNoaXBOb3RGb3VuZEVycm9yKHVuZGVmaW5lZCwgY2x1YklkLCBhdXRoQ29udGV4dC51c2VySWQpO1xuICAgIH1cblxuICAgIC8vIE93bmVycyBjYW5ub3QgbGVhdmUgKG11c3QgdHJhbnNmZXIgb3duZXJzaGlwIGZpcnN0KVxuICAgIGlmIChtZW1iZXJzaGlwLnJvbGUgPT09IENsdWJSb2xlLk9XTkVSKSB7XG4gICAgICB0aHJvdyBuZXcgTWVtYmVyc2hpcE9wZXJhdGlvbk5vdEFsbG93ZWRFcnJvcihcbiAgICAgICAgJ2xlYXZlX2NsdWInLCBcbiAgICAgICAgbWVtYmVyc2hpcC5tZW1iZXJzaGlwSWQsIFxuICAgICAgICAnT3duZXJzIGNhbm5vdCBsZWF2ZSAtIG93bmVyc2hpcCB0cmFuc2ZlciByZXF1aXJlZCdcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIG1lbWJlcnNoaXAgKHVzZSBjbHViSWQgYW5kIHVzZXJJZCBmb3IgZWZmaWNpZW5jeSlcbiAgICBjb25zdCB1cGRhdGVkTWVtYmVyc2hpcCA9IGF3YWl0IHRoaXMubWVtYmVyc2hpcFJlcG9zaXRvcnkucmVtb3ZlTWVtYmVyc2hpcEJ5Q2x1YkFuZFVzZXIoXG4gICAgICBjbHViSWQsXG4gICAgICBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICAnVm9sdW50YXJ5IGRlcGFydHVyZSdcbiAgICApO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdVc2VyIGxlZnQgY2x1YiBzdWNjZXNzZnVsbHknLCB7XG4gICAgICBjbHViSWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIG1lbWJlcnNoaXBJZDogbWVtYmVyc2hpcC5tZW1iZXJzaGlwSWQsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdXBkYXRlZE1lbWJlcnNoaXA7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBjbHViIG1lbWJlcnNcbiAgICogXG4gICAqIEBwYXJhbSBjbHViSWQgLSBDbHViIElEXG4gICAqIEBwYXJhbSBvcHRpb25zIC0gTGlzdCBvcHRpb25zXG4gICAqIEBwYXJhbSBhdXRoQ29udGV4dCAtIEF1dGhlbnRpY2F0aW9uIGNvbnRleHRcbiAgICogQHJldHVybnMgUGFnaW5hdGVkIGxpc3Qgb2YgY2x1YiBtZW1iZXJzXG4gICAqL1xuICBhc3luYyBsaXN0Q2x1Yk1lbWJlcnMoXG4gICAgY2x1YklkOiBzdHJpbmcsIFxuICAgIG9wdGlvbnM6IExpc3RNZW1iZXJzT3B0aW9ucywgXG4gICAgYXV0aENvbnRleHQ6IEF1dGhDb250ZXh0XG4gICk6IFByb21pc2U8TGlzdE1lbWJlcnNSZXN1bHQ+IHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0xpc3RpbmcgY2x1YiBtZW1iZXJzJywge1xuICAgICAgY2x1YklkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBsaW1pdDogb3B0aW9ucy5saW1pdCxcbiAgICAgIHJvbGU6IG9wdGlvbnMucm9sZSxcbiAgICAgIHN0YXR1czogb3B0aW9ucy5zdGF0dXMsXG4gICAgICBvcGVyYXRpb246ICdsaXN0X2NsdWJfbWVtYmVycycsXG4gICAgfSk7XG5cbiAgICAvLyBWYWxpZGF0ZSBvcHRpb25zXG4gICAgY29uc3QgbGltaXQgPSBNYXRoLm1pbihcbiAgICAgIG9wdGlvbnMubGltaXQgfHwgTUVNQkVSU0hJUF9DT05TVFJBSU5UUy5ERUZBVUxUX0xJU1RfTElNSVQsXG4gICAgICBNRU1CRVJTSElQX0NPTlNUUkFJTlRTLk1BWF9MSVNUX0xJTUlUXG4gICAgKTtcblxuICAgIC8vIENoZWNrIGlmIGNsdWIgZXhpc3RzXG4gICAgY29uc3QgY2x1YiA9IGF3YWl0IHRoaXMuY2x1YlJlcG9zaXRvcnkuZ2V0Q2x1YkJ5SWQoY2x1YklkKTtcbiAgICBpZiAoIWNsdWIpIHtcbiAgICAgIHRocm93IG5ldyBOb3RGb3VuZEVycm9yKCdDbHViIG5vdCBmb3VuZCcpO1xuICAgIH1cblxuICAgIC8vIExpc3QgbWVtYmVyc1xuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMubWVtYmVyc2hpcFJlcG9zaXRvcnkubGlzdENsdWJNZW1iZXJzKGNsdWJJZCwge1xuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIGxpbWl0LFxuICAgIH0pO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdDbHViIG1lbWJlcnMgbGlzdGVkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIGNsdWJJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgcmVzdWx0Q291bnQ6IHJlc3VsdC5tZW1iZXJzLmxlbmd0aCxcbiAgICAgIGhhc05leHRDdXJzb3I6ICEhcmVzdWx0Lm5leHRDdXJzb3IsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBtZW1iZXIgcm9sZVxuICAgKiBcbiAgICogQHBhcmFtIGNsdWJJZCAtIENsdWIgSURcbiAgICogQHBhcmFtIHRhcmdldFVzZXJJZCAtIFRhcmdldCB1c2VyIElEXG4gICAqIEBwYXJhbSBpbnB1dCAtIFVwZGF0ZSBtZW1iZXIgaW5wdXRcbiAgICogQHBhcmFtIGF1dGhDb250ZXh0IC0gQXV0aGVudGljYXRpb24gY29udGV4dFxuICAgKiBAcmV0dXJucyBVcGRhdGVkIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIHVwZGF0ZU1lbWJlclJvbGUoXG4gICAgY2x1YklkOiBzdHJpbmcsIFxuICAgIHRhcmdldFVzZXJJZDogc3RyaW5nLCBcbiAgICBpbnB1dDogVXBkYXRlTWVtYmVySW5wdXQsIFxuICAgIGF1dGhDb250ZXh0OiBBdXRoQ29udGV4dFxuICApOiBQcm9taXNlPENsdWJNZW1iZXJzaGlwPiB7XG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdVcGRhdGluZyBtZW1iZXIgcm9sZScsIHtcbiAgICAgIGNsdWJJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgdGFyZ2V0VXNlcklkLFxuICAgICAgbmV3Um9sZTogaW5wdXQucm9sZSxcbiAgICAgIG9wZXJhdGlvbjogJ3VwZGF0ZV9tZW1iZXJfcm9sZScsXG4gICAgfSk7XG5cbiAgICAvLyBWYWxpZGF0ZSBpbnB1dFxuICAgIHRoaXMudmFsaWRhdGVVcGRhdGVNZW1iZXJJbnB1dChpbnB1dCk7XG5cbiAgICAvLyBHZXQgdGFyZ2V0IG1lbWJlcidzIG1lbWJlcnNoaXBcbiAgICBjb25zdCB0YXJnZXRNZW1iZXJzaGlwID0gYXdhaXQgdGhpcy5tZW1iZXJzaGlwUmVwb3NpdG9yeS5nZXRNZW1iZXJzaGlwQnlDbHViQW5kVXNlcihjbHViSWQsIHRhcmdldFVzZXJJZCk7XG4gICAgaWYgKCF0YXJnZXRNZW1iZXJzaGlwIHx8IHRhcmdldE1lbWJlcnNoaXAuc3RhdHVzICE9PSBNZW1iZXJzaGlwU3RhdHVzLkFDVElWRSkge1xuICAgICAgdGhyb3cgbmV3IE1lbWJlcnNoaXBOb3RGb3VuZEVycm9yKHVuZGVmaW5lZCwgY2x1YklkLCB0YXJnZXRVc2VySWQpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGF1dGhvcml6YXRpb24gZm9yIHJvbGUgYXNzaWdubWVudFxuICAgIGF3YWl0IHRoaXMuYXV0aFNlcnZpY2UudmFsaWRhdGVSb2xlQXNzaWdubWVudChhdXRoQ29udGV4dCwgY2x1YklkLCBpbnB1dC5yb2xlKTtcblxuICAgIC8vIENoZWNrIGlmIHVzZXIgY2FuIG1hbmFnZSB0aGlzIG1lbWJlclxuICAgIGNvbnN0IGNhbk1hbmFnZSA9IGF3YWl0IHRoaXMuYXV0aFNlcnZpY2UuY2FuTWFuYWdlTWVtYmVyKGF1dGhDb250ZXh0LCBjbHViSWQsIHRhcmdldE1lbWJlcnNoaXAucm9sZSk7XG4gICAgaWYgKCFjYW5NYW5hZ2UpIHtcbiAgICAgIHRocm93IG5ldyBNZW1iZXJzaGlwT3BlcmF0aW9uTm90QWxsb3dlZEVycm9yKFxuICAgICAgICAndXBkYXRlX21lbWJlcl9yb2xlJyxcbiAgICAgICAgdGFyZ2V0TWVtYmVyc2hpcC5tZW1iZXJzaGlwSWQsXG4gICAgICAgICdJbnN1ZmZpY2llbnQgcHJpdmlsZWdlcyB0byBtYW5hZ2UgdGhpcyBtZW1iZXInXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIFVwZGF0ZSBtZW1iZXJzaGlwIHJvbGVcbiAgICBjb25zdCB1cGRhdGVkTWVtYmVyc2hpcCA9IGF3YWl0IHRoaXMubWVtYmVyc2hpcFJlcG9zaXRvcnkudXBkYXRlTWVtYmVyc2hpcFJvbGUoXG4gICAgICB0YXJnZXRNZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgIGlucHV0LFxuICAgICAgYXV0aENvbnRleHQudXNlcklkXG4gICAgKTtcblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnTWVtYmVyIHJvbGUgdXBkYXRlZCBzdWNjZXNzZnVsbHknLCB7XG4gICAgICBjbHViSWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIHRhcmdldFVzZXJJZCxcbiAgICAgIG1lbWJlcnNoaXBJZDogdGFyZ2V0TWVtYmVyc2hpcC5tZW1iZXJzaGlwSWQsXG4gICAgICBwcmV2aW91c1JvbGU6IHRhcmdldE1lbWJlcnNoaXAucm9sZSxcbiAgICAgIG5ld1JvbGU6IHVwZGF0ZWRNZW1iZXJzaGlwLnJvbGUsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdXBkYXRlZE1lbWJlcnNoaXA7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIG1lbWJlciBmcm9tIGNsdWJcbiAgICogXG4gICAqIEBwYXJhbSBjbHViSWQgLSBDbHViIElEXG4gICAqIEBwYXJhbSB0YXJnZXRVc2VySWQgLSBUYXJnZXQgdXNlciBJRFxuICAgKiBAcGFyYW0gaW5wdXQgLSBSZW1vdmUgbWVtYmVyIGlucHV0XG4gICAqIEBwYXJhbSBhdXRoQ29udGV4dCAtIEF1dGhlbnRpY2F0aW9uIGNvbnRleHRcbiAgICogQHJldHVybnMgVXBkYXRlZCBtZW1iZXJzaGlwXG4gICAqL1xuICBhc3luYyByZW1vdmVNZW1iZXIoXG4gICAgY2x1YklkOiBzdHJpbmcsIFxuICAgIHRhcmdldFVzZXJJZDogc3RyaW5nLCBcbiAgICBpbnB1dDogUmVtb3ZlTWVtYmVySW5wdXQsIFxuICAgIGF1dGhDb250ZXh0OiBBdXRoQ29udGV4dFxuICApOiBQcm9taXNlPENsdWJNZW1iZXJzaGlwPiB7XG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdSZW1vdmluZyBjbHViIG1lbWJlcicsIHtcbiAgICAgIGNsdWJJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgdGFyZ2V0VXNlcklkLFxuICAgICAgcmVhc29uOiBpbnB1dC5yZWFzb24sXG4gICAgICBvcGVyYXRpb246ICdyZW1vdmVfbWVtYmVyJyxcbiAgICB9KTtcblxuICAgIC8vIFZhbGlkYXRlIGlucHV0XG4gICAgdGhpcy52YWxpZGF0ZVJlbW92ZU1lbWJlcklucHV0KGlucHV0KTtcblxuICAgIC8vIEdldCB0YXJnZXQgbWVtYmVyJ3MgbWVtYmVyc2hpcFxuICAgIGNvbnN0IHRhcmdldE1lbWJlcnNoaXAgPSBhd2FpdCB0aGlzLm1lbWJlcnNoaXBSZXBvc2l0b3J5LmdldE1lbWJlcnNoaXBCeUNsdWJBbmRVc2VyKGNsdWJJZCwgdGFyZ2V0VXNlcklkKTtcbiAgICBpZiAoIXRhcmdldE1lbWJlcnNoaXAgfHwgdGFyZ2V0TWVtYmVyc2hpcC5zdGF0dXMgIT09IE1lbWJlcnNoaXBTdGF0dXMuQUNUSVZFKSB7XG4gICAgICB0aHJvdyBuZXcgTWVtYmVyc2hpcE5vdEZvdW5kRXJyb3IodW5kZWZpbmVkLCBjbHViSWQsIHRhcmdldFVzZXJJZCk7XG4gICAgfVxuXG4gICAgLy8gQ2Fubm90IHJlbW92ZSBvd25lcnMgKG11c3QgdHJhbnNmZXIgb3duZXJzaGlwIGZpcnN0KVxuICAgIGlmICh0YXJnZXRNZW1iZXJzaGlwLnJvbGUgPT09IENsdWJSb2xlLk9XTkVSKSB7XG4gICAgICB0aHJvdyBuZXcgQ2Fubm90UmVtb3ZlT3duZXJFcnJvcihjbHViSWQsIHRhcmdldFVzZXJJZCk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgdXNlciBjYW4gbWFuYWdlIHRoaXMgbWVtYmVyXG4gICAgY29uc3QgY2FuTWFuYWdlID0gYXdhaXQgdGhpcy5hdXRoU2VydmljZS5jYW5NYW5hZ2VNZW1iZXIoYXV0aENvbnRleHQsIGNsdWJJZCwgdGFyZ2V0TWVtYmVyc2hpcC5yb2xlKTtcbiAgICBpZiAoIWNhbk1hbmFnZSkge1xuICAgICAgdGhyb3cgbmV3IE1lbWJlcnNoaXBPcGVyYXRpb25Ob3RBbGxvd2VkRXJyb3IoXG4gICAgICAgICdyZW1vdmVfbWVtYmVyJyxcbiAgICAgICAgdGFyZ2V0TWVtYmVyc2hpcC5tZW1iZXJzaGlwSWQsXG4gICAgICAgICdJbnN1ZmZpY2llbnQgcHJpdmlsZWdlcyB0byByZW1vdmUgdGhpcyBtZW1iZXInXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSBtZW1iZXJzaGlwXG4gICAgY29uc3QgdXBkYXRlZE1lbWJlcnNoaXAgPSBhd2FpdCB0aGlzLm1lbWJlcnNoaXBSZXBvc2l0b3J5LnJlbW92ZU1lbWJlcnNoaXAoXG4gICAgICB0YXJnZXRNZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgIGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGlucHV0LnJlYXNvblxuICAgICk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ01lbWJlciByZW1vdmVkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIGNsdWJJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgdGFyZ2V0VXNlcklkLFxuICAgICAgbWVtYmVyc2hpcElkOiB0YXJnZXRNZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgIHJlYXNvbjogaW5wdXQucmVhc29uLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHVwZGF0ZWRNZW1iZXJzaGlwO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyJ3MgY2x1YiBtZW1iZXJzaGlwc1xuICAgKiBcbiAgICogQHBhcmFtIGF1dGhDb250ZXh0IC0gQXV0aGVudGljYXRpb24gY29udGV4dFxuICAgKiBAcGFyYW0gc3RhdHVzIC0gT3B0aW9uYWwgc3RhdHVzIGZpbHRlclxuICAgKiBAcmV0dXJucyBMaXN0IG9mIHVzZXIncyBjbHViIG1lbWJlcnNoaXBzXG4gICAqL1xuICBhc3luYyBnZXRVc2VyTWVtYmVyc2hpcHMoXG4gICAgYXV0aENvbnRleHQ6IEF1dGhDb250ZXh0LCBcbiAgICBzdGF0dXM/OiBNZW1iZXJzaGlwU3RhdHVzXG4gICk6IFByb21pc2U8VXNlck1lbWJlcnNoaXBTdW1tYXJ5W10+IHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0dldHRpbmcgdXNlciBtZW1iZXJzaGlwcycsIHtcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgc3RhdHVzLFxuICAgICAgb3BlcmF0aW9uOiAnZ2V0X3VzZXJfbWVtYmVyc2hpcHMnLFxuICAgIH0pO1xuXG4gICAgY29uc3QgbWVtYmVyc2hpcHMgPSBhd2FpdCB0aGlzLm1lbWJlcnNoaXBSZXBvc2l0b3J5Lmxpc3RVc2VyTWVtYmVyc2hpcHMoYXV0aENvbnRleHQudXNlcklkLCBzdGF0dXMpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdVc2VyIG1lbWJlcnNoaXBzIHJldHJpZXZlZCcsIHtcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgbWVtYmVyc2hpcENvdW50OiBtZW1iZXJzaGlwcy5sZW5ndGgsXG4gICAgICBzdGF0dXMsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWVtYmVyc2hpcHM7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIncyByb2xlIGluIGNsdWJcbiAgICogXG4gICAqIEBwYXJhbSBjbHViSWQgLSBDbHViIElEXG4gICAqIEBwYXJhbSB1c2VySWQgLSBVc2VyIElEXG4gICAqIEByZXR1cm5zIFVzZXIncyByb2xlIGlmIHRoZXkgYXJlIGFuIGFjdGl2ZSBtZW1iZXIsIG51bGwgb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBnZXRVc2VyUm9sZUluQ2x1YihjbHViSWQ6IHN0cmluZywgdXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPENsdWJSb2xlIHwgbnVsbD4ge1xuICAgIHJldHVybiB0aGlzLm1lbWJlcnNoaXBSZXBvc2l0b3J5LmdldFVzZXJSb2xlSW5DbHViKGNsdWJJZCwgdXNlcklkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB1c2VyIGlzIGNsdWIgbWVtYmVyXG4gICAqIFxuICAgKiBAcGFyYW0gY2x1YklkIC0gQ2x1YiBJRFxuICAgKiBAcGFyYW0gdXNlcklkIC0gVXNlciBJRFxuICAgKiBAcmV0dXJucyBUcnVlIGlmIHVzZXIgaXMgYW4gYWN0aXZlIG1lbWJlclxuICAgKi9cbiAgYXN5bmMgaXNVc2VyTWVtYmVyKGNsdWJJZDogc3RyaW5nLCB1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLm1lbWJlcnNoaXBSZXBvc2l0b3J5LmlzVXNlck1lbWJlcihjbHViSWQsIHVzZXJJZCk7XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgam9pbiBjbHViIGlucHV0XG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlSm9pbkNsdWJJbnB1dChpbnB1dDogSm9pbkNsdWJJbnB1dCk6IHZvaWQge1xuICAgIGlmIChpbnB1dC5tZXNzYWdlICYmIGlucHV0Lm1lc3NhZ2UubGVuZ3RoID4gTUVNQkVSU0hJUF9DT05TVFJBSU5UUy5KT0lOX01FU1NBR0VfTUFYX0xFTkdUSCkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcihgSm9pbiBtZXNzYWdlIG11c3Qgbm90IGV4Y2VlZCAke01FTUJFUlNISVBfQ09OU1RSQUlOVFMuSk9JTl9NRVNTQUdFX01BWF9MRU5HVEh9IGNoYXJhY3RlcnNgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgdXBkYXRlIG1lbWJlciBpbnB1dFxuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZVVwZGF0ZU1lbWJlcklucHV0KGlucHV0OiBVcGRhdGVNZW1iZXJJbnB1dCk6IHZvaWQge1xuICAgIGlmICghT2JqZWN0LnZhbHVlcyhDbHViUm9sZSkuaW5jbHVkZXMoaW5wdXQucm9sZSkpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0ludmFsaWQgY2x1YiByb2xlJyk7XG4gICAgfVxuXG4gICAgaWYgKGlucHV0LnJlYXNvbiAmJiBpbnB1dC5yZWFzb24ubGVuZ3RoID4gTUVNQkVSU0hJUF9DT05TVFJBSU5UUy5SRUFTT05fTUFYX0xFTkdUSCkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcihgUmVhc29uIG11c3Qgbm90IGV4Y2VlZCAke01FTUJFUlNISVBfQ09OU1RSQUlOVFMuUkVBU09OX01BWF9MRU5HVEh9IGNoYXJhY3RlcnNgKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgcmVtb3ZlIG1lbWJlciBpbnB1dFxuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZVJlbW92ZU1lbWJlcklucHV0KGlucHV0OiBSZW1vdmVNZW1iZXJJbnB1dCk6IHZvaWQge1xuICAgIGlmIChpbnB1dC5yZWFzb24gJiYgaW5wdXQucmVhc29uLmxlbmd0aCA+IE1FTUJFUlNISVBfQ09OU1RSQUlOVFMuUkVBU09OX01BWF9MRU5HVEgpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoYFJlYXNvbiBtdXN0IG5vdCBleGNlZWQgJHtNRU1CRVJTSElQX0NPTlNUUkFJTlRTLlJFQVNPTl9NQVhfTEVOR1RIfSBjaGFyYWN0ZXJzYCk7XG4gICAgfVxuICB9XG59Il19