export declare class RideNotFoundError extends Error {
    statusCode: number;
    errorType: string;
    constructor(rideId: string);
}
export declare class RideAlreadyExistsError extends Error {
    statusCode: number;
    errorType: string;
    constructor(rideId: string);
}
export declare class InvalidRideStatusError extends Error {
    statusCode: number;
    errorType: string;
    constructor(currentStatus: string, operation: string);
}
export declare class RideCapacityExceededError extends Error {
    statusCode: number;
    errorType: string;
    constructor(maxParticipants: number);
}
export declare class InvalidRideScopeError extends Error {
    statusCode: number;
    errorType: string;
    constructor(scope: string);
}
export declare class RideValidationError extends Error {
    statusCode: number;
    errorType: string;
    constructor(message: string);
}
