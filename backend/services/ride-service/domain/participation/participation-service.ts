import { ParticipationEntity } from './participation';
import { ParticipationRepository, PaginatedUserRides } from './participation-repository';
import { RideRepository } from '../ride/ride-repository';
import { 
  JoinRideRequest, 
  UpdateParticipantRequest,
  ListUserRidesQuery,
  ParticipationStatus,
  RideRole,
  AttendanceStatus,
  MatchType 
} from '../../../../shared/types/participation';
import { RideStatus } from '../../../../shared/types/ride';
import { 
  ParticipationNotFoundError,
  AlreadyParticipatingError,
  RideFullError,
  InvalidRoleTransitionError,
  CannotRemoveCaptainError
} from './participation-errors';
import { RideNotFoundError } from '../ride/ride-errors';

export class ParticipationService {
  constructor(
    private participationRepository: ParticipationRepository,
    private rideRepository: RideRepository
  ) {}

  async joinRide(
    rideId: string,
    userId: string,
    request: JoinRideRequest
  ): Promise<ParticipationEntity> {
    // Get ride and validate
    const ride = await this.rideRepository.findById(rideId);
    if (!ride) {
      throw new RideNotFoundError(rideId);
    }

    // Check if user is already participating
    const existingParticipation = await this.participationRepository.findByRideAndUser(rideId, userId);
    if (existingParticipation) {
      throw new AlreadyParticipatingError(userId, rideId);
    }

    // Check if ride can accept participants
    if (ride.status !== RideStatus.PUBLISHED) {
      throw new Error('Can only join published rides');
    }

    let participation: ParticipationEntity;

    if (ride.canAcceptParticipants()) {
      // Join as confirmed participant
      participation = ParticipationEntity.create(
        rideId,
        ride.clubId,
        userId,
        request,
        ParticipationStatus.CONFIRMED
      );
      
      // Update ride participant count
      ride.incrementParticipants();
      await this.rideRepository.update(ride);
    } else if (ride.isWaitlistAvailable()) {
      // Join waitlist
      const waitlistPosition = await this.participationRepository.getWaitlistPosition(rideId) + 1;
      participation = ParticipationEntity.create(
        rideId,
        ride.clubId,
        userId,
        request,
        ParticipationStatus.WAITLISTED,
        waitlistPosition
      );
      
      // Update ride waitlist count
      ride.incrementWaitlist();
      await this.rideRepository.update(ride);
    } else {
      throw new RideFullError(rideId);
    }

    await this.participationRepository.create(participation);
    return participation;
  }

  async leaveRide(rideId: string, userId: string): Promise<void> {
    const participation = await this.participationRepository.findByRideAndUser(rideId, userId);
    if (!participation) {
      throw new ParticipationNotFoundError(`${rideId}:${userId}`);
    }

    // Cannot remove captain without transferring role
    if (participation.role === RideRole.CAPTAIN) {
      throw new CannotRemoveCaptainError();
    }

    const ride = await this.rideRepository.findById(rideId);
    if (!ride) {
      throw new RideNotFoundError(rideId);
    }

    participation.withdraw();
    await this.participationRepository.update(participation);

    // Update ride counts
    if (participation.status === ParticipationStatus.CONFIRMED) {
      ride.decrementParticipants();
      await this.promoteFromWaitlistIfNeeded(rideId, ride);
    } else if (participation.status === ParticipationStatus.WAITLISTED) {
      ride.decrementWaitlist();
      await this.reorderWaitlist(rideId);
    }

    await this.rideRepository.update(ride);
  }

  async updateParticipantRole(
    rideId: string,
    userId: string,
    request: UpdateParticipantRequest
  ): Promise<ParticipationEntity> {
    const participation = await this.participationRepository.findByRideAndUser(rideId, userId);
    if (!participation) {
      throw new ParticipationNotFoundError(`${rideId}:${userId}`);
    }

    // Validate role transition
    this.validateRoleTransition(participation.role, request.role);

    participation.updateRole(request.role, request.reason);
    await this.participationRepository.update(participation);

    return participation;
  }

  async removeParticipant(rideId: string, userId: string): Promise<void> {
    const participation = await this.participationRepository.findByRideAndUser(rideId, userId);
    if (!participation) {
      throw new ParticipationNotFoundError(`${rideId}:${userId}`);
    }

    // Cannot remove captain without transferring role
    if (participation.role === RideRole.CAPTAIN) {
      throw new CannotRemoveCaptainError();
    }

    const ride = await this.rideRepository.findById(rideId);
    if (!ride) {
      throw new RideNotFoundError(rideId);
    }

    participation.remove();
    await this.participationRepository.update(participation);

    // Update ride counts
    if (participation.status === ParticipationStatus.CONFIRMED) {
      ride.decrementParticipants();
      await this.promoteFromWaitlistIfNeeded(rideId, ride);
    } else if (participation.status === ParticipationStatus.WAITLISTED) {
      ride.decrementWaitlist();
      await this.reorderWaitlist(rideId);
    }

    await this.rideRepository.update(ride);
  }

  async getRideParticipants(rideId: string): Promise<ParticipationEntity[]> {
    return this.participationRepository.findByRideId(rideId);
  }

  async getUserRides(userId: string, query: ListUserRidesQuery): Promise<PaginatedUserRides> {
    return this.participationRepository.findByUserId(userId, query);
  }

  // Phase 2.5: Attendance tracking methods
  async updateAttendance(
    rideId: string,
    userId: string,
    attendanceStatus: AttendanceStatus,
    confirmedBy: string
  ): Promise<ParticipationEntity> {
    const participation = await this.participationRepository.findByRideAndUser(rideId, userId);
    if (!participation) {
      throw new ParticipationNotFoundError(`${rideId}:${userId}`);
    }

    if (!participation.canUpdateAttendance()) {
      throw new Error('Cannot update attendance for non-confirmed participant');
    }

    participation.updateAttendance(attendanceStatus, confirmedBy);
    await this.participationRepository.update(participation);

    return participation;
  }

  async linkManualEvidence(
    rideId: string,
    userId: string,
    evidenceId: string,
    description: string,
    confirmedBy: string
  ): Promise<ParticipationEntity> {
    const participation = await this.participationRepository.findByRideAndUser(rideId, userId);
    if (!participation) {
      throw new ParticipationNotFoundError(`${rideId}:${userId}`);
    }

    if (!participation.canUpdateAttendance()) {
      throw new Error('Cannot link evidence for non-confirmed participant');
    }

    participation.linkManualEvidence(evidenceId, confirmedBy);
    await this.participationRepository.update(participation);

    return participation;
  }

  async linkStravaEvidence(
    rideId: string,
    userId: string,
    stravaActivityId: string,
    matchType: MatchType,
    metrics?: any
  ): Promise<ParticipationEntity> {
    const participation = await this.participationRepository.findByRideAndUser(rideId, userId);
    if (!participation) {
      throw new ParticipationNotFoundError(`${rideId}:${userId}`);
    }

    if (!participation.canUpdateAttendance()) {
      throw new Error('Cannot link evidence for non-confirmed participant');
    }

    participation.linkStravaEvidence(stravaActivityId, matchType, metrics);
    await this.participationRepository.update(participation);

    return participation;
  }

  private validateRoleTransition(fromRole: RideRole, toRole: RideRole): void {
    // Define allowed role transitions
    const allowedTransitions: Record<RideRole, RideRole[]> = {
      [RideRole.PARTICIPANT]: [RideRole.LEADER, RideRole.CAPTAIN],
      [RideRole.LEADER]: [RideRole.PARTICIPANT, RideRole.CAPTAIN],
      [RideRole.CAPTAIN]: [RideRole.LEADER] // Captain can step down but not to participant directly
    };

    if (!allowedTransitions[fromRole]?.includes(toRole)) {
      throw new InvalidRoleTransitionError(fromRole, toRole);
    }
  }

  private async promoteFromWaitlistIfNeeded(rideId: string, ride: any): Promise<void> {
    if (!ride.canAcceptParticipants()) return;

    const participations = await this.participationRepository.findByRideId(rideId);
    const waitlisted = participations
      .filter(p => p.status === ParticipationStatus.WAITLISTED)
      .sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));

    if (waitlisted.length > 0) {
      const nextParticipant = waitlisted[0];
      nextParticipant.promoteFromWaitlist();
      await this.participationRepository.update(nextParticipant);
      
      ride.incrementParticipants();
      ride.decrementWaitlist();
      
      // Reorder remaining waitlist
      await this.reorderWaitlist(rideId);
    }
  }

  private async reorderWaitlist(rideId: string): Promise<void> {
    const participations = await this.participationRepository.findByRideId(rideId);
    const waitlisted = participations
      .filter(p => p.status === ParticipationStatus.WAITLISTED)
      .sort((a, b) => (a.waitlistPosition || 0) - (b.waitlistPosition || 0));

    for (let i = 0; i < waitlisted.length; i++) {
      waitlisted[i].updateWaitlistPosition(i + 1);
      await this.participationRepository.update(waitlisted[i]);
    }
  }
}