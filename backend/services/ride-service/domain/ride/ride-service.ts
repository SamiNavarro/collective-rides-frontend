import { RideEntity } from './ride';
import { RideRepository, PaginatedRides } from './ride-repository';
import { 
  CreateRideRequest, 
  UpdateRideRequest, 
  PublishRideRequest,
  CancelRideRequest,
  CompleteRideRequest,
  ListRidesQuery,
  RideScope,
  RideStatus 
} from '../../../../shared/types/ride';
import { RideSummary } from '../../../../shared/types/strava';
import { 
  RideNotFoundError, 
  InvalidRideScopeError, 
  RideValidationError 
} from './ride-errors';

export class RideService {
  constructor(private rideRepository: RideRepository) {}

  async createRide(
    request: CreateRideRequest, 
    createdBy: string, 
    clubId: string
  ): Promise<RideEntity> {
    // Validate Phase 2.3 constraints
    this.validatePhase23Constraints(request);
    
    // Validate business rules
    this.validateCreateRequest(request);
    
    const ride = RideEntity.create(request, createdBy, clubId);
    await this.rideRepository.create(ride);
    
    return ride;
  }

  async getRide(rideId: string): Promise<RideEntity> {
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) {
      throw new RideNotFoundError(rideId);
    }
    return ride;
  }

  async listClubRides(clubId: string, query: ListRidesQuery): Promise<PaginatedRides> {
    return this.rideRepository.findByClubId(clubId, query);
  }

  async publishRide(
    rideId: string, 
    publishedBy: string, 
    request: PublishRideRequest
  ): Promise<RideEntity> {
    const ride = await this.getRide(rideId);
    
    ride.publish(publishedBy, request.audience, request.isPublic);
    await this.rideRepository.update(ride);
    
    return ride;
  }

  async updateRide(
    rideId: string, 
    request: UpdateRideRequest
  ): Promise<RideEntity> {
    const ride = await this.getRide(rideId);
    
    this.validateUpdateRequest(request);
    ride.update(request);
    await this.rideRepository.update(ride);
    
    return ride;
  }

  async cancelRide(
    rideId: string, 
    request: CancelRideRequest
  ): Promise<RideEntity> {
    const ride = await this.getRide(rideId);
    
    ride.cancel(request.reason);
    await this.rideRepository.update(ride);
    
    return ride;
  }

  // Phase 2.5: Ride completion functionality
  async completeRide(
    rideId: string,
    clubId: string,
    completedBy: string,
    completionNotes?: string
  ): Promise<RideEntity> {
    const ride = await this.getRide(rideId);
    
    // Verify ride belongs to the specified club
    if (ride.clubId !== clubId) {
      throw new RideValidationError('Ride does not belong to the specified club');
    }
    
    // Complete the ride
    ride.complete(completedBy, completionNotes);
    await this.rideRepository.update(ride);
    
    // Generate ride summary for future analytics
    await this.generateRideSummary(ride);
    
    return ride;
  }

  async startRide(
    rideId: string,
    clubId: string,
    startedBy: string
  ): Promise<RideEntity> {
    const ride = await this.getRide(rideId);
    
    // Verify ride belongs to the specified club
    if (ride.clubId !== clubId) {
      throw new RideValidationError('Ride does not belong to the specified club');
    }
    
    ride.start(startedBy);
    await this.rideRepository.update(ride);
    
    return ride;
  }

  async getRideSummary(rideId: string, clubId: string): Promise<RideSummary | null> {
    const ride = await this.getRide(rideId);
    
    // Verify ride belongs to the specified club
    if (ride.clubId !== clubId) {
      throw new RideValidationError('Ride does not belong to the specified club');
    }
    
    // Only completed rides have summaries
    if (ride.status !== RideStatus.COMPLETED) {
      return null;
    }
    
    return this.rideRepository.findRideSummary(rideId);
  }

  private async generateRideSummary(ride: RideEntity): Promise<void> {
    // Get all participants for this ride
    const participations = await this.rideRepository.findParticipations(ride.rideId);
    
    const summary: RideSummary = {
      rideId: ride.rideId,
      clubId: ride.clubId,
      completedAt: ride.toJSON().completedAt!,
      participantsPlanned: participations.length,
      participantsAttended: participations.filter(p => p.attendanceStatus === 'attended').length,
      participantsNoShow: participations.filter(p => p.attendanceStatus === 'no_show').length,
      participantsWithStrava: participations.filter(p => p.evidence?.type === 'strava').length,
      participantsWithManualEvidence: participations.filter(p => p.evidence?.type === 'manual').length,
      lastUpdatedAt: new Date().toISOString()
    };
    
    // Calculate aggregated metrics from Strava evidence
    const stravaParticipations = participations.filter(p => p.evidence?.type === 'strava');
    if (stravaParticipations.length > 0) {
      const metrics = stravaParticipations.reduce((acc, p) => {
        const evidence = p.evidence!.metricsSnapshot;
        if (evidence) {
          acc.totalDistance += evidence.distanceMeters || 0;
          acc.totalElevation += evidence.elevationGainMeters || 0;
          acc.totalTime += evidence.movingTimeSeconds || 0;
          acc.count++;
        }
        return acc;
      }, { totalDistance: 0, totalElevation: 0, totalTime: 0, count: 0 });
      
      if (metrics.count > 0) {
        summary.aggregatedMetrics = {
          totalDistanceMeters: metrics.totalDistance,
          totalElevationGainMeters: metrics.totalElevation,
          averageSpeedMps: metrics.totalTime > 0 ? metrics.totalDistance / metrics.totalTime : 0
        };
      }
    }
    
    await this.rideRepository.saveRideSummary(summary);
  }

  private validatePhase23Constraints(request: CreateRideRequest): void {
    // Phase 2.3 only supports club rides
    // This validation ensures we don't accidentally create non-club rides
    if (request.route?.provider && request.route.provider !== 'internal') {
      throw new RideValidationError('External route providers not supported in Phase 2.3');
    }
  }

  private validateCreateRequest(request: CreateRideRequest): void {
    if (!request.title?.trim()) {
      throw new RideValidationError('Title is required');
    }
    
    if (!request.description?.trim()) {
      throw new RideValidationError('Description is required');
    }
    
    if (!request.startDateTime) {
      throw new RideValidationError('Start date and time is required');
    }
    
    const startDate = new Date(request.startDateTime);
    if (startDate <= new Date()) {
      throw new RideValidationError('Start date must be in the future');
    }
    
    if (request.estimatedDuration <= 0) {
      throw new RideValidationError('Estimated duration must be positive');
    }
    
    if (request.maxParticipants !== undefined && request.maxParticipants < 1) {
      throw new RideValidationError('Maximum participants must be at least 1');
    }
    
    if (!request.meetingPoint?.name?.trim()) {
      throw new RideValidationError('Meeting point name is required');
    }
    
    if (!request.meetingPoint?.address?.trim()) {
      throw new RideValidationError('Meeting point address is required');
    }
  }

  private validateUpdateRequest(request: UpdateRideRequest): void {
    if (request.title !== undefined && !request.title.trim()) {
      throw new RideValidationError('Title cannot be empty');
    }
    
    if (request.description !== undefined && !request.description.trim()) {
      throw new RideValidationError('Description cannot be empty');
    }
    
    if (request.startDateTime !== undefined) {
      const startDate = new Date(request.startDateTime);
      if (startDate <= new Date()) {
        throw new RideValidationError('Start date must be in the future');
      }
    }
    
    if (request.estimatedDuration !== undefined && request.estimatedDuration <= 0) {
      throw new RideValidationError('Estimated duration must be positive');
    }
    
    if (request.maxParticipants !== undefined && request.maxParticipants < 1) {
      throw new RideValidationError('Maximum participants must be at least 1');
    }
  }
}