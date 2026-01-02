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
import { Club, ClubStatus, CreateClubInput, UpdateClubInput, ListClubsOptions, ListClubsResult } from '../../../shared/types/club';
import { IClubRepository } from './club-repository';
/**
 * Club service for business logic operations
 */
export declare class ClubService {
    private readonly clubRepository;
    constructor(clubRepository: IClubRepository);
    /**
     * Get club by ID
     *
     * @param id - Club ID
     * @returns Club if found
     * @throws NotFoundError if club doesn't exist
     */
    getClubById(id: string): Promise<Club>;
    /**
     * List clubs with pagination and filtering
     *
     * @param options - List options
     * @returns Paginated list of clubs
     */
    listClubs(options?: ListClubsOptions): Promise<ListClubsResult>;
    /**
     * Create a new club
     *
     * @param input - Club creation data
     * @returns Created club
     * @throws ValidationError if input is invalid
     * @throws ConflictError if club name already exists
     */
    createClub(input: CreateClubInput): Promise<Club>;
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
    updateClub(id: string, input: UpdateClubInput): Promise<Club>;
    /**
     * Check if club exists
     *
     * @param id - Club ID
     * @returns True if club exists
     */
    clubExists(id: string): Promise<boolean>;
    /**
     * Get clubs by status
     *
     * @param status - Club status
     * @param limit - Maximum number of clubs
     * @returns List of clubs
     */
    getClubsByStatus(status: ClubStatus, limit?: number): Promise<Club[]>;
    /**
     * Search clubs by name
     *
     * @param nameQuery - Name search query
     * @param limit - Maximum number of results
     * @returns List of matching clubs
     */
    searchClubsByName(nameQuery: string, limit?: number): Promise<Club[]>;
    /**
     * Validate list options
     *
     * @param options - List options to validate
     * @returns Validated options with defaults
     */
    private validateListOptions;
}
