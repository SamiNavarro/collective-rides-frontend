import { StravaIntegration } from '../../../../shared/types/strava';
import { generateId } from '../../../../shared/utils/id-generator';

export class StravaIntegrationEntity {
  constructor(private integration: StravaIntegration) {}

  static create(
    userId: string,
    athleteId: string,
    scopesGranted: string[],
    accessTokenRef: string,
    refreshTokenRef: string,
    expiresAt: number
  ): StravaIntegrationEntity {
    const now = new Date().toISOString();
    const tokenExpiresAt = new Date(expiresAt * 1000).toISOString();

    const integration: StravaIntegration = {
      userId,
      provider: 'strava',
      athleteId,
      scopesGranted,
      accessTokenRef,
      refreshTokenRef,
      tokenExpiresAt,
      connectedAt: now
    };

    return new StravaIntegrationEntity(integration);
  }

  // Getters
  get userId(): string { return this.integration.userId; }
  get athleteId(): string { return this.integration.athleteId; }
  get accessTokenRef(): string { return this.integration.accessTokenRef; }
  get refreshTokenRef(): string { return this.integration.refreshTokenRef; }
  get tokenExpiresAt(): string { return this.integration.tokenExpiresAt; }
  get isRevoked(): boolean { return this.integration.revokedAt !== undefined; }

  toJSON(): StravaIntegration {
    return { ...this.integration };
  }

  // Business methods
  isTokenExpired(): boolean {
    return new Date() >= new Date(this.integration.tokenExpiresAt);
  }

  updateTokens(accessTokenRef: string, refreshTokenRef: string, expiresAt: number): void {
    this.integration.accessTokenRef = accessTokenRef;
    this.integration.refreshTokenRef = refreshTokenRef;
    this.integration.tokenExpiresAt = new Date(expiresAt * 1000).toISOString();
    this.integration.lastSyncAt = new Date().toISOString();
  }

  revoke(): void {
    this.integration.revokedAt = new Date().toISOString();
  }

  updateLastSync(): void {
    this.integration.lastSyncAt = new Date().toISOString();
  }

  hasScope(scope: string): boolean {
    return this.integration.scopesGranted.includes(scope);
  }

  canReadActivities(): boolean {
    return this.hasScope('read') || this.hasScope('read_all');
  }
}