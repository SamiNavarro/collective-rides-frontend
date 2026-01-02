export declare enum ParticipationStatus {
    CONFIRMED = "confirmed",
    WAITLISTED = "waitlisted",
    WITHDRAWN = "withdrawn",
    REMOVED = "removed"
}
export declare enum RideRole {
    CAPTAIN = "captain",
    LEADER = "leader",
    PARTICIPANT = "participant"
}
export declare enum AttendanceStatus {
    UNKNOWN = "unknown",
    ATTENDED = "attended",
    NO_SHOW = "no_show",
    WITHDRAWN = "withdrawn"
}
export declare enum EvidenceType {
    STRAVA = "strava",
    MANUAL = "manual"
}
export declare enum MatchType {
    TAG = "tag",
    TIME_WINDOW = "time_window",
    MANUAL = "manual"
}
export interface EvidenceMetrics {
    distanceMeters?: number;
    movingTimeSeconds?: number;
    elevationGainMeters?: number;
    startTimeUtc?: string;
}
export interface Evidence {
    type: EvidenceType;
    refId: string;
    matchType: MatchType;
    metricsSnapshot?: EvidenceMetrics;
    linkedAt: string;
}
export interface RideParticipation {
    participationId: string;
    rideId: string;
    clubId: string;
    userId: string;
    role: RideRole;
    status: ParticipationStatus;
    joinedAt: string;
    message?: string;
    waitlistPosition?: number;
    attendanceStatus?: AttendanceStatus;
    evidence?: Evidence;
    confirmedBy?: string;
    confirmedAt?: string;
}
export interface JoinRideRequest {
    message?: string;
}
export interface UpdateParticipantRequest {
    role: RideRole;
    reason?: string;
}
export interface UpdateAttendanceRequest {
    attendanceStatus: AttendanceStatus;
}
export interface LinkManualEvidenceRequest {
    description: string;
}
export interface LinkStravaEvidenceRequest {
    stravaActivityId: string;
}
export interface ListUserRidesQuery {
    status?: 'upcoming' | 'completed' | 'cancelled';
    role?: RideRole;
    limit?: number;
    cursor?: string;
}
