import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { RideEntity } from '../domain/ride/ride';
import { RideRepository, PaginatedRides } from '../domain/ride/ride-repository';
import { ListRidesQuery } from '../../../shared/types/ride';
import { RideSummary } from '../../../shared/types/strava';
import { RideParticipation } from '../../../shared/types/participation';
export declare class DynamoDBRideRepository implements RideRepository {
    private docClient;
    private tableName;
    constructor(dynamoClient: DynamoDBClient, tableName: string);
    create(ride: RideEntity): Promise<void>;
    findById(rideId: string): Promise<RideEntity | null>;
    findByClubId(clubId: string, query: ListRidesQuery): Promise<PaginatedRides>;
    update(ride: RideEntity): Promise<void>;
    delete(rideId: string): Promise<void>;
    findParticipations(rideId: string): Promise<RideParticipation[]>;
    saveRideSummary(summary: RideSummary): Promise<void>;
    findRideSummary(rideId: string): Promise<RideSummary | null>;
}
