"use strict";
/**
 * Club Invitation Entity - Phase 2.2
 *
 * Core invitation entity with business logic and validation.
 * Implements dual invitation system (email and in-app) and lifecycle management.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromInvitationData = exports.createInvitation = exports.InvitationEntity = void 0;
const invitation_1 = require("../../../../shared/types/invitation");
const membership_1 = require("../../../../shared/types/membership");
const errors_1 = require("../../../../shared/utils/errors");
/**
 * Club invitation entity with business logic
 */
class InvitationEntity {
    constructor(invitation) {
        this.invitation = invitation;
    }
    /**
     * Get invitation data
     */
    toInvitation() {
        return { ...this.invitation };
    }
    /**
     * Get invitation ID
     */
    getId() {
        return this.invitation.invitationId;
    }
    /**
     * Get club ID
     */
    getClubId() {
        return this.invitation.clubId;
    }
    /**
     * Get invitation type
     */
    getType() {
        return this.invitation.type;
    }
    /**
     * Get target email (for email invitations)
     */
    getEmail() {
        return this.invitation.email;
    }
    /**
     * Get target user ID (for user invitations or accepted email invitations)
     */
    getUserId() {
        return this.invitation.userId;
    }
    /**
     * Get invitation role
     */
    getRole() {
        return this.invitation.role;
    }
    /**
     * Get invitation status
     */
    getStatus() {
        return this.invitation.status;
    }
    /**
     * Check if invitation is pending
     */
    isPending() {
        return this.invitation.status === invitation_1.InvitationStatus.PENDING;
    }
    /**
     * Check if invitation is expired
     */
    isExpired() {
        if (this.invitation.status === invitation_1.InvitationStatus.EXPIRED) {
            return true;
        }
        // Check if expiry date has passed
        const now = new Date();
        const expiryDate = new Date(this.invitation.expiresAt);
        return now > expiryDate;
    }
    /**
     * Check if invitation can be processed (accepted/declined)
     */
    canBeProcessed() {
        return this.isPending() && !this.isExpired();
    }
    /**
     * Check if invitation can be cancelled
     */
    canBeCancelled() {
        return this.isPending();
    }
    /**
     * Process invitation (accept or decline)
     */
    process(input, userId) {
        if (!this.canBeProcessed()) {
            throw new errors_1.ValidationError('Invitation cannot be processed - it may be expired or already processed');
        }
        const newStatus = input.action === 'accept' ? invitation_1.InvitationStatus.ACCEPTED : invitation_1.InvitationStatus.DECLINED;
        // Validate status transition
        if (!(0, invitation_1.isValidInvitationStatusTransition)(this.invitation.status, newStatus)) {
            throw new errors_1.ValidationError(`Cannot transition invitation from ${this.invitation.status} to ${newStatus}`);
        }
        const updatedInvitation = {
            ...this.invitation,
            status: newStatus,
            processedAt: new Date().toISOString(),
            // Set userId for email invitations when accepted
            userId: userId || this.invitation.userId,
        };
        return new InvitationEntity(updatedInvitation);
    }
    /**
     * Accept invitation
     */
    accept(userId) {
        return this.process({ action: 'accept' }, userId);
    }
    /**
     * Decline invitation
     */
    decline() {
        return this.process({ action: 'decline' });
    }
    /**
     * Cancel invitation (admin action)
     */
    cancel() {
        if (!this.canBeCancelled()) {
            throw new errors_1.ValidationError('Invitation cannot be cancelled - it may already be processed');
        }
        const updatedInvitation = {
            ...this.invitation,
            status: invitation_1.InvitationStatus.CANCELLED,
            processedAt: new Date().toISOString(),
        };
        return new InvitationEntity(updatedInvitation);
    }
    /**
     * Mark invitation as expired
     */
    expire() {
        if (!(0, invitation_1.isValidInvitationStatusTransition)(this.invitation.status, invitation_1.InvitationStatus.EXPIRED)) {
            throw new errors_1.ValidationError(`Cannot expire invitation with status ${this.invitation.status}`);
        }
        const updatedInvitation = {
            ...this.invitation,
            status: invitation_1.InvitationStatus.EXPIRED,
            processedAt: new Date().toISOString(),
        };
        return new InvitationEntity(updatedInvitation);
    }
}
exports.InvitationEntity = InvitationEntity;
/**
 * Create a new club invitation
 */
function createInvitation(input, clubId, invitedBy) {
    const now = new Date().toISOString();
    const invitationId = generateInvitationId();
    const expiresAt = (0, invitation_1.calculateInvitationExpiry)();
    const baseInvitation = {
        invitationId,
        clubId,
        role: input.role,
        status: invitation_1.InvitationStatus.PENDING,
        invitedBy,
        invitedAt: now,
        expiresAt,
        message: input.message?.trim(),
    };
    let invitation;
    if (input.type === 'email') {
        invitation = {
            ...baseInvitation,
            type: invitation_1.InvitationType.EMAIL,
            email: input.email.toLowerCase().trim(),
            userId: undefined,
            token: (0, invitation_1.generateInvitationToken)(),
            deliveryMethod: 'email',
        };
    }
    else {
        invitation = {
            ...baseInvitation,
            type: invitation_1.InvitationType.USER,
            email: undefined,
            userId: input.userId,
            token: undefined,
            deliveryMethod: 'in_app',
        };
    }
    // Validate invitation data
    validateInvitationData(invitation);
    return new InvitationEntity(invitation);
}
exports.createInvitation = createInvitation;
/**
 * Create invitation entity from existing data
 */
function fromInvitationData(invitation) {
    // Validate existing invitation data
    validateInvitationData(invitation);
    return new InvitationEntity(invitation);
}
exports.fromInvitationData = fromInvitationData;
/**
 * Validate invitation data
 */
function validateInvitationData(invitation) {
    // Validate required fields
    if (!invitation.invitationId || invitation.invitationId.trim().length === 0) {
        throw new errors_1.ValidationError('Invitation ID is required');
    }
    if (!invitation.clubId || invitation.clubId.trim().length === 0) {
        throw new errors_1.ValidationError('Club ID is required');
    }
    if (!invitation.invitedBy || invitation.invitedBy.trim().length === 0) {
        throw new errors_1.ValidationError('Inviter ID is required');
    }
    // Validate type
    if (!Object.values(invitation_1.InvitationType).includes(invitation.type)) {
        throw new errors_1.ValidationError('Invalid invitation type');
    }
    // Validate status
    if (!Object.values(invitation_1.InvitationStatus).includes(invitation.status)) {
        throw new errors_1.ValidationError('Invalid invitation status');
    }
    // Validate role
    if (!Object.values(membership_1.ClubRole).includes(invitation.role)) {
        throw new errors_1.ValidationError('Invalid club role');
    }
    // Type-specific validation
    if (invitation.type === invitation_1.InvitationType.EMAIL) {
        if (!invitation.email || invitation.email.trim().length === 0) {
            throw new errors_1.ValidationError('Email is required for email invitations');
        }
        if (!isValidEmail(invitation.email)) {
            throw new errors_1.ValidationError('Invalid email format');
        }
        if (!invitation.token || invitation.token.length !== invitation_1.INVITATION_CONSTRAINTS.TOKEN_LENGTH) {
            throw new errors_1.ValidationError('Invalid invitation token');
        }
    }
    else {
        if (!invitation.userId || invitation.userId.trim().length === 0) {
            throw new errors_1.ValidationError('User ID is required for user invitations');
        }
    }
    // Validate message length
    if (invitation.message && invitation.message.length > invitation_1.INVITATION_CONSTRAINTS.MESSAGE_MAX_LENGTH) {
        throw new errors_1.ValidationError(`Message must not exceed ${invitation_1.INVITATION_CONSTRAINTS.MESSAGE_MAX_LENGTH} characters`);
    }
    // Validate expiry date
    const expiryDate = new Date(invitation.expiresAt);
    const now = new Date();
    const maxExpiry = new Date(now.getTime() + (invitation_1.INVITATION_CONSTRAINTS.MAX_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
    if (expiryDate > maxExpiry) {
        throw new errors_1.ValidationError(`Invitation expiry cannot exceed ${invitation_1.INVITATION_CONSTRAINTS.MAX_EXPIRY_DAYS} days`);
    }
}
/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
/**
 * Generate unique invitation ID
 */
function generateInvitationId() {
    // Generate a unique invitation ID with timestamp and random component
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `inv_${timestamp}_${random}`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW52aXRhdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImludml0YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7QUFFSCxvRUFXNkM7QUFDN0Msb0VBQStEO0FBQy9ELDREQUFrRTtBQUVsRTs7R0FFRztBQUNILE1BQWEsZ0JBQWdCO0lBQzNCLFlBQW9CLFVBQTBCO1FBQTFCLGVBQVUsR0FBVixVQUFVLENBQWdCO0lBQUcsQ0FBQztJQUVsRDs7T0FFRztJQUNILFlBQVk7UUFDVixPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSztRQUNILE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUM7SUFDdEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUztRQUNQLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7SUFDaEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsT0FBTztRQUNMLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7SUFDOUIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsUUFBUTtRQUNOLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUM7SUFDL0IsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUztRQUNQLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7SUFDaEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsT0FBTztRQUNMLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7SUFDOUIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUztRQUNQLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7SUFDaEMsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUztRQUNQLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEtBQUssNkJBQWdCLENBQUMs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RSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzFDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMxRCxPQUFPLE9BQU8sU0FBUyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBQ3RDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENsdWIgSW52aXRhdGlvbiBFbnRpdHkgLSBQaGFzZSAyLjJcbiAqIFxuICogQ29yZSBpbnZpdGF0aW9uIGVudGl0eSB3aXRoIGJ1c2luZXNzIGxvZ2ljIGFuZCB2YWxpZGF0aW9uLlxuICogSW1wbGVtZW50cyBkdWFsIGludml0YXRpb24gc3lzdGVtIChlbWFpbCBhbmQgaW4tYXBwKSBhbmQgbGlmZWN5Y2xlIG1hbmFnZW1lbnQuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDIuMiBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0yLjIuY2x1Yi1tZW1iZXJzaGlwLXJvbGVzLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgXG4gIENsdWJJbnZpdGF0aW9uLCBcbiAgSW52aXRhdGlvblR5cGUsIFxuICBJbnZpdGF0aW9uU3RhdHVzLCBcbiAgQ3JlYXRlSW52aXRhdGlvbklucHV0LFxuICBQcm9jZXNzSW52aXRhdGlvbklucHV0LFxuICBJTlZJVEFUSU9OX0NPTlNUUkFJTlRTLFxuICBJTlZJVEFUSU9OX1NUQVRVU19UUkFOU0lUSU9OUyxcbiAgaXNWYWxpZEludml0YXRpb25TdGF0dXNUcmFuc2l0aW9uLFxuICBnZW5lcmF0ZUludml0YXRpb25Ub2tlbixcbiAgY2FsY3VsYXRlSW52aXRhdGlvbkV4cGlyeVxufSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvaW52aXRhdGlvbic7XG5pbXBvcnQgeyBDbHViUm9sZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9tZW1iZXJzaGlwJztcbmltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9lcnJvcnMnO1xuXG4vKipcbiAqIENsdWIgaW52aXRhdGlvbiBlbnRpdHkgd2l0aCBidXNpbmVzcyBsb2dpY1xuICovXG5leHBvcnQgY2xhc3MgSW52aXRhdGlvbkVudGl0eSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgaW52aXRhdGlvbjogQ2x1Ykludml0YXRpb24pIHt9XG5cbiAgLyoqXG4gICAqIEdldCBpbnZpdGF0aW9uIGRhdGFcbiAgICovXG4gIHRvSW52aXRhdGlvbigpOiBDbHViSW52aXRhdGlvbiB7XG4gICAgcmV0dXJuIHsgLi4udGhpcy5pbnZpdGF0aW9uIH07XG4gIH1cblxuICAvKipcbiAgICogR2V0IGludml0YXRpb24gSURcbiAgICovXG4gIGdldElkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuaW52aXRhdGlvbi5pbnZpdGF0aW9uSWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNsdWIgSURcbiAgICovXG4gIGdldENsdWJJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmludml0YXRpb24uY2x1YklkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBpbnZpdGF0aW9uIHR5cGVcbiAgICovXG4gIGdldFR5cGUoKTogSW52aXRhdGlvblR5cGUge1xuICAgIHJldHVybiB0aGlzLmludml0YXRpb24udHlwZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGFyZ2V0IGVtYWlsIChmb3IgZW1haWwgaW52aXRhdGlvbnMpXG4gICAqL1xuICBnZXRFbWFpbCgpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmludml0YXRpb24uZW1haWw7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRhcmdldCB1c2VyIElEIChmb3IgdXNlciBpbnZpdGF0aW9ucyBvciBhY2NlcHRlZCBlbWFpbCBpbnZpdGF0aW9ucylcbiAgICovXG4gIGdldFVzZXJJZCgpOiBzdHJpbmcgfCB1bmRlZmluZWQge1xuICAgIHJldHVybiB0aGlzLmludml0YXRpb24udXNlcklkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBpbnZpdGF0aW9uIHJvbGVcbiAgICovXG4gIGdldFJvbGUoKTogQ2x1YlJvbGUge1xuICAgIHJldHVybiB0aGlzLmludml0YXRpb24ucm9sZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgaW52aXRhdGlvbiBzdGF0dXNcbiAgICovXG4gIGdldFN0YXR1cygpOiBJbnZpdGF0aW9uU3RhdHVzIHtcbiAgICByZXR1cm4gdGhpcy5pbnZpdGF0aW9uLnN0YXR1cztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBpbnZpdGF0aW9uIGlzIHBlbmRpbmdcbiAgICovXG4gIGlzUGVuZGluZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pbnZpdGF0aW9uLnN0YXR1cyA9PT0gSW52aXRhdGlvblN0YXR1cy5QRU5ESU5HO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGludml0YXRpb24gaXMgZXhwaXJlZFxuICAgKi9cbiAgaXNFeHBpcmVkKCk6IGJvb2xlYW4ge1xuICAgIGlmICh0aGlzLmludml0YXRpb24uc3RhdHVzID09PSBJbnZpdGF0aW9uU3RhdHVzLkVYUElSRUQpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBcbiAgICAvLyBDaGVjayBpZiBleHBpcnkgZGF0ZSBoYXMgcGFzc2VkXG4gICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgICBjb25zdCBleHBpcnlEYXRlID0gbmV3IERhdGUodGhpcy5pbnZpdGF0aW9uLmV4cGlyZXNBdCk7XG4gICAgcmV0dXJuIG5vdyA+IGV4cGlyeURhdGU7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgaW52aXRhdGlvbiBjYW4gYmUgcHJvY2Vzc2VkIChhY2NlcHRlZC9kZWNsaW5lZClcbiAgICovXG4gIGNhbkJlUHJvY2Vzc2VkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzUGVuZGluZygpICYmICF0aGlzLmlzRXhwaXJlZCgpO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGludml0YXRpb24gY2FuIGJlIGNhbmNlbGxlZFxuICAgKi9cbiAgY2FuQmVDYW5jZWxsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaXNQZW5kaW5nKCk7XG4gIH1cblxuICAvKipcbiAgICogUHJvY2VzcyBpbnZpdGF0aW9uIChhY2NlcHQgb3IgZGVjbGluZSlcbiAgICovXG4gIHByb2Nlc3MoaW5wdXQ6IFByb2Nlc3NJbnZpdGF0aW9uSW5wdXQsIHVzZXJJZD86IHN0cmluZyk6IEludml0YXRpb25FbnRpdHkge1xuICAgIGlmICghdGhpcy5jYW5CZVByb2Nlc3NlZCgpKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnZpdGF0aW9uIGNhbm5vdCBiZSBwcm9jZXNzZWQgLSBpdCBtYXkgYmUgZXhwaXJlZCBvciBhbHJlYWR5IHByb2Nlc3NlZCcpO1xuICAgIH1cblxuICAgIGNvbnN0IG5ld1N0YXR1cyA9IGlucHV0LmFjdGlvbiA9PT0gJ2FjY2VwdCcgPyBJbnZpdGF0aW9uU3RhdHVzLkFDQ0VQVEVEIDogSW52aXRhdGlvblN0YXR1cy5ERUNMSU5FRDtcbiAgICBcbiAgICAvLyBWYWxpZGF0ZSBzdGF0dXMgdHJhbnNpdGlvblxuICAgIGlmICghaXNWYWxpZEludml0YXRpb25TdGF0dXNUcmFuc2l0aW9uKHRoaXMuaW52aXRhdGlvbi5zdGF0dXMsIG5ld1N0YXR1cykpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoYENhbm5vdCB0cmFuc2l0aW9uIGludml0YXRpb24gZnJvbSAke3RoaXMuaW52aXRhdGlvbi5zdGF0dXN9IHRvICR7bmV3U3RhdHVzfWApO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRJbnZpdGF0aW9uOiBDbHViSW52aXRhdGlvbiA9IHtcbiAgICAgIC4uLnRoaXMuaW52aXRhdGlvbixcbiAgICAgIHN0YXR1czogbmV3U3RhdHVzLFxuICAgICAgcHJvY2Vzc2VkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIC8vIFNldCB1c2VySWQgZm9yIGVtYWlsIGludml0YXRpb25zIHdoZW4gYWNjZXB0ZWRcbiAgICAgIHVzZXJJZDogdXNlcklkIHx8IHRoaXMuaW52aXRhdGlvbi51c2VySWQsXG4gICAgfTtcblxuICAgIHJldHVybiBuZXcgSW52aXRhdGlvbkVudGl0eSh1cGRhdGVkSW52aXRhdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogQWNjZXB0IGludml0YXRpb25cbiAgICovXG4gIGFjY2VwdCh1c2VySWQ/OiBzdHJpbmcpOiBJbnZpdGF0aW9uRW50aXR5IHtcbiAgICByZXR1cm4gdGhpcy5wcm9jZXNzKHsgYWN0aW9uOiAnYWNjZXB0JyB9LCB1c2VySWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlY2xpbmUgaW52aXRhdGlvblxuICAgKi9cbiAgZGVjbGluZSgpOiBJbnZpdGF0aW9uRW50aXR5IHtcbiAgICByZXR1cm4gdGhpcy5wcm9jZXNzKHsgYWN0aW9uOiAnZGVjbGluZScgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2FuY2VsIGludml0YXRpb24gKGFkbWluIGFjdGlvbilcbiAgICovXG4gIGNhbmNlbCgpOiBJbnZpdGF0aW9uRW50aXR5IHtcbiAgICBpZiAoIXRoaXMuY2FuQmVDYW5jZWxsZWQoKSkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignSW52aXRhdGlvbiBjYW5ub3QgYmUgY2FuY2VsbGVkIC0gaXQgbWF5IGFscmVhZHkgYmUgcHJvY2Vzc2VkJyk7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZEludml0YXRpb246IENsdWJJbnZpdGF0aW9uID0ge1xuICAgICAgLi4udGhpcy5pbnZpdGF0aW9uLFxuICAgICAgc3RhdHVzOiBJbnZpdGF0aW9uU3RhdHVzLkNBTkNFTExFRCxcbiAgICAgIHByb2Nlc3NlZEF0OiBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCksXG4gICAgfTtcblxuICAgIHJldHVybiBuZXcgSW52aXRhdGlvbkVudGl0eSh1cGRhdGVkSW52aXRhdGlvbik7XG4gIH1cblxuICAvKipcbiAgICogTWFyayBpbnZpdGF0aW9uIGFzIGV4cGlyZWRcbiAgICovXG4gIGV4cGlyZSgpOiBJbnZpdGF0aW9uRW50aXR5IHtcbiAgICBpZiAoIWlzVmFsaWRJbnZpdGF0aW9uU3RhdHVzVHJhbnNpdGlvbih0aGlzLmludml0YXRpb24uc3RhdHVzLCBJbnZpdGF0aW9uU3RhdHVzLkVYUElSRUQpKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKGBDYW5ub3QgZXhwaXJlIGludml0YXRpb24gd2l0aCBzdGF0dXMgJHt0aGlzLmludml0YXRpb24uc3RhdHVzfWApO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRJbnZpdGF0aW9uOiBDbHViSW52aXRhdGlvbiA9IHtcbiAgICAgIC4uLnRoaXMuaW52aXRhdGlvbixcbiAgICAgIHN0YXR1czogSW52aXRhdGlvblN0YXR1cy5FWFBJUkVELFxuICAgICAgcHJvY2Vzc2VkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICB9O1xuXG4gICAgcmV0dXJuIG5ldyBJbnZpdGF0aW9uRW50aXR5KHVwZGF0ZWRJbnZpdGF0aW9uKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBjbHViIGludml0YXRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUludml0YXRpb24oXG4gIGlucHV0OiBDcmVhdGVJbnZpdGF0aW9uSW5wdXQsXG4gIGNsdWJJZDogc3RyaW5nLFxuICBpbnZpdGVkQnk6IHN0cmluZ1xuKTogSW52aXRhdGlvbkVudGl0eSB7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgY29uc3QgaW52aXRhdGlvbklkID0gZ2VuZXJhdGVJbnZpdGF0aW9uSWQoKTtcbiAgY29uc3QgZXhwaXJlc0F0ID0gY2FsY3VsYXRlSW52aXRhdGlvbkV4cGlyeSgpO1xuXG4gIGNvbnN0IGJhc2VJbnZpdGF0aW9uID0ge1xuICAgIGludml0YXRpb25JZCxcbiAgICBjbHViSWQsXG4gICAgcm9sZTogaW5wdXQucm9sZSxcbiAgICBzdGF0dXM6IEludml0YXRpb25TdGF0dXMuUEVORElORyxcbiAgICBpbnZpdGVkQnksXG4gICAgaW52aXRlZEF0OiBub3csXG4gICAgZXhwaXJlc0F0LFxuICAgIG1lc3NhZ2U6IGlucHV0Lm1lc3NhZ2U/LnRyaW0oKSxcbiAgfTtcblxuICBsZXQgaW52aXRhdGlvbjogQ2x1Ykludml0YXRpb247XG5cbiAgaWYgKGlucHV0LnR5cGUgPT09ICdlbWFpbCcpIHtcbiAgICBpbnZpdGF0aW9uID0ge1xuICAgICAgLi4uYmFzZUludml0YXRpb24sXG4gICAgICB0eXBlOiBJbnZpdGF0aW9uVHlwZS5FTUFJTCxcbiAgICAgIGVtYWlsOiBpbnB1dC5lbWFpbC50b0xvd2VyQ2FzZSgpLnRyaW0oKSxcbiAgICAgIHVzZXJJZDogdW5kZWZpbmVkLFxuICAgICAgdG9rZW46IGdlbmVyYXRlSW52aXRhdGlvblRva2VuKCksXG4gICAgICBkZWxpdmVyeU1ldGhvZDogJ2VtYWlsJyxcbiAgICB9O1xuICB9IGVsc2Uge1xuICAgIGludml0YXRpb24gPSB7XG4gICAgICAuLi5iYXNlSW52aXRhdGlvbixcbiAgICAgIHR5cGU6IEludml0YXRpb25UeXBlLlVTRVIsXG4gICAgICBlbWFpbDogdW5kZWZpbmVkLFxuICAgICAgdXNlcklkOiBpbnB1dC51c2VySWQsXG4gICAgICB0b2tlbjogdW5kZWZpbmVkLFxuICAgICAgZGVsaXZlcnlNZXRob2Q6ICdpbl9hcHAnLFxuICAgIH07XG4gIH1cblxuICAvLyBWYWxpZGF0ZSBpbnZpdGF0aW9uIGRhdGFcbiAgdmFsaWRhdGVJbnZpdGF0aW9uRGF0YShpbnZpdGF0aW9uKTtcblxuICByZXR1cm4gbmV3IEludml0YXRpb25FbnRpdHkoaW52aXRhdGlvbik7XG59XG5cbi8qKlxuICogQ3JlYXRlIGludml0YXRpb24gZW50aXR5IGZyb20gZXhpc3RpbmcgZGF0YVxuICovXG5leHBvcnQgZnVuY3Rpb24gZnJvbUludml0YXRpb25EYXRhKGludml0YXRpb246IENsdWJJbnZpdGF0aW9uKTogSW52aXRhdGlvbkVudGl0eSB7XG4gIC8vIFZhbGlkYXRlIGV4aXN0aW5nIGludml0YXRpb24gZGF0YVxuICB2YWxpZGF0ZUludml0YXRpb25EYXRhKGludml0YXRpb24pO1xuICByZXR1cm4gbmV3IEludml0YXRpb25FbnRpdHkoaW52aXRhdGlvbik7XG59XG5cbi8qKlxuICogVmFsaWRhdGUgaW52aXRhdGlvbiBkYXRhXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlSW52aXRhdGlvbkRhdGEoaW52aXRhdGlvbjogQ2x1Ykludml0YXRpb24pOiB2b2lkIHtcbiAgLy8gVmFsaWRhdGUgcmVxdWlyZWQgZmllbGRzXG4gIGlmICghaW52aXRhdGlvbi5pbnZpdGF0aW9uSWQgfHwgaW52aXRhdGlvbi5pbnZpdGF0aW9uSWQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0ludml0YXRpb24gSUQgaXMgcmVxdWlyZWQnKTtcbiAgfVxuXG4gIGlmICghaW52aXRhdGlvbi5jbHViSWQgfHwgaW52aXRhdGlvbi5jbHViSWQudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0NsdWIgSUQgaXMgcmVxdWlyZWQnKTtcbiAgfVxuXG4gIGlmICghaW52aXRhdGlvbi5pbnZpdGVkQnkgfHwgaW52aXRhdGlvbi5pbnZpdGVkQnkudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0ludml0ZXIgSUQgaXMgcmVxdWlyZWQnKTtcbiAgfVxuXG4gIC8vIFZhbGlkYXRlIHR5cGVcbiAgaWYgKCFPYmplY3QudmFsdWVzKEludml0YXRpb25UeXBlKS5pbmNsdWRlcyhpbnZpdGF0aW9uLnR5cGUpKSB7XG4gICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignSW52YWxpZCBpbnZpdGF0aW9uIHR5cGUnKTtcbiAgfVxuXG4gIC8vIFZhbGlkYXRlIHN0YXR1c1xuICBpZiAoIU9iamVjdC52YWx1ZXMoSW52aXRhdGlvblN0YXR1cykuaW5jbHVkZXMoaW52aXRhdGlvbi5zdGF0dXMpKSB7XG4gICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignSW52YWxpZCBpbnZpdGF0aW9uIHN0YXR1cycpO1xuICB9XG5cbiAgLy8gVmFsaWRhdGUgcm9sZVxuICBpZiAoIU9iamVjdC52YWx1ZXMoQ2x1YlJvbGUpLmluY2x1ZGVzKGludml0YXRpb24ucm9sZSkpIHtcbiAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnZhbGlkIGNsdWIgcm9sZScpO1xuICB9XG5cbiAgLy8gVHlwZS1zcGVjaWZpYyB2YWxpZGF0aW9uXG4gIGlmIChpbnZpdGF0aW9uLnR5cGUgPT09IEludml0YXRpb25UeXBlLkVNQUlMKSB7XG4gICAgaWYgKCFpbnZpdGF0aW9uLmVtYWlsIHx8IGludml0YXRpb24uZW1haWwudHJpbSgpLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignRW1haWwgaXMgcmVxdWlyZWQgZm9yIGVtYWlsIGludml0YXRpb25zJyk7XG4gICAgfVxuICAgIFxuICAgIGlmICghaXNWYWxpZEVtYWlsKGludml0YXRpb24uZW1haWwpKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnZhbGlkIGVtYWlsIGZvcm1hdCcpO1xuICAgIH1cblxuICAgIGlmICghaW52aXRhdGlvbi50b2tlbiB8fCBpbnZpdGF0aW9uLnRva2VuLmxlbmd0aCAhPT0gSU5WSVRBVElPTl9DT05TVFJBSU5UUy5UT0tFTl9MRU5HVEgpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0ludmFsaWQgaW52aXRhdGlvbiB0b2tlbicpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoIWludml0YXRpb24udXNlcklkIHx8IGludml0YXRpb24udXNlcklkLnRyaW0oKS5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ1VzZXIgSUQgaXMgcmVxdWlyZWQgZm9yIHVzZXIgaW52aXRhdGlvbnMnKTtcbiAgICB9XG4gIH1cblxuICAvLyBWYWxpZGF0ZSBtZXNzYWdlIGxlbmd0aFxuICBpZiAoaW52aXRhdGlvbi5tZXNzYWdlICYmIGludml0YXRpb24ubWVzc2FnZS5sZW5ndGggPiBJTlZJVEFUSU9OX0NPTlNUUkFJTlRTLk1FU1NBR0VfTUFYX0xFTkdUSCkge1xuICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoYE1lc3NhZ2UgbXVzdCBub3QgZXhjZWVkICR7SU5WSVRBVElPTl9DT05TVFJBSU5UUy5NRVNTQUdFX01BWF9MRU5HVEh9IGNoYXJhY3RlcnNgKTtcbiAgfVxuXG4gIC8vIFZhbGlkYXRlIGV4cGlyeSBkYXRlXG4gIGNvbnN0IGV4cGlyeURhdGUgPSBuZXcgRGF0ZShpbnZpdGF0aW9uLmV4cGlyZXNBdCk7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IG1heEV4cGlyeSA9IG5ldyBEYXRlKG5vdy5nZXRUaW1lKCkgKyAoSU5WSVRBVElPTl9DT05TVFJBSU5UUy5NQVhfRVhQSVJZX0RBWVMgKiAyNCAqIDYwICogNjAgKiAxMDAwKSk7XG4gIFxuICBpZiAoZXhwaXJ5RGF0ZSA+IG1heEV4cGlyeSkge1xuICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoYEludml0YXRpb24gZXhwaXJ5IGNhbm5vdCBleGNlZWQgJHtJTlZJVEFUSU9OX0NPTlNUUkFJTlRTLk1BWF9FWFBJUllfREFZU30gZGF5c2ApO1xuICB9XG59XG5cbi8qKlxuICogVmFsaWRhdGUgZW1haWwgZm9ybWF0XG4gKi9cbmZ1bmN0aW9uIGlzVmFsaWRFbWFpbChlbWFpbDogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IGVtYWlsUmVnZXggPSAvXlteXFxzQF0rQFteXFxzQF0rXFwuW15cXHNAXSskLztcbiAgcmV0dXJuIGVtYWlsUmVnZXgudGVzdChlbWFpbCk7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgdW5pcXVlIGludml0YXRpb24gSURcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbnZpdGF0aW9uSWQoKTogc3RyaW5nIHtcbiAgLy8gR2VuZXJhdGUgYSB1bmlxdWUgaW52aXRhdGlvbiBJRCB3aXRoIHRpbWVzdGFtcCBhbmQgcmFuZG9tIGNvbXBvbmVudFxuICBjb25zdCB0aW1lc3RhbXAgPSBEYXRlLm5vdygpLnRvU3RyaW5nKDM2KTtcbiAgY29uc3QgcmFuZG9tID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDgpO1xuICByZXR1cm4gYGludl8ke3RpbWVzdGFtcH1fJHtyYW5kb219YDtcbn0iXX0=