import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ParticipationEntity } from '../domain/participation/participation';
import { ParticipationRepository, PaginatedUserRides } from '../domain/participation/participation-repository';
import { ListUserRidesQuery } from '../../../shared/types/participation';
export declare class DynamoDBParticipationRepository implements ParticipationRepository {
    private docClient;
    private tableName;
    constructor(dynamoClient: DynamoDBClient, tableName: string);
    create(participation: ParticipationEntity): Promise<void>;
    findById(participationId: string): Promise<ParticipationEntity | null>;
    findByRideAndUser(rideId: string, userId: string): Promise<ParticipationEntity | null>;
    findByRideId(rideId: string): Promise<ParticipationEntity[]>;
    findByUserId(userId: string, query: ListUserRidesQuery): Promise<PaginatedUserRides>;
    update(participation: ParticipationEntity): Promise<void>;
    delete(participationId: string): Promise<void>;
    getWaitlistPosition(rideId: string): Promise<number>;
}
