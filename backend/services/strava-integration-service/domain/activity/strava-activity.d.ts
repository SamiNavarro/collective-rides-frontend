import { StravaActivity, StravaActivityResponse } from '../../../../shared/types/strava';
export declare class StravaActivityEntity {
    private activity;
    constructor(activity: StravaActivity);
    static fromStravaResponse(userId: string, stravaResponse: StravaActivityResponse): StravaActivityEntity;
    get stravaActivityId(): string;
    get userId(): string;
    get type(): string;
    get startDateUtc(): string;
    get distanceMeters(): number;
    get movingTimeSeconds(): number;
    get elevationGainMeters(): number;
    get startLatLng(): [number, number] | undefined;
    toJSON(): StravaActivity;
    isCyclingActivity(): boolean;
    getStartTime(): Date;
    getAverageSpeed(): number;
    isWithinTimeWindow(rideStartTime: string, windowMinutes: {
        before: number;
        after: number;
    }): boolean;
    isWithinDistanceTolerance(plannedDistance: number, tolerancePercent: number): boolean;
    getMetricsSnapshot(): {
        distanceMeters: number;
        movingTimeSeconds: number;
        elevationGainMeters: number;
        startTimeUtc: string;
    };
}
