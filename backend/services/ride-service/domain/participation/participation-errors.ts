export class ParticipationNotFoundError extends Error {
  statusCode = 404;
  errorType = 'PARTICIPATION_NOT_FOUND';
  
  constructor(participationId: string) {
    super(`Participation not found: ${participationId}`);
  }
}

export class AlreadyParticipatingError extends Error {
  statusCode = 409;
  errorType = 'ALREADY_PARTICIPATING';
  
  constructor(userId: string, rideId: string) {
    super(`User ${userId} is already participating in ride ${rideId}`);
  }
}

export class RideFullError extends Error {
  statusCode = 409;
  errorType = 'RIDE_FULL';
  
  constructor(rideId: string) {
    super(`Ride ${rideId} is full`);
  }
}

export class InvalidParticipationStatusError extends Error {
  statusCode = 400;
  errorType = 'INVALID_PARTICIPATION_STATUS';
  
  constructor(currentStatus: string, operation: string) {
    super(`Cannot ${operation} participation in status: ${currentStatus}`);
  }
}

export class InvalidRoleTransitionError extends Error {
  statusCode = 400;
  errorType = 'INVALID_ROLE_TRANSITION';
  
  constructor(fromRole: string, toRole: string) {
    super(`Invalid role transition from ${fromRole} to ${toRole}`);
  }
}

export class CannotRemoveCaptainError extends Error {
  statusCode = 400;
  errorType = 'CANNOT_REMOVE_CAPTAIN';
  
  constructor() {
    super('Cannot remove ride captain. Transfer captain role first.');
  }
}