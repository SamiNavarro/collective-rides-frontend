"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RideService = void 0;
const ride_1 = require("./ride");
const ride_2 = require("../../../../shared/types/ride");
const ride_errors_1 = require("./ride-errors");
class RideService {
    constructor(rideRepository) {
        this.rideRepository = rideRepository;
    }
    async createRide(request, createdBy, clubId) {
        // Validate Phase 2.3 constraints
        this.validatePhase23Constraints(request);
        // Validate business rules
        this.validateCreateRequest(request);
        const ride = ride_1.RideEntity.create(request, createdBy, clubId);
        await this.rideRepository.create(ride);
        return ride;
    }
    async getRide(rideId) {
        const ride = await this.rideRepository.findById(rideId);
        if (!ride) {
            throw new ride_errors_1.RideNotFoundError(rideId);
        }
        return ride;
    }
    async listClubRides(clubId, query) {
        return this.rideRepository.findByClubId(clubId, query);
    }
    async publishRide(rideId, publishedBy, request) {
        const ride = await this.getRide(rideId);
        ride.publish(publishedBy, request.audience, request.isPublic);
        await this.rideRepository.update(ride);
        return ride;
    }
    async updateRide(rideId, request) {
        const ride = await this.getRide(rideId);
        this.validateUpdateRequest(request);
        ride.update(request);
        await this.rideRepository.update(ride);
        return ride;
    }
    async cancelRide(rideId, request) {
        const ride = await this.getRide(rideId);
        ride.cancel(request.reason);
        await this.rideRepository.update(ride);
        return ride;
    }
    // Phase 2.5: Ride completion functionality
    async completeRide(rideId, clubId, completedBy, completionNotes) {
        const ride = await this.getRide(rideId);
        // Verify ride belongs to the specified club
        if (ride.clubId !== clubId) {
            throw new ride_errors_1.RideValidationError('Ride does not belong to the specified club');
        }
        // Complete the ride
        ride.complete(completedBy, completionNotes);
        await this.rideRepository.update(ride);
        // Generate ride summary for future analytics
        await this.generateRideSummary(ride);
        return ride;
    }
    async startRide(rideId, clubId, startedBy) {
        const ride = await this.getRide(rideId);
        // Verify ride belongs to the specified club
        if (ride.clubId !== clubId) {
            throw new ride_errors_1.RideValidationError('Ride does not belong to the specified club');
        }
        ride.start(startedBy);
        await this.rideRepository.update(ride);
        return ride;
    }
    async getRideSummary(rideId, clubId) {
        const ride = await this.getRide(rideId);
        // Verify ride belongs to the specified club
        if (ride.clubId !== clubId) {
            throw new ride_errors_1.RideValidationError('Ride does not belong to the specified club');
        }
        // Only completed rides have summaries
        if (ride.status !== ride_2.RideStatus.COMPLETED) {
            return null;
        }
        return this.rideRepository.findRideSummary(rideId);
    }
    async generateRideSummary(ride) {
        // Get all participants for this ride
        const participations = await this.rideRepository.findParticipations(ride.rideId);
        const summary = {
            rideId: ride.rideId,
            clubId: ride.clubId,
            completedAt: ride.toJSON().completedAt,
            participantsPlanned: participations.length,
            participantsAttended: participations.filter(p => p.attendanceStatus === 'attended').length,
            participantsNoShow: participations.filter(p => p.attendanceStatus === 'no_show').length,
            participantsWithStrava: participations.filter(p => p.evidence?.type === 'strava').length,
            participantsWithManualEvidence: participations.filter(p => p.evidence?.type === 'manual').length,
            lastUpdatedAt: new Date().toISOString()
        };
        // Calculate aggregated metrics from Strava evidence
        const stravaParticipations = participations.filter(p => p.evidence?.type === 'strava');
        if (stravaParticipations.length > 0) {
            const metrics = stravaParticipations.reduce((acc, p) => {
                const evidence = p.evidence.metricsSnapshot;
                if (evidence) {
                    acc.totalDistance += evidence.distanceMeters || 0;
                    acc.totalElevation += evidence.elevationGainMeters || 0;
                    acc.totalTime += evidence.movingTimeSeconds || 0;
                    acc.count++;
                }
                return acc;
            }, { totalDistance: 0, totalElevation: 0, totalTime: 0, count: 0 });
            if (metrics.count > 0) {
                summary.aggregatedMetrics = {
                    totalDistanceMeters: metrics.totalDistance,
                    totalElevationGainMeters: metrics.totalElevation,
                    averageSpeedMps: metrics.totalTime > 0 ? metrics.totalDistance / metrics.totalTime : 0
                };
            }
        }
        await this.rideRepository.saveRideSummary(summary);
    }
    validatePhase23Constraints(request) {
        // Phase 2.3 only supports club rides
        // This validation ensures we don't accidentally create non-club rides
        if (request.route?.provider && request.route.provider !== 'internal') {
            throw new ride_errors_1.RideValidationError('External route providers not supported in Phase 2.3');
        }
    }
    validateCreateRequest(request) {
        if (!request.title?.trim()) {
            throw new ride_errors_1.RideValidationError('Title is required');
        }
        if (!request.description?.trim()) {
            throw new ride_errors_1.RideValidationError('Description is required');
        }
        if (!request.startDateTime) {
            throw new ride_errors_1.RideValidationError('Start date and time is required');
        }
        const startDate = new Date(request.startDateTime);
        if (startDate <= new Date()) {
            throw new ride_errors_1.RideValidationError('Start date must be in the future');
        }
        if (request.estimatedDuration <= 0) {
            throw new ride_errors_1.RideValidationError('Estimated duration must be positive');
        }
        if (request.maxParticipants !== undefined && request.maxParticipants < 1) {
            throw new ride_errors_1.RideValidationError('Maximum participants must be at least 1');
        }
        if (!request.meetingPoint?.name?.trim()) {
            throw new ride_errors_1.RideValidationError('Meeting point name is required');
        }
        if (!request.meetingPoint?.address?.trim()) {
            throw new ride_errors_1.RideValidationError('Meeting point address is required');
        }
    }
    validateUpdateRequest(request) {
        if (request.title !== undefined && !request.title.trim()) {
            throw new ride_errors_1.RideValidationError('Title cannot be empty');
        }
        if (request.description !== undefined && !request.description.trim()) {
            throw new ride_errors_1.RideValidationError('Description cannot be empty');
        }
        if (request.startDateTime !== undefined) {
            const startDate = new Date(request.startDateTime);
            if (startDate <= new Date()) {
                throw new ride_errors_1.RideValidationError('Start date must be in the future');
            }
        }
        if (request.estimatedDuration !== undefined && request.estimatedDuration <= 0) {
            throw new ride_errors_1.RideValidationError('Estimated duration must be positive');
        }
        if (request.maxParticipants !== undefined && request.maxParticipants < 1) {
            throw new ride_errors_1.RideValidationError('Maximum participants must be at least 1');
        }
    }
}
exports.RideService = RideService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmlkZS1zZXJ2aWNlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmlkZS1zZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLGlDQUFvQztBQUVwQyx3REFTdUM7QUFFdkMsK0NBSXVCO0FBRXZCLE1BQWEsV0FBVztJQUN0QixZQUFvQixjQUE4QjtRQUE5QixtQkFBYyxHQUFkLGNBQWMsQ0FBZ0I7SUFBRyxDQUFDO0lBRXRELEtBQUssQ0FBQyxVQUFVLENBQ2QsT0FBMEIsRUFDMUIsU0FBaUIsRUFDakIsTUFBYztRQUVkLGlDQUFpQztRQUNqQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFekMsMEJBQTBCO1FBQzFCLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUVwQyxNQUFNLElBQUksR0FBRyxpQkFBVSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzNELE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFdkMsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFjO1FBQzFCLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDeEQsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNULE1BQU0sSUFBSSwrQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUNyQztRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBYyxFQUFFLEtBQXFCO1FBQ3ZELE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxLQUFLLENBQUMsV0FBVyxDQUNmLE1BQWMsRUFDZCxXQUFtQixFQUNuQixPQUEyQjtRQUUzQixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFeEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsT0FBTyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDOUQsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2QyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxLQUFLLENBQUMsVUFBVSxDQUNkLE1BQWMsRUFDZCxPQUEwQjtRQUUxQixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFeEMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckIsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2QyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxLQUFLLENBQUMsVUFBVSxDQUNkLE1BQWMsRUFDZCxPQUEwQjtRQUUxQixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFeEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDNUIsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2QyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCwyQ0FBMkM7SUFDM0MsS0FBSyxDQUFDLFlBQVksQ0FDaEIsTUFBYyxFQUNkLE1BQWMsRUFDZCxXQUFtQixFQUNuQixlQUF3QjtRQUV4QixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFeEMsNENBQTRDO1FBQzVDLElBQUksSUFBSSxDQUFDLE1BQU0sS0FBSyxNQUFNLEVBQUU7WUFDMUIsTUFBTSxJQUFJLGlDQUFtQixDQUFDLDRDQUE0QyxDQUFDLENBQUM7U0FDN0U7UUFFRCxvQkFBb0I7UUFDcEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFDNUMsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2Qyw2Q0FBNkM7UUFDN0MsTUFBTSxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFckMsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsS0FBSyxDQUFDLFNBQVMsQ0FDYixNQUFjLEVBQ2QsTUFBYyxFQUNkLFNBQWlCO1FBRWpCLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUV4Qyw0Q0FBNEM7UUFDNUMsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLE1BQU0sRUFBRTtZQUMxQixNQUFNLElBQUksaUNBQW1CLENBQUMsNENBQTRDLENBQUMsQ0FBQztTQUM3RTtRQUVELElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEIsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2QyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQWMsRUFBRSxNQUFjO1FBQ2pELE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUV4Qyw0Q0FBNEM7UUFDNUMsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLE1BQU0sRUFBRTtZQUMxQixNQUFNLElBQUksaUNBQW1CLENBQUMsNENBQTRDLENBQUMsQ0FBQztTQUM3RTtRQUVELHNDQUFzQztRQUN0QyxJQUFJLElBQUksQ0FBQyxNQUFNLEtBQUssaUJBQVUsQ0FBQyxTQUFTLEVBQUU7WUFDeEMsT0FBTyxJQUFJLENBQUM7U0FDYjtRQUVELE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDckQsQ0FBQztJQUVPLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxJQUFnQjtRQUNoRCxxQ0FBcUM7UUFDckMsTUFBTSxjQUFjLEdBQUcsTUFBTSxJQUFJLENBQUMsY0FBYyxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVqRixNQUFNLE9BQU8sR0FBZ0I7WUFDM0IsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNO1lBQ25CLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTTtZQUNuQixXQUFXLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLFdBQVk7WUFDdkMsbUJBQW1CLEVBQUUsY0FBYyxDQUFDLE1BQU07WUFDMUMsb0JBQW9CLEVBQUUsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsS0FBSyxVQUFVLENBQUMsQ0FBQyxNQUFNO1lBQzFGLGtCQUFrQixFQUFFLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLEtBQUssU0FBUyxDQUFDLENBQUMsTUFBTTtZQUN2RixzQkFBc0IsRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsTUFBTTtZQUN4Riw4QkFBOEIsRUFBRSxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsTUFBTTtZQUNoRyxhQUFhLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDeEMsQ0FBQztRQUVGLG9EQUFvRDtRQUNwRCxNQUFNLG9CQUFvQixHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQztRQUN2RixJQUFJLG9CQUFvQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDbkMsTUFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNyRCxNQUFNLFFBQVEsR0FBRyxDQUFDLENBQUMsUUFBUyxDQUFDLGVBQWUsQ0FBQztnQkFDN0MsSUFBSSxRQUFRLEVBQUU7b0JBQ1osR0FBRyxDQUFDLGFBQWEsSUFBSSxRQUFRLENBQUMsY0FBYyxJQUFJLENBQUMsQ0FBQztvQkFDbEQsR0FBRyxDQUFDLGNBQWMsSUFBSSxRQUFRLENBQUMsbUJBQW1CLElBQUksQ0FBQyxDQUFDO29CQUN4RCxHQUFHLENBQUMsU0FBUyxJQUFJLFFBQVEsQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLENBQUM7b0JBQ2pELEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztpQkFDYjtnQkFDRCxPQUFPLEdBQUcsQ0FBQztZQUNiLENBQUMsRUFBRSxFQUFFLGFBQWEsRUFBRSxDQUFDLEVBQUUsY0FBYyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBRXBFLElBQUksT0FBTyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUU7Z0JBQ3JCLE9BQU8sQ0FBQyxpQkFBaUIsR0FBRztvQkFDMUIsbUJBQW1CLEVBQUUsT0FBTyxDQUFDLGFBQWE7b0JBQzFDLHdCQUF3QixFQUFFLE9BQU8sQ0FBQyxjQUFjO29CQUNoRCxlQUFlLEVBQUUsT0FBTyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDdkYsQ0FBQzthQUNIO1NBQ0Y7UUFFRCxNQUFNLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3JELENBQUM7SUFFTywwQkFBMEIsQ0FBQyxPQUEwQjtRQUMzRCxxQ0FBcUM7UUFDckMsc0VBQXNFO1FBQ3RFLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxRQUFRLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEtBQUssVUFBVSxFQUFFO1lBQ3BFLE1BQU0sSUFBSSxpQ0FBbUIsQ0FBQyxxREFBcUQsQ0FBQyxDQUFDO1NBQ3RGO0lBQ0gsQ0FBQztJQUVPLHFCQUFxQixDQUFDLE9BQTBCO1FBQ3RELElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxFQUFFO1lBQzFCLE1BQU0sSUFBSSxpQ0FBbUIsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO1NBQ3BEO1FBRUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDaEMsTUFBTSxJQUFJLGlDQUFtQixDQUFDLHlCQUF5QixDQUFDLENBQUM7U0FDMUQ7UUFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRTtZQUMxQixNQUFNLElBQUksaUNBQW1CLENBQUMsaUNBQWlDLENBQUMsQ0FBQztTQUNsRTtRQUVELE1BQU0sU0FBUyxHQUFHLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNsRCxJQUFJLFNBQVMsSUFBSSxJQUFJLElBQUksRUFBRSxFQUFFO1lBQzNCLE1BQU0sSUFBSSxpQ0FBbUIsQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDO1NBQ25FO1FBRUQsSUFBSSxPQUFPLENBQUMsaUJBQWlCLElBQUksQ0FBQyxFQUFFO1lBQ2xDLE1BQU0sSUFBSSxpQ0FBbUIsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1NBQ3RFO1FBRUQsSUFBSSxPQUFPLENBQUMsZUFBZSxLQUFLLFNBQVMsSUFBSSxPQUFPLENBQUMsZUFBZSxHQUFHLENBQUMsRUFBRTtZQUN4RSxNQUFNLElBQUksaUNBQW1CLENBQUMseUNBQXlDLENBQUMsQ0FBQztTQUMxRTtRQUVELElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUN2QyxNQUFNLElBQUksaUNBQW1CLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztTQUNqRTtRQUVELElBQUksQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUMxQyxNQUFNLElBQUksaUNBQW1CLENBQUMsbUNBQW1DLENBQUMsQ0FBQztTQUNwRTtJQUNILENBQUM7SUFFTyxxQkFBcUIsQ0FBQyxPQUEwQjtRQUN0RCxJQUFJLE9BQU8sQ0FBQyxLQUFLLEtBQUssU0FBUyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsRUFBRTtZQUN4RCxNQUFNLElBQUksaUNBQW1CLENBQUMsdUJBQXVCLENBQUMsQ0FBQztTQUN4RDtRQUVELElBQUksT0FBTyxDQUFDLFdBQVcsS0FBSyxTQUFTLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3BFLE1BQU0sSUFBSSxpQ0FBbUIsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1NBQzlEO1FBRUQsSUFBSSxPQUFPLENBQUMsYUFBYSxLQUFLLFNBQVMsRUFBRTtZQUN2QyxNQUFNLFNBQVMsR0FBRyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDbEQsSUFBSSxTQUFTLElBQUksSUFBSSxJQUFJLEVBQUUsRUFBRTtnQkFDM0IsTUFBTSxJQUFJLGlDQUFtQixDQUFDLGtDQUFrQyxDQUFDLENBQUM7YUFDbkU7U0FDRjtRQUVELElBQUksT0FBTyxDQUFDLGlCQUFpQixLQUFLLFNBQVMsSUFBSSxPQUFPLENBQUMsaUJBQWlCLElBQUksQ0FBQyxFQUFFO1lBQzdFLE1BQU0sSUFBSSxpQ0FBbUIsQ0FBQyxxQ0FBcUMsQ0FBQyxDQUFDO1NBQ3RFO1FBRUQsSUFBSSxPQUFPLENBQUMsZUFBZSxLQUFLLFNBQVMsSUFBSSxPQUFPLENBQUMsZUFBZSxHQUFHLENBQUMsRUFBRTtZQUN4RSxNQUFNLElBQUksaUNBQW1CLENBQUMseUNBQXlDLENBQUMsQ0FBQztTQUMxRTtJQUNILENBQUM7Q0FDRjtBQTdPRCxrQ0E2T0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBSaWRlRW50aXR5IH0gZnJvbSAnLi9yaWRlJztcbmltcG9ydCB7IFJpZGVSZXBvc2l0b3J5LCBQYWdpbmF0ZWRSaWRlcyB9IGZyb20gJy4vcmlkZS1yZXBvc2l0b3J5JztcbmltcG9ydCB7IFxuICBDcmVhdGVSaWRlUmVxdWVzdCwgXG4gIFVwZGF0ZVJpZGVSZXF1ZXN0LCBcbiAgUHVibGlzaFJpZGVSZXF1ZXN0LFxuICBDYW5jZWxSaWRlUmVxdWVzdCxcbiAgQ29tcGxldGVSaWRlUmVxdWVzdCxcbiAgTGlzdFJpZGVzUXVlcnksXG4gIFJpZGVTY29wZSxcbiAgUmlkZVN0YXR1cyBcbn0gZnJvbSAnLi4vLi4vLi4vLi4vc2hhcmVkL3R5cGVzL3JpZGUnO1xuaW1wb3J0IHsgUmlkZVN1bW1hcnkgfSBmcm9tICcuLi8uLi8uLi8uLi9zaGFyZWQvdHlwZXMvc3RyYXZhJztcbmltcG9ydCB7IFxuICBSaWRlTm90Rm91bmRFcnJvciwgXG4gIEludmFsaWRSaWRlU2NvcGVFcnJvciwgXG4gIFJpZGVWYWxpZGF0aW9uRXJyb3IgXG59IGZyb20gJy4vcmlkZS1lcnJvcnMnO1xuXG5leHBvcnQgY2xhc3MgUmlkZVNlcnZpY2Uge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJpZGVSZXBvc2l0b3J5OiBSaWRlUmVwb3NpdG9yeSkge31cblxuICBhc3luYyBjcmVhdGVSaWRlKFxuICAgIHJlcXVlc3Q6IENyZWF0ZVJpZGVSZXF1ZXN0LCBcbiAgICBjcmVhdGVkQnk6IHN0cmluZywgXG4gICAgY2x1YklkOiBzdHJpbmdcbiAgKTogUHJvbWlzZTxSaWRlRW50aXR5PiB7XG4gICAgLy8gVmFsaWRhdGUgUGhhc2UgMi4zIGNvbnN0cmFpbnRzXG4gICAgdGhpcy52YWxpZGF0ZVBoYXNlMjNDb25zdHJhaW50cyhyZXF1ZXN0KTtcbiAgICBcbiAgICAvLyBWYWxpZGF0ZSBidXNpbmVzcyBydWxlc1xuICAgIHRoaXMudmFsaWRhdGVDcmVhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuICAgIFxuICAgIGNvbnN0IHJpZGUgPSBSaWRlRW50aXR5LmNyZWF0ZShyZXF1ZXN0LCBjcmVhdGVkQnksIGNsdWJJZCk7XG4gICAgYXdhaXQgdGhpcy5yaWRlUmVwb3NpdG9yeS5jcmVhdGUocmlkZSk7XG4gICAgXG4gICAgcmV0dXJuIHJpZGU7XG4gIH1cblxuICBhc3luYyBnZXRSaWRlKHJpZGVJZDogc3RyaW5nKTogUHJvbWlzZTxSaWRlRW50aXR5PiB7XG4gICAgY29uc3QgcmlkZSA9IGF3YWl0IHRoaXMucmlkZVJlcG9zaXRvcnkuZmluZEJ5SWQocmlkZUlkKTtcbiAgICBpZiAoIXJpZGUpIHtcbiAgICAgIHRocm93IG5ldyBSaWRlTm90Rm91bmRFcnJvcihyaWRlSWQpO1xuICAgIH1cbiAgICByZXR1cm4gcmlkZTtcbiAgfVxuXG4gIGFzeW5jIGxpc3RDbHViUmlkZXMoY2x1YklkOiBzdHJpbmcsIHF1ZXJ5OiBMaXN0UmlkZXNRdWVyeSk6IFByb21pc2U8UGFnaW5hdGVkUmlkZXM+IHtcbiAgICByZXR1cm4gdGhpcy5yaWRlUmVwb3NpdG9yeS5maW5kQnlDbHViSWQoY2x1YklkLCBxdWVyeSk7XG4gIH1cblxuICBhc3luYyBwdWJsaXNoUmlkZShcbiAgICByaWRlSWQ6IHN0cmluZywgXG4gICAgcHVibGlzaGVkQnk6IHN0cmluZywgXG4gICAgcmVxdWVzdDogUHVibGlzaFJpZGVSZXF1ZXN0XG4gICk6IFByb21pc2U8UmlkZUVudGl0eT4ge1xuICAgIGNvbnN0IHJpZGUgPSBhd2FpdCB0aGlzLmdldFJpZGUocmlkZUlkKTtcbiAgICBcbiAgICByaWRlLnB1Ymxpc2gocHVibGlzaGVkQnksIHJlcXVlc3QuYXVkaWVuY2UsIHJlcXVlc3QuaXNQdWJsaWMpO1xuICAgIGF3YWl0IHRoaXMucmlkZVJlcG9zaXRvcnkudXBkYXRlKHJpZGUpO1xuICAgIFxuICAgIHJldHVybiByaWRlO1xuICB9XG5cbiAgYXN5bmMgdXBkYXRlUmlkZShcbiAgICByaWRlSWQ6IHN0cmluZywgXG4gICAgcmVxdWVzdDogVXBkYXRlUmlkZVJlcXVlc3RcbiAgKTogUHJvbWlzZTxSaWRlRW50aXR5PiB7XG4gICAgY29uc3QgcmlkZSA9IGF3YWl0IHRoaXMuZ2V0UmlkZShyaWRlSWQpO1xuICAgIFxuICAgIHRoaXMudmFsaWRhdGVVcGRhdGVSZXF1ZXN0KHJlcXVlc3QpO1xuICAgIHJpZGUudXBkYXRlKHJlcXVlc3QpO1xuICAgIGF3YWl0IHRoaXMucmlkZVJlcG9zaXRvcnkudXBkYXRlKHJpZGUpO1xuICAgIFxuICAgIHJldHVybiByaWRlO1xuICB9XG5cbiAgYXN5bmMgY2FuY2VsUmlkZShcbiAgICByaWRlSWQ6IHN0cmluZywgXG4gICAgcmVxdWVzdDogQ2FuY2VsUmlkZVJlcXVlc3RcbiAgKTogUHJvbWlzZTxSaWRlRW50aXR5PiB7XG4gICAgY29uc3QgcmlkZSA9IGF3YWl0IHRoaXMuZ2V0UmlkZShyaWRlSWQpO1xuICAgIFxuICAgIHJpZGUuY2FuY2VsKHJlcXVlc3QucmVhc29uKTtcbiAgICBhd2FpdCB0aGlzLnJpZGVSZXBvc2l0b3J5LnVwZGF0ZShyaWRlKTtcbiAgICBcbiAgICByZXR1cm4gcmlkZTtcbiAgfVxuXG4gIC8vIFBoYXNlIDIuNTogUmlkZSBjb21wbGV0aW9uIGZ1bmN0aW9uYWxpdHlcbiAgYXN5bmMgY29tcGxldGVSaWRlKFxuICAgIHJpZGVJZDogc3RyaW5nLFxuICAgIGNsdWJJZDogc3RyaW5nLFxuICAgIGNvbXBsZXRlZEJ5OiBzdHJpbmcsXG4gICAgY29tcGxldGlvbk5vdGVzPzogc3RyaW5nXG4gICk6IFByb21pc2U8UmlkZUVudGl0eT4ge1xuICAgIGNvbnN0IHJpZGUgPSBhd2FpdCB0aGlzLmdldFJpZGUocmlkZUlkKTtcbiAgICBcbiAgICAvLyBWZXJpZnkgcmlkZSBiZWxvbmdzIHRvIHRoZSBzcGVjaWZpZWQgY2x1YlxuICAgIGlmIChyaWRlLmNsdWJJZCAhPT0gY2x1YklkKSB7XG4gICAgICB0aHJvdyBuZXcgUmlkZVZhbGlkYXRpb25FcnJvcignUmlkZSBkb2VzIG5vdCBiZWxvbmcgdG8gdGhlIHNwZWNpZmllZCBjbHViJyk7XG4gICAgfVxuICAgIFxuICAgIC8vIENvbXBsZXRlIHRoZSByaWRlXG4gICAgcmlkZS5jb21wbGV0ZShjb21wbGV0ZWRCeSwgY29tcGxldGlvbk5vdGVzKTtcbiAgICBhd2FpdCB0aGlzLnJpZGVSZXBvc2l0b3J5LnVwZGF0ZShyaWRlKTtcbiAgICBcbiAgICAvLyBHZW5lcmF0ZSByaWRlIHN1bW1hcnkgZm9yIGZ1dHVyZSBhbmFseXRpY3NcbiAgICBhd2FpdCB0aGlzLmdlbmVyYXRlUmlkZVN1bW1hcnkocmlkZSk7XG4gICAgXG4gICAgcmV0dXJuIHJpZGU7XG4gIH1cblxuICBhc3luYyBzdGFydFJpZGUoXG4gICAgcmlkZUlkOiBzdHJpbmcsXG4gICAgY2x1YklkOiBzdHJpbmcsXG4gICAgc3RhcnRlZEJ5OiBzdHJpbmdcbiAgKTogUHJvbWlzZTxSaWRlRW50aXR5PiB7XG4gICAgY29uc3QgcmlkZSA9IGF3YWl0IHRoaXMuZ2V0UmlkZShyaWRlSWQpO1xuICAgIFxuICAgIC8vIFZlcmlmeSByaWRlIGJlbG9uZ3MgdG8gdGhlIHNwZWNpZmllZCBjbHViXG4gICAgaWYgKHJpZGUuY2x1YklkICE9PSBjbHViSWQpIHtcbiAgICAgIHRocm93IG5ldyBSaWRlVmFsaWRhdGlvbkVycm9yKCdSaWRlIGRvZXMgbm90IGJlbG9uZyB0byB0aGUgc3BlY2lmaWVkIGNsdWInKTtcbiAgICB9XG4gICAgXG4gICAgcmlkZS5zdGFydChzdGFydGVkQnkpO1xuICAgIGF3YWl0IHRoaXMucmlkZVJlcG9zaXRvcnkudXBkYXRlKHJpZGUpO1xuICAgIFxuICAgIHJldHVybiByaWRlO1xuICB9XG5cbiAgYXN5bmMgZ2V0UmlkZVN1bW1hcnkocmlkZUlkOiBzdHJpbmcsIGNsdWJJZDogc3RyaW5nKTogUHJvbWlzZTxSaWRlU3VtbWFyeSB8IG51bGw+IHtcbiAgICBjb25zdCByaWRlID0gYXdhaXQgdGhpcy5nZXRSaWRlKHJpZGVJZCk7XG4gICAgXG4gICAgLy8gVmVyaWZ5IHJpZGUgYmVsb25ncyB0byB0aGUgc3BlY2lmaWVkIGNsdWJcbiAgICBpZiAocmlkZS5jbHViSWQgIT09IGNsdWJJZCkge1xuICAgICAgdGhyb3cgbmV3IFJpZGVWYWxpZGF0aW9uRXJyb3IoJ1JpZGUgZG9lcyBub3QgYmVsb25nIHRvIHRoZSBzcGVjaWZpZWQgY2x1YicpO1xuICAgIH1cbiAgICBcbiAgICAvLyBPbmx5IGNvbXBsZXRlZCByaWRlcyBoYXZlIHN1bW1hcmllc1xuICAgIGlmIChyaWRlLnN0YXR1cyAhPT0gUmlkZVN0YXR1cy5DT01QTEVURUQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gdGhpcy5yaWRlUmVwb3NpdG9yeS5maW5kUmlkZVN1bW1hcnkocmlkZUlkKTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZ2VuZXJhdGVSaWRlU3VtbWFyeShyaWRlOiBSaWRlRW50aXR5KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgLy8gR2V0IGFsbCBwYXJ0aWNpcGFudHMgZm9yIHRoaXMgcmlkZVxuICAgIGNvbnN0IHBhcnRpY2lwYXRpb25zID0gYXdhaXQgdGhpcy5yaWRlUmVwb3NpdG9yeS5maW5kUGFydGljaXBhdGlvbnMocmlkZS5yaWRlSWQpO1xuICAgIFxuICAgIGNvbnN0IHN1bW1hcnk6IFJpZGVTdW1tYXJ5ID0ge1xuICAgICAgcmlkZUlkOiByaWRlLnJpZGVJZCxcbiAgICAgIGNsdWJJZDogcmlkZS5jbHViSWQsXG4gICAgICBjb21wbGV0ZWRBdDogcmlkZS50b0pTT04oKS5jb21wbGV0ZWRBdCEsXG4gICAgICBwYXJ0aWNpcGFudHNQbGFubmVkOiBwYXJ0aWNpcGF0aW9ucy5sZW5ndGgsXG4gICAgICBwYXJ0aWNpcGFudHNBdHRlbmRlZDogcGFydGljaXBhdGlvbnMuZmlsdGVyKHAgPT4gcC5hdHRlbmRhbmNlU3RhdHVzID09PSAnYXR0ZW5kZWQnKS5sZW5ndGgsXG4gICAgICBwYXJ0aWNpcGFudHNOb1Nob3c6IHBhcnRpY2lwYXRpb25zLmZpbHRlcihwID0+IHAuYXR0ZW5kYW5jZVN0YXR1cyA9PT0gJ25vX3Nob3cnKS5sZW5ndGgsXG4gICAgICBwYXJ0aWNpcGFudHNXaXRoU3RyYXZhOiBwYXJ0aWNpcGF0aW9ucy5maWx0ZXIocCA9PiBwLmV2aWRlbmNlPy50eXBlID09PSAnc3RyYXZhJykubGVuZ3RoLFxuICAgICAgcGFydGljaXBhbnRzV2l0aE1hbnVhbEV2aWRlbmNlOiBwYXJ0aWNpcGF0aW9ucy5maWx0ZXIocCA9PiBwLmV2aWRlbmNlPy50eXBlID09PSAnbWFudWFsJykubGVuZ3RoLFxuICAgICAgbGFzdFVwZGF0ZWRBdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpXG4gICAgfTtcbiAgICBcbiAgICAvLyBDYWxjdWxhdGUgYWdncmVnYXRlZCBtZXRyaWNzIGZyb20gU3RyYXZhIGV2aWRlbmNlXG4gICAgY29uc3Qgc3RyYXZhUGFydGljaXBhdGlvbnMgPSBwYXJ0aWNpcGF0aW9ucy5maWx0ZXIocCA9PiBwLmV2aWRlbmNlPy50eXBlID09PSAnc3RyYXZhJyk7XG4gICAgaWYgKHN0cmF2YVBhcnRpY2lwYXRpb25zLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IG1ldHJpY3MgPSBzdHJhdmFQYXJ0aWNpcGF0aW9ucy5yZWR1Y2UoKGFjYywgcCkgPT4ge1xuICAgICAgICBjb25zdCBldmlkZW5jZSA9IHAuZXZpZGVuY2UhLm1ldHJpY3NTbmFwc2hvdDtcbiAgICAgICAgaWYgKGV2aWRlbmNlKSB7XG4gICAgICAgICAgYWNjLnRvdGFsRGlzdGFuY2UgKz0gZXZpZGVuY2UuZGlzdGFuY2VNZXRlcnMgfHwgMDtcbiAgICAgICAgICBhY2MudG90YWxFbGV2YXRpb24gKz0gZXZpZGVuY2UuZWxldmF0aW9uR2Fpbk1ldGVycyB8fCAwO1xuICAgICAgICAgIGFjYy50b3RhbFRpbWUgKz0gZXZpZGVuY2UubW92aW5nVGltZVNlY29uZHMgfHwgMDtcbiAgICAgICAgICBhY2MuY291bnQrKztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSwgeyB0b3RhbERpc3RhbmNlOiAwLCB0b3RhbEVsZXZhdGlvbjogMCwgdG90YWxUaW1lOiAwLCBjb3VudDogMCB9KTtcbiAgICAgIFxuICAgICAgaWYgKG1ldHJpY3MuY291bnQgPiAwKSB7XG4gICAgICAgIHN1bW1hcnkuYWdncmVnYXRlZE1ldHJpY3MgPSB7XG4gICAgICAgICAgdG90YWxEaXN0YW5jZU1ldGVyczogbWV0cmljcy50b3RhbERpc3RhbmNlLFxuICAgICAgICAgIHRvdGFsRWxldmF0aW9uR2Fpbk1ldGVyczogbWV0cmljcy50b3RhbEVsZXZhdGlvbixcbiAgICAgICAgICBhdmVyYWdlU3BlZWRNcHM6IG1ldHJpY3MudG90YWxUaW1lID4gMCA/IG1ldHJpY3MudG90YWxEaXN0YW5jZSAvIG1ldHJpY3MudG90YWxUaW1lIDogMFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICBhd2FpdCB0aGlzLnJpZGVSZXBvc2l0b3J5LnNhdmVSaWRlU3VtbWFyeShzdW1tYXJ5KTtcbiAgfVxuXG4gIHByaXZhdGUgdmFsaWRhdGVQaGFzZTIzQ29uc3RyYWludHMocmVxdWVzdDogQ3JlYXRlUmlkZVJlcXVlc3QpOiB2b2lkIHtcbiAgICAvLyBQaGFzZSAyLjMgb25seSBzdXBwb3J0cyBjbHViIHJpZGVzXG4gICAgLy8gVGhpcyB2YWxpZGF0aW9uIGVuc3VyZXMgd2UgZG9uJ3QgYWNjaWRlbnRhbGx5IGNyZWF0ZSBub24tY2x1YiByaWRlc1xuICAgIGlmIChyZXF1ZXN0LnJvdXRlPy5wcm92aWRlciAmJiByZXF1ZXN0LnJvdXRlLnByb3ZpZGVyICE9PSAnaW50ZXJuYWwnKSB7XG4gICAgICB0aHJvdyBuZXcgUmlkZVZhbGlkYXRpb25FcnJvcignRXh0ZXJuYWwgcm91dGUgcHJvdmlkZXJzIG5vdCBzdXBwb3J0ZWQgaW4gUGhhc2UgMi4zJyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB2YWxpZGF0ZUNyZWF0ZVJlcXVlc3QocmVxdWVzdDogQ3JlYXRlUmlkZVJlcXVlc3QpOiB2b2lkIHtcbiAgICBpZiAoIXJlcXVlc3QudGl0bGU/LnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IFJpZGVWYWxpZGF0aW9uRXJyb3IoJ1RpdGxlIGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuICAgIFxuICAgIGlmICghcmVxdWVzdC5kZXNjcmlwdGlvbj8udHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgUmlkZVZhbGlkYXRpb25FcnJvcignRGVzY3JpcHRpb24gaXMgcmVxdWlyZWQnKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKCFyZXF1ZXN0LnN0YXJ0RGF0ZVRpbWUpIHtcbiAgICAgIHRocm93IG5ldyBSaWRlVmFsaWRhdGlvbkVycm9yKCdTdGFydCBkYXRlIGFuZCB0aW1lIGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IHN0YXJ0RGF0ZSA9IG5ldyBEYXRlKHJlcXVlc3Quc3RhcnREYXRlVGltZSk7XG4gICAgaWYgKHN0YXJ0RGF0ZSA8PSBuZXcgRGF0ZSgpKSB7XG4gICAgICB0aHJvdyBuZXcgUmlkZVZhbGlkYXRpb25FcnJvcignU3RhcnQgZGF0ZSBtdXN0IGJlIGluIHRoZSBmdXR1cmUnKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHJlcXVlc3QuZXN0aW1hdGVkRHVyYXRpb24gPD0gMCkge1xuICAgICAgdGhyb3cgbmV3IFJpZGVWYWxpZGF0aW9uRXJyb3IoJ0VzdGltYXRlZCBkdXJhdGlvbiBtdXN0IGJlIHBvc2l0aXZlJyk7XG4gICAgfVxuICAgIFxuICAgIGlmIChyZXF1ZXN0Lm1heFBhcnRpY2lwYW50cyAhPT0gdW5kZWZpbmVkICYmIHJlcXVlc3QubWF4UGFydGljaXBhbnRzIDwgMSkge1xuICAgICAgdGhyb3cgbmV3IFJpZGVWYWxpZGF0aW9uRXJyb3IoJ01heGltdW0gcGFydGljaXBhbnRzIG11c3QgYmUgYXQgbGVhc3QgMScpO1xuICAgIH1cbiAgICBcbiAgICBpZiAoIXJlcXVlc3QubWVldGluZ1BvaW50Py5uYW1lPy50cmltKCkpIHtcbiAgICAgIHRocm93IG5ldyBSaWRlVmFsaWRhdGlvbkVycm9yKCdNZWV0aW5nIHBvaW50IG5hbWUgaXMgcmVxdWlyZWQnKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKCFyZXF1ZXN0Lm1lZXRpbmdQb2ludD8uYWRkcmVzcz8udHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgUmlkZVZhbGlkYXRpb25FcnJvcignTWVldGluZyBwb2ludCBhZGRyZXNzIGlzIHJlcXVpcmVkJyk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSB2YWxpZGF0ZVVwZGF0ZVJlcXVlc3QocmVxdWVzdDogVXBkYXRlUmlkZVJlcXVlc3QpOiB2b2lkIHtcbiAgICBpZiAocmVxdWVzdC50aXRsZSAhPT0gdW5kZWZpbmVkICYmICFyZXF1ZXN0LnRpdGxlLnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IFJpZGVWYWxpZGF0aW9uRXJyb3IoJ1RpdGxlIGNhbm5vdCBiZSBlbXB0eScpO1xuICAgIH1cbiAgICBcbiAgICBpZiAocmVxdWVzdC5kZXNjcmlwdGlvbiAhPT0gdW5kZWZpbmVkICYmICFyZXF1ZXN0LmRlc2NyaXB0aW9uLnRyaW0oKSkge1xuICAgICAgdGhyb3cgbmV3IFJpZGVWYWxpZGF0aW9uRXJyb3IoJ0Rlc2NyaXB0aW9uIGNhbm5vdCBiZSBlbXB0eScpO1xuICAgIH1cbiAgICBcbiAgICBpZiAocmVxdWVzdC5zdGFydERhdGVUaW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHN0YXJ0RGF0ZSA9IG5ldyBEYXRlKHJlcXVlc3Quc3RhcnREYXRlVGltZSk7XG4gICAgICBpZiAoc3RhcnREYXRlIDw9IG5ldyBEYXRlKCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFJpZGVWYWxpZGF0aW9uRXJyb3IoJ1N0YXJ0IGRhdGUgbXVzdCBiZSBpbiB0aGUgZnV0dXJlJyk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIGlmIChyZXF1ZXN0LmVzdGltYXRlZER1cmF0aW9uICE9PSB1bmRlZmluZWQgJiYgcmVxdWVzdC5lc3RpbWF0ZWREdXJhdGlvbiA8PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgUmlkZVZhbGlkYXRpb25FcnJvcignRXN0aW1hdGVkIGR1cmF0aW9uIG11c3QgYmUgcG9zaXRpdmUnKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKHJlcXVlc3QubWF4UGFydGljaXBhbnRzICE9PSB1bmRlZmluZWQgJiYgcmVxdWVzdC5tYXhQYXJ0aWNpcGFudHMgPCAxKSB7XG4gICAgICB0aHJvdyBuZXcgUmlkZVZhbGlkYXRpb25FcnJvcignTWF4aW11bSBwYXJ0aWNpcGFudHMgbXVzdCBiZSBhdCBsZWFzdCAxJyk7XG4gICAgfVxuICB9XG59Il19