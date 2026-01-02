"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StravaIntegrationService = void 0;
const strava_integration_1 = require("./strava-integration");
class StravaIntegrationService {
    constructor(integrationRepository, tokenEncryption) {
        this.integrationRepository = integrationRepository;
        this.tokenEncryption = tokenEncryption;
        // Default implementations will be injected by the infrastructure layer
        // For now, we'll use placeholder implementations
    }
    async createIntegration(userId, tokenData) {
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
        const integration = strava_integration_1.StravaIntegrationEntity.create(userId, tokenData.athlete.id.toString(), ['read', 'activity:read'], // Scopes from OAuth
        accessTokenRef, refreshTokenRef, tokenData.expires_at);
        await this.integrationRepository.create(integration);
        return integration;
    }
    async updateIntegration(integration, tokenData) {
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
    async getIntegration(userId) {
        if (!this.integrationRepository) {
            throw new Error('Service dependencies not properly initialized');
        }
        const integration = await this.integrationRepository.findByUserId(userId);
        if (!integration || integration.isRevoked) {
            return null;
        }
        return integration;
    }
    async refreshTokenIfNeeded(integration) {
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
        const tokenData = await response.json();
        return this.updateIntegration(integration, tokenData);
    }
    async revokeIntegration(userId) {
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
    async getAccessToken(userId) {
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
exports.StravaIntegrationService = StravaIntegrationService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyYXZhLWludGVncmF0aW9uLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdHJhdmEtaW50ZWdyYXRpb24tc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSw2REFBK0Q7QUFLL0QsTUFBYSx3QkFBd0I7SUFDbkMsWUFDVSxxQkFBbUQsRUFDbkQsZUFBd0M7UUFEeEMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUE4QjtRQUNuRCxvQkFBZSxHQUFmLGVBQWUsQ0FBeUI7UUFFaEQsdUVBQXVFO1FBQ3ZFLGlEQUFpRDtJQUNuRCxDQUFDO0lBRUQsS0FBSyxDQUFDLGlCQUFpQixDQUNyQixNQUFjLEVBQ2QsU0FBOEI7UUFFOUIsSUFBSSxDQUFDLElBQUksQ0FBQyxxQkFBcUIsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUU7WUFDeEQsTUFBTSxJQUFJLEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO1NBQ2xFO1FBRUQsaURBQWlEO1FBQ2pELE1BQU0sUUFBUSxHQUFHLE1BQU0sSUFBSSxDQUFDLHFCQUFxQixDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2RSxJQUFJLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUU7WUFDbkMsOEJBQThCO1lBQzlCLE9BQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztTQUNwRDtRQUVELGlCQUFpQjtRQUNqQixNQUFNLGNBQWMsR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNsRixNQUFNLGVBQWUsR0FBRyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUVwRix5QkFBeUI7UUFDekIsTUFBTSxXQUFXLEdBQUcsNENBQXVCLENBQUMsTUFBTSxDQUNoRCxNQUFNLEVBQ04s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QUksQ0FBQyxlQUFlLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzNFLENBQUM7Q0FDRjtBQS9JRCw0REErSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTdHJhdmFJbnRlZ3JhdGlvbkVudGl0eSB9IGZyb20gJy4vc3RyYXZhLWludGVncmF0aW9uJztcbmltcG9ydCB7IFN0cmF2YUludGVncmF0aW9uUmVwb3NpdG9yeSB9IGZyb20gJy4vc3RyYXZhLWludGVncmF0aW9uLXJlcG9zaXRvcnknO1xuaW1wb3J0IHsgU3RyYXZhVG9rZW5SZXNwb25zZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC90eXBlcy9zdHJhdmEnO1xuaW1wb3J0IHsgVG9rZW5FbmNyeXB0aW9uU2VydmljZSB9IGZyb20gJy4vdG9rZW4tZW5jcnlwdGlvbi1zZXJ2aWNlJztcblxuZXhwb3J0IGNsYXNzIFN0cmF2YUludGVncmF0aW9uU2VydmljZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgaW50ZWdyYXRpb25SZXBvc2l0b3J5PzogU3RyYXZhSW50ZWdyYXRpb25SZXBvc2l0b3J5LFxuICAgIHByaXZhdGUgdG9rZW5FbmNyeXB0aW9uPzogVG9rZW5FbmNyeXB0aW9uU2VydmljZVxuICApIHtcbiAgICAvLyBEZWZhdWx0IGltcGxlbWVudGF0aW9ucyB3aWxsIGJlIGluamVjdGVkIGJ5IHRoZSBpbmZyYXN0cnVjdHVyZSBsYXllclxuICAgIC8vIEZvciBub3csIHdlJ2xsIHVzZSBwbGFjZWhvbGRlciBpbXBsZW1lbnRhdGlvbnNcbiAgfVxuXG4gIGFzeW5jIGNyZWF0ZUludGVncmF0aW9uKFxuICAgIHVzZXJJZDogc3RyaW5nLFxuICAgIHRva2VuRGF0YTogU3RyYXZhVG9rZW5SZXNwb25zZVxuICApOiBQcm9taXNlPFN0cmF2YUludGVncmF0aW9uRW50aXR5PiB7XG4gICAgaWYgKCF0aGlzLmludGVncmF0aW9uUmVwb3NpdG9yeSB8fCAhdGhpcy50b2tlbkVuY3J5cHRpb24pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2VydmljZSBkZXBlbmRlbmNpZXMgbm90IHByb3Blcmx5IGluaXRpYWxpemVkJyk7XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgaWYgdXNlciBhbHJlYWR5IGhhcyBhIFN0cmF2YSBpbnRlZ3JhdGlvblxuICAgIGNvbnN0IGV4aXN0aW5nID0gYXdhaXQgdGhpcy5pbnRlZ3JhdGlvblJlcG9zaXRvcnkuZmluZEJ5VXNlcklkKHVzZXJJZCk7XG4gICAgaWYgKGV4aXN0aW5nICYmICFleGlzdGluZy5pc1Jldm9rZWQpIHtcbiAgICAgIC8vIFVwZGF0ZSBleGlzdGluZyBpbnRlZ3JhdGlvblxuICAgICAgcmV0dXJuIHRoaXMudXBkYXRlSW50ZWdyYXRpb24oZXhpc3RpbmcsIHRva2VuRGF0YSk7XG4gICAgfVxuXG4gICAgLy8gRW5jcnlwdCB0b2tlbnNcbiAgICBjb25zdCBhY2Nlc3NUb2tlblJlZiA9IGF3YWl0IHRoaXMudG9rZW5FbmNyeXB0aW9uLmVuY3J5cHQodG9rZW5EYXRhLmFjY2Vzc190b2tlbik7XG4gICAgY29uc3QgcmVmcmVzaFRva2VuUmVmID0gYXdhaXQgdGhpcy50b2tlbkVuY3J5cHRpb24uZW5jcnlwdCh0b2tlbkRhdGEucmVmcmVzaF90b2tlbik7XG5cbiAgICAvLyBDcmVhdGUgbmV3IGludGVncmF0aW9uXG4gICAgY29uc3QgaW50ZWdyYXRpb24gPSBTdHJhdmFJbnRlZ3JhdGlvbkVudGl0eS5jcmVhdGUoXG4gICAgICB1c2VySWQsXG4gICAgICB0b2tlbkRhdGEuYXRobGV0ZS5pZC50b1N0cmluZygpLFxuICAgICAgWydyZWFkJywgJ2FjdGl2aXR5OnJlYWQnXSwgLy8gU2NvcGVzIGZyb20gT0F1dGhcbiAgICAgIGFjY2Vzc1Rva2VuUmVmLFxuICAgICAgcmVmcmVzaFRva2VuUmVmLFxuICAgICAgdG9rZW5EYXRhLmV4cGlyZXNfYXRcbiAgICApO1xuXG4gICAgYXdhaXQgdGhpcy5pbnRlZ3JhdGlvblJlcG9zaXRvcnkuY3JlYXRlKGludGVncmF0aW9uKTtcbiAgICByZXR1cm4gaW50ZWdyYXRpb247XG4gIH1cblxuICBhc3luYyB1cGRhdGVJbnRlZ3JhdGlvbihcbiAgICBpbnRlZ3JhdGlvbjogU3RyYXZhSW50ZWdyYXRpb25FbnRpdHksXG4gICAgdG9rZW5EYXRhOiBTdHJhdmFUb2tlblJlc3BvbnNlXG4gICk6IFByb21pc2U8U3RyYXZhSW50ZWdyYXRpb25FbnRpdHk+IHtcbiAgICBpZiAoIXRoaXMuaW50ZWdyYXRpb25SZXBvc2l0b3J5IHx8ICF0aGlzLnRva2VuRW5jcnlwdGlvbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTZXJ2aWNlIGRlcGVuZGVuY2llcyBub3QgcHJvcGVybHkgaW5pdGlhbGl6ZWQnKTtcbiAgICB9XG5cbiAgICAvLyBFbmNyeXB0IG5ldyB0b2tlbnNcbiAgICBjb25zdCBhY2Nlc3NUb2tlblJlZiA9IGF3YWl0IHRoaXMudG9rZW5FbmNyeXB0aW9uLmVuY3J5cHQodG9rZW5EYXRhLmFjY2Vzc190b2tlbik7XG4gICAgY29uc3QgcmVmcmVzaFRva2VuUmVmID0gYXdhaXQgdGhpcy50b2tlbkVuY3J5cHRpb24uZW5jcnlwdCh0b2tlbkRhdGEucmVmcmVzaF90b2tlbik7XG5cbiAgICBpbnRlZ3JhdGlvbi51cGRhdGVUb2tlbnMoYWNjZXNzVG9rZW5SZWYsIHJlZnJlc2hUb2tlblJlZiwgdG9rZW5EYXRhLmV4cGlyZXNfYXQpO1xuICAgIGF3YWl0IHRoaXMuaW50ZWdyYXRpb25SZXBvc2l0b3J5LnVwZGF0ZShpbnRlZ3JhdGlvbik7XG4gICAgXG4gICAgcmV0dXJuIGludGVncmF0aW9uO1xuICB9XG5cbiAgYXN5bmMgZ2V0SW50ZWdyYXRpb24odXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPFN0cmF2YUludGVncmF0aW9uRW50aXR5IHwgbnVsbD4ge1xuICAgIGlmICghdGhpcy5pbnRlZ3JhdGlvblJlcG9zaXRvcnkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2VydmljZSBkZXBlbmRlbmNpZXMgbm90IHByb3Blcmx5IGluaXRpYWxpemVkJyk7XG4gICAgfVxuXG4gICAgY29uc3QgaW50ZWdyYXRpb24gPSBhd2FpdCB0aGlzLmludGVncmF0aW9uUmVwb3NpdG9yeS5maW5kQnlVc2VySWQodXNlcklkKTtcbiAgICBpZiAoIWludGVncmF0aW9uIHx8IGludGVncmF0aW9uLmlzUmV2b2tlZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiBpbnRlZ3JhdGlvbjtcbiAgfVxuXG4gIGFzeW5jIHJlZnJlc2hUb2tlbklmTmVlZGVkKGludGVncmF0aW9uOiBTdHJhdmFJbnRlZ3JhdGlvbkVudGl0eSk6IFByb21pc2U8U3RyYXZhSW50ZWdyYXRpb25FbnRpdHk+IHtcbiAgICBpZiAoIWludGVncmF0aW9uLmlzVG9rZW5FeHBpcmVkKCkpIHtcbiAgICAgIHJldHVybiBpbnRlZ3JhdGlvbjtcbiAgICB9XG5cbiAgICBpZiAoIXRoaXMudG9rZW5FbmNyeXB0aW9uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Rva2VuIGVuY3J5cHRpb24gc2VydmljZSBub3QgYXZhaWxhYmxlJyk7XG4gICAgfVxuXG4gICAgY29uc3QgY2xpZW50SWQgPSBwcm9jZXNzLmVudi5TVFJBVkFfQ0xJRU5UX0lEO1xuICAgIGNvbnN0IGNsaWVudFNlY3JldCA9IHByb2Nlc3MuZW52LlNUUkFWQV9DTElFTlRfU0VDUkVUO1xuICAgIFxuICAgIGlmICghY2xpZW50SWQgfHwgIWNsaWVudFNlY3JldCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTdHJhdmEgY2xpZW50IGNyZWRlbnRpYWxzIG5vdCBjb25maWd1cmVkJyk7XG4gICAgfVxuXG4gICAgLy8gRGVjcnlwdCByZWZyZXNoIHRva2VuXG4gICAgY29uc3QgcmVmcmVzaFRva2VuID0gYXdhaXQgdGhpcy50b2tlbkVuY3J5cHRpb24uZGVjcnlwdChpbnRlZ3JhdGlvbi5yZWZyZXNoVG9rZW5SZWYpO1xuXG4gICAgLy8gUmVxdWVzdCBuZXcgdG9rZW5zXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly93d3cuc3RyYXZhLmNvbS9vYXV0aC90b2tlbicsIHtcbiAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgY2xpZW50X2lkOiBjbGllbnRJZCxcbiAgICAgICAgY2xpZW50X3NlY3JldDogY2xpZW50U2VjcmV0LFxuICAgICAgICByZWZyZXNoX3Rva2VuOiByZWZyZXNoVG9rZW4sXG4gICAgICAgIGdyYW50X3R5cGU6ICdyZWZyZXNoX3Rva2VuJ1xuICAgICAgfSlcbiAgICB9KTtcblxuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVG9rZW4gcmVmcmVzaCBmYWlsZWQ6ICR7cmVzcG9uc2Uuc3RhdHVzfWApO1xuICAgIH1cblxuICAgIGNvbnN0IHRva2VuRGF0YTogU3RyYXZhVG9rZW5SZXNwb25zZSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKSBhcyBTdHJhdmFUb2tlblJlc3BvbnNlO1xuICAgIHJldHVybiB0aGlzLnVwZGF0ZUludGVncmF0aW9uKGludGVncmF0aW9uLCB0b2tlbkRhdGEpO1xuICB9XG5cbiAgYXN5bmMgcmV2b2tlSW50ZWdyYXRpb24odXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuaW50ZWdyYXRpb25SZXBvc2l0b3J5KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludGVncmF0aW9uIHJlcG9zaXRvcnkgbm90IGF2YWlsYWJsZScpO1xuICAgIH1cblxuICAgIGNvbnN0IGludGVncmF0aW9uID0gYXdhaXQgdGhpcy5pbnRlZ3JhdGlvblJlcG9zaXRvcnkuZmluZEJ5VXNlcklkKHVzZXJJZCk7XG4gICAgaWYgKCFpbnRlZ3JhdGlvbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBTdHJhdmEgaW50ZWdyYXRpb24gZm91bmQnKTtcbiAgICB9XG5cbiAgICBpbnRlZ3JhdGlvbi5yZXZva2UoKTtcbiAgICBhd2FpdCB0aGlzLmludGVncmF0aW9uUmVwb3NpdG9yeS51cGRhdGUoaW50ZWdyYXRpb24pO1xuICB9XG5cbiAgYXN5bmMgZ2V0QWNjZXNzVG9rZW4odXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICghdGhpcy50b2tlbkVuY3J5cHRpb24pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignVG9rZW4gZW5jcnlwdGlvbiBzZXJ2aWNlIG5vdCBhdmFpbGFibGUnKTtcbiAgICB9XG5cbiAgICBjb25zdCBpbnRlZ3JhdGlvbiA9IGF3YWl0IHRoaXMuZ2V0SW50ZWdyYXRpb24odXNlcklkKTtcbiAgICBpZiAoIWludGVncmF0aW9uKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIGFjdGl2ZSBTdHJhdmEgaW50ZWdyYXRpb24gZm91bmQnKTtcbiAgICB9XG5cbiAgICAvLyBSZWZyZXNoIHRva2VuIGlmIG5lZWRlZFxuICAgIGNvbnN0IHJlZnJlc2hlZEludGVncmF0aW9uID0gYXdhaXQgdGhpcy5yZWZyZXNoVG9rZW5JZk5lZWRlZChpbnRlZ3JhdGlvbik7XG4gICAgXG4gICAgLy8gRGVjcnlwdCBhbmQgcmV0dXJuIGFjY2VzcyB0b2tlblxuICAgIHJldHVybiB0aGlzLnRva2VuRW5jcnlwdGlvbi5kZWNyeXB0KHJlZnJlc2hlZEludGVncmF0aW9uLmFjY2Vzc1Rva2VuUmVmKTtcbiAgfVxufSJdfQ==