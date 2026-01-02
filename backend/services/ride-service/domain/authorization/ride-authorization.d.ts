import { RideCapability } from '../../../../shared/types/ride-authorization';
import { AuthContext } from '../../../../shared/types/club-authorization';
import { RideStatus, RideScope } from '../../../../shared/types/ride';
export declare class RideAuthorizationService {
    private static readonly ROLE_CAPABILITIES;
    static requireRideCapability(capability: RideCapability, authContext: AuthContext, clubId: string, rideId?: string, rideCreatedBy?: string): Promise<void>;
    static canViewRide(authContext: AuthContext, clubId: string, rideStatus: RideStatus, rideScope: RideScope, rideCreatedBy: string, isPublic: boolean): boolean;
    static canPublishRide(authContext: AuthContext, clubId: string): boolean;
    static getUserRideCapabilities(authContext: AuthContext, clubId: string): RideCapability[];
}
