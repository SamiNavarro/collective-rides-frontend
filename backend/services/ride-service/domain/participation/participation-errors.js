"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CannotRemoveCaptainError = exports.InvalidRoleTransitionError = exports.InvalidParticipationStatusError = exports.RideFullError = exports.AlreadyParticipatingError = exports.ParticipationNotFoundError = void 0;
class ParticipationNotFoundError extends Error {
    constructor(participationId) {
        super(`Participation not found: ${participationId}`);
        this.statusCode = 404;
        this.errorType = 'PARTICIPATION_NOT_FOUND';
    }
}
exports.ParticipationNotFoundError = ParticipationNotFoundError;
class AlreadyParticipatingError extends Error {
    constructor(userId, rideId) {
        super(`User ${userId} is already participating in ride ${rideId}`);
        this.statusCode = 409;
        this.errorType = 'ALREADY_PARTICIPATING';
    }
}
exports.AlreadyParticipatingError = AlreadyParticipatingError;
class RideFullError extends Error {
    constructor(rideId) {
        super(`Ride ${rideId} is full`);
        this.statusCode = 409;
        this.errorType = 'RIDE_FULL';
    }
}
exports.RideFullError = RideFullError;
class InvalidParticipationStatusError extends Error {
    constructor(currentStatus, operation) {
        super(`Cannot ${operation} participation in status: ${currentStatus}`);
        this.statusCode = 400;
        this.errorType = 'INVALID_PARTICIPATION_STATUS';
    }
}
exports.InvalidParticipationStatusError = InvalidParticipationStatusError;
class InvalidRoleTransitionError extends Error {
    constructor(fromRole, toRole) {
        super(`Invalid role transition from ${fromRole} to ${toRole}`);
        this.statusCode = 400;
        this.errorType = 'INVALID_ROLE_TRANSITION';
    }
}
exports.InvalidRoleTransitionError = InvalidRoleTransitionError;
class CannotRemoveCaptainError extends Error {
    constructor() {
        super('Cannot remove ride captain. Transfer captain role first.');
        this.statusCode = 400;
        this.errorType = 'CANNOT_REMOVE_CAPTAIN';
    }
}
exports.CannotRemoveCaptainError = CannotRemoveCaptainError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFydGljaXBhdGlvbi1lcnJvcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJwYXJ0aWNpcGF0aW9uLWVycm9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxNQUFhLDBCQUEyQixTQUFRLEtBQUs7SUFJbkQsWUFBWSxlQUF1QjtRQUNqQyxLQUFLLENBQUMsNEJBQTRCLGVBQWUsRUFBRSxDQUFDLENBQUM7UUFKdkQsZUFBVSxHQUFHLEdBQUcsQ0FBQztRQUNqQixjQUFTLEdBQUcseUJBQXlCLENBQUM7SUFJdEMsQ0FBQztDQUNGO0FBUEQsZ0VBT0M7QUFFRCxNQUFhLHlCQUEwQixTQUFRLEtBQUs7SUFJbEQsWUFBWSxNQUFjLEVBQUUsTUFBYztRQUN4QyxLQUFLLENBQUMsUUFBUSxNQUFNLHFDQUFxQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBSnJFLGVBQVUsR0FBRyxHQUFHLENBQUM7UUFDakIsY0FBUyxHQUFHLHVCQUF1QixDQUFDO0lBSXBDLENBQUM7Q0FDRjtBQVBELDhEQU9DO0FBRUQsTUFBYSxhQUFjLFNBQVEsS0FBSztJQUl0QyxZQUFZLE1BQWM7UUFDeEIsS0FBSyxDQUFDLFFBQVEsTUFBTSxVQUFVLENBQUMsQ0FBQztRQUpsQyxlQUFVLEdBQUcsR0FBRyxDQUFDO1FBQ2pCLGNBQVMsR0FBRyxXQUFXLENBQUM7SUFJeEIsQ0FBQztDQUNGO0FBUEQsc0NBT0M7QUFFRCxNQUFhLCtCQUFnQyxTQUFRLEtBQUs7SUFJeEQsWUFBWSxhQUFxQixFQUFFLFNBQWlCO1FBQ2xELEtBQUssQ0FBQyxVQUFVLFNBQVMsNkJBQTZCLGFBQWEsRUFBRSxDQUFDLENBQUM7UUFKekUsZUFBVSxHQUFHLEdBQUcsQ0FBQztRQUNqQixjQUFTLEdBQUcsOEJBQThCLENBQUM7SUFJM0MsQ0FBQztDQUNGO0FBUEQsMEVBT0M7QUFFRCxNQUFhLDBCQUEyQixTQUFRLEtBQUs7SUFJbkQsWUFBWSxRQUFnQixFQUFFLE1BQWM7UUFDMUMsS0FBSyxDQUFDLGdDQUFnQyxRQUFRLE9BQU8sTUFBTSxFQUFFLENBQUMsQ0FBQztRQUpqRSxlQUFVLEdBQUcsR0FBRyxDQUFDO1FBQ2pCLGNBQVMsR0FBRyx5QkFBeUIsQ0FBQztJQUl0QyxDQUFDO0NBQ0Y7QUFQRCxnRUFPQztBQUVELE1BQWEsd0JBQXlCLFNBQVEsS0FBSztJQUlqRDtRQUNFLEtBQUssQ0FBQywwREFBMEQsQ0FBQyxDQUFDO1FBSnBFLGVBQVUsR0FBRyxHQUFHLENBQUM7UUFDakIsY0FBUyxHQUFHLHVCQUF1QixDQUFDO0lBSXBDLENBQUM7Q0FDRjtBQVBELDREQU9DIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIFBhcnRpY2lwYXRpb25Ob3RGb3VuZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBzdGF0dXNDb2RlID0gNDA0O1xuICBlcnJvclR5cGUgPSAnUEFSVElDSVBBVElPTl9OT1RfRk9VTkQnO1xuICBcbiAgY29uc3RydWN0b3IocGFydGljaXBhdGlvbklkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgUGFydGljaXBhdGlvbiBub3QgZm91bmQ6ICR7cGFydGljaXBhdGlvbklkfWApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBbHJlYWR5UGFydGljaXBhdGluZ0Vycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBzdGF0dXNDb2RlID0gNDA5O1xuICBlcnJvclR5cGUgPSAnQUxSRUFEWV9QQVJUSUNJUEFUSU5HJztcbiAgXG4gIGNvbnN0cnVjdG9yKHVzZXJJZDogc3RyaW5nLCByaWRlSWQ6IHN0cmluZykge1xuICAgIHN1cGVyKGBVc2VyICR7dXNlcklkfSBpcyBhbHJlYWR5IHBhcnRpY2lwYXRpbmcgaW4gcmlkZSAke3JpZGVJZH1gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmlkZUZ1bGxFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgc3RhdHVzQ29kZSA9IDQwOTtcbiAgZXJyb3JUeXBlID0gJ1JJREVfRlVMTCc7XG4gIFxuICBjb25zdHJ1Y3RvcihyaWRlSWQ6IHN0cmluZykge1xuICAgIHN1cGVyKGBSaWRlICR7cmlkZUlkfSBpcyBmdWxsYCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEludmFsaWRQYXJ0aWNpcGF0aW9uU3RhdHVzRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIHN0YXR1c0NvZGUgPSA0MDA7XG4gIGVycm9yVHlwZSA9ICdJTlZBTElEX1BBUlRJQ0lQQVRJT05fU1RBVFVTJztcbiAgXG4gIGNvbnN0cnVjdG9yKGN1cnJlbnRTdGF0dXM6IHN0cmluZywgb3BlcmF0aW9uOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgQ2Fubm90ICR7b3BlcmF0aW9ufSBwYXJ0aWNpcGF0aW9uIGluIHN0YXR1czogJHtjdXJyZW50U3RhdHVzfWApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBJbnZhbGlkUm9sZVRyYW5zaXRpb25FcnJvciBleHRlbmRzIEVycm9yIHtcbiAgc3RhdHVzQ29kZSA9IDQwMDtcbiAgZXJyb3JUeXBlID0gJ0lOVkFMSURfUk9MRV9UUkFOU0lUSU9OJztcbiAgXG4gIGNvbnN0cnVjdG9yKGZyb21Sb2xlOiBzdHJpbmcsIHRvUm9sZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoYEludmFsaWQgcm9sZSB0cmFuc2l0aW9uIGZyb20gJHtmcm9tUm9sZX0gdG8gJHt0b1JvbGV9YCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIENhbm5vdFJlbW92ZUNhcHRhaW5FcnJvciBleHRlbmRzIEVycm9yIHtcbiAgc3RhdHVzQ29kZSA9IDQwMDtcbiAgZXJyb3JUeXBlID0gJ0NBTk5PVF9SRU1PVkVfQ0FQVEFJTic7XG4gIFxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcignQ2Fubm90IHJlbW92ZSByaWRlIGNhcHRhaW4uIFRyYW5zZmVyIGNhcHRhaW4gcm9sZSBmaXJzdC4nKTtcbiAgfVxufSJdfQ==