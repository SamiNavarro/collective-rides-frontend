import { ParticipationEntity } from './participation';
import { ParticipationRepository, PaginatedUserRides } from './participation-repository';
import { RideRepository } from '../ride/ride-repository';
import { JoinRideRequest, UpdateParticipantRequest, ListUserRidesQuery, AttendanceStatus, MatchType } from '../../../../shared/types/participation';
export declare class ParticipationService {
    private participationRepository;
    private rideRepository;
    constructor(participationRepository: ParticipationRepository, rideRepository: RideRepository);
    joinRide(rideId: string, userId: string, request: JoinRideRequest): Promise<ParticipationEntity>;
    leaveRide(rideId: string, userId: string): Promise<void>;
    updateParticipantRole(rideId: string, userId: string, request: UpdateParticipantRequest): Promise<ParticipationEntity>;
    removeParticipant(rideId: string, userId: string): Promise<void>;
    getRideParticipants(rideId: string): Promise<ParticipationEntity[]>;
    getUserRides(userId: string, query: ListUserRidesQuery): Promise<PaginatedUserRides>;
    updateAttendance(rideId: string, userId: string, attendanceStatus: AttendanceStatus, confirmedBy: string): Promise<ParticipationEntity>;
    linkManualEvidence(rideId: string, userId: string, evidenceId: string, description: string, confirmedBy: string): Promise<ParticipationEntity>;
    linkStravaEvidence(rideId: string, userId: string, stravaActivityId: string, matchType: MatchType, metrics?: any): Promise<ParticipationEntity>;
    private validateRoleTransition;
    private promoteFromWaitlistIfNeeded;
    private reorderWaitlist;
}
