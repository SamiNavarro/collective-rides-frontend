import { StravaIntegrationEntity } from './strava-integration';
import { StravaIntegrationRepository } from './strava-integration-repository';
import { StravaTokenResponse } from '../../../../shared/types/strava';
import { TokenEncryptionService } from './token-encryption-service';

export class StravaIntegrationService {
  constructor(
    private integrationRepository?: StravaIntegrationRepository,
    private tokenEncryption?: TokenEncryptionService
  ) {
    // Default implementations will be injected by the infrastructure layer
    // For now, we'll use placeholder implementations
  }

  async createIntegration(
    userId: string,
    tokenData: StravaTokenResponse
  ): Promise<StravaIntegrationEntity> {
    if (!this.integrationRepository || !this.tokenEncryption) {
      throw new Error('Service dependencies not properly initialized');
    }

    // Check if user already has a Strava integration
    const existing = await this.integrationRepository.findByUserId(userId);
    if (existing && !existing.isRevoked) {
      // Update existing integration
      return this.updateIntegration(existing, tokenData);
    }

    // Encrypt tokens
    const accessTokenRef = await this.tokenEncryption.encrypt(tokenData.access_token);
    const refreshTokenRef = await this.tokenEncryption.encrypt(tokenData.refresh_token);

    // Create new integration
    const integration = StravaIntegrationEntity.create(
      userId,
      tokenData.athlete.id.toString(),
      ['read', 'activity:read'], // Scopes from OAuth
      accessTokenRef,
      refreshTokenRef,
      tokenData.expires_at
    );

    await this.integrationRepository.create(integration);
    return integration;
  }

  async updateIntegration(
    integration: StravaIntegrationEntity,
    tokenData: StravaTokenResponse
  ): Promise<StravaIntegrationEntity> {
    if (!this.integrationRepository || !this.tokenEncryption) {
      throw new Error('Service dependencies not properly initialized');
    }

    // Encrypt new tokens
    const accessTokenRef = await this.tokenEncryption.encrypt(tokenData.access_token);
    const refreshTokenRef = await this.tokenEncryption.encrypt(tokenData.refresh_token);

    integration.updateTokens(accessTokenRef, refreshTokenRef, tokenData.expires_at);
    await this.integrationRepository.update(integration);
    
    return integration;
  }

  async getIntegration(userId: string): Promise<StravaIntegrationEntity | null> {
    if (!this.integrationRepository) {
      throw new Error('Service dependencies not properly initialized');
    }

    const integration = await this.integrationRepository.findByUserId(userId);
    if (!integration || integration.isRevoked) {
      return null;
    }
    return integration;
  }

  async refreshTokenIfNeeded(integration: StravaIntegrationEntity): Promise<StravaIntegrationEntity> {
    if (!integration.isTokenExpired()) {
      return integration;
    }

    if (!this.tokenEncryption) {
      throw new Error('Token encryption service not available');
    }

    const clientId = process.env.STRAVA_CLIENT_ID;
    const clientSecret = process.env.STRAVA_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      throw new Error('Strava client credentials not configured');
    }

    // Decrypt refresh token
    const refreshToken = await this.tokenEncryption.decrypt(integration.refreshTokenRef);

    // Request new tokens
    const response = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    const tokenData: StravaTokenResponse = await response.json() as StravaTokenResponse;
    return this.updateIntegration(integration, tokenData);
  }

  async revokeIntegration(userId: string): Promise<void> {
    if (!this.integrationRepository) {
      throw new Error('Integration repository not available');
    }

    const integration = await this.integrationRepository.findByUserId(userId);
    if (!integration) {
      throw new Error('No Strava integration found');
    }

    integration.revoke();
    await this.integrationRepository.update(integration);
  }

  async getAccessToken(userId: string): Promise<string> {
    if (!this.tokenEncryption) {
      throw new Error('Token encryption service not available');
    }

    const integration = await this.getIntegration(userId);
    if (!integration) {
      throw new Error('No active Strava integration found');
    }

    // Refresh token if needed
    const refreshedIntegration = await this.refreshTokenIfNeeded(integration);
    
    // Decrypt and return access token
    return this.tokenEncryption.decrypt(refreshedIntegration.accessTokenRef);
  }
}