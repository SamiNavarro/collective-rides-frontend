"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityMatcher = void 0;
const participation_1 = require("../../../../shared/types/participation");
class ActivityMatcher {
    constructor(config = ActivityMatcher.DEFAULT_CONFIG) {
        this.config = config;
    }
    /**
     * Primary matching strategy: Tag-based match
     * Looks for ride code in Strava activity title or description
     */
    matchByTag(activity, ride, rideCode) {
        // Note: In real implementation, we'd need the activity title/description
        // For now, we'll return a placeholder that assumes no tag match
        // This would be implemented when we have access to full Strava activity data
        return {
            matched: false,
            matchType: participation_1.MatchType.TAG,
            confidence: 0,
            reason: 'No ride tag found in activity title or description'
        };
    }
    /**
     * Fallback matching strategy: Time window + optional distance/location
     */
    matchByTimeWindow(activity, ride) {
        // Check if activity is a cycling activity
        if (!activity.isCyclingActivity()) {
            return {
                matched: false,
                matchType: participation_1.MatchType.TIME_WINDOW,
                confidence: 0,
                reason: 'Activity is not a cycling activity'
            };
        }
        // Check time window
        const timeWindow = {
            before: this.config.timeWindow.beforeMinutes,
            after: this.config.timeWindow.afterMinutes
        };
        if (!activity.isWithinTimeWindow(ride.startDateTime, timeWindow)) {
            return {
                matched: false,
                matchType: participation_1.MatchType.TIME_WINDOW,
                confidence: 0,
                reason: 'Activity outside time window'
            };
        }
        let confidence = 0.6; // Base confidence for time match
        // Check distance tolerance if planned distance exists
        if (ride.route?.distance) {
            const plannedDistanceMeters = ride.route.distance * 1000; // Convert km to meters
            if (!activity.isWithinDistanceTolerance(plannedDistanceMeters, this.config.distanceTolerancePercent)) {
                return {
                    matched: false,
                    matchType: participation_1.MatchType.TIME_WINDOW,
                    confidence: 0,
                    reason: 'Activity distance outside tolerance'
                };
            }
            confidence += 0.2; // Boost confidence for distance match
        }
        // TODO: Add location tolerance check when coordinates are available
        // if (this.config.locationToleranceKm && ride.meetingPoint.coordinates && activity.startLatLng) {
        //   const distance = this.calculateDistance(
        //     ride.meetingPoint.coordinates,
        //     { latitude: activity.startLatLng[0], longitude: activity.startLatLng[1] }
        //   );
        //   if (distance <= this.config.locationToleranceKm) {
        //     confidence += 0.2;
        //   }
        // }
        return {
            matched: true,
            matchType: participation_1.MatchType.TIME_WINDOW,
            confidence: Math.min(confidence, 1.0),
            reason: 'Matched by time window and distance'
        };
    }
    /**
     * Comprehensive matching: Try tag first, then time window
     */
    match(activity, ride, rideCode) {
        // 1. Try tag-based match first (highest confidence)
        const tagMatch = this.matchByTag(activity, ride, rideCode);
        if (tagMatch.matched) {
            return { ...tagMatch, confidence: 1.0 };
        }
        // 2. Fallback to time window match
        const timeMatch = this.matchByTimeWindow(activity, ride);
        return timeMatch;
    }
    /**
     * Generate a unique ride code for tagging
     */
    static generateRideCode(rideId) {
        // Generate a short, unique code from ride ID
        const hash = rideId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
        }, 0);
        const code = Math.abs(hash).toString(36).toUpperCase().substring(0, 6);
        return `RIDE-${code}`;
    }
    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    calculateDistance(coord1, coord2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRadians(coord2.latitude - coord1.latitude);
        const dLon = this.toRadians(coord2.longitude - coord1.longitude);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
}
ActivityMatcher.DEFAULT_CONFIG = {
    timeWindow: {
        beforeMinutes: 60,
        afterMinutes: 240
    },
    distanceTolerancePercent: 25
};
exports.ActivityMatcher = ActivityMatcher;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aXZpdHktbWF0Y2hlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFjdGl2aXR5LW1hdGNoZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBRUEsMEVBQW1FO0FBa0JuRSxNQUFhLGVBQWU7SUFTMUIsWUFBb0IsU0FBeUIsZUFBZSxDQUFDLGNBQWM7UUFBdkQsV0FBTSxHQUFOLE1BQU0sQ0FBaUQ7SUFBRyxDQUFDO0lBRS9FOzs7T0FHRztJQUNILFVBQVUsQ0FBQyxRQUE4QixFQUFFLElBQVUsRUFBRSxRQUFnQjtRQUNyRSx5RUFBeUU7UUFDekUsZ0VBQWdFO1FBQ2hFLDZFQUE2RTtRQUU3RSxPQUFPO1lBQ0wsT0FBTyxFQUFFLEtBQUs7WUFDZCxTQUFTLEVBQUUseUJBQVMsQ0FBQyxHQUFHO1lBQ3hCLFVBQVUsRUFBRSxDQUFDO1lBQ2IsTUFBTSxFQUFFLG9EQUFvRDtTQUM3RCxDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0gsaUJBQWlCLENBQUMsUUFBOEIsRUFBRSxJQUFVO1FBQzFELDBDQUEwQztRQUMxQyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixFQUFFLEVBQUU7WUFDakMsT0FBTztnQkFDTCxPQUFPLEVBQUUsS0FBSztnQkFDZCxTQUFTLEVBQUUseUJBQVMsQ0FBQyxXQUFXO2dCQUNoQyxVQUFVLEVBQUUsQ0FBQztnQkFDYixNQUFNLEVBQUUsb0NBQW9DO2FBQzdDLENBQUM7U0FDSDtRQUVELG9CQUFvQjtRQUNwQixNQUFNLFVBQVUsR0FBRztZQUNqQixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsYUFBYTtZQUM1QyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsWUFBWTtTQUMzQyxDQUFDO1FBRUYsSUFBSSxDQUFDLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFVBQVUsQ0FBQyxFQUFFO1lBQ2hFLE9BQU87Z0JBQ0wsT0FB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fSBmcm9tICcuLi9hY3Rpdml0eS9zdHJhdmEtYWN0aXZpdHknO1xuaW1wb3J0IHsgUmlkZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9yaWRlJztcbmltcG9ydCB7IE1hdGNoVHlwZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9wYXJ0aWNpcGF0aW9uJztcblxuZXhwb3J0IGludGVyZmFjZSBNYXRjaGluZ0NvbmZpZyB7XG4gIHRpbWVXaW5kb3c6IHtcbiAgICBiZWZvcmVNaW51dGVzOiBudW1iZXI7XG4gICAgYWZ0ZXJNaW51dGVzOiBudW1iZXI7XG4gIH07XG4gIGRpc3RhbmNlVG9sZXJhbmNlUGVyY2VudDogbnVtYmVyO1xuICBsb2NhdGlvblRvbGVyYW5jZUttPzogbnVtYmVyO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIE1hdGNoUmVzdWx0IHtcbiAgbWF0Y2hlZDogYm9vbGVhbjtcbiAgbWF0Y2hUeXBlOiBNYXRjaFR5cGU7XG4gIGNvbmZpZGVuY2U6IG51bWJlcjtcbiAgcmVhc29uPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgQWN0aXZpdHlNYXRjaGVyIHtcbiAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9DT05GSUc6IE1hdGNoaW5nQ29uZmlnID0ge1xuICAgIHRpbWVXaW5kb3c6IHtcbiAgICAgIGJlZm9yZU1pbnV0ZXM6IDYwLFxuICAgICAgYWZ0ZXJNaW51dGVzOiAyNDBcbiAgICB9LFxuICAgIGRpc3RhbmNlVG9sZXJhbmNlUGVyY2VudDogMjVcbiAgfTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNvbmZpZzogTWF0Y2hpbmdDb25maWcgPSBBY3Rpdml0eU1hdGNoZXIuREVGQVVMVF9DT05GSUcpIHt9XG5cbiAgLyoqXG4gICAqIFByaW1hcnkgbWF0Y2hpbmcgc3RyYXRlZ3k6IFRhZy1iYXNlZCBtYXRjaFxuICAgKiBMb29rcyBmb3IgcmlkZSBjb2RlIGluIFN0cmF2YSBhY3Rpdml0eSB0aXRsZSBvciBkZXNjcmlwdGlvblxuICAgKi9cbiAgbWF0Y2hCeVRhZyhhY3Rpdml0eTogU3RyYXZhQWN0aXZpdHlFbnRpdHksIHJpZGU6IFJpZGUsIHJpZGVDb2RlOiBzdHJpbmcpOiBNYXRjaFJlc3VsdCB7XG4gICAgLy8gTm90ZTogSW4gcmVhbCBpbXBsZW1lbnRhdGlvbiwgd2UnZCBuZWVkIHRoZSBhY3Rpdml0eSB0aXRsZS9kZXNjcmlwdGlvblxuICAgIC8vIEZvciBub3csIHdlJ2xsIHJldHVybiBhIHBsYWNlaG9sZGVyIHRoYXQgYXNzdW1lcyBubyB0YWcgbWF0Y2hcbiAgICAvLyBUaGlzIHdvdWxkIGJlIGltcGxlbWVudGVkIHdoZW4gd2UgaGF2ZSBhY2Nlc3MgdG8gZnVsbCBTdHJhdmEgYWN0aXZpdHkgZGF0YVxuICAgIFxuICAgIHJldHVybiB7XG4gICAgICBtYXRjaGVkOiBmYWxzZSxcbiAgICAgIG1hdGNoVHlwZTogTWF0Y2hUeXBlLlRBRyxcbiAgICAgIGNvbmZpZGVuY2U6IDAsXG4gICAgICByZWFzb246ICdObyByaWRlIHRhZyBmb3VuZCBpbiBhY3Rpdml0eSB0aXRsZSBvciBkZXNjcmlwdGlvbidcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEZhbGxiYWNrIG1hdGNoaW5nIHN0cmF0ZWd5OiBUaW1lIHdpbmRvdyArIG9wdGlvbmFsIGRpc3RhbmNlL2xvY2F0aW9uXG4gICAqL1xuICBtYXRjaEJ5VGltZVdpbmRvdyhhY3Rpdml0eTogU3RyYXZhQWN0aXZpdHlFbnRpdHksIHJpZGU6IFJpZGUpOiBNYXRjaFJlc3VsdCB7XG4gICAgLy8gQ2hlY2sgaWYgYWN0aXZpdHkgaXMgYSBjeWNsaW5nIGFjdGl2aXR5XG4gICAgaWYgKCFhY3Rpdml0eS5pc0N5Y2xpbmdBY3Rpdml0eSgpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtYXRjaGVkOiBmYWxzZSxcbiAgICAgICAgbWF0Y2hUeXBlOiBNYXRjaFR5cGUuVElNRV9XSU5ET1csXG4gICAgICAgIGNvbmZpZGVuY2U6IDAsXG4gICAgICAgIHJlYXNvbjogJ0FjdGl2aXR5IGlzIG5vdCBhIGN5Y2xpbmcgYWN0aXZpdHknXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8vIENoZWNrIHRpbWUgd2luZG93XG4gICAgY29uc3QgdGltZVdpbmRvdyA9IHtcbiAgICAgIGJlZm9yZTogdGhpcy5jb25maWcudGltZVdpbmRvdy5iZWZvcmVNaW51dGVzLFxuICAgICAgYWZ0ZXI6IHRoaXMuY29uZmlnLnRpbWVXaW5kb3cuYWZ0ZXJNaW51dGVzXG4gICAgfTtcbiAgICBcbiAgICBpZiAoIWFjdGl2aXR5LmlzV2l0aGluVGltZVdpbmRvdyhyaWRlLnN0YXJ0RGF0ZVRpbWUsIHRpbWVXaW5kb3cpKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtYXRjaGVkOiBmYWxzZSxcbiAgICAgICAgbWF0Y2hUeXBlOiBNYXRjaFR5cGUuVElNRV9XSU5ET1csXG4gICAgICAgIGNvbmZpZGVuY2U6IDAsXG4gICAgICAgIHJlYXNvbjogJ0FjdGl2aXR5IG91dHNpZGUgdGltZSB3aW5kb3cnXG4gICAgICB9O1xuICAgIH1cblxuICAgIGxldCBjb25maWRlbmNlID0gMC42OyAvLyBCYXNlIGNvbmZpZGVuY2UgZm9yIHRpbWUgbWF0Y2hcblxuICAgIC8vIENoZWNrIGRpc3RhbmNlIHRvbGVyYW5jZSBpZiBwbGFubmVkIGRpc3RhbmNlIGV4aXN0c1xuICAgIGlmIChyaWRlLnJvdXRlPy5kaXN0YW5jZSkge1xuICAgICAgY29uc3QgcGxhbm5lZERpc3RhbmNlTWV0ZXJzID0gcmlkZS5yb3V0ZS5kaXN0YW5jZSAqIDEwMDA7IC8vIENvbnZlcnQga20gdG8gbWV0ZXJzXG4gICAgICBpZiAoIWFjdGl2aXR5LmlzV2l0aGluRGlzdGFuY2VUb2xlcmFuY2UocGxhbm5lZERpc3RhbmNlTWV0ZXJzLCB0aGlzLmNvbmZpZy5kaXN0YW5jZVRvbGVyYW5jZVBlcmNlbnQpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbWF0Y2hlZDogZmFsc2UsXG4gICAgICAgICAgbWF0Y2hUeXBlOiBNYXRjaFR5cGUuVElNRV9XSU5ET1csXG4gICAgICAgICAgY29uZmlkZW5jZTogMCxcbiAgICAgICAgICByZWFzb246ICdBY3Rpdml0eSBkaXN0YW5jZSBvdXRzaWRlIHRvbGVyYW5jZSdcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGNvbmZpZGVuY2UgKz0gMC4yOyAvLyBCb29zdCBjb25maWRlbmNlIGZvciBkaXN0YW5jZSBtYXRjaFxuICAgIH1cblxuICAgIC8vIFRPRE86IEFkZCBsb2NhdGlvbiB0b2xlcmFuY2UgY2hlY2sgd2hlbiBjb29yZGluYXRlcyBhcmUgYXZhaWxhYmxlXG4gICAgLy8gaWYgKHRoaXMuY29uZmlnLmxvY2F0aW9uVG9sZXJhbmNlS20gJiYgcmlkZS5tZWV0aW5nUG9pbnQuY29vcmRpbmF0ZXMgJiYgYWN0aXZpdHkuc3RhcnRMYXRMbmcpIHtcbiAgICAvLyAgIGNvbnN0IGRpc3RhbmNlID0gdGhpcy5jYWxjdWxhdGVEaXN0YW5jZShcbiAgICAvLyAgICAgcmlkZS5tZWV0aW5nUG9pbnQuY29vcmRpbmF0ZXMsXG4gICAgLy8gICAgIHsgbGF0aXR1ZGU6IGFjdGl2aXR5LnN0YXJ0TGF0TG5nWzBdLCBsb25naXR1ZGU6IGFjdGl2aXR5LnN0YXJ0TGF0TG5nWzFdIH1cbiAgICAvLyAgICk7XG4gICAgLy8gICBpZiAoZGlzdGFuY2UgPD0gdGhpcy5jb25maWcubG9jYXRpb25Ub2xlcmFuY2VLbSkge1xuICAgIC8vICAgICBjb25maWRlbmNlICs9IDAuMjtcbiAgICAvLyAgIH1cbiAgICAvLyB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgbWF0Y2hlZDogdHJ1ZSxcbiAgICAgIG1hdGNoVHlwZTogTWF0Y2hUeXBlLlRJTUVfV0lORE9XLFxuICAgICAgY29uZmlkZW5jZTogTWF0aC5taW4oY29uZmlkZW5jZSwgMS4wKSxcbiAgICAgIHJlYXNvbjogJ01hdGNoZWQgYnkgdGltZSB3aW5kb3cgYW5kIGRpc3RhbmNlJ1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQ29tcHJlaGVuc2l2ZSBtYXRjaGluZzogVHJ5IHRhZyBmaXJzdCwgdGhlbiB0aW1lIHdpbmRvd1xuICAgKi9cbiAgbWF0Y2goYWN0aXZpdHk6IFN0cmF2YUFjdGl2aXR5RW50aXR5LCByaWRlOiBSaWRlLCByaWRlQ29kZTogc3RyaW5nKTogTWF0Y2hSZXN1bHQge1xuICAgIC8vIDEuIFRyeSB0YWctYmFzZWQgbWF0Y2ggZmlyc3QgKGhpZ2hlc3QgY29uZmlkZW5jZSlcbiAgICBjb25zdCB0YWdNYXRjaCA9IHRoaXMubWF0Y2hCeVRhZyhhY3Rpdml0eSwgcmlkZSwgcmlkZUNvZGUpO1xuICAgIGlmICh0YWdNYXRjaC5tYXRjaGVkKSB7XG4gICAgICByZXR1cm4geyAuLi50YWdNYXRjaCwgY29uZmlkZW5jZTogMS4wIH07XG4gICAgfVxuXG4gICAgLy8gMi4gRmFsbGJhY2sgdG8gdGltZSB3aW5kb3cgbWF0Y2hcbiAgICBjb25zdCB0aW1lTWF0Y2ggPSB0aGlzLm1hdGNoQnlUaW1lV2luZG93KGFjdGl2aXR5LCByaWRlKTtcbiAgICByZXR1cm4gdGltZU1hdGNoO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGEgdW5pcXVlIHJpZGUgY29kZSBmb3IgdGFnZ2luZ1xuICAgKi9cbiAgc3RhdGljIGdlbmVyYXRlUmlkZUNvZGUocmlkZUlkOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIC8vIEdlbmVyYXRlIGEgc2hvcnQsIHVuaXF1ZSBjb2RlIGZyb20gcmlkZSBJRFxuICAgIGNvbnN0IGhhc2ggPSByaWRlSWQuc3BsaXQoJycpLnJlZHVjZSgoYSwgYikgPT4ge1xuICAgICAgYSA9ICgoYSA8PCA1KSAtIGEpICsgYi5jaGFyQ29kZUF0KDApO1xuICAgICAgcmV0dXJuIGEgJiBhO1xuICAgIH0sIDApO1xuICAgIFxuICAgIGNvbnN0IGNvZGUgPSBNYXRoLmFicyhoYXNoKS50b1N0cmluZygzNikudG9VcHBlckNhc2UoKS5zdWJzdHJpbmcoMCwgNik7XG4gICAgcmV0dXJuIGBSSURFLSR7Y29kZX1gO1xuICB9XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZSBkaXN0YW5jZSBiZXR3ZWVuIHR3byBjb29yZGluYXRlcyAoSGF2ZXJzaW5lIGZvcm11bGEpXG4gICAqL1xuICBwcml2YXRlIGNhbGN1bGF0ZURpc3RhbmNlKFxuICAgIGNvb3JkMTogeyBsYXRpdHVkZTogbnVtYmVyOyBsb25naXR1ZGU6IG51bWJlciB9LFxuICAgIGNvb3JkMjogeyBsYXRpdHVkZTogbnVtYmVyOyBsb25naXR1ZGU6IG51bWJlciB9XG4gICk6IG51bWJlciB7XG4gICAgY29uc3QgUiA9IDYzNzE7IC8vIEVhcnRoJ3MgcmFkaXVzIGluIGttXG4gICAgY29uc3QgZExhdCA9IHRoaXMudG9SYWRpYW5zKGNvb3JkMi5sYXRpdHVkZSAtIGNvb3JkMS5sYXRpdHVkZSk7XG4gICAgY29uc3QgZExvbiA9IHRoaXMudG9SYWRpYW5zKGNvb3JkMi5sb25naXR1ZGUgLSBjb29yZDEubG9uZ2l0dWRlKTtcbiAgICBcbiAgICBjb25zdCBhID0gTWF0aC5zaW4oZExhdCAvIDIpICogTWF0aC5zaW4oZExhdCAvIDIpICtcbiAgICAgIE1hdGguY29zKHRoaXMudG9SYWRpYW5zKGNvb3JkMS5sYXRpdHVkZSkpICogTWF0aC5jb3ModGhpcy50b1JhZGlhbnMoY29vcmQyLmxhdGl0dWRlKSkgKlxuICAgICAgTWF0aC5zaW4oZExvbiAvIDIpICogTWF0aC5zaW4oZExvbiAvIDIpO1xuICAgIFxuICAgIGNvbnN0IGMgPSAyICogTWF0aC5hdGFuMihNYXRoLnNxcnQoYSksIE1hdGguc3FydCgxIC0gYSkpO1xuICAgIHJldHVybiBSICogYztcbiAgfVxuXG4gIHByaXZhdGUgdG9SYWRpYW5zKGRlZ3JlZXM6IG51bWJlcik6IG51bWJlciB7XG4gICAgcmV0dXJuIGRlZ3JlZXMgKiAoTWF0aC5QSSAvIDE4MCk7XG4gIH1cbn0iXX0=