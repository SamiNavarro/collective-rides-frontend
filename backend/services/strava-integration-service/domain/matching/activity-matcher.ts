import { StravaActivityEntity } from '../activity/strava-activity';
import { Ride } from '../../../../shared/types/ride';
import { MatchType } from '../../../../shared/types/participation';

export interface MatchingConfig {
  timeWindow: {
    beforeMinutes: number;
    afterMinutes: number;
  };
  distanceTolerancePercent: number;
  locationToleranceKm?: number;
}

export interface MatchResult {
  matched: boolean;
  matchType: MatchType;
  confidence: number;
  reason?: string;
}

export class ActivityMatcher {
  private static readonly DEFAULT_CONFIG: MatchingConfig = {
    timeWindow: {
      beforeMinutes: 60,
      afterMinutes: 240
    },
    distanceTolerancePercent: 25
  };

  constructor(private config: MatchingConfig = ActivityMatcher.DEFAULT_CONFIG) {}

  /**
   * Primary matching strategy: Tag-based match
   * Looks for ride code in Strava activity title or description
   */
  matchByTag(activity: StravaActivityEntity, ride: Ride, rideCode: string): MatchResult {
    // Note: In real implementation, we'd need the activity title/description
    // For now, we'll return a placeholder that assumes no tag match
    // This would be implemented when we have access to full Strava activity data
    
    return {
      matched: false,
      matchType: MatchType.TAG,
      confidence: 0,
      reason: 'No ride tag found in activity title or description'
    };
  }

  /**
   * Fallback matching strategy: Time window + optional distance/location
   */
  matchByTimeWindow(activity: StravaActivityEntity, ride: Ride): MatchResult {
    // Check if activity is a cycling activity
    if (!activity.isCyclingActivity()) {
      return {
        matched: false,
        matchType: MatchType.TIME_WINDOW,
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
        matchType: MatchType.TIME_WINDOW,
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
          matchType: MatchType.TIME_WINDOW,
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
      matchType: MatchType.TIME_WINDOW,
      confidence: Math.min(confidence, 1.0),
      reason: 'Matched by time window and distance'
    };
  }

  /**
   * Comprehensive matching: Try tag first, then time window
   */
  match(activity: StravaActivityEntity, ride: Ride, rideCode: string): MatchResult {
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
  static generateRideCode(rideId: string): string {
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
  private calculateDistance(
    coord1: { latitude: number; longitude: number },
    coord2: { latitude: number; longitude: number }
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}