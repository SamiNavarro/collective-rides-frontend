import { RideEntity } from './ride';
import { RideRepository, PaginatedRides } from './ride-repository';
import { CreateRideRequest, UpdateRideRequest, PublishRideRequest, CancelRideRequest, ListRidesQuery } from '../../../../shared/types/ride';
import { RideSummary } from '../../../../shared/types/strava';
export declare class RideService {
    private rideRepository;
    constructor(rideRepository: RideRepository);
    createRide(request: CreateRideRequest, createdBy: string, clubId: string): Promise<RideEntity>;
    getRide(rideId: string): Promise<RideEntity>;
    listClubRides(clubId: string, query: ListRidesQuery): Promise<PaginatedRides>;
    publishRide(rideId: string, publishedBy: string, request: PublishRideRequest): Promise<RideEntity>;
    updateRide(rideId: string, request: UpdateRideRequest): Promise<RideEntity>;
    cancelRide(rideId: string, request: CancelRideRequest): Promise<RideEntity>;
    completeRide(rideId: string, clubId: string, completedBy: string, completionNotes?: string): Promise<RideEntity>;
    startRide(rideId: string, clubId: string, startedBy: string): Promise<RideEntity>;
    getRideSummary(rideId: string, clubId: string): Promise<RideSummary | null>;
    private generateRideSummary;
    private validatePhase23Constraints;
    private validateCreateRequest;
    private validateUpdateRequest;
}
