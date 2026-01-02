"use strict";
/**
 * Club Domain Entity - Phase 2.1
 *
 * Core club entity with business logic and validation.
 * Implements club lifecycle management and data validation.
 *
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 * - Domain Model: .kiro/specs/domain.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidStatusTransition = exports.CLUB_STATUS_TRANSITIONS = exports.normalizeClubName = exports.validateUpdateClubInput = exports.validateCreateClubInput = exports.validateClubData = exports.fromClubData = exports.createClub = exports.ClubEntity = void 0;
const club_1 = require("../../../shared/types/club");
const errors_1 = require("../../../shared/utils/errors");
/**
 * Club entity class with business logic
 */
class ClubEntity {
    constructor(club) {
        this.club = club;
    }
    /**
     * Get the club data
     */
    get data() {
        return { ...this.club };
    }
    /**
     * Get club ID
     */
    get id() {
        return this.club.id;
    }
    /**
     * Get club name
     */
    get name() {
        return this.club.name;
    }
    /**
     * Get club status
     */
    get status() {
        return this.club.status;
    }
    /**
     * Check if club is active
     */
    get isActive() {
        return this.club.status === club_1.ClubStatus.ACTIVE;
    }
    /**
     * Check if club is suspended
     */
    get isSuspended() {
        return this.club.status === club_1.ClubStatus.SUSPENDED;
    }
    /**
     * Check if club is archived
     */
    get isArchived() {
        return this.club.status === club_1.ClubStatus.ARCHIVED;
    }
    /**
     * Update club with new data
     */
    update(input) {
        const updatedClub = {
            ...this.club,
            ...input,
            updatedAt: new Date().toISOString(),
        };
        // Validate the updated club
        validateClubData(updatedClub);
        return new ClubEntity(updatedClub);
    }
    /**
     * Activate the club
     */
    activate() {
        return this.update({ status: club_1.ClubStatus.ACTIVE });
    }
    /**
     * Suspend the club
     */
    suspend() {
        return this.update({ status: club_1.ClubStatus.SUSPENDED });
    }
    /**
     * Archive the club
     */
    archive() {
        return this.update({ status: club_1.ClubStatus.ARCHIVED });
    }
    /**
     * Check if club can be updated
     */
    canUpdate() {
        // Archived clubs cannot be updated
        return this.club.status !== club_1.ClubStatus.ARCHIVED;
    }
    /**
     * Check if club is visible in public listings
     */
    isPubliclyVisible() {
        // Only active clubs are visible by default
        return this.club.status === club_1.ClubStatus.ACTIVE;
    }
    /**
     * Get normalized name for indexing
     */
    get nameLower() {
        return this.club.name.toLowerCase().trim();
    }
}
exports.ClubEntity = ClubEntity;
/**
 * Create a new club entity
 */
function createClub(input) {
    const now = new Date().toISOString();
    const clubId = generateClubId();
    const club = {
        id: clubId,
        name: input.name.trim(),
        description: input.description?.trim(),
        status: club_1.ClubStatus.ACTIVE,
        city: input.city?.trim(),
        logoUrl: input.logoUrl?.trim(),
        createdAt: now,
        updatedAt: now,
    };
    // Validate the new club
    validateClubData(club);
    return new ClubEntity(club);
}
exports.createClub = createClub;
/**
 * Create club entity from existing data
 */
function fromClubData(club) {
    // Validate existing club data
    validateClubData(club);
    return new ClubEntity(club);
}
exports.fromClubData = fromClubData;
/**
 * Validate club data
 */
function validateClubData(club) {
    // Validate name
    if (club.name !== undefined) {
        if (!club.name || typeof club.name !== 'string') {
            throw new errors_1.ValidationError('Club name is required');
        }
        const trimmedName = club.name.trim();
        if (trimmedName.length < club_1.CLUB_CONSTRAINTS.NAME_MIN_LENGTH) {
            throw new errors_1.ValidationError('Club name is too short');
        }
        if (trimmedName.length > club_1.CLUB_CONSTRAINTS.NAME_MAX_LENGTH) {
            throw new errors_1.ValidationError('Club name is too long');
        }
    }
    // Validate description
    if (club.description !== undefined && club.description !== null) {
        if (typeof club.description !== 'string') {
            throw new errors_1.ValidationError('Club description must be a string');
        }
        if (club.description.length > club_1.CLUB_CONSTRAINTS.DESCRIPTION_MAX_LENGTH) {
            throw new errors_1.ValidationError('Club description is too long');
        }
    }
    // Validate city
    if (club.city !== undefined && club.city !== null) {
        if (typeof club.city !== 'string') {
            throw new errors_1.ValidationError('Club city must be a string');
        }
        if (club.city.length > club_1.CLUB_CONSTRAINTS.CITY_MAX_LENGTH) {
            throw new errors_1.ValidationError('Club city name is too long');
        }
    }
    // Validate logoUrl
    if (club.logoUrl !== undefined && club.logoUrl !== null) {
        if (typeof club.logoUrl !== 'string') {
            throw new errors_1.ValidationError('Club logo URL must be a string');
        }
        // Basic URL validation
        try {
            new URL(club.logoUrl);
        }
        catch {
            throw new errors_1.ValidationError('Club logo URL is not valid');
        }
    }
    // Validate status
    if (club.status !== undefined) {
        if (!Object.values(club_1.ClubStatus).includes(club.status)) {
            throw new errors_1.ValidationError('Invalid club status');
        }
    }
}
exports.validateClubData = validateClubData;
/**
 * Validate create club input
 */
function validateCreateClubInput(input) {
    if (!input || typeof input !== 'object') {
        throw new errors_1.ValidationError('Invalid club data');
    }
    // Validate required fields
    if (!input.name) {
        throw new errors_1.ValidationError('Club name is required');
    }
    // Validate using club data validation
    validateClubData({
        name: input.name,
        description: input.description,
        city: input.city,
        logoUrl: input.logoUrl,
    });
}
exports.validateCreateClubInput = validateCreateClubInput;
/**
 * Validate update club input
 */
function validateUpdateClubInput(input) {
    if (!input || typeof input !== 'object') {
        throw new errors_1.ValidationError('Invalid club update data');
    }
    // At least one field must be provided
    const hasUpdates = Object.keys(input).length > 0;
    if (!hasUpdates) {
        throw new errors_1.ValidationError('At least one field must be updated');
    }
    // Validate using club data validation
    validateClubData(input);
}
exports.validateUpdateClubInput = validateUpdateClubInput;
/**
 * Generate a unique club ID
 */
function generateClubId() {
    // Generate a unique ID using timestamp and random string
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `club_${timestamp}_${random}`;
}
/**
 * Check if club name is valid for uniqueness check
 */
function normalizeClubName(name) {
    return name.toLowerCase().trim();
}
exports.normalizeClubName = normalizeClubName;
/**
 * Club status transition rules
 */
exports.CLUB_STATUS_TRANSITIONS = {
    [club_1.ClubStatus.ACTIVE]: [club_1.ClubStatus.SUSPENDED, club_1.ClubStatus.ARCHIVED],
    [club_1.ClubStatus.SUSPENDED]: [club_1.ClubStatus.ACTIVE, club_1.ClubStatus.ARCHIVED],
    [club_1.ClubStatus.ARCHIVED]: [], // Archived clubs cannot transition to other states
};
/**
 * Check if status transition is valid
 */
function isValidStatusTransition(from, to) {
    return exports.CLUB_STATUS_TRANSITIONS[from].includes(to);
}
exports.isValidStatusTransition = isValidStatusTransition;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2x1Yi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNsdWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7Ozs7R0FTRzs7O0FBRUgscURBQWtIO0FBQ2xILHlEQUErRDtBQUUvRDs7R0FFRztBQUNILE1BQWEsVUFBVTtJQUNyQixZQUFvQixJQUFVO1FBQVYsU0FBSSxHQUFKLElBQUksQ0FBTTtJQUFHLENBQUM7SUFFbEM7O09BRUc7SUFDSCxJQUFJLElBQUk7UUFDTixPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxFQUFFO1FBQ0osT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLElBQUk7UUFDTixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDMUIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxRQUFRO1FBQ1YsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxpQkFBVSxDQUFDLE1BQU0sQ0FBQztJQUNoRCxDQUFDO0lBRUQ7O09BRUc7SUFDSCxJQUFJLFdBQVc7UUFDYixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxLQUFLLGlCQUFVLENBQUMsU0FBUyxDQUFDO0lBQ25ELENBQUM7SUFFRDs7T0FFRztJQUNILElBQUksVUFBVTtRQUNaLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssaUJBQVUsQ0FBQyxRQUFRLENBQUM7SUFDbEQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsTUFBTSxDQUFDLEtBQXNCO1FBQzNCLE1BQU0sV0FBVyxHQUFTO1lBQ3hCLEdBQUcsSUFBSSxDQUFDLElB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QkFBVSxDQUFDLFFBQVEsQ0FBQztJQUNoRSxDQUFDLGlCQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsRUFBRSxFQUFFLG1EQUFtRDtDQUMvRSxDQUFDO0FBRUY7O0dBRUc7QUFDSCxTQUFnQix1QkFBdUIsQ0FBQyxJQUFnQixFQUFFLEVBQWM7SUFDdEUsT0FBTywrQkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDcEQsQ0FBQztBQUZELDBEQUVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDbHViIERvbWFpbiBFbnRpdHkgLSBQaGFzZSAyLjFcbiAqIFxuICogQ29yZSBjbHViIGVudGl0eSB3aXRoIGJ1c2luZXNzIGxvZ2ljIGFuZCB2YWxpZGF0aW9uLlxuICogSW1wbGVtZW50cyBjbHViIGxpZmVjeWNsZSBtYW5hZ2VtZW50IGFuZCBkYXRhIHZhbGlkYXRpb24uXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDIuMSBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0yLjEuY2x1Yi1zZXJ2aWNlLnYxLm1kXG4gKiAtIERvbWFpbiBNb2RlbDogLmtpcm8vc3BlY3MvZG9tYWluLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgQ2x1YiwgQ2x1YlN0YXR1cywgQ3JlYXRlQ2x1YklucHV0LCBVcGRhdGVDbHViSW5wdXQsIENMVUJfQ09OU1RSQUlOVFMgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdHlwZXMvY2x1Yic7XG5pbXBvcnQgeyBWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMvZXJyb3JzJztcblxuLyoqXG4gKiBDbHViIGVudGl0eSBjbGFzcyB3aXRoIGJ1c2luZXNzIGxvZ2ljXG4gKi9cbmV4cG9ydCBjbGFzcyBDbHViRW50aXR5IHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBjbHViOiBDbHViKSB7fVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGNsdWIgZGF0YVxuICAgKi9cbiAgZ2V0IGRhdGEoKTogQ2x1YiB7XG4gICAgcmV0dXJuIHsgLi4udGhpcy5jbHViIH07XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNsdWIgSURcbiAgICovXG4gIGdldCBpZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmNsdWIuaWQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNsdWIgbmFtZVxuICAgKi9cbiAgZ2V0IG5hbWUoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5jbHViLm5hbWU7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGNsdWIgc3RhdHVzXG4gICAqL1xuICBnZXQgc3RhdHVzKCk6IENsdWJTdGF0dXMge1xuICAgIHJldHVybiB0aGlzLmNsdWIuc3RhdHVzO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGNsdWIgaXMgYWN0aXZlXG4gICAqL1xuICBnZXQgaXNBY3RpdmUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY2x1Yi5zdGF0dXMgPT09IENsdWJTdGF0dXMuQUNUSVZFO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGNsdWIgaXMgc3VzcGVuZGVkXG4gICAqL1xuICBnZXQgaXNTdXNwZW5kZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuY2x1Yi5zdGF0dXMgPT09IENsdWJTdGF0dXMuU1VTUEVOREVEO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGNsdWIgaXMgYXJjaGl2ZWRcbiAgICovXG4gIGdldCBpc0FyY2hpdmVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmNsdWIuc3RhdHVzID09PSBDbHViU3RhdHVzLkFSQ0hJVkVEO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBjbHViIHdpdGggbmV3IGRhdGFcbiAgICovXG4gIHVwZGF0ZShpbnB1dDogVXBkYXRlQ2x1YklucHV0KTogQ2x1YkVudGl0eSB7XG4gICAgY29uc3QgdXBkYXRlZENsdWI6IENsdWIgPSB7XG4gICAgICAuLi50aGlzLmNsdWIsXG4gICAgICAuLi5pbnB1dCxcbiAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpLFxuICAgIH07XG5cbiAgICAvLyBWYWxpZGF0ZSB0aGUgdXBkYXRlZCBjbHViXG4gICAgdmFsaWRhdGVDbHViRGF0YSh1cGRhdGVkQ2x1Yik7XG5cbiAgICByZXR1cm4gbmV3IENsdWJFbnRpdHkodXBkYXRlZENsdWIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFjdGl2YXRlIHRoZSBjbHViXG4gICAqL1xuICBhY3RpdmF0ZSgpOiBDbHViRW50aXR5IHtcbiAgICByZXR1cm4gdGhpcy51cGRhdGUoeyBzdGF0dXM6IENsdWJTdGF0dXMuQUNUSVZFIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFN1c3BlbmQgdGhlIGNsdWJcbiAgICovXG4gIHN1c3BlbmQoKTogQ2x1YkVudGl0eSB7XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlKHsgc3RhdHVzOiBDbHViU3RhdHVzLlNVU1BFTkRFRCB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcmNoaXZlIHRoZSBjbHViXG4gICAqL1xuICBhcmNoaXZlKCk6IENsdWJFbnRpdHkge1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZSh7IHN0YXR1czogQ2x1YlN0YXR1cy5BUkNISVZFRCB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBjbHViIGNhbiBiZSB1cGRhdGVkXG4gICAqL1xuICBjYW5VcGRhdGUoKTogYm9vbGVhbiB7XG4gICAgLy8gQXJjaGl2ZWQgY2x1YnMgY2Fubm90IGJlIHVwZGF0ZWRcbiAgICByZXR1cm4gdGhpcy5jbHViLnN0YXR1cyAhPT0gQ2x1YlN0YXR1cy5BUkNISVZFRDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBjbHViIGlzIHZpc2libGUgaW4gcHVibGljIGxpc3RpbmdzXG4gICAqL1xuICBpc1B1YmxpY2x5VmlzaWJsZSgpOiBib29sZWFuIHtcbiAgICAvLyBPbmx5IGFjdGl2ZSBjbHVicyBhcmUgdmlzaWJsZSBieSBkZWZhdWx0XG4gICAgcmV0dXJuIHRoaXMuY2x1Yi5zdGF0dXMgPT09IENsdWJTdGF0dXMuQUNUSVZFO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBub3JtYWxpemVkIG5hbWUgZm9yIGluZGV4aW5nXG4gICAqL1xuICBnZXQgbmFtZUxvd2VyKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuY2x1Yi5uYW1lLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IGNsdWIgZW50aXR5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDbHViKGlucHV0OiBDcmVhdGVDbHViSW5wdXQpOiBDbHViRW50aXR5IHtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICBjb25zdCBjbHViSWQgPSBnZW5lcmF0ZUNsdWJJZCgpO1xuXG4gIGNvbnN0IGNsdWI6IENsdWIgPSB7XG4gICAgaWQ6IGNsdWJJZCxcbiAgICBuYW1lOiBpbnB1dC5uYW1lLnRyaW0oKSxcbiAgICBkZXNjcmlwdGlvbjogaW5wdXQuZGVzY3JpcHRpb24/LnRyaW0oKSxcbiAgICBzdGF0dXM6IENsdWJTdGF0dXMuQUNUSVZFLFxuICAgIGNpdHk6IGlucHV0LmNpdHk/LnRyaW0oKSxcbiAgICBsb2dvVXJsOiBpbnB1dC5sb2dvVXJsPy50cmltKCksXG4gICAgY3JlYXRlZEF0OiBub3csXG4gICAgdXBkYXRlZEF0OiBub3csXG4gIH07XG5cbiAgLy8gVmFsaWRhdGUgdGhlIG5ldyBjbHViXG4gIHZhbGlkYXRlQ2x1YkRhdGEoY2x1Yik7XG5cbiAgcmV0dXJuIG5ldyBDbHViRW50aXR5KGNsdWIpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBjbHViIGVudGl0eSBmcm9tIGV4aXN0aW5nIGRhdGFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZyb21DbHViRGF0YShjbHViOiBDbHViKTogQ2x1YkVudGl0eSB7XG4gIC8vIFZhbGlkYXRlIGV4aXN0aW5nIGNsdWIgZGF0YVxuICB2YWxpZGF0ZUNsdWJEYXRhKGNsdWIpO1xuICByZXR1cm4gbmV3IENsdWJFbnRpdHkoY2x1Yik7XG59XG5cbi8qKlxuICogVmFsaWRhdGUgY2x1YiBkYXRhXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB2YWxpZGF0ZUNsdWJEYXRhKGNsdWI6IFBhcnRpYWw8Q2x1Yj4pOiB2b2lkIHtcbiAgLy8gVmFsaWRhdGUgbmFtZVxuICBpZiAoY2x1Yi5uYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoIWNsdWIubmFtZSB8fCB0eXBlb2YgY2x1Yi5uYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignQ2x1YiBuYW1lIGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgY29uc3QgdHJpbW1lZE5hbWUgPSBjbHViLm5hbWUudHJpbSgpO1xuICAgIGlmICh0cmltbWVkTmFtZS5sZW5ndGggPCBDTFVCX0NPTlNUUkFJTlRTLk5BTUVfTUlOX0xFTkdUSCkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignQ2x1YiBuYW1lIGlzIHRvbyBzaG9ydCcpO1xuICAgIH1cblxuICAgIGlmICh0cmltbWVkTmFtZS5sZW5ndGggPiBDTFVCX0NPTlNUUkFJTlRTLk5BTUVfTUFYX0xFTkdUSCkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignQ2x1YiBuYW1lIGlzIHRvbyBsb25nJyk7XG4gICAgfVxuICB9XG5cbiAgLy8gVmFsaWRhdGUgZGVzY3JpcHRpb25cbiAgaWYgKGNsdWIuZGVzY3JpcHRpb24gIT09IHVuZGVmaW5lZCAmJiBjbHViLmRlc2NyaXB0aW9uICE9PSBudWxsKSB7XG4gICAgaWYgKHR5cGVvZiBjbHViLmRlc2NyaXB0aW9uICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignQ2x1YiBkZXNjcmlwdGlvbiBtdXN0IGJlIGEgc3RyaW5nJyk7XG4gICAgfVxuXG4gICAgaWYgKGNsdWIuZGVzY3JpcHRpb24ubGVuZ3RoID4gQ0xVQl9DT05TVFJBSU5UUy5ERVNDUklQVElPTl9NQVhfTEVOR1RIKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdDbHViIGRlc2NyaXB0aW9uIGlzIHRvbyBsb25nJyk7XG4gICAgfVxuICB9XG5cbiAgLy8gVmFsaWRhdGUgY2l0eVxuICBpZiAoY2x1Yi5jaXR5ICE9PSB1bmRlZmluZWQgJiYgY2x1Yi5jaXR5ICE9PSBudWxsKSB7XG4gICAgaWYgKHR5cGVvZiBjbHViLmNpdHkgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdDbHViIGNpdHkgbXVzdCBiZSBhIHN0cmluZycpO1xuICAgIH1cblxuICAgIGlmIChjbHViLmNpdHkubGVuZ3RoID4gQ0xVQl9DT05TVFJBSU5UUy5DSVRZX01BWF9MRU5HVEgpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0NsdWIgY2l0eSBuYW1lIGlzIHRvbyBsb25nJyk7XG4gICAgfVxuICB9XG5cbiAgLy8gVmFsaWRhdGUgbG9nb1VybFxuICBpZiAoY2x1Yi5sb2dvVXJsICE9PSB1bmRlZmluZWQgJiYgY2x1Yi5sb2dvVXJsICE9PSBudWxsKSB7XG4gICAgaWYgKHR5cGVvZiBjbHViLmxvZ29VcmwgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdDbHViIGxvZ28gVVJMIG11c3QgYmUgYSBzdHJpbmcnKTtcbiAgICB9XG5cbiAgICAvLyBCYXNpYyBVUkwgdmFsaWRhdGlvblxuICAgIHRyeSB7XG4gICAgICBuZXcgVVJMKGNsdWIubG9nb1VybCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdDbHViIGxvZ28gVVJMIGlzIG5vdCB2YWxpZCcpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFZhbGlkYXRlIHN0YXR1c1xuICBpZiAoY2x1Yi5zdGF0dXMgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICghT2JqZWN0LnZhbHVlcyhDbHViU3RhdHVzKS5pbmNsdWRlcyhjbHViLnN0YXR1cykpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0ludmFsaWQgY2x1YiBzdGF0dXMnKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBjcmVhdGUgY2x1YiBpbnB1dFxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVDcmVhdGVDbHViSW5wdXQoaW5wdXQ6IENyZWF0ZUNsdWJJbnB1dCk6IHZvaWQge1xuICBpZiAoIWlucHV0IHx8IHR5cGVvZiBpbnB1dCAhPT0gJ29iamVjdCcpIHtcbiAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnZhbGlkIGNsdWIgZGF0YScpO1xuICB9XG5cbiAgLy8gVmFsaWRhdGUgcmVxdWlyZWQgZmllbGRzXG4gIGlmICghaW5wdXQubmFtZSkge1xuICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0NsdWIgbmFtZSBpcyByZXF1aXJlZCcpO1xuICB9XG5cbiAgLy8gVmFsaWRhdGUgdXNpbmcgY2x1YiBkYXRhIHZhbGlkYXRpb25cbiAgdmFsaWRhdGVDbHViRGF0YSh7XG4gICAgbmFtZTogaW5wdXQubmFtZSxcbiAgICBkZXNjcmlwdGlvbjogaW5wdXQuZGVzY3JpcHRpb24sXG4gICAgY2l0eTogaW5wdXQuY2l0eSxcbiAgICBsb2dvVXJsOiBpbnB1dC5sb2dvVXJsLFxuICB9KTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSB1cGRhdGUgY2x1YiBpbnB1dFxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVVcGRhdGVDbHViSW5wdXQoaW5wdXQ6IFVwZGF0ZUNsdWJJbnB1dCk6IHZvaWQge1xuICBpZiAoIWlucHV0IHx8IHR5cGVvZiBpbnB1dCAhPT0gJ29iamVjdCcpIHtcbiAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnZhbGlkIGNsdWIgdXBkYXRlIGRhdGEnKTtcbiAgfVxuXG4gIC8vIEF0IGxlYXN0IG9uZSBmaWVsZCBtdXN0IGJlIHByb3ZpZGVkXG4gIGNvbnN0IGhhc1VwZGF0ZXMgPSBPYmplY3Qua2V5cyhpbnB1dCkubGVuZ3RoID4gMDtcbiAgaWYgKCFoYXNVcGRhdGVzKSB7XG4gICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignQXQgbGVhc3Qgb25lIGZpZWxkIG11c3QgYmUgdXBkYXRlZCcpO1xuICB9XG5cbiAgLy8gVmFsaWRhdGUgdXNpbmcgY2x1YiBkYXRhIHZhbGlkYXRpb25cbiAgdmFsaWRhdGVDbHViRGF0YShpbnB1dCk7XG59XG5cbi8qKlxuICogR2VuZXJhdGUgYSB1bmlxdWUgY2x1YiBJRFxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUNsdWJJZCgpOiBzdHJpbmcge1xuICAvLyBHZW5lcmF0ZSBhIHVuaXF1ZSBJRCB1c2luZyB0aW1lc3RhbXAgYW5kIHJhbmRvbSBzdHJpbmdcbiAgY29uc3QgdGltZXN0YW1wID0gRGF0ZS5ub3coKS50b1N0cmluZygzNik7XG4gIGNvbnN0IHJhbmRvbSA9IE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyLCA4KTtcbiAgcmV0dXJuIGBjbHViXyR7dGltZXN0YW1wfV8ke3JhbmRvbX1gO1xufVxuXG4vKipcbiAqIENoZWNrIGlmIGNsdWIgbmFtZSBpcyB2YWxpZCBmb3IgdW5pcXVlbmVzcyBjaGVja1xuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplQ2x1Yk5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKS50cmltKCk7XG59XG5cbi8qKlxuICogQ2x1YiBzdGF0dXMgdHJhbnNpdGlvbiBydWxlc1xuICovXG5leHBvcnQgY29uc3QgQ0xVQl9TVEFUVVNfVFJBTlNJVElPTlM6IFJlY29yZDxDbHViU3RhdHVzLCBDbHViU3RhdHVzW10+ID0ge1xuICBbQ2x1YlN0YXR1cy5BQ1RJVkVdOiBbQ2x1YlN0YXR1cy5TVVNQRU5ERUQsIENsdWJTdGF0dXMuQVJDSElWRURdLFxuICBbQ2x1YlN0YXR1cy5TVVNQRU5ERURdOiBbQ2x1YlN0YXR1cy5BQ1RJVkUsIENsdWJTdGF0dXMuQVJDSElWRURdLFxuICBbQ2x1YlN0YXR1cy5BUkNISVZFRF06IFtdLCAvLyBBcmNoaXZlZCBjbHVicyBjYW5ub3QgdHJhbnNpdGlvbiB0byBvdGhlciBzdGF0ZXNcbn07XG5cbi8qKlxuICogQ2hlY2sgaWYgc3RhdHVzIHRyYW5zaXRpb24gaXMgdmFsaWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzVmFsaWRTdGF0dXNUcmFuc2l0aW9uKGZyb206IENsdWJTdGF0dXMsIHRvOiBDbHViU3RhdHVzKTogYm9vbGVhbiB7XG4gIHJldHVybiBDTFVCX1NUQVRVU19UUkFOU0lUSU9OU1tmcm9tXS5pbmNsdWRlcyh0byk7XG59Il19