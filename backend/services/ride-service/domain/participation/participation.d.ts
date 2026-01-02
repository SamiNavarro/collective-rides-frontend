import { RideParticipation, ParticipationStatus, RideRole, JoinRideRequest, AttendanceStatus, Evidence, MatchType } from '../../../../shared/types/participation';
export declare class ParticipationEntity {
    private participation;
    constructor(participation: RideParticipation);
    static create(rideId: string, clubId: string, userId: string, request: JoinRideRequest, status?: ParticipationStatus, waitlistPosition?: number): ParticipationEntity;
    static createCaptain(rideId: string, clubId: string, userId: string): ParticipationEntity;
    get participationId(): string;
    get rideId(): string;
    get clubId(): string;
    get userId(): string;
    get role(): RideRole;
    get status(): ParticipationStatus;
    get waitlistPosition(): number | undefined;
    get attendanceStatus(): AttendanceStatus;
    get evidence(): Evidence | undefined;
    toJSON(): RideParticipation;
    canUpdateRole(): boolean;
    canLeave(): boolean;
    updateRole(newRole: RideRole, reason?: string): void;
    withdraw(): void;
    remove(): void;
    promoteFromWaitlist(): void;
    updateWaitlistPosition(position: number): void;
    updateAttendance(status: AttendanceStatus, confirmedBy?: string): void;
    linkStravaEvidence(stravaActivityId: string, matchType: MatchType, metrics?: any): void;
    linkManualEvidence(evidenceId: string, confirmedBy: string): void;
    canUpdateAttendance(): boolean;
    hasEvidence(): boolean;
}
