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

import { Club, ClubStatus, CreateClubInput, UpdateClubInput, ListClubsOptions, ListClubsResult, CLUB_CONSTRAINTS } from '../../../shared/types/club';
import { NotFoundError, ValidationError, ConflictError } from '../../../shared/utils/errors';
import { logStructured } from '../../../shared/utils/lambda-utils';
import { IClubRepository } from './club-repository';
import { 
  ClubEntity, 
  createClub, 
  fromClubData, 
  validateCreateClubInput, 
  validateUpdateClubInput,
  normalizeClubName,
  isValidStatusTransition
} from './club';

/**
 * Club service for business logic operations
 */
export class ClubService {
  constructor(private readonly clubRepository: IClubRepository) {}

  /**
   * Get club by ID
   * 
   * @param id - Club ID
   * @returns Club if found
   * @throws NotFoundError if club doesn't exist
   */
  async getClubById(id: string): Promise<Club> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Club ID is required');
    }

    const club = await this.clubRepository.getClubById(id);
    
    if (!club) {
      throw new NotFoundError('Club not found');
    }

    return club;
  }

  /**
   * List clubs with pagination and filtering
   * 
   * @param options - List options
   * @returns Paginated list of clubs
   */
  async listClubs(options: ListClubsOptions = {}): Promise<ListClubsResult> {
    // Validate and set defaults
    const validatedOptions = this.validateListOptions(options);
    
    logStructured('INFO', 'Listing clubs', {
      limit: validatedOptions.limit,
      status: validatedOptions.status,
      hasCursor: !!validatedOptions.cursor,
    });

    const result = await this.clubRepository.listClubs(validatedOptions);

    logStructured('INFO', 'Clubs listed successfully', {
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
  async createClub(input: CreateClubInput): Promise<Club> {
    // Validate input
    validateCreateClubInput(input);

    // Check name uniqueness
    const isNameUnique = await this.clubRepository.isClubNameUnique(input.name);
    if (!isNameUnique) {
      throw new ConflictError('Club name already exists');
    }

    // Create club entity
    const clubEntity = createClub(input);

    logStructured('INFO', 'Creating club', {
      clubName: input.name,
      city: input.city,
    });

    // Persist club
    const createdClub = await this.clubRepository.createClub(input);

    logStructured('INFO', 'Club created successfully', {
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
  async updateClub(id: string, input: UpdateClubInput): Promise<Club> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('Club ID is required');
    }

    // Validate input
    validateUpdateClubInput(input);

    // Get existing club
    const existingClub = await this.getClubById(id);
    const clubEntity = fromClubData(existingClub);

    // Check if club can be updated
    if (!clubEntity.canUpdate()) {
      throw new ValidationError('Archived clubs cannot be updated');
    }

    // Validate status transition if status is being changed
    if (input.status && input.status !== existingClub.status) {
      if (!isValidStatusTransition(existingClub.status, input.status)) {
        throw new ValidationError(`Cannot transition from ${existingClub.status} to ${input.status}`);
      }
    }

    // Check name uniqueness if name is being changed
    if (input.name && normalizeClubName(input.name) !== normalizeClubName(existingClub.name)) {
      const isNameUnique = await this.clubRepository.isClubNameUnique(input.name, id);
      if (!isNameUnique) {
        throw new ConflictError('Club name already exists');
      }
    }

    logStructured('INFO', 'Updating club', {
      clubId: id,
      updateFields: Object.keys(input),
    });

    // Update club
    const updatedClub = await this.clubRepository.updateClub(id, input);

    logStructured('INFO', 'Club updated successfully', {
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
  async clubExists(id: string): Promise<boolean> {
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
  async getClubsByStatus(status: ClubStatus, limit?: number): Promise<Club[]> {
    if (!Object.values(ClubStatus).includes(status)) {
      throw new ValidationError('Invalid club status');
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
  async searchClubsByName(nameQuery: string, limit?: number): Promise<Club[]> {
    if (!nameQuery || typeof nameQuery !== 'string') {
      throw new ValidationError('Search query is required');
    }

    const trimmedQuery = nameQuery.trim();
    if (trimmedQuery.length === 0) {
      throw new ValidationError('Search query cannot be empty');
    }

    return await this.clubRepository.searchClubsByName(trimmedQuery, limit);
  }

  /**
   * Validate list options
   * 
   * @param options - List options to validate
   * @returns Validated options with defaults
   */
  private validateListOptions(options: ListClubsOptions): ListClubsOptions {
    const validated: ListClubsOptions = { ...options };

    // Validate and set default limit
    if (validated.limit === undefined) {
      validated.limit = CLUB_CONSTRAINTS.DEFAULT_LIST_LIMIT;
    } else {
      if (typeof validated.limit !== 'number' || validated.limit < 1) {
        throw new ValidationError('Limit must be a positive number');
      }
      if (validated.limit > CLUB_CONSTRAINTS.MAX_LIST_LIMIT) {
        validated.limit = CLUB_CONSTRAINTS.MAX_LIST_LIMIT;
      }
    }

    // Validate status filter
    if (validated.status !== undefined) {
      if (!Object.values(ClubStatus).includes(validated.status)) {
        throw new ValidationError('Invalid status filter');
      }
    } else {
      // Default to active clubs only
      validated.status = ClubStatus.ACTIVE;
    }

    // Validate cursor
    if (validated.cursor !== undefined) {
      if (typeof validated.cursor !== 'string' || validated.cursor.trim().length === 0) {
        throw new ValidationError('Invalid pagination cursor');
      }
    }

    return validated;
  }
}