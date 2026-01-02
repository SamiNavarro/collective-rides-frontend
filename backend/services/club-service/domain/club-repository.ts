/**
 * Club Repository Interface - Phase 2.1
 * 
 * Repository interface for club data access operations.
 * Defines the contract for club persistence layer.
 * 
 * Compliance:
 * - Phase 2.1 Spec: .kiro/specs/phase-2.1.club-service.v1.md
 */

import { Club, CreateClubInput, UpdateClubInput, ListClubsOptions, ListClubsResult } from '../../../shared/types/club';

/**
 * Club repository interface
 */
export interface IClubRepository {
  /**
   * Get club by ID
   * 
   * @param id - Club ID
   * @returns Club if found, null otherwise
   */
  getClubById(id: string): Promise<Club | null>;

  /**
   * List clubs with pagination and filtering
   * 
   * @param options - List options including pagination and filters
   * @returns Paginated list of clubs
   */
  listClubs(options: ListClubsOptions): Promise<ListClubsResult>;

  /**
   * Create a new club
   * 
   * @param input - Club creation data
   * @returns Created club
   */
  createClub(input: CreateClubInput): Promise<Club>;

  /**
   * Update an existing club
   * 
   * @param id - Club ID
   * @param input - Club update data
   * @returns Updated club
   * @throws NotFoundError if club doesn't exist
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
   * Check if club name is unique
   * 
   * @param name - Club name to check
   * @param excludeId - Club ID to exclude from check (for updates)
   * @returns True if name is unique
   */
  isClubNameUnique(name: string, excludeId?: string): Promise<boolean>;

  /**
   * Get clubs by status
   * 
   * @param status - Club status to filter by
   * @param limit - Maximum number of clubs to return
   * @returns List of clubs with the specified status
   */
  getClubsByStatus(status: string, limit?: number): Promise<Club[]>;

  /**
   * Search clubs by name (for future use)
   * 
   * @param nameQuery - Name search query
   * @param limit - Maximum number of results
   * @returns List of matching clubs
   */
  searchClubsByName(nameQuery: string, limit?: number): Promise<Club[]>;
}