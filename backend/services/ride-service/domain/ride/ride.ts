import { 
  Ride, 
  RideStatus, 
  RideScope, 
  RideAudience, 
  CreateRideRequest,
  UpdateRideRequest 
} from '../../../../shared/types/ride';
import { generateId } from '../../../../shared/utils/id-generator';

export class RideEntity {
  constructor(private ride: Ride) {}

  static create(request: CreateRideRequest, createdBy: string, clubId: string): RideEntity {
    const now = new Date().toISOString();
    const rideId = generateId('ride');
    
    // Determine initial status based on user permissions
    const initialStatus = request.publishImmediately ? RideStatus.PUBLISHED : RideStatus.DRAFT;
    const initialAudience = initialStatus === RideStatus.PUBLISHED 
      ? RideAudience.MEMBERS_ONLY 
      : RideAudience.INVITE_ONLY;

    const ride: Ride = {
      rideId,
      clubId,
      title: request.title,
      description: request.description,
      rideType: request.rideType,
      difficulty: request.difficulty,
      status: initialStatus,
      scope: RideScope.CLUB, // Phase 2.3 only supports club rides
      audience: initialAudience,
      startDateTime: request.startDateTime,
      estimatedDuration: request.estimatedDuration,
      maxParticipants: request.maxParticipants,
      currentParticipants: 1, // Creator is automatically a participant
      waitlistCount: 0,
      createdBy,
      createdAt: now,
      updatedAt: now,
      publishedBy: request.publishImmediately ? createdBy : undefined,
      publishedAt: request.publishImmediately ? now : undefined,
      meetingPoint: request.meetingPoint,
      route: request.route,
      requirements: request.requirements,
      isPublic: request.isPublic || false,
      allowWaitlist: request.allowWaitlist || true
    };

    return new RideEntity(ride);
  }

  // Getters
  get rideId(): string { return this.ride.rideId; }
  get clubId(): string { return this.ride.clubId; }
  get title(): string { return this.ride.title; }
  get status(): RideStatus { return this.ride.status; }
  get scope(): RideScope { return this.ride.scope; }
  get audience(): RideAudience { return this.ride.audience; }
  get createdBy(): string { return this.ride.createdBy; }
  get startDateTime(): string { return this.ride.startDateTime; }
  get currentParticipants(): number { return this.ride.currentParticipants; }
  get maxParticipants(): number | undefined { return this.ride.maxParticipants; }

  toJSON(): Ride {
    return { ...this.ride };
  }

  // Business methods
  canBePublished(): boolean {
    return this.ride.status === RideStatus.DRAFT;
  }

  canBeUpdated(): boolean {
    return this.ride.status === RideStatus.DRAFT || this.ride.status === RideStatus.PUBLISHED;
  }

  canBeCancelled(): boolean {
    return this.ride.status === RideStatus.DRAFT || 
           this.ride.status === RideStatus.PUBLISHED || 
           this.ride.status === RideStatus.ACTIVE;
  }

  canAcceptParticipants(): boolean {
    if (this.ride.status !== RideStatus.PUBLISHED) return false;
    if (!this.ride.maxParticipants) return true;
    return this.ride.currentParticipants < this.ride.maxParticipants;
  }

  isWaitlistAvailable(): boolean {
    return this.ride.allowWaitlist && 
           this.ride.maxParticipants !== undefined &&
           this.ride.currentParticipants >= this.ride.maxParticipants;
  }

  publish(publishedBy: string, audience?: RideAudience, isPublic?: boolean): void {
    if (!this.canBePublished()) {
      throw new Error('Ride cannot be published in current status');
    }

    const now = new Date().toISOString();
    this.ride.status = RideStatus.PUBLISHED;
    this.ride.audience = audience || RideAudience.MEMBERS_ONLY;
    this.ride.publishedBy = publishedBy;
    this.ride.publishedAt = now;
    this.ride.updatedAt = now;
    
    if (isPublic !== undefined) {
      this.ride.isPublic = isPublic;
    }
  }

  update(request: UpdateRideRequest): void {
    if (!this.canBeUpdated()) {
      throw new Error('Ride cannot be updated in current status');
    }

    const now = new Date().toISOString();
    
    if (request.title !== undefined) this.ride.title = request.title;
    if (request.description !== undefined) this.ride.description = request.description;
    if (request.startDateTime !== undefined) this.ride.startDateTime = request.startDateTime;
    if (request.estimatedDuration !== undefined) this.ride.estimatedDuration = request.estimatedDuration;
    if (request.maxParticipants !== undefined) this.ride.maxParticipants = request.maxParticipants;
    if (request.meetingPoint !== undefined) this.ride.meetingPoint = request.meetingPoint;
    if (request.route !== undefined) this.ride.route = request.route;
    if (request.requirements !== undefined) this.ride.requirements = request.requirements;
    if (request.isPublic !== undefined) this.ride.isPublic = request.isPublic;
    if (request.allowWaitlist !== undefined) this.ride.allowWaitlist = request.allowWaitlist;
    
    this.ride.updatedAt = now;
  }

  cancel(reason?: string): void {
    if (!this.canBeCancelled()) {
      throw new Error('Ride cannot be cancelled in current status');
    }

    this.ride.status = RideStatus.CANCELLED;
    this.ride.updatedAt = new Date().toISOString();
  }

  activate(): void {
    if (this.ride.status !== RideStatus.PUBLISHED) {
      throw new Error('Only published rides can be activated');
    }

    this.ride.status = RideStatus.ACTIVE;
    this.ride.updatedAt = new Date().toISOString();
  }

  complete(completedBy: string, completionNotes?: string): void {
    if (this.ride.status !== RideStatus.ACTIVE) {
      throw new Error('Only active rides can be completed');
    }

    const now = new Date().toISOString();
    this.ride.status = RideStatus.COMPLETED;
    this.ride.completedAt = now;
    this.ride.completedBy = completedBy;
    this.ride.completionNotes = completionNotes;
    this.ride.updatedAt = now;
  }

  start(startedBy: string): void {
    if (this.ride.status !== RideStatus.PUBLISHED) {
      throw new Error('Only published rides can be started');
    }

    const now = new Date().toISOString();
    this.ride.status = RideStatus.ACTIVE;
    this.ride.startedAt = now;
    this.ride.startedBy = startedBy;
    this.ride.updatedAt = now;
  }

  canBeCompleted(): boolean {
    return this.ride.status === RideStatus.ACTIVE;
  }

  canBeStarted(): boolean {
    return this.ride.status === RideStatus.PUBLISHED;
  }

  incrementParticipants(): void {
    this.ride.currentParticipants++;
    this.ride.updatedAt = new Date().toISOString();
  }

  decrementParticipants(): void {
    if (this.ride.currentParticipants > 0) {
      this.ride.currentParticipants--;
      this.ride.updatedAt = new Date().toISOString();
    }
  }

  incrementWaitlist(): void {
    this.ride.waitlistCount = (this.ride.waitlistCount || 0) + 1;
    this.ride.updatedAt = new Date().toISOString();
  }

  decrementWaitlist(): void {
    if (this.ride.waitlistCount && this.ride.waitlistCount > 0) {
      this.ride.waitlistCount--;
      this.ride.updatedAt = new Date().toISOString();
    }
  }
}