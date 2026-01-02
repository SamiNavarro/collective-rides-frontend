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

import { Club, ClubStatus, CreateClubInput, UpdateClubInput, CLUB_CONSTRAINTS } from '../../../shared/types/club';
import { ValidationError } from '../../../shared/utils/errors';

/**
 * Club entity class with business logic
 */
export class ClubEntity {
  constructor(private club: Club) {}

  /**
   * Get the club data
   */
  get data(): Club {
    return { ...this.club };
  }

  /**
   * Get club ID
   */
  get id(): string {
    return this.club.id;
  }

  /**
   * Get club name
   */
  get name(): string {
    return this.club.name;
  }

  /**
   * Get club status
   */
  get status(): ClubStatus {
    return this.club.status;
  }

  /**
   * Check if club is active
   */
  get isActive(): boolean {
    return this.club.status === ClubStatus.ACTIVE;
  }

  /**
   * Check if club is suspended
   */
  get isSuspended(): boolean {
    return this.club.status === ClubStatus.SUSPENDED;
  }

  /**
   * Check if club is archived
   */
  get isArchived(): boolean {
    return this.club.status === ClubStatus.ARCHIVED;
  }

  /**
   * Update club with new data
   */
  update(input: UpdateClubInput): ClubEntity {
    const updatedClub: Club = {
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
  activate(): ClubEntity {
    return this.update({ status: ClubStatus.ACTIVE });
  }

  /**
   * Suspend the club
   */
  suspend(): ClubEntity {
    return this.update({ status: ClubStatus.SUSPENDED });
  }

  /**
   * Archive the club
   */
  archive(): ClubEntity {
    return this.update({ status: ClubStatus.ARCHIVED });
  }

  /**
   * Check if club can be updated
   */
  canUpdate(): boolean {
    // Archived clubs cannot be updated
    return this.club.status !== ClubStatus.ARCHIVED;
  }

  /**
   * Check if club is visible in public listings
   */
  isPubliclyVisible(): boolean {
    // Only active clubs are visible by default
    return this.club.status === ClubStatus.ACTIVE;
  }

  /**
   * Get normalized name for indexing
   */
  get nameLower(): string {
    return this.club.name.toLowerCase().trim();
  }
}

/**
 * Create a new club entity
 */
export function createClub(input: CreateClubInput): ClubEntity {
  const now = new Date().toISOString();
  const clubId = generateClubId();

  const club: Club = {
    id: clubId,
    name: input.name.trim(),
    description: input.description?.trim(),
    status: ClubStatus.ACTIVE,
    city: input.city?.trim(),
    logoUrl: input.logoUrl?.trim(),
    createdAt: now,
    updatedAt: now,
  };

  // Validate the new club
  validateClubData(club);

  return new ClubEntity(club);
}

/**
 * Create club entity from existing data
 */
export function fromClubData(club: Club): ClubEntity {
  // Validate existing club data
  validateClubData(club);
  return new ClubEntity(club);
}

/**
 * Validate club data
 */
export function validateClubData(club: Partial<Club>): void {
  // Validate name
  if (club.name !== undefined) {
    if (!club.name || typeof club.name !== 'string') {
      throw new ValidationError('Club name is required');
    }

    const trimmedName = club.name.trim();
    if (trimmedName.length < CLUB_CONSTRAINTS.NAME_MIN_LENGTH) {
      throw new ValidationError('Club name is too short');
    }

    if (trimmedName.length > CLUB_CONSTRAINTS.NAME_MAX_LENGTH) {
      throw new ValidationError('Club name is too long');
    }
  }

  // Validate description
  if (club.description !== undefined && club.description !== null) {
    if (typeof club.description !== 'string') {
      throw new ValidationError('Club description must be a string');
    }

    if (club.description.length > CLUB_CONSTRAINTS.DESCRIPTION_MAX_LENGTH) {
      throw new ValidationError('Club description is too long');
    }
  }

  // Validate city
  if (club.city !== undefined && club.city !== null) {
    if (typeof club.city !== 'string') {
      throw new ValidationError('Club city must be a string');
    }

    if (club.city.length > CLUB_CONSTRAINTS.CITY_MAX_LENGTH) {
      throw new ValidationError('Club city name is too long');
    }
  }

  // Validate logoUrl
  if (club.logoUrl !== undefined && club.logoUrl !== null) {
    if (typeof club.logoUrl !== 'string') {
      throw new ValidationError('Club logo URL must be a string');
    }

    // Basic URL validation
    try {
      new URL(club.logoUrl);
    } catch {
      throw new ValidationError('Club logo URL is not valid');
    }
  }

  // Validate status
  if (club.status !== undefined) {
    if (!Object.values(ClubStatus).includes(club.status)) {
      throw new ValidationError('Invalid club status');
    }
  }
}

/**
 * Validate create club input
 */
export function validateCreateClubInput(input: CreateClubInput): void {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Invalid club data');
  }

  // Validate required fields
  if (!input.name) {
    throw new ValidationError('Club name is required');
  }

  // Validate using club data validation
  validateClubData({
    name: input.name,
    description: input.description,
    city: input.city,
    logoUrl: input.logoUrl,
  });
}

/**
 * Validate update club input
 */
export function validateUpdateClubInput(input: UpdateClubInput): void {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Invalid club update data');
  }

  // At least one field must be provided
  const hasUpdates = Object.keys(input).length > 0;
  if (!hasUpdates) {
    throw new ValidationError('At least one field must be updated');
  }

  // Validate using club data validation
  validateClubData(input);
}

/**
 * Generate a unique club ID
 */
function generateClubId(): string {
  // Generate a unique ID using timestamp and random string
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `club_${timestamp}_${random}`;
}

/**
 * Check if club name is valid for uniqueness check
 */
export function normalizeClubName(name: string): string {
  return name.toLowerCase().trim();
}

/**
 * Club status transition rules
 */
export const CLUB_STATUS_TRANSITIONS: Record<ClubStatus, ClubStatus[]> = {
  [ClubStatus.ACTIVE]: [ClubStatus.SUSPENDED, ClubStatus.ARCHIVED],
  [ClubStatus.SUSPENDED]: [ClubStatus.ACTIVE, ClubStatus.ARCHIVED],
  [ClubStatus.ARCHIVED]: [], // Archived clubs cannot transition to other states
};

/**
 * Check if status transition is valid
 */
export function isValidStatusTransition(from: ClubStatus, to: ClubStatus): boolean {
  return CLUB_STATUS_TRANSITIONS[from].includes(to);
}