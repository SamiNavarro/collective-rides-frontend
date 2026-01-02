import { StravaIntegrationEntity } from './strava-integration';
import { StravaIntegrationRepository } from './strava-integration-repository';
import { StravaTokenResponse } from '../../../../shared/types/strava';
import { TokenEncryptionService } from './token-encryption-service';
export declare class StravaIntegrationService {
    private integrationRepository?;
    private tokenEncryption?;
    constructor(integrationRepository?: StravaIntegrationRepository | undefined, tokenEncryption?: TokenEncryptionService | undefined);
    createIntegration(userId: string, tokenData: StravaTokenResponse): Promise<StravaIntegrationEntity>;
    updateIntegration(integration: StravaIntegrationEntity, tokenData: StravaTokenResponse): Promise<StravaIntegrationEntity>;
    getIntegration(userId: string): Promise<StravaIntegrationEntity | null>;
    refreshTokenIfNeeded(integration: StravaIntegrationEntity): Promise<StravaIntegrationEntity>;
    revokeIntegration(userId: string): Promise<void>;
    getAccessToken(userId: string): Promise<string>;
}
