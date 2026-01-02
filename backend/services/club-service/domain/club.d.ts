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
import { Club, ClubStatus, CreateClubInput, UpdateClubInput } from '../../../shared/types/club';
/**
 * Club entity class with business logic
 */
export declare class ClubEntity {
    private club;
    constructor(club: Club);
    /**
     * Get the club data
     */
    get data(): Club;
    /**
     * Get club ID
     */
    get id(): string;
    /**
     * Get club name
     */
    get name(): string;
    /**
     * Get club status
     */
    get status(): ClubStatus;
    /**
     * Check if club is active
     */
    get isActive(): boolean;
    /**
     * Check if club is suspended
     */
    get isSuspended(): boolean;
    /**
     * Check if club is archived
     */
    get isArchived(): boolean;
    /**
     * Update club with new data
     */
    update(input: UpdateClubInput): ClubEntity;
    /**
     * Activate the club
     */
    activate(): ClubEntity;
    /**
     * Suspend the club
     */
    suspend(): ClubEntity;
    /**
     * Archive the club
     */
    archive(): ClubEntity;
    /**
     * Check if club can be updated
     */
    canUpdate(): boolean;
    /**
     * Check if club is visible in public listings
     */
    isPubliclyVisible(): boolean;
    /**
     * Get normalized name for indexing
     */
    get nameLower(): string;
}
/**
 * Create a new club entity
 */
export declare function createClub(input: CreateClubInput): ClubEntity;
/**
 * Create club entity from existing data
 */
export declare function fromClubData(club: Club): ClubEntity;
/**
 * Validate club data
 */
export declare function validateClubData(club: Partial<Club>): void;
/**
 * Validate create club input
 */
export declare function validateCreateClubInput(input: CreateClubInput): void;
/**
 * Validate update club input
 */
export declare function validateUpdateClubInput(input: UpdateClubInput): void;
/**
 * Check if club name is valid for uniqueness check
 */
export declare function normalizeClubName(name: string): string;
/**
 * Club status transition rules
 */
export declare const CLUB_STATUS_TRANSITIONS: Record<ClubStatus, ClubStatus[]>;
/**
 * Check if status transition is valid
 */
export declare function isValidStatusTransition(from: ClubStatus, to: ClubStatus): boolean;
