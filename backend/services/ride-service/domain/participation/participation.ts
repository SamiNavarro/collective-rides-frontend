import { 
  RideParticipation, 
  ParticipationStatus, 
  RideRole,
  JoinRideRequest,
  AttendanceStatus,
  Evidence,
  EvidenceType,
  MatchType
} from '../../../../shared/types/participation';
import { generateId } from '../../../../shared/utils/id-generator';

export class ParticipationEntity {
  constructor(private participation: RideParticipation) {}

  static create(
    rideId: string,
    clubId: string,
    userId: string,
    request: JoinRideRequest,
    status: ParticipationStatus = ParticipationStatus.CONFIRMED,
    waitlistPosition?: number
  ): ParticipationEntity {
    const participationId = generateId('part');
    const now = new Date().toISOString();

    const participation: RideParticipation = {
      participationId,
      rideId,
      clubId,
      userId,
      role: RideRole.PARTICIPANT,
      status,
      joinedAt: now,
      message: request.message,
      waitlistPosition
    };

    return new ParticipationEntity(participation);
  }

  static createCaptain(rideId: string, clubId: string, userId: string): ParticipationEntity {
    const participationId = generateId('part');
    const now = new Date().toISOString();

    const participation: RideParticipation = {
      participationId,
      rideId,
      clubId,
      userId,
      role: RideRole.CAPTAIN,
      status: ParticipationStatus.CONFIRMED,
      joinedAt: now
    };

    return new ParticipationEntity(participation);
  }

  // Getters
  get participationId(): string { return this.participation.participationId; }
  get rideId(): string { return this.participation.rideId; }
  get clubId(): string { return this.participation.clubId; }
  get userId(): string { return this.participation.userId; }
  get role(): RideRole { return this.participation.role; }
  get status(): ParticipationStatus { return this.participation.status; }
  get waitlistPosition(): number | undefined { return this.participation.waitlistPosition; }
  get attendanceStatus(): AttendanceStatus { return this.participation.attendanceStatus || AttendanceStatus.UNKNOWN; }
  get evidence(): Evidence | undefined { return this.participation.evidence; }

  toJSON(): RideParticipation {
    return { ...this.participation };
  }

  // Business methods
  canUpdateRole(): boolean {
    return this.participation.status === ParticipationStatus.CONFIRMED;
  }

  canLeave(): boolean {
    return this.participation.status === ParticipationStatus.CONFIRMED ||
           this.participation.status === ParticipationStatus.WAITLISTED;
  }

  updateRole(newRole: RideRole, reason?: string): void {
    if (!this.canUpdateRole()) {
      throw new Error('Cannot update role for non-confirmed participant');
    }

    this.participation.role = newRole;
  }

  withdraw(): void {
    if (!this.canLeave()) {
      throw new Error('Cannot withdraw from ride in current status');
    }

    this.participation.status = ParticipationStatus.WITHDRAWN;
    this.participation.waitlistPosition = undefined;
  }

  remove(): void {
    this.participation.status = ParticipationStatus.REMOVED;
    this.participation.waitlistPosition = undefined;
  }

  promoteFromWaitlist(): void {
    if (this.participation.status !== ParticipationStatus.WAITLISTED) {
      throw new Error('Can only promote waitlisted participants');
    }

    this.participation.status = ParticipationStatus.CONFIRMED;
    this.participation.waitlistPosition = undefined;
  }

  updateWaitlistPosition(position: number): void {
    if (this.participation.status !== ParticipationStatus.WAITLISTED) {
      throw new Error('Can only update waitlist position for waitlisted participants');
    }

    this.participation.waitlistPosition = position;
  }

  // Phase 2.5: Attendance tracking methods
  updateAttendance(status: AttendanceStatus, confirmedBy?: string): void {
    this.participation.attendanceStatus = status;
    if (confirmedBy) {
      this.participation.confirmedBy = confirmedBy;
      this.participation.confirmedAt = new Date().toISOString();
    }
  }

  linkStravaEvidence(stravaActivityId: string, matchType: MatchType, metrics?: any): void {
    const evidence: Evidence = {
      type: EvidenceType.STRAVA,
      refId: stravaActivityId,
      matchType,
      metricsSnapshot: metrics,
      linkedAt: new Date().toISOString()
    };

    this.participation.evidence = evidence;
    this.participation.attendanceStatus = AttendanceStatus.ATTENDED;
  }

  linkManualEvidence(evidenceId: string, confirmedBy: string): void {
    const evidence: Evidence = {
      type: EvidenceType.MANUAL,
      refId: evidenceId,
      matchType: MatchType.MANUAL,
      linkedAt: new Date().toISOString()
    };

    this.participation.evidence = evidence;
    this.participation.attendanceStatus = AttendanceStatus.ATTENDED;
    this.participation.confirmedBy = confirmedBy;
    this.participation.confirmedAt = new Date().toISOString();
  }

  canUpdateAttendance(): boolean {
    return this.participation.status === ParticipationStatus.CONFIRMED;
  }

  hasEvidence(): boolean {
    return this.participation.evidence !== undefined;
  }
}