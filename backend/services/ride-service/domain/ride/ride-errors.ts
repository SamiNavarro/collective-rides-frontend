export class RideNotFoundError extends Error {
  statusCode = 404;
  errorType = 'RIDE_NOT_FOUND';
  
  constructor(rideId: string) {
    super(`Ride not found: ${rideId}`);
  }
}

export class RideAlreadyExistsError extends Error {
  statusCode = 409;
  errorType = 'RIDE_ALREADY_EXISTS';
  
  constructor(rideId: string) {
    super(`Ride already exists: ${rideId}`);
  }
}

export class InvalidRideStatusError extends Error {
  statusCode = 400;
  errorType = 'INVALID_RIDE_STATUS';
  
  constructor(currentStatus: string, operation: string) {
    super(`Cannot ${operation} ride in status: ${currentStatus}`);
  }
}

export class RideCapacityExceededError extends Error {
  statusCode = 409;
  errorType = 'RIDE_CAPACITY_EXCEEDED';
  
  constructor(maxParticipants: number) {
    super(`Ride capacity exceeded. Maximum participants: ${maxParticipants}`);
  }
}

export class InvalidRideScopeError extends Error {
  statusCode = 400;
  errorType = 'INVALID_RIDE_SCOPE';
  
  constructor(scope: string) {
    super(`Invalid ride scope for Phase 2.3: ${scope}. Only 'club' rides are supported.`);
  }
}

export class RideValidationError extends Error {
  statusCode = 400;
  errorType = 'RIDE_VALIDATION_ERROR';
  
  constructor(message: string) {
    super(`Ride validation failed: ${message}`);
  }
}