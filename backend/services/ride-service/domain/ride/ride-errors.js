"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideValidationError = exports.InvalidRideScopeError = exports.RideCapacityExceededError = exports.InvalidRideStatusError = exports.RideAlreadyExistsError = exports.RideNotFoundError = void 0;
class RideNotFoundError extends Error {
    constructor(rideId) {
        super(`Ride not found: ${rideId}`);
        this.statusCode = 404;
        this.errorType = 'RIDE_NOT_FOUND';
    }
}
exports.RideNotFoundError = RideNotFoundError;
class RideAlreadyExistsError extends Error {
    constructor(rideId) {
        super(`Ride already exists: ${rideId}`);
        this.statusCode = 409;
        this.errorType = 'RIDE_ALREADY_EXISTS';
    }
}
exports.RideAlreadyExistsError = RideAlreadyExistsError;
class InvalidRideStatusError extends Error {
    constructor(currentStatus, operation) {
        super(`Cannot ${operation} ride in status: ${currentStatus}`);
        this.statusCode = 400;
        this.errorType = 'INVALID_RIDE_STATUS';
    }
}
exports.InvalidRideStatusError = InvalidRideStatusError;
class RideCapacityExceededError extends Error {
    constructor(maxParticipants) {
        super(`Ride capacity exceeded. Maximum participants: ${maxParticipants}`);
        this.statusCode = 409;
        this.errorType = 'RIDE_CAPACITY_EXCEEDED';
    }
}
exports.RideCapacityExceededError = RideCapacityExceededError;
class InvalidRideScopeError extends Error {
    constructor(scope) {
        super(`Invalid ride scope for Phase 2.3: ${scope}. Only 'club' rides are supported.`);
        this.statusCode = 400;
        this.errorType = 'INVALID_RIDE_SCOPE';
    }
}
exports.InvalidRideScopeError = InvalidRideScopeError;
class RideValidationError extends Error {
    constructor(message) {
        super(`Ride validation failed: ${message}`);
        this.statusCode = 400;
        this.errorType = 'RIDE_VALIDATION_ERROR';
    }
}
exports.RideValidationError = RideValidationError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlkZS1lcnJvcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJyaWRlLWVycm9ycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxNQUFhLGlCQUFrQixTQUFRLEtBQUs7SUFJMUMsWUFBWSxNQUFjO1FBQ3hCLEtBQUssQ0FBQyxtQkFBbUIsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUpyQyxlQUFVLEdBQUcsR0FBRyxDQUFDO1FBQ2pCLGNBQVMsR0FBRyxnQkFBZ0IsQ0FBQztJQUk3QixDQUFDO0NBQ0Y7QUFQRCw4Q0FPQztBQUVELE1BQWEsc0JBQXVCLFNBQVEsS0FBSztJQUkvQyxZQUFZLE1BQWM7UUFDeEIsS0FBSyxDQUFDLHdCQUF3QixNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBSjFDLGVBQVUsR0FBRyxHQUFHLENBQUM7UUFDakIsY0FBUyxHQUFHLHFCQUFxQixDQUFDO0lBSWxDLENBQUM7Q0FDRjtBQVBELHdEQU9DO0FBRUQsTUFBYSxzQkFBdUIsU0FBUSxLQUFLO0lBSS9DLFlBQVksYUFBcUIsRUFBRSxTQUFpQjtRQUNsRCxLQUFLLENBQUMsVUFBVSxTQUFTLG9CQUFvQixhQUFhLEVBQUUsQ0FBQyxDQUFDO1FBSmhFLGVBQVUsR0FBRyxHQUFHLENBQUM7UUFDakIsY0FBUyxHQUFHLHFCQUFxQixDQUFDO0lBSWxDLENBQUM7Q0FDRjtBQVBELHdEQU9DO0FBRUQsTUFBYSx5QkFBMEIsU0FBUSxLQUFLO0lBSWxELFlBQVksZUFBdUI7UUFDakMsS0FBSyxDQUFDLGlEQUFpRCxlQUFlLEVBQUUsQ0FBQyxDQUFDO1FBSjVFLGVBQVUsR0FBRyxHQUFHLENBQUM7UUFDakIsY0FBUyxHQUFHLHdCQUF3QixDQUFDO0lBSXJDLENBQUM7Q0FDRjtBQVBELDhEQU9DO0FBRUQsTUFBYSxxQkFBc0IsU0FBUSxLQUFLO0lBSTlDLFlBQVksS0FBYTtRQUN2QixLQUFLLENBQUMscUNBQXFDLEtBQUssb0NBQW9DLENBQUMsQ0FBQztRQUp4RixlQUFVLEdBQUcsR0FBRyxDQUFDO1FBQ2pCLGNBQVMsR0FBRyxvQkFBb0IsQ0FBQztJQUlqQyxDQUFDO0NBQ0Y7QUFQRCxzREFPQztBQUVELE1BQWEsbUJBQW9CLFNBQVEsS0FBSztJQUk1QyxZQUFZLE9BQWU7UUFDekIsS0FBSyxDQUFDLDJCQUEyQixPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBSjlDLGVBQVUsR0FBRyxHQUFHLENBQUM7UUFDakIsY0FBUyxHQUFHLHVCQUF1QixDQUFDO0lBSXBDLENBQUM7Q0FDRjtBQVBELGtEQU9DIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIFJpZGVOb3RGb3VuZEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBzdGF0dXNDb2RlID0gNDA0O1xuICBlcnJvclR5cGUgPSAnUklERV9OT1RfRk9VTkQnO1xuICBcbiAgY29uc3RydWN0b3IocmlkZUlkOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgUmlkZSBub3QgZm91bmQ6ICR7cmlkZUlkfWApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSaWRlQWxyZWFkeUV4aXN0c0Vycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBzdGF0dXNDb2RlID0gNDA5O1xuICBlcnJvclR5cGUgPSAnUklERV9BTFJFQURZX0VYSVNUUyc7XG4gIFxuICBjb25zdHJ1Y3RvcihyaWRlSWQ6IHN0cmluZykge1xuICAgIHN1cGVyKGBSaWRlIGFscmVhZHkgZXhpc3RzOiAke3JpZGVJZH1gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSW52YWxpZFJpZGVTdGF0dXNFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgc3RhdHVzQ29kZSA9IDQwMDtcbiAgZXJyb3JUeXBlID0gJ0lOVkFMSURfUklERV9TVEFUVVMnO1xuICBcbiAgY29uc3RydWN0b3IoY3VycmVudFN0YXR1czogc3RyaW5nLCBvcGVyYXRpb246IHN0cmluZykge1xuICAgIHN1cGVyKGBDYW5ub3QgJHtvcGVyYXRpb259IHJpZGUgaW4gc3RhdHVzOiAke2N1cnJlbnRTdGF0dXN9YCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJpZGVDYXBhY2l0eUV4Y2VlZGVkRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIHN0YXR1c0NvZGUgPSA0MDk7XG4gIGVycm9yVHlwZSA9ICdSSURFX0NBUEFDSVRZX0VYQ0VFREVEJztcbiAgXG4gIGNvbnN0cnVjdG9yKG1heFBhcnRpY2lwYW50czogbnVtYmVyKSB7XG4gICAgc3VwZXIoYFJpZGUgY2FwYWNpdHkgZXhjZWVkZWQuIE1heGltdW0gcGFydGljaXBhbnRzOiAke21heFBhcnRpY2lwYW50c31gKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgSW52YWxpZFJpZGVTY29wZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBzdGF0dXNDb2RlID0gNDAwO1xuICBlcnJvclR5cGUgPSAnSU5WQUxJRF9SSURFX1NDT1BFJztcbiAgXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihgSW52YWxpZCByaWRlIHNjb3BlIGZvciBQaGFzZSAyLjM6ICR7c2NvcGV9LiBPbmx5ICdjbHViJyByaWRlcyBhcmUgc3VwcG9ydGVkLmApO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSaWRlVmFsaWRhdGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBzdGF0dXNDb2RlID0gNDAwO1xuICBlcnJvclR5cGUgPSAnUklERV9WQUxJREFUSU9OX0VSUk9SJztcbiAgXG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKGBSaWRlIHZhbGlkYXRpb24gZmFpbGVkOiAke21lc3NhZ2V9YCk7XG4gIH1cbn0iXX0=