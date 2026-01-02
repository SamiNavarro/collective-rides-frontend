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
export declare class ActivityMatcher {
    private config;
    private static readonly DEFAULT_CONFIG;
    constructor(config?: MatchingConfig);
    /**
     * Primary matching strategy: Tag-based match
     * Looks for ride code in Strava activity title or description
     */
    matchByTag(activity: StravaActivityEntity, ride: Ride, rideCode: string): MatchResult;
    /**
     * Fallback matching strategy: Time window + optional distance/location
     */
    matchByTimeWindow(activity: StravaActivityEntity, ride: Ride): MatchResult;
    /**
     * Comprehensive matching: Try tag first, then time window
     */
    match(activity: StravaActivityEntity, ride: Ride, rideCode: string): MatchResult;
    /**
     * Generate a unique ride code for tagging
     */
    static generateRideCode(rideId: string): string;
    /**
     * Calculate distance between two coordinates (Haversine formula)
     */
    private calculateDistance;
    private toRadians;
}
