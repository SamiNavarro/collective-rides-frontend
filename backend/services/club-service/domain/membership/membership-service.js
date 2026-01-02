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
        if (existingMembership && existingMembership.status !== membership_1.MembershipStatus.REMOVED) {
            throw new membership_errors_1.AlreadyMemberError(clubId, authContext.userId);
        }
        // Determine initial status based on club settings
        // For Phase 2.2, assume all clubs are public (auto-approve)
        // Future phases can add private club logic
        const initialStatus = membership_1.MembershipStatus.ACTIVE;
        // Create membership
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
        // Remove membership
        const updatedMembership = await this.membershipRepository.removeMembership(membership.membershipId, authContext.userId, 'Voluntary departure');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVtYmVyc2hpcC1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibWVtYmVyc2hpcC1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBRUgsb0VBVzZDO0FBRTdDLDREQUFnRztBQUNoRyx3RUFBc0U7QUFHdEUsMkRBSzZCO0FBQzdCLDRFQUErRTtBQUcvRTs7R0FFRztBQUNILE1BQWEsaUJBQWlCO0lBRzVCLFlBQ1Usb0JBQTJDLEVBQzNDLGNBQStCLEVBQy9CLG9CQUEyQztRQUYzQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1FBQzNDLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtRQUMvQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1FBRW5ELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSw2Q0FBd0IsQ0FBQyxvQkFBb0IsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0lBQzlGLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFjLEVBQUUsS0FBb0IsRUFBRSxXQUF3QjtRQUMzRSxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLDhCQUE4QixFQUFFO1lBQ3BELE1BQU07WUFDTixNQUFNLEVBQUUsV0FBVyxDQUFDLE1BQU07WUFDMUIsU0FBUyxFQUFFLFdBQVc7U0FDdkIsQ0FBQyxDQUFDO1FBRUgsaUJBQWlCO1FBQ2pCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVsQyx1QkFBdUI7UUFDdkIsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzRCxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1QsTUFBTSxJQUFJLHNCQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUMzQztRQUVELG9DQUFvQztRQUNwQyxNQUFNLGtCQUFrQixHQUFHLE1BQU0sSUFBSSxD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LDBCQUEwQixtQ0FBc0IsQ0FBQyxpQkFBaUIsYUFBYSxDQUFDLENBQUM7U0FDNUc7SUFDSCxDQUFDO0NBQ0Y7QUFqWEQsOENBaVhDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDbHViIE1lbWJlcnNoaXAgU2VydmljZSAtIFBoYXNlIDIuMlxuICogXG4gKiBCdXNpbmVzcyBsb2dpYyBsYXllciBmb3IgY2x1YiBtZW1iZXJzaGlwIG9wZXJhdGlvbnMuXG4gKiBIYW5kbGVzIG1lbWJlcnNoaXAgbGlmZWN5Y2xlLCByb2xlIG1hbmFnZW1lbnQsIGFuZCBidXNpbmVzcyBydWxlcy5cbiAqIFxuICogQ29tcGxpYW5jZTpcbiAqIC0gUGhhc2UgMi4yIFNwZWM6IC5raXJvL3NwZWNzL3BoYXNlLTIuMi5jbHViLW1lbWJlcnNoaXAtcm9sZXMudjEubWRcbiAqL1xuXG5pbXBvcnQgeyBcbiAgQ2x1Yk1lbWJlcnNoaXAsIFxuICBDbHViUm9sZSwgXG4gIE1lbWJlcnNoaXBTdGF0dXMsIFxuICBKb2luQ2x1YklucHV0LCBcbiAgVXBkYXRlTWVtYmVySW5wdXQsXG4gIFJlbW92ZU1lbWJlcklucHV0LFxuICBMaXN0TWVtYmVyc09wdGlvbnMsIFxuICBMaXN0TWVtYmVyc1Jlc3VsdCxcbiAgVXNlck1lbWJlcnNoaXBTdW1tYXJ5LFxuICBNRU1CRVJTSElQX0NPTlNUUkFJTlRTXG59IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9tZW1iZXJzaGlwJztcbmltcG9ydCB7IEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL2F1dGgnO1xuaW1wb3J0IHsgTm90Rm91bmRFcnJvciwgVmFsaWRhdGlvbkVycm9yLCBDb25mbGljdEVycm9yIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2Vycm9ycyc7XG5pbXBvcnQgeyBsb2dTdHJ1Y3R1cmVkIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBJTWVtYmVyc2hpcFJlcG9zaXRvcnkgfSBmcm9tICcuL21lbWJlcnNoaXAtcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBJQ2x1YlJlcG9zaXRvcnkgfSBmcm9tICcuLi9jbHViLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgXG4gIEFscmVhZHlNZW1iZXJFcnJvciwgXG4gIE1lbWJlcnNoaXBOb3RGb3VuZEVycm9yLCBcbiAgQ2Fubm90UmVtb3ZlT3duZXJFcnJvcixcbiAgTWVtYmVyc2hpcE9wZXJhdGlvbk5vdEFsbG93ZWRFcnJvclxufSBmcm9tICcuL21lbWJlcnNoaXAtZXJyb3JzJztcbmltcG9ydCB7IENsdWJBdXRob3JpemF0aW9uU2VydmljZSB9IGZyb20gJy4uL2F1dGhvcml6YXRpb24vY2x1Yi1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IElBdXRob3JpemF0aW9uU2VydmljZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRob3JpemF0aW9uL3R5cGVzJztcblxuLyoqXG4gKiBDbHViIG1lbWJlcnNoaXAgc2VydmljZSBpbXBsZW1lbnRhdGlvblxuICovXG5leHBvcnQgY2xhc3MgTWVtYmVyc2hpcFNlcnZpY2Uge1xuICBwcml2YXRlIGF1dGhTZXJ2aWNlOiBDbHViQXV0aG9yaXphdGlvblNlcnZpY2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBtZW1iZXJzaGlwUmVwb3NpdG9yeTogSU1lbWJlcnNoaXBSZXBvc2l0b3J5LFxuICAgIHByaXZhdGUgY2x1YlJlcG9zaXRvcnk6IElDbHViUmVwb3NpdG9yeSxcbiAgICBwcml2YXRlIGF1dGhvcml6YXRpb25TZXJ2aWNlOiBJQXV0aG9yaXphdGlvblNlcnZpY2VcbiAgKSB7XG4gICAgdGhpcy5hdXRoU2VydmljZSA9IG5ldyBDbHViQXV0aG9yaXphdGlvblNlcnZpY2UobWVtYmVyc2hpcFJlcG9zaXRvcnksIGF1dGhvcml6YXRpb25TZXJ2aWNlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBKb2luIGEgY2x1YiAoY3JlYXRlIG1lbWJlcnNoaXAgcmVxdWVzdClcbiAgICogXG4gICAqIEBwYXJhbSBjbHViSWQgLSBDbHViIElEXG4gICAqIEBwYXJhbSBpbnB1dCAtIEpvaW4gY2x1YiBpbnB1dFxuICAgKiBAcGFyYW0gYXV0aENvbnRleHQgLSBBdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gICAqIEByZXR1cm5zIENyZWF0ZWQgbWVtYmVyc2hpcFxuICAgKi9cbiAgYXN5bmMgam9pbkNsdWIoY2x1YklkOiBzdHJpbmcsIGlucHV0OiBKb2luQ2x1YklucHV0LCBhdXRoQ29udGV4dDogQXV0aENvbnRleHQpOiBQcm9taXNlPENsdWJNZW1iZXJzaGlwPiB7XG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdQcm9jZXNzaW5nIGNsdWIgam9pbiByZXF1ZXN0Jywge1xuICAgICAgY2x1YklkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBvcGVyYXRpb246ICdqb2luX2NsdWInLFxuICAgIH0pO1xuXG4gICAgLy8gVmFsaWRhdGUgaW5wdXRcbiAgICB0aGlzLnZhbGlkYXRlSm9pbkNsdWJJbnB1dChpbnB1dCk7XG5cbiAgICAvLyBDaGVjayBpZiBjbHViIGV4aXN0c1xuICAgIGNvbnN0IGNsdWIgPSBhd2FpdCB0aGlzLmNsdWJSZXBvc2l0b3J5LmdldENsdWJCeUlkKGNsdWJJZCk7XG4gICAgaWYgKCFjbHViKSB7XG4gICAgICB0aHJvdyBuZXcgTm90Rm91bmRFcnJvcignQ2x1YiBub3QgZm91bmQnKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiB1c2VyIGlzIGFscmVhZHkgYSBtZW1iZXJcbiAgICBjb25zdCBleGlzdGluZ01lbWJlcnNoaXAgPSBhd2FpdCB0aGlzLm1lbWJlcnNoaXBSZXBvc2l0b3J5LmdldE1lbWJlcnNoaXBCeUNsdWJBbmRVc2VyKGNsdWJJZCwgYXV0aENvbnRleHQudXNlcklkKTtcbiAgICBpZiAoZXhpc3RpbmdNZW1iZXJzaGlwICYmIGV4aXN0aW5nTWVtYmVyc2hpcC5zdGF0dXMgIT09IE1lbWJlcnNoaXBTdGF0dXMuUkVNT1ZFRCkge1xuICAgICAgdGhyb3cgbmV3IEFscmVhZHlNZW1iZXJFcnJvcihjbHViSWQsIGF1dGhDb250ZXh0LnVzZXJJZCk7XG4gICAgfVxuXG4gICAgLy8gRGV0ZXJtaW5lIGluaXRpYWwgc3RhdHVzIGJhc2VkIG9uIGNsdWIgc2V0dGluZ3NcbiAgICAvLyBGb3IgUGhhc2UgMi4yLCBhc3N1bWUgYWxsIGNsdWJzIGFyZSBwdWJsaWMgKGF1dG8tYXBwcm92ZSlcbiAgICAvLyBGdXR1cmUgcGhhc2VzIGNhbiBhZGQgcHJpdmF0ZSBjbHViIGxvZ2ljXG4gICAgY29uc3QgaW5pdGlhbFN0YXR1cyA9IE1lbWJlcnNoaXBTdGF0dXMuQUNUSVZFO1xuXG4gICAgLy8gQ3JlYXRlIG1lbWJlcnNoaXBcbiAgICBjb25zdCBtZW1iZXJzaGlwID0gYXdhaXQgdGhpcy5tZW1iZXJzaGlwUmVwb3NpdG9yeS5jcmVhdGVNZW1iZXJzaGlwKFxuICAgICAgY2x1YklkLFxuICAgICAgYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgaW5wdXQsXG4gICAgICBDbHViUm9sZS5NRU1CRVIsXG4gICAgICBpbml0aWFsU3RhdHVzXG4gICAgKTtcblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnVXNlciBqb2luZWQgY2x1YiBzdWNjZXNzZnVsbHknLCB7XG4gICAgICBjbHViSWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIG1lbWJlcnNoaXBJZDogbWVtYmVyc2hpcC5tZW1iZXJzaGlwSWQsXG4gICAgICBzdGF0dXM6IG1lbWJlcnNoaXAuc3RhdHVzLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1lbWJlcnNoaXA7XG4gIH1cblxuICAvKipcbiAgICogTGVhdmUgYSBjbHViICh2b2x1bnRhcnkgZGVwYXJ0dXJlKVxuICAgKiBcbiAgICogQHBhcmFtIGNsdWJJZCAtIENsdWIgSURcbiAgICogQHBhcmFtIGF1dGhDb250ZXh0IC0gQXV0aGVudGljYXRpb24gY29udGV4dFxuICAgKiBAcmV0dXJucyBVcGRhdGVkIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIGxlYXZlQ2x1YihjbHViSWQ6IHN0cmluZywgYXV0aENvbnRleHQ6IEF1dGhDb250ZXh0KTogUHJvbWlzZTxDbHViTWVtYmVyc2hpcD4ge1xuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnUHJvY2Vzc2luZyBjbHViIGxlYXZlIHJlcXVlc3QnLCB7XG4gICAgICBjbHViSWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIG9wZXJhdGlvbjogJ2xlYXZlX2NsdWInLFxuICAgIH0pO1xuXG4gICAgLy8gR2V0IHVzZXIncyBtZW1iZXJzaGlwXG4gICAgY29uc3QgbWVtYmVyc2hpcCA9IGF3YWl0IHRoaXMubWVtYmVyc2hpcFJlcG9zaXRvcnkuZ2V0TWVtYmVyc2hpcEJ5Q2x1YkFuZFVzZXIoY2x1YklkLCBhdXRoQ29udGV4dC51c2VySWQpO1xuICAgIGlmICghbWVtYmVyc2hpcCB8fCBtZW1iZXJzaGlwLnN0YXR1cyAhPT0gTWVtYmVyc2hpcFN0YXR1cy5BQ1RJVkUpIHtcbiAgICAgIHRocm93IG5ldyBNZW1iZXJzaGlwTm90Rm91bmRFcnJvcih1bmRlZmluZWQsIGNsdWJJZCwgYXV0aENvbnRleHQudXNlcklkKTtcbiAgICB9XG5cbiAgICAvLyBPd25lcnMgY2Fubm90IGxlYXZlIChtdXN0IHRyYW5zZmVyIG93bmVyc2hpcCBmaXJzdClcbiAgICBpZiAobWVtYmVyc2hpcC5yb2xlID09PSBDbHViUm9sZS5PV05FUikge1xuICAgICAgdGhyb3cgbmV3IE1lbWJlcnNoaXBPcGVyYXRpb25Ob3RBbGxvd2VkRXJyb3IoXG4gICAgICAgICdsZWF2ZV9jbHViJywgXG4gICAgICAgIG1lbWJlcnNoaXAubWVtYmVyc2hpcElkLCBcbiAgICAgICAgJ093bmVycyBjYW5ub3QgbGVhdmUgLSBvd25lcnNoaXAgdHJhbnNmZXIgcmVxdWlyZWQnXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIFJlbW92ZSBtZW1iZXJzaGlwXG4gICAgY29uc3QgdXBkYXRlZE1lbWJlcnNoaXAgPSBhd2FpdCB0aGlzLm1lbWJlcnNoaXBSZXBvc2l0b3J5LnJlbW92ZU1lbWJlcnNoaXAoXG4gICAgICBtZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgIGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgICdWb2x1bnRhcnkgZGVwYXJ0dXJlJ1xuICAgICk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1VzZXIgbGVmdCBjbHViIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIGNsdWJJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICB9KTtcblxuICAgIHJldHVybiB1cGRhdGVkTWVtYmVyc2hpcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGNsdWIgbWVtYmVyc1xuICAgKiBcbiAgICogQHBhcmFtIGNsdWJJZCAtIENsdWIgSURcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBMaXN0IG9wdGlvbnNcbiAgICogQHBhcmFtIGF1dGhDb250ZXh0IC0gQXV0aGVudGljYXRpb24gY29udGV4dFxuICAgKiBAcmV0dXJucyBQYWdpbmF0ZWQgbGlzdCBvZiBjbHViIG1lbWJlcnNcbiAgICovXG4gIGFzeW5jIGxpc3RDbHViTWVtYmVycyhcbiAgICBjbHViSWQ6IHN0cmluZywgXG4gICAgb3B0aW9uczogTGlzdE1lbWJlcnNPcHRpb25zLCBcbiAgICBhdXRoQ29udGV4dDogQXV0aENvbnRleHRcbiAgKTogUHJvbWlzZTxMaXN0TWVtYmVyc1Jlc3VsdD4ge1xuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnTGlzdGluZyBjbHViIG1lbWJlcnMnLCB7XG4gICAgICBjbHViSWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGxpbWl0OiBvcHRpb25zLmxpbWl0LFxuICAgICAgcm9sZTogb3B0aW9ucy5yb2xlLFxuICAgICAgc3RhdHVzOiBvcHRpb25zLnN0YXR1cyxcbiAgICAgIG9wZXJhdGlvbjogJ2xpc3RfY2x1Yl9tZW1iZXJzJyxcbiAgICB9KTtcblxuICAgIC8vIFZhbGlkYXRlIG9wdGlvbnNcbiAgICBjb25zdCBsaW1pdCA9IE1hdGgubWluKFxuICAgICAgb3B0aW9ucy5saW1pdCB8fCBNRU1CRVJTSElQX0NPTlNUUkFJTlRTLkRFRkFVTFRfTElTVF9MSU1JVCxcbiAgICAgIE1FTUJFUlNISVBfQ09OU1RSQUlOVFMuTUFYX0xJU1RfTElNSVRcbiAgICApO1xuXG4gICAgLy8gQ2hlY2sgaWYgY2x1YiBleGlzdHNcbiAgICBjb25zdCBjbHViID0gYXdhaXQgdGhpcy5jbHViUmVwb3NpdG9yeS5nZXRDbHViQnlJZChjbHViSWQpO1xuICAgIGlmICghY2x1Yikge1xuICAgICAgdGhyb3cgbmV3IE5vdEZvdW5kRXJyb3IoJ0NsdWIgbm90IGZvdW5kJyk7XG4gICAgfVxuXG4gICAgLy8gTGlzdCBtZW1iZXJzXG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5tZW1iZXJzaGlwUmVwb3NpdG9yeS5saXN0Q2x1Yk1lbWJlcnMoY2x1YklkLCB7XG4gICAgICAuLi5vcHRpb25zLFxuICAgICAgbGltaXQsXG4gICAgfSk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0NsdWIgbWVtYmVycyBsaXN0ZWQgc3VjY2Vzc2Z1bGx5Jywge1xuICAgICAgY2x1YklkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICByZXN1bHRDb3VudDogcmVzdWx0Lm1lbWJlcnMubGVuZ3RoLFxuICAgICAgaGFzTmV4dEN1cnNvcjogISFyZXN1bHQubmV4dEN1cnNvcixcbiAgICB9KTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIG1lbWJlciByb2xlXG4gICAqIFxuICAgKiBAcGFyYW0gY2x1YklkIC0gQ2x1YiBJRFxuICAgKiBAcGFyYW0gdGFyZ2V0VXNlcklkIC0gVGFyZ2V0IHVzZXIgSURcbiAgICogQHBhcmFtIGlucHV0IC0gVXBkYXRlIG1lbWJlciBpbnB1dFxuICAgKiBAcGFyYW0gYXV0aENvbnRleHQgLSBBdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gICAqIEByZXR1cm5zIFVwZGF0ZWQgbWVtYmVyc2hpcFxuICAgKi9cbiAgYXN5bmMgdXBkYXRlTWVtYmVyUm9sZShcbiAgICBjbHViSWQ6IHN0cmluZywgXG4gICAgdGFyZ2V0VXNlcklkOiBzdHJpbmcsIFxuICAgIGlucHV0OiBVcGRhdGVNZW1iZXJJbnB1dCwgXG4gICAgYXV0aENvbnRleHQ6IEF1dGhDb250ZXh0XG4gICk6IFByb21pc2U8Q2x1Yk1lbWJlcnNoaXA+IHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1VwZGF0aW5nIG1lbWJlciByb2xlJywge1xuICAgICAgY2x1YklkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICB0YXJnZXRVc2VySWQsXG4gICAgICBuZXdSb2xlOiBpbnB1dC5yb2xlLFxuICAgICAgb3BlcmF0aW9uOiAndXBkYXRlX21lbWJlcl9yb2xlJyxcbiAgICB9KTtcblxuICAgIC8vIFZhbGlkYXRlIGlucHV0XG4gICAgdGhpcy52YWxpZGF0ZVVwZGF0ZU1lbWJlcklucHV0KGlucHV0KTtcblxuICAgIC8vIEdldCB0YXJnZXQgbWVtYmVyJ3MgbWVtYmVyc2hpcFxuICAgIGNvbnN0IHRhcmdldE1lbWJlcnNoaXAgPSBhd2FpdCB0aGlzLm1lbWJlcnNoaXBSZXBvc2l0b3J5LmdldE1lbWJlcnNoaXBCeUNsdWJBbmRVc2VyKGNsdWJJZCwgdGFyZ2V0VXNlcklkKTtcbiAgICBpZiAoIXRhcmdldE1lbWJlcnNoaXAgfHwgdGFyZ2V0TWVtYmVyc2hpcC5zdGF0dXMgIT09IE1lbWJlcnNoaXBTdGF0dXMuQUNUSVZFKSB7XG4gICAgICB0aHJvdyBuZXcgTWVtYmVyc2hpcE5vdEZvdW5kRXJyb3IodW5kZWZpbmVkLCBjbHViSWQsIHRhcmdldFVzZXJJZCk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgYXV0aG9yaXphdGlvbiBmb3Igcm9sZSBhc3NpZ25tZW50XG4gICAgYXdhaXQgdGhpcy5hdXRoU2VydmljZS52YWxpZGF0ZVJvbGVBc3NpZ25tZW50KGF1dGhDb250ZXh0LCBjbHViSWQsIGlucHV0LnJvbGUpO1xuXG4gICAgLy8gQ2hlY2sgaWYgdXNlciBjYW4gbWFuYWdlIHRoaXMgbWVtYmVyXG4gICAgY29uc3QgY2FuTWFuYWdlID0gYXdhaXQgdGhpcy5hdXRoU2VydmljZS5jYW5NYW5hZ2VNZW1iZXIoYXV0aENvbnRleHQsIGNsdWJJZCwgdGFyZ2V0TWVtYmVyc2hpcC5yb2xlKTtcbiAgICBpZiAoIWNhbk1hbmFnZSkge1xuICAgICAgdGhyb3cgbmV3IE1lbWJlcnNoaXBPcGVyYXRpb25Ob3RBbGxvd2VkRXJyb3IoXG4gICAgICAgICd1cGRhdGVfbWVtYmVyX3JvbGUnLFxuICAgICAgICB0YXJnZXRNZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgICAgJ0luc3VmZmljaWVudCBwcml2aWxlZ2VzIHRvIG1hbmFnZSB0aGlzIG1lbWJlcidcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gVXBkYXRlIG1lbWJlcnNoaXAgcm9sZVxuICAgIGNvbnN0IHVwZGF0ZWRNZW1iZXJzaGlwID0gYXdhaXQgdGhpcy5tZW1iZXJzaGlwUmVwb3NpdG9yeS51cGRhdGVNZW1iZXJzaGlwUm9sZShcbiAgICAgIHRhcmdldE1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgaW5wdXQsXG4gICAgICBhdXRoQ29udGV4dC51c2VySWRcbiAgICApO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdNZW1iZXIgcm9sZSB1cGRhdGVkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIGNsdWJJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgdGFyZ2V0VXNlcklkLFxuICAgICAgbWVtYmVyc2hpcElkOiB0YXJnZXRNZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgIHByZXZpb3VzUm9sZTogdGFyZ2V0TWVtYmVyc2hpcC5yb2xlLFxuICAgICAgbmV3Um9sZTogdXBkYXRlZE1lbWJlcnNoaXAucm9sZSxcbiAgICB9KTtcblxuICAgIHJldHVybiB1cGRhdGVkTWVtYmVyc2hpcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgbWVtYmVyIGZyb20gY2x1YlxuICAgKiBcbiAgICogQHBhcmFtIGNsdWJJZCAtIENsdWIgSURcbiAgICogQHBhcmFtIHRhcmdldFVzZXJJZCAtIFRhcmdldCB1c2VyIElEXG4gICAqIEBwYXJhbSBpbnB1dCAtIFJlbW92ZSBtZW1iZXIgaW5wdXRcbiAgICogQHBhcmFtIGF1dGhDb250ZXh0IC0gQXV0aGVudGljYXRpb24gY29udGV4dFxuICAgKiBAcmV0dXJucyBVcGRhdGVkIG1lbWJlcnNoaXBcbiAgICovXG4gIGFzeW5jIHJlbW92ZU1lbWJlcihcbiAgICBjbHViSWQ6IHN0cmluZywgXG4gICAgdGFyZ2V0VXNlcklkOiBzdHJpbmcsIFxuICAgIGlucHV0OiBSZW1vdmVNZW1iZXJJbnB1dCwgXG4gICAgYXV0aENvbnRleHQ6IEF1dGhDb250ZXh0XG4gICk6IFByb21pc2U8Q2x1Yk1lbWJlcnNoaXA+IHtcbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1JlbW92aW5nIGNsdWIgbWVtYmVyJywge1xuICAgICAgY2x1YklkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICB0YXJnZXRVc2VySWQsXG4gICAgICByZWFzb246IGlucHV0LnJlYXNvbixcbiAgICAgIG9wZXJhdGlvbjogJ3JlbW92ZV9tZW1iZXInLFxuICAgIH0pO1xuXG4gICAgLy8gVmFsaWRhdGUgaW5wdXRcbiAgICB0aGlzLnZhbGlkYXRlUmVtb3ZlTWVtYmVySW5wdXQoaW5wdXQpO1xuXG4gICAgLy8gR2V0IHRhcmdldCBtZW1iZXIncyBtZW1iZXJzaGlwXG4gICAgY29uc3QgdGFyZ2V0TWVtYmVyc2hpcCA9IGF3YWl0IHRoaXMubWVtYmVyc2hpcFJlcG9zaXRvcnkuZ2V0TWVtYmVyc2hpcEJ5Q2x1YkFuZFVzZXIoY2x1YklkLCB0YXJnZXRVc2VySWQpO1xuICAgIGlmICghdGFyZ2V0TWVtYmVyc2hpcCB8fCB0YXJnZXRNZW1iZXJzaGlwLnN0YXR1cyAhPT0gTWVtYmVyc2hpcFN0YXR1cy5BQ1RJVkUpIHtcbiAgICAgIHRocm93IG5ldyBNZW1iZXJzaGlwTm90Rm91bmRFcnJvcih1bmRlZmluZWQsIGNsdWJJZCwgdGFyZ2V0VXNlcklkKTtcbiAgICB9XG5cbiAgICAvLyBDYW5ub3QgcmVtb3ZlIG93bmVycyAobXVzdCB0cmFuc2ZlciBvd25lcnNoaXAgZmlyc3QpXG4gICAgaWYgKHRhcmdldE1lbWJlcnNoaXAucm9sZSA9PT0gQ2x1YlJvbGUuT1dORVIpIHtcbiAgICAgIHRocm93IG5ldyBDYW5ub3RSZW1vdmVPd25lckVycm9yKGNsdWJJZCwgdGFyZ2V0VXNlcklkKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiB1c2VyIGNhbiBtYW5hZ2UgdGhpcyBtZW1iZXJcbiAgICBjb25zdCBjYW5NYW5hZ2UgPSBhd2FpdCB0aGlzLmF1dGhTZXJ2aWNlLmNhbk1hbmFnZU1lbWJlcihhdXRoQ29udGV4dCwgY2x1YklkLCB0YXJnZXRNZW1iZXJzaGlwLnJvbGUpO1xuICAgIGlmICghY2FuTWFuYWdlKSB7XG4gICAgICB0aHJvdyBuZXcgTWVtYmVyc2hpcE9wZXJhdGlvbk5vdEFsbG93ZWRFcnJvcihcbiAgICAgICAgJ3JlbW92ZV9tZW1iZXInLFxuICAgICAgICB0YXJnZXRNZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgICAgJ0luc3VmZmljaWVudCBwcml2aWxlZ2VzIHRvIHJlbW92ZSB0aGlzIG1lbWJlcidcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIG1lbWJlcnNoaXBcbiAgICBjb25zdCB1cGRhdGVkTWVtYmVyc2hpcCA9IGF3YWl0IHRoaXMubWVtYmVyc2hpcFJlcG9zaXRvcnkucmVtb3ZlTWVtYmVyc2hpcChcbiAgICAgIHRhcmdldE1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgaW5wdXQucmVhc29uXG4gICAgKTtcblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnTWVtYmVyIHJlbW92ZWQgc3VjY2Vzc2Z1bGx5Jywge1xuICAgICAgY2x1YklkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICB0YXJnZXRVc2VySWQsXG4gICAgICBtZW1iZXJzaGlwSWQ6IHRhcmdldE1lbWJlcnNoaXAubWVtYmVyc2hpcElkLFxuICAgICAgcmVhc29uOiBpbnB1dC5yZWFzb24sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gdXBkYXRlZE1lbWJlcnNoaXA7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIncyBjbHViIG1lbWJlcnNoaXBzXG4gICAqIFxuICAgKiBAcGFyYW0gYXV0aENvbnRleHQgLSBBdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gICAqIEBwYXJhbSBzdGF0dXMgLSBPcHRpb25hbCBzdGF0dXMgZmlsdGVyXG4gICAqIEByZXR1cm5zIExpc3Qgb2YgdXNlcidzIGNsdWIgbWVtYmVyc2hpcHNcbiAgICovXG4gIGFzeW5jIGdldFVzZXJNZW1iZXJzaGlwcyhcbiAgICBhdXRoQ29udGV4dDogQXV0aENvbnRleHQsIFxuICAgIHN0YXR1cz86IE1lbWJlcnNoaXBTdGF0dXNcbiAgKTogUHJvbWlzZTxVc2VyTWVtYmVyc2hpcFN1bW1hcnlbXT4ge1xuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnR2V0dGluZyB1c2VyIG1lbWJlcnNoaXBzJywge1xuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBzdGF0dXMsXG4gICAgICBvcGVyYXRpb246ICdnZXRfdXNlcl9tZW1iZXJzaGlwcycsXG4gICAgfSk7XG5cbiAgICBjb25zdCBtZW1iZXJzaGlwcyA9IGF3YWl0IHRoaXMubWVtYmVyc2hpcFJlcG9zaXRvcnkubGlzdFVzZXJNZW1iZXJzaGlwcyhhdXRoQ29udGV4dC51c2VySWQsIHN0YXR1cyk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ1VzZXIgbWVtYmVyc2hpcHMgcmV0cmlldmVkJywge1xuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBtZW1iZXJzaGlwQ291bnQ6IG1lbWJlcnNoaXBzLmxlbmd0aCxcbiAgICAgIHN0YXR1cyxcbiAgICB9KTtcblxuICAgIHJldHVybiBtZW1iZXJzaGlwcztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdXNlcidzIHJvbGUgaW4gY2x1YlxuICAgKiBcbiAgICogQHBhcmFtIGNsdWJJZCAtIENsdWIgSURcbiAgICogQHBhcmFtIHVzZXJJZCAtIFVzZXIgSURcbiAgICogQHJldHVybnMgVXNlcidzIHJvbGUgaWYgdGhleSBhcmUgYW4gYWN0aXZlIG1lbWJlciwgbnVsbCBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGdldFVzZXJSb2xlSW5DbHViKGNsdWJJZDogc3RyaW5nLCB1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8Q2x1YlJvbGUgfCBudWxsPiB7XG4gICAgcmV0dXJuIHRoaXMubWVtYmVyc2hpcFJlcG9zaXRvcnkuZ2V0VXNlclJvbGVJbkNsdWIoY2x1YklkLCB1c2VySWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHVzZXIgaXMgY2x1YiBtZW1iZXJcbiAgICogXG4gICAqIEBwYXJhbSBjbHViSWQgLSBDbHViIElEXG4gICAqIEBwYXJhbSB1c2VySWQgLSBVc2VyIElEXG4gICAqIEByZXR1cm5zIFRydWUgaWYgdXNlciBpcyBhbiBhY3RpdmUgbWVtYmVyXG4gICAqL1xuICBhc3luYyBpc1VzZXJNZW1iZXIoY2x1YklkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMubWVtYmVyc2hpcFJlcG9zaXRvcnkuaXNVc2VyTWVtYmVyKGNsdWJJZCwgdXNlcklkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSBqb2luIGNsdWIgaW5wdXRcbiAgICovXG4gIHByaXZhdGUgdmFsaWRhdGVKb2luQ2x1YklucHV0KGlucHV0OiBKb2luQ2x1YklucHV0KTogdm9pZCB7XG4gICAgaWYgKGlucHV0Lm1lc3NhZ2UgJiYgaW5wdXQubWVzc2FnZS5sZW5ndGggPiBNRU1CRVJTSElQX0NPTlNUUkFJTlRTLkpPSU5fTUVTU0FHRV9NQVhfTEVOR1RIKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKGBKb2luIG1lc3NhZ2UgbXVzdCBub3QgZXhjZWVkICR7TUVNQkVSU0hJUF9DT05TVFJBSU5UUy5KT0lOX01FU1NBR0VfTUFYX0xFTkdUSH0gY2hhcmFjdGVyc2ApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSB1cGRhdGUgbWVtYmVyIGlucHV0XG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlVXBkYXRlTWVtYmVySW5wdXQoaW5wdXQ6IFVwZGF0ZU1lbWJlcklucHV0KTogdm9pZCB7XG4gICAgaWYgKCFPYmplY3QudmFsdWVzKENsdWJSb2xlKS5pbmNsdWRlcyhpbnB1dC5yb2xlKSkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignSW52YWxpZCBjbHViIHJvbGUnKTtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXQucmVhc29uICYmIGlucHV0LnJlYXNvbi5sZW5ndGggPiBNRU1CRVJTSElQX0NPTlNUUkFJTlRTLlJFQVNPTl9NQVhfTEVOR1RIKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKGBSZWFzb24gbXVzdCBub3QgZXhjZWVkICR7TUVNQkVSU0hJUF9DT05TVFJBSU5UUy5SRUFTT05fTUFYX0xFTkdUSH0gY2hhcmFjdGVyc2ApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBWYWxpZGF0ZSByZW1vdmUgbWVtYmVyIGlucHV0XG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlUmVtb3ZlTWVtYmVySW5wdXQoaW5wdXQ6IFJlbW92ZU1lbWJlcklucHV0KTogdm9pZCB7XG4gICAgaWYgKGlucHV0LnJlYXNvbiAmJiBpbnB1dC5yZWFzb24ubGVuZ3RoID4gTUVNQkVSU0hJUF9DT05TVFJBSU5UUy5SRUFTT05fTUFYX0xFTkdUSCkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcihgUmVhc29uIG11c3Qgbm90IGV4Y2VlZCAke01FTUJFUlNISVBfQ09OU1RSQUlOVFMuUkVBU09OX01BWF9MRU5HVEh9IGNoYXJhY3RlcnNgKTtcbiAgICB9XG4gIH1cbn0iXX0=