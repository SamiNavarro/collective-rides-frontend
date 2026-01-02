// Phase 2.5: Strava Integration Types

export interface StravaIntegration {
  userId: string;
  provider: 'strava';
  athleteId: string;
  scopesGranted: string[];
  accessTokenRef: string;
  refreshTokenRef: string;
  tokenExpiresAt: string;
  connectedAt: string;
  revokedAt?: string;
  lastSyncAt?: string;
}

export interface StravaActivity {
  provider: 'strava';
  stravaActivityId: string;
  userId: string;
  type: string;
  startDateUtc: string;
  distanceMeters: number;
  movingTimeSeconds: number;
  elevationGainMeters: number;
  startLatLng?: [number, number];
  endLatLng?: [number, number];
  ingestedAt: string;
}

export interface RideSummary {
  rideId: string;
  clubId: string;
  completedAt: string;
  participantsPlanned: number;
  participantsAttended: number;
  participantsNoShow: number;
  participantsWithStrava: number;
  participantsWithManualEvidence: number;
  aggregatedMetrics?: {
    totalDistanceMeters?: number;
    totalElevationGainMeters?: number;
    averageSpeedMps?: number;
  };
  lastUpdatedAt: string;
}

// API Request/Response types
export interface StravaConnectResponse {
  authUrl: string;
  state: string;
}

export interface StravaCallbackRequest {
  code: string;
  state: string;
}

export interface StravaWebhookEvent {
  object_type: string;
  object_id: number;
  aspect_type: string;
  updates: Record<string, any>;
  owner_id: number;
  subscription_id: number;
  event_time: number;
}

export interface StravaWebhookChallenge {
  'hub.mode': string;
  'hub.challenge': string;
  'hub.verify_token': string;
}

// Strava API response types (external)
export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete: {
    id: number;
    username?: string;
    firstname?: string;
    lastname?: string;
  };
}

export interface StravaActivityResponse {
  id: number;
  name: string;
  type: string;
  start_date: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
}