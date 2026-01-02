"use strict";
/**
 * Club Service - Phase 2.1
 *
 * Business logic service for club operations.
 * Implements club management workflows and business rules.
 *
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 * - Domain Model: .kiro/specs/domain.v1.md
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClubService = void 0;
const club_1 = require("../../../shared/types/club");
const errors_1 = require("../../../shared/utils/errors");
const lambda_utils_1 = require("../../../shared/utils/lambda-utils");
const club_2 = require("./club");
/**
 * Club service for business logic operations
 */
class ClubService {
    constructor(clubRepository) {
        this.clubRepository = clubRepository;
    }
    /**
     * Get club by ID
     *
     * @param id - Club ID
     * @returns Club if found
     * @throws NotFoundError if club doesn't exist
     */
    async getClubById(id) {
        if (!id || typeof id !== 'string') {
            throw new errors_1.ValidationError('Club ID is required');
        }
        const club = await this.clubRepository.getClubById(id);
        if (!club) {
            throw new errors_1.NotFoundError('Club not found');
        }
        return club;
    }
    /**
     * List clubs with pagination and filtering
     *
     * @param options - List options
     * @returns Paginated list of clubs
     */
    async listClubs(options = {}) {
        // Validate and set defaults
        const validatedOptions = this.validateListOptions(options);
        (0, lambda_utils_1.logStructured)('INFO', 'Listing clubs', {
            limit: validatedOptions.limit,
            status: validatedOptions.status,
            hasCursor: !!validatedOptions.cursor,
        });
        const result = await this.clubRepository.listClubs(validatedOptions);
        (0, lambda_utils_1.logStructured)('INFO', 'Clubs listed successfully', {
            count: result.clubs.length,
            hasNextCursor: !!result.nextCursor,
        });
        return result;
    }
    /**
     * Create a new club
     *
     * @param input - Club creation data
     * @returns Created club
     * @throws ValidationError if input is invalid
     * @throws ConflictError if club name already exists
     */
    async createClub(input) {
        // Validate input
        (0, club_2.validateCreateClubInput)(input);
        // Check name uniqueness
        const isNameUnique = await this.clubRepository.isClubNameUnique(input.name);
        if (!isNameUnique) {
            throw new errors_1.ConflictError('Club name already exists');
        }
        // Create club entity
        const clubEntity = (0, club_2.createClub)(input);
        (0, lambda_utils_1.logStructured)('INFO', 'Creating club', {
            clubName: input.name,
            city: input.city,
        });
        // Persist club
        const createdClub = await this.clubRepository.createClub(input);
        (0, lambda_utils_1.logStructured)('INFO', 'Club created successfully', {
            clubId: createdClub.id,
            clubName: createdClub.name,
        });
        return createdClub;
    }
    /**
     * Update an existing club
     *
     * @param id - Club ID
     * @param input - Club update data
     * @returns Updated club
     * @throws NotFoundError if club doesn't exist
     * @throws ValidationError if input is invalid
     * @throws ConflictError if name conflicts with existing club
     */
    async updateClub(id, input) {
        if (!id || typeof id !== 'string') {
            throw new errors_1.ValidationError('Club ID is required');
        }
        // Validate input
        (0, club_2.validateUpdateClubInput)(input);
        // Get existing club
        const existingClub = await this.getClubById(id);
        const clubEntity = (0, club_2.fromClubData)(existingClub);
        // Check if club can be updated
        if (!clubEntity.canUpdate()) {
            throw new errors_1.ValidationError('Archived clubs cannot be updated');
        }
        // Validate status transition if status is being changed
        if (input.status && input.status !== existingClub.status) {
            if (!(0, club_2.isValidStatusTransition)(existingClub.status, input.status)) {
                throw new errors_1.ValidationError(`Cannot transition from ${existingClub.status} to ${input.status}`);
            }
        }
        // Check name uniqueness if name is being changed
        if (input.name && (0, club_2.normalizeClubName)(input.name) !== (0, club_2.normalizeClubName)(existingClub.name)) {
            const isNameUnique = await this.clubRepository.isClubNameUnique(input.name, id);
            if (!isNameUnique) {
                throw new errors_1.ConflictError('Club name already exists');
            }
        }
        (0, lambda_utils_1.logStructured)('INFO', 'Updating club', {
            clubId: id,
            updateFields: Object.keys(input),
        });
        // Update club
        const updatedClub = await this.clubRepository.updateClub(id, input);
        (0, lambda_utils_1.logStructured)('INFO', 'Club updated successfully', {
            clubId: id,
            clubName: updatedClub.name,
            status: updatedClub.status,
        });
        return updatedClub;
    }
    /**
     * Check if club exists
     *
     * @param id - Club ID
     * @returns True if club exists
     */
    async clubExists(id) {
        if (!id || typeof id !== 'string') {
            return false;
        }
        return await this.clubRepository.clubExists(id);
    }
    /**
     * Get clubs by status
     *
     * @param status - Club status
     * @param limit - Maximum number of clubs
     * @returns List of clubs
     */
    async getClubsByStatus(status, limit) {
        if (!Object.values(club_1.ClubStatus).includes(status)) {
            throw new errors_1.ValidationError('Invalid club status');
        }
        return await this.clubRepository.getClubsByStatus(status, limit);
    }
    /**
     * Search clubs by name
     *
     * @param nameQuery - Name search query
     * @param limit - Maximum number of results
     * @returns List of matching clubs
     */
    async searchClubsByName(nameQuery, limit) {
        if (!nameQuery || typeof nameQuery !== 'string') {
            throw new errors_1.ValidationError('Search query is required');
        }
        const trimmedQuery = nameQuery.trim();
        if (trimmedQuery.length === 0) {
            throw new errors_1.ValidationError('Search query cannot be empty');
        }
        return await this.clubRepository.searchClubsByName(trimmedQuery, limit);
    }
    /**
     * Validate list options
     *
     * @param options - List options to validate
     * @returns Validated options with defaults
     */
    validateListOptions(options) {
        const validated = { ...options };
        // Validate and set default limit
        if (validated.limit === undefined) {
            validated.limit = club_1.CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT;
        }
        else {
            if (typeof validated.limit !== 'number' || validated.limit < 1) {
                throw new errors_1.ValidationError('Limit must be a positive number');
            }
            if (validated.limit > club_1.CLUB_CONSTRAINTS.MAX_LIST_LIMIT) {
                validated.limit = club_1.CLUB_CONSTRAINTS.MAX_LIST_LIMIT;
            }
        }
        // Validate status filter
        if (validated.status !== undefined) {
            if (!Object.values(club_1.ClubStatus).includes(validated.status)) {
                throw new errors_1.ValidationError('Invalid status filter');
            }
        }
        else {
            // Default to active clubs only
            validated.status = club_1.ClubStatus.ACTIVE;
        }
        // Validate cursor
        if (validated.cursor !== undefined) {
            if (typeof validated.cursor !== 'string' || validated.cursor.trim().length === 0) {
                throw new errors_1.ValidationError('Invalid pagination cursor');
            }
        }
        return validated;
    }
}
exports.ClubService = ClubService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2x1Yi1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY2x1Yi1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7OztBQUVILHFEQUFxSjtBQUNySix5REFBNkY7QUFDN0YscUVBQW1FO0FBRW5FLGlDQVFnQjtBQUVoQjs7R0FFRztBQUNILE1BQWEsV0FBVztJQUN0QixZQUE2QixjQUErQjtRQUEvQixtQkFBYyxHQUFkLGNBQWMsQ0FBaUI7SUFBRyxDQUFDO0lBRWhFOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxXQUFXLENBQUMsRUFBVTtRQUMxQixJQUFJLENBQUMsRUFBRSxJQUFJLE9BQU8sRUFBRSxLQUFLLFFBQVEsRUFBRTtZQUNqQyxNQUFNLElBQUksd0JBQWUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1NBQ2xEO1FBRUQsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUV2RCxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ1QsTUFBTSxJQUFJLHNCQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztTQUMzQztRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLFNBQVMsQ0FBQyxVQUE0QixFQUFFO1FBQzVDLDRCQUE0QjtRQUM1QixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUUzRCxJQUFBLDRCQUFhLEVBQUMsTUFBTSxFQUFFLGVBQWUsRUFBRTtZQUNyQyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsS0FBSztZQUM3QixNQUFNLEVBQUUsZ0JBQWdCLENBQUMsTUFBTTtZQUMvQixTQUFTLEVBQUUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLE1BQU07U0FDckMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxNQUFNLEdBQUcsTUFBTSxJ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QUFNLEtBQUssU0FBUyxFQUFFO1lBQ2xDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLGlCQUFVLENBQUMsQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUN6RCxNQUFNLElBQUksd0JBQWUsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO2FBQ3BEO1NBQ0Y7YUFBTTtZQUNMLCtCQUErQjtZQUMvQixTQUFTLENBQUMsTUFBTSxHQUFHLGlCQUFVLENBQUMsTUFBTSxDQUFDO1NBQ3RDO1FBRUQsa0JBQWtCO1FBQ2xCLElBQUksU0FBUyxDQUFDLE1BQU0sS0FBSyxTQUFTLEVBQUU7WUFDbEMsSUFBSSxPQUFPLFNBQVMsQ0FBQyxNQUFNLEtBQUssUUFBUSxJQUFJLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtnQkFDaEYsTUFBTSxJQUFJLHdCQUFlLENBQUMsMkJBQTJCLENBQUMsQ0FBQzthQUN4RDtTQUNGO1FBRUQsT0FBTyxTQUFTLENBQUM7SUFDbkIsQ0FBQztDQUNGO0FBM09ELGtDQTJPQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ2x1YiBTZXJ2aWNlIC0gUGhhc2UgMi4xXG4gKiBcbiAqIEJ1c2luZXNzIGxvZ2ljIHNlcnZpY2UgZm9yIGNsdWIgb3BlcmF0aW9ucy5cbiAqIEltcGxlbWVudHMgY2x1YiBtYW5hZ2VtZW50IHdvcmtmbG93cyBhbmQgYnVzaW5lc3MgcnVsZXMuXG4gKiBcbiAqIENvbXBsaWFuY2U6XG4gKiAtIFBoYXNlIDIuMSBTcGVjOiAua2lyby9zcGVjcy9waGFzZS0yLjEuY2x1Yi1zZXJ2aWNlLnYxLm1kXG4gKiAtIERvbWFpbiBNb2RlbDogLmtpcm8vc3BlY3MvZG9tYWluLnYxLm1kXG4gKi9cblxuaW1wb3J0IHsgQ2x1YiwgQ2x1YlN0YXR1cywgQ3JlYXRlQ2x1YklucHV0LCBVcGRhdGVDbHViSW5wdXQsIExpc3RDbHVic09wdGlvbnMsIExpc3RDbHVic1Jlc3VsdCwgQ0xVQl9DT05TVFJBSU5UUyB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC90eXBlcy9jbHViJztcbmltcG9ydCB7IE5vdEZvdW5kRXJyb3IsIFZhbGlkYXRpb25FcnJvciwgQ29uZmxpY3RFcnJvciB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscy9lcnJvcnMnO1xuaW1wb3J0IHsgbG9nU3RydWN0dXJlZCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscy9sYW1iZGEtdXRpbHMnO1xuaW1wb3J0IHsgSUNsdWJSZXBvc2l0b3J5IH0gZnJvbSAnLi9jbHViLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgXG4gIENsdWJFbnRpdHksIFxuICBjcmVhdGVDbHViLCBcbiAgZnJvbUNsdWJEYXRhLCBcbiAgdmFsaWRhdGVDcmVhdGVDbHViSW5wdXQsIFxuICB2YWxpZGF0ZVVwZGF0ZUNsdWJJbnB1dCxcbiAgbm9ybWFsaXplQ2x1Yk5hbWUsXG4gIGlzVmFsaWRTdGF0dXNUcmFuc2l0aW9uXG59IGZyb20gJy4vY2x1Yic7XG5cbi8qKlxuICogQ2x1YiBzZXJ2aWNlIGZvciBidXNpbmVzcyBsb2dpYyBvcGVyYXRpb25zXG4gKi9cbmV4cG9ydCBjbGFzcyBDbHViU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgY2x1YlJlcG9zaXRvcnk6IElDbHViUmVwb3NpdG9yeSkge31cblxuICAvKipcbiAgICogR2V0IGNsdWIgYnkgSURcbiAgICogXG4gICAqIEBwYXJhbSBpZCAtIENsdWIgSURcbiAgICogQHJldHVybnMgQ2x1YiBpZiBmb3VuZFxuICAgKiBAdGhyb3dzIE5vdEZvdW5kRXJyb3IgaWYgY2x1YiBkb2Vzbid0IGV4aXN0XG4gICAqL1xuICBhc3luYyBnZXRDbHViQnlJZChpZDogc3RyaW5nKTogUHJvbWlzZTxDbHViPiB7XG4gICAgaWYgKCFpZCB8fCB0eXBlb2YgaWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdDbHViIElEIGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgY29uc3QgY2x1YiA9IGF3YWl0IHRoaXMuY2x1YlJlcG9zaXRvcnkuZ2V0Q2x1YkJ5SWQoaWQpO1xuICAgIFxuICAgIGlmICghY2x1Yikge1xuICAgICAgdGhyb3cgbmV3IE5vdEZvdW5kRXJyb3IoJ0NsdWIgbm90IGZvdW5kJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsdWI7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBjbHVicyB3aXRoIHBhZ2luYXRpb24gYW5kIGZpbHRlcmluZ1xuICAgKiBcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBMaXN0IG9wdGlvbnNcbiAgICogQHJldHVybnMgUGFnaW5hdGVkIGxpc3Qgb2YgY2x1YnNcbiAgICovXG4gIGFzeW5jIGxpc3RDbHVicyhvcHRpb25zOiBMaXN0Q2x1YnNPcHRpb25zID0ge30pOiBQcm9taXNlPExpc3RDbHVic1Jlc3VsdD4ge1xuICAgIC8vIFZhbGlkYXRlIGFuZCBzZXQgZGVmYXVsdHNcbiAgICBjb25zdCB2YWxpZGF0ZWRPcHRpb25zID0gdGhpcy52YWxpZGF0ZUxpc3RPcHRpb25zKG9wdGlvbnMpO1xuICAgIFxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnTGlzdGluZyBjbHVicycsIHtcbiAgICAgIGxpbWl0OiB2YWxpZGF0ZWRPcHRpb25zLmxpbWl0LFxuICAgICAgc3RhdHVzOiB2YWxpZGF0ZWRPcHRpb25zLnN0YXR1cyxcbiAgICAgIGhhc0N1cnNvcjogISF2YWxpZGF0ZWRPcHRpb25zLmN1cnNvcixcbiAgICB9KTtcblxuICAgIGNvbnN0IHJlc3VsdCA9IGF3YWl0IHRoaXMuY2x1YlJlcG9zaXRvcnkubGlzdENsdWJzKHZhbGlkYXRlZE9wdGlvbnMpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdDbHVicyBsaXN0ZWQgc3VjY2Vzc2Z1bGx5Jywge1xuICAgICAgY291bnQ6IHJlc3VsdC5jbHVicy5sZW5ndGgsXG4gICAgICBoYXNOZXh0Q3Vyc29yOiAhIXJlc3VsdC5uZXh0Q3Vyc29yLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgY2x1YlxuICAgKiBcbiAgICogQHBhcmFtIGlucHV0IC0gQ2x1YiBjcmVhdGlvbiBkYXRhXG4gICAqIEByZXR1cm5zIENyZWF0ZWQgY2x1YlxuICAgKiBAdGhyb3dzIFZhbGlkYXRpb25FcnJvciBpZiBpbnB1dCBpcyBpbnZhbGlkXG4gICAqIEB0aHJvd3MgQ29uZmxpY3RFcnJvciBpZiBjbHViIG5hbWUgYWxyZWFkeSBleGlzdHNcbiAgICovXG4gIGFzeW5jIGNyZWF0ZUNsdWIoaW5wdXQ6IENyZWF0ZUNsdWJJbnB1dCk6IFByb21pc2U8Q2x1Yj4ge1xuICAgIC8vIFZhbGlkYXRlIGlucHV0XG4gICAgdmFsaWRhdGVDcmVhdGVDbHViSW5wdXQoaW5wdXQpO1xuXG4gICAgLy8gQ2hlY2sgbmFtZSB1bmlxdWVuZXNzXG4gICAgY29uc3QgaXNOYW1lVW5pcXVlID0gYXdhaXQgdGhpcy5jbHViUmVwb3NpdG9yeS5pc0NsdWJOYW1lVW5pcXVlKGlucHV0Lm5hbWUpO1xuICAgIGlmICghaXNOYW1lVW5pcXVlKSB7XG4gICAgICB0aHJvdyBuZXcgQ29uZmxpY3RFcnJvcignQ2x1YiBuYW1lIGFscmVhZHkgZXhpc3RzJyk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGNsdWIgZW50aXR5XG4gICAgY29uc3QgY2x1YkVudGl0eSA9IGNyZWF0ZUNsdWIoaW5wdXQpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdDcmVhdGluZyBjbHViJywge1xuICAgICAgY2x1Yk5hbWU6IGlucHV0Lm5hbWUsXG4gICAgICBjaXR5OiBpbnB1dC5jaXR5LFxuICAgIH0pO1xuXG4gICAgLy8gUGVyc2lzdCBjbHViXG4gICAgY29uc3QgY3JlYXRlZENsdWIgPSBhd2FpdCB0aGlzLmNsdWJSZXBvc2l0b3J5LmNyZWF0ZUNsdWIoaW5wdXQpO1xuXG4gICAgbG9nU3RydWN0dXJlZCgnSU5GTycsICdDbHViIGNyZWF0ZWQgc3VjY2Vzc2Z1bGx5Jywge1xuICAgICAgY2x1YklkOiBjcmVhdGVkQ2x1Yi5pZCxcbiAgICAgIGNsdWJOYW1lOiBjcmVhdGVkQ2x1Yi5uYW1lLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGNyZWF0ZWRDbHViO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhbiBleGlzdGluZyBjbHViXG4gICAqIFxuICAgKiBAcGFyYW0gaWQgLSBDbHViIElEXG4gICAqIEBwYXJhbSBpbnB1dCAtIENsdWIgdXBkYXRlIGRhdGFcbiAgICogQHJldHVybnMgVXBkYXRlZCBjbHViXG4gICAqIEB0aHJvd3MgTm90Rm91bmRFcnJvciBpZiBjbHViIGRvZXNuJ3QgZXhpc3RcbiAgICogQHRocm93cyBWYWxpZGF0aW9uRXJyb3IgaWYgaW5wdXQgaXMgaW52YWxpZFxuICAgKiBAdGhyb3dzIENvbmZsaWN0RXJyb3IgaWYgbmFtZSBjb25mbGljdHMgd2l0aCBleGlzdGluZyBjbHViXG4gICAqL1xuICBhc3luYyB1cGRhdGVDbHViKGlkOiBzdHJpbmcsIGlucHV0OiBVcGRhdGVDbHViSW5wdXQpOiBQcm9taXNlPENsdWI+IHtcbiAgICBpZiAoIWlkIHx8IHR5cGVvZiBpZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0NsdWIgSUQgaXMgcmVxdWlyZWQnKTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBpbnB1dFxuICAgIHZhbGlkYXRlVXBkYXRlQ2x1YklucHV0KGlucHV0KTtcblxuICAgIC8vIEdldCBleGlzdGluZyBjbHViXG4gICAgY29uc3QgZXhpc3RpbmdDbHViID0gYXdhaXQgdGhpcy5nZXRDbHViQnlJZChpZCk7XG4gICAgY29uc3QgY2x1YkVudGl0eSA9IGZyb21DbHViRGF0YShleGlzdGluZ0NsdWIpO1xuXG4gICAgLy8gQ2hlY2sgaWYgY2x1YiBjYW4gYmUgdXBkYXRlZFxuICAgIGlmICghY2x1YkVudGl0eS5jYW5VcGRhdGUoKSkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignQXJjaGl2ZWQgY2x1YnMgY2Fubm90IGJlIHVwZGF0ZWQnKTtcbiAgICB9XG5cbiAgICAvLyBWYWxpZGF0ZSBzdGF0dXMgdHJhbnNpdGlvbiBpZiBzdGF0dXMgaXMgYmVpbmcgY2hhbmdlZFxuICAgIGlmIChpbnB1dC5zdGF0dXMgJiYgaW5wdXQuc3RhdHVzICE9PSBleGlzdGluZ0NsdWIuc3RhdHVzKSB7XG4gICAgICBpZiAoIWlzVmFsaWRTdGF0dXNUcmFuc2l0aW9uKGV4aXN0aW5nQ2x1Yi5zdGF0dXMsIGlucHV0LnN0YXR1cykpIHtcbiAgICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcihgQ2Fubm90IHRyYW5zaXRpb24gZnJvbSAke2V4aXN0aW5nQ2x1Yi5zdGF0dXN9IHRvICR7aW5wdXQuc3RhdHVzfWApO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENoZWNrIG5hbWUgdW5pcXVlbmVzcyBpZiBuYW1lIGlzIGJlaW5nIGNoYW5nZWRcbiAgICBpZiAoaW5wdXQubmFtZSAmJiBub3JtYWxpemVDbHViTmFtZShpbnB1dC5uYW1lKSAhPT0gbm9ybWFsaXplQ2x1Yk5hbWUoZXhpc3RpbmdDbHViLm5hbWUpKSB7XG4gICAgICBjb25zdCBpc05hbWVVbmlxdWUgPSBhd2FpdCB0aGlzLmNsdWJSZXBvc2l0b3J5LmlzQ2x1Yk5hbWVVbmlxdWUoaW5wdXQubmFtZSwgaWQpO1xuICAgICAgaWYgKCFpc05hbWVVbmlxdWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IENvbmZsaWN0RXJyb3IoJ0NsdWIgbmFtZSBhbHJlYWR5IGV4aXN0cycpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnVXBkYXRpbmcgY2x1YicsIHtcbiAgICAgIGNsdWJJZDogaWQsXG4gICAgICB1cGRhdGVGaWVsZHM6IE9iamVjdC5rZXlzKGlucHV0KSxcbiAgICB9KTtcblxuICAgIC8vIFVwZGF0ZSBjbHViXG4gICAgY29uc3QgdXBkYXRlZENsdWIgPSBhd2FpdCB0aGlzLmNsdWJSZXBvc2l0b3J5LnVwZGF0ZUNsdWIoaWQsIGlucHV0KTtcblxuICAgIGxvZ1N0cnVjdHVyZWQoJ0lORk8nLCAnQ2x1YiB1cGRhdGVkIHN1Y2Nlc3NmdWxseScsIHtcbiAgICAgIGNsdWJJZDogaWQsXG4gICAgICBjbHViTmFtZTogdXBkYXRlZENsdWIubmFtZSxcbiAgICAgIHN0YXR1czogdXBkYXRlZENsdWIuc3RhdHVzLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHVwZGF0ZWRDbHViO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGNsdWIgZXhpc3RzXG4gICAqIFxuICAgKiBAcGFyYW0gaWQgLSBDbHViIElEXG4gICAqIEByZXR1cm5zIFRydWUgaWYgY2x1YiBleGlzdHNcbiAgICovXG4gIGFzeW5jIGNsdWJFeGlzdHMoaWQ6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIGlmICghaWQgfHwgdHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLmNsdWJSZXBvc2l0b3J5LmNsdWJFeGlzdHMoaWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBjbHVicyBieSBzdGF0dXNcbiAgICogXG4gICAqIEBwYXJhbSBzdGF0dXMgLSBDbHViIHN0YXR1c1xuICAgKiBAcGFyYW0gbGltaXQgLSBNYXhpbXVtIG51bWJlciBvZiBjbHVic1xuICAgKiBAcmV0dXJucyBMaXN0IG9mIGNsdWJzXG4gICAqL1xuICBhc3luYyBnZXRDbHVic0J5U3RhdHVzKHN0YXR1czogQ2x1YlN0YXR1cywgbGltaXQ/OiBudW1iZXIpOiBQcm9taXNlPENsdWJbXT4ge1xuICAgIGlmICghT2JqZWN0LnZhbHVlcyhDbHViU3RhdHVzKS5pbmNsdWRlcyhzdGF0dXMpKSB7XG4gICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnZhbGlkIGNsdWIgc3RhdHVzJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuY2x1YlJlcG9zaXRvcnkuZ2V0Q2x1YnNCeVN0YXR1cyhzdGF0dXMsIGxpbWl0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZWFyY2ggY2x1YnMgYnkgbmFtZVxuICAgKiBcbiAgICogQHBhcmFtIG5hbWVRdWVyeSAtIE5hbWUgc2VhcmNoIHF1ZXJ5XG4gICAqIEBwYXJhbSBsaW1pdCAtIE1heGltdW0gbnVtYmVyIG9mIHJlc3VsdHNcbiAgICogQHJldHVybnMgTGlzdCBvZiBtYXRjaGluZyBjbHVic1xuICAgKi9cbiAgYXN5bmMgc2VhcmNoQ2x1YnNCeU5hbWUobmFtZVF1ZXJ5OiBzdHJpbmcsIGxpbWl0PzogbnVtYmVyKTogUHJvbWlzZTxDbHViW10+IHtcbiAgICBpZiAoIW5hbWVRdWVyeSB8fCB0eXBlb2YgbmFtZVF1ZXJ5ICE9PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignU2VhcmNoIHF1ZXJ5IGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuXG4gICAgY29uc3QgdHJpbW1lZFF1ZXJ5ID0gbmFtZVF1ZXJ5LnRyaW0oKTtcbiAgICBpZiAodHJpbW1lZFF1ZXJ5Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IFZhbGlkYXRpb25FcnJvcignU2VhcmNoIHF1ZXJ5IGNhbm5vdCBiZSBlbXB0eScpO1xuICAgIH1cblxuICAgIHJldHVybiBhd2FpdCB0aGlzLmNsdWJSZXBvc2l0b3J5LnNlYXJjaENsdWJzQnlOYW1lKHRyaW1tZWRRdWVyeSwgbGltaXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIGxpc3Qgb3B0aW9uc1xuICAgKiBcbiAgICogQHBhcmFtIG9wdGlvbnMgLSBMaXN0IG9wdGlvbnMgdG8gdmFsaWRhdGVcbiAgICogQHJldHVybnMgVmFsaWRhdGVkIG9wdGlvbnMgd2l0aCBkZWZhdWx0c1xuICAgKi9cbiAgcHJpdmF0ZSB2YWxpZGF0ZUxpc3RPcHRpb25zKG9wdGlvbnM6IExpc3RDbHVic09wdGlvbnMpOiBMaXN0Q2x1YnNPcHRpb25zIHtcbiAgICBjb25zdCB2YWxpZGF0ZWQ6IExpc3RDbHVic09wdGlvbnMgPSB7IC4uLm9wdGlvbnMgfTtcblxuICAgIC8vIFZhbGlkYXRlIGFuZCBzZXQgZGVmYXVsdCBsaW1pdFxuICAgIGlmICh2YWxpZGF0ZWQubGltaXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdmFsaWRhdGVkLmxpbWl0ID0gQ0xVQl9DT05TVFJBSU5UUy5ERUZBVUxUX0xJU1RfTElNSVQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0eXBlb2YgdmFsaWRhdGVkLmxpbWl0ICE9PSAnbnVtYmVyJyB8fCB2YWxpZGF0ZWQubGltaXQgPCAxKSB7XG4gICAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0xpbWl0IG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWxpZGF0ZWQubGltaXQgPiBDTFVCX0NPTlNUUkFJTlRTLk1BWF9MSVNUX0xJTUlUKSB7XG4gICAgICAgIHZhbGlkYXRlZC5saW1pdCA9IENMVUJfQ09OU1RSQUlOVFMuTUFYX0xJU1RfTElNSVQ7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVmFsaWRhdGUgc3RhdHVzIGZpbHRlclxuICAgIGlmICh2YWxpZGF0ZWQuc3RhdHVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICghT2JqZWN0LnZhbHVlcyhDbHViU3RhdHVzKS5pbmNsdWRlcyh2YWxpZGF0ZWQuc3RhdHVzKSkge1xuICAgICAgICB0aHJvdyBuZXcgVmFsaWRhdGlvbkVycm9yKCdJbnZhbGlkIHN0YXR1cyBmaWx0ZXInKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRGVmYXVsdCB0byBhY3RpdmUgY2x1YnMgb25seVxuICAgICAgdmFsaWRhdGVkLnN0YXR1cyA9IENsdWJTdGF0dXMuQUNUSVZFO1xuICAgIH1cblxuICAgIC8vIFZhbGlkYXRlIGN1cnNvclxuICAgIGlmICh2YWxpZGF0ZWQuY3Vyc29yICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eXBlb2YgdmFsaWRhdGVkLmN1cnNvciAhPT0gJ3N0cmluZycgfHwgdmFsaWRhdGVkLmN1cnNvci50cmltKCkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBWYWxpZGF0aW9uRXJyb3IoJ0ludmFsaWQgcGFnaW5hdGlvbiBjdXJzb3InKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsaWRhdGVkO1xuICB9XG59Il19