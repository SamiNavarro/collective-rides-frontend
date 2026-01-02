import { ParticipationEntity } from './participation';
import { ListUserRidesQuery } from '../../../../shared/types/participation';
export interface PaginatedParticipations {
    participations: ParticipationEntity[];
    nextCursor?: string;
}
export interface UserRideInfo {
    participationId: string;
    rideId: string;
    clubId: string;
    clubName: string;
    title: string;
    rideType: string;
    difficulty: string;
    startDateTime: string;
    role: string;
    status: string;
    joinedAt: string;
}
export interface PaginatedUserRides {
    rides: UserRideInfo[];
    nextCursor?: string;
}
export interface ParticipationRepository {
    create(participation: ParticipationEntity): Promise<void>;
    findById(participationId: string): Promise<ParticipationEntity | null>;
    findByRideAndUser(rideId: string, userId: string): Promise<ParticipationEntity | null>;
    findByRideId(rideId: string): Promise<ParticipationEntity[]>;
    findByUserId(userId: string, query: ListUserRidesQuery): Promise<PaginatedUserRides>;
    update(participation: ParticipationEntity): Promise<void>;
    delete(participationId: string): Promise<void>;
    getWaitlistPosition(rideId: string): Promise<number>;
}
