"use strict";
/**
 * Club Membership Entity - Phase 2.2
 *
 * Core membership entity with business logic and validation.
 * Implements membership lifecycle management and role transitions.
 *
 * Compliance:
 * - Phase 2.2 Spec: .kiro/specs/phase-2.2.club-membership-roles.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fromMembershipData = exports.createMembership = exports.MembershipEntity = void 0;
const membership_1 = require("../../../../shared/types/membership");
const errors_1 = require("../../../../shared/utils/errors");
/**
 * Club membership entity with business logic
 */
class MembershipEntity {
    constructor(membership) {
        this.membership = membership;
    }
    /**
     * Get membership data
     */
    toMembership() {
        return { ...this.membership };
    }
    /**
     * Get membership ID
     */
    getId() {
        return this.membership.membershipId;
    }
    /**
     * Get club ID
     */
    getClubId() {
        return this.membership.clubId;
    }
    /**
     * Get user ID
     */
    getUserId() {
        return this.membership.userId;
    }
    /**
     * Get membership role
     */
    getRole() {
        return this.membership.role;
    }
    /**
     * Get membership status
     */
    getStatus() {
        return this.membership.status;
    }
    /**
     * Check if membership is active
     */
    isActive() {
        return this.membership.status === membership_1.MembershipStatus.ACTIVE;
    }
    /**
     * Check if membership is pending
     */
    isPending() {
        return this.membership.status === membership_1.MembershipStatus.PENDING;
    }
    /**
     * Check if member is owner
     */
    isOwner() {
        return this.membership.role === membership_1.ClubRole.OWNER;
    }
    /**
     * Check if member is admin or owner
     */
    isAdminOrOwner() {
        return this.membership.role === membership_1.ClubRole.ADMIN || this.membership.role === membership_1.ClubRole.OWNER;
    }
    /**
     * Check if member can be removed
     */
    canBeRemoved() {
        // Owners cannot be removed (must transfer ownership first)
        return this.membership.role !== membership_1.ClubRole.OWNER;
    }
    /**
     * Check if member can leave voluntarily
     */
    canLeave() {
        // Owners cannot leave (must transfer ownership first)
        return this.membership.role !== membership_1.ClubRole.OWNER && this.isActive();
    }
    /**
     * Update member role
     */
    updateRole(input, updatedBy) {
        // Validate role transition
        validateRoleTransition(this.membership.role, input.role);
        // Owners cannot be demoted (must transfer ownership first)
        if (this.membership.role === membership_1.ClubRole.OWNER) {
            throw new errors_1.ValidationError('Cannot change owner role - ownership transfer required');
        }
        const updatedMembership = {
            ...this.membership,
            role: input.role,
            updatedAt: new Date().toISOString(),
            processedBy: updatedBy,
            processedAt: new Date().toISOString(),
            reason: input.reason,
        };
        return new MembershipEntity(updatedMembership);
    }
    /**
     * Change membership status
     */
    changeStatus(newStatus, processedBy, reason) {
        if (this.membership.status === newStatus) {
            return this; // No change needed
        }
        // Validate status transition
        if (!(0, membership_1.isValidMembershipStatusTransition)(this.membership.status, newStatus)) {
            throw new errors_1.ValidationError(`Cannot transition membership from ${this.membership.status} to ${newStatus}`);
        }
        // Owners cannot be suspended or removed (must transfer ownership first)
        if (this.membership.role === membership_1.ClubRole.OWNER &&
            (newStatus === membership_1.MembershipStatus.SUSPENDED || newStatus === membership_1.MembershipStatus.REMOVED)) {
            throw new errors_1.ValidationError('Cannot suspend or remove owner - ownership transfer required');
        }
        const updatedMembership = {
            ...this.membership,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            processedBy,
            processedAt: processedBy ? new Date().toISOString() : undefined,
            reason,
        };
        return new MembershipEntity(updatedMembership);
    }
    /**
     * Activate pending membership (accept join request or invitation)
     */
    activate(processedBy) {
        return this.changeStatus(membership_1.MembershipStatus.ACTIVE, processedBy, 'Membership activated');
    }
    /**
     * Remove membership
     */
    remove(processedBy, reason) {
        return this.changeStatus(membership_1.MembershipStatus.REMOVED, processedBy, reason || 'Member removed');
    }
    /**
     * Suspend membership
     */
    suspend(processedBy, reason) {
        return this.changeStatus(membership_1.MembershipStatus.SUSPENDED, processedBy, reason || 'Member suspended');
    }
    /**
     * Reinstate suspended membership
     */
    reinstate(processedBy) {
        return this.changeStatus(membership_1.MembershipStatus.ACTIVE, processedBy, 'Member reinstated');
    }
}
exports.MembershipEntity = MembershipEntity;
/**
 * Create a new club membership (join request)
 */
function createMembership(clubId, userId, role = membership_1.ClubRole.MEMBER, status = membership_1.MembershipStatus.PENDING, joinMessage, invitedBy) {
    const now = new Date().toISOString();
    const membershipId = generateMembershipId();
    const membership = {
        membershipId,
        clubId,
        userId,
        role,
        status,
        joinedAt: now,
        updatedAt: now,
        joinMessage: joinMessage?.trim(),
        invitedBy,
    };
    // Validate membership data
    validateMembershipData(membership);
    return new MembershipEntity(membership);
}
exports.createMembership = createMembership;
/**
 * Create membership entity from existing data
 */
function fromMembershipData(membership) {
    // Validate existing membership data
    validateMembershipData(membership);
    return new MembershipEntity(membership);
}
exports.fromMembershipData = fromMembershipData;
/**
 * Validate membership data
 */
function validateMembershipData(membership) {
    // Validate required fields
    if (!membership.membershipId || membership.membershipId.trim().length === 0) {
        throw new errors_1.ValidationError('Membership ID is required');
    }
    if (!membership.clubId || membership.clubId.trim().length === 0) {
        throw new errors_1.ValidationError('Club ID is required');
    }
    if (!membership.userId || membership.userId.trim().length === 0) {
        throw new errors_1.ValidationError('User ID is required');
    }
    // Validate role
    if (!Object.values(membership_1.ClubRole).includes(membership.role)) {
        throw new errors_1.ValidationError('Invalid club role');
    }
    // Validate status
    if (!Object.values(membership_1.MembershipStatus).includes(membership.status)) {
        throw new errors_1.ValidationError('Invalid membership status');
    }
    // Validate join message length
    if (membership.joinMessage && membership.joinMessage.length > membership_1.MEMBERSHIP_CONSTRAINTS.JOIN_MESSAGE_MAX_LENGTH) {
        throw new errors_1.ValidationError(`Join message must not exceed ${membership_1.MEMBERSHIP_CONSTRAINTS.JOIN_MESSAGE_MAX_LENGTH} characters`);
    }
    // Validate reason length
    if (membership.reason && membership.reason.length > membership_1.MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH) {
        throw new errors_1.ValidationError(`Reason must not exceed ${membership_1.MEMBERSHIP_CONSTRAINTS.REASON_MAX_LENGTH} characters`);
    }
}
/**
 * Validate role transition
 */
function validateRoleTransition(currentRole, newRole) {
    // Define allowed role transitions
    const allowedTransitions = {
        [membership_1.ClubRole.MEMBER]: [membership_1.ClubRole.CAPTAIN, membership_1.ClubRole.ADMIN],
        [membership_1.ClubRole.CAPTAIN]: [membership_1.ClubRole.MEMBER, membership_1.ClubRole.ADMIN],
        [membership_1.ClubRole.ADMIN]: [membership_1.ClubRole.CAPTAIN, membership_1.ClubRole.MEMBER],
        [membership_1.ClubRole.OWNER]: [], // Owners cannot change roles (must transfer ownership)
    };
    const allowed = allowedTransitions[currentRole];
    if (!allowed.includes(newRole)) {
        throw new errors_1.ValidationError(`Cannot transition role from ${currentRole} to ${newRole}`);
    }
}
/**
 * Generate unique membership ID
 */
function generateMembershipId() {
    // Generate a unique membership ID with timestamp and random component
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `mem_${timestamp}_${random}`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWVtYmVyc2hpcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1lbWJlcnNoaXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7OztHQVFHOzs7QUFFSCxvRUFRNkM7QUFDN0MsNERBQWtFO0FBRWxFOztHQUVHO0FBQ0gsTUFBYSxnQkFBZ0I7SUFDM0IsWUFBb0IsVUFBMEI7UUFBMUIsZUFBVSxHQUFWLFVBQVUsQ0FBZ0I7SUFBRyxDQUFDO0lBRWxEOztPQUVHO0lBQ0gsWUFBWTtRQUNWLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLO1FBQ0gsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFlBQVksQ0FBQztJQUN0QyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFTO1FBQ1AsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztJQUNoQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFTO1FBQ1AsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztJQUNoQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxPQUFPO1FBQ0wsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQztJQUM5QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxTQUFTO1FBQ1AsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQztJQUNoQyxDQUFDO0lBRUQ7O09BRUc7SUFDSCxRQUFRO1FBQ04sT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sS0FBSyw2QkFBZ0IsQ0FBQyxNQUFNLENBQUM7SUFDNUQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsU0FBUztRQUNQLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEtBQUssNkJBQWdCLENBQUMsT0FBTyxDQUFDO0lBQzdELENBQUM7SUFFRDs7T0FFRztJQUNILE9BQU87UUFDTCxPQUFPLElBQUksQ0FBQyxV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RSx1REFBdUQ7S0FDOUUsQ0FBQztJQUVGLE1BQU0sT0FBTyxHQUFHLGtCQUFrQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ2hELElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1FBQzlCLE1BQU0sSUFBSSx3QkFBZSxDQUFDLCtCQUErQixXQUFXLE9BQU8sT0FBTyxFQUFFLENBQUMsQ0FBQztLQUN2RjtBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILFNBQVMsb0JBQW9CO0lBQzNCLHNFQUFzRTtJQUN0RSxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzFDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUMxRCxPQUFPLE9BQU8sU0FBUyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBQ3RDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENsdWIgTWVtYmVyc2hpcCBFbnRpdHkgLSBQaGFzZSAyLjJcbiAqIFxuICogQ29yZSBtZW1iZXJzaGlwIGVudGl0eSB3aXRoIGJ1c2luZXNzIGxvZ2ljIGFuZCB2YWxpZGF0aW9uLlxuICogSW1wbGVtZW50cyBtZW1iZXJzaGlwIGxpZmVjeWNsZSBtYW5hZ2VtZW50IGFuZCByb2xlIHRyYW5zaXRpb25zLlxuICogXG4gKiBDb21wbGlhbmNlOlxuICogLSBQaGFzZSAyLjIgU3BlYzogLmtpcm8vc3BlY3MvcGhhc2UtMi4yLmNsdWItbWVtYmVyc2hpcC1yb2xlcy52MS5tZFxuICovXG5cbmltcG9ydCB7IFxuICBDbHViTWVtYmVyc2hpcCwgXG4gIENsdWJSb2xlLCBcbiAgTWVtYmVyc2hpcFN0YXR1cywgXG4gIFVwZGF0ZU1lbWJlcklucHV0LFxuICBNRU1CRVJTSElQX0NPTlNUUkFJTlRTLFxuICBNRU1CRVJTSElQX1NUQVRVU19UUkFOU0lUSU9OUyxcbiAgaXNWYWxpZE1lbWJlcnNoaXBTdGF0dXNUcmFuc2l0aW9uXG59IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9tZW1iZXJzaGlwJztcbmltcG9ydCB7IFZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscy9lcnJvcnMnO1xuXG4vKipcbiAqIENsdWIgbWVtYmVyc2hpcCBlbnRpdHkgd2l0aCBidXNpbmVzcyBsb2dpY1xuICovXG5leHBvcnQgY2xhc3MgTWVtYmVyc2hpcEVudGl0eSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgbWVtYmVyc2hpcDogQ2x1Yk1lbWJlcnNoaXApIHt9XG5cbiAgLyoqXG4gICAqIEdldCBtZW1iZXJzaGlwIGRhdGFcbiAgICovXG4gIHRvTWVtYmVyc2hpcCgpOiBDbHViTWVtYmVyc2hpcCB7XG4gICAgcmV0dXJuIHsgLi4udGhpcy5tZW1iZXJzaGlwIH07XG4gIH1cblxuICAvKipcbiAgICogR2V0IG1lbWJlcnNoaXAgSURcbiAgICovXG4gIGdldElkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMubWVtYmVyc2hpcC5tZW1iZXJzaGlwSWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNsdWIgSURcbiAgICovXG4gIGdldENsdWJJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLm1lbWJlcnNoaXAuY2x1YklkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyIElEXG4gICAqL1xuICBnZXRVc2VySWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5tZW1iZXJzaGlwLnVzZXJJZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgbWVtYmVyc2hpcCByb2xlXG4gICAqL1xuICBnZXRSb2xlKCk6IENsdWJSb2xlIHtcbiAgICByZXR1cm4gdGhpcy5tZW1iZXJzaGlwLnJvbGU7XG4gIH1cblxuICAvKipcbiAgICogR2V0IG1lbWJlcnNoaXAgc3RhdHVzXG4gICAqL1xuICBnZXRTdGF0dXMoKTogTWVtYmVyc2hpcFN0YXR1cyB7XG4gICAgcmV0dXJuIHRoaXMubWVtYmVyc2hpcC5zdGF0dXM7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgbWVtYmVyc2hpcCBpcyBhY3RpdmVcbiAgICovXG4gIGlzQWN0aXZlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLm1lbWJlcnNoaXAuc3RhdHVzID09PSBNZW1iZXJzaGlwU3RhdHVzLkFDVElWRTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBtZW1iZXJzaGlwIGlzIHBlbmRpbmdcbiAgICovXG4gIGlzUGVuZGluZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5tZW1iZXJzaGlwLnN0YXR1cyA9PT0gTWVtYmVyc2hpcFN0YXR1cy5QRU5ESU5HO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIG1lbWJlciBpcyBvd25lclxuICAgKi9cbiAgaXNPd25lcigpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5tZW1iZXJzaGlwLnJvbGUgPT09IENsdWJSb2xlLk9XTkVSO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIG1lbWJlciBpcyBhZG1pbiBvciBvd25lclxuICAgKi9cbiAgaXNBZG1pbk9yT3duZXIoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMubWVtYmVyc2hpcC5yb2xlID09PSBDbHViUm9sZS5BRE1JTiB8fCB0aGlzLm1lbWJlcnNoaXAucm9sZSA9PT0gQ2x1YlJvbGUuT1dORVI7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgbWVtYmVyIGNhbiBiZSByZW1vdmVkXG4gICAqL1xuICBjYW5CZVJlbW92ZWQoKTogYm9vbGVhbiB7XG4gICAgLy8gT3duZXJzIGNhbm5vdCBiZSByZW1vdmVkIChtdXN0IHRyYW5zZmVyIG93bmVyc2hpcCBmaXJzdClcbiAgICByZXR1cm4gdGhpcy5tZW1iZXJzaGlwLnJvbGUgIT09IENsdWJSb2xlLk9XTkVSO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIG1lbWJlciBjYW4gbGVhdmUgdm9sdW50YXJpbHlcbiAgICovXG4gIGNhbkxlYXZlKCk6IGJvb2xlYW4ge1xuICAgIC8vIE93bmVycyBjYW5ub3QgbGVhdmUgKG11c3QgdHJhbnNmZXIgb3duZXJzaGlwIGZpcnN0KVxuICAgIHJldHVybiB0aGlzLm1lbWJlcnNoaXAucm9sZSAhPT0gQ2x1YlJvbGUuT1dORVIgJiYgdGhpcy5pc0FjdGl2ZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBtZW1iZXIgcm9sZVxuICAgKi9cbiAgdXBkYXRlUm9sZShpbnB1dDogVXBkYXRlTWVtYmVySW5wdXQsIHVwZGF0ZWRCeTogc3RyaW5nKTogTWVtYmVyc2hpcEVudGl0eSB7XG4gICAgLy8gVmFsaWRhdGUgcm9sZSB0cmFuc2l0aW9uXG4gICAgdmFsaWRhdGVSb2xlVHJhbnNpdGlvbih0aGlzLm1lbWJlcnNoaXAucm9sZSwgaW5wdXQucm9sZSk7XG5cbiAgICAvLyBPd25lcnMgY2Fubm90IGJlIGRlbW90ZWQgKG11c3QgdHJhbnNmZXIgb3duZXJzaGlwIGZpcnN0KVxuICAgIGlmICh0aGlzLm1lbWJlcnNoaXAucm9sZSA9PT0gQ2x1YlJvbGUuT1dORVIpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0Nhbm5vdCBjaGFuZ2Ugb3duZXIgcm9sZSAtIG93bmVyc2hpcCB0cmFuc2ZlciByZXF1aXJlZCcpO1xuICAgIH1cblxuICAgIGNvbnN0IHVwZGF0ZWRNZW1iZXJzaGlwOiBDbHViTWVtYmVyc2hpcCA9IHtcbiAgICAgIC4uLnRoaXMubWVtYmVyc2hpcCxcbiAgICAgIHJvbGU6IGlucHV0LnJvbGUsXG4gICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIHByb2Nlc3NlZEJ5OiB1cGRhdGVkQnksXG4gICAgICBwcm9jZXNzZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgICAgcmVhc29uOiBpbnB1dC5yZWFzb24sXG4gICAgfTtcblxuICAgIHJldHVybiBuZXcgTWVtYmVyc2hpcEVudGl0eSh1cGRhdGVkTWVtYmVyc2hpcCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hhbmdlIG1lbWJlcnNoaXAgc3RhdHVzXG4gICAqL1xuICBjaGFuZ2VTdGF0dXMobmV3U3RhdHVzOiBNZW1iZXJzaGlwU3RhdHVzLCBwcm9jZXNzZWRCeT86IHN0cmluZywgcmVhc29uPzogc3RyaW5nKTogTWVtYmVyc2hpcEVudGl0eSB7XG4gICAgaWYgKHRoaXMubWVtYmVyc2hpcC5zdGF0dXMgPT09IG5ld1N0YXR1cykge1xuICAgICAgcmV0dXJuIHRoaXM7IC8vIE5vIGNoYW5nZSBuZWVkZWRcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBzdGF0dXMgdHJhbnNpdGlvblxuICAgIGlmICghaXNWYWxpZE1lbWJlcnNoaXBTdGF0dXNUcmFuc2l0aW9uKHRoaXMubWVtYmVyc2hpcC5zdGF0dXMsIG5ld1N0YXR1cykpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoYENhbm5vdCB0cmFuc2l0aW9uIG1lbWJlcnNoaXAgZnJvbSAke3RoaXMubWVtYmVyc2hpcC5zdGF0dXN9IHRvICR7bmV3U3RhdHVzfWApO1xuICAgIH1cblxuICAgIC8vIE93bmVycyBjYW5ub3QgYmUgc3VzcGVuZGVkIG9yIHJlbW92ZWQgKG11c3QgdHJhbnNmZXIgb3duZXJzaGlwIGZpcnN0KVxuICAgIGlmICh0aGlzLm1lbWJlcnNoaXAucm9sZSA9PT0gQ2x1YlJvbGUuT1dORVIgJiYgXG4gICAgICAgIChuZXdTdGF0dXMgPT09IE1lbWJlcnNoaXBTdGF0dXMuU1VTUEVOREVEIHx8IG5ld1N0YXR1cyA9PT0gTWVtYmVyc2hpcFN0YXR1cy5SRU1PVkVEKSkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignQ2Fubm90IHN1c3BlbmQgb3IgcmVtb3ZlIG93bmVyIC0gb3duZXJzaGlwIHRyYW5zZmVyIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgY29uc3QgdXBkYXRlZE1lbWJlcnNoaXA6IENsdWJNZW1iZXJzaGlwID0ge1xuICAgICAgLi4udGhpcy5tZW1iZXJzaGlwLFxuICAgICAgc3RhdHVzOiBuZXdTdGF0dXMsXG4gICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKSxcbiAgICAgIHByb2Nlc3NlZEJ5LFxuICAgICAgcHJvY2Vzc2VkQXQ6IHByb2Nlc3NlZEJ5ID8gbmV3IERhdGUoKS50b0lTT1N0cmluZygpIDogdW5kZWZpbmVkLFxuICAgICAgcmVhc29uLFxuICAgIH07XG5cbiAgICByZXR1cm4gbmV3IE1lbWJlcnNoaXBFbnRpdHkodXBkYXRlZE1lbWJlcnNoaXApO1xuICB9XG5cbiAgLyoqXG4gICAqIEFjdGl2YXRlIHBlbmRpbmcgbWVtYmVyc2hpcCAoYWNjZXB0IGpvaW4gcmVxdWVzdCBvciBpbnZpdGF0aW9uKVxuICAgKi9cbiAgYWN0aXZhdGUocHJvY2Vzc2VkQnk/OiBzdHJpbmcpOiBNZW1iZXJzaGlwRW50aXR5IHtcbiAgICByZXR1cm4gdGhpcy5jaGFuZ2VTdGF0dXMoTWVtYmVyc2hpcFN0YXR1cy5BQ1RJVkUsIHByb2Nlc3NlZEJ5LCAnTWVtYmVyc2hpcCBhY3RpdmF0ZWQnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgbWVtYmVyc2hpcFxuICAgKi9cbiAgcmVtb3ZlKHByb2Nlc3NlZEJ5OiBzdHJpbmcsIHJlYXNvbj86IHN0cmluZyk6IE1lbWJlcnNoaXBFbnRpdHkge1xuICAgIHJldHVybiB0aGlzLmNoYW5nZVN0YXR1cyhNZW1iZXJzaGlwU3RhdHVzLlJFTU9WRUQsIHByb2Nlc3NlZEJ5LCByZWFzb24gfHwgJ01lbWJlciByZW1vdmVkJyk7XG4gIH1cblxuICAvKipcbiAgICogU3VzcGVuZCBtZW1iZXJzaGlwXG4gICAqL1xuICBzdXNwZW5kKHByb2Nlc3NlZEJ5OiBzdHJpbmcsIHJlYXNvbj86IHN0cmluZyk6IE1lbWJlcnNoaXBFbnRpdHkge1xuICAgIHJldHVybiB0aGlzLmNoYW5nZVN0YXR1cyhNZW1iZXJzaGlwU3RhdHVzLlNVU1BFTkRFRCwgcHJvY2Vzc2VkQnksIHJlYXNvbiB8fCAnTWVtYmVyIHN1c3BlbmRlZCcpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlaW5zdGF0ZSBzdXNwZW5kZWQgbWVtYmVyc2hpcFxuICAgKi9cbiAgcmVpbnN0YXRlKHByb2Nlc3NlZEJ5OiBzdHJpbmcpOiBNZW1iZXJzaGlwRW50aXR5IHtcbiAgICByZXR1cm4gdGhpcy5jaGFuZ2VTdGF0dXMoTWVtYmVyc2hpcFN0YXR1cy5BQ1RJVkUsIHByb2Nlc3NlZEJ5LCAnTWVtYmVyIHJlaW5zdGF0ZWQnKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBjbHViIG1lbWJlcnNoaXAgKGpvaW4gcmVxdWVzdClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU1lbWJlcnNoaXAoXG4gIGNsdWJJZDogc3RyaW5nLCBcbiAgdXNlcklkOiBzdHJpbmcsIFxuICByb2xlOiBDbHViUm9sZSA9IENsdWJSb2xlLk1FTUJFUixcbiAgc3RhdHVzOiBNZW1iZXJzaGlwU3RhdHVzID0gTWVtYmVyc2hpcFN0YXR1cy5QRU5ESU5HLFxuICBqb2luTWVzc2FnZT86IHN0cmluZyxcbiAgaW52aXRlZEJ5Pzogc3RyaW5nXG4pOiBNZW1iZXJzaGlwRW50aXR5IHtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICBjb25zdCBtZW1iZXJzaGlwSWQgPSBnZW5lcmF0ZU1lbWJlcnNoaXBJZCgpO1xuXG4gIGNvbnN0IG1lbWJlcnNoaXA6IENsdWJNZW1iZXJzaGlwID0ge1xuICAgIG1lbWJlcnNoaXBJZCxcbiAgICBjbHViSWQsXG4gICAgdXNlcklkLFxuICAgIHJvbGUsXG4gICAgc3RhdHVzLFxuICAgIGpvaW5lZEF0OiBub3csXG4gICAgdXBkYXRlZEF0OiBub3csXG4gICAgam9pbk1lc3NhZ2U6IGpvaW5NZXNzYWdlPy50cmltKCksXG4gICAgaW52aXRlZEJ5LFxuICB9O1xuXG4gIC8vIFZhbGlkYXRlIG1lbWJlcnNoaXAgZGF0YVxuICB2YWxpZGF0ZU1lbWJlcnNoaXBEYXRhKG1lbWJlcnNoaXApO1xuXG4gIHJldHVybiBuZXcgTWVtYmVyc2hpcEVudGl0eShtZW1iZXJzaGlwKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgbWVtYmVyc2hpcCBlbnRpdHkgZnJvbSBleGlzdGluZyBkYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmcm9tTWVtYmVyc2hpcERhdGEobWVtYmVyc2hpcDogQ2x1Yk1lbWJlcnNoaXApOiBNZW1iZXJzaGlwRW50aXR5IHtcbiAgLy8gVmFsaWRhdGUgZXhpc3RpbmcgbWVtYmVyc2hpcCBkYXRhXG4gIHZhbGlkYXRlTWVtYmVyc2hpcERhdGEobWVtYmVyc2hpcCk7XG4gIHJldHVybiBuZXcgTWVtYmVyc2hpcEVudGl0eShtZW1iZXJzaGlwKTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBtZW1iZXJzaGlwIGRhdGFcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVNZW1iZXJzaGlwRGF0YShtZW1iZXJzaGlwOiBDbHViTWVtYmVyc2hpcCk6IHZvaWQge1xuICAvLyBWYWxpZGF0ZSByZXF1aXJlZCBmaWVsZHNcbiAgaWYgKCFtZW1iZXJzaGlwLm1lbWJlcnNoaXBJZCB8fCBtZW1iZXJzaGlwLm1lbWJlcnNoaXBJZC50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignTWVtYmVyc2hpcCBJRCBpcyByZXF1aXJlZCcpO1xuICB9XG5cbiAgaWYgKCFtZW1iZXJzaGlwLmNsdWJJZCB8fCBtZW1iZXJzaGlwLmNsdWJJZC50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignQ2x1YiBJRCBpcyByZXF1aXJlZCcpO1xuICB9XG5cbiAgaWYgKCFtZW1iZXJzaGlwLnVzZXJJZCB8fCBtZW1iZXJzaGlwLnVzZXJJZC50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignVXNlciBJRCBpcyByZXF1aXJlZCcpO1xuICB9XG5cbiAgLy8gVmFsaWRhdGUgcm9sZVxuICBpZiAoIU9iamVjdC52YWx1ZXMoQ2x1YlJvbGUpLmluY2x1ZGVzKG1lbWJlcnNoaXAucm9sZSkpIHtcbiAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnZhbGlkIGNsdWIgcm9sZScpO1xuICB9XG5cbiAgLy8gVmFsaWRhdGUgc3RhdHVzXG4gIGlmICghT2JqZWN0LnZhbHVlcyhNZW1iZXJzaGlwU3RhdHVzKS5pbmNsdWRlcyhtZW1iZXJzaGlwLnN0YXR1cykpIHtcbiAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnZhbGlkIG1lbWJlcnNoaXAgc3RhdHVzJyk7XG4gIH1cblxuICAvLyBWYWxpZGF0ZSBqb2luIG1lc3NhZ2UgbGVuZ3RoXG4gIGlmIChtZW1iZXJzaGlwLmpvaW5NZXNzYWdlICYmIG1lbWJlcnNoaXAuam9pbk1lc3NhZ2UubGVuZ3RoID4gTUVNQkVSU0hJUF9DT05TVFJBSU5UUy5KT0lOX01FU1NBR0VfTUFYX0xFTkdUSCkge1xuICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoYEpvaW4gbWVzc2FnZSBtdXN0IG5vdCBleGNlZWQgJHtNRU1CRVJTSElQX0NPTlNUUkFJTlRTLkpPSU5fTUVTU0FHRV9NQVhfTEVOR1RIfSBjaGFyYWN0ZXJzYCk7XG4gIH1cblxuICAvLyBWYWxpZGF0ZSByZWFzb24gbGVuZ3RoXG4gIGlmIChtZW1iZXJzaGlwLnJlYXNvbiAmJiBtZW1iZXJzaGlwLnJlYXNvbi5sZW5ndGggPiBNRU1CRVJTSElQX0NPTlNUUkFJTlRTLlJFQVNPTl9NQVhfTEVOR1RIKSB7XG4gICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcihgUmVhc29uIG11c3Qgbm90IGV4Y2VlZCAke01FTUJFUlNISVBfQ09OU1RSQUlOVFMuUkVBU09OX01BWF9MRU5HVEh9IGNoYXJhY3RlcnNgKTtcbiAgfVxufVxuXG4vKipcbiAqIFZhbGlkYXRlIHJvbGUgdHJhbnNpdGlvblxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZVJvbGVUcmFuc2l0aW9uKGN1cnJlbnRSb2xlOiBDbHViUm9sZSwgbmV3Um9sZTogQ2x1YlJvbGUpOiB2b2lkIHtcbiAgLy8gRGVmaW5lIGFsbG93ZWQgcm9sZSB0cmFuc2l0aW9uc1xuICBjb25zdCBhbGxvd2VkVHJhbnNpdGlvbnM6IFJlY29yZDxDbHViUm9sZSwgQ2x1YlJvbGVbXT4gPSB7XG4gICAgW0NsdWJSb2xlLk1FTUJFUl06IFtDbHViUm9sZS5DQVBUQUlOLCBDbHViUm9sZS5BRE1JTl0sIC8vIE1lbWJlcnMgY2FuIGJlIHByb21vdGVkIHRvIGNhcHRhaW4gb3IgYWRtaW5cbiAgICBbQ2x1YlJvbGUuQ0FQVEFJTl06IFtDbHViUm9sZS5NRU1CRVIsIENsdWJSb2xlLkFETUlOXSwgLy8gQ2FwdGFpbnMgY2FuIGJlIHByb21vdGVkIHRvIGFkbWluIG9yIGRlbW90ZWQgdG8gbWVtYmVyXG4gICAgW0NsdWJSb2xlLkFETUlOXTogW0NsdWJSb2xlLkNBUFRBSU4sIENsdWJSb2xlLk1FTUJFUl0sIC8vIEFkbWlucyBjYW4gYmUgZGVtb3RlZCB0byBjYXB0YWluIG9yIG1lbWJlclxuICAgIFtDbHViUm9sZS5PV05FUl06IFtdLCAvLyBPd25lcnMgY2Fubm90IGNoYW5nZSByb2xlcyAobXVzdCB0cmFuc2ZlciBvd25lcnNoaXApXG4gIH07XG5cbiAgY29uc3QgYWxsb3dlZCA9IGFsbG93ZWRUcmFuc2l0aW9uc1tjdXJyZW50Um9sZV07XG4gIGlmICghYWxsb3dlZC5pbmNsdWRlcyhuZXdSb2xlKSkge1xuICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoYENhbm5vdCB0cmFuc2l0aW9uIHJvbGUgZnJvbSAke2N1cnJlbnRSb2xlfSB0byAke25ld1JvbGV9YCk7XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZSB1bmlxdWUgbWVtYmVyc2hpcCBJRFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZU1lbWJlcnNoaXBJZCgpOiBzdHJpbmcge1xuICAvLyBHZW5lcmF0ZSBhIHVuaXF1ZSBtZW1iZXJzaGlwIElEIHdpdGggdGltZXN0YW1wIGFuZCByYW5kb20gY29tcG9uZW50XG4gIGNvbnN0IHRpbWVzdGFtcCA9IERhdGUubm93KCkudG9TdHJpbmcoMzYpO1xuICBjb25zdCByYW5kb20gPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMiwgOCk7XG4gIHJldHVybiBgbWVtXyR7dGltZXN0YW1wfV8ke3JhbmRvbX1gO1xufSJdfQ==