import { RideEntity } from './ride';
import { ListRidesQuery } from '../../../../shared/types/ride';
import { RideSummary } from '../../../../shared/types/strava';
import { RideParticipation } from '../../../../shared/types/participation';
export interface PaginatedRides {
    rides: RideEntity[];
    nextCursor?: string;
}
export interface RideRepository {
    create(ride: RideEntity): Promise<void>;
    findById(rideId: string): Promise<RideEntity | null>;
    findByClubId(clubId: string, query: ListRidesQuery): Promise<PaginatedRides>;
    update(ride: RideEntity): Promise<void>;
    delete(rideId: string): Promise<void>;
    findParticipations(rideId: string): Promise<RideParticipation[]>;
    saveRideSummary(summary: RideSummary): Promise<void>;
    findRideSummary(rideId: string): Promise<RideSummary | null>;
}
