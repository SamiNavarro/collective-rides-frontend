import { StravaIntegration } from '../../../../shared/types/strava';
export declare class StravaIntegrationEntity {
    private integration;
    constructor(integration: StravaIntegration);
    static create(userId: string, athleteId: string, scopesGranted: string[], accessTokenRef: string, refreshTokenRef: string, expiresAt: number): StravaIntegrationEntity;
    get userId(): string;
    get athleteId(): string;
    get accessTokenRef(): string;
    get refreshTokenRef(): string;
    get tokenExpiresAt(): string;
    get isRevoked(): boolean;
    toJSON(): StravaIntegration;
    isTokenExpired(): boolean;
    updateTokens(accessTokenRef: string, refreshTokenRef: string, expiresAt: number): void;
    revoke(): void;
    updateLastSync(): void;
    hasScope(scope: string): boolean;
    canReadActivities(): boolean;
}
