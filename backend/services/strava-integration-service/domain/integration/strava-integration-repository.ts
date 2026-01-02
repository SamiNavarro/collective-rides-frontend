import { StravaIntegrationEntity } from './strava-integration';

export interface StravaIntegrationRepository {
  create(integration: StravaIntegrationEntity): Promise<void>;
  findByUserId(userId: string): Promise<StravaIntegrationEntity | null>;
  findByAthleteId(athleteId: string): Promise<StravaIntegrationEntity | null>;
  update(integration: StravaIntegrationEntity): Promise<void>;
  delete(userId: string): Promise<void>;
}