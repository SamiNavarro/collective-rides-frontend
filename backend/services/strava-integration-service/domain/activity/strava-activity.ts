import { StravaActivity, StravaActivityResponse } from '../../../../shared/types/strava';

export class StravaActivityEntity {
  constructor(private activity: StravaActivity) {}

  static fromStravaResponse(
    userId: string,
    stravaResponse: StravaActivityResponse
  ): StravaActivityEntity {
    const activity: StravaActivity = {
      provider: 'strava',
      stravaActivityId: stravaResponse.id.toString(),
      userId,
      type: stravaResponse.type,
      startDateUtc: stravaResponse.start_date,
      distanceMeters: stravaResponse.distance,
      movingTimeSeconds: stravaResponse.moving_time,
      elevationGainMeters: stravaResponse.total_elevation_gain,
      startLatLng: stravaResponse.start_latlng,
      endLatLng: stravaResponse.end_latlng,
      ingestedAt: new Date().toISOString()
    };

    return new StravaActivityEntity(activity);
  }

  // Getters
  get stravaActivityId(): string { return this.activity.stravaActivityId; }
  get userId(): string { return this.activity.userId; }
  get type(): string { return this.activity.type; }
  get startDateUtc(): string { return this.activity.startDateUtc; }
  get distanceMeters(): number { return this.activity.distanceMeters; }
  get movingTimeSeconds(): number { return this.activity.movingTimeSeconds; }
  get elevationGainMeters(): number { return this.activity.elevationGainMeters; }
  get startLatLng(): [number, number] | undefined { return this.activity.startLatLng; }

  toJSON(): StravaActivity {
    return { ...this.activity };
  }

  // Business methods
  isCyclingActivity(): boolean {
    const cyclingTypes = ['Ride', 'VirtualRide', 'EBikeRide', 'Handcycle'];
    return cyclingTypes.includes(this.activity.type);
  }

  getStartTime(): Date {
    return new Date(this.activity.startDateUtc);
  }

  getAverageSpeed(): number {
    if (this.activity.movingTimeSeconds === 0) return 0;
    return this.activity.distanceMeters / this.activity.movingTimeSeconds; // m/s
  }

  isWithinTimeWindow(rideStartTime: string, windowMinutes: { before: number; after: number }): boolean {
    const activityStart = this.getStartTime();
    const rideStart = new Date(rideStartTime);
    
    const beforeWindow = new Date(rideStart.getTime() - windowMinutes.before * 60 * 1000);
    const afterWindow = new Date(rideStart.getTime() + windowMinutes.after * 60 * 1000);
    
    return activityStart >= beforeWindow && activityStart <= afterWindow;
  }

  isWithinDistanceTolerance(plannedDistance: number, tolerancePercent: number): boolean {
    if (!plannedDistance) return true; // No distance constraint
    
    const tolerance = plannedDistance * (tolerancePercent / 100);
    const minDistance = plannedDistance - tolerance;
    const maxDistance = plannedDistance + tolerance;
    
    return this.activity.distanceMeters >= minDistance && this.activity.distanceMeters <= maxDistance;
  }

  getMetricsSnapshot() {
    return {
      distanceMeters: this.activity.distanceMeters,
      movingTimeSeconds: this.activity.movingTimeSeconds,
      elevationGainMeters: this.activity.elevationGainMeters,
      startTimeUtc: this.activity.startDateUtc
    };
  }
}