/**
 * Ride Types for Frontend - Phase 3.3
 * 
 * TypeScript types for ride-related data structures used in the frontend.
 * Matches backend ride service contracts.
 */

export enum RideStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum RideType {
  TRAINING = 'training',
  SOCIAL = 'social',
  COMPETITIVE = 'competitive',
  ADVENTURE = 'adventure',
  MAINTENANCE = 'maintenance'
}

export enum RideDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert'
}

export enum ParticipationStatus {
  CONFIRMED = 'confirmed',
  WAITLISTED = 'waitlisted',
  WITHDRAWN = 'withdrawn',
  REMOVED = 'removed'
}

export enum RideRole {
  CAPTAIN = 'captain',
  LEADER = 'leader',
  PARTICIPANT = 'participant'
}

/**
 * Ride summary for list views (canonical model)
 */
export interface RideSummary {
  rideId: string;
  clubId: string;
  title: string;
  rideType: RideType;
  difficulty: RideDifficulty;
  status: RideStatus;
  startDateTime: string;
  estimatedDuration: number;
  currentParticipants: number;
  maxParticipants?: number;
  meetingPoint: {
    name: string;
    address: string;
  };
  route?: {
    name: string;
    distance?: number;
    difficulty?: RideDifficulty;
    notes?: string;
  };
  createdBy: string;
  createdByName?: string;
  publishedAt?: string;
}

/**
 * Ride detail (full information)
 */
export interface RideDetail extends RideSummary {
  description: string;
  scope: string;
  audience: string;
  isPublic: boolean;
  allowWaitlist: boolean;
  waitlistCount?: number;
  createdAt: string;
  updatedAt: string;
  publishedBy?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  meetingPoint: {
    name: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    instructions?: string;
  };
  route?: {
    name: string;
    type: string;
    distance?: number;
    estimatedTime?: number;
    difficulty?: RideDifficulty;
    notes?: string;
  };
  requirements?: {
    equipment: string[];
    experience: string;
    fitness: string;
  };
  participants: RideParticipant[];
  waitlist?: WaitlistEntry[];
  viewerParticipation?: ViewerParticipation;
}

/**
 * Ride participant information
 */
export interface RideParticipant {
  userId: string;
  displayName: string;
  role: RideRole;
  status: ParticipationStatus;
  joinedAt: string;
}

/**
 * Waitlist entry
 */
export interface WaitlistEntry {
  userId: string;
  displayName: string;
  joinedWaitlistAt: string;
  position?: number;
}

/**
 * Viewer's participation context (Phase 3.3 backend enhancement)
 */
export interface ViewerParticipation {
  participationId: string;
  role: RideRole;
  status: ParticipationStatus;
  joinedAt: string;
}

/**
 * Ride filters for listing
 */
export interface RideFilters {
  clubId?: string;
  datePreset?: 'this-week' | 'next-30-days' | 'custom';
  startDate?: string;
  endDate?: string;
  search?: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    limit: number;
    nextCursor?: string;
  };
  timestamp: string;
}

/**
 * Create ride request (Phase 3.3.3)
 */
export interface CreateRideRequest {
  title: string;
  description?: string;
  rideType: RideType;
  difficulty: RideDifficulty;
  startDateTime: string; // ISO 8601
  estimatedDuration: number; // minutes
  maxParticipants?: number;
  publishImmediately?: boolean; // Leadership only
  meetingPoint: {
    name: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    instructions?: string;
  };
  route?: {
    name: string;
    type: 'basic';
    distance?: number; // meters
    difficulty?: RideDifficulty;
    notes?: string;
  };
  requirements?: {
    equipment: string[];
    experience: string;
    fitness: string;
  };
}

/**
 * Update ride request (Phase 3.3.4)
 */
export interface UpdateRideRequest {
  title?: string;
  description?: string;
  rideType?: RideType;
  difficulty?: RideDifficulty;
  startDateTime?: string; // ISO 8601
  estimatedDuration?: number; // minutes
  maxParticipants?: number;
  meetingPoint?: {
    name?: string;
    address?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    instructions?: string;
  };
  route?: {
    name?: string;
    type?: 'basic';
    distance?: number; // meters
    difficulty?: RideDifficulty;
    notes?: string;
  };
  requirements?: {
    equipment?: string[];
    experience?: string;
    fitness?: string;
  };
}

/**
 * Cancel ride request (Phase 3.3.4)
 */
export interface CancelRideRequest {
  reason?: string;
}
