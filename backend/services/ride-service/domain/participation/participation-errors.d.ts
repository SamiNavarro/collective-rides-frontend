export declare class ParticipationNotFoundError extends Error {
    statusCode: number;
    errorType: string;
    constructor(participationId: string);
}
export declare class AlreadyParticipatingError extends Error {
    statusCode: number;
    errorType: string;
    constructor(userId: string, rideId: string);
}
export declare class RideFullError extends Error {
    statusCode: number;
    errorType: string;
    constructor(rideId: string);
}
export declare class InvalidParticipationStatusError extends Error {
    statusCode: number;
    errorType: string;
    constructor(currentStatus: string, operation: string);
}
export declare class InvalidRoleTransitionError extends Error {
    statusCode: number;
    errorType: string;
    constructor(fromRole: string, toRole: string);
}
export declare class CannotRemoveCaptainError extends Error {
    statusCode: number;
    errorType: string;
    constructor();
}
