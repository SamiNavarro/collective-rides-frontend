export declare enum RideCapability {
    VIEW_CLUB_RIDES = "view_club_rides",
    VIEW_DRAFT_RIDES = "view_draft_rides",
    JOIN_RIDES = "join_rides",
    CREATE_RIDE_PROPOSALS = "create_ride_proposals",
    PUBLISH_OFFICIAL_RIDES = "publish_official_rides",
    MANAGE_RIDES = "manage_rides",
    CANCEL_RIDES = "cancel_rides",
    MANAGE_PARTICIPANTS = "manage_participants",
    ASSIGN_LEADERSHIP = "assign_leadership"
}
export interface RideAuthContext {
    rideParticipation?: {
        participationId: string;
        rideId: string;
        role: string;
        status: string;
        joinedAt: string;
    };
    rideCapabilities: RideCapability[];
}
