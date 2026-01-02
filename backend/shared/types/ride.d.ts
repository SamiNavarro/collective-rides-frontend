export declare enum RideStatus {
    DRAFT = "draft",
    PUBLISHED = "published",
    ACTIVE = "active",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum RideScope {
    CLUB = "club",
    PRIVATE = "private",
    COMMUNITY = "community"
}
export declare enum RideAudience {
    INVITE_ONLY = "invite_only",
    MEMBERS_ONLY = "members_only",
    PUBLIC_READ_ONLY = "public_read_only"
}
export declare enum RideType {
    TRAINING = "training",
    SOCIAL = "social",
    COMPETITIVE = "competitive",
    ADVENTURE = "adventure",
    MAINTENANCE = "maintenance"
}
export declare enum RideDifficulty {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced",
    EXPERT = "expert"
}
export declare enum RouteType {
    BASIC = "basic",
    S3_GPX = "s3_gpx",
    EXTERNAL = "external"
}
export interface Coordinates {
    latitude: number;
    longitude: number;
}
export interface Waypoint {
    name: string;
    coordinates: Coordinates;
    type: 'start' | 'waypoint' | 'end';
}
export interface MeetingPoint {
    name: string;
    address: string;
    coordinates: Coordinates;
    instructions?: string;
}
export interface Route {
    name: string;
    type: RouteType;
    distance?: number;
    estimatedTime?: number;
    difficulty?: RideDifficulty;
    waypoints?: Waypoint[];
    routeKey?: string;
    contentType?: string;
    hash?: string;
    provider?: string;
    externalId?: string;
    externalUrl?: string;
    externalType?: string;
    version?: string;
    createdAt?: string;
    updatedAt?: string;
}
export interface RideRequirements {
    equipment: string[];
    experience: string;
    fitness: string;
}
export interface Ride {
    rideId: string;
    clubId: string;
    title: string;
    description: string;
    rideType: RideType;
    difficulty: RideDifficulty;
    status: RideStatus;
    scope: RideScope;
    audience: RideAudience;
    startDateTime: string;
    estimatedDuration: number;
    maxParticipants?: number;
    currentParticipants: number;
    waitlistCount?: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    publishedBy?: string;
    publishedAt?: string;
    meetingPoint: MeetingPoint;
    route?: Route;
    requirements?: RideRequirements;
    isPublic: boolean;
    allowWaitlist: boolean;
    startedAt?: string;
    startedBy?: string;
    completedAt?: string;
    completedBy?: string;
    completionNotes?: string;
}
export interface CreateRideRequest {
    title: string;
    description: string;
    rideType: RideType;
    difficulty: RideDifficulty;
    startDateTime: string;
    estimatedDuration: number;
    maxParticipants?: number;
    publishImmediately?: boolean;
    meetingPoint: MeetingPoint;
    route?: Omit<Route, 'createdAt' | 'updatedAt'>;
    requirements?: RideRequirements;
    isPublic?: boolean;
    allowWaitlist?: boolean;
}
export interface PublishRideRequest {
    audience?: RideAudience;
    isPublic?: boolean;
    publishMessage?: string;
}
export interface UpdateRideRequest {
    title?: string;
    description?: string;
    startDateTime?: string;
    estimatedDuration?: number;
    maxParticipants?: number;
    meetingPoint?: MeetingPoint;
    route?: Omit<Route, 'createdAt' | 'updatedAt'>;
    requirements?: RideRequirements;
    isPublic?: boolean;
    allowWaitlist?: boolean;
}
export interface CancelRideRequest {
    reason?: string;
    notifyParticipants?: boolean;
}
export interface CompleteRideRequest {
    completionNotes?: string;
}
export interface ListRidesQuery {
    limit?: number;
    cursor?: string;
    status?: RideStatus;
    rideType?: RideType;
    difficulty?: RideDifficulty;
    startDate?: string;
    endDate?: string;
    includeDrafts?: boolean;
}
