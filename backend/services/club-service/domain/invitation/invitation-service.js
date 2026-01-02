"use strict";
/**
 * Club Invitation Service - Phase 2.2
 *
 * Business logic layer for club invitation operations.
 * Handles dual invitation system (email and in-app) and invitation lifecycle.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationService = void 0;
const invitation_1 = require("../../../../shared/types/invitation");
const membership_1 = require("../../../../shared/types/membership");
const errors_1 = require("../../../../shared/utils/errors");
const lambda_utils_1 = require("../../../../shared/utils/lambda-utils");
const invitation_errors_1 = require("./invitation-errors");
const membership_errors_1 = require("../membership/membership-errors");
const club_authorization_1 = require("../authorization/club-authorization");
/**
 * Club invitation service implementation
 */
class InvitationService {
    constructor(invitationRepository, membershipRepository, clubRepository, userRepository, authorizationService) {
        this.invitationRepository = invitationRepository;
        this.membershipRepository = membershipRepository;
        this.clubRepository = clubRepository;
        this.userRepository = userRepository;
        this.authorizationService = authorizationService;
        this.authService = new club_authorization_1.ClubAuthorizationService(membershipRepository, authorizationService);
    }
    /**
     * Create club invitation (email or user invitation)
     *
     * @param clubId - Club ID
     * @param input - Invitation creation input
     * @param authContext - Authentication context
     * @returns Created invitation
     */
    async createInvitation(clubId, input, authContext) {
        (0, lambda_utils_1.logStructured)('INFO', 'Creating club invitation', {
            clubId,
            userId: authContext.userId,
            invitationType: input.type,
            targetRole: input.role,
            operation: 'create_invitation',
        });
        // Validate input
        this.validateCreateInvitationInput(input);
        // Check if club exists
        const club = await this.clubRepository.getClubById(clubId);
        if (!club) {
            throw new errors_1.NotFoundError('Club not found');
        }
        // Type-specific validation and checks
        if (input.type === 'user') {
            await this.validateUserInvitation(clubId, input.userId);
        }
        else {
            await this.validateEmailInvitation(clubId, input.email);
        }
        // Create invitation
        const invitation = await this.invitationRepository.createInvitation(input, clubId, authContext.userId);
        (0, lambda_utils_1.logStructured)('INFO', 'Club invitation created successfully', {
            clubId,
            userId: authContext.userId,
            invitationId: invitation.invitationId,
            invitationType: invitation.type,
            targetRole: invitation.role,
        });
        return invitation;
    }
    /**
     * Accept or decline invitation
     *
     * @param invitationId - Invitation ID
     * @param input - Process invitation input
     * @param authContext - Authentication context
     * @returns Updated invitation and membership (if accepted)
     */
    async processInvitation(invitationId, input, authContext) {
        (0, lambda_utils_1.logStructured)('INFO', 'Processing invitation', {
            invitationId,
            userId: authContext.userId,
            action: input.action,
            operation: 'process_invitation',
        });
        // Get invitation
        const invitation = await this.invitationRepository.getInvitationById(invitationId);
        if (!invitation) {
            throw new invitation_errors_1.InvitationNotFoundError(invitationId);
        }
        // Validate invitation can be processed
        this.validateInvitationProcessing(invitation, authContext.userId);
        // Process invitation
        const updatedInvitation = await this.invitationRepository.processInvitation(invitationId, input, authContext.userId);
        let membership;
        // If accepted, create membership
        if (input.action === 'accept') {
            // Check if user is already a member (race condition protection)
            const existingMembership = await this.membershipRepository.getMembershipByClubAndUser(invitation.clubId, authContext.userId);
            if (existingMembership && existingMembership.status !== membership_1.MembershipStatus.REMOVED) {
                throw new membership_errors_1.AlreadyMemberError(invitation.clubId, authContext.userId);
            }
            // Create membership
            membership = await this.membershipRepository.createMembership(invitation.clubId, authContext.userId, { message: `Accepted invitation: ${invitation.message || ''}` }, invitation.role, membership_1.MembershipStatus.ACTIVE);
            (0, lambda_utils_1.logStructured)('INFO', 'Invitation accepted and membership created', {
                invitationId,
                userId: authContext.userId,
                clubId: invitation.clubId,
                membershipId: membership.membershipId,
                role: membership.role,
            });
        }
        else {
            (0, lambda_utils_1.logStructured)('INFO', 'Invitation declined', {
                invitationId,
                userId: authContext.userId,
                clubId: invitation.clubId,
            });
        }
        return { invitation: updatedInvitation, membership };
    }
    /**
     * Cancel invitation (admin action)
     *
     * @param invitationId - Invitation ID
     * @param authContext - Authentication context
     * @returns Updated invitation
     */
    async cancelInvitation(invitationId, authContext) {
        (0, lambda_utils_1.logStructured)('INFO', 'Cancelling invitation', {
            invitationId,
            userId: authContext.userId,
            operation: 'cancel_invitation',
        });
        // Get invitation
        const invitation = await this.invitationRepository.getInvitationById(invitationId);
        if (!invitation) {
            throw new invitation_errors_1.InvitationNotFoundError(invitationId);
        }
        // Cancel invitation
        const updatedInvitation = await this.invitationRepository.cancelInvitation(invitationId);
        (0, lambda_utils_1.logStructured)('INFO', 'Invitation cancelled successfully', {
            invitationId,
            userId: authContext.userId,
            clubId: invitation.clubId,
        });
        return updatedInvitation;
    }
    /**
     * Get user's pending invitations
     *
     * @param authContext - Authentication context
     * @param options - List options
     * @returns Paginated list of user's invitations
     */
    async getUserInvitations(authContext, options = {}) {
        (0, lambda_utils_1.logStructured)('INFO', 'Getting user invitations', {
            userId: authContext.userId,
            limit: options.limit,
            status: options.status,
            operation: 'get_user_invitations',
        });
        // Validate options
        const limit = Math.min(options.limit || invitation_1.INVITATION_CONSTRAINTS.DEFAULT_LIST_LIMIT, invitation_1.INVITATION_CONSTRAINTS.MAX_LIST_LIMIT);
        const result = await this.invitationRepository.listUserInvitations(authContext.userId, {
            ...options,
            limit,
        });
        (0, lambda_utils_1.logStructured)('INFO', 'User invitations retrieved', {
            userId: authContext.userId,
            invitationCount: result.invitations.length,
            hasNextCursor: !!result.nextCursor,
        });
        return result;
    }
    /**
     * Get club invitations (admin view)
     *
     * @param clubId - Club ID
     * @param options - List options
     * @param authContext - Authentication context
     * @returns List of club invitations
     */
    async getClubInvitations(clubId, options, authContext) {
        (0, lambda_utils_1.logStructured)('INFO', 'Getting club invitations', {
            clubId,
            userId: authContext.userId,
            limit: options.limit,
            status: options.status,
            operation: 'get_club_invitations',
        });
        // Validate options
        const limit = Math.min(options.limit || invitation_1.INVITATION_CONSTRAINTS.DEFAULT_LIST_LIMIT, invitation_1.INVITATION_CONSTRAINTS.MAX_LIST_LIMIT);
        const invitations = await this.invitationRepository.listClubInvitations(clubId, {
            ...options,
            limit,
        });
        (0, lambda_utils_1.logStructured)('INFO', 'Club invitations retrieved', {
            clubId,
            userId: authContext.userId,
            invitationCount: invitations.length,
        });
        return invitations;
    }
    /**
     * Process join request (approve/reject)
     *
     * @param membershipId - Membership ID (pending join request)
     * @param input - Process join request input
     * @param authContext - Authentication context
     * @returns Updated membership
     */
    async processJoinRequest(membershipId, input, authContext) {
        (0, lambda_utils_1.logStructured)('INFO', 'Processing join request', {
            membershipId,
            userId: authContext.userId,
            action: input.action,
            operation: 'process_join_request',
        });
        // Get membership
        const membership = await this.membershipRepository.getMembershipById(membershipId);
        if (!membership) {
            throw new errors_1.NotFoundError('Join request not found');
        }
        // Validate membership is pending
        if (membership.status !== membership_1.MembershipStatus.PENDING) {
            throw new errors_1.ValidationError('Join request is not pending');
        }
        // Process request
        const newStatus = input.action === 'approve' ? membership_1.MembershipStatus.ACTIVE : membership_1.MembershipStatus.REMOVED;
        const reason = input.action === 'approve'
            ? `Join request approved${input.message ? `: ${input.message}` : ''}`
            : `Join request rejected${input.message ? `: ${input.message}` : ''}`;
        const updatedMembership = await this.membershipRepository.updateMembershipStatus(membershipId, newStatus, authContext.userId, reason);
        (0, lambda_utils_1.logStructured)('INFO', 'Join request processed successfully', {
            membershipId,
            userId: authContext.userId,
            clubId: membership.clubId,
            action: input.action,
            newStatus,
        });
        return updatedMembership;
    }
    /**
     * Validate create invitation input
     */
    validateCreateInvitationInput(input) {
        if (!Object.values(membership_1.ClubRole).includes(input.role)) {
            throw new errors_1.ValidationError('Invalid club role');
        }
        if (input.message && input.message.length > invitation_1.INVITATION_CONSTRAINTS.MESSAGE_MAX_LENGTH) {
            throw new errors_1.ValidationError(`Message must not exceed ${invitation_1.INVITATION_CONSTRAINTS.MESSAGE_MAX_LENGTH} characters`);
        }
        if (input.type === 'email') {
            if (!input.email || input.email.trim().length === 0) {
                throw new errors_1.ValidationError('Email is required for email invitations');
            }
            if (!this.isValidEmail(input.email)) {
                throw new errors_1.ValidationError('Invalid email format');
            }
        }
        else {
            if (!input.userId || input.userId.trim().length === 0) {
                throw new errors_1.ValidationError('User ID is required for user invitations');
            }
        }
    }
    /**
     * Validate user invitation
     */
    async validateUserInvitation(clubId, userId) {
        // Check if user exists
        const user = await this.userRepository.getUserById(userId);
        if (!user) {
            throw new errors_1.NotFoundError('User not found');
        }
        // Check if user is already a member
        const existingMembership = await this.membershipRepository.getMembershipByClubAndUser(clubId, userId);
        if (existingMembership && existingMembership.status !== membership_1.MembershipStatus.REMOVED) {
            throw new invitation_errors_1.CannotInviteExistingMemberError(clubId, userId);
        }
        // Check if user already has a pending invitation
        const hasPendingInvitation = await this.invitationRepository.hasPendingInvitation(clubId, userId);
        if (hasPendingInvitation) {
            throw new invitation_errors_1.UserAlreadyInvitedError(clubId, undefined, userId);
        }
    }
    /**
     * Validate email invitation
     */
    async validateEmailInvitation(clubId, email) {
        const normalizedEmail = email.toLowerCase().trim();
        // Check if email already has a pending invitation
        const hasPendingInvitation = await this.invitationRepository.hasPendingInvitation(clubId, undefined, normalizedEmail);
        if (hasPendingInvitation) {
            throw new invitation_errors_1.UserAlreadyInvitedError(clubId, normalizedEmail);
        }
        // Check if user with this email is already a member
        // Note: This requires looking up user by email, which may not be efficient
        // For Phase 2.2, we'll skip this check and handle it during invitation acceptance
    }
    /**
     * Validate invitation processing
     */
    validateInvitationProcessing(invitation, userId) {
        // Check if invitation is pending
        if (invitation.status !== invitation_1.InvitationStatus.PENDING) {
            throw new invitation_errors_1.InvitationAlreadyProcessedError(invitation.invitationId, invitation.status);
        }
        // Check if invitation is expired
        const now = new Date();
        const expiryDate = new Date(invitation.expiresAt);
        if (now > expiryDate) {
            throw new invitation_errors_1.InvitationExpiredError(invitation.invitationId, invitation.expiresAt);
        }
        // For user invitations, validate the user ID matches
        if (invitation.type === invitation_1.InvitationType.USER && invitation.userId !== userId) {
            throw new invitation_errors_1.InvitationOperationNotAllowedError('process_invitation', invitation.invitationId, 'Invitation is not for this user');
        }
        // For email invitations, we allow any authenticated user to accept
        // (they will be linked to the invitation upon acceptance)
    }
    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
exports.InvitationService = InvitationService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52aXRhdGlvbi1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW52aXRhdGlvbi1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7R0FRRzs7O0FBRUgsb0VBVzZDO0FBQzdDLG9FQUFpRztBQUVqRyw0REFBZ0c7QUFDaEcsd0VBQXNFO0FBS3RFLDJEQU82QjtBQUM3Qix1RUFBcUU7QUFDckUsNEVBQStFO0FBRy9FOztHQUVHO0FBQ0gsTUFBYSxpQkFBaUI7SUFHNUIsWUFDVSxvQkFBMkMsRUFDM0Msb0JBQTJDLEVBQzNDLGNBQStCLEVBQy9CLGNBQStCLEVBQy9CLG9CQUEyQztRQUozQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1FBQzNDLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBdUI7UUFDM0MsbUJBQWMsR0FBZCxjQUFjLENBQWlCO1FBQy9CLG1CQUFjLEdBQWQsY0FBYyxDQUFpQjtRQUMvQix5QkFBb0IsR0FBcEIsb0JBQW9CLENBQXVCO1FBRW5ELElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSw2Q0FBd0IsQ0FBQyxvQkFBb0IsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0lBQzlGLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0gsS0FBSyxDQUFDLGdCQUFnQixDQUNwQixNQUFjLEVBQ2QsS0FBNEIsRUFDNUIsV0FBd0I7UUFFeEIsSUFBQSw0QkFBYSxFQUFDLE1BQU0sRUFBRSwwQkFBMEIsRUFBRTtZQUNoRCxNQUFNO1lBQ04sTUFBTSxFQUFFLFdBQVcsQ0FBQyxNQUFNO1lBQzFCLGNBQWMsRUFBRSxLQUFLLENBQUMsSUFBSTtZQUMxQixVQUFVLEVBQUUsS0FBSyxDQUFDLElBQUk7WUFDdEIsU0FBUyxFQUFFLG1CQUFtQjtTQUMvQixDQUFDLENBQUM7UUFFSCxpQkFBaUI7UUFDakIsSUFBSSxDQUFDLDZCQUE2QixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRTFDLHVCQUF1QjtRQUN2QixNQUFNLElB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NEJBQTRCLENBQUMsVUFBMEIsRUFBRSxNQUFjO1FBQzdFLGlDQUFpQztRQUNqQyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEtBQUssNkJBQWdCLENBQUMsT0FBTyxFQUFFO1lBQ2xELE1BQU0sSUFBSSxtREFBK0IsQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUN2RjtRQUVELGlDQUFpQztRQUNqQyxNQUFNLEdBQUcsR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ3ZCLE1BQU0sVUFBVSxHQUFHLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNsRCxJQUFJLEdBQUcsR0FBRyxVQUFVLEVBQUU7WUFDcEIsTUFBTSxJQUFJLDBDQUFzQixDQUFDLFVBQVUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ2pGO1FBRUQscURBQXFEO1FBQ3JELElBQUksVUFBVSxDQUFDLElBQUksS0FBSywyQkFBYyxDQUFDLElBQUksSUFBSSxVQUFVLENBQUMsTUFBTSxLQUFLLE1BQU0sRUFBRTtZQUMzRSxNQUFNLElBQUksc0RBQWtDLENBQzFDLG9CQUFvQixFQUNwQixVQUFVLENBQUMsWUFBWSxFQUN2QixpQ0FBaUMsQ0FDbEMsQ0FBQztTQUNIO1FBRUQsbUVBQW1FO1FBQ25FLDBEQUEwRDtJQUM1RCxDQUFDO0lBRUQ7O09BRUc7SUFDSyxZQUFZLENBQUMsS0FBYTtRQUNoQyxNQUFNLFVBQVUsR0FBRyw0QkFBNEIsQ0FBQztRQUNoRCxPQUFPLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEMsQ0FBQztDQUNGO0FBMVpELDhDQTBaQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ2x1YiBJbnZpdGF0aW9uIFNlcnZpY2UgLSBQaGFzZSAyLjJcbiAqIFxuICogQnVzaW5lc3MgbG9naWMgbGF5ZXIgZm9yIGNsdWIgaW52aXRhdGlvbiBvcGVyYXRpb25zLlxuICogSGFuZGxlcyBkdWFsIGludml0YXRpb24gc3lzdGVtIChlbWFpbCBhbmQgaW4tYXBwKSBhbmQgaW52aXRhdGlvbiBsaWZlY3ljbGUuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDIuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0yLjIuY2x1Yi1tZW1iZXJzaGlwLXJvbGVzLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgXG4gIENsdWJJbnZpdGF0aW9uLCBcbiAgSW52aXRhdGlvblR5cGUsIFxuICBJbnZpdGF0aW9uU3RhdHVzLCBcbiAgQ3JlYXRlSW52aXRhdGlvbklucHV0LFxuICBQcm9jZXNzSW52aXRhdGlvbklucHV0LFxuICBQcm9jZXNzSm9pblJlcXVlc3RJbnB1dCxcbiAgTGlzdEludml0YXRpb25zT3B0aW9ucywgXG4gIExpc3RJbnZpdGF0aW9uc1Jlc3VsdCxcbiAgVXNlckludml0YXRpb25TdW1tYXJ5LFxuICBJTlZJVEFUSU9OX0NPTlNUUkFJTlRTXG59IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9pbnZpdGF0aW9uJztcbmltcG9ydCB7IENsdWJSb2xlLCBNZW1iZXJzaGlwU3RhdHVzLCBDbHViTWVtYmVyc2hpcCB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9tZW1iZXJzaGlwJztcbmltcG9ydCB7IEF1dGhDb250ZXh0IH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL2F1dGgnO1xuaW1wb3J0IHsgTm90Rm91bmRFcnJvciwgVmFsaWRhdGlvbkVycm9yLCBDb25mbGljdEVycm9yIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2Vycm9ycyc7XG5pbXBvcnQgeyBsb2dTdHJ1Y3R1cmVkIH0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3V0aWxzL2xhbWJkYS11dGlscyc7XG5pbXBvcnQgeyBJSW52aXRhdGlvblJlcG9zaXRvcnkgfSBmcm9tICcuL2ludml0YXRpb24tcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBJTWVtYmVyc2hpcFJlcG9zaXRvcnkgfSBmcm9tICcuLi9tZW1iZXJzaGlwL21lbWJlcnNoaXAtcmVwb3NpdG9yeSc7XG5pbXBvcnQgeyBJQ2x1YlJlcG9zaXRvcnkgfSBmcm9tICcuLi9jbHViLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgSVVzZXJSZXBvc2l0b3J5IH0gZnJvbSAnLi4vLi4vLi4vdXNlci1wcm9maWxlL2RvbWFpbi91c2VyLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgXG4gIEludml0YXRpb25Ob3RGb3VuZEVycm9yLCBcbiAgSW52aXRhdGlvbkV4cGlyZWRFcnJvcixcbiAgSW52aXRhdGlvbkFscmVhZHlQcm9jZXNzZWRFcnJvcixcbiAgVXNlckFscmVhZHlJbnZpdGVkRXJyb3IsXG4gIENhbm5vdEludml0ZUV4aXN0aW5nTWVtYmVyRXJyb3IsXG4gIEludml0YXRpb25PcGVyYXRpb25Ob3RBbGxvd2VkRXJyb3Jcbn0gZnJvbSAnLi9pbnZpdGF0aW9uLWVycm9ycyc7XG5pbXBvcnQgeyBBbHJlYWR5TWVtYmVyRXJyb3IgfSBmcm9tICcuLi9tZW1iZXJzaGlwL21lbWJlcnNoaXAtZXJyb3JzJztcbmltcG9ydCB7IENsdWJBdXRob3JpemF0aW9uU2VydmljZSB9IGZyb20gJy4uL2F1dGhvcml6YXRpb24vY2x1Yi1hdXRob3JpemF0aW9uJztcbmltcG9ydCB7IElBdXRob3JpemF0aW9uU2VydmljZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9hdXRob3JpemF0aW9uL3R5cGVzJztcblxuLyoqXG4gKiBDbHViIGludml0YXRpb24gc2VydmljZSBpbXBsZW1lbnRhdGlvblxuICovXG5leHBvcnQgY2xhc3MgSW52aXRhdGlvblNlcnZpY2Uge1xuICBwcml2YXRlIGF1dGhTZXJ2aWNlOiBDbHViQXV0aG9yaXphdGlvblNlcnZpY2U7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSBpbnZpdGF0aW9uUmVwb3NpdG9yeTogSUludml0YXRpb25SZXBvc2l0b3J5LFxuICAgIHByaXZhdGUgbWVtYmVyc2hpcFJlcG9zaXRvcnk6IElNZW1iZXJzaGlwUmVwb3NpdG9yeSxcbiAgICBwcml2YXRlIGNsdWJSZXBvc2l0b3J5OiBJQ2x1YlJlcG9zaXRvcnksXG4gICAgcHJpdmF0ZSB1c2VyUmVwb3NpdG9yeTogSVVzZXJSZXBvc2l0b3J5LFxuICAgIHByaXZhdGUgYXV0aG9yaXphdGlvblNlcnZpY2U6IElBdXRob3JpemF0aW9uU2VydmljZVxuICApIHtcbiAgICB0aGlzLmF1dGhTZXJ2aWNlID0gbmV3IENsdWJBdXRob3JpemF0aW9uU2VydmljZShtZW1iZXJzaGlwUmVwb3NpdG9yeSwgYXV0aG9yaXphdGlvblNlcnZpY2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBjbHViIGludml0YXRpb24gKGVtYWlsIG9yIHVzZXIgaW52aXRhdGlvbilcbiAgICogXG4gICAqIEBwYXJhbSBjbHViSWQgLSBDbHViIElEXG4gICAqIEBwYXJhbSBpbnB1dCAtIEludml0YXRpb24gY3JlYXRpb24gaW5wdXRcbiAgICogQHBhcmFtIGF1dGhDb250ZXh0IC0gQXV0aGVudGljYXRpb24gY29udGV4dFxuICAgKiBAcmV0dXJucyBDcmVhdGVkIGludml0YXRpb25cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUludml0YXRpb24oXG4gICAgY2x1YklkOiBzdHJpbmcsIFxuICAgIGlucHV0OiBDcmVhdGVJbnZpdGF0aW9uSW5wdXQsIFxuICAgIGF1dGhDb250ZXh0OiBBdXRoQ29udGV4dFxuICApOiBQcm9taXNlPENsdWJJbnZpdGF0aW9uPiB7XG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdDcmVhdGluZyBjbHViIGludml0YXRpb24nLCB7XG4gICAgICBjbHViSWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGludml0YXRpb25UeXBlOiBpbnB1dC50eXBlLFxuICAgICAgdGFyZ2V0Um9sZTogaW5wdXQucm9sZSxcbiAgICAgIG9wZXJhdGlvbjogJ2NyZWF0ZV9pbnZpdGF0aW9uJyxcbiAgICB9KTtcblxuICAgIC8vIFZhbGlkYXRlIGlucHV0XG4gICAgdGhpcy52YWxpZGF0ZUNyZWF0ZUludml0YXRpb25JbnB1dChpbnB1dCk7XG5cbiAgICAvLyBDaGVjayBpZiBjbHViIGV4aXN0c1xuICAgIGNvbnN0IGNsdWIgPSBhd2FpdCB0aGlzLmNsdWJSZXBvc2l0b3J5LmdldENsdWJCeUlkKGNsdWJJZCk7XG4gICAgaWYgKCFjbHViKSB7XG4gICAgICB0aHJvdyBuZXcgTm90Rm91bmRFcnJvcignQ2x1YiBub3QgZm91bmQnKTtcbiAgICB9XG5cbiAgICAvLyBUeXBlLXNwZWNpZmljIHZhbGlkYXRpb24gYW5kIGNoZWNrc1xuICAgIGlmIChpbnB1dC50eXBlID09PSAndXNlcicpIHtcbiAgICAgIGF3YWl0IHRoaXMudmFsaWRhdGVVc2VySW52aXRhdGlvbihjbHViSWQsIGlucHV0LnVzZXJJZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IHRoaXMudmFsaWRhdGVFbWFpbEludml0YXRpb24oY2x1YklkLCBpbnB1dC5lbWFpbCk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGludml0YXRpb25cbiAgICBjb25zdCBpbnZpdGF0aW9uID0gYXdhaXQgdGhpcy5pbnZpdGF0aW9uUmVwb3NpdG9yeS5jcmVhdGVJbnZpdGF0aW9uKGlucHV0LCBjbHViSWQsIGF1dGhDb250ZXh0LnVzZXJJZCk7XG5cbiAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0NsdWIgaW52aXRhdGlvbiBjcmVhdGVkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIGNsdWJJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgaW52aXRhdGlvbklkOiBpbnZpdGF0aW9uLmludml0YXRpb25JZCxcbiAgICAgIGludml0YXRpb25UeXBlOiBpbnZpdGF0aW9uLnR5cGUsXG4gICAgICB0YXJnZXRSb2xlOiBpbnZpdGF0aW9uLnJvbGUsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gaW52aXRhdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBY2NlcHQgb3IgZGVjbGluZSBpbnZpdGF0aW9uXG4gICAqIFxuICAgKiBAcGFyYW0gaW52aXRhdGlvbklkIC0gSW52aXRhdGlvbiBJRFxuICAgKiBAcGFyYW0gaW5wdXQgLSBQcm9jZXNzIGludml0YXRpb24gaW5wdXRcbiAgICogQHBhcmFtIGF1dGhDb250ZXh0IC0gQXV0aGVudGljYXRpb24gY29udGV4dFxuICAgKiBAcmV0dXJucyBVcGRhdGVkIGludml0YXRpb24gYW5kIG1lbWJlcnNoaXAgKGlmIGFjY2VwdGVkKVxuICAgKi9cbiAgYXN5bmMgcHJvY2Vzc0ludml0YXRpb24oXG4gICAgaW52aXRhdGlvbklkOiBzdHJpbmcsIFxuICAgIGlucHV0OiBQcm9jZXNzSW52aXRhdGlvbklucHV0LCBcbiAgICBhdXRoQ29udGV4dDogQXV0aENvbnRleHRcbiAgKTogUHJvbWlzZTx7IGludml0YXRpb246IENsdWJJbnZpdGF0aW9uOyBtZW1iZXJzaGlwPzogQ2x1Yk1lbWJlcnNoaXAgfT4ge1xuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnUHJvY2Vzc2luZyBpbnZpdGF0aW9uJywge1xuICAgICAgaW52aXRhdGlvbklkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBhY3Rpb246IGlucHV0LmFjdGlvbixcbiAgICAgIG9wZXJhdGlvbjogJ3Byb2Nlc3NfaW52aXRhdGlvbicsXG4gICAgfSk7XG5cbiAgICAvLyBHZXQgaW52aXRhdGlvblxuICAgIGNvbnN0IGludml0YXRpb24gPSBhd2FpdCB0aGlzLmludml0YXRpb25SZXBvc2l0b3J5LmdldEludml0YXRpb25CeUlkKGludml0YXRpb25JZCk7XG4gICAgaWYgKCFpbnZpdGF0aW9uKSB7XG4gICAgICB0aHJvdyBuZXcgSW52aXRhdGlvbk5vdEZvdW5kRXJyb3IoaW52aXRhdGlvbklkKTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBpbnZpdGF0aW9uIGNhbiBiZSBwcm9jZXNzZWRcbiAgICB0aGlzLnZhbGlkYXRlSW52aXRhdGlvblByb2Nlc3NpbmcoaW52aXRhdGlvbiwgYXV0aENvbnRleHQudXNlcklkKTtcblxuICAgIC8vIFByb2Nlc3MgaW52aXRhdGlvblxuICAgIGNvbnN0IHVwZGF0ZWRJbnZpdGF0aW9uID0gYXdhaXQgdGhpcy5pbnZpdGF0aW9uUmVwb3NpdG9yeS5wcm9jZXNzSW52aXRhdGlvbihcbiAgICAgIGludml0YXRpb25JZCwgXG4gICAgICBpbnB1dCwgXG4gICAgICBhdXRoQ29udGV4dC51c2VySWRcbiAgICApO1xuXG4gICAgbGV0IG1lbWJlcnNoaXA6IENsdWJNZW1iZXJzaGlwIHwgdW5kZWZpbmVkO1xuXG4gICAgLy8gSWYgYWNjZXB0ZWQsIGNyZWF0ZSBtZW1iZXJzaGlwXG4gICAgaWYgKGlucHV0LmFjdGlvbiA9PT0gJ2FjY2VwdCcpIHtcbiAgICAgIC8vIENoZWNrIGlmIHVzZXIgaXMgYWxyZWFkeSBhIG1lbWJlciAocmFjZSBjb25kaXRpb24gcHJvdGVjdGlvbilcbiAgICAgIGNvbnN0IGV4aXN0aW5nTWVtYmVyc2hpcCA9IGF3YWl0IHRoaXMubWVtYmVyc2hpcFJlcG9zaXRvcnkuZ2V0TWVtYmVyc2hpcEJ5Q2x1YkFuZFVzZXIoXG4gICAgICAgIGludml0YXRpb24uY2x1YklkLCBcbiAgICAgICAgYXV0aENvbnRleHQudXNlcklkXG4gICAgICApO1xuICAgICAgXG4gICAgICBpZiAoZXhpc3RpbmdNZW1iZXJzaGlwICYmIGV4aXN0aW5nTWVtYmVyc2hpcC5zdGF0dXMgIT09IE1lbWJlcnNoaXBTdGF0dXMuUkVNT1ZFRCkge1xuICAgICAgICB0aHJvdyBuZXcgQWxyZWFkeU1lbWJlckVycm9yKGludml0YXRpb24uY2x1YklkLCBhdXRoQ29udGV4dC51c2VySWQpO1xuICAgICAgfVxuXG4gICAgICAvLyBDcmVhdGUgbWVtYmVyc2hpcFxuICAgICAgbWVtYmVyc2hpcCA9IGF3YWl0IHRoaXMubWVtYmVyc2hpcFJlcG9zaXRvcnkuY3JlYXRlTWVtYmVyc2hpcChcbiAgICAgICAgaW52aXRhdGlvbi5jbHViSWQsXG4gICAgICAgIGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgICAgeyBtZXNzYWdlOiBgQWNjZXB0ZWQgaW52aXRhdGlvbjogJHtpbnZpdGF0aW9uLm1lc3NhZ2UgfHwgJyd9YCB9LFxuICAgICAgICBpbnZpdGF0aW9uLnJvbGUsXG4gICAgICAgIE1lbWJlcnNoaXBTdGF0dXMuQUNUSVZFXG4gICAgICApO1xuXG4gICAgICBsb2dTdHJ1Y3R1cmVkKCdJTkZPJywgJ0ludml0YXRpb24gYWNjZXB0ZWQgYW5kIG1lbWJlcnNoaXAgY3JlYXRlZCcsIHtcbiAgICAgICAgaW52aXRhdGlvbklkLFxuICAgICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgICAgY2x1YklkOiBpbnZpdGF0aW9uLmNsdWJJZCxcbiAgICAgICAgbWVtYmVyc2hpcElkOiBtZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCxcbiAgICAgICAgcm9sZTogbWVtYmVyc2hpcC5yb2xlLFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnSW52aXRhdGlvbiBkZWNsaW5lZCcsIHtcbiAgICAgICAgaW52aXRhdGlvbklkLFxuICAgICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgICAgY2x1YklkOiBpbnZpdGF0aW9uLmNsdWJJZCxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiB7IGludml0YXRpb246IHVwZGF0ZWRJbnZpdGF0aW9uLCBtZW1iZXJzaGlwIH07XG4gIH1cblxuICAvKipcbiAgICogQ2FuY2VsIGludml0YXRpb24gKGFkbWluIGFjdGlvbilcbiAgICogXG4gICAqIEBwYXJhbSBpbnZpdGF0aW9uSWQgLSBJbnZpdGF0aW9uIElEXG4gICAqIEBwYXJhbSBhdXRoQ29udGV4dCAtIEF1dGhlbnRpY2F0aW9uIGNvbnRleHRcbiAgICogQHJldHVybnMgVXBkYXRlZCBpbnZpdGF0aW9uXG4gICAqL1xuICBhc3luYyBjYW5jZWxJbnZpdGF0aW9uKGludml0YXRpb25JZDogc3RyaW5nLCBhdXRoQ29udGV4dDogQXV0aENvbnRleHQpOiBQcm9taXNlPENsdWJJbnZpdGF0aW9uPiB7XG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdDYW5jZWxsaW5nIGludml0YXRpb24nLCB7XG4gICAgICBpbnZpdGF0aW9uSWQsXG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIG9wZXJhdGlvbjogJ2NhbmNlbF9pbnZpdGF0aW9uJyxcbiAgICB9KTtcblxuICAgIC8vIEdldCBpbnZpdGF0aW9uXG4gICAgY29uc3QgaW52aXRhdGlvbiA9IGF3YWl0IHRoaXMuaW52aXRhdGlvblJlcG9zaXRvcnkuZ2V0SW52aXRhdGlvbkJ5SWQoaW52aXRhdGlvbklkKTtcbiAgICBpZiAoIWludml0YXRpb24pIHtcbiAgICAgIHRocm93IG5ldyBJbnZpdGF0aW9uTm90Rm91bmRFcnJvcihpbnZpdGF0aW9uSWQpO1xuICAgIH1cblxuICAgIC8vIENhbmNlbCBpbnZpdGF0aW9uXG4gICAgY29uc3QgdXBkYXRlZEludml0YXRpb24gPSBhd2FpdCB0aGlzLmludml0YXRpb25SZXBvc2l0b3J5LmNhbmNlbEludml0YXRpb24oaW52aXRhdGlvbklkKTtcblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnSW52aXRhdGlvbiBjYW5jZWxsZWQgc3VjY2Vzc2Z1bGx5Jywge1xuICAgICAgaW52aXRhdGlvbklkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBjbHViSWQ6IGludml0YXRpb24uY2x1YklkLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHVwZGF0ZWRJbnZpdGF0aW9uO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyJ3MgcGVuZGluZyBpbnZpdGF0aW9uc1xuICAgKiBcbiAgICogQHBhcmFtIGF1dGhDb250ZXh0IC0gQXV0aGVudGljYXRpb24gY29udGV4dFxuICAgKiBAcGFyYW0gb3B0aW9ucyAtIExpc3Qgb3B0aW9uc1xuICAgKiBAcmV0dXJucyBQYWdpbmF0ZWQgbGlzdCBvZiB1c2VyJ3MgaW52aXRhdGlvbnNcbiAgICovXG4gIGFzeW5jIGdldFVzZXJJbnZpdGF0aW9ucyhcbiAgICBhdXRoQ29udGV4dDogQXV0aENvbnRleHQsIFxuICAgIG9wdGlvbnM6IExpc3RJbnZpdGF0aW9uc09wdGlvbnMgPSB7fVxuICApOiBQcm9taXNlPExpc3RJbnZpdGF0aW9uc1Jlc3VsdD4ge1xuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnR2V0dGluZyB1c2VyIGludml0YXRpb25zJywge1xuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBsaW1pdDogb3B0aW9ucy5saW1pdCxcbiAgICAgIHN0YXR1czogb3B0aW9ucy5zdGF0dXMsXG4gICAgICBvcGVyYXRpb246ICdnZXRfdXNlcl9pbnZpdGF0aW9ucycsXG4gICAgfSk7XG5cbiAgICAvLyBWYWxpZGF0ZSBvcHRpb25zXG4gICAgY29uc3QgbGltaXQgPSBNYXRoLm1pbihcbiAgICAgIG9wdGlvbnMubGltaXQgfHwgSU5WSVRBVElPTl9DT05TVFJBSU5UUy5ERUZBVUxUX0xJU1RfTElNSVQsXG4gICAgICBJTlZJVEFUSU9OX0NPTlNUUkFJTlRTLk1BWF9MSVNUX0xJTUlUXG4gICAgKTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuaW52aXRhdGlvblJlcG9zaXRvcnkubGlzdFVzZXJJbnZpdGF0aW9ucyhhdXRoQ29udGV4dC51c2VySWQsIHtcbiAgICAgIC4uLm9wdGlvbnMsXG4gICAgICBsaW1pdCxcbiAgICB9KTtcblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnVXNlciBpbnZpdGF0aW9ucyByZXRyaWV2ZWQnLCB7XG4gICAgICB1c2VySWQ6IGF1dGhDb250ZXh0LnVzZXJJZCxcbiAgICAgIGludml0YXRpb25Db3VudDogcmVzdWx0Lmludml0YXRpb25zLmxlbmd0aCxcbiAgICAgIGhhc05leHRDdXJzb3I6ICEhcmVzdWx0Lm5leHRDdXJzb3IsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBjbHViIGludml0YXRpb25zIChhZG1pbiB2aWV3KVxuICAgKiBcbiAgICogQHBhcmFtIGNsdWJJZCAtIENsdWIgSURcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBMaXN0IG9wdGlvbnNcbiAgICogQHBhcmFtIGF1dGhDb250ZXh0IC0gQXV0aGVudGljYXRpb24gY29udGV4dFxuICAgKiBAcmV0dXJucyBMaXN0IG9mIGNsdWIgaW52aXRhdGlvbnNcbiAgICovXG4gIGFzeW5jIGdldENsdWJJbnZpdGF0aW9ucyhcbiAgICBjbHViSWQ6IHN0cmluZywgXG4gICAgb3B0aW9uczogTGlzdEludml0YXRpb25zT3B0aW9ucywgXG4gICAgYXV0aENvbnRleHQ6IEF1dGhDb250ZXh0XG4gICk6IFByb21pc2U8Q2x1Ykludml0YXRpb25bXT4ge1xuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnR2V0dGluZyBjbHViIGludml0YXRpb25zJywge1xuICAgICAgY2x1YklkLFxuICAgICAgdXNlcklkOiBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICBsaW1pdDogb3B0aW9ucy5saW1pdCxcbiAgICAgIHN0YXR1czogb3B0aW9ucy5zdGF0dXMsXG4gICAgICBvcGVyYXRpb246ICdnZXRfY2x1Yl9pbnZpdGF0aW9ucycsXG4gICAgfSk7XG5cbiAgICAvLyBWYWxpZGF0ZSBvcHRpb25zXG4gICAgY29uc3QgbGltaXQgPSBNYXRoLm1pbihcbiAgICAgIG9wdGlvbnMubGltaXQgfHwgSU5WSVRBVElPTl9DT05TVFJBSU5UUy5ERUZBVUxUX0xJU1RfTElNSVQsXG4gICAgICBJTlZJVEFUSU9OX0NPTlNUUkFJTlRTLk1BWF9MSVNUX0xJTUlUXG4gICAgKTtcblxuICAgIGNvbnN0IGludml0YXRpb25zID0gYXdhaXQgdGhpcy5pbnZpdGF0aW9uUmVwb3NpdG9yeS5saXN0Q2x1Ykludml0YXRpb25zKGNsdWJJZCwge1xuICAgICAgLi4ub3B0aW9ucyxcbiAgICAgIGxpbWl0LFxuICAgIH0pO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdDbHViIGludml0YXRpb25zIHJldHJpZXZlZCcsIHtcbiAgICAgIGNsdWJJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgaW52aXRhdGlvbkNvdW50OiBpbnZpdGF0aW9ucy5sZW5ndGgsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gaW52aXRhdGlvbnM7XG4gIH1cblxuICAvKipcbiAgICogUHJvY2VzcyBqb2luIHJlcXVlc3QgKGFwcHJvdmUvcmVqZWN0KVxuICAgKiBcbiAgICogQHBhcmFtIG1lbWJlcnNoaXBJZCAtIE1lbWJlcnNoaXAgSUQgKHBlbmRpbmcgam9pbiByZXF1ZXN0KVxuICAgKiBAcGFyYW0gaW5wdXQgLSBQcm9jZXNzIGpvaW4gcmVxdWVzdCBpbnB1dFxuICAgKiBAcGFyYW0gYXV0aENvbnRleHQgLSBBdXRoZW50aWNhdGlvbiBjb250ZXh0XG4gICAqIEByZXR1cm5zIFVwZGF0ZWQgbWVtYmVyc2hpcFxuICAgKi9cbiAgYXN5bmMgcHJvY2Vzc0pvaW5SZXF1ZXN0KFxuICAgIG1lbWJlcnNoaXBJZDogc3RyaW5nLCBcbiAgICBpbnB1dDogUHJvY2Vzc0pvaW5SZXF1ZXN0SW5wdXQsIFxuICAgIGF1dGhDb250ZXh0OiBBdXRoQ29udGV4dFxuICApOiBQcm9taXNlPENsdWJNZW1iZXJzaGlwPiB7XG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdQcm9jZXNzaW5nIGpvaW4gcmVxdWVzdCcsIHtcbiAgICAgIG1lbWJlcnNoaXBJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgYWN0aW9uOiBpbnB1dC5hY3Rpb24sXG4gICAgICBvcGVyYXRpb246ICdwcm9jZXNzX2pvaW5fcmVxdWVzdCcsXG4gICAgfSk7XG5cbiAgICAvLyBHZXQgbWVtYmVyc2hpcFxuICAgIGNvbnN0IG1lbWJlcnNoaXAgPSBhd2FpdCB0aGlzLm1lbWJlcnNoaXBSZXBvc2l0b3J5LmdldE1lbWJlcnNoaXBCeUlkKG1lbWJlcnNoaXBJZCk7XG4gICAgaWYgKCFtZW1iZXJzaGlwKSB7XG4gICAgICB0aHJvdyBuZXcgTm90Rm91bmRFcnJvcignSm9pbiByZXF1ZXN0IG5vdCBmb3VuZCcpO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIG1lbWJlcnNoaXAgaXMgcGVuZGluZ1xuICAgIGlmIChtZW1iZXJzaGlwLnN0YXR1cyAhPT0gTWVtYmVyc2hpcFN0YXR1cy5QRU5ESU5HKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdKb2luIHJlcXVlc3QgaXMgbm90IHBlbmRpbmcnKTtcbiAgICB9XG5cbiAgICAvLyBQcm9jZXNzIHJlcXVlc3RcbiAgICBjb25zdCBuZXdTdGF0dXMgPSBpbnB1dC5hY3Rpb24gPT09ICdhcHByb3ZlJyA/IE1lbWJlcnNoaXBTdGF0dXMuQUNUSVZFIDogTWVtYmVyc2hpcFN0YXR1cy5SRU1PVkVEO1xuICAgIGNvbnN0IHJlYXNvbiA9IGlucHV0LmFjdGlvbiA9PT0gJ2FwcHJvdmUnIFxuICAgICAgPyBgSm9pbiByZXF1ZXN0IGFwcHJvdmVkJHtpbnB1dC5tZXNzYWdlID8gYDogJHtpbnB1dC5tZXNzYWdlfWAgOiAnJ31gIFxuICAgICAgOiBgSm9pbiByZXF1ZXN0IHJlamVjdGVkJHtpbnB1dC5tZXNzYWdlID8gYDogJHtpbnB1dC5tZXNzYWdlfWAgOiAnJ31gO1xuXG4gICAgY29uc3QgdXBkYXRlZE1lbWJlcnNoaXAgPSBhd2FpdCB0aGlzLm1lbWJlcnNoaXBSZXBvc2l0b3J5LnVwZGF0ZU1lbWJlcnNoaXBTdGF0dXMoXG4gICAgICBtZW1iZXJzaGlwSWQsXG4gICAgICBuZXdTdGF0dXMsXG4gICAgICBhdXRoQ29udGV4dC51c2VySWQsXG4gICAgICByZWFzb25cbiAgICApO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdKb2luIHJlcXVlc3QgcHJvY2Vzc2VkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIG1lbWJlcnNoaXBJZCxcbiAgICAgIHVzZXJJZDogYXV0aENvbnRleHQudXNlcklkLFxuICAgICAgY2x1YklkOiBtZW1iZXJzaGlwLmNsdWJJZCxcbiAgICAgIGFjdGlvbjogaW5wdXQuYWN0aW9uLFxuICAgICAgbmV3U3RhdHVzLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHVwZGF0ZWRNZW1iZXJzaGlwO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIGNyZWF0ZSBpbnZpdGF0aW9uIGlucHV0XG4gICAqL1xuICBwcml2YXRlIHZhbGlkYXRlQ3JlYXRlSW52aXRhdGlvbklucHV0KGlucHV0OiBDcmVhdGVJbnZpdGF0aW9uSW5wdXQpOiB2b2lkIHtcbiAgICBpZiAoIU9iamVjdC52YWx1ZXMoQ2x1YlJvbGUpLmluY2x1ZGVzKGlucHV0LnJvbGUpKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnZhbGlkIGNsdWIgcm9sZScpO1xuICAgIH1cblxuICAgIGlmIChpbnB1dC5tZXNzYWdlICYmIGlucHV0Lm1lc3NhZ2UubGVuZ3RoID4gSU5WSVRBVElPTl9DT05TVFJBSU5UUy5NRVNTQUdFX01BWF9MRU5HVEgpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoYE1lc3NhZ2UgbXVzdCBub3QgZXhjZWVkICR7SU5WSVRBVElPTl9DT05TVFJBSU5UUy5NRVNTQUdFX01BWF9MRU5HVEh9IGNoYXJhY3RlcnNgKTtcbiAgICB9XG5cbiAgICBpZiAoaW5wdXQudHlwZSA9PT0gJ2VtYWlsJykge1xuICAgICAgaWYgKCFpbnB1dC5lbWFpbCB8fCBpbnB1dC5lbWFpbC50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0VtYWlsIGlzIHJlcXVpcmVkIGZvciBlbWFpbCBpbnZpdGF0aW9ucycpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXRoaXMuaXNWYWxpZEVtYWlsKGlucHV0LmVtYWlsKSkge1xuICAgICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnZhbGlkIGVtYWlsIGZvcm1hdCcpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIWlucHV0LnVzZXJJZCB8fCBpbnB1dC51c2VySWQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdVc2VyIElEIGlzIHJlcXVpcmVkIGZvciB1c2VyIGludml0YXRpb25zJyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIHVzZXIgaW52aXRhdGlvblxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyB2YWxpZGF0ZVVzZXJJbnZpdGF0aW9uKGNsdWJJZDogc3RyaW5nLCB1c2VySWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIENoZWNrIGlmIHVzZXIgZXhpc3RzXG4gICAgY29uc3QgdXNlciA9IGF3YWl0IHRoaXMudXNlclJlcG9zaXRvcnkuZ2V0VXNlckJ5SWQodXNlcklkKTtcbiAgICBpZiAoIXVzZXIpIHtcbiAgICAgIHRocm93IG5ldyBOb3RGb3VuZEVycm9yKCdVc2VyIG5vdCBmb3VuZCcpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIHVzZXIgaXMgYWxyZWFkeSBhIG1lbWJlclxuICAgIGNvbnN0IGV4aXN0aW5nTWVtYmVyc2hpcCA9IGF3YWl0IHRoaXMubWVtYmVyc2hpcFJlcG9zaXRvcnkuZ2V0TWVtYmVyc2hpcEJ5Q2x1YkFuZFVzZXIoY2x1YklkLCB1c2VySWQpO1xuICAgIGlmIChleGlzdGluZ01lbWJlcnNoaXAgJiYgZXhpc3RpbmdNZW1iZXJzaGlwLnN0YXR1cyAhPT0gTWVtYmVyc2hpcFN0YXR1cy5SRU1PVkVEKSB7XG4gICAgICB0aHJvdyBuZXcgQ2Fubm90SW52aXRlRXhpc3RpbmdNZW1iZXJFcnJvcihjbHViSWQsIHVzZXJJZCk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgdXNlciBhbHJlYWR5IGhhcyBhIHBlbmRpbmcgaW52aXRhdGlvblxuICAgIGNvbnN0IGhhc1BlbmRpbmdJbnZpdGF0aW9uID0gYXdhaXQgdGhpcy5pbnZpdGF0aW9uUmVwb3NpdG9yeS5oYXNQZW5kaW5nSW52aXRhdGlvbihjbHViSWQsIHVzZXJJZCk7XG4gICAgaWYgKGhhc1BlbmRpbmdJbnZpdGF0aW9uKSB7XG4gICAgICB0aHJvdyBuZXcgVXNlckFscmVhZHlJbnZpdGVkRXJyb3IoY2x1YklkLCB1bmRlZmluZWQsIHVzZXJJZCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIGVtYWlsIGludml0YXRpb25cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdmFsaWRhdGVFbWFpbEludml0YXRpb24oY2x1YklkOiBzdHJpbmcsIGVtYWlsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBub3JtYWxpemVkRW1haWwgPSBlbWFpbC50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblxuICAgIC8vIENoZWNrIGlmIGVtYWlsIGFscmVhZHkgaGFzIGEgcGVuZGluZyBpbnZpdGF0aW9uXG4gICAgY29uc3QgaGFzUGVuZGluZ0ludml0YXRpb24gPSBhd2FpdCB0aGlzLmludml0YXRpb25SZXBvc2l0b3J5Lmhhc1BlbmRpbmdJbnZpdGF0aW9uKGNsdWJJZCwgdW5kZWZpbmVkLCBub3JtYWxpemVkRW1haWwpO1xuICAgIGlmIChoYXNQZW5kaW5nSW52aXRhdGlvbikge1xuICAgICAgdGhyb3cgbmV3IFVzZXJBbHJlYWR5SW52aXRlZEVycm9yKGNsdWJJZCwgbm9ybWFsaXplZEVtYWlsKTtcbiAgICB9XG5cbiAgICAvLyBDaGVjayBpZiB1c2VyIHdpdGggdGhpcyBlbWFpbCBpcyBhbHJlYWR5IGEgbWVtYmVyXG4gICAgLy8gTm90ZTogVGhpcyByZXF1aXJlcyBsb29raW5nIHVwIHVzZXIgYnkgZW1haWwsIHdoaWNoIG1heSBub3QgYmUgZWZmaWNpZW50XG4gICAgLy8gRm9yIFBoYXNlIDIuMiwgd2UnbGwgc2tpcCB0aGlzIGNoZWNrIGFuZCBoYW5kbGUgaXQgZHVyaW5nIGludml0YXRpb24gYWNjZXB0YW5jZVxuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIGludml0YXRpb24gcHJvY2Vzc2luZ1xuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZUludml0YXRpb25Qcm9jZXNzaW5nKGludml0YXRpb246IENsdWJJbnZpdGF0aW9uLCB1c2VySWQ6IHN0cmluZyk6IHZvaWQge1xuICAgIC8vIENoZWNrIGlmIGludml0YXRpb24gaXMgcGVuZGluZ1xuICAgIGlmIChpbnZpdGF0aW9uLnN0YXR1cyAhPT0gSW52aXRhdGlvblN0YXR1cy5QRU5ESU5HKSB7XG4gICAgICB0aHJvdyBuZXcgSW52aXRhdGlvbkFscmVhZHlQcm9jZXNzZWRFcnJvcihpbnZpdGF0aW9uLmludml0YXRpb25JZCwgaW52aXRhdGlvbi5zdGF0dXMpO1xuICAgIH1cblxuICAgIC8vIENoZWNrIGlmIGludml0YXRpb24gaXMgZXhwaXJlZFxuICAgIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgY29uc3QgZXhwaXJ5RGF0ZSA9IG5ldyBEYXRlKGludml0YXRpb24uZXhwaXJlc0F0KTtcbiAgICBpZiAobm93ID4gZXhwaXJ5RGF0ZSkge1xuICAgICAgdGhyb3cgbmV3IEludml0YXRpb25FeHBpcmVkRXJyb3IoaW52aXRhdGlvbi5pbnZpdGF0aW9uSWQsIGludml0YXRpb24uZXhwaXJlc0F0KTtcbiAgICB9XG5cbiAgICAvLyBGb3IgdXNlciBpbnZpdGF0aW9ucywgdmFsaWRhdGUgdGhlIHVzZXIgSUQgbWF0Y2hlc1xuICAgIGlmIChpbnZpdGF0aW9uLnR5cGUgPT09IEludml0YXRpb25UeXBlLlVTRVIgJiYgaW52aXRhdGlvbi51c2VySWQgIT09IHVzZXJJZCkge1xuICAgICAgdGhyb3cgbmV3IEludml0YXRpb25PcGVyYXRpb25Ob3RBbGxvd2VkRXJyb3IoXG4gICAgICAgICdwcm9jZXNzX2ludml0YXRpb24nLFxuICAgICAgICBpbnZpdGF0aW9uLmludml0YXRpb25JZCxcbiAgICAgICAgJ0ludml0YXRpb24gaXMgbm90IGZvciB0aGlzIHVzZXInXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEZvciBlbWFpbCBpbnZpdGF0aW9ucywgd2UgYWxsb3cgYW55IGF1dGhlbnRpY2F0ZWQgdXNlciB0byBhY2NlcHRcbiAgICAvLyAodGhleSB3aWxsIGJlIGxpbmtlZCB0byB0aGUgaW52aXRhdGlvbiB1cG9uIGFjY2VwdGFuY2UpXG4gIH1cblxuICAvKipcbiAgICogVmFsaWRhdGUgZW1haWwgZm9ybWF0XG4gICAqL1xuICBwcml2YXRlIGlzVmFsaWRFbWFpbChlbWFpbDogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgY29uc3QgZW1haWxSZWdleCA9IC9eW15cXHNAXStAW15cXHNAXStcXC5bXlxcc0BdKyQvO1xuICAgIHJldHVybiBlbWFpbFJlZ2V4LnRlc3QoZW1haWwpO1xuICB9XG59Il19